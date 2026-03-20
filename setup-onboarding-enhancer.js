(function () {
  'use strict';

  var STYLE_ID = 'setup-onboarding-enhancer-safe-v3';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    var style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #setup-screen.setup-container,
      #setup-screen {
        min-height: 100vh !important;
        padding: 24px 16px 40px !important;
        background:
          radial-gradient(circle at top left, rgba(59,130,246,.18), transparent 30%),
          radial-gradient(circle at top right, rgba(168,85,247,.14), transparent 24%),
          linear-gradient(180deg, #071226 0%, #0b1730 100%) !important;
        overflow-y: auto !important;
      }

      #setup-screen .setup-card {
        width: min(1180px, 100%) !important;
        margin: 0 auto !important;
        background: transparent !important;
        border: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
      }

      #setup-screen .setup-header {
        display: none !important;
      }

      #setup-form.setup-form,
      #setup-form {
        width: min(1180px, 100%) !important;
        margin: 0 auto !important;
        padding: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
        display: block !important;
      }

      .setup-onboarding-hero {
        margin: 0 0 18px !important;
        padding: 28px 30px !important;
        border-radius: 28px !important;
        background: linear-gradient(135deg, #0f172a, #1d4ed8 58%, #2563eb) !important;
        color: #fff !important;
        box-shadow: 0 28px 70px rgba(2,8,23,.32) !important;
      }

      .setup-onboarding-chip {
        display: inline-flex !important;
        align-items: center !important;
        gap: 8px !important;
        margin-bottom: 12px !important;
        padding: 8px 12px !important;
        border-radius: 999px !important;
        background: rgba(255,255,255,.14) !important;
        color: #dbeafe !important;
        font-size: 12px !important;
        font-weight: 800 !important;
        letter-spacing: .08em !important;
        text-transform: uppercase !important;
      }

      .setup-onboarding-hero h2 {
        margin: 0 0 10px !important;
        color: #fff !important;
        font-size: clamp(1.8rem, 2.5vw, 2.5rem) !important;
        line-height: 1.08 !important;
      }

      .setup-onboarding-hero p {
        margin: 0 !important;
        max-width: 760px !important;
        color: rgba(255,255,255,.9) !important;
        line-height: 1.55 !important;
        font-size: 1rem !important;
      }

      .setup-progress-wrap {
        margin-top: 18px !important;
      }

      .setup-progress-meta {
        display: flex !important;
        justify-content: space-between !important;
        gap: 12px !important;
        margin-bottom: 8px !important;
        color: rgba(255,255,255,.92) !important;
        font-size: .92rem !important;
      }

      .setup-progress-track {
        width: 100% !important;
        height: 12px !important;
        border-radius: 999px !important;
        background: rgba(255,255,255,.16) !important;
        overflow: hidden !important;
      }

      .setup-progress-bar {
        height: 100% !important;
        width: 10% !important;
        border-radius: inherit !important;
        background: linear-gradient(90deg, #38bdf8, #a78bfa) !important;
        transition: width .25s ease !important;
      }

      #setup-form .form-section {
        margin: 0 0 18px !important;
        padding: 24px !important;
        background: #ffffff !important;
        border: 1px solid rgba(148,163,184,.22) !important;
        border-radius: 24px !important;
        box-shadow: 0 16px 40px rgba(2,8,23,.16) !important;
      }

      #setup-form .form-section h2 {
        margin: 0 0 8px !important;
        color: #0f172a !important;
        font-size: 1.55rem !important;
        line-height: 1.15 !important;
      }

      #setup-form .form-section h2 i {
        color: #2563eb !important;
        margin-right: 8px !important;
      }

      #setup-form .form-section p,
      #setup-form .form-section small {
        color: #475569 !important;
      }

      #setup-form .form-row {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        gap: 16px !important;
        margin: 0 0 16px !important;
      }

      #setup-form .form-row:last-child {
        margin-bottom: 0 !important;
      }

      #setup-form .form-group {
        min-width: 0 !important;
        width: 100% !important;
      }

      #setup-form .form-group label {
        display: block !important;
        margin: 0 0 8px !important;
        color: #0f172a !important;
        font-size: .95rem !important;
        font-weight: 700 !important;
        line-height: 1.35 !important;
      }

      #setup-form input,
      #setup-form select,
      #setup-form textarea {
        display: block !important;
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        min-height: 52px !important;
        padding: 13px 15px !important;
        border-radius: 14px !important;
        border: 1px solid #cbd5e1 !important;
        background: #f8fafc !important;
        color: #0f172a !important;
        font-size: .98rem !important;
        line-height: 1.3 !important;
        box-sizing: border-box !important;
      }

      #setup-form input::placeholder,
      #setup-form textarea::placeholder {
        color: #94a3b8 !important;
      }

      #setup-form input:focus,
      #setup-form select:focus,
      #setup-form textarea:focus {
        outline: none !important;
        border-color: #3b82f6 !important;
        background: #fff !important;
        box-shadow: 0 0 0 4px rgba(59,130,246,.12) !important;
      }

      #dias-preferidos-container.checkbox-group {
        display: grid !important;
        grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
        gap: 10px !important;
        width: 100% !important;
      }

      #dias-preferidos-container.checkbox-group > label {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        min-height: 48px !important;
        margin: 0 !important;
        padding: 10px 12px !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 14px !important;
        background: #f8fafc !important;
        color: #0f172a !important;
        font-weight: 700 !important;
        cursor: pointer !important;
      }

      #dias-preferidos-container.checkbox-group input {
        width: 16px !important;
        min-height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        accent-color: #2563eb !important;
      }

      #materias-container,
      #aulas-container {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 14px !important;
        width: 100% !important;
      }

      #setup-form .materia-item,
      #setup-form .aula-item {
        display: grid !important;
        grid-template-columns: 1fr auto !important;
        gap: 12px !important;
        align-items: start !important;
        width: 100% !important;
        padding: 16px !important;
        border-radius: 18px !important;
        border: 1px solid #dbeafe !important;
        background: linear-gradient(180deg, #f8fbff, #eef4ff) !important;
        box-sizing: border-box !important;
      }

      #setup-form .materia-fields {
        display: grid !important;
        grid-template-columns: minmax(220px, 2fr) repeat(3, minmax(140px, 1fr)) !important;
        gap: 12px !important;
        width: 100% !important;
      }

      #setup-form .aula-fields {
        display: grid !important;
        grid-template-columns: repeat(6, minmax(110px, 1fr)) !important;
        gap: 12px !important;
        width: 100% !important;
      }

      #setup-form .btn-remove {
        width: 46px !important;
        min-width: 46px !important;
        min-height: 46px !important;
        padding: 0 !important;
        border-radius: 14px !important;
        align-self: start !important;
      }

      #setup-form button,
      #setup-form .btn {
        min-height: 46px !important;
        padding: 11px 16px !important;
        border-radius: 14px !important;
        font-weight: 700 !important;
      }

      #setup-form button[type="submit"],
      #setup-form .btn-primary,
      #setup-form .btn-submit {
        background: linear-gradient(135deg, #2563eb, #7c3aed) !important;
        color: #fff !important;
        border: none !important;
        box-shadow: 0 14px 30px rgba(59,130,246,.24) !important;
      }

      #setup-import-shortcuts,
      .catalog-hero {
        margin: 0 0 18px !important;
        border-radius: 24px !important;
      }

      .setup-import-card,
      .catalog-hero {
        background: linear-gradient(180deg, rgba(37,99,235,.12), rgba(124,58,237,.10)) !important;
        border: 1px solid rgba(96,165,250,.24) !important;
      }

      @media (max-width: 1024px) {
        #setup-form .materia-fields {
          grid-template-columns: 1fr 1fr !important;
        }

        #setup-form .aula-fields {
          grid-template-columns: repeat(3, minmax(120px, 1fr)) !important;
        }
      }

      @media (max-width: 760px) {
        #setup-screen.setup-container,
        #setup-screen {
          padding: 16px 10px 30px !important;
        }

        .setup-onboarding-hero {
          padding: 22px 18px !important;
          border-radius: 22px !important;
        }

        #setup-form .form-section {
          padding: 18px !important;
          border-radius: 20px !important;
        }

        #setup-form .form-row {
          grid-template-columns: 1fr !important;
        }

        #dias-preferidos-container.checkbox-group {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }

        #setup-form .materia-item,
        #setup-form .aula-item,
        #setup-form .materia-fields,
        #setup-form .aula-fields {
          grid-template-columns: 1fr !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function getSetupForm() {
    return document.getElementById('setup-form');
  }

  function ensureHero() {
    var form = getSetupForm();
    if (!form || form.querySelector('.setup-onboarding-hero')) return;

    var hero = document.createElement('div');
    hero.className = 'setup-onboarding-hero';
    hero.innerHTML = '' +
      '<div class="setup-onboarding-chip">Study Life Control • configuração inicial</div>' +
      '<h2>Monte seu ambiente acadêmico sem bagunça</h2>' +
      '<p>Preenche o essencial agora. Depois você ajusta o resto com calma dentro do sistema, sem precisar refazer tudo.</p>' +
      '<div class="setup-progress-wrap">' +
        '<div class="setup-progress-meta">' +
          '<span>Progresso da configuração</span>' +
          '<span id="setup-progress-text">0% concluído</span>' +
        '</div>' +
        '<div class="setup-progress-track">' +
          '<div class="setup-progress-bar" id="setup-progress-bar"></div>' +
        '</div>' +
      '</div>';

    form.insertBefore(hero, form.firstChild);
  }

  function normalizeButtons() {
    var form = getSetupForm();
    if (!form) return;

    Array.prototype.forEach.call(form.querySelectorAll('button, .btn'), function (btn) {
      var text = String(btn.textContent || '').toLowerCase();
      if (text.indexOf('adicionar matéria') !== -1 || text.indexOf('adicionar aula') !== -1) {
        btn.classList.add('btn-primary');
      }
    });
  }

  function updateProgress() {
    var form = getSetupForm();
    if (!form) return;

    var controls = Array.prototype.filter.call(
      form.querySelectorAll('input, select, textarea'),
      function (el) {
        return el.type !== 'hidden' && !el.disabled && el.offsetParent !== null;
      }
    );

    if (!controls.length) return;

    var filled = 0;
    controls.forEach(function (el) {
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (el.checked) filled += 1;
      } else if (String(el.value || '').trim()) {
        filled += 1;
      }
    });

    var percent = Math.max(8, Math.min(100, Math.round((filled / controls.length) * 100)));
    var bar = document.getElementById('setup-progress-bar');
    var text = document.getElementById('setup-progress-text');
    if (bar) bar.style.width = percent + '%';
    if (text) text.textContent = percent + '% concluído';
  }

  function enhanceSetupForm() {
    var form = getSetupForm();
    if (!form) return;

    injectStyles();
    ensureHero();
    normalizeButtons();
    updateProgress();

    if (!form.dataset.setupSafeEnhancerBound) {
      form.addEventListener('input', updateProgress);
      form.addEventListener('change', updateProgress);

      var observer = new MutationObserver(function () {
        normalizeButtons();
        updateProgress();
      });

      observer.observe(form, { childList: true, subtree: true });
      form.dataset.setupSafeEnhancerBound = '1';
    }
  }

  function init() {
    try {
      enhanceSetupForm();
    } catch (error) {
      console.error('Erro ao melhorar formulário inicial:', error);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('app-ready', function () {
    setTimeout(init, 50);
    setTimeout(init, 250);
  });

  window.setupOnboardingEnhancer = {
    enhanceSetupForm: enhanceSetupForm,
    updateProgress: updateProgress
  };
})();
