// api/mentor.js — Vercel Function (proxy seguro para o Mentor IA / Claude)
// A chave ANTHROPIC_API_KEY fica nas variáveis de ambiente do Vercel, nunca no browser.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY não configurada. Mentor IA usando modo local.' });
  }

  try {
    const mentorRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(req.body)
    });

    const data = await mentorRes.json();
    if (!mentorRes.ok) return res.status(mentorRes.status).json({ error: data?.error?.message || 'Erro no Claude' });

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro interno' });
  }
};
