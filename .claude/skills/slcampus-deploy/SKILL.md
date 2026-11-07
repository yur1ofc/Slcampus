---
name: slcampus-deploy
description: Fluxo de deploy do SLCampus — bump do CACHE_VERSION, Preview Deployment, validação no navegador e aprovação obrigatória para produção. Use sempre que for publicar qualquer mudança no site.
---

# Deploy do SLCampus

## Passos (na ordem)

1. **Estado**: `git status` limpo, branch de trabalho, últimos commits revisados.
2. **Bump obrigatório**: se a mudança toca JS/HTML/CSS, atualize `CACHE_VERSION`
   em `service-worker.js` (formato `slc-v<N>-<slug>`). Sem o bump, o cache-first
   serve os arquivos antigos para sempre.
3. **Commit** com mensagem descritiva.
4. **Preview**: `vercel deploy` (sem `--prod`) — anote a URL de Preview.
5. **Validação no navegador** usando `.claude/skills/slcampus-e2e-checklist/SKILL.md`.
6. **Aprovação**: apresente o que mudou, o resultado da validação e **peça aprovação
   explícita** para produção (charter §7/§8 — nunca pular este passo).
7. **Produção** (só após aprovação): `vercel deploy --prod` → confirme com
   `vercel ls` (status Ready) → smoke final na URL de produção.

## Acessar o Preview (protegido por SSO)
Os previews têm Deployment Protection ativo — direto no navegador caem no login
do Vercel. Para validar:
1. Pegue o segredo sem persistir em arquivo: `cmd /c vercel project protection
   slcampus --json` → campo `protectionBypass` (chave do objeto).
2. Navegue **uma vez** para `<preview-url>/?x-vercel-protection-bypass=<segredo>&x-vercel-set-bypass-cookie=true`.
   O Vercel emite o cookie via `Set-Cookie` e todas as cargas seguintes (CSS, JS,
   API) funcionam normalmente. Cookie manual no DOM **não** funciona (nome interno
   do Vercel; `domain=.vercel.app` é public suffix).
3. **Limitação**: o domínio do preview não está nas authorized domains do Firebase
   Auth → login falha com `auth/unauthorized-domain`. Itens que dependem de login
   (dashboard, tour, calculadora) só rodam no smoke de produção pós-deploy.

## Regras do ambiente
- PowerShell: sem `;`? Não — use `;` e `if ($?)` no lugar de `&&`.
- npm/npx sempre via `cmd /c` (PowerShell bloqueia).
- Cada deploy de produção gera um Preview irmão automaticamente (é esperado).
- Não altere configurações da Vercel que possam gerar cobrança.

## Se algo falhar
- Build com erro: `vercel logs <url-or-id>`.
- Comportamento errado: corrija, bump de novo, novo Preview — nunca corrija
  direto em produção.
