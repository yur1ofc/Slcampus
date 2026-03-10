const firebaseConfig = {
  apiKey: "AIzaSyDDnc3vmJTAJg8ZQwYw-W9DeT5HLmCUPDc",
  authDomain: "study-life-control.firebaseapp.com",
  projectId: "study-life-control",
  storageBucket: "study-life-control.appspot.com",
  messagingSenderId: "42112044749",
  appId: "1:42112044749:web:52bde99cc356016832e384"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

window.auth = auth;
window.db = db;
window.googleProvider = googleProvider;