// analytics.js
// Contador anônimo do SLCampus: visitas e passos do funil.
//
// O que ele NÃO faz (e é por isso que pode existir sob a política de cookies):
// - não grava cookie, nem localStorage, nem identificador de visitante;
// - não usa nenhum script de terceiro (Google, Meta, Hotjar, Clarity);
// - não manda IP: o servidor usa o IP só em memória para limitar abuso.
//
// O que ele faz: soma +1 em contadores diários (visita, clique no CTA,
// cadastro, setup concluído) e guarda a página e o site de origem, sempre
// agregados. Nada disso identifica uma pessoa.
//
// Respeita Do Not Track e Global Privacy Control: se a pessoa pediu para não
// ser rastreada, nada é enviado.

(function () {
  'use strict';

  var ENDPOINT = '/api/track';
  var SESSION_KEY = 'slc_medido';

  var dnt =
    navigator.doNotTrack === '1' ||
    window.doNotTrack === '1' ||
    navigator.globalPrivacyControl === true;

  if (dnt) {
    window.slcTrack = function () {};
    return;
  }

  function sessionRead() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}') || {}; } catch (e) { return {}; }
  }

  function sessionWrite(state) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(state)); } catch (e) {}
  }

  // Marca uma chave como já contada nesta aba. Devolve true só na primeira vez.
  function firstTime(key) {
    var state = sessionRead();
    if (state[key]) return false;
    state[key] = 1;
    sessionWrite(state);
    return true;
  }

  function pagePath() {
    var path = (location.pathname || '/').replace(/\/+$/, '');
    return path || '/';
  }

  function source() {
    var ref = document.referrer || '';
    if (!ref) return 'direto';
    try {
      var host = new URL(ref).hostname.replace(/^www\./, '');
      if (host === location.hostname.replace(/^www\./, '')) return 'interno';
      return host;
    } catch (e) {
      return 'desconhecido';
    }
  }

  function device() {
    var width = window.innerWidth || 0;
    if (width < 720) return 'mobile';
    if (width < 1100) return 'tablet';
    return 'desktop';
  }

  function send(event) {
    var payload = JSON.stringify({ e: event, p: pagePath(), r: source(), w: device() });
    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([payload], { type: 'application/json' });
        if (navigator.sendBeacon(ENDPOINT, blob)) return;
      }
    } catch (e) {}
    try {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
        credentials: 'omit'
      }).catch(function () {});
    } catch (e) {}
  }

  // Evento do funil. Cada nome conta uma vez por aba, então "3 cliques no CTA"
  // não inflaciona a conta: o que interessa é quantas pessoas avançaram.
  window.slcTrack = function (event) {
    if (!event || typeof event !== 'string') return;
    if (!firstTime('e:' + event)) return;
    send(event);
  };

  // Qualquer elemento com data-slc-track="nome" conta o evento ao ser clicado.
  document.addEventListener('click', function (ev) {
    var target = ev.target;
    if (!target || typeof target.closest !== 'function') return;
    var el = target.closest('[data-slc-track]');
    if (el) window.slcTrack(el.getAttribute('data-slc-track'));
  }, true);

  function pageview() {
    if (!firstTime('p:' + pagePath())) return;
    send('pageview');
  }

  if (document.readyState === 'complete') pageview();
  else window.addEventListener('load', pageview, { once: true });
})();
