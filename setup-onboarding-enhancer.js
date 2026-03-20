(function () {
  'use strict';

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

  function injectStyles() {
    if (document.getElementById('setup-onboarding-enhancer-styles')) return;
    const style = document.createElement('style');
    style.id = 'setup-onboarding-enhancer-styles';
    style.textContent = `
      .setup-pro-shell{max-width:1180px;margin:0 auto}
      .setup-pro-hero{display:grid;grid-template-columns:1.3fr .9fr;gap:18px;margin:0 0 22px;padding:24px;border-radius:28px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#fff;box-shadow:0 28px 64px rgba(15,23,42,.22)}
      .setup-pro-hero h1,.setup-pro-hero h2,.setup-pro-hero h3{margin:0 0 10px;color:#fff}
      .setup-pro-hero p{margin:0;color:rgba(255,255,255,.88);line-height:1.55}
      .setup-pro-badges{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
      .setup-pro-badge{padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.15);font-size:.9rem;font-weight:700}
      .setup-pro-side{display:grid;gap:12px;align-content:start}
      .setup-pro-card{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(8px);border-radius:20px;padding:16px}
      .setup-pro-card strong{display:block;font-size:1rem;margin-bottom:6px}
      .setup-progress-wrap{margin:20px 0 6px}
      .setup-progress-meta{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:8px;color:#cbd5e1;font-size:.92rem}
      .setup-progress-track{height:10px;border-radius:999px;background:rgba(255,255,255,.18);overflow:hidden}
      .setup-progress-bar{height:100%;border-radius:999px;background:linear-gradient(90deg,#22c55e,#38bdf8);width:0%;transition:width .25s ease}
      .setup-pro-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:18px}
      .setup-pro-grid > *{min-width:0}
      .setup-pro-grid .setup-wide{grid-column:span 12}
      .setup-pro-grid .setup-half{grid-column:span 6}
      .setup-pro-grid .setup-third{grid-column:span 4}
      .setup-pro-grid .setup-quarter{grid-column:span 3}
      .setup-section-pro{background:#fff;border:1px solid #e2e8f0;border-radius:24px;padding:22px;box-shadow:0 18px 48px rgba(15,23,42,.06)}
      .setup-section-pro + .setup-section-pro{margin-top:18px}
      .setup-section-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}
      .setup-section-kicker{font-size:.78rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#2563eb;margin-bottom:8px}
      .setup-section-head h3,.setup-section-head h2{margin:0;color:#0f172a}
      .setup-section-desc{margin:8px 0 0;color:#475569;line-height:1.5}
      .setup-mini-hint{font-size:.87rem;color:#64748b;margin-top:8px}
      .setup-field{display:flex;flex-direction:column;gap:8px}
      .setup-field label{font-weight:700;color:#0f172a}
      .setup-field input,.setup-field select,.setup-field textarea{width:100%;min-height:48px;border:1px solid #cbd5e1;border-radius:14px;padding:12px 14px;font:inherit;background:#fff;transition:border-color .2s,box-shadow .2s,transform .2s}
      .setup-field textarea{min-height:110px;resize:vertical}
      .setup-field input:focus,.setup-field select:focus,.setup-field textarea:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 4px rgba(37,99,235,.12)}
      .setup-chip-grid{display:flex;flex-wrap:wrap;gap:10px}
      .setup-chip-grid label,.setup-day-chips label{display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;background:#f8fafc;border:1px solid #cbd5e1;font-weight:600;color:#0f172a;cursor:pointer;transition:.2s}
      .setup-chip-grid input,.setup-day-chips input{margin:0}
      .setup-day-chips{display:flex;flex-wrap:wrap;gap:10px}
      .setup-list-panel{background:#f8fafc;border:1px dashed #cbd5e1;border-radius:18px;padding:16px}
      .setup-list-panel-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}
      .setup-list-panel-head h4{margin:0;color:#0f172a}
      .setup-list-panel-head p{margin:4px 0 0;color:#64748b;font-size:.92rem}
      .setup-list-panel .btn-secondary,.setup-list-panel button{white-space:nowrap}
      .setup-form-actions-pro{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:22px;padding:18px;border-radius:20px;background:#eff6ff;border:1px solid #bfdbfe}
      .setup-form-actions-pro p{margin:0;color:#1e3a8a;line-height:1.45}
      .materia-item,.aula-item{background:#fff;border:1px solid #dbeafe;border-radius:18px;padding:16px;box-shadow:0 10px 30px rgba(37,99,235,.08);margin-bottom:14px}
      .materia-item .btn-remove,.aula-item .btn-remove{align-self:flex-start}
      .setup-field-row{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px}
      .setup-field-row .setup-half{grid-column:span 6}
      .setup-field-row .setup-third{grid-column:span 4}
      .setup-field-row .setup-quarter{grid-column:span 3}
      .setup-empty-state{padding:16px;border-radius:16px;background:#fff;border:1px dashed #cbd5e1;color:#64748b;text-align:center}
      @media (max-width: 960px){
        .setup-pro-hero{grid-template-columns:1fr}
        .setup-pro-grid .setup-half,.setup-pro-grid .setup-third,.setup-pro-grid .setup-quarter,.setup-field-row .setup-half,.setup-field-row .setup-third,.setup-field-row .setup-quarter{grid-column:span 12}
        .setup-form-actions-pro{flex-direction:column;align-items:stretch}
      }
    `;
    document.head.appendChild(style);
  }

  function textIncludes(el, terms) {
    const text = (el && el.textContent || '').toLowerCase();
    return terms.some(function (term) { return text.includes(term); });
  }

  function getSetupScreen() {
    return qs('#setup-screen') || qs('.setup-screen') || qsa('section,div').find(function (el) {
      return textIncludes(el, ['configuração inicial', 'vamos personalizar sua experiência']);
    }) || null;
  }

  function getSetupForm(root) {
    return qs('#setup-form', root) || qs('form', root) || null;
  }

  function getSections(form) {
    const sections = qsa('.form-section', form);
    if (sections.length) return sections;
    return qsa('section, .card, .setup-section', form).filter(function (el) {
      return textIncludes(el, ['informações básicas','rotina e disponibilidade','perfil acadêmico','matérias do semestre','grade de aulas']);
    });
  }

  function findPrimaryAction(form) {
    return qsa('button', form).find(function (btn) {
      return /iniciar jornada/i.test(btn.textContent || '');
    }) || null;
  }

  function inferSectionMeta(section) {
    const heading = qs('h2,h3,h4', section);
    const title = (heading && heading.textContent || '').trim().toLowerCase();
    if (title.includes('informações básicas')) {
      return { kicker: 'Base da conta', desc: 'Esses dados definem teu contexto acadêmico principal e são usados pela IA, grade e calendário.' };
    }
    if (title.includes('rotina')) {
      return { kicker: 'Rotina real', desc: 'Aqui o sistema entende teu tempo disponível para montar planos úteis de verdade.' };
    }
    if (title.includes('perfil acadêmico')) {
      return { kicker: 'Seu estilo', desc: 'Quanto mais realista tu for nesse passo, melhores ficam os alertas, metas e recomendações.' };
    }
    if (title.includes('matérias do semestre')) {
      return { kicker: 'Semestre atual', desc: 'Cadastre as matérias que você está cursando agora. Isso acelera o dashboard e o mentor IA.' };
    }
    if (title.includes('grade de aulas')) {
      return { kicker: 'Aulas fixas', desc: 'Informe sua rotina presencial para o site entender horários livres, deslocamento e conflitos.' };
    }
    return { kicker: 'Configuração', desc: 'Complete essa etapa para o sistema começar já bem ajustado ao seu perfil.' };
  }

  function wrapHeading(section) {
    if (section.dataset.setupEnhancedHeader === '1') return;
    const heading = qs('h2,h3,h4', section);
    if (!heading) return;
    const meta = inferSectionMeta(section);
    const wrapper = document.createElement('div');
    wrapper.className = 'setup-section-head';
    const info = document.createElement('div');
    info.innerHTML = '<div class="setup-section-kicker">' + meta.kicker + '</div>';
    info.appendChild(heading.cloneNode(true));
    const desc = document.createElement('p');
    desc.className = 'setup-section-desc';
    desc.textContent = meta.desc;
    info.appendChild(desc);
    wrapper.appendChild(info);
    heading.replaceWith(wrapper);
    section.dataset.setupEnhancedHeader = '1';
  }

  function fieldContainerFor(input) {
    let current = input;
    while (current && current !== document.body) {
      if (current.classList && (current.classList.contains('form-group') || current.classList.contains('input-group') || current.classList.contains('field-group'))) return current;
      current = current.parentElement;
    }
    return input.parentElement;
  }

  function markField(el, spanClass) {
    if (!el) return;
    el.classList.add('setup-field');
    if (spanClass) el.classList.add(spanClass);
  }

  function buildFieldGrid(section) {
    if (!section || section.dataset.setupEnhancedGrid === '1') return;
    const children = Array.from(section.children);
    const grid = document.createElement('div');
    grid.className = 'setup-pro-grid';
    const preserved = [];

    children.forEach(function (child) {
      if (child.classList && child.classList.contains('setup-section-head')) {
        preserved.push(child);
        return;
      }
      if (/^(h2|h3|h4)$/i.test(child.tagName)) return;
      grid.appendChild(child);
    });

    section.innerHTML = '';
    preserved.forEach(function (node) { section.appendChild(node); });
    section.appendChild(grid);
    section.dataset.setupEnhancedGrid = '1';
  }

  function classifyFields(section) {
    const labels = qsa('label', section);
    labels.forEach(function (label) {
      const field = fieldContainerFor(label);
      if (!field) return;
      const text = (label.textContent || '').toLowerCase();
      let span = 'setup-half';
      if (text.includes('dias preferidos')) span = 'setup-wide';
      if (text.includes('nome completo')) span = 'setup-half';
      if (text.includes('curso')) span = 'setup-half';
      if (text.includes('universidade')) span = 'setup-half';
      if (text.includes('semestre')) span = 'setup-half';
      if (text.includes('turno')) span = 'setup-half';
      if (text.includes('horas máximas')) span = 'setup-third';
      if (text.includes('horário de sono')) span = 'setup-third';
      if (text.includes('tempo de deslocamento')) span = 'setup-third';
      if (text.includes('tipo de rotina')) span = 'setup-half';
      if (text.includes('nível de disciplina')) span = 'setup-half';
      if (text.includes('maior dificuldade')) span = 'setup-half';
      markField(field, span);
    });

    qsa('#materias-container, #aulas-container', section).forEach(function (el) {
      el.classList.add('setup-wide');
    });
  }

  function styleChoiceGroups(section) {
    qsa('input[type="checkbox"], input[type="radio"]', section).forEach(function (input) {
      const label = input.closest('label');
      if (!label) return;
      const parentText = (label.parentElement && label.parentElement.textContent || '').toLowerCase();
      if (parentText.includes('seg') || parentText.includes('ter') || parentText.includes('qua') || parentText.includes('qui') || parentText.includes('sex') || parentText.includes('sáb') || parentText.includes('dom')) {
        label.parentElement.classList.add('setup-day-chips');
      } else {
        const container = label.parentElement;
        if (container && container.children.length <= 6) container.classList.add('setup-chip-grid');
      }
    });
  }

  function styleDynamicLists(form) {
    const materias = qs('#materias-container', form);
    const aulas = qs('#aulas-container', form);

    [
      { root: materias, title: 'Matérias do semestre', desc: 'Cadastre só o que está cursando agora. O restante da grade pode vir do catálogo comunitário.' },
      { root: aulas, title: 'Grade de aulas', desc: 'Esses horários ajudam o sistema a sugerir blocos de estudo sem conflito.' }
    ].forEach(function (entry) {
      if (!entry.root) return;
      const section = entry.root.closest('.form-section, .setup-section-pro, section, div');
      if (!section) return;

      if (!entry.root.previousElementSibling || !entry.root.previousElementSibling.classList || !entry.root.previousElementSibling.classList.contains('setup-list-panel-head')) {
        const panel = document.createElement('div');
        panel.className = 'setup-list-panel';
        const currentParent = entry.root.parentElement;
        const siblings = Array.from(currentParent.children);
        const index = siblings.indexOf(entry.root);

        const head = document.createElement('div');
        head.className = 'setup-list-panel-head';
        head.innerHTML = '<div><h4>' + entry.title + '</h4><p>' + entry.desc + '</p></div>';
        panel.appendChild(head);
        panel.appendChild(entry.root);
        if (index >= 0) {
          currentParent.insertBefore(panel, siblings[index]);
          if (siblings[index] === entry.root) currentParent.removeChild(entry.root);
        } else {
          currentParent.appendChild(panel);
        }
      }

      if (!entry.root.children.length) {
        if (!entry.root.querySelector('.setup-empty-state')) {
          const empty = document.createElement('div');
          empty.className = 'setup-empty-state';
          empty.textContent = 'Nenhum item adicionado ainda.';
          entry.root.appendChild(empty);
        }
      } else {
        const empty = entry.root.querySelector('.setup-empty-state');
        if (empty) empty.remove();
      }
    });
  }

  function updateProgress(form) {
    const target = qs('#setup-progress-bar', form) || qs('#setup-progress-bar');
    const label = qs('#setup-progress-label', form) || qs('#setup-progress-label');
    if (!target || !label) return;

    const importantIds = ['nome', 'curso', 'universidade', 'semestre', 'turno-estudo', 'horas-maximas', 'rotina-tipo', 'nivel-disciplina', 'maior-dificuldade'];
    let filled = 0;
    importantIds.forEach(function (id) {
      const el = document.getElementById(id);
      if (el && String(el.value || '').trim()) filled += 1;
    });

    const materiasCount = qsa('#materias-container .materia-item').length;
    const aulasCount = qsa('#aulas-container .aula-item').length;
    if (materiasCount > 0) filled += 1;
    if (aulasCount > 0) filled += 1;

    const total = importantIds.length + 2;
    const percent = Math.max(8, Math.round((filled / total) * 100));
    target.style.width = percent + '%';
    label.textContent = percent + '% preenchido';
  }

  function injectHero(form, setupScreen) {
    if (!form || !setupScreen || qs('#setup-pro-hero', setupScreen)) return;
    const hero = document.createElement('section');
    hero.id = 'setup-pro-hero';
    hero.className = 'setup-pro-hero';
    hero.innerHTML = `
      <div>
        <h2>Monte sua base acadêmica sem bagunça</h2>
        <p>Essa etapa deixa o sistema pronto para sugerir estudo, usar tua grade, prever riscos e organizar o semestre sem precisar refazer tudo depois.</p>
        <div class="setup-pro-badges">
          <span class="setup-pro-badge">Mentor IA contextual</span>
          <span class="setup-pro-badge">Calendário inteligente</span>
          <span class="setup-pro-badge">Grade pronta por curso</span>
          <span class="setup-pro-badge">Metas e alertas</span>
        </div>
        <div class="setup-progress-wrap">
          <div class="setup-progress-meta">
            <span>Progresso da configuração</span>
            <strong id="setup-progress-label">8% preenchido</strong>
          </div>
          <div class="setup-progress-track"><div class="setup-progress-bar" id="setup-progress-bar"></div></div>
        </div>
      </div>
      <div class="setup-pro-side">
        <div class="setup-pro-card">
          <strong>Preencha primeiro</strong>
          <span>Nome, curso, faculdade e semestre atual. Isso já ativa importação de grade e recomendações melhores.</span>
        </div>
        <div class="setup-pro-card">
          <strong>Se quiser acelerar</strong>
          <span>Use o catálogo comunitário para puxar a grade pronta e só ajustar o que for específico do seu caso.</span>
        </div>
      </div>
    `;
    form.parentElement.insertBefore(hero, form);
  }

  function polishButtons(form) {
    const primary = findPrimaryAction(form);
    if (!primary || primary.dataset.setupEnhancedButton === '1') return;
    const bar = document.createElement('div');
    bar.className = 'setup-form-actions-pro';
    const text = document.createElement('p');
    text.textContent = 'Quando você terminar essa etapa, o sistema já pode montar teu dashboard, metas, grade horária e plano inicial.';
    bar.appendChild(text);
    bar.appendChild(primary);
    primary.dataset.setupEnhancedButton = '1';
    form.appendChild(bar);
  }

  function enhanceDynamicItem(item) {
    if (!item || item.dataset.setupEnhancedItem === '1') return;
    item.dataset.setupEnhancedItem = '1';
    const labels = qsa('label', item);
    labels.forEach(function (label) {
      const field = fieldContainerFor(label);
      if (!field) return;
      field.classList.add('setup-field');
    });
  }

  function enhanceSetupForm() {
    const setupScreen = getSetupScreen();
    if (!setupScreen) return;
    const form = getSetupForm(setupScreen);
    if (!form) return;

    injectStyles();
    setupScreen.classList.add('setup-pro-shell');
    form.classList.add('setup-pro-form');
    injectHero(form, setupScreen);

    const sections = getSections(form);
    sections.forEach(function (section) {
      section.classList.add('setup-section-pro');
      wrapHeading(section);
      buildFieldGrid(section);
      classifyFields(section);
      styleChoiceGroups(section);
    });

    styleDynamicLists(form);
    polishButtons(form);
    qsa('.materia-item, .aula-item', form).forEach(enhanceDynamicItem);
    updateProgress(form);

    qsa('input, select, textarea', form).forEach(function (el) {
      if (el.dataset.setupProgressBound === '1') return;
      el.addEventListener('input', function () { updateProgress(form); });
      el.addEventListener('change', function () { updateProgress(form); });
      el.dataset.setupProgressBound = '1';
    });
  }

  function initObserver() {
    if (window.__setupEnhancerObserver) return;
    const observer = new MutationObserver(function () {
      enhanceSetupForm();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.__setupEnhancerObserver = observer;
  }

  function init() {
    enhanceSetupForm();
    initObserver();
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('app-ready', init);
  window.setupOnboardingEnhancer = { init: init, enhanceSetupForm: enhanceSetupForm };
})();
