// api/_lib/appcheck.js
// Verificação opcional do App Check nas funções que gastam dinheiro (IA).
//
// App Check não é controle de acesso — é o que encarece abuso automatizado. Ele
// só passa a ser exigido quando APPCHECK_ENFORCE=true estiver no ambiente, para
// que a virada aconteça sem deploy e sem derrubar o app se o provider ainda não
// estiver ativo no Console.
//
// Uso:
//   const { checkAppCheck } = require('./_lib/appcheck');
//   const ac = await checkAppCheck(req);
//   if (!ac.ok) return res.status(401).json({ error: '...', code: 'APP_CHECK_REQUIRED' });
//
// Lê o header X-Firebase-AppCheck (o mesmo que o SDK do Firebase usa). O cliente
// envia esse header em window.getAppCheckToken() (firebase-config.js).
const { getAppCheck } = require('firebase-admin/app-check');
const { getApp } = require('firebase-admin/app');

function enforcementOn() {
  return String(process.env.APPCHECK_ENFORCE || '').toLowerCase() === 'true';
}

async function checkAppCheck(req) {
  if (!enforcementOn()) return { ok: true, skipped: 'APPCHECK_ENFORCE desligado' };

  const token = String(req.headers['x-firebase-appcheck'] || '').trim();
  if (!token) return { ok: false, reason: 'missing' };

  // O app do Admin SDK já foi inicializado pela verificação do ID token que roda
  // antes. Se por algum motivo não estiver, isso é erro de configuração — não
  // token inválido — e precisa aparecer como tal no log.
  let checker;
  try {
    checker = getAppCheck(getApp());
  } catch (err) {
    console.error('[appcheck] Admin SDK sem app inicializado:', err?.message || err);
    return { ok: false, reason: 'init' };
  }

  try {
    await checker.verifyToken(token);
    return { ok: true };
  } catch (err) {
    console.warn('[appcheck] token inválido:', err?.message || err);
    return { ok: false, reason: 'invalid' };
  }
}

module.exports = { checkAppCheck, enforcementOn };
