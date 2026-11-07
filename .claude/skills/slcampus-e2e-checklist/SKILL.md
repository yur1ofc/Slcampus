---
name: slcampus-e2e-checklist
description: Checklist de regressão E2E do SLCampus no navegador — console, axe, tour, calculadora, sidebar, notificações, responsividade e integridade de dados. Use antes de qualquer deploy e após mudanças de UI/comportamento.
---

# Checklist E2E do SLCampus

Rode no navegador real (site publicado ou Preview). Marque tudo antes do deploy.

> **Preview vs produção**: em Preview o login está bloqueado
> (`auth/unauthorized-domain` — domínio não autorizado no Firebase). No Preview,
> rode os itens estáticos/PWA/axe/banner; os itens de login → dashboard rodam
> obrigatoriamente na produção (pós-aprovação do deploy). Acesso ao Preview
> protegido: ver `.claude/skills/slcampus-deploy/SKILL.md`.

## Básico
- [ ] Console do navegador **sem erros** (filtros: apenas warnings aceitos).
- [ ] `axe` (extensão ou injeção) com **0 violações** em: landing, dashboard,
      ferramentas, calculadora.
- [ ] Nenhuma requisição 404/500 na aba Network.

## Fluxos
- [ ] Login → dashboard carrega com dados do usuário.
- [ ] **Tour**: executar do zero (limpar `slc_tour_*` se necessário) — 10/10 passos,
      sem travar em telas estreitas, sem apontar para `body`.
- [ ] **Calculadora de média**: 4 casos (com/sem peso, arredondamento, caso limite).
- [ ] **Sidebar**: 20 itens, hambúrguer abre/fecha, Ctrl+K (busca) funciona.
- [ ] **Sino de notificações**: abre como região nomeada, `aria-expanded` verdadeiro.
- [ ] **Banner de cookies**: aparece, aceita e persiste (recarregar confirma).
- [ ] 1 aba por dashboard (sem duplicação de listener/aba).

## Acessibilidade & layout
- [ ] axe 0; foco visível; navegação por teclado nos modais.
- [ ] Responsividade em 360 / 390 / 414 px e 1024 / 1440 px — sem overflow
      horizontal, sem botão coberto pelo banner.
- [ ] Rodapé da landing acima do banner de cookies.

## PWA
- [ ] Service worker atualiza (bump feito) — Application > SW version bate com
      `CACHE_VERSION`.
- [ ] Offline: app abre com cache (teste com DevTools offline após 1ª visita).

## Dados
- [ ] Dados do usuário de teste íntegros (notas, tarefas, sessões) após a mudança.
- [ ] Nenhuma escrita inesperada no Firestore (aba Network: só coleções esperadas).
