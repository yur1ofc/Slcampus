(function () {
  'use strict';

  function injectStyles() {
    if (document.getElementById('setup-onboarding-enhancer-styles')) return;
    const style = document.createElement('style');
    style.id = 'setup-onboarding-enhancer-styles';
    style.textContent = `
      #setup-screen{padding:32px 20px 48px;min-height:100vh;box-sizing:border-box;overflow-y:auto}
      #setup-screen .setup-container{max-width:1180px;margin:0 auto;background:rgba(15,23,42,.78);backdrop-filter:blur(10px);border:1px solid rgba(148,163,184,.18);border-radius:28px;padding:28px;box-shadow:0 24px 70px rgba(2,6,23,.45)}
      #setup-screen h1,#setup-screen h2,#setup-screen h3,#setup-screen label,#setup-screen p,#setup-screen span,#setup-screen small{color:#e5eefc}
      #setup-screen .setup-header{margin-bottom:20px;padding:20px 22px;border-radius:22px;background:linear-gradient(135deg,rgba(37,99,235,.24),rgba(99,102,241,.14));border:1px solid rgba(96,165,250,.22)}
      #setup-screen .setup-header h1{margin:0 0 8px;font-size:2rem;font-weight:800}
      #setup-screen .setup-header p{margin:0;color:#c7d7f5;line-height:1.55}
      #setup-screen .setup-progress{margin-top:14px}
      #setup-screen .setup-progress-bar{height:10px;border-radius:999px;background:rgba(255,255,255,.1);overflow:hidden}
      #setup-screen .setup-progress-fill{height:100%;width:0;background:linear-gradient(90deg,#60a5fa,#8b5cf6);transition:width .25s ease}
      #setup-screen .setup-progress-text{margin-top:8px;font-size:.95rem;color:#c7d7f5}
      #setup-screen form{display:grid;gap:18px}
      #setup-screen .form-section{background:#f8fbff;border:1px solid #d7e6fb;border-radius:24px;padding:22px 22px 18px;box-shadow:0 10px 28px rgba(15,23,42,.08)}
      #setup-screen .form-section h2{margin:0 0 8px;color:#0f172a;font-size:1.45rem}
      #setup-screen .form-section > p{margin:0 0 18px;color:#475569;line-height:1.5}
      #setup-screen .form-row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-bottom:12px}
      #setup-screen .form-group{display:flex;flex-direction:column;gap:8px;min-width:0}
      #setup-screen .form-group.full-width{grid-column:1/-1}
      #setup-screen label{font-size:.95rem;font-weight:700;color:#0f172a}
      #setup-screen input,
      #setup-screen select,
      #setup-screen textarea{width:100%;min-width:0;box-sizing:border-box;min-height:48px;padding:12px 14px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-size:1rem;outline:none;transition:border-color .2s ease,box-shadow .2s ease}
      #setup-screen textarea{min-height:120px;resize:vertical}
      #setup-screen input:focus,#setup-screen select:focus,#setup-screen textarea:focus{border-color:#4f46e5;box-shadow:0 0 0 4px rgba(79,70,229,.12)}
      #setup-screen .days-selector{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px}
      #setup-screen .day-chip,#setup-screen .day-button,#setup-screen .day-btn{min-height:46px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;color:#0f172a;font-weight:700}
      #setup-screen .day-chip.active,#setup-screen .day-button.active,#setup-screen .day-btn.active{background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;border-color:transparent}
      #setup-screen .materia-item,
      #setup-screen .aula-item{background:#eef6ff;border:1px solid #cfe0fb;border-radius:18px;padding:16px;margin-top:12px}
      #setup-screen .materia-item .form-row,
      #setup-screen .aula-item .form-row{margin-bottom:10px}
      #setup-screen .btn,
      #setup-screen button{cursor:pointer}
      #setup-screen .btn-add,
      #setup-screen .btn-secondary{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:10px 16px;border-radius:14px;border:1px solid #c7d2fe;background:#eef2ff;color:#3730a3;font-weight:700}
      #setup-screen .btn-remove{min-height:40px;padding:8px 12px;border-radius:12px;border:1px solid #fecaca;background:#fff1f2;color:#b91c1c;font-weight:700}
      #setup-screen .setup-submit,
      #setup-screen .btn-primary,
      #setup-screen button[type="submit"]{min-height:52px;padding:12px 22px;border:none;border-radius:16px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;font-size:1rem;font-weight:800;box-shadow:0 16px 30px rgba(79,70,229,.28)}
      #setup-screen .setup-submit-wrap{display:flex;justify-content:flex-end;margin-top:8px}
      #setup-screen .muted,#setup-screen .help-text{color:#64748b;font-size:.92rem}
      @media (max-width: 900px){
        #setup-screen .form-row{grid-template-columns:1fr}
        #setup-screen .days-selector{grid-template-columns:repeat(4,minmax(0,1fr))}
        #setup-screen .setup-container{padding:20px}
      }
      @media (max-width: 560px){
        #setup-screen{padding:18px 12px 32px}
        #setup-screen .days-selector{grid-template-columns:repeat(2,minmax(0,1fr))}
      }
    `;
    document.head.appendChild(style);
  }

  function getSetupScreen() {
    return document.getElementById('setup-screen');
  }

  function ensureHeader(container) {
    if (!container || container.querySelector('.setup-header')) return;
    const header = document.createElement('div');
    header.className = 'setup-header';
    header.innerHTML = `
      <h1>Configuração inicial</h1>
      <p>Preenche só o necessário agora. O sistema usa esses dados para organizar sua rotina, grade, tarefas, calendário e mentor IA sem te deixar perdido.</p>
      <div class="setup-progress">
        <div class="setup-progress-bar"><div class="setup-progress-fill" id="setup-progress-fill"></div></div>
        <div class="setup-progress-text" id="setup-progress-text">0% concluído</div>
      </div>
    `;
    container.insertBefore(header, container.firstChild);
  }

  function styleContainers(screen) {
    const form = screen.querySelector('form');
    if (!form) return;

    let wrapper = form.closest('.setup-container');
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'setup-container';
      screen.insertBefore(wrapper, form);
      wrapper.appendChild(form);
    }

    ensureHeader(wrapper);

    const sections = form.querySelectorAll('.form-section');
    sections.forEach(function (section) {
      const h2 = section.querySelector('h2');
      if (h2 && !section.dataset.sectionStyled) {
        section.dataset.sectionStyled = '1';
      }
    });

    if (!form.querySelector('.setup-submit-wrap')) {
      const submit = form.querySelector('button[type="submit"], .btn-primary, .setup-submit');
      if (submit) {
        const wrap = document.createElement('div');
        wrap.className = 'setup-submit-wrap';
        submit.parentNode.insertBefore(wrap, submit);
        wrap.appendChild(submit);
      }
    }
  }

  function normalizeRows(screen) {
    screen.querySelectorAll('.form-row').forEach(function (row) {
      row.querySelectorAll('.form-group').forEach(function (group) {
        const input = group.querySelector('input,select,textarea');
        if (input && (input.type === 'textarea' || group.classList.contains('full-width'))) {
          group.classList.add('full-width');
        }
      });
    });
  }

  function styleDynamicLists(screen) {
    ['#materias-container', '#aulas-container'].forEach(function (selector) {
      const container = screen.querySelector(selector);
      if (!container) return;

      Array.from(container.children).forEach(function (child) {
        if (!(child instanceof HTMLElement)) return;
        if (child.classList.contains('materia-item') || child.classList.contains('aula-item')) {
          child.querySelectorAll('input,select,textarea').forEach(function (el) {
            el.style.width = '100%';
          });
        }
      });
    });
  }

  function computeProgress(screen) {
    const fields = Array.from(screen.querySelectorAll('input,select,textarea')).filter(function (el) {
      if (el.type === 'hidden' || el.disabled) return false;
      return el.offsetParent !== null;
    });

    if (!fields.length) return;

    let filled = 0;
    fields.forEach(function (field) {
      if (field.type === 'checkbox' || field.type === 'radio') {
        if (field.checked) filled += 1;
      } else if (String(field.value || '').trim()) {
        filled += 1;
      }
    });

    const percent = Math.max(0, Math.min(100, Math.round((filled / fields.length) * 100)));
    const fill = document.getElementById('setup-progress-fill');
    const text = document.getElementById('setup-progress-text');
    if (fill) fill.style.width = percent + '%';
    if (text) text.textContent = percent + '% concluído';
  }

  function bindProgress(screen) {
    if (screen.__setupProgressBound) return;
    screen.__setupProgressBound = true;
    screen.addEventListener('input', function () { computeProgress(screen); });
    screen.addEventListener('change', function () { computeProgress(screen); });
  }

  function enhanceSetupForm() {
    const screen = getSetupScreen();
    if (!screen) return;
    injectStyles();
    styleContainers(screen);
    normalizeRows(screen);
    styleDynamicLists(screen);
    bindProgress(screen);
    computeProgress(screen);
  }

  function initWithRetries() {
    let attempts = 0;
    const maxAttempts = 30;
    const timer = setInterval(function () {
      attempts += 1;
      enhanceSetupForm();
      const screen = getSetupScreen();
      const form = screen && screen.querySelector('form');
      if (form || attempts >= maxAttempts) clearInterval(timer);
    }, 500);
  }

  document.addEventListener('DOMContentLoaded', initWithRetries);
  document.addEventListener('app-ready', initWithRetries);
  window.addEventListener('load', initWithRetries);
})();
