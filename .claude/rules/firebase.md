# Firebase — limites e invariantes

## Permitido sem pedir aprovação
- Leituras e consultas não destrutivas (regras, coleções, índices, configurações).
- Testes que não alteram dados de outros usuários.

## Exige aprovação explícita
- Excluir coleções/documentos, migrações destrutivas, mudar regras/permissões
  em produção, alterar Auth/Storage, tocar em usuários reais.

## Invariantes de código
- Admin SDK (`firebase-admin`) só em `api/**` (server). O navegador nunca o importa.
- Campos gravados somente pelo servidor (defendidos em `firestore.rules`):
  `telegram`, `telegramInbox`, `sentReminders`, `sentTelegramReminders`,
  `telegramLinkCode`, `lastPushTestAt`. O cliente não pode criá-los nem alterá-los —
  não "contornar" essa regra escrevendo por outro caminho.
- Autorização admin da API: env vars (`SLC_ADMIN_EMAILS` / `SLC_ADMIN_UIDS`) +
  `email_verified === true` (`api/_lib/admin-auth.js`). Nunca por campo gravável
  no doc do usuário.
- `env-config.js` é gerado no build pelo `inject-env.js` — não editar, não commitar.
- Segredos só em variáveis de ambiente da Vercel; nunca em arquivo versionado.
- Regras Firebase: revisar com a skill `firebase-security-rules-auditor` antes de
  qualquer mudança (checklist red-team: update bypass, autoridade, tipos, limites).
