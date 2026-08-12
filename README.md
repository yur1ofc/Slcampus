// push-notifications.js — Ativação de notificações push (opt-in do usuário)
// Reaproveita o service worker que já existe (service-worker.js) e o mesmo
// padrão de autenticação do api/gemini.js (token do Firebase Auth).
//
// Variável necessária no front: window.__ENV.VAPID_PUBLIC_KEY
// (a mesma chave pública gerada com `npx web-push generate-vapid-keys`,
// configurada também no Vercel como VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY).

(function () {
  'use strict';

  const STORAGE_DISMISSED = 'slc_push_banner_dismissed';

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
  }

  async function getIdToken() {
    const user = window.auth?.currentUser;
    if (!user) return null;
    return user.getIdToken();
  }

  async function subscribeToPush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      window.showToast?.('Seu navegador não suporta notificações push.', 'error');
      return false;
    }

    const vapidPublicKey = window.__ENV?.VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      console.warn('[push] VAPID_PUBLIC_KEY não configurada em env-config.js/window.__ENV.');
      window.showToast?.('Notificações ainda não configuradas neste ambiente.', 'error');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      window.showToast?.('Você pode ativar notificações depois nas configurações do navegador.', 'info');
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
    }

    const idToken = await getIdToken();
    if (!idToken) {
      console.warn('[push] Usuário não autenticado, não foi possível salvar a inscrição.');
      return false;
    }

    const resp = await fetch('/api/save-push-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify({ subscription })
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      window.showToast?.(err.error || 'Não foi possível ativar as notificações.', 'error');
      return false;
    }

    window.showToast?.('Notificações ativadas! 🔔 Vou te avisar sobre provas e sequência de estudo.');
    return true;
  }

  function shouldOfferBanner() {
    if (!('Notification' in window)) return false;
    if (Notification.permission !== 'default') return false;
    if (localStorage.getItem(STORAGE_DISMISSED)) return false;
    return true;
  }

  function injectBanner() {
    if (document.getElementById('push-opt-in-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'push-opt-in-banner';
    banner.style.cssText = `
      position: fixed; left: 16px; right: 16px; bottom: 16px; z-index: 9999;
      max-width: 420px; margin: 0 auto; padding: 14px 16px; border-radius: 14px;
      background: var(--surface-1, #111827); color: var(--text-primary, #f5f5f5);
      box-shadow: 0 8px 24px rgba(0,0,0,.35); display: flex; gap: 12px; align-items: center;
      font-size: 14px; border: 1px solid rgba(255,255,255,.08);
    `;
    banner.innerHTML = `
      <div style="font-size:22px;line-height:1">🔔</div>
      <div style="flex:1">
        <div style="font-weight:600;margin-bottom:2px">Ativar lembretes?</div>
        <div style="opacity:.8">Aviso quando uma prova estiver perto ou sua sequência de estudo for quebrar.</div>
      </div>
      <button id="push-opt-in-yes" style="background:#6366f1;color:#fff;border:none;border-radius:8px;padding:8px 12px;font-weight:600;cursor:pointer">Ativar</button>
      <button id="push-opt-in-no" style="background:transparent;color:inherit;opacity:.6;border:none;cursor:pointer;font-size:18px;padding:4px">✕</button>
    `;
    document.body.appendChild(banner);

    document.getElementById('push-opt-in-yes').addEventListener('click', async () => {
      banner.remove();
      await subscribeToPush();
    });
    document.getElementById('push-opt-in-no').addEventListener('click', () => {
      localStorage.setItem(STORAGE_DISMISSED, '1');
      banner.remove();
    });
  }

  // Oferece o banner um pouco depois do app carregar, sem interromper o onboarding.
  document.addEventListener('app-ready', () => {
    if (!shouldOfferBanner()) return;
    setTimeout(injectBanner, 4000);
  });

  window.SLC_subscribeToPush = subscribeToPush;
})();
