// script.js
class StudyLifeControl {
    constructor() {
        this.data = {
            user: null,
            subjects: [],
            sessions: [],
            tasks: [],
            exams: [],
            materials: [],
            grades: [],
            habits: [],
            learningMap: [],
            settings: {
                heavyMode: false,
                notifications: true,
                autoPlan: true
            }
        };
        
        this.currentView = 'dashboard';
        this.timerInterval = null;
        this.timerSeconds = 0;
        this.timerRunning = false;
        this.timerDuration = 0;
        
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.checkFirstAccess();
        this.applyHeavyMode();
    }

    loadData() {
        this.data.user = this.getStorage('slc_user');
        this.data.subjects = this.getStorage('slc_subjects') || [];
        this.data.sessions = this.getStorage('slc_sessions') || [];
        this.data.tasks = this.getStorage('slc_tasks') || [];
        this.data.exams = this.getStorage('slc_exams') || [];
        this.data.materials = this.getStorage('slc_materials') || [];
        this.data.grades = this.getStorage('slc_grades') || [];
        this.data.habits = this.getStorage('slc_habits') || [];
        this.data.learningMap = this.getStorage('slc_learning_map') || [];
        this.data.settings = this.getStorage('slc_settings') || this.data.settings;
    }

    saveData() {
        this.setStorage('slc_user', this.data.user);
        this.setStorage('slc_subjects', this.data.subjects);
        this.setStorage('slc_sessions', this.data.sessions);
        this.setStorage('slc_tasks', this.data.tasks);
        this.setStorage('slc_exams', this.data.exams);
        this.setStorage('slc_materials', this.data.materials);
        this.setStorage('slc_grades', this.data.grades);
        this.setStorage('slc_habits', this.data.habits);
        this.setStorage('slc_learning_map', this.data.learningMap);
        this.setStorage('slc_settings', this.data.settings);
    }

    getStorage(key) {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : null;
    }

    setStorage(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    checkFirstAccess() {
        if (!this.data.user) {
            document.getElementById('setup-screen').style.display = 'flex';
            document.getElementById('main-dashboard').style.display = 'none';
            this.renderSetupForm();
        } else {
            document.getElementById('setup-screen').style.display = 'none';
            document.getElementById('main-dashboard').style.display = 'block';
            this.updateSidebarInfo();
            this.loadView('dashboard');
        }
    }

    renderSetupForm() {
        const container = document.getElementById('materias-container');
        container.innerHTML = '';
        this.addMateriaField();
    }

    addMateriaField() {
        const container = document.getElementById('materias-container');
        const item = document.createElement('div');
        item.className = 'materia-item';
        item.innerHTML = `
            <div class="materia-fields">
                <input type="text" class="materia-nome" placeholder="Nome da matéria" required>
                <select class="materia-dificuldade">
                    <option value="1">Dificuldade 1</option>
                    <option value="2">Dificuldade 2</option>
                    <option value="3" selected>Dificuldade 3</option>
                    <option value="4">Dificuldade 4</option>
                    <option value="5">Dificuldade 5</option>
                </select>
                <select class="materia-peso">
                    <option value="1">Peso 1</option>
                    <option value="2">Peso 2</option>
                    <option value="3" selected>Peso 3</option>
                    <option value="4">Peso 4</option>
                    <option value="5">Peso 5</option>
                </select>
                <input type="number" class="materia-nota-desejada" placeholder="Nota desejada" min="0" max="10" step="0.1" value="7">
            </div>
            <button type="button" class="btn-remove"><i class="fas fa-times"></i></button>
        `;
        item.querySelector('.btn-remove').addEventListener('click', () => item.remove());
        container.appendChild(item);
    }

    setupEventListeners() {
        document.getElementById('setup-form')?.addEventListener('submit', (e) => this.handleSetupSubmit(e));
        document.getElementById('add-materia')?.addEventListener('click', () => this.addMateriaField());

        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.currentTarget.dataset.view;
                this.loadView(view);
                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                e.currentTarget.classList.add('active');
                document.getElementById('page-title').textContent = e.currentTarget.querySelector('span').textContent;
            });
        });

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => modal.style.display = 'none');
            });
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });

        document.getElementById('form-sessao')?.addEventListener('submit', (e) => this.handleSessaoSubmit(e));
        document.getElementById('form-tarefa')?.addEventListener('submit', (e) => this.handleTarefaSubmit(e));
        document.getElementById('form-prova')?.addEventListener('submit', (e) => this.handleProvaSubmit(e));
        document.getElementById('form-topico')?.addEventListener('submit', (e) => this.handleTopicoSubmit(e));
        document.getElementById('form-nota')?.addEventListener('submit', (e) => this.handleNotaSubmit(e));
        document.getElementById('form-material')?.addEventListener('submit', (e) => this.handleMaterialSubmit(e));

        document.getElementById('modo-faculdade-pesada')?.addEventListener('change', (e) => {
            this.data.settings.heavyMode = e.target.checked;
            this.saveData();
            this.applyHeavyMode();
            this.showToast(`Modo Faculdade Pesada ${e.target.checked ? 'ativado' : 'desativado'}`);
        });

        document.getElementById('refresh-data')?.addEventListener('click', () => {
            this.loadView(this.currentView);
            this.showToast('Dados atualizados');
        });
    }

    applyHeavyMode() {
        if (this.data.settings.heavyMode) {
            document.body.classList.add('heavy-mode');
        } else {
            document.body.classList.remove('heavy-mode');
        }
    }

    handleSetupSubmit(e) {
        e.preventDefault();
        const subjects = [];
        document.querySelectorAll('.materia-item').forEach(item => {
            const nome = item.querySelector('.materia-nome').value;
            if (nome) {
                subjects.push({
                    id: this.generateId(),
                    nome: nome,
                    dificuldade: parseInt(item.querySelector('.materia-dificuldade').value),
                    peso: parseInt(item.querySelector('.materia-peso').value),
                    notaDesejada: parseFloat(item.querySelector('.materia-nota-desejada').value) || 7
                });
            }
        });

        const diasPreferidos = Array.from(document.querySelectorAll('#dias-preferidos-container input:checked')).map(cb => cb.value);

        this.data.user = {
            nome: document.getElementById('nome').value,
            curso: document.getElementById('curso').value,
            universidade: document.getElementById('universidade').value,
            semestre: document.getElementById('semestre').value,
            turnoPrincipal: document.getElementById('turno-principal').value,
            diasPreferidos: diasPreferidos,
            horasMaximas: parseInt(document.getElementById('horas-maximas').value),
            horarioSono: document.getElementById('horario-sono').value,
            tempoDeslocamento: parseInt(document.getElementById('tempo-deslocamento').value),
            tipoRotina: document.getElementById('tipo-rotina').value,
            nivelDisciplina: document.getElementById('nivel-disciplina').value,
            dificuldadeAtual: document.getElementById('dificuldade-atual').value,
            streak: 0,
            lastStudyDate: null
        };

        this.data.subjects = subjects;
        this.saveData();
        this.checkFirstAccess();
    }

    loadView(view) {
        this.currentView = view;
        const container = document.getElementById('view-container');
        let html = '';
        
        switch(view) {
            case 'dashboard': html = this.renderDashboard(); break;
            case 'planejador-inteligente': html = this.renderPlanejadorInteligente(); break;
            case 'sessoes': html = this.renderSessoes(); break;
            case 'tarefas': html = this.renderTarefas(); break;
            case 'provas': html = this.renderProvas(); break;
            case 'mapa-aprendizado': html = this.renderMapaAprendizado(); break;
            case 'materiais': html = this.renderMateriais(); break;
            case 'calendario': html = this.renderCalendario(); break;
            case 'previsao-notas': html = this.renderPrevisaoNotas(); break;
            case 'habitos': html = this.renderHabitos(); break;
            case 'estatisticas': html = this.renderEstatisticas(); break;
            case 'foco': html = this.renderModoFoco(); break;
            case 'configuracoes': html = this.renderConfiguracoes(); break;
        }
        
        container.innerHTML = html;
        this.setupViewEvents(view);
    }

    setupViewEvents(view) {
        if (view === 'sessoes') {
            document.getElementById('btn-nova-sessao')?.addEventListener('click', () => this.openModal('sessao'));
            document.querySelectorAll('.btn-concluir-sessao').forEach(btn => {
                btn.addEventListener('click', (e) => this.concluirSessao(e.currentTarget.dataset.id));
            });
        }

        if (view === 'tarefas') {
            document.getElementById('btn-nova-tarefa')?.addEventListener('click', () => this.openModal('tarefa'));
            document.querySelectorAll('.btn-concluir-tarefa').forEach(btn => {
                btn.addEventListener('click', (e) => this.concluirTarefa(e.currentTarget.dataset.id));
            });
        }

        if (view === 'provas') {
            document.getElementById('btn-nova-prova')?.addEventListener('click', () => this.openModal('prova'));
        }

        if (view === 'mapa-aprendizado') {
            document.getElementById('btn-novo-topico')?.addEventListener('click', () => this.openModal('topico'));
        }

        if (view === 'previsao-notas') {
            document.getElementById('btn-registrar-nota')?.addEventListener('click', () => this.openModal('nota'));
        }

        if (view === 'materiais') {
            document.getElementById('btn-novo-material')?.addEventListener('click', () => this.openModal('material'));
        }

        if (view === 'planejador-inteligente') {
            document.getElementById('gerar-plano')?.addEventListener('click', () => {
                this.loadView('planejador-inteligente');
                this.showToast('Novo plano gerado!');
            });
            document.getElementById('recalcular-plano')?.addEventListener('click', () => {
                this.loadView('planejador-inteligente');
                this.showToast('Plano recalculado!');
            });
            document.querySelectorAll('.btn-adicionar-sessao').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.openModal('sessao', {
                        materia: e.currentTarget.dataset.materia,
                        tipo: e.currentTarget.dataset.tipo,
                        duracao: e.currentTarget.dataset.duracao
                    });
                });
            });
        }

        if (view === 'habitos') {
            document.querySelectorAll('.toggle-habito').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const habitoId = e.currentTarget.dataset.habito;
                    this.toggleHabito(habitoId);
                });
            });
        }

        if (view === 'foco') {
            document.getElementById('timer-start')?.addEventListener('click', () => this.startTimer());
            document.getElementById('timer-pause')?.addEventListener('click', () => this.pauseTimer());
            document.getElementById('timer-reset')?.addEventListener('click', () => this.resetTimer());
        }

        if (view === 'configuracoes') {
            document.getElementById('config-notificacoes')?.addEventListener('change', (e) => {
                this.data.settings.notifications = e.target.checked;
                this.saveData();
            });
            document.getElementById('config-auto-plan')?.addEventListener('change', (e) => {
                this.data.settings.autoPlan = e.target.checked;
                this.saveData();
            });
            document.getElementById('config-heavy-mode')?.addEventListener('change', (e) => {
                this.data.settings.heavyMode = e.target.checked;
                this.saveData();
                this.applyHeavyMode();
            });
            document.getElementById('exportar-dados')?.addEventListener('click', () => this.exportarDados());
            document.getElementById('limpar-dados')?.addEventListener('click', () => this.limparDados());
        }
    }

    openModal(modalType, data = {}) {
        if (['sessao', 'tarefa', 'prova', 'topico', 'nota', 'material'].includes(modalType)) {
            const select = document.getElementById(`${modalType}-materia`);
            if (select) {
                select.innerHTML = '<option value="">Selecione</option>';
                this.data.subjects.forEach(s => {
                    select.innerHTML += `<option value="${s.nome}">${s.nome}</option>`;
                });
                if (data.materia) select.value = data.materia;
            }
        }
        if (modalType === 'sessao') {
            if (data.tipo) document.getElementById('sessao-tipo').value = data.tipo;
            if (data.duracao) document.getElementById('sessao-duracao').value = data.duracao;
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            document.getElementById('sessao-data').value = now.toISOString().slice(0, 16);
        }
        document.getElementById(`modal-${modalType}`).style.display = 'block';
    }

    renderDashboard() {
        const hoje = new Date();
        const alerts = this.generateAlerts();
        const risk = this.analyzeAcademicRisk();
        const progresso = this.calcularProgressoHoje();
        const tarefasUrgentes = this.getUrgentTasks();
        const proximosExames = this.getUpcomingExams(7);

        return `
            <div class="dashboard-header">
                <h2>Olá, ${this.data.user?.nome || 'Estudante'}! 👋</h2>
                <p>${hoje.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            ${alerts.length ? `
                <div class="alerts-container">
                    <h3><i class="fas fa-exclamation-triangle"></i> Alertas</h3>
                    ${alerts.map(a => this.renderAlert(a)).join('')}
                </div>
            ` : ''}
            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header"><h3><i class="fas fa-clock"></i> Progresso Hoje</h3><i class="fas fa-chart-line"></i></div>
                    <div class="card-body">
                        <div class="progress-container">
                            <div class="progress-label"><span>Planejado: ${this.data.user?.horasMaximas || 6}h</span><span>${progresso.concluido}h</span></div>
                            <div class="progress-bar"><div class="progress-fill" style="width: ${progresso.percentual}%"></div></div>
                        </div>
                        <div class="stats-row">
                            <div class="stat-item"><span class="stat-value">${this.data.user?.streak || 0}</span><span class="stat-label">streak</span></div>
                            <div class="stat-item"><span class="stat-value">${this.calcularProdutividade()}</span><span class="stat-label">produtividade</span></div>
                            <div class="stat-item"><span class="stat-value">${tarefasUrgentes.length}</span><span class="stat-label">urgentes</span></div>
                        </div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header"><h3><i class="fas fa-exclamation-circle"></i> Risco Acadêmico</h3><i class="fas fa-shield-alt"></i></div>
                    <div class="card-body">
                        ${risk.length ? risk.map(r => `
                            <div class="risk-item">
                                <div class="risk-info"><strong>${r.materia}</strong><span class="risk-indicator risk-${r.nivel}">${r.nivel}</span></div>
                                <p class="risk-desc">${r.motivo}</p>
                            </div>
                        `).join('') : '<p class="text-secondary">Nenhum risco identificado</p>'}
                    </div>
                </div>
                <div class="card">
                    <div class="card-header"><h3><i class="fas fa-tasks"></i> Tarefas Urgentes</h3><i class="fas fa-clock"></i></div>
                    <div class="card-body"><ul class="item-list">${tarefasUrgentes.map(t => `<li><div><strong>${t.titulo}</strong><small>${t.materia}</small></div><span class="tag high">${this.diasAte(t.dataLimite)}d</span></li>`).join('')}${!tarefasUrgentes.length ? '<li>Nenhuma tarefa urgente</li>' : ''}</ul></div>
                </div>
                <div class="card">
                    <div class="card-header"><h3><i class="fas fa-graduation-cap"></i> Próximas Provas</h3><i class="fas fa-calendar"></i></div>
                    <div class="card-body"><ul class="item-list">${proximosExames.map(e => `<li><div><strong>${e.titulo}</strong><small>${e.materia}</small></div><span class="tag ${this.getExamRiskClass(e)}">${this.diasAte(e.data)}d</span></li>`).join('')}${!proximosExames.length ? '<li>Nenhuma prova próxima</li>' : ''}</ul></div>
                </div>
            </div>
            <div class="card"><div class="card-header"><h3><i class="fas fa-robot"></i> Recomendações</h3><i class="fas fa-lightbulb"></i></div><div class="card-body">${this.renderSmartRecommendations()}</div></div>
        `;
    }

    renderPlanejadorInteligente() {
        const plano = this.generateSmartPlan();
        return `
            <div class="view-header"><h2><i class="fas fa-robot"></i> Planejador Inteligente</h2><div class="header-actions"><button class="btn-secondary" id="gerar-plano"><i class="fas fa-sync-alt"></i> Gerar Novo</button><button class="btn-primary" id="recalcular-plano"><i class="fas fa-calculator"></i> Recalcular</button></div></div>
            <div class="card"><div class="card-header"><h3>📅 Recomendações para Hoje</h3><span class="badge">${new Date().toLocaleDateString()}</span></div><div class="card-body"><div class="sessoes-grid">${plano.hoje.map(s => `<div class="sessao-card ${s.prioridade}"><div class="sessao-header"><h4>${s.materia}</h4><span class="tag ${s.prioridade}">${s.prioridade}</span></div><p class="sessao-tipo">${s.tipo} • ${s.duracao}min</p><p class="sessao-motivo">💡 ${s.motivo}</p><button class="btn-secondary btn-adicionar-sessao" data-materia="${s.materia}" data-tipo="${s.tipo}" data-duracao="${s.duracao}"><i class="fas fa-plus"></i> Adicionar</button></div>`).join('')}${!plano.hoje.length ? '<p class="text-secondary">Nenhuma recomendação</p>' : ''}</div></div></div>
            <div class="card"><div class="card-header"><h3>📆 Recomendações para a Semana</h3></div><div class="card-body"><div class="semana-grid">${plano.semana.map((d, i) => `<div class="dia-card"><h4>${this.getDiaSemana(i)}</h4>${d.map(s => `<div class="sessao-item"><strong>${s.materia}</strong><span>${s.duracao}min</span></div>`).join('')}${!d.length ? '<p class="text-secondary">Livre</p>' : ''}</div>`).join('')}</div></div></div>
            <div class="card"><div class="card-header"><h3>⚖️ Distribuição de Estudos</h3></div><div class="card-body"><div class="materias-distribuicao">${plano.distribuicao.map(d => `<div class="distribuicao-item"><div class="distribuicao-label"><span>${d.materia}</span><span>${d.horas}h (${d.percentual}%)</span></div><div class="progress-bar"><div class="progress-fill" style="width: ${d.percentual}%"></div></div></div>`).join('')}</div></div></div>
        `;
    }

    renderSessoes() {
        const hoje = new Date().toDateString();
        const sessoesHoje = this.data.sessions.filter(s => new Date(s.data).toDateString() === hoje && !s.concluida);
        const futuras = this.data.sessions.filter(s => new Date(s.data) > new Date() && !s.concluida).sort((a,b)=>new Date(a.data)-new Date(b.data));
        const concluidas = this.data.sessions.filter(s => s.concluida).slice(0,10);
        return `
            <div class="view-header"><h2><i class="fas fa-clock"></i> Sessões de Estudo</h2><button class="btn-primary" id="btn-nova-sessao"><i class="fas fa-plus"></i> Nova Sessão</button></div>
            <div class="dashboard-grid">
                <div class="card"><div class="card-header"><h3>⏰ Hoje (${sessoesHoje.length})</h3></div><div class="card-body"><ul class="item-list">${sessoesHoje.map(s => `<li><div><strong>${s.materia}</strong><small>${s.tipo} • ${s.duracao}min</small></div><button class="btn-icon btn-concluir-sessao" data-id="${s.id}"><i class="fas fa-check-circle"></i></button></li>`).join('')}${!sessoesHoje.length ? '<li>Nenhuma sessão hoje</li>' : ''}</ul></div></div>
                <div class="card"><div class="card-header"><h3>📅 Próximas (${futuras.length})</h3></div><div class="card-body"><ul class="item-list">${futuras.map(s => `<li><div><strong>${s.materia}</strong><small>${new Date(s.data).toLocaleDateString()} • ${s.tipo}</small></div></li>`).join('')}${!futuras.length ? '<li>Nenhuma sessão futura</li>' : ''}</ul></div></div>
                <div class="card"><div class="card-header"><h3>✅ Concluídas</h3></div><div class="card-body"><ul class="item-list">${concluidas.map(s => `<li><div><strong>${s.materia}</strong><small>${new Date(s.data).toLocaleDateString()}</small></div><i class="fas fa-check" style="color: var(--success);"></i></li>`).join('')}${!concluidas.length ? '<li>Nenhuma sessão concluída</li>' : ''}</ul></div></div>
            </div>
        `;
    }

    renderTarefas() {
        const pendentes = this.data.tasks.filter(t => !t.concluida);
        const concluidas = this.data.tasks.filter(t => t.concluida);
        return `
            <div class="view-header"><h2><i class="fas fa-tasks"></i> Tarefas</h2><button class="btn-primary" id="btn-nova-tarefa"><i class="fas fa-plus"></i> Nova Tarefa</button></div>
            <div class="dashboard-grid">
                <div class="card"><div class="card-header"><h3>📋 Pendentes (${pendentes.length})</h3></div><div class="card-body"><ul class="item-list">${pendentes.map(t => `<li><div><strong>${t.titulo}</strong><small>${t.materia} • ${new Date(t.dataLimite).toLocaleDateString()}</small></div><div><span class="tag ${t.prioridade}">${t.prioridade}</span><button class="btn-icon btn-concluir-tarefa" data-id="${t.id}"><i class="fas fa-check-circle"></i></button></div></li>`).join('')}${!pendentes.length ? '<li>Nenhuma tarefa pendente</li>' : ''}</ul></div></div>
                <div class="card"><div class="card-header"><h3>✅ Concluídas (${concluidas.length})</h3></div><div class="card-body"><ul class="item-list">${concluidas.slice(0,10).map(t => `<li><div><strong>${t.titulo}</strong><small>${t.materia}</small></div><i class="fas fa-check" style="color: var(--success);"></i></li>`).join('')}${!concluidas.length ? '<li>Nenhuma tarefa concluída</li>' : ''}</ul></div></div>
            </div>
        `;
    }

    renderProvas() {
        const proximas = this.data.exams.filter(e => new Date(e.data) >= new Date() && !e.concluida).sort((a,b)=>new Date(a.data)-new Date(b.data));
        return `
            <div class="view-header"><h2><i class="fas fa-graduation-cap"></i> Provas e Trabalhos</h2><button class="btn-primary" id="btn-nova-prova"><i class="fas fa-plus"></i> Novo Evento</button></div>
            <div class="dashboard-grid">
                <div class="card"><div class="card-header"><h3>📅 Próximos (${proximas.length})</h3></div><div class="card-body"><ul class="item-list">${proximas.map(e => `<li><div><strong>${e.titulo}</strong><small>${e.materia} • ${e.tipo}</small></div><span class="tag ${this.getExamRiskClass(e)}">${this.diasAte(e.data)}d</span></li>`).join('')}${!proximas.length ? '<li>Nenhum evento próximo</li>' : ''}</ul></div></div>
                <div class="card"><div class="card-header"><h3>📊 Por Matéria</h3></div><div class="card-body">${this.data.subjects.map(s => `<div class="subject-stats"><h4>${s.nome}</h4><p>${this.data.exams.filter(e => e.materia === s.nome).length} eventos</p></div>`).join('')}</div></div>
            </div>
        `;
    }

    renderMapaAprendizado() {
        return `
            <div class="view-header"><h2><i class="fas fa-map"></i> Mapa de Aprendizado</h2><button class="btn-primary" id="btn-novo-topico"><i class="fas fa-plus"></i> Novo Tópico</button></div>
            <div class="mapa-grid">${this.data.subjects.map(s => `<div class="card materia-map"><div class="card-header"><h3>${s.nome}</h3><span class="badge">${this.data.learningMap.filter(t => t.materia === s.nome).length} tópicos</span></div><div class="card-body">${this.data.learningMap.filter(t => t.materia === s.nome).map(t => `<div class="topico-item"><div class="topico-info"><strong>${t.nome}</strong><span class="tag ${t.status}">${t.status}</span></div><div class="topico-meta"><span>📊 ${t.dificuldade}/5</span><span>🎯 ${t.confianca}/5</span><span>🔄 ${this.diasDesde(t.ultimaRevisao)}d</span></div></div>`).join('')}${!this.data.learningMap.filter(t => t.materia === s.nome).length ? '<p class="text-secondary">Nenhum tópico</p>' : ''}</div></div>`).join('')}</div>
        `;
    }

    renderMateriais() {
        return `
            <div class="view-header"><h2><i class="fas fa-folder"></i> Materiais</h2><button class="btn-primary" id="btn-novo-material"><i class="fas fa-plus"></i> Novo Material</button></div>
            <div class="materiais-grid">${this.data.subjects.map(s => `<div class="card"><div class="card-header"><h3>${s.nome}</h3><span>${this.data.materials.filter(m => m.materia === s.nome).length} itens</span></div><div class="card-body"><ul class="item-list">${this.data.materials.filter(m => m.materia === s.nome).map(m => `<li><div><i class="fas ${this.getMaterialIcon(m.tipo)}"></i><strong>${m.titulo}</strong></div><a href="${m.conteudo}" target="_blank" class="btn-icon"><i class="fas fa-external-link-alt"></i></a></li>`).join('')}${!this.data.materials.filter(m => m.materia === s.nome).length ? '<li>Nenhum material</li>' : ''}</ul></div></div>`).join('')}</div>
        `;
    }

    renderCalendario() {
        const hoje = new Date();
        const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        const dias = [];
        for (let i = 0; i < primeiroDia.getDay(); i++) dias.push(null);
        for (let i = 1; i <= ultimoDia.getDate(); i++) dias.push(i);

        const eventos = [
            ...this.data.sessions.map(s => ({ ...s, tipo: 'sessao', data: s.data })),
            ...this.data.tasks.map(t => ({ ...t, tipo: 'tarefa', data: t.dataLimite })),
            ...this.data.exams.map(e => ({ ...e, tipo: 'exame', data: e.data }))
        ];

        return `
            <h2><i class="fas fa-calendar"></i> Calendário</h2>
            <div class="card"><div class="card-header"><h3>${hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3></div><div class="card-body"><div class="calendar-grid"><div class="calendar-weekdays"><div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div></div><div class="calendar-days">${dias.map(d => {
                if (!d) return '<div class="calendar-day empty"></div>';
                const eventosDia = eventos.filter(e => {
                    const data = new Date(e.data);
                    return data.getDate() === d && data.getMonth() === hoje.getMonth() && data.getFullYear() === hoje.getFullYear();
                });
                return `<div class="calendar-day ${eventosDia.length ? 'has-events' : ''}"><span class="day-number">${d}</span>${eventosDia.length ? `<div class="day-events">${eventosDia.slice(0,3).map(e => `<div class="event-indicator" data-tooltip="${e.titulo || e.materia}"><i class="fas ${this.getEventIcon(e.tipo)}"></i></div>`).join('')}${eventosDia.length > 3 ? `<span class="more-events">+${eventosDia.length-3}</span>` : ''}</div>` : ''}</div>`;
            }).join('')}</div></div></div></div>
        `;
    }

    renderPrevisaoNotas() {
        return `
            <div class="view-header"><h2><i class="fas fa-chart-line"></i> Previsão de Notas</h2><button class="btn-primary" id="btn-registrar-nota"><i class="fas fa-plus"></i> Registrar Nota</button></div>
            <div class="dashboard-grid">${this.data.subjects.map(s => {
                const notas = this.data.grades.filter(g => g.materia === s.nome);
                const media = this.calcularMedia(notas);
                const previsao = this.calcularPrevisaoNota(s, notas);
                return `<div class="card"><div class="card-header"><h3>${s.nome}</h3><span class="risk-indicator risk-${previsao.risco}">${previsao.risco}</span></div><div class="card-body"><div class="grade-stats"><div class="grade-item"><span class="grade-label">Média</span><span class="grade-value">${media.toFixed(1)}</span></div><div class="grade-item"><span class="grade-label">Desejada</span><span class="grade-value">${s.notaDesejada}</span></div><div class="grade-item"><span class="grade-label">Necessário</span><span class="grade-value">${previsao.notaNecessaria.toFixed(1)}</span></div></div><div class="progress-container"><div class="progress-label"><span>Chance</span><span>${previsao.chance}%</span></div><div class="progress-bar"><div class="progress-fill" style="width: ${previsao.chance}%"></div></div></div><p class="previsao-motivo">💡 ${previsao.motivo}</p></div></div>`;
            }).join('')}</div>
        `;
    }

    renderHabitos() {
        const habitos = [
            { id: 'estudar', nome: 'Estudar', icone: 'fa-book' },
            { id: 'revisar', nome: 'Revisar', icone: 'fa-sync-alt' },
            { id: 'dormir', nome: 'Dormir bem', icone: 'fa-bed' },
            { id: 'aula', nome: 'Ir para aula', icone: 'fa-university' },
            { id: 'exercicio', nome: 'Exercícios', icone: 'fa-dumbbell' },
            { id: 'agua', nome: 'Beber água', icone: 'fa-tint' },
            { id: 'anotacoes', nome: 'Ler anotações', icone: 'fa-sticky-note' }
        ];
        const hoje = new Date().toDateString();
        return `
            <h2><i class="fas fa-heart"></i> Hábitos</h2>
            <div class="dashboard-grid">
                <div class="card"><div class="card-header"><h3>📋 Hábitos Diários</h3></div><div class="card-body"><div class="habitos-list">${habitos.map(h => {
                    const feito = this.data.habits.some(hb => hb.id === h.id && new Date(hb.data).toDateString() === hoje);
                    return `<div class="habito-item"><div class="habito-info"><i class="fas ${h.icone}"></i><span>${h.nome}</span></div><button class="btn-icon toggle-habito ${feito ? 'active' : ''}" data-habito="${h.id}"><i class="fas ${feito ? 'fa-check-circle' : 'fa-circle'}"></i></button></div>`;
                }).join('')}</div></div></div>
                <div class="card"><div class="card-header"><h3>📊 Consistência</h3></div><div class="card-body"><div class="consistency-chart">${this.renderConsistencyChart()}</div><div class="consistency-stats"><div class="stat-item"><span class="stat-value">${this.calcularConsistencia()}%</span><span class="stat-label">semana</span></div><div class="stat-item"><span class="stat-value">${this.data.user?.streak || 0}</span><span class="stat-label">streak</span></div></div></div></div>
            </div>
        `;
    }

    renderEstatisticas() {
        const horasPorMateria = this.calcularHorasPorMateria();
        const horasPorTipo = this.calcularHorasPorTipo();
        const total = this.data.sessions.filter(s => s.concluida).reduce((a, s) => a + s.duracao / 60, 0);
        return `
            <h2><i class="fas fa-chart-bar"></i> Estatísticas</h2>
            <div class="dashboard-grid">
                <div class="card"><div class="card-header"><h3>⏱️ Total</h3></div><div class="card-body text-center"><div class="big-number">${total.toFixed(1)}</div><p>horas</p></div></div>
                <div class="card"><div class="card-header"><h3>📊 Média</h3></div><div class="card-body text-center"><div class="big-number">${this.calcularMediaDiaria()}</div><p>horas/dia</p></div></div>
                <div class="card"><div class="card-header"><h3>🔥 Melhor Dia</h3></div><div class="card-body text-center"><div class="big-number">${this.calcularMelhorDia()}</div><p>${this.calcularMelhorDiaHoras()}h</p></div></div>
                <div class="card"><div class="card-header"><h3>✅ Tarefas</h3></div><div class="card-body text-center"><div class="big-number">${this.calcularTaxaConclusaoTarefas()}%</div><p>concluídas</p></div></div>
            </div>
            <div class="card"><div class="card-header"><h3>📚 Horas por Matéria</h3></div><div class="card-body">${horasPorMateria.map(h => `<div class="stat-row"><div class="stat-label">${h.materia}</div><div class="progress-bar"><div class="progress-fill" style="width: ${(h.horas / Math.max(...horasPorMateria.map(x=>x.horas)))*100}%"></div></div><div class="stat-value">${h.horas.toFixed(1)}h</div></div>`).join('')}</div></div>
            <div class="card"><div class="card-header"><h3>📖 Tipos de Estudo</h3></div><div class="card-body"><div class="tipos-grid">${horasPorTipo.map(t => `<div class="tipo-item"><div class="tipo-header"><span>${t.tipo}</span><span>${t.horas.toFixed(1)}h</span></div><div class="progress-bar"><div class="progress-fill" style="width: ${(t.horas / Math.max(...horasPorTipo.map(x=>x.horas)))*100}%"></div></div></div>`).join('')}</div></div></div>
        `;
    }

    renderModoFoco() {
        return `
            <h2><i class="fas fa-clock"></i> Modo Foco</h2>
            <div class="card"><div class="card-body text-center"><div class="timer-display" id="timer-display">25:00</div><div class="timer-settings"><select id="timer-duracao" class="timer-select"><option value="25">Pomodoro (25min)</option><option value="50">Estudo longo (50min)</option><option value="90">Bloco pesado (90min)</option><option value="15">Pausa curta (15min)</option></select></div><div class="timer-controls"><button class="timer-btn start" id="timer-start"><i class="fas fa-play"></i> Iniciar</button><button class="timer-btn pause" id="timer-pause" style="display:none"><i class="fas fa-pause"></i> Pausar</button><button class="timer-btn reset" id="timer-reset"><i class="fas fa-undo"></i> Reset</button></div></div></div>
            <div class="card"><div class="card-header"><h3>📊 Sessões Hoje</h3></div><div class="card-body"><ul class="item-list" id="sessoes-foco-hoje">${this.renderSessoesFocoHoje()}</ul></div></div>
        `;
    }

    renderConfiguracoes() {
        return `
            <h2><i class="fas fa-cog"></i> Configurações</h2>
            <div class="card"><div class="card-header"><h3>⚙️ Preferências</h3></div><div class="card-body"><div class="config-item"><div class="config-info"><h4>Notificações</h4><p>Receber alertas</p></div><label class="toggle-switch"><input type="checkbox" ${this.data.settings.notifications ? 'checked' : ''} id="config-notificacoes"><span class="toggle-slider"></span></label></div><div class="config-item"><div class="config-info"><h4>Planejamento automático</h4><p>Gerar recomendações</p></div><label class="toggle-switch"><input type="checkbox" ${this.data.settings.autoPlan ? 'checked' : ''} id="config-auto-plan"><span class="toggle-slider"></span></label></div><div class="config-item"><div class="config-info"><h4>Modo Faculdade Pesada</h4><p>Priorizar matérias difíceis</p></div><label class="toggle-switch"><input type="checkbox" ${this.data.settings.heavyMode ? 'checked' : ''} id="config-heavy-mode"><span class="toggle-slider"></span></label></div></div></div>
            <div class="card"><div class="card-header"><h3>📊 Dados</h3></div><div class="card-body"><button class="btn-secondary" id="exportar-dados"><i class="fas fa-download"></i> Exportar</button><button class="btn-danger" id="limpar-dados"><i class="fas fa-trash"></i> Limpar todos os dados</button></div></div>
        `;
    }

    generateSmartPlan() {
        const hoje = new Date();
        const diaSemanaHoje = hoje.getDay();
        const plano = { hoje: [], semana: [[],[],[],[],[],[],[]], distribuicao: [] };

        const prioridades = this.data.subjects.map(s => {
            let p = s.peso * s.dificuldade;
            const exames = this.data.exams.filter(e => e.materia === s.nome && new Date(e.data) >= hoje && this.diasAte(e.data) <= 7);
            if (exames.length) p *= 2;
            const notas = this.data.grades.filter(g => g.materia === s.nome);
            const media = this.calcularMedia(notas);
            if (media < 6 && media > 0) p *= 1.5;
            if (this.data.settings.heavyMode && s.dificuldade >= 4) p *= 1.3;
            return { materia: s.nome, prioridade: p, dificuldade: s.dificuldade };
        }).sort((a,b) => b.prioridade - a.prioridade);

        prioridades.slice(0,3).forEach((m, i) => {
            plano.hoje.push({
                materia: m.materia,
                tipo: this.sugerirTipoEstudo(m.materia),
                duracao: m.dificuldade >= 4 ? 90 : 60,
                prioridade: i === 0 ? 'alta' : i === 1 ? 'media' : 'baixa',
                motivo: this.gerarMotivoRecomendacao(m.materia)
            });
        });

        prioridades.forEach(m => {
            const dias = [1,2,3,4,5];
            const num = Math.max(1, Math.floor(3 * m.prioridade / prioridades[0].prioridade));
            for (let i = 0; i < num; i++) {
                const d = dias[i % dias.length];
                if (d !== diaSemanaHoje) {
                    plano.semana[d].push({ 
                        materia: m.materia, 
                        duracao: m.dificuldade >= 4 ? 90 : 60, 
                        tipo: this.sugerirTipoEstudo(m.materia) 
                    });
                }
            }
        });

        const totalP = prioridades.reduce((a, m) => a + m.prioridade, 0);
        plano.distribuicao = prioridades.map(m => ({
            materia: m.materia,
            horas: ((m.prioridade / totalP) * 20).toFixed(1),
            percentual: Math.round((m.prioridade / totalP) * 100)
        }));

        return plano;
    }

    generateAlerts() {
        const alerts = [];
        const hoje = new Date();
        this.data.subjects.forEach(s => {
            const ultimo = this.data.sessions.filter(ses => ses.materia === s.nome && ses.concluida).sort((a,b)=>new Date(b.data)-new Date(a.data))[0];
            if (ultimo && this.diasDesde(ultimo.data) >= 5) alerts.push({ type: 'warning', title: `${s.nome} esquecida`, message: `${this.diasDesde(ultimo.data)} dias sem estudar` });
        });
        this.data.exams.forEach(e => {
            const dias = this.diasAte(e.data);
            if (dias <= 3 && dias >= 0) {
                const horas = this.data.sessions.filter(s => s.materia === e.materia && s.concluida).reduce((a,s)=>a+s.duracao,0)/60;
                if (horas < 2) alerts.push({ type: 'danger', title: `Prova de ${e.materia} em ${dias} dias`, message: `Estudou apenas ${horas.toFixed(1)}h` });
            }
        });
        return alerts;
    }

    analyzeAcademicRisk() {
        const risks = [];
        const hoje = new Date();
        this.data.subjects.forEach(s => {
            const notas = this.data.grades.filter(g => g.materia === s.nome);
            const media = this.calcularMedia(notas);
            const exames = this.data.exams.filter(e => e.materia === s.nome && new Date(e.data) >= hoje && this.diasAte(e.data) <= 14);
            const horas = this.data.sessions.filter(ses => ses.materia === s.nome && ses.concluida).reduce((a,s)=>a+s.duracao,0)/60;
            if (media > 0 && media < 6) risks.push({ materia: s.nome, nivel: 'alto', motivo: `Média ${media.toFixed(1)}` });
            else if (exames.length && horas < 3) risks.push({ materia: s.nome, nivel: 'alto', motivo: `Prova próxima, ${horas.toFixed(1)}h estudadas` });
            else if (s.dificuldade >= 4 && horas < 2) risks.push({ materia: s.nome, nivel: 'medio', motivo: 'Matéria difícil, pouco estudo' });
        });
        return risks;
    }

    calcularMedia(notas) {
        if (!notas.length) return 0;
        const soma = notas.reduce((a, n) => a + n.valor * n.peso / 100, 0);
        const totalPeso = notas.reduce((a, n) => a + n.peso, 0);
        return totalPeso ? (soma / totalPeso) * 10 : 0;
    }

    calcularPrevisaoNota(subject, notas) {
        const media = this.calcularMedia(notas);
        const horas = this.data.sessions.filter(s => s.materia === subject.nome && s.concluida).reduce((a,s)=>a+s.duracao,0)/60;
        const restantes = this.data.exams.filter(e => e.materia === subject.nome && new Date(e.data) >= new Date());
        const pesoRestante = restantes.reduce((a, e) => a + e.peso, 0);
        const notaNecessaria = pesoRestante > 0 ? ((subject.notaDesejada * 10) - (media * (10 - pesoRestante/10))) / (pesoRestante/10) : subject.notaDesejada;
        let chance = 50;
        if (horas > subject.dificuldade * 5) chance += 20;
        if (media > 7) chance += 20;
        if (media < 5) chance -= 20;
        if (subject.dificuldade >= 4) chance -= 10;
        if (!restantes.length) chance = media >= 6 ? 100 : 0;
        chance = Math.min(100, Math.max(0, chance));
        const risco = chance < 30 ? 'alto' : chance < 60 ? 'medio' : 'baixo';
        const motivo = chance >= 80 ? 'No caminho certo' : chance >= 50 ? 'Mantenha o foco' : 'Precisa intensificar';
        return { chance: Math.round(chance), notaNecessaria: Math.max(0, notaNecessaria), risco, motivo };
    }

    calcularProgressoHoje() {
        const hoje = new Date().toDateString();
        const sessoes = this.data.sessions.filter(s => new Date(s.data).toDateString() === hoje);
        const planejado = sessoes.reduce((a, s) => a + s.duracao, 0) / 60;
        const concluido = sessoes.filter(s => s.concluida).reduce((a, s) => a + s.duracao, 0) / 60;
        const percentual = planejado ? Math.min((concluido / planejado) * 100, 100) : 0;
        return { planejado: planejado.toFixed(1), concluido: concluido.toFixed(1), percentual };
    }

    calcularProdutividade() {
        const hoje = new Date().toDateString();
        const total = this.data.sessions.filter(s => new Date(s.data).toDateString() === hoje).length;
        const concluidas = this.data.sessions.filter(s => new Date(s.data).toDateString() === hoje && s.concluida).length;
        return total ? Math.round(concluidas / total * 100) + '%' : '0%';
    }

    getUrgentTasks() {
        const hoje = new Date();
        return this.data.tasks.filter(t => !t.concluida && this.diasAte(t.dataLimite) <= 3).sort((a,b)=>new Date(a.dataLimite)-new Date(b.dataLimite));
    }

    getUpcomingExams(days) {
        const hoje = new Date();
        return this.data.exams.filter(e => !e.concluida && this.diasAte(e.data) <= days && this.diasAte(e.data) >= 0).sort((a,b)=>new Date(a.data)-new Date(b.data));
    }

    sugerirTipoEstudo(materia) {
        const notas = this.data.grades.filter(g => g.materia === materia);
        const media = this.calcularMedia(notas);
        if (media < 6) return 'exercicios';
        if (media >= 8) return 'revisao';
        const exames = this.data.exams.filter(e => e.materia === materia && this.diasAte(e.data) <= 7);
        if (exames.length) return 'exercicios';
        return 'teoria';
    }

    gerarMotivoRecomendacao(materia) {
        const exames = this.data.exams.filter(e => e.materia === materia && this.diasAte(e.data) <= 7);
        if (exames.length) return `Prova em ${this.diasAte(exames[0].data)} dias`;
        const notas = this.data.grades.filter(g => g.materia === materia);
        const media = this.calcularMedia(notas);
        if (media < 6 && media > 0) return `Média ${media.toFixed(1)} - precisa melhorar`;
        return 'Manter consistência';
    }

    renderSmartRecommendations() {
        const recs = this.generateAlerts();
        return recs.length ? recs.map(r => `<div class="alert-card ${r.type}"><i class="fas fa-${r.type === 'danger' ? 'exclamation-circle' : 'exclamation-triangle'}"></i><div class="alert-content"><div class="alert-title">${r.title}</div><div class="alert-description">${r.message}</div></div></div>`).join('') : '<p class="text-secondary">Nenhuma recomendação</p>';
    }

    renderAlert(alert) {
        const icon = alert.type === 'warning' ? 'fa-exclamation-triangle' : alert.type === 'danger' ? 'fa-exclamation-circle' : 'fa-info-circle';
        return `<div class="alert-card ${alert.type}"><i class="fas ${icon}"></i><div class="alert-content"><div class="alert-title">${alert.title}</div><div class="alert-description">${alert.message}</div></div></div>`;
    }

    renderConsistencyChart() {
        const hoje = new Date();
        const inicio = new Date(hoje); inicio.setDate(hoje.getDate() - hoje.getDay());
        let html = '<div class="chart-bars">';
        for (let i = 0; i < 7; i++) {
            const data = new Date(inicio); data.setDate(inicio.getDate() + i);
            const estudou = this.data.sessions.some(s => new Date(s.data).toDateString() === data.toDateString() && s.concluida);
            html += `<div class="chart-bar-container"><div class="chart-bar" style="height: ${estudou ? 100 : 20}px"></div><span class="chart-label">${['D','S','T','Q','Q','S','S'][i]}</span></div>`;
        }
        return html + '</div>';
    }

    renderSessoesFocoHoje() {
        const hoje = new Date().toDateString();
        const sessoes = this.data.sessions.filter(s => new Date(s.data).toDateString() === hoje && s.concluida && s.tipo === 'foco');
        return sessoes.length ? sessoes.map(s => `<li><span>${s.materia}</span><span>${s.duracao} min</span></li>`).join('') : '<li>Nenhuma sessão de foco hoje</li>';
    }

    handleSessaoSubmit(e) {
        e.preventDefault();
        this.data.sessions.push({
            id: this.generateId(),
            materia: document.getElementById('sessao-materia').value,
            tipo: document.getElementById('sessao-tipo').value,
            duracao: parseInt(document.getElementById('sessao-duracao').value),
            topico: document.getElementById('sessao-topico').value,
            data: document.getElementById('sessao-data').value,
            concluida: false
        });
        this.saveData();
        document.getElementById('modal-sessao').style.display = 'none';
        this.loadView(this.currentView);
        this.showToast('Sessão adicionada!');
    }

    handleTarefaSubmit(e) {
        e.preventDefault();
        this.data.tasks.push({
            id: this.generateId(),
            titulo: document.getElementById('tarefa-titulo').value,
            materia: document.getElementById('tarefa-materia').value,
            prioridade: document.getElementById('tarefa-prioridade').value,
            dataLimite: document.getElementById('tarefa-data').value,
            estimativa: parseInt(document.getElementById('tarefa-estimativa').value),
            concluida: false
        });
        this.saveData();
        document.getElementById('modal-tarefa').style.display = 'none';
        this.loadView(this.currentView);
        this.showToast('Tarefa adicionada!');
    }

    handleProvaSubmit(e) {
        e.preventDefault();
        this.data.exams.push({
            id: this.generateId(),
            titulo: document.getElementById('prova-titulo').value,
            materia: document.getElementById('prova-materia').value,
            tipo: document.getElementById('prova-tipo').value,
            data: document.getElementById('prova-data').value,
            peso: parseInt(document.getElementById('prova-peso').value),
            importancia: document.getElementById('prova-importancia').value,
            concluida: false
        });
        this.saveData();
        document.getElementById('modal-prova').style.display = 'none';
        this.loadView(this.currentView);
        this.showToast('Evento adicionado!');
    }

    handleTopicoSubmit(e) {
        e.preventDefault();
        this.data.learningMap.push({
            id: this.generateId(),
            materia: document.getElementById('topico-materia').value,
            nome: document.getElementById('topico-nome').value,
            dificuldade: parseInt(document.getElementById('topico-dificuldade').value),
            status: document.getElementById('topico-status').value,
            confianca: parseInt(document.getElementById('topico-confianca').value),
            ultimaRevisao: new Date().toISOString()
        });
        this.saveData();
        document.getElementById('modal-topico').style.display = 'none';
        this.loadView(this.currentView);
        this.showToast('Tópico adicionado!');
    }

    handleNotaSubmit(e) {
        e.preventDefault();
        this.data.grades.push({
            id: this.generateId(),
            materia: document.getElementById('nota-materia').value,
            avaliacao: document.getElementById('nota-avaliacao').value,
            valor: parseFloat(document.getElementById('nota-valor').value),
            peso: parseInt(document.getElementById('nota-peso').value),
            data: new Date().toISOString()
        });
        this.saveData();
        document.getElementById('modal-nota').style.display = 'none';
        this.loadView(this.currentView);
        this.showToast('Nota registrada!');
    }

    handleMaterialSubmit(e) {
        e.preventDefault();
        this.data.materials.push({
            id: this.generateId(),
            titulo: document.getElementById('material-titulo').value,
            materia: document.getElementById('material-materia').value,
            tipo: document.getElementById('material-tipo').value,
            conteudo: document.getElementById('material-conteudo').value
        });
        this.saveData();
        document.getElementById('modal-material').style.display = 'none';
        this.loadView(this.currentView);
        this.showToast('Material adicionado!');
    }

    concluirSessao(id) {
        const s = this.data.sessions.find(s => s.id === id);
        if (s) {
            s.concluida = true;
            this.updateStreak();
            this.saveData();
            this.loadView(this.currentView);
            this.showToast('Sessão concluída!');
        }
    }

    concluirTarefa(id) {
        const t = this.data.tasks.find(t => t.id === id);
        if (t) {
            t.concluida = true;
            this.saveData();
            this.loadView(this.currentView);
            this.showToast('Tarefa concluída!');
        }
    }

    toggleHabito(id) {
        const hoje = new Date().toDateString();
        const idx = this.data.habits.findIndex(h => h.id === id && new Date(h.data).toDateString() === hoje);
        if (idx >= 0) this.data.habits.splice(idx, 1);
        else this.data.habits.push({ id, data: new Date().toISOString() });
        this.saveData();
        this.loadView(this.currentView);
    }

    startTimer() {
        if (this.timerRunning) return;
        const d = parseInt(document.getElementById('timer-duracao').value);
        this.timerSeconds = d * 60;
        this.timerDuration = d;
        this.timerRunning = true;
        document.getElementById('timer-start').style.display = 'none';
        document.getElementById('timer-pause').style.display = 'inline-block';
        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            this.updateTimerDisplay();
            if (this.timerSeconds <= 0) this.timerComplete();
        }, 1000);
    }

    pauseTimer() {
        this.timerRunning = false;
        clearInterval(this.timerInterval);
        document.getElementById('timer-start').style.display = 'inline-block';
        document.getElementById('timer-pause').style.display = 'none';
    }

    resetTimer() {
        this.pauseTimer();
        this.timerSeconds = 0;
        this.updateTimerDisplay();
    }

    timerComplete() {
        this.pauseTimer();
        this.data.sessions.push({
            id: this.generateId(),
            materia: 'Modo Foco',
            tipo: 'foco',
            duracao: this.timerDuration,
            data: new Date().toISOString(),
            concluida: true
        });
        this.saveData();
        this.showToast('Sessão de foco concluída!');
        this.updateStreak();
        this.loadView(this.currentView);
    }

    updateTimerDisplay() {
        const m = Math.floor(this.timerSeconds / 60);
        const s = this.timerSeconds % 60;
        document.getElementById('timer-display').textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }

    exportarDados() {
        const dataStr = JSON.stringify(this.data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'study-life-control-backup.json';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Dados exportados!');
    }

    limparDados() {
        if (confirm('Tem certeza? Todos os dados serão perdidos.')) {
            localStorage.clear();
            location.reload();
        }
    }

    updateStreak() {
        const hoje = new Date().toDateString();
        if (this.data.user.lastStudyDate === hoje) return;
        const ontem = new Date(); ontem.setDate(ontem.getDate() - 1);
        if (this.data.user.lastStudyDate === ontem.toDateString()) this.data.user.streak++;
        else this.data.user.streak = 1;
        this.data.user.lastStudyDate = hoje;
        this.saveData();
        this.updateSidebarInfo();
    }

    updateSidebarInfo() {
        if (!this.data.user) return;
        document.getElementById('sidebar-user-name').textContent = this.data.user.nome;
        document.getElementById('sidebar-streak').textContent = `${this.data.user.streak || 0} dias`;
        document.getElementById('sidebar-user-status').textContent = this.data.user.tipoRotina === 'rotina-pesada' ? '⚡ Pesada' : '📚 Normal';
    }

    calcularHorasPorMateria() {
        const h = {};
        this.data.sessions.filter(s => s.concluida).forEach(s => h[s.materia] = (h[s.materia] || 0) + s.duracao / 60);
        return Object.entries(h).map(([m, h]) => ({ materia: m, horas: h })).sort((a,b) => b.horas - a.horas);
    }

    calcularHorasPorTipo() {
        const t = {};
        this.data.sessions.filter(s => s.concluida).forEach(s => t[s.tipo] = (t[s.tipo] || 0) + s.duracao / 60);
        return Object.entries(t).map(([tipo, h]) => ({ tipo, horas: h })).sort((a,b) => b.horas - a.horas);
    }

    calcularMediaDiaria() {
        if (!this.data.user?.createdAt) return '0.0';
        const dias = Math.max(1, Math.ceil((new Date() - new Date(this.data.user.createdAt)) / 86400000));
        const total = this.data.sessions.filter(s => s.concluida).reduce((a, s) => a + s.duracao / 60, 0);
        return (total / dias).toFixed(1);
    }

    calcularMelhorDia() {
        const dias = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
        const horas = new Array(7).fill(0);
        this.data.sessions.filter(s => s.concluida).forEach(s => horas[new Date(s.data).getDay()] += s.duracao / 60);
        return dias[horas.indexOf(Math.max(...horas))] || 'N/A';
    }

    calcularMelhorDiaHoras() {
        const horas = new Array(7).fill(0);
        this.data.sessions.filter(s => s.concluida).forEach(s => horas[new Date(s.data).getDay()] += s.duracao / 60);
        return Math.max(...horas).toFixed(1);
    }

    calcularTaxaConclusaoTarefas() {
        return this.data.tasks.length ? Math.round(this.data.tasks.filter(t => t.concluida).length / this.data.tasks.length * 100) : 0;
    }

    calcularConsistencia() {
        const hoje = new Date();
        const inicio = new Date(hoje); inicio.setDate(hoje.getDate() - hoje.getDay());
        const dias = new Set();
        this.data.sessions.filter(s => s.concluida).forEach(s => {
            const d = new Date(s.data);
            if (d >= inicio) dias.add(d.toDateString());
        });
        return Math.round(dias.size / 7 * 100);
    }

    diasAte(data) { 
        const diff = new Date(data) - new Date();
        return Math.ceil(diff / 86400000); 
    }
    
    diasDesde(data) { 
        const diff = new Date() - new Date(data);
        return Math.floor(diff / 86400000); 
    }
    
    generateId() { 
        return Date.now().toString(36) + Math.random().toString(36).substr(2); 
    }
    
    getExamRiskClass(e) { 
        const d = this.diasAte(e.data); 
        return d <= 3 ? 'danger' : d <= 7 ? 'warning' : 'success'; 
    }
    
    getMaterialIcon(t) { 
        const icons = { 
            link: 'fa-link', 
            pdf: 'fa-file-pdf', 
            video: 'fa-video', 
            anotacao: 'fa-sticky-note' 
        };
        return icons[t] || 'fa-file'; 
    }
    
    getEventIcon(t) { 
        const icons = { 
            sessao: 'fa-clock', 
            tarefa: 'fa-tasks', 
            exame: 'fa-graduation-cap' 
        };
        return icons[t] || 'fa-calendar'; 
    }
    
    getDiaSemana(i) { 
        return ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][i]; 
    }

    showToast(msg, type = 'success') {
        const c = document.getElementById('toast-container') || (() => { 
            const d = document.createElement('div'); 
            d.id = 'toast-container'; 
            document.body.appendChild(d); 
            return d; 
        })();
        
        const t = document.createElement('div');
        t.className = `toast ${type}`;
        t.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i><span>${msg}</span>`;
        c.appendChild(t);
        
        setTimeout(() => t.classList.add('show'), 100);
        setTimeout(() => { 
            t.classList.remove('show'); 
            setTimeout(() => t.remove(), 300); 
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => { 
    window.app = new StudyLifeControl(); 
});