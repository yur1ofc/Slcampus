
(function () {
  'use strict';

  const STYLE_ID = 'setup-onboarding-enhancer-v2';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #setup-screen, .setup-screen, #setup-container {
        background:
          radial-gradient(circle at top left, rgba(99,102,241,.18), transparent 32%),
          radial-gradient(circle at top right, rgba(56,189,248,.14), transparent 28%),
          linear-gradient(180deg, #071226 0%, #0b1730 100%) !important;
      }

      #setup-form, .setup-form {
        width: min(1180px, calc(100% - 32px)) !important;
        margin: 28px auto 48px !important;
        padding: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      .setup-enhanced-hero {
        position: relative;
        overflow: hidden;
        margin-bottom: 20px;
        padding: 28px 30px !important;
        border-radius: 26px !important;
        background: linear-gradient(135deg, #0f172a, #1d4ed8 58%, #2563eb) !important;
        color: #fff !important;
        box-shadow: 0 28px 60px rgba(2, 8, 23, .35) !important;
      }

      .setup-enhanced-hero::after {
        content: "";
        position: absolute;
        inset: auto -50px -70px auto;
        width: 220px;
        height: 220px;
        border-radius: 999px;
        background: rgba(255,255,255,.08);
        filter: blur(8px);
      }

      .setup-enhanced-eyebrow {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin: 0 0 10px;
        padding: 8px 12px;
        border-radius: 999px;
        background: rgba(255,255,255,.14);
        color: #dbeafe;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .setup-enhanced-hero h1,
      .setup-enhanced-hero h2 {
        margin: 0 0 10px !important;
        color: #fff !important;
        font-size: clamp(1.8rem, 2.5vw, 2.4rem) !important;
        line-height: 1.08 !important;
      }

      .setup-enhanced-hero p {
        margin: 0 !important;
        color: rgba(255,255,255,.88) !important;
        max-width: 760px !important;
        line-height: 1.55 !important;
        font-size: 1rem !important;
      }

      .setup-progress-shell {
        margin-top: 18px;
      }

      .setup-progress-label {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 8px;
        font-size: .92rem;
        color: rgba(255,255,255,.92);
      }

      .setup-progress-track {
        height: 12px;
        border-radius: 999px;
        background: rgba(255,255,255,.16);
        overflow: hidden;
      }

      .setup-progress-bar {
        height: 100%;
        width: 20%;
        border-radius: inherit;
        background: linear-gradient(90deg, #38bdf8, #a78bfa);
        transition: width .25s ease;
      }

      .setup-enhanced-card,
      .form-section,
      .setup-section {
        background: #ffffff !important;
        border: 1px solid rgba(148, 163, 184, .2) !important;
        border-radius: 24px !important;
        padding: 24px !important;
        margin: 0 0 18px !important;
        box-shadow: 0 16px 38px rgba(2, 8, 23, .16) !important;
      }

      .setup-enhanced-card h2,
      .setup-enhanced-card h3,
      .setup-enhanced-card h4,
      .form-section h2,
      .form-section h3,
      .form-section h4 {
        margin: 0 0 8px !important;
        color: #0f172a !important;
        font-size: 1.5rem !important;
        line-height: 1.15 !important;
      }

      .setup-section-kicker {
        display: inline-flex;
        align-items: center;
        margin-bottom: 10px;
        color: #2563eb;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: .08em;
        text-transform: uppercase;
      }

      .setup-enhanced-card p,
      .form-section p,
      .setup-section p,
      .setup-enhanced-card small,
      .form-section small {
        color: #475569 !important;
        line-height: 1.55 !important;
      }

      .setup-fields-grid {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(240px, 1fr)) !important;
        gap: 18px 18px !important;
        align-items: start !important;
      }

      .setup-field,
      .setup-fullwidth {
        min-width: 0 !important;
      }

      .setup-fullwidth {
        grid-column: 1 / -1 !important;
      }

      .setup-field > label,
      .setup-fullwidth > label,
      .setup-enhanced-card label,
      .form-section label {
        display: block !important;
        margin: 0 0 8px !important;
        color: #0f172a !important;
        font-size: .95rem !important;
        font-weight: 700 !important;
        line-height: 1.35 !important;
      }

      #setup-form input,
      #setup-form select,
      #setup-form textarea,
      .setup-form input,
      .setup-form select,
      .setup-form textarea {
        width: 100% !important;
        min-width: 0 !important;
        max-width: none !important;
        min-height: 52px !important;
        padding: 13px 15px !important;
        border-radius: 14px !important;
        border: 1px solid #cbd5e1 !important;
        background: #f8fafc !important;
        color: #0f172a !important;
        box-shadow: none !important;
        font-size: .98rem !important;
        line-height: 1.3 !important;
      }

      #setup-form textarea,
      .setup-form textarea {
        min-height: 120px !important;
        resize: vertical !important;
      }

      #setup-form input::placeholder,
      #setup-form textarea::placeholder {
        color: #94a3b8 !important;
      }

      #setup-form input:focus,
      #setup-form select:focus,
      #setup-form textarea:focus,
      .setup-form input:focus,
      .setup-form select:focus,
      .setup-form textarea:focus {
        outline: none !important;
        border-color: #3b82f6 !important;
        background: #fff !important;
        box-shadow: 0 0 0 4px rgba(59,130,246,.12) !important;
      }

      #setup-form .days-selector,
      #setup-form .study-days,
      #setup-form .weekday-selector,
      .setup-days-grid {
        display: grid !important;
        grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
        gap: 10px !important;
        width: 100% !important;
      }

      #setup-form .day-btn,
      #setup-form .study-day,
      #setup-form .weekday-btn,
      #setup-form .day-chip,
      .setup-day-chip {
        min-height: 46px !important;
        border-radius: 14px !important;
        border: 1px solid #cbd5e1 !important;
        background: #f8fafc !important;
        color: #0f172a !important;
        font-weight: 700 !important;
        cursor: pointer !important;
      }

      #setup-form .day-btn.active,
      #setup-form .study-day.active,
      #setup-form .weekday-btn.active,
      #setup-form .day-chip.active,
      .setup-day-chip.active {
        background: linear-gradient(135deg, #2563eb, #7c3aed) !important;
        color: #fff !important;
        border-color: transparent !important;
      }

      #setup-form .btn,
      #setup-form button,
      .setup-form .btn,
      .setup-form button {
        min-height: 46px !important;
        border-radius: 14px !important;
        padding: 11px 16px !important;
        font-weight: 700 !important;
      }

      #setup-form .btn-primary,
      #setup-form .btn-submit,
      #setup-form button[type="submit"],
      .setup-form .btn-primary,
      .setup-form button[type="submit"] {
        background: linear-gradient(135deg, #2563eb, #7c3aed) !important;
        color: #fff !important;
        border: none !important;
        box-shadow: 0 14px 30px rgba(59,130,246,.28) !important;
      }

      #setup-form .btn-secondary,
      #setup-form .btn-outline {
        background: #fff !important;
        color: #1e293b !important;
        border: 1px solid #cbd5e1 !important;
      }

      #materias-container,
      #aulas-container {
        display: grid !important;
        grid-template-columns: 1fr !important;
        gap: 14px !important;
        width: 100% !important;
      }

      .materia-item,
      .aula-item {
        width: 100% !important;
        display: grid !important;
        grid-template-columns: repeat(4, minmax(0, 1fr)) auto !important;
        gap: 12px !important;
        align-items: end !important;
        padding: 16px !important;
        border-radius: 18px !important;
        border: 1px solid #dbeafe !important;
        background: linear-gradient(180deg, #f8fbff, #eef4ff) !important;
      }

      .materia-item .btn-remove,
      .aula-item .btn-remove {
        min-width: 46px !important;
        width: 46px !important;
        padding: 0 !important;
        justify-self: end !important;
      }

      .setup-actions-row {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 12px !important;
        margin-top: 14px !important;
      }

      .setup-import-card {
        background: linear-gradient(180deg, rgba(37,99,235,.08), rgba(124,58,237,.08)) !important;
        border: 1px solid rgba(96,165,250,.24) !important;
      }

      .setup-import-card h3,
      .setup-import-card h4,
      .setup-import-card label,
      .setup-import-card p,
      .setup-import-card small {
        color: #e2e8f0 !important;
      }

      .setup-import-card input,
      .setup-import-card select,
      .setup-import-card textarea {
        background: rgba(255,255,255,.96) !important;
      }

      @media (max-width: 980px) {
        .setup-fields-grid { grid-template-columns: 1fr !important; }
        .materia-item, .aula-item { grid-template-columns: 1fr 1fr !important; }
        #setup-form, .setup-form { width: min(100% - 20px, 100%) !important; }
      }

      @media (max-width: 640px) {
        .setup-enhanced-hero { padding: 22px 18px !important; border-radius: 22px !important; }
        .setup-enhanced-card, .form-section, .setup-section { padding: 18px !important; border-radius: 20px !important; }
        .materia-item, .aula-item { grid-template-columns: 1fr !important; }
        #setup-form .days-selector,
        #setup-form .study-days,
        #setup-form .weekday-selector,
        .setup-days-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function getSetupForm() {
    return document.getElementById('setup-form') || document.querySelector('.setup-form');
  }

  function getSectionTitle(el) {
    const title = el.querySelector('h2, h3, h4');
    return title ? title.textContent.trim() : '';
  }

  function isContainerControl(el) {
    if (!el || !(el instanceof HTMLElement)) return false;
    if (el.matches('input, select, textarea')) return true;
    if (el.id === 'materias-container' || el.id === 'aulas-container') return true;
    if (el.matches('.days-selector, .study-days, .weekday-selector, .day-selector, .chips, .toggle-group')) return true;
    if (el.querySelector && el.querySelector('input, select, textarea')) return true;
    return false;
  }

  function shouldBeFullWidth(el) {
    if (!el || !(el instanceof HTMLElement)) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.id === 'materias-container' || el.id === 'aulas-container') return true;
    if (el.matches('.days-selector, .study-days, .weekday-selector, .day-selector, .chips, .toggle-group')) return true;
    if (el.querySelector && el.querySelector('textarea')) return true;
    return false;
  }

  function normalizeSection(section) {
    if (!section || section.dataset.setupNormalized === '1') return;
    section.dataset.setupNormalized = '1';
    section.classList.add('setup-enhanced-card');

    const title = section.querySelector(':scope > h2, :scope > h3, :scope > h4');
    if (title) {
      const kicker = document.createElement('div');
      kicker.className = 'setup-section-kicker';
      const text = getSectionTitle(section) || 'Seção';
      kicker.textContent = ({
        'Informações Básicas': 'Base da conta',
        'Rotina e Disponibilidade': 'Rotina real',
        'Perfil Acadêmico': 'Seu estilo',
        'Matérias do Semestre': 'Semestre atual',
        'Grade de Aulas': 'Aulas fixas'
      }[text] || 'Configuração');
      section.insertBefore(kicker, title);
    }

    const children = Array.from(section.children);
    const grid = document.createElement('div');
    grid.className = 'setup-fields-grid';

    let i = 0;
    while (i < children.length) {
      const el = children[i];
      if (!(el instanceof HTMLElement)) {
        i += 1;
        continue;
      }

      if (el.classList.contains('setup-section-kicker') || el.matches('h1, h2, h3, h4, p')) {
        i += 1;
        continue;
      }

      if (el.matches('label')) {
        const next = children[i + 1];
        const field = document.createElement('div');
        field.className = shouldBeFullWidth(next) ? 'setup-fullwidth' : 'setup-field';
        field.appendChild(el);
        if (next && next instanceof HTMLElement) {
          field.appendChild(next);
          i += 2;
        } else {
          i += 1;
        }
        grid.appendChild(field);
        continue;
      }

      if (isContainerControl(el)) {
        const field = document.createElement('div');
        field.className = shouldBeFullWidth(el) ? 'setup-fullwidth' : 'setup-field';
        field.appendChild(el);
        grid.appendChild(field);
        i += 1;
        continue;
      }

      if (el.matches('button, .btn')) {
        let actions = section.querySelector(':scope > .setup-actions-row');
        if (!actions) {
          actions = document.createElement('div');
          actions.className = 'setup-actions-row setup-fullwidth';
          grid.appendChild(actions);
        }
        actions.appendChild(el);
        i += 1;
        continue;
      }

      if (el.id === 'setup-import-shortcuts' || el.classList.contains('catalog-hero')) {
        el.classList.add('setup-import-card');
        i += 1;
        continue;
      }

      i += 1;
    }

    const anchor = Array.from(section.children).find(function (el) {
      return el.matches && !el.matches('.setup-section-kicker, h1, h2, h3, h4, p') && !el.classList.contains('setup-fields-grid');
    });

    if (anchor) {
      section.insertBefore(grid, anchor);
    } else {
      section.appendChild(grid);
    }
  }

  function buildHero(form) {
    if (!form || form.querySelector('.setup-enhanced-hero')) return;

    const hero = document.createElement('div');
    hero.className = 'setup-enhanced-hero';
    hero.innerHTML = `
      <div class="setup-enhanced-eyebrow">Study Life Control • configuração inicial</div>
      <h2>Monte seu ambiente acadêmico em poucos minutos</h2>
      <p>Preenche só o necessário agora. O sistema usa esses dados para organizar grade, rotina, tarefas, calendário e o mentor IA sem te deixar perdido.</p>
      <div class="setup-progress-shell">
        <div class="setup-progress-label">
          <span>Progresso da configuração</span>
          <span id="setup-progress-text">0% concluído</span>
        </div>
        <div class="setup-progress-track">
          <div class="setup-progress-bar" id="setup-progress-bar"></div>
        </div>
      </div>
    `;
    form.insertBefore(hero, form.firstChild);
  }

  function updateProgress() {
    const form = getSetupForm();
    if (!form) return;

    const controls = Array.from(form.querySelectorAll('input, select, textarea')).filter(function (el) {
      return el.offsetParent !== null && el.type !== 'hidden' && !el.disabled;
    });

    if (!controls.length) return;

    let filled = 0;
    controls.forEach(function (el) {
      if (el.type === 'checkbox' || el.type === 'radio') {
        if (el.checked) filled += 1;
      } else if (String(el.value || '').trim()) {
        filled += 1;
      }
    });

    const percent = Math.max(8, Math.min(100, Math.round((filled / controls.length) * 100)));
    const bar = document.getElementById('setup-progress-bar');
    const text = document.getElementById('setup-progress-text');
    if (bar) bar.style.width = percent + '%';
    if (text) text.textContent = percent + '% concluído';
  }

  function styleDynamicLists(form) {
    if (!form) return;
    const addButtons = Array.from(form.querySelectorAll('button, .btn')).filter(function (btn) {
      const text = (btn.textContent || '').toLowerCase();
      return text.includes('adicionar matéria') || text.includes('adicionar aula');
    });

    addButtons.forEach(function (btn) {
      btn.classList.add('btn-primary');
    });

    const importCard = document.getElementById('setup-import-shortcuts');
    if (importCard) importCard.classList.add('setup-import-card');
  }

  function findSections(form) {
    const explicit = Array.from(form.querySelectorAll(':scope > .form-section, :scope > .setup-section'));
    if (explicit.length) return explicit;

    return Array.from(form.children).filter(function (el) {
      return el instanceof HTMLElement &&
        (el.querySelector('h2, h3, h4')) &&
        (el.querySelector('input, select, textarea, #materias-container, #aulas-container') || /matérias|aulas|perfil|rotina|informações/i.test(el.textContent || ''));
    });
  }

  function enhanceSetupForm() {
    const form = getSetupForm();
    if (!form) return;

    injectStyles();
    buildHero(form);

    const sections = findSections(form);
    sections.forEach(normalizeSection);
    styleDynamicLists(form);
    updateProgress();

    if (!form.dataset.setupObserverAttached) {
      form.addEventListener('input', updateProgress);
      form.addEventListener('change', updateProgress);

      const observer = new MutationObserver(function () {
        const updatedSections = findSections(form);
        updatedSections.forEach(normalizeSection);
        styleDynamicLists(form);
        updateProgress();
      });

      observer.observe(form, { childList: true, subtree: true });
      form.dataset.setupObserverAttached = '1';
    }
  }

  function init() {
    enhanceSetupForm();
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('app-ready', function () {
    setTimeout(init, 50);
    setTimeout(init, 300);
  });

  window.setupOnboardingEnhancer = {
    enhanceSetupForm: enhanceSetupForm,
    updateProgress: updateProgress
  };
})();
