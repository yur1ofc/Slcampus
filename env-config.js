// env-config.js
// Este arquivo é gerado automaticamente pelo inject-env.js no build do Vercel.
// Para desenvolvimento local: copie env-config.example.js, renomeie para env-config.js
// e preencha com suas credenciais Firebase.
// NUNCA commite este arquivo com credenciais reais — está no .gitignore.

// Fallback: se o Vercel não gerou este arquivo (env vars não configuradas),
// o firebase-config.js usa os valores diretos hardcoded abaixo como fallback.
if (typeof window.__ENV === 'undefined') {
  window.__ENV = {
    FIREBASE_API_KEY:             'AIzaSyDDnc3vmJTAJg8ZQwYw-W9DeT5HLmCUPDc',
    FIREBASE_AUTH_DOMAIN:         'study-life-control.firebaseapp.com',
    FIREBASE_PROJECT_ID:          'study-life-control',
    FIREBASE_STORAGE_BUCKET:      'study-life-control.appspot.com',
    FIREBASE_MESSAGING_SENDER_ID: '42112044749',
    FIREBASE_APP_ID:              '1:42112044749:web:52bde99cc356016832e384'
  };
}
