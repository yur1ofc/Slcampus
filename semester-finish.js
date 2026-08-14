// semester-finish.js - Assistente "Finalizar Semestre"
// Permite ao usuário encerrar o semestre atual: marcar cada matéria como
// aprovada/reprovada, registrar a média final de cada uma e, em seguida,
// escolher quais disciplinas cursará no próximo semestre.
(function () {
    'use strict';

    function slug(value) {
        return String(value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    }

    function injectStyles() {
        if (document.getElementById('semfin-styles')) return;
        const style = document.createElement('style');
        style.id = 'semfin-styles';
        style.textContent = `
            .semfin-overlay{position:fixed;inset:0;background:rgba(2,6,23,.72);display:flex;align-items:center;justify-content:center;z-index:10000;padding:16px;}
            .semfin-modal{width:min(720px,100%);max-height:92vh;overflow:auto;background:var(--bg-card,#fff);color:var(--text-primary,#0f172a);border-radius:20px;box-shadow:0 25px 80px rgba(0,0,0,.35);}
            .semfin-header{padding:20px 22px;border-bottom:1px solid var(--border,#e5e7eb);display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
            .semfin-header h2{margin:0 0 4px;font-size:1.2rem;}
            .semfin-header p{margin:0;opacity:.75;font-size:.92rem;}
            .semfin-close{cursor:pointer;font-size:1.4rem;line-height:1;opacity:.6;background:none;border:none;color:inherit;}
            .semfin-close:hover{opacity:1;}
            .semfin-body{padding:20px 22px;}
            .semfin-steps{display:flex;gap:8px;margin-bottom:16px;}
            .semfin-step-dot{flex:1;height:6px;border-radius:999px;background:var(--border,#e2e8f0);}
            .semfin-step-dot.active{background:var(--accent-primary,#2563eb);}
            .semfin-empty{padding:24px;text-align:center;opacity:.7;}
            .semfin-row{border:1px solid var(--border,#e2e8f0);border-radius:14px;padding:14px;margin-bottom:12px;}
            .semfin-row-head strong{display:block;font-size:1rem;}
            .semfin-row-head small{opacity:.65;}
            .semfin-row-controls{display:flex;flex-wrap:wrap;gap:14px;align-items:flex-end;margin-top:10px;}
            .semfin-toggle{display:flex;gap:8px;}
            .semfin-pill{border:1px solid var(--border,#cbd5e1);background:transparent;color:inherit;border-radius:999px;padding:8px 14px;font-weight:600;cursor:pointer;font-size:.88rem;}
            .semfin-pill[data-choice="aprovado"].active{background:rgba(34,197,94,.16);border-color:#22c55e;color:#16a34a;}
            .semfin-pill[data-choice="reprovado"].active{background:rgba(239,68,68,.16);border-color:#ef4444;color:#dc2626;}
            .semfin-nota-field{display:flex;flex-direction:column;gap:4px;}
            .semfin-nota-field label{font-size:.82rem;font-weight:600;opacity:.75;}
            .semfin-nota-field input{width:100px;border:1px solid var(--border,#cbd5e1);border-radius:10px;padding:8px 10px;font:inherit;background:var(--bg-input,#fff);color:inherit;}
            .semfin-nota-field input.semfin-invalid{border-color:#ef4444;}
            .semfin-candidate{display:flex;align-items:flex-start;gap:12px;border:1px solid var(--border,#e2e8f0);border-radius:14px;padding:12px 14px;margin-bottom:10px;}
            .semfin-candidate.blocked{opacity:.55;}
            .semfin-candidate input[type="checkbox"]{margin-top:4px;width:18px;height:18px;}
            .semfin-candidate-info{flex:1;}
            .semfin-candidate-info strong{display:block;}
            .semfin-candidate-info small{opacity:.65;display:block;margin-top:2px;}
            .semfin-tag{display:inline-block;font-size:.72rem;font-weight:700;padding:2px 8px;border-radius:999px;margin-top:6px;margin-right:6px;}
            .semfin-tag.recomendada{background:rgba(37,99,235,.14);color:#2563eb;}
            .semfin-tag.repescagem{background:rgba(239,68,68,.14);color:#dc2626;}
            .semfin-tag.bloqueada{background:rgba(148,163,184,.2);color:#64748b;}
            .semfin-group-title{font-weight:700;margin:16px 0 8px;opacity:.8;}
            .semfin-summary{background:var(--bg-soft,#f8fafc);border-radius:14px;padding:14px;margin-bottom:16px;font-size:.92rem;}
            .semfin-footer{display:flex;justify-content:space-between;gap:10px;padding:16px 22px 22px;border-top:1px solid var(--border,#e5e7eb);}
            .semfin-footer-right{display:flex;gap:10px;}
        `;
        document.head.appendChild(style);
    }

    function closeModal() {
        document.getElementById('semfin-overlay')?.remove();
    }

    function ensureOverlay() {
        let overlay = document.getElementById('semfin-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'semfin-overlay';
            overlay.className = 'semfin-overlay';
            overlay.addEventListener('click', e => {
                if (e.target === overlay) closeModal();
            });
            document.body.appendChild(overlay);
        }
        return overlay;
    }

    function stepDots(step) {
        return `
            <div class="semfin-steps">
                <div class="semfin-step-dot ${step >= 1 ? 'active' : ''}"></div>
                <div class="semfin-step-dot ${step >= 2 ? 'active' : ''}"></div>
            </div>
        `;
    }

    // ---------- PASSO 1: aprovação/reprovação + média ----------
    function renderStep1(app) {
        const state = app._semFinState;
        const overlay = ensureOverlay();

        overlay.innerHTML = `
            <div class="semfin-modal">
                <div class="semfin-header">
                    <div>
                        <h2><i class="fas fa-flag-checkered"></i> Finalizar Semestre</h2>
                        <p>Passo 1 de 2 — Marque o resultado de cada matéria que você estava cursando e informe a média final.</p>
                    </div>
                    <button type="button" class="semfin-close" id="semfin-close-btn">&times;</button>
                </div>
                <div class="semfin-body">
                    ${stepDots(1)}
                    ${state.cursando.map(item => {
                        const result = state.resultados[item.id] || { aprovado: true, nota: item.nota ?? '' };
                        return `
                            <div class="semfin-row" data-id="${item.id}">
                                <div class="semfin-row-head">
                                    <strong>${escapeHtml(item.nome)}</strong>
                                    <small>${item.semestre ? `${escapeHtml(item.semestre)}º semestre` : 'Sem semestre'} ${item.codigo ? `• ${escapeHtml(item.codigo)}` : ''}</small>
                                </div>
                                <div class="semfin-row-controls">
                                    <div class="semfin-toggle">
                                        <button type="button" class="semfin-pill ${result.aprovado ? 'active' : ''}" data-choice="aprovado">✅ Aprovado</button>
                                        <button type="button" class="semfin-pill ${!result.aprovado ? 'active' : ''}" data-choice="reprovado">❌ Reprovado</button>
                                    </div>
                                    <div class="semfin-nota-field">
                                        <label>Média final</label>
                                        <input type="number" class="semfin-nota-input" min="0" max="10" step="0.1" placeholder="0 a 10" value="${result.nota === '' || result.nota === undefined || result.nota === null ? '' : result.nota}">
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="semfin-footer">
                    <button type="button" class="btn-secondary" id="semfin-cancel-btn">Cancelar</button>
                    <div class="semfin-footer-right">
                        <button type="button" class="btn-primary" id="semfin-continue-btn">Continuar <i class="fas fa-arrow-right"></i></button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('semfin-close-btn')?.addEventListener('click', closeModal);
        document.getElementById('semfin-cancel-btn')?.addEventListener('click', closeModal);

        overlay.querySelectorAll('.semfin-row').forEach(row => {
            const id = row.dataset.id;
            if (!state.resultados[id]) {
                const item = state.cursando.find(i => i.id === id);
                state.resultados[id] = { aprovado: true, nota: item?.nota ?? '' };
            }

            row.querySelectorAll('.semfin-pill').forEach(btn => {
                btn.addEventListener('click', () => {
                    state.resultados[id].aprovado = btn.dataset.choice === 'aprovado';
                    row.querySelectorAll('.semfin-pill').forEach(b => b.classList.toggle('active', b === btn));
                });
            });

            const notaInput = row.querySelector('.semfin-nota-input');
            notaInput?.addEventListener('input', () => {
                state.resultados[id].nota = notaInput.value;
                notaInput.classList.remove('semfin-invalid');
            });
        });

        document.getElementById('semfin-continue-btn')?.addEventListener('click', () => {
            let valid = true;
            overlay.querySelectorAll('.semfin-row').forEach(row => {
                const id = row.dataset.id;
                const input = row.querySelector('.semfin-nota-input');
                const raw = state.resultados[id].nota;
                const num = parseFloat(String(raw).replace(',', '.'));
                if (raw === '' || raw === undefined || raw === null || isNaN(num) || num < 0 || num > 10) {
                    valid = false;
                    input?.classList.add('semfin-invalid');
                } else {
                    state.resultados[id].nota = num;
                }
            });

            if (!valid) {
                showToast('Informe uma média válida (0 a 10) para cada matéria.', 'warning');
                return;
            }

            buildWorkingCurriculum(app);
            renderStep2(app);
        });
    }

    // Aplica os resultados do passo 1 sobre uma cópia de trabalho da grade
    function buildWorkingCurriculum(app) {
        const state = app._semFinState;
        const source = app.getNormalizedCurriculum ? app.getNormalizedCurriculum() : (app.data.curriculum || []);
        state.working = source.map(item => ({ ...item }));

        state.working.forEach(item => {
            const result = state.resultados[item.id];
            if (!result) return;
            item.status = result.aprovado ? 'concluida' : 'reprovada';
            item.nota = result.nota;
        });
    }

    // ---------- PASSO 2: escolha das matérias do próximo semestre ----------
    function renderStep2(app) {
        const state = app._semFinState;
        const overlay = ensureOverlay();
        const working = state.working;

        const aprovadas = Object.values(state.resultados).filter(r => r.aprovado).length;
        const reprovadas = Object.values(state.resultados).filter(r => !r.aprovado).length;

        const currentSemester = parseInt(app.data?.user?.semestre || 0, 10) || 0;
        const nextSemester = currentSemester ? currentSemester + 1 : 0;

        const cursandoIds = new Set(state.cursando.map(i => i.id));
        const candidatos = working.filter(item => !cursandoIds.has(item.id) && (item.status === 'nao-cursada' || item.status === 'reprovada'));

        function prereqsSatisfeitos(item) {
            if (!item.prerequisitosLista?.length) return { ok: true, pendentes: [] };
            const pendentes = item.prerequisitosLista.filter(req => {
                const key = slug(req);
                const match = working.find(c => slug(c.nome) === key);
                if (!match) return false; // pré-requisito não cadastrado: não bloqueia
                return match.status !== 'concluida';
            });
            return { ok: pendentes.length === 0, pendentes };
        }

        if (!state.selecionadas) {
            state.selecionadas = new Set(
                candidatos
                    .filter(item => {
                        const { ok } = prereqsSatisfeitos(item);
                        if (!ok) return false;
                        if (item.status === 'reprovada') return true;
                        return nextSemester && parseInt(item.semestre || 0, 10) === nextSemester;
                    })
                    .map(item => item.id)
            );
        }

        const porSemestre = candidatos.reduce((acc, item) => {
            const sem = String(item.semestre || '0').trim();
            const chave = sem && sem !== '0' ? `${sem}º Semestre` : 'Sem semestre definido';
            if (!acc[chave]) acc[chave] = [];
            acc[chave].push(item);
            return acc;
        }, {});
        const chaves = Object.keys(porSemestre).sort((a, b) => (parseInt(a, 10) || 999) - (parseInt(b, 10) || 999));

        overlay.innerHTML = `
            <div class="semfin-modal">
                <div class="semfin-header">
                    <div>
                        <h2><i class="fas fa-graduation-cap"></i> Finalizar Semestre</h2>
                        <p>Passo 2 de 2 — Escolha as matérias que você vai cursar no próximo semestre.</p>
                    </div>
                    <button type="button" class="semfin-close" id="semfin-close-btn">&times;</button>
                </div>
                <div class="semfin-body">
                    ${stepDots(2)}
                    <div class="semfin-summary">
                        ✅ <strong>${aprovadas}</strong> aprovada(s) &nbsp;•&nbsp; ❌ <strong>${reprovadas}</strong> reprovada(s)
                        ${nextSemester ? `&nbsp;•&nbsp; Próximo semestre: <strong>${nextSemester}º</strong>` : ''}
                    </div>

                    ${!candidatos.length ? `
                        <div class="semfin-empty">Nenhuma matéria disponível para seleção. Cadastre novos componentes na Grade Curricular se precisar.</div>
                    ` : chaves.map(chave => `
                        <div class="semfin-group-title">${escapeHtml(chave)}</div>
                        ${porSemestre[chave].map(item => {
                            const { ok, pendentes } = prereqsSatisfeitos(item);
                            const checked = state.selecionadas.has(item.id);
                            return `
                                <label class="semfin-candidate ${ok ? '' : 'blocked'}">
                                    <input type="checkbox" class="semfin-candidate-check" data-id="${item.id}" ${checked ? 'checked' : ''} ${ok ? '' : 'disabled'}>
                                    <div class="semfin-candidate-info">
                                        <strong>${escapeHtml(item.nome)}</strong>
                                        <small>${Number(item.cargaHoraria) || 0}h ${item.codigo ? `• ${escapeHtml(item.codigo)}` : ''}</small>
                                        ${item.status === 'reprovada' ? '<span class="semfin-tag repescagem">Repescagem</span>' : ''}
                                        ${ok && item.status !== 'reprovada' && nextSemester && parseInt(item.semestre || 0, 10) === nextSemester ? '<span class="semfin-tag recomendada">Recomendada</span>' : ''}
                                        ${!ok ? `<span class="semfin-tag bloqueada">Falta: ${pendentes.map(escapeHtml).join(', ')}</span>` : ''}
                                    </div>
                                </label>
                            `;
                        }).join('')}
                    `).join('')}
                </div>
                <div class="semfin-footer">
                    <button type="button" class="btn-secondary" id="semfin-back-btn"><i class="fas fa-arrow-left"></i> Voltar</button>
                    <div class="semfin-footer-right">
                        <button type="button" class="btn-secondary" id="semfin-cancel-btn">Cancelar</button>
                        <button type="button" class="btn-primary" id="semfin-finish-btn">Finalizar Semestre <i class="fas fa-check"></i></button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('semfin-close-btn')?.addEventListener('click', closeModal);
        document.getElementById('semfin-cancel-btn')?.addEventListener('click', closeModal);
        document.getElementById('semfin-back-btn')?.addEventListener('click', () => renderStep1(app));

        overlay.querySelectorAll('.semfin-candidate-check').forEach(cb => {
            cb.addEventListener('change', () => {
                if (cb.checked) state.selecionadas.add(cb.dataset.id);
                else state.selecionadas.delete(cb.dataset.id);
            });
        });

        document.getElementById('semfin-finish-btn')?.addEventListener('click', () => finalizarSemestre(app));
    }

    async function finalizarSemestre(app) {
        const state = app._semFinState;
        const working = state.working;
        const aprovadas = Object.values(state.resultados).filter(r => r.aprovado).length;
        const reprovadas = Object.values(state.resultados).filter(r => !r.aprovado).length;

        working.forEach(item => {
            if (state.selecionadas.has(item.id)) {
                item.status = 'cursando';
            }
        });

        app.data.curriculum = working;
        const okCurriculum = await dbService.saveData('curriculum', app.data.curriculum);

        const currentSemester = parseInt(app.data?.user?.semestre || 0, 10) || 0;
        const nextSemester = currentSemester + 1;
        if (currentSemester && app.data.user) {
            app.data.user.semestre = nextSemester;
            await dbService.saveData('user', app.data.user);
        }

        closeModal();
        app._semFinState = null;

        if (okCurriculum) {
            showToast(`Semestre finalizado! ✅ ${aprovadas} aprovada(s), ❌ ${reprovadas} reprovada(s), ${state.selecionadas.size} matéria(s) selecionada(s) para o próximo semestre.`, 'success');
        } else {
            showToast('Semestre finalizado, mas houve um problema ao sincronizar. Verifique sua conexão.', 'warning');
        }

        if (typeof app.loadView === 'function') app.loadView('grade-curricular');
    }

    if (window.StudyLifeControl) {
        window.StudyLifeControl.prototype.abrirFinalizarSemestre = function () {
            this.normalizeCurriculumInMemory ? this.normalizeCurriculumInMemory() : null;
            const curriculum = this.getNormalizedCurriculum ? this.getNormalizedCurriculum() : (this.data.curriculum || []);
            const cursando = curriculum.filter(item => item.status === 'cursando');

            if (!cursando.length) {
                showToast('Nenhuma matéria está marcada como "Cursando" na Grade Curricular. Atualize o status das matérias do semestre atual antes de finalizar.', 'warning');
                return;
            }

            injectStyles();
            this._semFinState = {
                cursando,
                resultados: {},
                working: null,
                selecionadas: null
            };
            renderStep1(this);
        };
    }
})();
