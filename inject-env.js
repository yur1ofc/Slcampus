// inject-env.js — Script de build que gera o env-config.js a partir das variáveis de ambiente do Vercel.
// Adicione no package.json: "build": "node inject-env.js && vercel --prod"
// Ou use como vercel.json → buildCommand.

const fs   = require('fs');
const path = require('path');

const keys = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID'
];

const missing = keys.filter(k => !process.env[k]);
if (missing.length) {
  console.error('[inject-env] ERRO: variáveis de ambiente faltando:', missing.join(', '));
  console.error('[inject-env] Configure no Vercel: Settings → Environment Variables');
  process.exit(1);
}

const envObj = keys.reduce((acc, k) => {
  acc[k] = process.env[k];
  return acc;
}, {});

const content = `// Gerado automaticamente pelo inject-env.js — NÃO EDITE\nwindow.__ENV = ${JSON.stringify(envObj, null, 2)};\n`;

fs.writeFileSync(path.join(__dirname, 'env-config.js'), content, 'utf8');
console.log('[inject-env] env-config.js gerado com sucesso.');
