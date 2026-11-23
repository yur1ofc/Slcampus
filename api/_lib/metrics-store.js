// api/_lib/metrics-store.js
// Contador anônimo do SLCampus: coleta (collect) e leitura agregada (readMetrics).
//
// Vive em _lib porque o plano Hobby da Vercel limita o deploy a 12 funções
// serverless; as rotas públicas são servidas por admin-users.js via rewrite.
//
// Privacidade (o site promete isso em /cookies e /privacidade):
// - nenhum cookie, nenhum identificador de visitante, nenhum localStorage;
// - o IP é usado só em memória para limitar abuso e nunca é gravado;
// - só incrementos agregados por dia (visita, evento, página, origem, tela).
//   Não existe registro individual de acesso.

const { FieldValue } = require('firebase-admin/firestore');
const { getFirebaseAdmin } = require('./admin-auth');

// Lista fechada: qualquer outro nome é descartado, então o endpoint não serve
// como lixeira de escrita arbitrária no banco.
const EVENTS = new Set(['pageview', 'cta_start', 'signup_done', 'setup_done']);
const DEVICES = new Set(['mobile', 'tablet', 'desktop']);

const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 30;
const hits = new Map();

const DAY = 24 * 60 * 60 * 1000;

function clientKey(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || (req.socket && req.socket.remoteAddress) || 'desconhecido';
}

// Janela deslizante em memória. Cada instância da função tem a sua; serve para
// conter laço/abuso acidental, não como defesa contra ataque sério.
function limited(key) {
  const now = Date.now();
  const record = hits.get(key);
  if (!record || now - record.start > WINDOW_MS) {
    hits.set(key, { start: now, count: 1 });
    if (hits.size > 5000) hits.clear();
    return false;
  }
  record.count += 1;
  return record.count > MAX_PER_WINDOW;
}

// Chave de campo do Firestore: sem ponto (o ponto separa caminho de campo) e
// sem barra (o caminho é convertido em nome de campo).
function fieldKey(value, max) {
  return String(value || '')
    .toLowerCase()
    .replace(/[/.]/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, max);
}

function readBody(req) {
  const body = req.body;
  if (!body) return {};
  if (typeof body === 'string') {
    try { return JSON.parse(body); } catch (_) { return {}; }
  }
  return typeof body === 'object' ? body : {};
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

function topEntries(map, limit) {
  return Object.entries(map || {})
    .map(([name, count]) => ({ name, count: Number(count) || 0 }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// POST público: +1 nos contadores do dia. Sempre responde 204 (ou 405 em GET)
// para não dar pistas a quem tenta sondar o endpoint.
async function collect(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  if (limited(clientKey(req))) return res.status(204).end();

  const body = readBody(req);
  const event = String(body.e || '').trim();
  if (!EVENTS.has(event)) return res.status(204).end();

  const page = fieldKey(body.p, 60) || 'raiz';
  const source = fieldKey(body.r, 40) || 'direto';
  const device = DEVICES.has(body.w) ? body.w : 'desconhecido';

  try {
    const db = getFirebaseAdmin().firestore();
    const now = new Date();
    const bump = () => FieldValue.increment(1);

    // Só a visita conta como visita. Clique, cadastro e setup entram apenas em
    // `events`: se todos somassem em `views`, uma pessoa que clicasse em "criar
    // conta" viraria duas visitas e a taxa de conversão sairia pela metade.
    const payload = {
      date: dayKey(now),
      updatedAt: now,
      events: { [event]: bump() }
    };
    if (event === 'pageview') {
      payload.views = bump();
      payload.pages = { [page]: bump() };
      payload.sources = { [source]: bump() };
      payload.devices = { [device]: bump() };
    }

    await db.collection('analyticsDaily').doc(dayKey(now)).set(payload, { merge: true });
  } catch (err) {
    // Medição nunca pode atrapalhar a navegação: registra e devolve 204.
    console.error('[metrics] falha ao gravar:', err && err.message);
  }

  return res.status(204).end();
}

// Leitura para o painel privado: série diária + totais do período.
async function readMetrics(days) {
  const total = Math.min(Math.max(Math.trunc(Number(days) || 14), 1), 30);
  const db = getFirebaseAdmin().firestore();
  const today = Date.parse(dayKey(new Date()) + 'T00:00:00Z');
  const dates = [];
  for (let i = total - 1; i >= 0; i--) dates.push(dayKey(new Date(today - i * DAY)));

  const snaps = await db.getAll(...dates.map((date) => db.collection('analyticsDaily').doc(date)));

  const series = snaps.map((snap, index) => {
    const data = (snap.exists && snap.data()) || {};
    return {
      date: dates[index],
      views: Number(data.views) || 0,
      events: data.events || {},
      pages: data.pages || {},
      sources: data.sources || {},
      devices: data.devices || {}
    };
  });

  const totals = { views: 0, events: {}, pages: {}, sources: {}, devices: {} };
  for (const day of series) {
    totals.views += day.views;
    for (const bucket of ['events', 'pages', 'sources', 'devices']) {
      for (const [name, count] of Object.entries(day[bucket])) {
        totals[bucket][name] = (totals[bucket][name] || 0) + (Number(count) || 0);
      }
    }
  }

  return {
    days: series,
    totals: {
      views: totals.views,
      events: totals.events,
      pages: topEntries(totals.pages, 8),
      sources: topEntries(totals.sources, 8),
      devices: totals.devices
    }
  };
}

module.exports = { collect, readMetrics };
