// env-config.js — configuração de ambiente
if (typeof window.__ENV === 'undefined') {
  window.__ENV = {
    FIREBASE_API_KEY:             '',
    FIREBASE_AUTH_DOMAIN:         '',
    FIREBASE_PROJECT_ID:          '',
    FIREBASE_STORAGE_BUCKET:      '',
    FIREBASE_MESSAGING_SENDER_ID: '',
    FIREBASE_APP_ID:              '',
    GEMINI_API_KEY:               ''
  };
}
