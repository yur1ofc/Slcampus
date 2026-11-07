# Deploy do SLCampus

Regra de ouro: **produção só com aprovação explícita do usuário** (charter §7/§8).
Preview Deployments podem ser preparados e validados sem pedir.

## Fluxo
1. Branch de trabalho (`melhorias-*` ou `auditoria-*`), commits pequenos.
2. Toda mudança em JS/HTML/CSS exige bump de `CACHE_VERSION` em `service-worker.js`
   (ex.: `slc-v96-nome-da-mudança`) — sem o bump, o cache-first serve os arquivos
   antigos para sempre (o cache estático pré-cacheado nunca se atualiza sozinho).
3. `vercel deploy` (sem `--prod`) → URL de Preview → validação no navegador
   (checklist em `.claude/skills/slcampus-e2e-checklist/SKILL.md`).
4. Apresentar o resultado e **pedir aprovação**.
5. `vercel deploy --prod` → conferir com `vercel ls` e testar a URL de produção.

## Armadilhas do ambiente
- PowerShell: `&&` não existe; usar `;` e `if ($?)`. npm/npx sempre via `cmd /c`.
- Cada `vercel deploy --prod` gera também um Preview automático (irmão do deploy).
- Servidor local de teste: `python -m http.server 4173 --bind 127.0.0.1` (na raiz do repo).

## Gates mínimos de validação
- Console do navegador sem erros novos.
- axe sem regressões nas landings críticas.
- Smoke: login → dashboard, tour, calculadora, sidebar, sino de notificações.
