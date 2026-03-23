// firebase-config.js - inicialização do Firebase (corrigido para produção)

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

function isFirebaseSdkAvailable() {
  return typeof window.firebase !== 'undefined';
}

function getFirebaseApp() {
  if (!isFirebaseSdkAvailable()) {
    throw new Error('SDK do Firebase não foi carregado.');
  }

  if (Array.isArray(window.firebase.apps) && window.firebase.apps.length > 0) {
    return window.firebase.app();
  }

  return window.firebase.initializeApp(firebaseConfig);
}

(function initFirebase() {
  try {
    const app = getFirebaseApp();
    const auth = window.firebase.auth();
    const db = window.firebase.firestore();

    const googleProvider = new window.firebase.auth.GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });

    window.firebaseApp = app;
    window.auth = auth;
    window.db = db;
    window.googleProvider = googleProvider;
  } catch (error) {
    logFirebaseError('Falha ao inicializar Firebase', error);
    window.firebaseApp = null;
    window.auth = null;
    window.db = null;
    window.googleProvider = null;

    if (typeof window.showToast === 'function') {
      window.showToast('Erro ao iniciar serviços do app. Recarregue a página.', 'error');
    }
  }
})();
