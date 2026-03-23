// firebase-config.js - inicialização do Firebase (corrigido e fortalecido)

const firebaseConfig = {
  apiKey: "AIzaSyDDnc3vmJTAJg8ZQwYw-W9DeT5HLmCUPDc",
  authDomain: "study-life-control.firebaseapp.com",
  projectId: "study-life-control",
  storageBucket: "study-life-control.appspot.com",
  messagingSenderId: "42112044749",
  appId: "1:42112044749:web:52bde99cc356016832e384"
};

function logFirebaseError(context, error, extra = null) {
  console.error(`[firebase-config] ${context}:`, error, extra || '');
}

function logFirebaseWarn(context, extra = null) {
  console.warn(`[firebase-config] ${context}`, extra || '');
}

function isFirebaseSdkAvailable() {
  return typeof window.firebase !== 'undefined';
}

function isFirebaseAlreadyInitialized() {
  return isFirebaseSdkAvailable() &&
    Array.isArray(window.firebase.apps) &&
    window.firebase.apps.length > 0;
}

async function enableFirestorePersistence(dbInstance) {
  if (!dbInstance || typeof dbInstance.enablePersistence !== 'function') {
    return;
  }

  try {
    await dbInstance.enablePersistence({ synchronizeTabs: true });
  } catch (error) {
    const code = error?.code || '';

    if (code === 'failed-precondition') {
      logFirebaseWarn('Persistência offline não ativada porque existe mais de uma aba aberta com o app');
      return;
    }

    if (code === 'unimplemented') {
      logFirebaseWarn('Persistência offline não suportada neste navegador');
      return;
    }

    logFirebaseError('Erro ao ativar persistência offline do Firestore', error);
  }
}

(function initFirebase() {
  try {
    if (!isFirebaseSdkAvailable()) {
      throw new Error('SDK do Firebase não foi carregado.');
    }

    const app = isFirebaseAlreadyInitialized()
      ? window.firebase.app()
      : window.firebase.initializeApp(firebaseConfig);

    const auth = window.firebase.auth();
    const db = window.firebase.firestore();

    const googleProvider = new window.firebase.auth.GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });

    // Configurações opcionais para compatibilidade e estabilidade
    if (typeof db.settings === 'function') {
      try {
        db.settings({
          ignoreUndefinedProperties: true
        });
      } catch (error) {
        // Alguns ambientes/ordens de inicialização podem já ter travado settings
        logFirebaseWarn('Não foi possível aplicar db.settings; seguindo com configuração padrão', error);
      }
    }

    // Disponibilizar globalmente
    window.firebaseApp = app;
    window.auth = auth;
    window.db = db;
    window.googleProvider = googleProvider;

    // Ativa persistência offline sem bloquear o restante do app
    enableFirestorePersistence(db).catch((error) => {
      logFirebaseError('Falha inesperada ao configurar persistência offline', error);
    });
  } catch (error) {
    logFirebaseError('Falha ao inicializar Firebase', error);

    // Garante que o restante do app não quebre silenciosamente
    window.firebaseApp = null;
    window.auth = null;
    window.db = null;
    window.googleProvider = null;

    if (typeof window.showToast === 'function') {
      window.showToast('Erro ao iniciar serviços do app. Recarregue a página.', 'error');
    }
  }
})();
