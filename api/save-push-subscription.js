// api/save-push-subscription.js — Vercel Function
// Salva a inscrição de push (endpoint + chaves) do navegador do usuário no
// Firestore, pra depois o job de envio (api/send-daily-notifications.js)
// conseguir mandar notificações pra ele. Segue o mesmo padrão de auth do
// api/gemini.js: exige token do Firebase Auth do próprio usuário logado.
//
// Variáveis de ambiente necessárias (Vercel → Settings → Environment Variables):
//   FIREBASE_API_KEY, FIREBASE_PROJECT_ID → já configuradas pra api/gemini.js

async function verifyFirebaseToken(idToken) {
  const apiKey = process.env.FIREBASE_API_KEY;
  if (!apiKey) throw new Error('FIREBASE_API_KEY não configurada no servidor.');

  const resp = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken })
  });
  const data = await resp.json();
  const uid = data?.users?.[0]?.localId;
  if (!resp.ok || !uid) throw new Error('unauthorized');
  return uid;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    return res.status(503).json({ error: 'FIREBASE_PROJECT_ID não configurada no servidor.' });
  }

  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!idToken) return res.status(401).json({ error: 'É preciso estar logado para ativar notificações.' });

  let uid;
  try {
    uid = await verifyFirebaseToken(idToken);
  } catch {
    return res.status(401).json({ error: 'Sessão inválida ou expirada. Recarregue a página.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const subscription = body.subscription;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: 'Inscrição de push inválida.' });
    }

    const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/push_subscriptions/${uid}`;
    const putResp = await fetch(base, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({
        fields: {
          endpoint: { stringValue: subscription.endpoint },
          p256dh: { stringValue: subscription.keys.p256dh },
          auth: { stringValue: subscription.keys.auth },
          updatedAt: { stringValue: new Date().toISOString() }
        }
      })
    });

    if (!putResp.ok) {
      const errData = await putResp.json().catch(() => ({}));
      throw new Error(errData?.error?.message || `Firestore respondeu ${putResp.status}`);
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro ao salvar inscrição de push.' });
  }
};
