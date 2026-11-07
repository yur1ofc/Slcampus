# Ferramentas de Desenvolvimento — SLCampus

Registro das ferramentas, skills, agentes e integrações usadas no desenvolvimento
do SLCampus (charter §9). Atualizado conforme novas ferramentas entram.

## 1. Skills instaladas (externas)

| Skill | Origem | Licença | Custo | Instalação | Limites |
|---|---|---|---|---|---|
| `firebase-security-rules-auditor` | github.com/firebase/agent-skills (org oficial do Firebase/Google) — 20,4 mil instalações no skills.sh | Apache-2.0 | Grátis | `cmd /c npx -y skills add firebase/agent-skills@firebase-security-rules-auditor -g -y` → `~\.agents\skills\` | Auditoria estática por checklist (red-team). Não testa regras no Console do Firebase. Escaneada como "Safe, 0 alerts" no install. |

### Skills avaliadas e NÃO instaladas (evitar duplicatas)
- `firebase/agent-skills@firebase-firestore-standard` (37 mil), `@firestore-rules-creation`
  (31 mil), `@firebase-firestore-basics` — cobertos pela skill acima + `.claude/skills/slcampus-firestore-rules`.
- Skills PWA/service worker (busca retornou máximo de 519 instalações, repos
  desconhecidos) — sem qualidade comprovada; conhecimento tratado internamente.
- Repo `firebase/agent-skills` tem 14 skills (Apache-2.0); as demais
  (auth-basics, analytics, crashlytics, remote-config, data-connect, xcode…) não
  são relevantes para o SLCampus hoje.

## 2. CLI do ecossistema de skills
- **`npx skills`** (skills.sh) — MIT — github.com/vercel-labs/skills v1.7.6.
  Comandos: `find <query>`, `add <owner/repo@skill>`. Grátis, sem cadastro.
  Armadilha: no PowerShell só via `cmd /c`.

## 3. Skills próprias do projeto (`.claude/skills/`)
| Skill | Finalidade |
|---|---|
| `slcampus-deploy` | Fluxo completo de deploy: bump do CACHE_VERSION → Preview → validação → **aprovação** → produção. |
| `slcampus-e2e-checklist` | Checklist de regressão E2E (console, axe, tour, calculadora, sidebar, sino, responsividade, PWA, dados). |
| `slcampus-firestore-rules` | Auditoria/mudança de regras Firebase com o checklist red-team + invariantes do projeto. |

## 4. Agentes (`.claude/agents/`)
`slcampus-architect`, `firebase-specialist`, `frontend-specialist`, `ai-engineer`,
`security-auditor` (somente leitura), `performance-engineer`, `test-engineer`,
`automation-engineer`, `code-reviewer` (somente leitura).
Responsabilidades detalhadas em cada arquivo. Dois agentes não modificam os
mesmos arquivos ao mesmo tempo sem coordenação do agente principal.

## 5. Regras do projeto (`.claude/rules/`)
`deploy.md` (fluxo e gates), `firebase.md` (limites e invariantes),
`seguranca.md` (segredos, CSP, superfície pública), `codigo.md` (convenções).
`​.claude/settings.json` permite leitura livre + comandos de diagnóstico
(git/vercel/npm audit) e **nega** `git push --force`, leitura de `.env*`,
`*.pem` e service accounts.

## 6. MCPs disponíveis no ambiente
| MCP | Uso no SLCampus |
|---|---|
| `context7` | Documentação atualizada (Firebase, Vercel, web APIs). |
| `playwright` | Automação de navegador para E2E (25 tools). |
| `browser` | Navegador desktop real (screenshots, console, avaliação da UI publicada). |
| `opencode` | Sessões/worktrees do próprio agente. |
| `21st` | Registro de componentes — não usado no SLCampus. |

Investigado e dispensado (charter §2.3): MCP GitHub (git CLI atende), MCP
Firebase (Firebase CLI + arquivo de regras no repo atendem; mudanças de regras
exigem aprovação), MCP Vercel (CLI oficial `vercel` 65.10.0 já logado).

## 7. Ferramentas CLI
- **Vercel CLI 65.10.0** (logado na conta do projeto) — deploys, logs, previews.
- **Git** + GitHub (`yur1ofc/study-life-control…`) — branch atual
  `auditoria-mobile-2026-11-04`.
- **Node/npm** — build (`node inject-env.js`), `npm audit`.
- **Python `http.server 4173`** — teste local do site estático.
- **PowerShell**: sem `&&` (usar `;`/`if ($?)`); npm/npx só via `cmd /c`.

## 8. Limites conhecidos
- **Plano free do OpenCode**: subagentes em background falham com
  "Free usage limit reached" → levantamentos extensos feitos inline.
- `npm audit --omit=dev`: **8 vulnerabilidades moderadas** na árvore do
  `firebase-admin@^12.7.0` (uuid/gaxios/google-gax); correção aponta para
  `firebase-admin@14.5.0` (breaking) — upgrade pendente de validação das
  functions `api/**` antes de aplicar.
- Segredos ficam só em env vars da Vercel (nomes, sem valores):
  `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`,
  `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`,
  `FIREBASE_APPCHECK_RECAPTCHA_SITE_KEY` (opcional), `VAPID_PUBLIC_KEY`,
  `VAPID_PRIVATE_KEY`, `GEMINI_API_KEY`, `SLC_ADMIN_EMAILS`/`SLC_ADMIN_UIDS`,
  `TELEGRAM_BOT_TOKEN`, `FIREBASE_SERVICE_ACCOUNT_KEY` (base64).
