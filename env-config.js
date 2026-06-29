// env-config.js — configuração de ambiente
// Este arquivo pode ser sobrescrito pelo inject-env.js no build do Vercel
// se as variáveis de ambiente estiverem configuradas no painel do Vercel.
// Sem buildCommand configurado, este fallback garante que o site funcione.

if (typeof window.__ENV === 'undefined') {
  window.__ENV = {
    FIREBASE_API_KEY:             'AIzaSyCbXt4z-vncncAoZjNXGMYBrvxRFHyUbDo',
    FIREBASE_AUTH_DOMAIN:         'study-life-control.firebaseapp.com',
    FIREBASE_PROJECT_ID:          'study-life-control',
    FIREBASE_STORAGE_BUCKET:      'study-life-control.appspot.com',
    FIREBASE_MESSAGING_SENDER_ID: '42112044749',
    FIREBASE_APP_ID:              '1:42112044749:web:52bde99cc356016832e384',
    // Chave do Google Gemini para importação de grade por IA (GRÁTIS — 1500 usos/dia)
    // Crie em: https://aistudio.google.com/apikey (só precisa de conta Google, sem cartão)
    // No Vercel: Settings → Environment Variables → GEMINI_API_KEY
    GEMINI_API_KEY:               ''
  };
}
