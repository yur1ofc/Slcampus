// grade-ia-import.js
// Importação de grade curricular por IA usando Google Gemini (GRATUITO — 1500 req/dia)
// Sem precisar do ChatGPT. Sem custo algum.
//
// Como ativar:
// 1. Acesse https://aistudio.google.com/apikey e crie uma chave gratuita (só precisa de conta Google)
// 2. Cole a chave em env-config.js no campo GEMINI_API_KEY
// 3. No Vercel: Settings → Environment Variables → GEMINI_API_KEY
//
// Adicione no index.html ANTES do </body>:
//   <script src="grade-ia-import.js"></script>

(function () {
  'use strict';

  const GEMINI_MODEL = 'gemini-2.0-flash';

  const GRADE_PROMPT = `Leia o conteúdo fornecido (PDF, imagem de fluxograma ou texto com disciplinas) e retorne SOMENTE um JSON válido, sem texto antes ou depois, sem markdown, sem blocos de código.

Formato obrigatório:
{
  "faculdade": "Nome da faculdade ou string vazia",
  "curso": "Nome do curso ou string vazia",
  "disciplinas": [
    {
      "nome": "Nome da disciplina",
      "codigo": "Código ou string vazia",
      "semestre": 1,
      "cargaHoraria": 60,
      "creditos": 4,
      "prerequisitos": ["Nome de disciplina anterior"],
      "tipo": "obrigatoria"
    }
  ]
}

Regras:
- Retorne APENAS JSON puro. Absolutamente nada mais.
- "semestre" deve ser número inteiro. Se não encontrar, use 0.
- "cargaHoraria" e "creditos" devem ser números. Se não encontrar, use 0.
- "prerequisitos" é lista de nomes. Se não houver, use [].
- "tipo" pode ser "obrigatoria", "optativa", "eletiva" ou "extensao".
- Não invente disciplinas. Extraia somente o que estiver no conteúdo.`;

  // ─── Conversão de arquivo ──────────────────────────────────────────────────

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = () => reject(new Error('Falha ao ler o arquivo'));
      reader.readAsDataURL(file);
    });
  }

  function getMimeType(file) {
    if (file.type) return file.type;
    const ext = (file.name || '').split('.').pop().toLowerCase();
    const map = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' };
    return map[ext] || 'application/octet-stream';
  }

  // ─── Chamada ao Gemini ─────────────────────────────────────────────────────

  async function callGemini(parts) {
    // Chama o proxy seguro no Vercel — a chave fica no servidor, nunca no browser
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const msg = err?.error?.message || `Erro HTTP ${response.status}`;
      throw new Error(msg);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/```json|```/gi, '').trim();

    try {
      return JSON.parse(clean);
    } catch {
      throw new Error('A IA retornou um formato inesperado. Tente novamente ou use o modo texto.');
    }
  }

  // ─── Aplicar resultado ao app ──────────────────────────────────────────────

  function applyGradeResult(parsed, targetContext) {
    const app = window.app;
    if (!app) return { count: 0, error: 'App não encontrado.' };

    const disciplinas = parsed?.disciplinas || [];
    if (!disciplinas.length) return { count: 0, error: 'Nenhuma disciplina encontrada no arquivo.' };

    function makeId() {
      return typeof generateId === 'function' ? generateId() : Math.random().toString(36).slice(2, 10);
    }

    function normalizeItem(d) {
      const item = {
        id: makeId(),
        nome: d.nome || '',
        codigo: d.codigo || '',
        semestre: d.semestre || 0,
        cargaHoraria: Number(d.cargaHoraria) || 0,
        creditos: Number(d.creditos) || 0,
        tipo: d.tipo || 'obrigatoria',
        prerequisitosLista: Array.isArray(d.prerequisitos) ? d.prerequisitos : [],
        prerequisitos: Array.isArray(d.prerequisitos) ? d.prerequisitos.join(' | ') : '',
        status: 'nao-cursada',
        observacoes: ''
      };
      return app.normalizeCurriculumItem ? app.normalizeCurriculumItem(item) : item;
    }

    if (targetContext === 'setup') {
      const curriculum = disciplinas.map(normalizeItem);
      app.pendingSetupImportedCurriculum = curriculum;

      const semester = document.getElementById('semestre')?.value || '';
      const semesterSubjects = curriculum
        .filter(item => String(item.semestre || '') === String(semester))
        .map(item => ({ id: item.id, nome: item.nome, dificuldade: 3, peso: item.tipo === 'obrigatoria' ? 4 : 3, notaDesejada: 7 }));

      if (semesterSubjects.length && app.populateSetupSubjects) {
        app.populateSetupSubjects(semesterSubjects);
      }

      return { count: curriculum.length, semesterCount: semesterSubjects.length };
    }

    // Grade curricular: merge inteligente
    if (!Array.isArray(app.data.curriculum)) app.data.curriculum = [];
    const existingMap = new Map(
      app.data.curriculum.map(item => [(item.nome || '').toLowerCase().replace(/\s+/g, ''), item])
    );

    let added = 0;
    disciplinas.forEach(d => {
      const key = (d.nome || '').toLowerCase().replace(/\s+/g, '');
      if (!key) return;
      if (existingMap.has(key)) {
        const target = existingMap.get(key);
        if (!target.semestre && d.semestre) target.semestre = d.semestre;
        if (!target.cargaHoraria && d.cargaHoraria) target.cargaHoraria = Number(d.cargaHoraria);
        if (!target.creditos && d.creditos) target.creditos = Number(d.creditos);
      } else {
        app.data.curriculum.push(normalizeItem(d));
        added++;
      }
    });

    if (typeof dbService !== 'undefined') dbService.saveData('curriculum', app.data.curriculum);
    if (app.loadView) app.loadView('grade-curricular');

    return { count: disciplinas.length, added };
  }

  // ─── Modal de importação ───────────────────────────────────────────────────

  function createImportModal(targetContext) {
    document.getElementById('slc-grade-ia-modal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'slc-grade-ia-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.52);display:flex;align-items:center;justify-content:center;padding:1rem;';

    modal.innerHTML = `
      <div style="background:#fff;border-radius:16px;width:100%;max-width:540px;box-shadow:0 8px 40px rgba(0,0,0,.22);overflow:hidden;">
        <div style="background:linear-gradient(135deg,#1a73e8,#4f46e5);padding:1.25rem 1.5rem;display:flex;align-items:center;gap:.75rem;">
          <i class="fas fa-wand-magic-sparkles" style="color:#fff;font-size:1.25rem;"></i>
          <div style="flex:1">
            <h3 style="margin:0;color:#fff;font-size:1rem;font-weight:600;">Importar grade com IA</h3>
            <p style="margin:0;color:rgba(255,255,255,.8);font-size:.78rem;">Google Gemini • Grátis • Sem limite de uso diário para este projeto</p>
          </div>
          <button id="slc-gim-close" style="background:rgba(255,255,255,.2);border:none;border-radius:8px;padding:5px 10px;color:#fff;cursor:pointer;">✕</button>
        </div>

        <div style="padding:1.5rem;">
          <div style="display:flex;gap:.5rem;margin-bottom:1.25rem;">
            <button class="slc-gim-tab slc-gim-tab-on" data-tab="arquivo" style="flex:1;padding:.5rem;border-radius:8px;border:1.5px solid #1a73e8;background:#e8f0fe;color:#1a73e8;cursor:pointer;font-size:.83rem;font-weight:500;">
              <i class="fas fa-file-upload"></i> PDF ou imagem
            </button>
            <button class="slc-gim-tab" data-tab="texto" style="flex:1;padding:.5rem;border-radius:8px;border:1px solid #e2e8f0;background:#fff;color:#64748b;cursor:pointer;font-size:.83rem;">
              <i class="fas fa-align-left"></i> Colar texto
            </button>
          </div>

          <div id="slc-gim-tab-arquivo">
            <div id="slc-gim-dropzone" style="border:2px dashed #cbd5e1;border-radius:12px;padding:2rem;text-align:center;cursor:pointer;background:#f8fafc;transition:all .2s;">
              <i class="fas fa-cloud-upload-alt" style="font-size:2rem;color:#94a3b8;display:block;margin-bottom:.5rem;"></i>
              <p style="margin:0 0 .2rem;font-weight:500;color:#475569;">Arraste o PDF ou foto do fluxograma</p>
              <p style="margin:0;font-size:.78rem;color:#94a3b8;">ou clique para escolher · PDF, PNG, JPG, WEBP</p>
              <input type="file" id="slc-gim-file-input" accept=".pdf,.png,.jpg,.jpeg,.webp" style="display:none;">
            </div>
            <div id="slc-gim-preview" style="display:none;margin-top:.75rem;padding:.65rem 1rem;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;align-items:center;gap:.5rem;">
              <i class="fas fa-file-check" style="color:#16a34a;"></i>
              <span id="slc-gim-fname" style="font-size:.83rem;color:#166534;flex:1;"></span>
              <button id="slc-gim-fremove" style="background:none;border:none;color:#ef4444;cursor:pointer;">✕</button>
            </div>
          </div>

          <div id="slc-gim-tab-texto" style="display:none;">
            <label style="font-size:.83rem;font-weight:500;color:#374151;display:block;margin-bottom:.4rem;">Cole o texto da grade (site da faculdade, PDF copiado, etc.):</label>
            <textarea id="slc-gim-texto" rows="8" placeholder="1º Semestre&#10;Cálculo I - 60h&#10;Geometria Analítica - 90h&#10;&#10;2º Semestre&#10;Cálculo II - 60h&#10;Física I - 60h" style="width:100%;box-sizing:border-box;border:1px solid #e2e8f0;border-radius:8px;padding:.7rem;font-size:.83rem;font-family:inherit;resize:vertical;outline:none;"></textarea>
          </div>

          <div id="slc-gim-status" style="display:none;margin-top:1rem;padding:.7rem 1rem;border-radius:8px;font-size:.83rem;"></div>

          <button id="slc-gim-run" style="width:100%;margin-top:1rem;padding:.75rem;background:#1a73e8;color:#fff;border:none;border-radius:10px;font-size:.93rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:.5rem;">
            <i class="fas fa-magic"></i> Importar com IA (grátis)
          </button>

          <p style="text-align:center;font-size:.73rem;color:#94a3b8;margin:.65rem 0 0;">
            Powered by Google Gemini · 1.500 usos/dia grátis · Nenhum dado é armazenado pelo Google além de 48h
          </p>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    let selectedFile = null;
    let activeTab = 'arquivo';

    // Fechar
    modal.querySelector('#slc-gim-close').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    // Tabs
    modal.querySelectorAll('.slc-gim-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.dataset.tab;
        modal.querySelectorAll('.slc-gim-tab').forEach(b => {
          const on = b.dataset.tab === activeTab;
          b.style.border = on ? '1.5px solid #1a73e8' : '1px solid #e2e8f0';
          b.style.background = on ? '#e8f0fe' : '#fff';
          b.style.color = on ? '#1a73e8' : '#64748b';
        });
        modal.querySelector('#slc-gim-tab-arquivo').style.display = activeTab === 'arquivo' ? 'block' : 'none';
        modal.querySelector('#slc-gim-tab-texto').style.display = activeTab === 'texto' ? 'block' : 'none';
      });
    });

    // Drag & drop
    const dropzone = modal.querySelector('#slc-gim-dropzone');
    const fileInput = modal.querySelector('#slc-gim-file-input');
    const preview = modal.querySelector('#slc-gim-preview');
    const fname = modal.querySelector('#slc-gim-fname');

    dropzone.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.style.background = '#e8f0fe'; dropzone.style.borderColor = '#1a73e8'; });
    dropzone.addEventListener('dragleave', () => { dropzone.style.background = '#f8fafc'; dropzone.style.borderColor = '#cbd5e1'; });
    dropzone.addEventListener('drop', e => {
      e.preventDefault();
      dropzone.style.background = '#f8fafc'; dropzone.style.borderColor = '#cbd5e1';
      if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => { if (fileInput.files[0]) setFile(fileInput.files[0]); });

    function setFile(file) {
      selectedFile = file;
      fname.textContent = file.name;
      preview.style.display = 'flex';
      dropzone.style.display = 'none';
    }

    modal.querySelector('#slc-gim-fremove').addEventListener('click', () => {
      selectedFile = null; fileInput.value = '';
      preview.style.display = 'none'; dropzone.style.display = 'block';
    });

    // Processar
    const btn = modal.querySelector('#slc-gim-run');
    const statusEl = modal.querySelector('#slc-gim-status');

    function setStatus(html, type) {
      const cfg = {
        loading: ['#eff6ff','#bfdbfe','#1e40af'],
        success: ['#f0fdf4','#bbf7d0','#166534'],
        error:   ['#fef2f2','#fecaca','#991b1b']
      };
      const [bg, border, color] = cfg[type] || cfg.loading;
      statusEl.style.cssText = `display:block;background:${bg};border:1px solid ${border};color:${color};padding:.7rem 1rem;border-radius:8px;font-size:.83rem;margin-top:1rem;`;
      statusEl.innerHTML = html;
    }

    btn.addEventListener('click', async () => {
      statusEl.style.display = 'none';
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';

      try {
        let parts;

        if (activeTab === 'arquivo') {
          if (!selectedFile) throw new Error('Selecione um PDF ou imagem primeiro.');
          const mime = getMimeType(selectedFile);
          const isPdf = mime === 'application/pdf';
          const isImg = mime.startsWith('image/');
          if (!isPdf && !isImg) throw new Error('Formato não suportado. Use PDF, PNG, JPG ou WEBP.');

          setStatus('<i class="fas fa-spinner fa-spin"></i> Lendo o arquivo com Gemini...', 'loading');
          const b64 = await fileToBase64(selectedFile);

          parts = [
            { text: GRADE_PROMPT },
            { inline_data: { mime_type: mime, data: b64 } }
          ];
        } else {
          const text = modal.querySelector('#slc-gim-texto').value.trim();
          if (!text) throw new Error('Cole o texto da grade primeiro.');
          setStatus('<i class="fas fa-spinner fa-spin"></i> Interpretando com Gemini...', 'loading');
          parts = [{ text: GRADE_PROMPT + '\n\nConteúdo da grade:\n\n' + text }];
        }

        const result = await callGemini(parts);
        const applied = applyGradeResult(result, targetContext);

        if (applied.error) throw new Error(applied.error);

        const extra = applied.semesterCount > 0
          ? `<br><small style="opacity:.8">${applied.semesterCount} matéria(s) do semestre atual preenchidas.</small>` : '';

        setStatus(`<i class="fas fa-check-circle"></i> <strong>${applied.count} disciplinas importadas!</strong>${extra}`, 'success');
        btn.innerHTML = '<i class="fas fa-check"></i> Concluído!';
        btn.style.background = '#16a34a';
        if (typeof showToast === 'function') showToast(`${applied.count} disciplinas importadas com IA!`, 'success');
        setTimeout(() => modal.remove(), 2000);

      } catch (err) {
        setStatus(`<i class="fas fa-exclamation-circle"></i> ${err.message}`, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-magic"></i> Tentar novamente';
        btn.style.background = '#1a73e8';
      }
    });
  }

  // ─── API pública ────────────────────────────────────────────────────────────

  window.GradeIAImport = {
    openModal(ctx) { createImportModal(ctx || 'grade'); }
  };

  // ─── Substituir botão "Importar grade pronta" → modal de IA ───────────────

  function patchLoadView() {
    if (!window.StudyLifeControl || StudyLifeControl.prototype.__gradeIAPatched) return;
    StudyLifeControl.prototype.__gradeIAPatched = true;

    const _orig = StudyLifeControl.prototype.loadView;
    StudyLifeControl.prototype.loadView = function (view) {
      const r = _orig.call(this, view);
      if (view === 'grade-curricular') {
        setTimeout(() => {
          const btn = document.getElementById('btn-importar-ufob');
          if (btn && !btn.dataset.iaPatch) {
            btn.dataset.iaPatch = '1';
            btn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Importar com IA (grátis)';
            const nb = btn.cloneNode(true);
            btn.parentNode.replaceChild(nb, btn);
            nb.addEventListener('click', () => window.GradeIAImport.openModal('grade'));
          }
        }, 100);
      }
      return r;
    };
  }

  // ─── Botão extra no setup ──────────────────────────────────────────────────

  new MutationObserver(() => {
    const section = document.getElementById('setup-smart-import-section');
    if (!section || section.dataset.iaBtnAdded) return;
    section.dataset.iaBtnAdded = '1';

    const helper = section.querySelector('.setup-import-chatgpt-card');
    if (!helper) return;

    const iaBtn = document.createElement('button');
    iaBtn.type = 'button';
    iaBtn.className = 'btn-primary';
    iaBtn.style.cssText = 'background:linear-gradient(135deg,#1a73e8,#4f46e5);border:none;margin-bottom:.5rem;width:100%;';
    iaBtn.innerHTML = '<i class="fas fa-magic"></i> Importar PDF ou imagem com IA (grátis, automático)';
    iaBtn.addEventListener('click', () => window.GradeIAImport.openModal('setup'));
    helper.insertBefore(iaBtn, helper.querySelector('.setup-import-actions'));

    const p = helper.querySelector('p');
    if (p) p.textContent = 'Envie o PDF ou imagem da grade e a IA extrai tudo automaticamente. Ou use o método manual abaixo.';
  }).observe(document.body, { childList: true, subtree: true });

  document.addEventListener('app-ready', () => setTimeout(patchLoadView, 300));
  if (window.app?.initialized) setTimeout(patchLoadView, 100);

})();
