---
name: slcampus-firestore-rules
description: Fluxo de auditoria e mudança das regras Firestore/Storage do SLCampus — aplica a skill firebase-security-rules-auditor, confere os invariantes do projeto e exige aprovação antes de qualquer deploy de regras.
---

# Regras Firebase do SLCampus

## Para AUDITAR (sem mudar nada)
1. Leia `firestore.rules` e `storage.rules` (o deploy é `firebase deploy --only
   firestore:rules` — **exige aprovação**, charter §6/§8).
2. Aplique o checklist red-team da skill `firebase-security-rules-auditor`
   (update bypass, fonte de autoridade, limites de recurso, tipos, hasOnly+ownership).
3. Confirme os invariantes do projeto:
   - catch-all `allow read, write: if false` no final de cada serviço;
   - campos server-only (`telegram`, `telegramInbox`, `sentReminders`,
     `sentTelegramReminders`, `telegramLinkCode`, `lastPushTestAt`) bloqueados
     para o cliente;
   - `user_presence`, `ai_usage`, `mentor_usage`, `gemini_*` = somente servidor;
   - admin nunca por campo do doc (só env vars, ver `api/_lib/admin-auth.js`).
4. Saída: JSON de achados (score 1–5 + findings) + recomendações priorizadas.

## Para MUDAR
1. Proponha o diff e **explique o impacto** (quem passa a poder/não poder).
2. **Aprove com o usuário** antes de aplicar.
3. Aplique com Firebase CLI e valide no app real (login, CRUD do dono,
   tentativa negativa com outro usuário se possível).
4. Se a validação falhar: reverta (`git checkout -- firestore.rules`) e reavalie.

## Armadilhas conhecidas
- `allows` sobrepostos são OR: um wildcard permissivo anula a regra vizinha.
- Regras não iteram itens de lista — limite de elementos só via tamanho da lista
  (o teto real é o limite de 1 MiB do documento).
- Comparação direta de map/list com `null` causa evaluation error: checar o tipo
  antes (padrão `changedMapField` já no arquivo).
