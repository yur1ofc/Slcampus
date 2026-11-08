// api/_lib/admin-compat.js
// Camada de compatibilidade: API namespace do firebase-admin v12 → API modular do v14.
//
// O v14 removeu do root `apps`, `app()`, `credential`, `firestore()`, `auth()` e `storage()`,
// e as instâncias de App perderam os métodos `.auth()/.firestore()/.storage()` que os handlers
// usam (ex.: `init().auth().verifyIdToken(...)`). Este módulo restaura exatamente a superfície
// usada pelo código em api/ (grep `admin\.`), permitindo o upgrade sem tocar nos call sites.
// Código NOVO deve importar direto de firebase-admin/app|firestore|auth|storage.
const appMod = require('firebase-admin/app');
const fsMod = require('firebase-admin/firestore');
const authMod = require('firebase-admin/auth');
const stMod = require('firebase-admin/storage');

// Restaura na instância App os métodos de serviço removidos no v14 (comportamento do v12).
function withServices(app) {
  if (app && typeof app === 'object' && !app.__slcSvc) {
    try {
      Object.defineProperties(app, {
        auth: { value: () => authMod.getAuth(app), configurable: true },
        firestore: { value: () => fsMod.getFirestore(app), configurable: true },
        storage: { value: () => stMod.getStorage(app), configurable: true },
        __slcSvc: { value: true }
      });
    } catch (_) {
      // Instância do SDK não aceita extensão: devolve como está (falha visível no call site).
    }
  }
  return app;
}

function initializeApp(...args) {
  return withServices(appMod.initializeApp(...args));
}

function getApp(...args) {
  return withServices(appMod.getApp(...args));
}

function firestore(...args) {
  return fsMod.getFirestore(...args);
}
firestore.FieldValue = fsMod.FieldValue;
firestore.Timestamp = fsMod.Timestamp;

module.exports = {
  get apps() { return appMod.getApps(); },
  app: getApp,
  initializeApp,
  credential: { cert: appMod.cert },
  firestore,
  auth: authMod.getAuth,
  storage: stMod.getStorage
};
