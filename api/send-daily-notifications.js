// api/send-daily-notifications.js — Vercel Cron Function
// Roda uma vez por dia (ver "crons" em vercel.json), olha os dados de cada
// usuário inscrito em push_subscriptions e manda no máximo UMA notificação
// com o insight mais relevante do dia (prova perto ou sequência quebrando).
// Reaproveita as mesmas regras do Mentor IA (simplificadas), sem chamar
// nenhuma IA externa — é só leitura de dados + heurística.
//
// Variáveis de ambiente necessárias no Vercel:
//   FIREBASE_SERVICE_ACCOUNT_KEY → JSON da service account (Firebase Console
//     → Configurações do projeto → Contas de serviço → Gerar nova chave privada),
//     colado como uma linha só (string JSON) no valor da env var.
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY → geradas com `npx web-push generate-vapid-keys`
//   VAPID_SUBJECT → "mailto:seuemail@exemplo.com"
//   CRON_SECRET → string aleatória sua, pra ninguém além do Vercel Cron chamar essa rota

const webpush = require('web-push');
const admin = require('firebase-admin');

function getAdminApp() {
  if (admin.apps.length) return admin.app();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY não configurada no servidor.');
  const serviceAccount = JSON.parse(raw);
  return admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

function diasAte(dataStr) {
  if (!dataStr) return null;
  const alvo = new Date(dataStr);
  if (Number.isNaN(alvo.getTime())) return null;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  alvo.setHours(0, 0, 0, 0);
  return Math.round((alvo - hoje) / 86400000);
}

function estudouHoje(sessions) {
  const hojeStr = new Date().toISOString().slice(0, 10);
  return (sessions || []).some(s => s?.concluida && String(s?.data || '').slice(0, 10) === hojeStr);
}

function estudouOntem(sessions) {
  const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  return (sessions || []).some(s => s?.concluida && String(s?.data || '').slice(0, 10) === ontem);
}

// Escolhe o melhor insight do dia pra esse usuário, ou null se não há nada relevante.
function montarNotificacao(userData) {
  const exams = userData?.exams || [];
  const proximaProva = exams
    .map(e => ({ ...e, _dias: diasAte(e.data || e.date) }))
    .filter(e => e._dias !== null && e._dias >= 0 && e._dias <= 2)
    .sort((a, b) => a._dias - b._dias)[0];

  if (proximaProva) {
    const quando = proximaProva._dias === 0 ? 'hoje' : proximaProva._dias === 1 ? 'amanhã' : `em ${proximaProva._dias} dias`;
    return {
      title: '📚 Prova chegando',
      body: `${proximaProva.materia || proximaProva.nome || 'Sua prova'} é ${quando}. Bora revisar?`,
      tag: 'exam-reminder'
    };
  }

  const sessions = userData?.sessions || [];
  if (estudouOntem(sessions) && !estudouHoje(sessions)) {
    const hora = new Date().getHours();
    if (hora >= 19) {
      return {
        title: '🔥 Sua sequência está em risco',
        body: 'Você estudou ontem — uma sessão curta hoje já mantém sua sequência viva.',
        tag: 'streak-risk'
      };
    }
  }

  return null;
}

module.exports = async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization || '';
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const vapidPublic = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:contato@example.com';
  if (!vapidPublic || !vapidPrivate) {
    return res.status(503).json({ error: 'VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY não configuradas.' });
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

  let db;
  try {
    getAdminApp();
    db = admin.firestore();
  } catch (err) {
    return res.status(503).json({ error: err.message });
  }

  const results = { enviadas: 0, puladas: 0, removidas: 0, erros: 0 };

  try {
    const subsSnap = await db.collection('push_subscriptions').get();

    await Promise.all(subsSnap.docs.map(async (subDoc) => {
      const uid = subDoc.id;
      const sub = subDoc.data();
      const subscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth }
      };

      try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) { results.puladas++; return; }

        const notif = montarNotificacao(userDoc.data());
        if (!notif) { results.puladas++; return; }

        await webpush.sendNotification(subscription, JSON.stringify({ ...notif, url: './' }));
        results.enviadas++;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await db.collection('push_subscriptions').doc(uid).delete().catch(() => {});
          results.removidas++;
        } else {
          console.error(`[send-daily-notifications] erro pro uid ${uid}:`, err.message);
          results.erros++;
        }
      }
    }));

    return res.status(200).json(results);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro ao processar notificações diárias.' });
  }
};
