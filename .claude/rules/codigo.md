# Código — convenções do SLCampus

- Vanilla JS + CSS, sem framework e sem bundler; arquivos servidos direto (Vercel estático).
- `index.html` é o grafo de dependências: **todo `<script src>` local precisa estar em
  `STATIC_ASSETS` do `service-worker.js`** — caso contrário o app falha no primeiro
  acesso offline (regra verificável: comparar as duas listas).
- Sem modules ES: tudo `defer` + ordem de declaração no `index.html` importa.
- Textos do produto em pt-BR.
- Compatibilidade: feature-detect antes de APIs novas (o app roda como PWA antigo/Android).
- Depois de mudar comportamento: validar no navegador — não confiar só na leitura do código.
- Commits pequenos e descritivos; não sobrescrever alterações do usuário.
- CSP do projeto fica em `vercel.json`; `unsafe-inline` é usado por scripts inline e
  handlers `onload` — remover exige hash por bloco e teste completo da UI.
