// Landing page: apresenta o SLCampus antes do login sem interferir no app autenticado.
(function () {
  'use strict';

  function el(id) { return document.getElementById(id); }

  function showLanding() {
    const landing = el('landing-screen');
    const login = el('login-screen');
    if (landing) landing.style.display = 'block';
    if (login) login.style.display = 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showLogin() {
    const landing = el('landing-screen');
    const login = el('login-screen');
    // Quem já entrou alguma vez vê "Bem-vindo de volta"; quem chegou agora vê
    // o convite para criar o espaço. Antes todo mundo via "Bem-vindo de volta",
    // inclusive quem tinha acabado de clicar em "Começar agora".
    let jaEntrou = false;
    try { jaEntrou = localStorage.getItem('slc_ja_entrou') === '1'; } catch (e) {}
    const headline = el('login-headline');
    const subline = el('login-subline');
    if (headline) headline.textContent = jaEntrou ? 'Bem-vindo de volta' : 'Crie seu espaço';
    if (subline) subline.textContent = jaEntrou
      ? 'Entre para acessar seu painel de estudos'
      : 'Entra com Google — sem senha nova, sem cartão';
    if (landing) landing.style.display = 'none';
    if (login) login.style.display = 'flex';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => el('login-google')?.focus(), 80);
  }

  // Quem clica em "Começar grátis" numa ferramenta já leu a explicação: pede
  // para abrir o login direto, sem repetir a landing inteira.
  function querLogin() {
    try {
      return new URLSearchParams(location.search).get('entrar') === '1' || location.hash === '#entrar';
    } catch (e) { return false; }
  }

  function bind() {
    ['landing-login', 'landing-login-top', 'landing-login-bottom'].forEach(id => {
      el(id)?.addEventListener('click', showLogin);
    });
    el('back-to-landing')?.addEventListener('click', showLanding);
    if (querLogin()) showLogin();
  }

  window.slcLanding = { showLanding, showLogin, querLogin };
  document.addEventListener('DOMContentLoaded', bind);
})();
