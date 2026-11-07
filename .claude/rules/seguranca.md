# Segurança

- Nunca commitar segredos: tokens, chaves de serviço, credenciais, cookies.
- A chave web do Firebase (`AIza...` em `env-config.js`) é **pública por design** —
  não é vazamento. Segredos reais só em env vars da Vercel:
  `FIREBASE_SERVICE_ACCOUNT_KEY` (base64), `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`,
  `VAPID_PRIVATE_KEY` etc.
- `/vercel.json`, `/inject-env.js`, `/shared/*.js` são servidos publicamente —
  nunca colocar credenciais neles.
- CSP fica nos headers do `vercel.json`. Antes de mudar, testar a UI inteira
  (scripts inline e handlers `onload` dependem de `unsafe-inline`).
- Superfícies públicas conhecidas e aceitas: `env-config.js` (config web Firebase),
  `firebase-config.js` (init do SDK), `shared/academic-context.js` (código UMD).
- Antes de publicar: varrer o diff por padrões de segredo
  (`AIza`, `BEGIN PRIVATE KEY`, `sk-`, `:AA[0-9A-Za-z]`, `AKIA`, `ghp_`).
- Endpoints `api/**`: nunca confiar em dado enviado pelo navegador para decisão
  de autorização; sempre verificar o ID token decodificado no servidor.
