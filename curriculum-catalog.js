(function () {
  'use strict';

  const COMMUNITY_BOOTSTRAP = {
    'ufob__engenharia-civil': {
      key: 'ufob__engenharia-civil',
      faculdade: 'UFOB',
      curso: 'Engenharia Civil',
      source: 'bootstrap',
      version: '2026.1',
      confidence: 0.92,
      subjects: [
        { nome: 'Cálculo Diferencial I', codigo: 'MAT001', semestre: '1', cargaHoraria: 60, creditos: 4, tipo: 'obrigatoria', prerequisitosLista: [] },
        { nome: 'Física I', codigo: 'FIS001', semestre: '1', cargaHoraria: 60, creditos: 4, tipo: 'obrigatoria', prerequisitosLista: [] },
        { nome: 'Geometria Analítica', codigo: 'MAT002', semestre: '1', cargaHoraria: 60, creditos: 4, tipo: 'obrigatoria', prerequisitosLista: [] },
        { nome: 'Introdução ao Desenho Técnico', codigo: 'DTE001', semestre: '1', cargaHoraria: 60, creditos: 4, tipo: 'obrigatoria', prerequisitosLista: [] }
      ]
    }
  };

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function slugify(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/&/g, ' e ')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function normalizeName(text) {
    return String(text || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/\b(i|ii|iii|iv|v|vi|vii|viii|ix|x)\b/g, function (m) {
        return ({ i: '1', ii: '2', iii: '3', iv: '4', v: '5', vi: '6', vii: '7', viii: '8', ix: '9', x: '10' }[m] || m);
      })
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function catalogKey(faculdade, curso) {
    return slugify(faculdade) + '__' + slugify(curso);
  }

  function ensureArray(v) { return Array.isArray(v) ? v : []; }
  function ensureObject(v) { return v && typeof v === 'object' ? v : {}; }
  function uid() { return (window.generateId ? window.generateId() : 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)); }

  function ensureUserDataCompatibility(app) {
    if (!app) return;
    app.data = ensureObject(app.data);
    app.data.user = ensureObject(app.data.user);

    ['subjects', 'sessions', 'tasks', 'exams', 'materials', 'grades', 'habits', 'learningMap', 'classSchedule', 'dailyLogs', 'classDiaries', 'reviews', 'curriculum', 'extraCourses'].forEach(function (k) {
      if (!Array.isArray(app.data[k])) app.data[k] = [];
    });

    if (!app.data.user.universidade) app.data.user.universidade = '';
    if (!app.data.user.curso) app.data.user.curso = '';
    if (!app.data.user.semestre) app.data.user.semestre = '';
    if (!app.data.user.matrizVersion) app.data.user.matrizVersion = '';
  }

  function normalizeCurriculumItem(item, forceNeutralStatus) {
    item = ensureObject(item);
    const prereqText = ensureArray(item.prerequisitosLista).length
      ? item.prerequisitosLista
      : String(item.prerequisitos || '')
          .split(/[;,]/)
          .map(function (s) { return s.trim(); })
          .filter(Boolean);

    return {
      id: item.id || uid(),
      nome: String(item.nome || item.title || '').trim(),
      codigo: String(item.codigo || '').trim().toUpperCase(),
      semestre: String(item.semestre || item.periodo || '').trim(),
      cargaHoraria: Number(item.cargaHoraria || item.ch || 0) || 0,
      creditos: Number(item.creditos || 0) || 0,
      tipo: item.tipo || 'obrigatoria',
      status: forceNeutralStatus ? 'nao-cursada' : (item.status || 'nao-cursada'),
      prerequisitosLista: Array.from(new Set(prereqText.map(function (s) { return s.trim(); }).filter(Boolean))),
      origemTemplate: item.origemTemplate || null,
      editadoPeloUsuario: !!item.editadoPeloUsuario,
      observacoes: item.observacoes || ''
    };
  }

  function dedupeCurriculum(items, forceNeutralStatus) {
    const seen = new Map();
    const result = [];

    ensureArray(items).forEach(function (item) {
      if (!item || !(item.nome || item.title)) return;
      const normalized = normalizeCurriculumItem(item, forceNeutralStatus);
      const key = normalizeName(normalized.nome) + '__' + String(normalized.codigo || '').trim().toUpperCase();
      if (seen.has(key)) {
        const idx = seen.get(key);
        result[idx] = mergeCurriculumItem(result[idx], normalized);
      } else {
        seen.set(key, result.length);
        result.push(normalized);
      }
    });

    return result;
  }

  function preferStatus(a, b) {
    const rank = { concluida: 3, cursando: 2, 'nao-cursada': 1, 'nao cursada': 1, pendente: 1 };
    const sa = String(a || 'nao-cursada').toLowerCase();
    const sb = String(b || 'nao-cursada').toLowerCase();
    return (rank[sb] || 0) > (rank[sa] || 0) ? b : a;
  }

  function mergeCurriculumItem(base, extra) {
    const a = normalizeCurriculumItem(base);
    const b = normalizeCurriculumItem(extra);
    const prereqs = Array.from(new Set([].concat(a.prerequisitosLista || [], b.prerequisitosLista || []).filter(Boolean)));
    return {
      ...a,
      ...b,
      nome: a.nome || b.nome,
      codigo: a.codigo || b.codigo,
      semestre: a.semestre || b.semestre,
      cargaHoraria: Number(a.cargaHoraria) || Number(b.cargaHoraria) || 0,
      creditos: Number(a.creditos) || Number(b.creditos) || 0,
      tipo: a.tipo || b.tipo || 'obrigatoria',
      status: preferStatus(a.status, b.status),
      prerequisitosLista: prereqs
    };
  }

  function neutralizeForCommunity(items) {
    return dedupeCurriculum(items, true).map(function (item) {
      return { ...item, status: 'nao-cursada', editadoPeloUsuario: false };
    });
  }

  function mergeIntoUserCurriculum(app, incoming, sourceLabel) {
    ensureUserDataCompatibility(app);
    const normalizedIncoming = dedupeCurriculum(ensureArray(incoming).map(function (item) {
      return { ...item, status: 'nao-cursada', origemTemplate: sourceLabel || item.origemTemplate || null };
    }), true);

    const current = dedupeCurriculum(app.data.curriculum || []);
    const map = new Map();
    current.forEach(function (item) {
      const key = normalizeName(item.nome) + '__' + String(item.codigo || '').trim().toUpperCase();
      map.set(key, normalizeCurriculumItem(item));
    });

    normalizedIncoming.forEach(function (item) {
      const key = normalizeName(item.nome) + '__' + String(item.codigo || '').trim().toUpperCase();
      if (!map.has(key)) map.set(key, normalizeCurriculumItem(item, true));
    });

    app.data.curriculum = Array.from(map.values());
    if (typeof app.normalizeCurriculumInMemory === 'function') app.normalizeCurriculumInMemory();
    else app.data.curriculum = dedupeCurriculum(app.data.curriculum);
    return app.data.curriculum;
  }

  function toSubject(curriculumItem) {
    return { id: uid(), nome: curriculumItem.nome, dificuldade: 3, peso: 3, notaDesejada: 7 };
  }

  function maybePopulateSubjectsFromSemester(app) {
    ensureUserDataCompatibility(app);
    const semester = String(app.data.user.semestre || '').trim();
    if (!semester) return;
    const existingNames = new Set(app.data.subjects.map(function (s) { return normalizeName(s.nome); }));
    const additions = app.data.curriculum
      .filter(function (c) { return String(c.semestre || '').trim() === semester; })
      .filter(function (c) { return !existingNames.has(normalizeName(c.nome)); })
      .map(toSubject);
    if (additions.length) app.data.subjects = app.data.subjects.concat(additions);
  }

  function parseTextToCurriculum(text, defaultSemester) {
    const lines = String(text || '').split(/\n+/).map(function (line) { return line.trim(); }).filter(Boolean);
    const items = [];
    let currentSemester = String(defaultSemester || '').trim();

    lines.forEach(function (line) {
      const semMatch = line.match(/(?:^|\b)(\d{1,2})\s*[ºo]?\s*(?:semestre|periodo|per[ií]odo)\b/i);
      if (semMatch) {
        currentSemester = semMatch[1];
        return;
      }
      if (/^(matriz|grade|curso|faculdade|universidade|disciplina[s]?|componentes?)\b/i.test(line)) return;
      const cargaMatch = line.match(/(\d{2,3})\s*h\b/i);
      const creditMatch = line.match(/(\d{1,2})\s*cr[eé]dit/i);
      const codeMatch = line.match(/\b([A-Z]{2,}\d{2,}|\d{5,}|[A-Z]{3,}-\d{2,})\b/);
      const prereqMatch = line.match(/pr[eé]-?requisit(?:o|os)\s*[:\-]\s*(.+)$/i);

      let cleaned = line
        .replace(/\b\d{1,2}\s*[ºo]?\s*(?:semestre|periodo|per[ií]odo)\b/ig, '')
        .replace(/\b\d{2,3}\s*h\b/ig, '')
        .replace(/\b\d{1,2}\s*cr[eé]dit(?:o|os)?\b/ig, '')
        .replace(/\bpr[eé]-?requisit(?:o|os)\s*[:\-].+$/ig, '')
        .replace(/\b([A-Z]{2,}\d{2,}|\d{5,}|[A-Z]{3,}-\d{2,})\b/g, '')
        .replace(/^[\-\–\—\•\*]+/, '')
        .replace(/\s{2,}/g, ' ')
        .trim();

      if (!cleaned || cleaned.length < 3) return;
      items.push(normalizeCurriculumItem({
        nome: cleaned,
        codigo: codeMatch ? codeMatch[1] : '',
        semestre: currentSemester || '',
        cargaHoraria: cargaMatch ? Number(cargaMatch[1]) : 0,
        creditos: creditMatch ? Number(creditMatch[1]) : 0,
        tipo: /optativa/i.test(line) ? 'optativa' : 'obrigatoria',
        status: 'nao-cursada',
        prerequisitosLista: prereqMatch ? prereqMatch[1].split(/[;,]/).map(function (s) { return s.trim(); }).filter(Boolean) : []
      }, true));
    });

    return dedupeCurriculum(items, true);
  }

  function buildPreviewHtml(items) {
    if (!items.length) return '<div class="catalog-warning">Nada útil foi encontrado no texto.</div>';
    return '\n      <h4>Prévia da importação (' + items.length + ' componentes)</h4>\n      <div class="catalog-preview-list">\n        ' + items.slice(0, 80).map(function (item) {
      return '\n          <div class="catalog-preview-item">\n            <strong>' + escapeHtml(item.nome) + '</strong><br>\n            <span>' + (item.semestre ? escapeHtml(item.semestre) + 'º semestre' : 'Sem semestre') + (item.cargaHoraria ? ' • ' + item.cargaHoraria + 'h' : '') + (item.codigo ? ' • ' + escapeHtml(item.codigo) : '') + '</span>\n            ' + (item.prerequisitosLista && item.prerequisitosLista.length ? '<div style="margin-top:6px;font-size:.9rem;color:#475569">Pré: ' + escapeHtml(item.prerequisitosLista.join(', ')) + '</div>' : '') + '\n          </div>\n        ';
    }).join('') + '\n      </div>\n    ';
  }

  function getDbInstance() { return window.db || (typeof db !== 'undefined' ? db : null); }
  function getAuthInstance() { return window.auth || (typeof auth !== 'undefined' ? auth : null); }

  function attachDbExtensions() {
    if (!window.dbService || window.dbService.__communityCatalogPatched) return;
    const dbService = window.dbService;

    dbService.getCommunityCatalog = async function (faculdade, curso) {
      const key = catalogKey(faculdade, curso);
      const bootstrap = currentCatalogTemplate(faculdade, curso);
      const dbRef = getDbInstance();
      try {
        if (!dbRef) return bootstrap;
        const snap = await dbRef.collection('community_catalogs').doc(key).get();
        if (!snap.exists) return bootstrap;
        const data = snap.data() || {};
        const subjects = neutralizeForCommunity(ensureArray(data.subjects));
        return {
          key: key,
          faculdade: data.faculdade || faculdade,
          curso: data.curso || curso,
          confidence: Number(data.confidence || 0),
          version: data.version || '',
          source: 'firestore',
          subjects: dedupeCurriculum((bootstrap ? bootstrap.subjects : []).concat(subjects), true),
          stats: data.stats || {}
        };
      } catch (error) {
        console.error('Erro ao buscar catálogo comunitário:', error);
        return bootstrap;
      }
    };

    dbService.saveCommunityCatalog = async function (faculdade, curso, subjects, meta) {
      const key = catalogKey(faculdade, curso);
      const normalizedSubjects = neutralizeForCommunity(subjects);
      const payload = {
        key: key,
        faculdade: faculdade,
        curso: curso,
        subjects: normalizedSubjects,
        updatedAt: new Date().toISOString(),
        version: (meta && meta.version) || '',
        confidence: Number((meta && meta.confidence) || 0.55),
        stats: {
          usersCount: Number((meta && meta.usersCount) || 1),
          componentsCount: normalizedSubjects.length
        }
      };
      const dbRef = getDbInstance();
      if (!dbRef) return payload;
      try {
        await dbRef.collection('community_catalogs').doc(key).set(payload, { merge: true });
      } catch (error) {
        console.error('Erro ao salvar catálogo comunitário:', error);
      }
      return payload;
    };

    dbService.submitCommunityContribution = async function (faculdade, curso, subjects, extra) {
      const authRef = getAuthInstance();
      const user = authRef ? authRef.currentUser : null;
      const payload = {
        faculdade: faculdade,
        curso: curso,
        key: catalogKey(faculdade, curso),
        subjects: neutralizeForCommunity(subjects),
        submittedAt: new Date().toISOString(),
        sourceUserId: user ? user.uid : null,
        version: (extra && extra.version) || '',
        semester: (extra && extra.semester) || '',
        mode: (extra && extra.mode) || 'manual',
        count: ensureArray(subjects).length
      };
      const dbRef = getDbInstance();
      if (!dbRef) return payload;
      try {
        await dbRef.collection('community_catalog_submissions').add(payload);
      } catch (error) {
        console.error('Erro ao enviar contribuição:', error);
      }
      return payload;
    };

    dbService.__communityCatalogPatched = true;
  }

  function injectStyles() {
    if (document.getElementById('community-catalog-styles')) return;
    const style = document.createElement('style');
    style.id = 'community-catalog-styles';
    style.textContent = '.catalog-hero{display:grid;grid-template-columns:2fr 1fr;gap:16px;margin:18px 0;padding:18px;border-radius:18px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff}.catalog-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end}.catalog-btn{border:none;border-radius:12px;padding:10px 14px;font-weight:700;cursor:pointer}.catalog-btn.primary{background:#22c55e;color:#06230f}.catalog-btn.secondary{background:#fff;color:#0f172a}.catalog-btn.ghost{background:rgba(255,255,255,.12);color:#fff;border:1px solid rgba(255,255,255,.18)}.catalog-badges{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.catalog-badge{padding:6px 10px;border-radius:999px;background:rgba(255,255,255,.1);font-size:.85rem}.catalog-modal-overlay{position:fixed;inset:0;background:rgba(2,6,23,.72);display:none;align-items:center;justify-content:center;z-index:9999;padding:16px}.catalog-modal{width:min(980px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:22px;box-shadow:0 25px 80px rgba(0,0,0,.28)}.catalog-modal header{padding:22px 22px 12px;border-bottom:1px solid #e5e7eb;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.catalog-modal .body{padding:20px 22px 22px}.catalog-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.catalog-field label{display:block;font-weight:700;margin-bottom:6px;color:#0f172a}.catalog-field input,.catalog-field select,.catalog-field textarea{width:100%;border:1px solid #cbd5e1;border-radius:12px;padding:11px 12px;font:inherit}.catalog-field textarea{min-height:180px;resize:vertical}.catalog-preview{margin-top:16px;border:1px solid #e2e8f0;border-radius:16px;padding:14px;background:#f8fafc}.catalog-preview-list{max-height:260px;overflow:auto;display:grid;gap:8px}.catalog-preview-item{padding:10px 12px;background:#fff;border:1px solid #e2e8f0;border-radius:12px}.catalog-footer{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-top:18px}.catalog-small{font-size:.9rem;color:#475569}.catalog-success{background:#ecfdf5;border:1px solid #86efac;color:#166534;padding:10px 12px;border-radius:12px;margin-top:12px}.catalog-warning{background:#fff7ed;border:1px solid #fdba74;color:#9a3412;padding:10px 12px;border-radius:12px;margin-top:12px}@media (max-width:820px){.catalog-hero,.catalog-grid{grid-template-columns:1fr}.catalog-actions{justify-content:flex-start}}';
    document.head.appendChild(style);
  }

  function ensureModal() {
    if (document.getElementById('catalog-community-modal')) return;
    const overlay = document.createElement('div');
    overlay.id = 'catalog-community-modal';
    overlay.className = 'catalog-modal-overlay';
    overlay.innerHTML = '\n      <div class="catalog-modal">\n        <header>\n          <div>\n            <h2>Catálogo inteligente de grade curricular</h2>\n            <p>Importe o curso pronto, aproveite grades já cadastradas por outros alunos ou cole um fluxograma em texto.</p>\n          </div>\n          <button type="button" class="catalog-btn secondary" id="catalog-modal-close">Fechar</button>\n        </header>\n        <div class="body">\n          <div class="catalog-grid">\n            <div class="catalog-field"><label for="catalog-faculdade">Faculdade</label><input id="catalog-faculdade" type="text" placeholder="Ex: UFOB"></div>\n            <div class="catalog-field"><label for="catalog-curso">Curso</label><input id="catalog-curso" type="text" placeholder="Ex: Engenharia Civil"></div>\n          </div>\n          <div class="catalog-grid" style="margin-top:14px">\n            <div class="catalog-field"><label for="catalog-semestre-base">Semestre atual do aluno</label><select id="catalog-semestre-base"><option value="">Sem definir</option>' + Array.from({ length: 12 }, function (_, i) { return '<option value="' + (i + 1) + '">' + (i + 1) + 'º semestre</option>'; }).join('') + '</select></div>\n            <div class="catalog-field"><label for="catalog-action-mode">Modo</label><select id="catalog-action-mode"><option value="load">Buscar grade da comunidade</option><option value="paste">Importar de texto/fluxograma</option><option value="share">Compartilhar minha grade atual</option></select></div>\n          </div>\n          <div id="catalog-paste-area" class="catalog-field" style="margin-top:14px;display:none">\n            <label for="catalog-paste-text">Cole aqui o texto do PDF/site/fluxograma</label>\n            <textarea id="catalog-paste-text"></textarea>\n          </div>\n          <div class="catalog-preview" id="catalog-preview"><div class="catalog-small">Selecione uma ação e gere a prévia.</div></div>\n          <div class="catalog-footer">\n            <div class="catalog-small" id="catalog-feedback">O sistema une sua grade pessoal com o catálogo comunitário sem apagar o que você já organizou.</div>\n            <div style="display:flex;gap:10px;flex-wrap:wrap">\n              <button type="button" class="catalog-btn secondary" id="catalog-generate-preview">Gerar prévia</button>\n              <button type="button" class="catalog-btn primary" id="catalog-apply-action">Aplicar</button>\n            </div>\n          </div>\n        </div>\n      </div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) hideModal(); });
    document.getElementById('catalog-modal-close').addEventListener('click', hideModal);
    document.getElementById('catalog-action-mode').addEventListener('change', updateModeUI);
  }

  function showModal(prefill) {
    ensureModal();
    const overlay = document.getElementById('catalog-community-modal');
    const app = window.app;
    document.getElementById('catalog-faculdade').value = (prefill && prefill.faculdade) || (app && app.data && app.data.user && app.data.user.universidade) || '';
    document.getElementById('catalog-curso').value = (prefill && prefill.curso) || (app && app.data && app.data.user && app.data.user.curso) || '';
    document.getElementById('catalog-semestre-base').value = (prefill && prefill.semestre) || (app && app.data && app.data.user && app.data.user.semestre) || '';
    document.getElementById('catalog-action-mode').value = (prefill && prefill.mode) || 'load';
    document.getElementById('catalog-paste-text').value = '';
    updateModeUI();
    document.getElementById('catalog-preview').innerHTML = '<div class="catalog-small">Clique em "Gerar prévia" para ver o que será importado ou compartilhado.</div>';
    overlay.style.display = 'flex';
  }

  function hideModal() { const overlay = document.getElementById('catalog-community-modal'); if (overlay) overlay.style.display = 'none'; }
  function updateModeUI() { const mode = document.getElementById('catalog-action-mode').value; const paste = document.getElementById('catalog-paste-area'); if (paste) paste.style.display = mode === 'paste' ? 'block' : 'none'; }
  function currentCatalogTemplate(faculdade, curso) { return COMMUNITY_BOOTSTRAP[catalogKey(faculdade, curso)] || null; }

  async function handleGeneratePreview() {
    const faculdade = document.getElementById('catalog-faculdade').value.trim();
    const curso = document.getElementById('catalog-curso').value.trim();
    const mode = document.getElementById('catalog-action-mode').value;
    const semester = document.getElementById('catalog-semestre-base').value;
    const preview = document.getElementById('catalog-preview');
    const feedback = document.getElementById('catalog-feedback');
    const app = window.app;
    if (!faculdade || !curso) { preview.innerHTML = '<div class="catalog-warning">Preencha faculdade e curso primeiro.</div>'; return null; }
    let items = [];
    if (mode === 'load') {
      const catalog = await window.dbService.getCommunityCatalog(faculdade, curso);
      items = dedupeCurriculum((catalog && catalog.subjects) || [], true);
      if (!items.length) {
        preview.innerHTML = '<div class="catalog-warning">Ainda não existe uma grade comunitária forte para esse curso.</div>';
        feedback.textContent = 'Sem catálogo encontrado. Você ainda pode criar a primeira versão comunitária.';
        return { mode: mode, items: [] };
      }
      preview.innerHTML = buildPreviewHtml(items) + '<div class="catalog-success">Catálogo encontrado para ' + escapeHtml(curso) + ' em ' + escapeHtml(faculdade) + '.</div>';
      feedback.textContent = items.length + ' componentes prontos para entrar na sua grade pessoal.';
      return { mode: mode, items: items, faculdade: faculdade, curso: curso, semester: semester };
    }
    if (mode === 'paste') {
      items = parseTextToCurriculum(document.getElementById('catalog-paste-text').value, semester);
      preview.innerHTML = buildPreviewHtml(items);
      feedback.textContent = items.length ? 'Encontrados ' + items.length + ' componentes a partir do texto colado.' : 'Nenhum componente identificado ainda.';
      return { mode: mode, items: items, faculdade: faculdade, curso: curso, semester: semester };
    }
    if (mode === 'share') {
      items = neutralizeForCommunity(app && app.data && app.data.curriculum || []);
      preview.innerHTML = buildPreviewHtml(items) + '<div class="catalog-success">Sua grade atual será enviada como contribuição neutra para ' + escapeHtml(curso) + ' em ' + escapeHtml(faculdade) + '.</div>';
      feedback.textContent = items.length ? items.length + ' componentes serão compartilhados sem status pessoal.' : 'Sua grade atual ainda está vazia.';
      return { mode: mode, items: items, faculdade: faculdade, curso: curso, semester: semester };
    }
    return null;
  }

  async function saveAppData(app) {
    if (!window.dbService || !app) return;
    try {
      if (typeof window.dbService.saveAllData === 'function') await window.dbService.saveAllData(app.data);
      else if (typeof window.dbService.saveData === 'function') {
        const keys = Object.keys(app.data || {});
        for (let i = 0; i < keys.length; i++) await window.dbService.saveData(keys[i], app.data[keys[i]]);
      }
    } catch (error) { console.error('Erro ao salvar dados do app:', error); }
  }

  async function syncCurrentCurriculumToCommunity(params) {
    const faculdade = params && params.faculdade || '';
    const curso = params && params.curso || '';
    const mode = params && params.mode || 'manual';
    const app = window.app;
    if (!app || !faculdade || !curso || !window.dbService) return;
    ensureUserDataCompatibility(app);
    const userCurriculum = neutralizeForCommunity(app.data.curriculum || []);
    if (!userCurriculum.length) return;
    await window.dbService.submitCommunityContribution(faculdade, curso, userCurriculum, {
      version: app.data.user.matrizVersion || '',
      semester: app.data.user.semestre || '',
      mode: mode
    });
    const existing = await window.dbService.getCommunityCatalog(faculdade, curso);
    const merged = neutralizeForCommunity([].concat((existing && existing.subjects) || [], userCurriculum));
    await window.dbService.saveCommunityCatalog(faculdade, curso, merged, {
      version: app.data.user.matrizVersion || '',
      confidence: existing && existing.subjects && existing.subjects.length ? 0.72 : 0.6,
      usersCount: ((existing && existing.stats && existing.stats.usersCount) || 0) + 1
    });
    if (window.showToast) window.showToast('Sua grade foi compartilhada para fortalecer o catálogo comunitário.', 'success');
  }

  async function handleApplyAction() {
    const data = await handleGeneratePreview();
    const app = window.app;
    if (!data || !app) return;
    ensureUserDataCompatibility(app);
    if (data.mode === 'load' || data.mode === 'paste') {
      if (!data.items.length) { if (window.showToast) window.showToast('Nada para importar ainda.', 'warning'); return; }
      mergeIntoUserCurriculum(app, data.items, catalogKey(data.faculdade, data.curso));
      maybePopulateSubjectsFromSemester(app);
      app.data.user.universidade = data.faculdade;
      app.data.user.curso = data.curso;
      if (data.semester && !app.data.user.semestre) app.data.user.semestre = data.semester;
      await saveAppData(app);
      if (typeof app.loadView === 'function') app.loadView('grade-curricular');
      hideModal();
      if (window.showToast) window.showToast('Grade importada com ' + data.items.length + ' componentes.', 'success');
      if (data.mode === 'paste') await syncCurrentCurriculumToCommunity({ faculdade: data.faculdade, curso: data.curso, mode: 'paste' });
      return;
    }
    if (data.mode === 'share') {
      if (!data.items.length) { if (window.showToast) window.showToast('Sua grade ainda está vazia.', 'warning'); return; }
      await syncCurrentCurriculumToCommunity({ faculdade: data.faculdade, curso: data.curso, mode: 'share' });
      hideModal();
    }
  }

  function patchViewRenderer() {
    if (!window.ViewRenderer || window.ViewRenderer.prototype.__communityCatalogPatched) return;
    const proto = window.ViewRenderer.prototype;
    const originalRenderGradeCurricular = proto.renderGradeCurricular;
    if (typeof originalRenderGradeCurricular === 'function') {
      proto.renderGradeCurricular = function () {
        const original = originalRenderGradeCurricular.call(this);
        const faculdade = this.app && this.app.data && this.app.data.user && this.app.data.user.universidade || 'sua faculdade';
        const curso = this.app && this.app.data && this.app.data.user && this.app.data.user.curso || 'seu curso';
        const hero = '<section class="catalog-hero"><div><h3>Catálogo comunitário da grade curricular</h3><p>O site pode aprender com as grades cadastradas pelos usuários. Assim, quem informar <strong>' + escapeHtml(curso) + '</strong> em <strong>' + escapeHtml(faculdade) + '</strong> já encontra boa parte da estrutura pronta.</p><div class="catalog-badges"><span class="catalog-badge">Importar por faculdade + curso</span><span class="catalog-badge">Compartilhar sua grade</span><span class="catalog-badge">Colar texto do fluxograma</span></div></div><div class="catalog-actions"><button class="catalog-btn secondary" id="btn-community-load">Buscar grade pronta</button><button class="catalog-btn primary" id="btn-community-share">Compartilhar minha grade</button><button class="catalog-btn ghost" id="btn-community-paste">Colar texto/PDF</button></div></section>';
        return hero + original;
      };
    }
    window.ViewRenderer.prototype.__communityCatalogPatched = true;
  }

  function patchApp() {
    if (!window.StudyLifeControl || window.StudyLifeControl.prototype.__communityCatalogPatched) return;
    const proto = window.StudyLifeControl.prototype;

    if (typeof proto.init === 'function') {
      const originalInit = proto.init;
      proto.init = async function () {
        const result = await originalInit.apply(this, arguments);
        ensureUserDataCompatibility(this);
        return result;
      };
    }

    if (typeof proto.handleSetupSubmit === 'function') {
      const originalHandleSetupSubmit = proto.handleSetupSubmit;
      proto.handleSetupSubmit = async function (e) {
        await originalHandleSetupSubmit.call(this, e);
        try {
          ensureUserDataCompatibility(this);
          const faculdade = this.data.user.universidade;
          const curso = this.data.user.curso;
          if (!faculdade || !curso) return;
          if (ensureArray(this.data.curriculum).length) return;
          const catalog = await window.dbService.getCommunityCatalog(faculdade, curso);
          if (!catalog || !catalog.subjects || !catalog.subjects.length) return;
          mergeIntoUserCurriculum(this, catalog.subjects, catalog.key);
          maybePopulateSubjectsFromSemester(this);
          await saveAppData(this);
          if (this.currentView === 'grade-curricular' || this.currentView === 'dashboard') this.loadView(this.currentView);
          if (window.showToast) window.showToast('Grade pronta importada automaticamente para ' + curso + '.', 'success');
        } catch (error) { console.error('Erro ao importar catálogo no setup:', error); }
      };
    }

    if (typeof proto.setupViewEvents === 'function') {
      const originalSetupViewEvents = proto.setupViewEvents;
      proto.setupViewEvents = function (view) {
        originalSetupViewEvents.call(this, view);
        if (view === 'grade-curricular') {
          const loadBtn = document.getElementById('btn-community-load');
          const pasteBtn = document.getElementById('btn-community-paste');
          const shareBtn = document.getElementById('btn-community-share');
          if (loadBtn) loadBtn.onclick = function () { showModal({ mode: 'load' }); };
          if (pasteBtn) pasteBtn.onclick = function () { showModal({ mode: 'paste' }); };
          if (shareBtn) shareBtn.onclick = function () { showModal({ mode: 'share' }); };
        }
      };
    }

    window.StudyLifeControl.prototype.__communityCatalogPatched = true;
  }

  function bindModalActions() {
    ensureModal();
    const previewBtn = document.getElementById('catalog-generate-preview');
    const applyBtn = document.getElementById('catalog-apply-action');
    if (previewBtn && !previewBtn.__catalogBound) { previewBtn.addEventListener('click', handleGeneratePreview); previewBtn.__catalogBound = true; }
    if (applyBtn && !applyBtn.__catalogBound) { applyBtn.addEventListener('click', handleApplyAction); applyBtn.__catalogBound = true; }
  }

  function init() {
    injectStyles();
    attachDbExtensions();
    patchViewRenderer();
    patchApp();
    bindModalActions();
    if (window.app) ensureUserDataCompatibility(window.app);
  }

  document.addEventListener('DOMContentLoaded', init);
  document.addEventListener('app-ready', init);

  window.communityCatalogTools = {
    slugify: slugify,
    normalizeName: normalizeName,
    parseTextToCurriculum: parseTextToCurriculum,
    dedupeCurriculum: dedupeCurriculum,
    showModal: showModal,
    syncCurrentCurriculumToCommunity: syncCurrentCurriculumToCommunity,
    ensureUserDataCompatibility: ensureUserDataCompatibility,
    neutralizeForCommunity: neutralizeForCommunity
  };
})();
