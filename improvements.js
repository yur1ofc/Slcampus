// growth-buttons.js — Injeta os botões "Compartilhar sequência" e "Convidar
// amigo" no cabeçalho do Mentor IA, sem precisar editar views.js. Segue o
// mesmo padrão de hook em loadView já usado em dashboard-prioritario.js.

(function () {
  'use strict';

  function injectStyles() {
    if (document.getElementById('growth-buttons-style')) return;
    const style = document.createElement('style');
    style.id = 'growth-buttons-style';
    style.textContent = `
      .growth-btn { display:inline-flex; align-items:center; gap:6px; }
    `;
    document.head.appendChild(style);
  }

  function injectButtons() {
    const actions = document.querySelector('.view-header .header-actions');
    if (!actions || document.getElementById('btn-share-streak')) return;

    const btnShare = document.createElement('button');
    btnShare.id = 'btn-share-streak';
    btnShare.className = 'btn-secondary growth-btn';
    btnShare.innerHTML = '<i class="fas fa-fire"></i> Compartilhar sequência';
    btnShare.addEventListener('click', () => window.SLC_shareStreak?.());

    const btnInvite = document.createElement('button');
    btnInvite.id = 'btn-invite-friend';
    btnInvite.className = 'btn-secondary growth-btn';
    btnInvite.innerHTML = '<i class="fas fa-user-plus"></i> Convidar amigo';
    btnInvite.addEventListener('click', () => window.SLC_inviteFriend?.());

    actions.appendChild(btnShare);
    actions.appendChild(btnInvite);
  }

  function patchApp() {
    const app = window.app;
    if (!app || app.__growthButtonsPatched) return;
    app.__growthButtonsPatched = true;

    const _orig = app.loadView?.bind(app);
    if (!_orig) return;

    window.app.loadView = function (view) {
      const result = _orig(view);
      if (view === 'mentor-ia') {
        setTimeout(injectButtons, 200);
      }
      return result;
    };
  }

  injectStyles();
  document.addEventListener('app-ready', () => setTimeout(patchApp, 500));
})();
