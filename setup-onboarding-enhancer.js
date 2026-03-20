(function () {
  'use strict';

  function injectStyles() {
    if (document.getElementById('slc-setup-enhancer-styles')) return;
    const style = document.createElement('style');
    style.id = 'slc-setup-enhancer-styles';
    style.textContent = `
      body .setup-container, body .setup-screen, body #setup-screen {
        background: linear-gradient(180deg, #f8fafc 0%, #eef4ff 100%);
      }
      #setup-screen .setup-content,
      .setup-content {
        max-width: 1180px !important;
        margin: 0 auto !important;
        padding: 28px 20px 48px !important;
      }
      .slc-setup-shell {
        display: grid;
        gap: 22px;
      }
      .slc-setup-hero {
        background: linear-gradient(135deg, #0f172a, #1e3a8a);
        color: #fff;
        border-radius: 24px;
        padding: 28px;
        box-shadow: 0 24px 60px rgba(15, 23, 42, .18);
      }
      .slc-setup-hero h1, .slc-setup-hero h2, .slc-setup-hero h3 { margin: 0 0 8px; color: #fff; }
      .slc-setup-hero p { margin: 0; color: rgba(255,255,255,.86); line-height: 1.6; }
      .slc-setup-progress {
        display: grid;
        grid-template-columns: repeat(4, minmax(0,1fr));
        gap: 12px;
        margin-top: 18px;
      }
      .slc-step {
        background: rgba(255,255,255,.1);
        border: 1px solid rgba(255,255,255,.14);
        border-radius: 16px;
        padding: 12px 14px;
      }
      .slc-step b { display:block; font-size:.95rem; margin-bottom: 4px; }
      .slc-step span { font-size:.82rem; color: rgba(255,255,255,.78); }

      #setup-form {
        display: grid !important;
        gap: 18px !important;
        align-items: start;
      }
      #setup-form .form-section {
        background: #ffffff !important;
        border: 1px solid #dbe6f5 !important;
        border-radius: 22px !important;
        padding: 22px !important;
        box-shadow: 0 12px 34px rgba(15, 23, 42, .06) !important;
        overflow: visible !important;
      }
      #setup-form .form-section h3,
      #setup-form .form-section h2 {
        margin: 0 0 6px !important;
        color: #0f172a !important;
        font-size: 1.15rem !important;
      }
      #setup-form .form-section p,
      #setup-form .form-section small,
      #setup-form .form-section label,
      #setup-form .form-section span,
      #setup-form .form-section .help-text {
        color: #334155 !important;
      }
      #setup-form .form-row,
      #setup-form .form-grid,
      #setup-form .input-row {
        display: grid !important;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 16px !important;
      }
      #setup-form .form-group,
      #setup-form .field-group,
      #setup-form .input-group {
        min-width: 0 !important;
      }
      #setup-form input,
      #setup-form select,
      #setup-form textarea {
        width: 100% !important;
        min-width: 0 !important;
        background: #fff !important;
        color: #0f172a !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 14px !important;
        padding: 12px 14px !important;
        box-sizing: border-box !important;
        box-shadow: none !important;
      }
      #setup-form input::placeholder,
      #setup-form textarea::placeholder { color: #94a3b8 !important; }
      #setup-form label {
        display:block !important;
        font-weight: 700 !important;
        margin-bottom: 7px !important;
      }
      #setup-form .checkbox-group,
      #setup-form .days-selector,
      #setup-form .weekdays-selector,
      #setup-form .chips,
      #setup-form .toggle-group {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 10px !important;
      }
      #setup-form .checkbox-group label,
      #setup-form .days-selector label,
      #setup-form .weekdays-selector label,
      #setup-form .chips label,
      #setup-form .toggle-group label {
        margin: 0 !important;
        padding: 10px 14px !important;
        border-radius: 999px !important;
        border: 1px solid #cbd5e1 !important;
        background: #f8fafc !important;
        font-weight: 600 !important;
        cursor: pointer !important;
      }
      #setup-form input[type="checkbox"],
      #setup-form input[type="radio"] {
        width: auto !important;
        margin-right: 6px !important;
      }
      #setup-form .btn,
      #setup-form button {
        border-radius: 14px !important;
      }
      #setup-form .btn-primary,
      #setup-form button[type="submit"] {
        background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
        color: #fff !important;
        border: 0 !important;
        padding: 14px 18px !important;
        font-weight: 800 !important;
        box-shadow: 0 14px 30px rgba(37, 99, 235, .26) !important;
      }
      #setup-form .btn-secondary,
      #setup-form .btn-add,
      #setup-form .add-btn {
        background: #eff6ff !important;
        color: #1d4ed8 !important;
        border: 1px solid #bfdbfe !important;
        padding: 10px 14px !important;
        font-weight: 700 !important;
      }
      #setup-form .materia-item,
      #setup-form .aula-item {
        background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%) !important;
        border: 1px solid #dbe6f5 !important;
        border-radius: 18px !important;
        padding: 16px !important;
        margin-top: 14px !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.7) !important;
      }
      #setup-form .materia-item .btn-remove,
      #setup-form .aula-item .btn-remove {
        background: #fee2e2 !important;
        color: #b91c1c !important;
        border: 1px solid #fecaca !important;
        border-radius: 10px !important;
        padding: 8px 10px !important;
      }
      #setup-form .section-actions,
      #setup-form .actions-row {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 10px !important;
        margin-top: 14px !important;
      }
      #setup-form .slc-setup-footer {
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:16px;
        flex-wrap:wrap;
      }
      #setup-form .slc-setup-note {
        color:#475569 !important;
        font-size:.95rem !important;
      }
      @media (max-width: 860px) {
        .slc-setup-progress,
        #setup-form .form-row,
        #setup-form .form-grid,
        #setup-form .input-row {
          grid-template-columns: 1fr !important;
        }
        .slc-setup-hero { padding: 22px; }
        #setup-form .form-section { padding: 18px !important; }
      }
    `;
    document.head.appendChild(style);
  }

  function createHero() {
    const hero = document.createElement('section');
    hero.className = 'slc-setup-hero';
    hero.innerHTML = `
      <h2>Configure sua rotina sem bagunça</h2>
      <p>Preencha só o necessário para o sistema já montar sua base acadêmica. O restante você ajusta depois dentro do app.</p>
      <div class="slc-setup-progress">
        <div class="slc-step"><b>1. Perfil</b><span>Curso, faculdade e semestre</span></div>
        <div class="slc-step"><b>2. Rotina</b><span>Disponibilidade e ritmo de estudo</span></div>
        <div class="slc-step"><b>3. Matérias</b><span>Seu semestre atual</span></div>
        <div class="slc-step"><b>4. Aulas</b><span>Grade semanal inicial</span></div>
      </div>
    `;
    return hero;
  }

  function wrapSetup() {
    const form = document.getElementById('setup-form');
    if (!form || form.dataset.slcEnhanced === '1') return;

    const parent = form.parentNode;
    if (!parent) return;

    const shell = document.createElement('div');
    shell.className = 'slc-setup-shell';
    shell.appendChild(createHero());
    parent.insertBefore(shell, form);
    shell.appendChild(form);
    form.dataset.slcEnhanced = '1';
  }

  function fixSectionContent() {
    const form = document.getElementById('setup-form');
    if (!form) return;

    const sections = form.querySelectorAll('.form-section');
    sections.forEach(function (section, index) {
      if (!section.dataset.slcSectionEnhanced) {
        section.dataset.slcSectionEnhanced = '1';
        section.setAttribute('data-section-index', String(index + 1));
      }
    });

    const submitBtn = form.querySelector('button[type="submit"], .btn-primary[type="submit"], #btn-start-journey');
    if (submitBtn) {
      let footer = submitBtn.closest('.slc-setup-footer');
      if (!footer) {
        footer = document.createElement('div');
        footer.className = 'slc-setup-footer';
        const note = document.createElement('div');
        note.className = 'slc-setup-note';
        note.textContent = 'Você poderá editar matérias, aulas e preferências depois, sem perder nada.';
        submitBtn.parentNode.insertBefore(footer, submitBtn);
        footer.appendChild(note);
        footer.appendChild(submitBtn);
      }
    }
  }

  function styleDynamicLists() {
    const containers = [
      document.getElementById('materias-container'),
      document.getElementById('aulas-container')
    ].filter(Boolean);

    containers.forEach(function (container) {
      Array.from(container.children).forEach(function (child) {
        if (!(child instanceof HTMLElement)) return;
        child.classList.add('slc-enhanced-item');

        const removeBtn = child.querySelector('.btn-remove');
        if (removeBtn && removeBtn.parentNode === child && !child.querySelector('.section-actions')) {
          const actions = document.createElement('div');
          actions.className = 'section-actions';
          child.appendChild(actions);
          actions.appendChild(removeBtn);
        }
      });
    });
  }

  function observeDynamicChanges() {
    const form = document.getElementById('setup-form');
    if (!form || form.dataset.slcObserverAttached === '1') return;

    const observer = new MutationObserver(function () {
      styleDynamicLists();
      fixSectionContent();
    });

    observer.observe(form, { childList: true, subtree: true });
    form.dataset.slcObserverAttached = '1';
  }

  function enhanceSetupForm() {
    const form = document.getElementById('setup-form');
    if (!form) return;
    injectStyles();
    wrapSetup();
    fixSectionContent();
    styleDynamicLists();
    observeDynamicChanges();
  }

  function init() {
    enhanceSetupForm();
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('app-ready', init);
})();
