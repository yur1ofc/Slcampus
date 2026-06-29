# Segredos e variáveis de ambiente — NUNCA commitar
.env
.env.local
.env.production
.env.*.local
*.pem
*.key
serviceAccount*.json
service-account*.json
*-firebase-adminsdk*.json

# Dependências
node_modules/
.pnp
.pnp.js

# Build
dist/
build/
.next/
out/

# Cache e logs
.cache/
*.log
npm-debug.log*
yarn-debug.log*

# IDE
.vscode/
.idea/
*.swp
*.swo
.DS_Store
Thumbs.db

# Vercel
.vercel/

# env-config.js foi removido do gitignore — chaves do Firebase são públicas por design
# Chaves secretas (Gemini, Anthropic) ficam nas variáveis de ambiente do Vercel
