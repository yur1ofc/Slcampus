// env-config.example.js
// RENOMEIE para env-config.js para desenvolvimento local.
// NUNCA commite o env-config.js real — ele já está no .gitignore.
// No Vercel, configure as mesmas variáveis em: Settings → Environment Variables

window.__ENV = {
  FIREBASE_API_KEY:             'AIzaSy...',           // Cole sua API Key aqui
  FIREBASE_AUTH_DOMAIN:         'seu-projeto.firebaseapp.com',
  FIREBASE_PROJECT_ID:          'seu-projeto',
  FIREBASE_STORAGE_BUCKET:      'seu-projeto.appspot.com',
  FIREBASE_MESSAGING_SENDER_ID: '000000000000',
  FIREBASE_APP_ID:              '1:000000000000:web:xxxx',

  // Para importação de grade por IA (GRÁTIS — 1500 usos/dia, sem cartão de crédito)
  // Crie em: https://aistudio.google.com/apikey (só precisa de conta Google)
  // No Vercel: Settings → Environment Variables → GEMINI_API_KEY
  GEMINI_API_KEY:            'AIzaSy...'
};
