// Configuração do Firebase
// COLE SUAS CREDENCIAIS AQUI
const firebaseConfig = {
    apiKey: "AIzaSyAQUI_VOCE_COLA_SUA_API_KEY",
    authDomain: "study-life-control.firebaseapp.com",
    projectId: "study-life-control",
    storageBucket: "study-life-control.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abc123def456"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Serviços
const auth = firebase.auth();
const db = firebase.firestore();

// Configuração do provedor Google
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
    prompt: 'select_account'
});

// Exportar para uso em outros arquivos
window.firebaseApp = firebase;
window.auth = auth;
window.db = db;
window.googleProvider = googleProvider;