// app.js - Classe principal do aplicativo COMPLETA, CORRIGIDA E MELHORADA

class StudyLifeControl {
    constructor() {
        this.data = typeof DEFAULT_APP_DATA === 'function' ? DEFAULT_APP_DATA() : {
            user: null,
            subjects: [],
            sessions: [],
            tasks: [],
            exams: [],
            materials: [],
            grades: [],
            habits: [],
            learningMap: [],
            classSchedule: [],
            dailyLogs: [],
            classDiaries: [],
            reviews: [],
            curriculum: [],
            extraCourses: [],
            attendance: {},
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
        this.timerStartedAt = null;
        this.viewRenderer = null;
        this.initialized = false;

        this.editingSessionId = null;
        this.editingTopicId = null;
        this.editingAulaId = null;
        this.editingMateriaId = null;
        this.editingTaskId = null;
        this.editingExamId = null;
        this.editingGradeId = null;
        this.editingMaterialId = null;
        this.editingCurriculumId = null;
        this.editingExtraCourseId = null;
        this.curriculumPrerequisitosSelecionados = [];
    }

    async init() {
        if (this.initialized) return;

        await this.loadData();

        this.viewRenderer = new ViewRenderer(this);
        this.setupEventListeners();
        this.updateSidebarInfo();
        this.applyHeavyMode();

        document.dispatchEvent(new Event('app-ready'));

        window.scheduleManager?.loadAulas();
        window.reviewSystem?.loadReviews();
        window.dailyLogService?.loadLogs();
        window.classDiaryService?.loadDiaries();
        window.gradeCalculator?.loadData();
        window.aiAssistant?.updateContext(this.data);

        this.loadView('dashboard');
        this.initialized = true;
        this.checkDailyReviews();
    }

    async loadData() {
        const user = auth.currentUser;
        if (!user) return this.data;

        const data = await dbService.loadUserData(user.uid);
        this.data = data || (typeof DEFAULT_APP_DATA === 'function' ? DEFAULT_APP_DATA() : this.data);
        if (!Array.isArray(this.data.curriculum)) this.data.curriculum = [];
        if (!Array.isArray(this.data.extraCourses)) this.data.extraCourses = [];
        this.normalizeCurriculumInMemory();
        return this.data;
    }

    checkDailyReviews() {
        if (!window.reviewSystem) return;

        const revisoesHoje = window.reviewSystem.getRevisoesHoje();
        if (revisoesHoje.length > 0) {
            showToast(`Você tem ${revisoesHoje.length} revisão(ões) para hoje!`, 'info');
        }
    }

    renderSetupForm() {
        const container = document.getElementById('materias-container');
        if (container) {
            container.innerHTML = '';
            this.addMateriaField();
        }

        const aulasContainer = document.getElementById('aulas-container');
        if (aulasContainer) aulasContainer.innerHTML = '';
    }

    addMateriaField() {
        const container = document.getElementById('materias-container');
        if (!container) return;

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

        item.querySelector('.btn-remove')?.addEventListener('click', () => item.remove());
        container.appendChild(item);
    }

    addAulaField() {
        const container = document.getElementById('aulas-container');
        if (!container) return;

        const materiaInputs = document.querySelectorAll('.materia-nome');
        const materias = Array.from(materiaInputs)
            .map(input => input.value.trim())
            .filter(Boolean);

        if (!materias.length) {
            showToast('Adicione pelo menos uma matéria primeiro', 'warning');
            return;
        }

        const item = document.createElement('div');
        item.className = 'aula-item';

        const optionsHtml = [
            '<option value="">Selecione</option>',
            ...materias.map(m => `<option value="${escapeHtml(m)}">${escapeHtml(m)}</option>`)
        ].join('');

        item.innerHTML = `
            <div class="aula-fields">
                <select class="aula-materia" required>${optionsHtml}</select>
                <select class="aula-dia" required>
                    <option value="0">Domingo</option>
                    <option value="1">Segunda</option>
                    <option value="2">Terça</option>
                    <option value="3">Quarta</option>
                    <option value="4">Quinta</option>
                    <option value="5">Sexta</option>
                    <option value="6">Sábado</option>
                </select>
                <input type="time" class="aula-inicio" required>
                <input type="time" class="aula-fim" required>
                <input type="text" class="aula-sala" placeholder="Sala">
                <input type="text" class="aula-professor" placeholder="Professor">
            </div>
            <button type="button" class="btn-remove"><i class="fas fa-times"></i></button>
        `;

        item.querySelector('.btn-remove')?.addEventListener('click', () => item.remove());
        container.appendChild(item);
    }

    async handleSetupSubmit(e) {
        e.preventDefault();
        showLoading();

        try {
            const subjects = [];
            document.querySelectorAll('.materia-item').forEach(item => {
                const nome = item.querySelector('.materia-nome')?.value.trim();
                if (!nome) return;

                subjects.push({
                    id: generateId(),
                    nome,
                    dificuldade: parseInt(item.querySelector('.materia-dificuldade')?.value, 10) || 3,
                    peso: parseInt(item.querySelector('.materia-peso')?.value, 10) || 3,
                    notaDesejada: parseFloat(item.querySelector('.materia-nota-desejada')?.value) || 7
                });
            });

            const diasPreferidos = Array.from(
                document.querySelectorAll('#dias-preferidos-container input:checked')
            ).map(cb => cb.value);

            this.data.user = {
                nome: document.getElementById('nome')?.value?.trim() || '',
                curso: document.getElementById('curso')?.value?.trim() || '',
                universidade: document.getElementById('universidade')?.value?.trim() || '',
                semestre: document.getElementById('semestre')?.value || '',
                turnoPrincipal: document.getElementById('turno-principal')?.value || 'noite',
                diasPreferidos,
                horasMaximas: parseInt(document.getElementById('horas-maximas')?.value, 10) || 6,
                horarioSono: document.getElementById('horario-sono')?.value || '',
                tempoDeslocamento: parseInt(document.getElementById('tempo-deslocamento')?.value, 10) || 30,
                tipoRotina: document.getElementById('tipo-rotina')?.value || 'so-estuda',
                nivelDisciplina: document.getElementById('nivel-disciplina')?.value || 'medio',
                dificuldadeAtual: document.getElementById('dificuldade-atual')?.value || 'organizacao',
                createdAt: new Date().toISOString(),
                streak: 0,
                lastStudyDate: null
            };

            this.data.subjects = subjects;

            const aulas = [];
            document.querySelectorAll('.aula-item').forEach(item => {
                const materia = item.querySelector('.aula-materia')?.value;
                if (!materia) return;

                aulas.push({
                    id: generateId(),
                    materia,
                    dia: item.querySelector('.aula-dia')?.value || '1',
                    inicio: item.querySelector('.aula-inicio')?.value || '',
                    fim: item.querySelector('.aula-fim')?.value || '',
                    sala: item.querySelector('.aula-sala')?.value || '',
                    professor: item.querySelector('.aula-professor')?.value || '',
                    bloco: '',
                    cor: '#3b82f6'
                });
            });

            this.data.classSchedule = aulas;

            const success = await dbService.saveAllData(this.data);

            if (success) {
                document.getElementById('setup-screen')?.style.setProperty('display', 'none');
                document.getElementById('main-dashboard')?.style.setProperty('display', 'block');
                this.updateSidebarInfo();
                this.loadView('dashboard');
                showToast('Configuração concluída!');
            }
        } catch (error) {
            console.error('Erro no setup:', error);
            showToast('Erro ao concluir configuração', 'error');
        } finally {
            hideLoading();
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();

                const view = e.currentTarget.dataset.view;
                this.loadView(view);

                document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
                e.currentTarget.classList.add('active');

                const span = e.currentTarget.querySelector('span');
                const pageTitle = document.getElementById('page-title');
                if (span && pageTitle) pageTitle.textContent = span.textContent;
            });
        });

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.modal').forEach(modal => {
                    modal.style.display = 'none';
                });
                this.resetModalStates();
            });
        });

        window.addEventListener('click', e => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
                this.resetModalStates();
            }
        });

        document.getElementById('form-sessao')?.addEventListener('submit', e => this.handleSessaoSubmit(e));
        document.getElementById('form-tarefa')?.addEventListener('submit', e => this.handleTarefaSubmit(e));
        document.getElementById('form-prova')?.addEventListener('submit', e => this.handleProvaSubmit(e));
        document.getElementById('form-topico')?.addEventListener('submit', e => this.handleTopicoSubmit(e));
        document.getElementById('form-nota')?.addEventListener('submit', e => this.handleNotaSubmit(e));
        document.getElementById('form-material')?.addEventListener('submit', e => this.handleMaterialSubmit(e));
        document.getElementById('form-materia')?.addEventListener('submit', e => this.handleMateriaSubmit(e));
        document.getElementById('form-curriculum')?.addEventListener('submit', e => this.handleCurriculumSubmit(e));
        document.getElementById('form-extra-course')?.addEventListener('submit', e => this.handleExtraCourseSubmit(e));
        document.getElementById('form-aula')?.addEventListener('submit', e => this.handleAulaSubmit(e));
        document.getElementById('form-daily-log')?.addEventListener('submit', e => this.handleDailyLogSubmit(e));
        document.getElementById('form-class-diary')?.addEventListener('submit', e => this.handleClassDiarySubmit(e));

        document.getElementById('modo-faculdade-pesada')?.addEventListener('change', async e => {
            this.data.settings.heavyMode = e.target.checked;
            await dbService.saveData('settings', this.data.settings);
            this.applyHeavyMode();
            showToast(`Modo Faculdade Pesada ${e.target.checked ? 'ativado' : 'desativado'}`, 'info');
        });

        document.getElementById('refresh-data')?.addEventListener('click', async () => {
            await this.loadData();
            this.loadView(this.currentView);
            showToast('Dados atualizados');
        });
    }

    resetModalStates() {
        this.editingSessionId = null;
        this.editingTopicId = null;
        this.editingAulaId = null;
        this.editingMateriaId = null;
        this.editingTaskId = null;
        this.editingExamId = null;
        this.editingGradeId = null;
        this.editingMaterialId = null;
        this.editingCurriculumId = null;
        this.editingExtraCourseId = null;
        this.curriculumPrerequisitosSelecionados = [];

        const sessaoBtn = document.querySelector('#form-sessao .btn-primary');
        const topicoBtn = document.querySelector('#form-topico .btn-primary');
        const aulaBtn = document.querySelector('#form-aula .btn-primary');
        const tarefaBtn = document.querySelector('#form-tarefa .btn-primary');
        const provaBtn = document.querySelector('#form-prova .btn-primary');
        const notaBtn = document.querySelector('#form-nota .btn-primary');
        const materialBtn = document.querySelector('#form-material .btn-primary');
        const materiaBtn = document.querySelector('#form-materia .btn-primary');
        const curriculumBtn = document.querySelector('#form-curriculum .btn-primary');
        const extraCourseBtn = document.querySelector('#form-extra-course .btn-primary');

        if (sessaoBtn) sessaoBtn.textContent = 'Agendar Sessão';
        if (topicoBtn) topicoBtn.textContent = 'Adicionar Tópico';
        if (aulaBtn) aulaBtn.textContent = 'Salvar Aula';
        if (tarefaBtn) tarefaBtn.textContent = 'Adicionar Tarefa';
        if (provaBtn) provaBtn.textContent = 'Salvar';
        if (notaBtn) notaBtn.textContent = 'Registrar Nota';
        if (materialBtn) materialBtn.textContent = 'Salvar Material';
        if (materiaBtn) materiaBtn.textContent = 'Salvar Matéria';
        if (curriculumBtn) curriculumBtn.textContent = 'Salvar Componente';
        if (extraCourseBtn) extraCourseBtn.textContent = 'Salvar Curso';
    }

    applyHeavyMode() {
        if (this.data.settings?.heavyMode) {
            document.body.classList.add('heavy-mode');
        } else {
            document.body.classList.remove('heavy-mode');
        }

        const checkbox = document.getElementById('modo-faculdade-pesada');
        if (checkbox) checkbox.checked = !!this.data.settings?.heavyMode;

        const configCheckbox = document.getElementById('config-heavy-mode');
        if (configCheckbox) configCheckbox.checked = !!this.data.settings?.heavyMode;
    }

    updateSidebarInfo() {
        if (!this.data.user) return;

        const user = auth.currentUser;
        const nameEl = document.getElementById('sidebar-user-name');
        const emailEl = document.getElementById('sidebar-user-email');
        const streakEl = document.getElementById('sidebar-streak');
        const avatarEl = document.getElementById('user-avatar');

        if (nameEl) nameEl.textContent = this.data.user.nome || 'Usuário';
        if (emailEl) emailEl.textContent = user?.email || '';
        if (streakEl) streakEl.textContent = `${this.data.user.streak || 0} dias`;

        if (avatarEl) {
            if (user?.photoURL) {
                avatarEl.src = user.photoURL;
                avatarEl.style.display = 'block';
            } else {
                avatarEl.style.display = 'none';
            }
        }
    }

    loadView(view) {
        if (!this.viewRenderer) {
            this.viewRenderer = new ViewRenderer(this);
        }

        this.currentView = view;
        const container = document.getElementById('view-container');
        if (!container) return;

        let html = '';

        switch (view) {
            case 'dashboard': html = this.viewRenderer.renderDashboard(); break;
            case 'mentor-ia': html = this.viewRenderer.renderMentorIA(); break;
            case 'grade-horaria': html = this.viewRenderer.renderGradeHoraria(); break;
            case 'sessoes': html = this.viewRenderer.renderSessoes(); break;
            case 'tarefas': html = this.viewRenderer.renderTarefas(); break;
            case 'provas': html = this.viewRenderer.renderProvas(); break;
            case 'mapa-aprendizado': html = this.viewRenderer.renderMapaAprendizado(); break;
            case 'materiais': html = this.viewRenderer.renderMateriais(); break;
            case 'calendario': html = this.viewRenderer.renderCalendario(); break;
            case 'previsao-notas': html = this.viewRenderer.renderPrevisaoNotas(); break;
            case 'habitos': html = this.viewRenderer.renderHabitos(); break;
            case 'estatisticas': html = this.viewRenderer.renderEstatisticas(); break;
            case 'foco': html = this.viewRenderer.renderModoFoco(); break;
            case 'configuracoes': html = this.viewRenderer.renderConfiguracoes(); break;
            case 'materias': html = this.viewRenderer.renderMaterias(); break;
            case 'grade-curricular': html = this.viewRenderer.renderGradeCurricular(); break;
            case 'cursos-extras': html = this.viewRenderer.renderCursosExtras(); break;
            default: html = this.viewRenderer.renderDashboard();
        }

        container.innerHTML = html;
        this.setupViewEvents(view);
        window.aiAssistant?.updateContext(this.data);
    }

    setupViewEvents(view) {
        if (view === 'sessoes') {
            document.getElementById('btn-nova-sessao')?.addEventListener('click', () => this.openModal('sessao'));

            document.querySelectorAll('.btn-concluir-sessao').forEach(btn => {
                btn.addEventListener('click', e => this.concluirSessao(e.currentTarget.dataset.id));
            });

            document.querySelectorAll('.btn-editar-sessao').forEach(btn => {
                btn.addEventListener('click', e => this.editarSessao(e.currentTarget.dataset.id));
            });

            document.querySelectorAll('.btn-excluir-sessao').forEach(btn => {
                btn.addEventListener('click', e => this.excluirSessao(e.currentTarget.dataset.id));
            });
        }

        if (view === 'tarefas') {
            document.getElementById('btn-nova-tarefa')?.addEventListener('click', () => this.openModal('tarefa'));

            document.querySelectorAll('.btn-concluir-tarefa').forEach(btn => {
                btn.addEventListener('click', e => this.concluirTarefa(e.currentTarget.dataset.id));
            });

            document.querySelectorAll('.btn-editar-tarefa').forEach(btn => {
                btn.addEventListener('click', e => this.editarTarefa(e.currentTarget.dataset.id));
            });

            document.querySelectorAll('.btn-excluir-tarefa').forEach(btn => {
                btn.addEventListener('click', e => this.excluirTarefa(e.currentTarget.dataset.id));
            });
        }

        if (view === 'provas') {
            document.getElementById('btn-nova-prova')?.addEventListener('click', () => this.openModal('prova'));

            document.querySelectorAll('.btn-editar-prova').forEach(btn => {
                btn.addEventListener('click', e => this.editarProva(e.currentTarget.dataset.id));
            });

            document.querySelectorAll('.btn-excluir-prova').forEach(btn => {
                btn.addEventListener('click', e => this.excluirProva(e.currentTarget.dataset.id));
            });
        }

        if (view === 'grade-horaria') {
            document.getElementById('btn-nova-aula')?.addEventListener('click', () => this.openModal('aula'));

            document.querySelectorAll('.btn-remover-aula').forEach(btn => {
                btn.addEventListener('click', async e => {
                    const id = e.currentTarget.dataset.id;
                    if (window.scheduleManager) {
                        await window.scheduleManager.removeAula(id);
                        document.dispatchEvent(new Event('aulas-atualizadas'));
                    }
                    this.loadView('grade-horaria');
                    showToast('Aula removida');
                });
            });

            document.querySelectorAll('.btn-editar-aula').forEach(btn => {
                btn.addEventListener('click', e => this.editarAula(e.currentTarget.dataset.id));
            });

            document.getElementById('grade-view-mode')?.addEventListener('change', e => {
                if (window.scheduleManager) {
                    window.scheduleManager.viewMode = e.target.value === 'semana' ? 'week' : 'day';
                }
                this.loadView('grade-horaria');
            });

            document.getElementById('grade-day-select')?.addEventListener('change', e => {
                if (window.scheduleManager) {
                    window.scheduleManager.selectedDay = parseInt(e.target.value, 10);
                }
                this.loadView('grade-horaria');
            });

            document.getElementById('exportar-grade')?.addEventListener('click', () => this.exportarGradeHoraria());
        }

        if (view === 'mentor-ia') {
            this.setupIAEvents();
        }

        if (view === 'mapa-aprendizado') {
            document.getElementById('btn-novo-topico')?.addEventListener('click', () => this.openModal('topico'));

            document.querySelectorAll('.btn-editar-topico').forEach(btn => {
                btn.addEventListener('click', e => this.editarTopico(e.currentTarget.dataset.id));
            });

            document.querySelectorAll('.btn-excluir-topico').forEach(btn => {
                btn.addEventListener('click', e => this.excluirTopico(e.currentTarget.dataset.id));
            });
        }

        if (view === 'previsao-notas') {
            document.getElementById('btn-registrar-nota')?.addEventListener('click', () => this.openModal('nota'));

            document.querySelectorAll('.btn-editar-nota').forEach(btn => {
                btn.addEventListener('click', e => this.editarNota(e.currentTarget.dataset.id));
            });

            document.querySelectorAll('.btn-excluir-nota').forEach(btn => {
                btn.addEventListener('click', e => this.excluirNota(e.currentTarget.dataset.id));
            });
        }

        if (view === 'materiais') {
            document.getElementById('btn-novo-material')?.addEventListener('click', () => this.openModal('material'));

            document.querySelectorAll('.btn-editar-material').forEach(btn => {
                btn.addEventListener('click', e => this.editarMaterial(e.currentTarget.dataset.id));
            });

            document.querySelectorAll('.btn-excluir-material').forEach(btn => {
                btn.addEventListener('click', e => this.excluirMaterial(e.currentTarget.dataset.id));
            });
        }

        if (view === 'foco') {
            document.getElementById('timer-start')?.addEventListener('click', () => this.startTimer());
            document.getElementById('timer-pause')?.addEventListener('click', () => this.pauseTimer());
            document.getElementById('timer-reset')?.addEventListener('click', () => this.resetTimer());
        }

        if (view === 'habitos') {
            document.querySelectorAll('.toggle-habito').forEach(btn => {
                btn.addEventListener('click', e => this.toggleHabito(e.currentTarget.dataset.habito));
            });
        }

        if (view === 'configuracoes') {
            document.getElementById('config-notificacoes')?.addEventListener('change', async e => {
                this.data.settings.notifications = e.target.checked;
                await dbService.saveData('settings', this.data.settings);
            });

            document.getElementById('config-auto-plan')?.addEventListener('change', async e => {
                this.data.settings.autoPlan = e.target.checked;
                await dbService.saveData('settings', this.data.settings);
            });

            document.getElementById('config-heavy-mode')?.addEventListener('change', async e => {
                this.data.settings.heavyMode = e.target.checked;
                await dbService.saveData('settings', this.data.settings);
                this.applyHeavyMode();
            });

            document.getElementById('exportar-dados')?.addEventListener('click', () => this.exportarDados());
            document.getElementById('limpar-dados')?.addEventListener('click', () => this.limparDados());
        }

        if (view === 'materias') {
            document.getElementById('btn-nova-materia')?.addEventListener('click', () => this.openModal('materia'));

            document.querySelectorAll('.btn-editar-materia').forEach(btn => {
                btn.addEventListener('click', e => this.editarMateria(e.currentTarget.dataset.id));
            });

            document.querySelectorAll('.btn-excluir-materia').forEach(btn => {
                btn.addEventListener('click', e => this.excluirMateria(e.currentTarget.dataset.id));
            });
        }

        if (view === 'grade-curricular') {
            document.getElementById('btn-novo-curriculum')?.addEventListener('click', () => this.openModal('curriculum'));
            document.getElementById('btn-importar-ufob')?.addEventListener('click', () => this.importarGradeUfob());

            document.querySelectorAll('.btn-editar-curriculum').forEach(btn => {
                btn.addEventListener('click', e => this.editarCurriculum(e.currentTarget.dataset.id));
            });

            document.querySelectorAll('.btn-excluir-curriculum').forEach(btn => {
                btn.addEventListener('click', e => this.excluirCurriculum(e.currentTarget.dataset.id));
            });
        }

        if (view === 'cursos-extras') {
            document.getElementById('btn-novo-extra-course')?.addEventListener('click', () => this.openModal('extra-course'));

            document.querySelectorAll('.btn-editar-extra-course').forEach(btn => {
                btn.addEventListener('click', e => this.editarExtraCourse(e.currentTarget.dataset.id));
            });

            document.querySelectorAll('.btn-excluir-extra-course').forEach(btn => {
                btn.addEventListener('click', e => this.excluirExtraCourse(e.currentTarget.dataset.id));
            });
        }

        document.getElementById('quick-sessao')?.addEventListener('click', () => this.openModal('sessao'));
        document.getElementById('quick-tarefa')?.addEventListener('click', () => this.openModal('tarefa'));
        document.getElementById('quick-prova')?.addEventListener('click', () => this.openModal('prova'));
        document.getElementById('quick-foco')?.addEventListener('click', () => this.loadView('foco'));
        document.getElementById('perguntar-ia')?.addEventListener('click', () => this.loadView('mentor-ia'));

        document.querySelectorAll('.btn-adicionar-sessao-rapida').forEach(btn => {
            btn.addEventListener('click', e => {
                this.openModal('sessao', {
                    materia: e.currentTarget.dataset.materia,
                    tipo: e.currentTarget.dataset.tipo,
                    duracao: e.currentTarget.dataset.duracao
                });
            });
        });
    }

    setupIAEvents() {
        const input = document.getElementById('chat-input');
        const sendBtn = document.getElementById('chat-send');
        const messages = document.getElementById('chat-messages');

        if (!input || !sendBtn || !messages) return;

        const appendMessage = (role, content, isLoading = false) => {
            const wrapper = document.createElement('div');
            wrapper.className = `message ${role}${isLoading ? ' loading' : ''}`;

            const contentEl = document.createElement('div');
            contentEl.className = 'message-content';

            if (role === 'assistant') {
                contentEl.innerHTML = nl2brSafe(content);
            } else {
                contentEl.textContent = content;
            }

            wrapper.appendChild(contentEl);
            messages.appendChild(wrapper);
            messages.scrollTop = messages.scrollHeight;

            return wrapper;
        };

        const sendMessage = async () => {
            const text = input.value.trim();
            if (!text) return;

            appendMessage('user', text);
            input.value = '';

            const loadingEl = appendMessage('assistant', 'Pensando...', true);

            try {
                window.aiAssistant?.updateContext(this.data);
                const resposta = await window.aiAssistant.ask(text);

                loadingEl.remove();
                appendMessage('assistant', resposta || 'Não consegui responder agora.');
            } catch (error) {
                console.error('Erro no chat IA:', error);
                loadingEl.remove();
                appendMessage('assistant', 'Deu erro ao responder. Tenta de novo.');
            }
        };

        sendBtn.onclick = sendMessage;
        input.onkeypress = e => {
            if (e.key === 'Enter') sendMessage();
        };

        document.querySelectorAll('.sugestao-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                input.value = btn.dataset.pergunta || '';
                sendMessage();
            });
        });

        document.getElementById('ia-plano-hoje')?.addEventListener('click', () => {
            input.value = 'Qual meu plano de estudo para hoje?';
            sendMessage();
        });

        document.getElementById('ia-plano-semana')?.addEventListener('click', () => {
            input.value = 'Qual o plano para a semana?';
            sendMessage();
        });

        document.getElementById('ia-analisar-risco')?.addEventListener('click', () => {
            input.value = 'Quais os riscos acadêmicos?';
            sendMessage();
        });
    }

    populateSubjectSelects() {
        const selectIds = [
            'sessao-materia',
            'tarefa-materia',
            'prova-materia',
            'topico-materia',
            'nota-materia',
            'material-materia',
            'aula-materia'
        ];

        selectIds.forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;

            const currentValue = select.value;
            select.innerHTML = '<option value="">Selecione</option>';

            this.data.subjects.forEach(s => {
                const option = document.createElement('option');
                option.value = s.nome;
                option.textContent = s.nome;
                select.appendChild(option);
            });

            if (currentValue && this.data.subjects.some(s => s.nome === currentValue)) {
                select.value = currentValue;
            }
        });
    }

    openModal(modalType, data = {}) {
        if (['sessao', 'tarefa', 'prova', 'topico', 'nota', 'material', 'aula', 'curriculum', 'extra-course'].includes(modalType)) {
            this.populateSubjectSelects();
        }

        if (modalType === 'sessao') {
            const btn = document.querySelector('#form-sessao .btn-primary');
            if (btn) btn.textContent = this.editingSessionId ? 'Atualizar Sessão' : 'Agendar Sessão';

            if (data.materia) document.getElementById('sessao-materia').value = data.materia;
            if (data.tipo) document.getElementById('sessao-tipo').value = data.tipo;
            if (data.duracao) document.getElementById('sessao-duracao').value = data.duracao;

            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            document.getElementById('sessao-data').value = data.data || now.toISOString().slice(0, 16);
            document.getElementById('sessao-topico').value = data.topico || '';
        }

        if (modalType === 'tarefa') {
            const btn = document.querySelector('#form-tarefa .btn-primary');
            if (btn) btn.textContent = this.editingTaskId ? 'Atualizar Tarefa' : 'Adicionar Tarefa';

            document.getElementById('tarefa-titulo').value = data.titulo || '';
            if (data.materia) document.getElementById('tarefa-materia').value = data.materia;
            document.getElementById('tarefa-prioridade').value = data.prioridade || 'media';
            document.getElementById('tarefa-data').value = data.dataLimite || '';
            document.getElementById('tarefa-estimativa').value = data.estimativa || 60;
        }

        if (modalType === 'prova') {
            const btn = document.querySelector('#form-prova .btn-primary');
            if (btn) btn.textContent = this.editingExamId ? 'Atualizar' : 'Salvar';

            document.getElementById('prova-titulo').value = data.titulo || '';
            if (data.materia) document.getElementById('prova-materia').value = data.materia;
            document.getElementById('prova-tipo').value = data.tipo || 'prova';
            document.getElementById('prova-data').value = data.data || '';
            document.getElementById('prova-peso').value = data.peso || 100;
            document.getElementById('prova-importancia').value = data.importancia || 'alta';
        }

        if (modalType === 'topico') {
            const btn = document.querySelector('#form-topico .btn-primary');
            if (btn) btn.textContent = this.editingTopicId ? 'Atualizar Tópico' : 'Adicionar Tópico';

            if (data.materia) document.getElementById('topico-materia').value = data.materia;
            document.getElementById('topico-nome').value = data.nome || '';
            document.getElementById('topico-dificuldade').value = data.dificuldade || 3;
            document.getElementById('topico-status').value = data.status || 'nao-comecei';
            document.getElementById('topico-confianca').value = data.confianca || 3;
        }

        if (modalType === 'nota') {
            const btn = document.querySelector('#form-nota .btn-primary');
            if (btn) btn.textContent = this.editingGradeId ? 'Atualizar Nota' : 'Registrar Nota';

            if (data.materia) document.getElementById('nota-materia').value = data.materia;
            document.getElementById('nota-avaliacao').value = data.avaliacao || '';
            document.getElementById('nota-valor').value = data.valor ?? '';
            document.getElementById('nota-peso').value = data.peso || 100;
        }

        if (modalType === 'material') {
            const btn = document.querySelector('#form-material .btn-primary');
            if (btn) btn.textContent = this.editingMaterialId ? 'Atualizar Material' : 'Salvar Material';

            document.getElementById('material-titulo').value = data.titulo || '';
            if (data.materia) document.getElementById('material-materia').value = data.materia;
            document.getElementById('material-tipo').value = data.tipo || 'link';
            document.getElementById('material-conteudo').value = data.conteudo || '';
        }

        if (modalType === 'aula') {
            const btn = document.querySelector('#form-aula .btn-primary');
            if (btn) btn.textContent = this.editingAulaId ? 'Atualizar Aula' : 'Salvar Aula';

            if (data.materia) document.getElementById('aula-materia').value = data.materia;
            if (data.dia !== undefined) document.getElementById('aula-dia').value = data.dia;
            if (data.inicio) document.getElementById('aula-inicio').value = data.inicio;
            if (data.fim) document.getElementById('aula-fim').value = data.fim;
            document.getElementById('aula-sala').value = data.sala || '';
            document.getElementById('aula-professor').value = data.professor || '';
            if (document.getElementById('aula-bloco')) document.getElementById('aula-bloco').value = data.bloco || '';
            if (document.getElementById('aula-cor')) document.getElementById('aula-cor').value = data.cor || '#3b82f6';
        }

        if (modalType === 'materia') {
            const btn = document.querySelector('#form-materia .btn-primary');
            if (btn) btn.textContent = this.editingMateriaId ? 'Atualizar Matéria' : 'Salvar Matéria';

            document.getElementById('materia-nome-modal').value = data.nome || '';
            document.getElementById('materia-dificuldade-modal').value = data.dificuldade || 3;
            document.getElementById('materia-peso-modal').value = data.peso || 3;
            document.getElementById('materia-nota-desejada-modal').value = data.notaDesejada || 7;
            document.getElementById('materia-carga-horaria-modal').value = data.cargaHoraria || '';
            document.getElementById('materia-professor-modal').value = data.professor || '';
        }

        if (modalType === 'curriculum') {
            const btn = document.querySelector('#form-curriculum .btn-primary');
            if (btn) btn.textContent = this.editingCurriculumId ? 'Atualizar Componente' : 'Salvar Componente';

            document.getElementById('curriculum-nome').value = data.nome || '';
            document.getElementById('curriculum-semestre').value = data.semestre || '';
            document.getElementById('curriculum-carga-horaria').value = data.cargaHoraria || '';
            document.getElementById('curriculum-status').value = data.status || 'nao-cursada';
            document.getElementById('curriculum-tipo').value = data.tipo || 'obrigatoria';
            document.getElementById('curriculum-creditos').value = data.creditos || '';
            document.getElementById('curriculum-prerequisitos').value = data.prerequisitos || '';
            document.getElementById('curriculum-observacoes').value = data.observacoes || '';
            this.curriculumPrerequisitosSelecionados = this.normalizePrerequisitos(data.prerequisitosLista || data.prerequisitos || '');
            this.setupCurriculumModalUI(data.nome || '');
        }

        if (modalType === 'extra-course') {
            const btn = document.querySelector('#form-extra-course .btn-primary');
            if (btn) btn.textContent = this.editingExtraCourseId ? 'Atualizar Curso' : 'Salvar Curso';

            document.getElementById('extra-course-nome').value = data.nome || '';
            document.getElementById('extra-course-plataforma').value = data.plataforma || '';
            document.getElementById('extra-course-area').value = data.area || '';
            document.getElementById('extra-course-status').value = data.status || 'em-andamento';
            document.getElementById('extra-course-meta-horas').value = data.metaHoras || '';
            document.getElementById('extra-course-horas-estudadas').value = data.horasEstudadas || '';
            document.getElementById('extra-course-progresso').value = data.progresso || '';
            document.getElementById('extra-course-data-inicio').value = data.dataInicio || '';
            document.getElementById('extra-course-link').value = data.link || '';
            document.getElementById('extra-course-observacoes').value = data.observacoes || '';
        }

        const modal = document.getElementById(`modal-${modalType}`);
        if (modal) modal.style.display = 'block';
    }

    async salvarNovaMateria(materiaData) {
        const existe = this.data.subjects.some(s => s.nome.toLowerCase() === materiaData.nome.toLowerCase());
        if (existe) {
            showToast('Já existe uma matéria com esse nome', 'warning');
            return;
        }

        const success = await dbService.addItem('subjects', {
            id: generateId(),
            ...materiaData
        });

        if (success) {
            this.loadView(this.currentView);
            showToast('Matéria adicionada!');
        }
    }

    async salvarMateriaEditada(id, materiaData) {
        const materiaAntiga = this.data.subjects.find(s => s.id === id);
        if (!materiaAntiga) return;

        const nomeAntigo = materiaAntiga.nome;
        const nomeNovo = materiaData.nome;

        if (nomeNovo !== nomeAntigo) {
            this.data.sessions.forEach(item => { if (item.materia === nomeAntigo) item.materia = nomeNovo; });
            this.data.tasks.forEach(item => { if (item.materia === nomeAntigo) item.materia = nomeNovo; });
            this.data.exams.forEach(item => { if (item.materia === nomeAntigo) item.materia = nomeNovo; });
            this.data.learningMap.forEach(item => { if (item.materia === nomeAntigo) item.materia = nomeNovo; });
            this.data.grades.forEach(item => { if (item.materia === nomeAntigo) item.materia = nomeNovo; });
            this.data.materials.forEach(item => { if (item.materia === nomeAntigo) item.materia = nomeNovo; });
            this.data.classSchedule.forEach(item => { if (item.materia === nomeAntigo) item.materia = nomeNovo; });
            this.data.classDiaries.forEach(item => { if (item.materia === nomeAntigo) item.materia = nomeNovo; });
            this.data.reviews.forEach(item => { if (item.materia === nomeAntigo) item.materia = nomeNovo; });
        }

        const index = this.data.subjects.findIndex(s => s.id === id);
        this.data.subjects[index] = { ...this.data.subjects[index], ...materiaData };

        const success = await dbService.saveAllData(this.data);
        if (success) {
            this.editingMateriaId = null;
            this.loadView(this.currentView);
            showToast('Matéria atualizada!');
        }
    }

    async handleMateriaSubmit(e) {
        e.preventDefault();

        const materiaData = {
            nome: document.getElementById('materia-nome-modal')?.value?.trim() || '',
            dificuldade: parseInt(document.getElementById('materia-dificuldade-modal')?.value, 10) || 3,
            peso: parseInt(document.getElementById('materia-peso-modal')?.value, 10) || 3,
            notaDesejada: parseFloat(document.getElementById('materia-nota-desejada-modal')?.value) || 7,
            cargaHoraria: parseInt(document.getElementById('materia-carga-horaria-modal')?.value, 10) || 0,
            professor: document.getElementById('materia-professor-modal')?.value?.trim() || ''
        };

        if (!materiaData.nome) {
            showToast('Informe o nome da matéria', 'warning');
            return;
        }

        if (this.editingMateriaId) {
            await this.salvarMateriaEditada(this.editingMateriaId, materiaData);
        } else {
            await this.salvarNovaMateria(materiaData);
        }

        document.getElementById('modal-materia').style.display = 'none';
        this.resetModalStates();
    }

    async handleCurriculumSubmit(e) {
        e.preventDefault();

        const curriculumData = {
            nome: document.getElementById('curriculum-nome')?.value?.trim() || '',
            semestre: document.getElementById('curriculum-semestre')?.value?.trim() || '',
            cargaHoraria: parseInt(document.getElementById('curriculum-carga-horaria')?.value, 10) || 0,
            status: document.getElementById('curriculum-status')?.value || 'nao-cursada',
            tipo: document.getElementById('curriculum-tipo')?.value || 'obrigatoria',
            creditos: parseFloat(document.getElementById('curriculum-creditos')?.value) || 0,
            prerequisitos: document.getElementById('curriculum-prerequisitos')?.value?.trim() || '',
            observacoes: document.getElementById('curriculum-observacoes')?.value?.trim() || ''
        };

        if (!curriculumData.nome) {
            showToast('Informe o nome da disciplina/componente', 'warning');
            return;
        }

        if (this.editingCurriculumId) {
            await this.salvarCurriculumEditado(this.editingCurriculumId, curriculumData);
        } else {
            await this.salvarNovoCurriculum(curriculumData);
        }

        document.getElementById('modal-curriculum').style.display = 'none';
        this.resetModalStates();
    }

    async salvarNovoCurriculum(curriculumData) {
        if (!Array.isArray(this.data.curriculum)) this.data.curriculum = [];

        const existe = this.data.curriculum.some(item => item.nome.toLowerCase() === curriculumData.nome.toLowerCase());
        if (existe) {
            showToast('Esse componente já está na grade curricular', 'warning');
            return;
        }

        const success = await dbService.addItem('curriculum', {
            id: generateId(),
            ...curriculumData
        });

        if (success) {
            this.loadView(this.currentView);
            showToast('Componente curricular adicionado!');
        }
    }

    async salvarCurriculumEditado(id, curriculumData) {
        const success = await dbService.updateItem('curriculum', id, curriculumData);
        if (success) {
            this.editingCurriculumId = null;
        this.editingExtraCourseId = null;
        this.curriculumPrerequisitosSelecionados = [];
            this.loadView(this.currentView);
            showToast('Componente curricular atualizado!');
        }
    }

    editarCurriculum(id) {
        const item = (this.data.curriculum || []).find(c => c.id === id);
        if (!item) return;

        this.editingCurriculumId = id;
        this.openModal('curriculum', item);
    }

    async excluirCurriculum(id) {
        if (!confirm('Deseja excluir este componente da grade curricular?')) return;

        const success = await dbService.removeItem('curriculum', id);
        if (success) {
            this.loadView(this.currentView);
            showToast('Componente curricular excluído!');
        }
    }


    editarSessao(id) {
        const sessao = this.data.sessions.find(s => s.id === id);
        if (!sessao) return;

        this.editingSessionId = id;
        this.openModal('sessao', {
            materia: sessao.materia,
            tipo: sessao.tipo,
            duracao: sessao.duracao,
            data: sessao.data?.slice(0, 16),
            topico: sessao.topico || ''
        });
    }

    editarTarefa(id) {
        const tarefa = this.data.tasks.find(t => t.id === id);
        if (!tarefa) return;

        this.editingTaskId = id;
        this.openModal('tarefa', tarefa);
    }

    editarProva(id) {
        const prova = this.data.exams.find(p => p.id === id);
        if (!prova) return;

        this.editingExamId = id;
        this.openModal('prova', prova);
    }

    editarTopico(id) {
        const topico = this.data.learningMap.find(t => t.id === id);
        if (!topico) return;

        this.editingTopicId = id;
        this.openModal('topico', topico);
    }

    editarAula(id) {
        const aula = this.data.classSchedule.find(a => a.id === id);
        if (!aula) return;

        this.editingAulaId = id;
        this.openModal('aula', aula);
    }

    editarNota(id) {
        const nota = this.data.grades.find(n => n.id === id);
        if (!nota) return;

        this.editingGradeId = id;
        this.openModal('nota', nota);
    }

    editarMaterial(id) {
        const material = this.data.materials.find(m => m.id === id);
        if (!material) return;

        this.editingMaterialId = id;
        this.openModal('material', material);
    }

    editarMateria(id) {
        const materia = this.data.subjects.find(s => s.id === id);
        if (!materia) return;

        this.editingMateriaId = id;
        this.openModal('materia', materia);
    }

    openDailyLogModal() {
        const modal = document.getElementById('modal-daily-log');
        if (!modal) return;

        const hoje = toDateString();
        const logHoje = window.dailyLogService?.getLogPorData(hoje);

        document.getElementById('daily-log-estudo-inicio').value = logHoje?.estudo?.inicio || '';
        document.getElementById('daily-log-estudo-fim').value = logHoje?.estudo?.fim || '';
        document.getElementById('daily-log-foi-aula').checked = logHoje?.aula?.foi || false;
        document.getElementById('daily-log-trabalhou').checked = logHoje?.trabalho?.trabalhou || false;
        document.getElementById('daily-log-trabalho-duracao').value = logHoje?.trabalho?.duracao || 0;
        document.getElementById('daily-log-energia').value = logHoje?.energia || 'media';
        document.getElementById('daily-log-foco').value = logHoje?.foco || 'normal';
        document.getElementById('daily-log-observacoes').value = logHoje?.observacoes || '';

        modal.style.display = 'block';
    }

    openClassDiaryModal(aulaId = null) {
        const modal = document.getElementById('modal-class-diary');
        if (!modal) return;

        const select = document.getElementById('class-diary-materia');
        if (!select) return;

        select.innerHTML = '<option value="">Selecione</option>';
        this.data.subjects.forEach(s => {
            const option = document.createElement('option');
            option.value = s.nome;
            option.textContent = s.nome;
            select.appendChild(option);
        });

        if (aulaId && window.scheduleManager) {
            const aula = window.scheduleManager.aulas.find(a => a.id === aulaId);
            if (aula) {
                select.value = aula.materia;
                document.getElementById('class-diary-data').value = toDateString();
            }
        } else {
            document.getElementById('class-diary-data').value = toDateString();
        }

        modal.style.display = 'block';
    }

    openAulaModal(aulaId) {
        const modal = document.getElementById('modal-aula-detail');
        if (!modal || !window.scheduleManager) return;

        const aula = window.scheduleManager.aulas.find(a => a.id === aulaId);
        if (!aula) return;

        document.getElementById('aula-detail-materia').textContent = aula.materia;
        document.getElementById('aula-detail-horario').textContent = `${aula.inicio} - ${aula.fim}`;
        document.getElementById('aula-detail-sala').textContent = aula.sala || 'Não informada';
        document.getElementById('aula-detail-professor').textContent = aula.professor || 'Não informado';

        const hoje = toDateString();
        const key = `${aulaId}_${hoje}`;
        const presencaHoje = this.data.attendance[key];
        const presencaContainer = document.getElementById('aula-detail-presenca');

        if (presencaContainer) {
            if (presencaHoje) {
                presencaContainer.innerHTML = `<span class="tag ${presencaHoje === 'present' ? 'success' : 'danger'}">${presencaHoje === 'present' ? 'Presente' : 'Faltou'}</span>`;
            } else {
                presencaContainer.innerHTML = `
                    <button class="btn-small btn-success" data-status="present">✅ Presente</button>
                    <button class="btn-small btn-danger" data-status="absent">❌ Faltei</button>
                `;

                presencaContainer.querySelectorAll('button').forEach(btn => {
                    btn.addEventListener('click', () => this.marcarPresenca(aulaId, btn.dataset.status));
                });
            }
        }

        const ultimoDiario = window.classDiaryService?.getUltimoDiarioPorMateria(aula.materia);
        const ultimoConteudoEl = document.getElementById('aula-detail-ultimo-conteudo');
        if (ultimoConteudoEl) {
            if (ultimoDiario) {
                ultimoConteudoEl.innerHTML = `
                    <strong>${escapeHtml(ultimoDiario.data)}</strong>: ${escapeHtml(ultimoDiario.conteudoExplicado || 'Nenhum conteúdo registrado')}
                    ${ultimoDiario.precisoRevisar ? '<span class="badge warning">Revisar</span>' : ''}
                `;
            } else {
                ultimoConteudoEl.textContent = 'Nenhum registro de aula';
            }
        }

        modal.style.display = 'block';
    }

    async marcarPresenca(aulaId, status) {
        const hoje = toDateString();
        if (!window.scheduleManager) return;

        const success = await window.scheduleManager.marcarPresenca(aulaId, hoje, status);
        if (success) {
            showToast(`Presença marcada como ${status === 'present' ? 'presente' : 'falta'}`);
            this.openAulaModal(aulaId);
        }
    }

    async handleDailyLogSubmit(e) {
        e.preventDefault();

        const logData = {
            estudoInicio: document.getElementById('daily-log-estudo-inicio').value,
            estudoFim: document.getElementById('daily-log-estudo-fim').value,
            estudoDuracao: calcularDuracaoMinutos(
                document.getElementById('daily-log-estudo-inicio').value,
                document.getElementById('daily-log-estudo-fim').value
            ),
            foiAula: document.getElementById('daily-log-foi-aula').checked,
            materiasAula: [],
            trabalhou: document.getElementById('daily-log-trabalhou').checked,
            trabalhoDuracao: parseInt(document.getElementById('daily-log-trabalho-duracao').value, 10) || 0,
            energia: document.getElementById('daily-log-energia').value,
            foco: document.getElementById('daily-log-foco').value,
            observacoes: document.getElementById('daily-log-observacoes').value
        };

        await window.dailyLogService?.registrarLog(logData);
        document.getElementById('modal-daily-log').style.display = 'none';
        this.loadView(this.currentView);
    }

    async handleClassDiarySubmit(e) {
        e.preventDefault();

        const diaryData = {
            materia: document.getElementById('class-diary-materia').value,
            data: document.getElementById('class-diary-data').value,
            presenca: document.getElementById('class-diary-presenca').value,
            conteudoExplicado: document.getElementById('class-diary-conteudo').value,
            exerciciosPassados: document.getElementById('class-diary-exercicios').value,
            trabalhoAnunciado: document.getElementById('class-diary-trabalho').value,
            dificuldade: parseInt(document.getElementById('class-diary-dificuldade').value, 10) || 3,
            precisoRevisar: document.getElementById('class-diary-revisar').checked,
            observacoes: document.getElementById('class-diary-observacoes').value
        };

        await window.classDiaryService?.registrarDiario(diaryData);
        document.getElementById('modal-class-diary').style.display = 'none';
        this.loadView(this.currentView);
    }

    async handleSessaoSubmit(e) {
        e.preventDefault();

        const sessaoData = {
            materia: document.getElementById('sessao-materia').value,
            tipo: document.getElementById('sessao-tipo').value,
            duracao: parseInt(document.getElementById('sessao-duracao').value, 10),
            topico: document.getElementById('sessao-topico').value,
            data: document.getElementById('sessao-data').value,
            concluida: false
        };

        const isEditing = !!this.editingSessionId;
        let success = false;

        if (isEditing) {
            success = await dbService.updateItem('sessions', this.editingSessionId, sessaoData);
        } else {
            success = await dbService.addItem('sessions', {
                id: generateId(),
                ...sessaoData
            });
        }

        if (success) {
            document.getElementById('modal-sessao').style.display = 'none';
            this.editingSessionId = null;
            this.resetModalStates();
            this.loadView(this.currentView);
            showToast(isEditing ? 'Sessão atualizada!' : 'Sessão adicionada!');
        }
    }

    async handleTarefaSubmit(e) {
        e.preventDefault();

        const tarefaData = {
            titulo: document.getElementById('tarefa-titulo').value,
            materia: document.getElementById('tarefa-materia').value,
            prioridade: document.getElementById('tarefa-prioridade').value,
            dataLimite: document.getElementById('tarefa-data').value,
            estimativa: parseInt(document.getElementById('tarefa-estimativa').value, 10) || 60,
            concluida: false
        };

        const isEditing = !!this.editingTaskId;
        let success = false;

        if (isEditing) {
            const tarefaOriginal = this.data.tasks.find(t => t.id === this.editingTaskId);
            success = await dbService.updateItem('tasks', this.editingTaskId, {
                ...tarefaData,
                concluida: tarefaOriginal?.concluida || false
            });
        } else {
            success = await dbService.addItem('tasks', {
                id: generateId(),
                ...tarefaData
            });
        }

        if (success) {
            document.getElementById('modal-tarefa').style.display = 'none';
            this.editingTaskId = null;
            this.resetModalStates();
            this.loadView(this.currentView);
            showToast(isEditing ? 'Tarefa atualizada!' : 'Tarefa adicionada!');
        }
    }

    async handleProvaSubmit(e) {
        e.preventDefault();

        const provaData = {
            titulo: document.getElementById('prova-titulo').value,
            materia: document.getElementById('prova-materia').value,
            tipo: document.getElementById('prova-tipo').value,
            data: document.getElementById('prova-data').value,
            peso: parseInt(document.getElementById('prova-peso').value, 10) || 100,
            importancia: document.getElementById('prova-importancia').value,
            concluida: false
        };

        const isEditing = !!this.editingExamId;
        let success = false;

        if (isEditing) {
            const original = this.data.exams.find(p => p.id === this.editingExamId);
            success = await dbService.updateItem('exams', this.editingExamId, {
                ...provaData,
                concluida: original?.concluida || false
            });
        } else {
            success = await dbService.addItem('exams', {
                id: generateId(),
                ...provaData
            });
        }

        if (success) {
            document.getElementById('modal-prova').style.display = 'none';
            this.editingExamId = null;
            this.resetModalStates();
            this.loadView(this.currentView);
            showToast(isEditing ? 'Evento atualizado!' : 'Evento adicionado!');
        }
    }

    async handleAulaSubmit(e) {
        e.preventDefault();

        const aulaData = {
            materia: document.getElementById('aula-materia').value,
            dia: document.getElementById('aula-dia').value,
            inicio: document.getElementById('aula-inicio').value,
            fim: document.getElementById('aula-fim').value,
            sala: document.getElementById('aula-sala').value,
            professor: document.getElementById('aula-professor').value,
            bloco: document.getElementById('aula-bloco')?.value || '',
            cor: document.getElementById('aula-cor')?.value || '#3b82f6'
        };

        let success = false;
        const isEditing = !!this.editingAulaId;

        if (window.scheduleManager) {
            if (isEditing) {
                success = await window.scheduleManager.editAula(this.editingAulaId, aulaData);
            } else {
                success = await window.scheduleManager.addAula({
                    id: generateId(),
                    ...aulaData
                });
            }
        }

        if (success) {
            document.getElementById('modal-aula').style.display = 'none';
            this.editingAulaId = null;
            this.resetModalStates();
            document.dispatchEvent(new Event('aulas-atualizadas'));
            this.loadView('grade-horaria');
            showToast(isEditing ? 'Aula atualizada com sucesso!' : 'Aula salva com sucesso!');
        }
    }

    async handleTopicoSubmit(e) {
        e.preventDefault();

        const topicoData = {
            materia: document.getElementById('topico-materia').value,
            nome: document.getElementById('topico-nome').value,
            dificuldade: parseInt(document.getElementById('topico-dificuldade').value, 10) || 3,
            status: document.getElementById('topico-status').value,
            confianca: parseInt(document.getElementById('topico-confianca').value, 10) || 3,
            ultimaRevisao: new Date().toISOString()
        };

        const isEditing = !!this.editingTopicId;
        let success = false;

        if (isEditing) {
            success = await dbService.updateItem('learningMap', this.editingTopicId, topicoData);
        } else {
            success = await dbService.addItem('learningMap', {
                id: generateId(),
                ...topicoData
            });
        }

        if (success) {
            document.getElementById('modal-topico').style.display = 'none';
            this.editingTopicId = null;
            this.resetModalStates();
            this.loadView(this.currentView);
            showToast(isEditing ? 'Tópico atualizado!' : 'Tópico salvo!');
        }
    }

    async handleNotaSubmit(e) {
        e.preventDefault();

        const notaData = {
            materia: document.getElementById('nota-materia').value,
            avaliacao: document.getElementById('nota-avaliacao').value,
            valor: parseFloat(document.getElementById('nota-valor').value),
            peso: parseInt(document.getElementById('nota-peso').value, 10) || 100,
            data: new Date().toISOString()
        };

        const isEditing = !!this.editingGradeId;
        let success = false;

        if (isEditing) {
            success = await dbService.updateItem('grades', this.editingGradeId, notaData);
        } else {
            success = await dbService.addItem('grades', {
                id: generateId(),
                ...notaData
            });
        }

        if (success) {
            document.getElementById('modal-nota').style.display = 'none';
            this.editingGradeId = null;
            this.resetModalStates();
            this.loadView(this.currentView);
            showToast(isEditing ? 'Nota atualizada!' : 'Nota registrada!');
        }
    }

    async handleMaterialSubmit(e) {
        e.preventDefault();

        const materialData = {
            titulo: document.getElementById('material-titulo').value,
            materia: document.getElementById('material-materia').value,
            tipo: document.getElementById('material-tipo').value,
            conteudo: document.getElementById('material-conteudo').value
        };

        const isEditing = !!this.editingMaterialId;
        let success = false;

        if (isEditing) {
            success = await dbService.updateItem('materials', this.editingMaterialId, materialData);
        } else {
            success = await dbService.addItem('materials', {
                id: generateId(),
                ...materialData
            });
        }

        if (success) {
            document.getElementById('modal-material').style.display = 'none';
            this.editingMaterialId = null;
        this.editingCurriculumId = null;
        this.editingExtraCourseId = null;
        this.curriculumPrerequisitosSelecionados = [];
            this.resetModalStates();
            this.loadView(this.currentView);
            showToast(isEditing ? 'Material atualizado!' : 'Material adicionado!');
        }
    }

    async concluirSessao(id) {
        const sessao = this.data.sessions.find(s => s.id === id);
        if (!sessao) return;

        const success = await dbService.updateItem('sessions', id, { concluida: true });
        if (success) {
            sessao.concluida = true;
            this.updateStreak();
            this.loadView(this.currentView);
            showToast('Sessão concluída!');
        }
    }

    async concluirTarefa(id) {
        const tarefa = this.data.tasks.find(t => t.id === id);
        if (!tarefa) return;

        const success = await dbService.updateItem('tasks', id, { concluida: true });
        if (success) {
            tarefa.concluida = true;
            this.loadView(this.currentView);
            showToast('Tarefa concluída!');
        }
    }

    async toggleHabito(id) {
        const hoje = toDateString();
        const idx = this.data.habits.findIndex(h => h.id === id && toDateString(h.data) === hoje);

        let success = false;

        if (idx >= 0) {
            this.data.habits.splice(idx, 1);
            success = await dbService.saveData('habits', this.data.habits);
        } else {
            this.data.habits.push({ id, data: new Date().toISOString() });
            success = await dbService.saveData('habits', this.data.habits);
        }

        if (success) this.loadView(this.currentView);
    }

    startTimer() {
        const durationInput = document.getElementById('timer-duracao');

        if (!this.timerRunning && this.timerSeconds <= 0) {
            const d = parseInt(durationInput?.value, 10) || 25;
            this.timerSeconds = d * 60;
            this.timerDuration = d;
        }

        if (this.timerRunning || this.timerSeconds <= 0) return;

        this.timerRunning = true;
        this.timerStartedAt = Date.now();

        const startBtn = document.getElementById('timer-start');
        const pauseBtn = document.getElementById('timer-pause');

        if (startBtn) startBtn.style.display = 'none';
        if (pauseBtn) pauseBtn.style.display = 'inline-block';

        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            this.updateTimerDisplay();

            if (this.timerSeconds <= 0) {
                this.timerComplete();
            }
        }, 1000);

        this.updateTimerDisplay();
    }

    pauseTimer() {
        this.timerRunning = false;
        clearInterval(this.timerInterval);

        const startBtn = document.getElementById('timer-start');
        const pauseBtn = document.getElementById('timer-pause');

        if (startBtn) startBtn.style.display = 'inline-block';
        if (pauseBtn) pauseBtn.style.display = 'none';
    }

    resetTimer() {
        this.pauseTimer();
        this.timerSeconds = 0;
        this.timerDuration = 0;
        this.timerStartedAt = null;
        this.updateTimerDisplay();
    }

    async timerComplete() {
        this.pauseTimer();

        const sessaoFoco = {
            id: generateId(),
            materia: 'Modo Foco',
            tipo: 'foco',
            duracao: this.timerDuration,
            data: new Date().toISOString(),
            concluida: true
        };

        const success = await dbService.addItem('sessions', sessaoFoco);
        if (success) {
            showToast('Sessão de foco concluída!');
            this.updateStreak();
            this.loadView(this.currentView);
        }

        this.timerSeconds = 0;
        this.timerDuration = 0;
        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        const display = document.getElementById('timer-display');
        if (!display) return;

        const m = Math.floor(this.timerSeconds / 60);
        const s = this.timerSeconds % 60;
        display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    updateStreak() {
        if (!this.data.user) return;

        const hoje = toDateString();
        if (this.data.user.lastStudyDate === hoje) return;

        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        const ontemStr = toDateString(ontem);

        if (this.data.user.lastStudyDate === ontemStr) {
            this.data.user.streak = (this.data.user.streak || 0) + 1;
        } else {
            this.data.user.streak = 1;
        }

        this.data.user.lastStudyDate = hoje;
        dbService.saveData('user', this.data.user);
        this.updateSidebarInfo();
    }

    async whatsNow() {
        if (!window.aiAssistant) return;

        const sugestao = window.aiAssistant.sugerirEstudoAgora();
        const modal = document.getElementById('modal-whats-now');

        if (modal) {
            document.getElementById('whats-now-content').innerHTML = nl2brSafe(sugestao);
            modal.style.display = 'block';
        } else {
            showToast(sugestao, 'info');
        }
    }

    exportarGradeHoraria() {
        const aulas = [...(this.data.classSchedule || [])];
        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

        let csv = 'Dia,Matéria,Início,Fim,Sala,Professor,Bloco\n';

        aulas.sort((a, b) => {
            if (parseInt(a.dia, 10) !== parseInt(b.dia, 10)) {
                return parseInt(a.dia, 10) - parseInt(b.dia, 10);
            }
            return a.inicio.localeCompare(b.inicio);
        }).forEach(a => {
            csv += `"${diasSemana[parseInt(a.dia, 10)]}","${(a.materia || '').replace(/"/g, '""')}","${a.inicio || ''}","${a.fim || ''}","${(a.sala || '').replace(/"/g, '""')}","${(a.professor || '').replace(/"/g, '""')}","${(a.bloco || '').replace(/"/g, '""')}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'grade-horaria.csv';
        link.click();
        URL.revokeObjectURL(url);

        showToast('Grade exportada!');
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
        showToast('Dados exportados!');
    }

    async limparDados() {
        if (!confirm('Tem certeza? Todos os dados serão perdidos.')) return;

        const success = await dbService.clearAllData();
        if (success) {
            localStorage.clear();
            showToast('Dados limpos!');
            location.reload();
        }
    }

    async excluirSessao(id) {
        if (!confirm('Tem certeza que deseja excluir esta sessão?')) return;

        const success = await dbService.removeItem('sessions', id);
        if (success) {
            this.loadView(this.currentView);
            showToast('Sessão excluída!');
        }
    }

    async excluirTarefa(id) {
        if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;

        const success = await dbService.removeItem('tasks', id);
        if (success) {
            this.loadView(this.currentView);
            showToast('Tarefa excluída!');
        }
    }

    async excluirProva(id) {
        if (!confirm('Tem certeza que deseja excluir esta prova?')) return;

        const success = await dbService.removeItem('exams', id);
        if (success) {
            this.loadView(this.currentView);
            showToast('Prova excluída!');
        }
    }

    async excluirTopico(id) {
        if (!confirm('Tem certeza que deseja excluir este tópico?')) return;

        const success = await dbService.removeItem('learningMap', id);
        if (success) {
            this.loadView(this.currentView);
            showToast('Tópico excluído!');
        }
    }

    async excluirMaterial(id) {
        if (!confirm('Tem certeza que deseja excluir este material?')) return;

        const success = await dbService.removeItem('materials', id);
        if (success) {
            this.loadView(this.currentView);
            showToast('Material excluído!');
        }
    }

    async excluirNota(id) {
        if (!confirm('Tem certeza que deseja excluir esta nota?')) return;

        const success = await dbService.removeItem('grades', id);
        if (success) {
            this.loadView(this.currentView);
            showToast('Nota excluída!');
        }
    }

    async excluirMateria(id) {
        if (!confirm('ATENÇÃO: Excluir esta matéria também excluirá todas as sessões, tarefas, provas, tópicos, notas, materiais e aulas relacionados. Continuar?')) return;

        const materia = this.data.subjects.find(s => s.id === id);
        if (!materia) return;

        showLoading();

        try {
            this.data.sessions = this.data.sessions.filter(s => s.materia !== materia.nome);
            this.data.tasks = this.data.tasks.filter(t => t.materia !== materia.nome);
            this.data.exams = this.data.exams.filter(e => e.materia !== materia.nome);
            this.data.learningMap = this.data.learningMap.filter(t => t.materia !== materia.nome);
            this.data.grades = this.data.grades.filter(g => g.materia !== materia.nome);
            this.data.materials = this.data.materials.filter(m => m.materia !== materia.nome);
            this.data.classSchedule = this.data.classSchedule.filter(a => a.materia !== materia.nome);
            this.data.classDiaries = this.data.classDiaries.filter(d => d.materia !== materia.nome);
            this.data.reviews = this.data.reviews.filter(r => r.materia !== materia.nome);
            this.data.subjects = this.data.subjects.filter(s => s.id !== id);

            const success = await dbService.saveAllData(this.data);

            if (success) {
                this.loadView(this.currentView);
                showToast('Matéria e todos os itens relacionados excluídos!');
            }
        } catch (error) {
            console.error('Erro ao excluir matéria:', error);
            showToast('Erro ao excluir matéria', 'error');
        } finally {
            hideLoading();
        }
    }

    getDelayedSubjects(limit = this.data.settings?.heavyMode ? 3 : 5) {
        return this.data.subjects
            .map(subject => {
                const ultima = this.data.sessions
                    .filter(s => s.materia === subject.nome && s.concluida)
                    .sort((a, b) => new Date(b.data) - new Date(a.data))[0];

                if (!ultima) {
                    return { nome: subject.nome, diasSemEstudar: null, nunca: true };
                }

                return {
                    nome: subject.nome,
                    diasSemEstudar: diasDesde(ultima.data),
                    nunca: false
                };
            })
            .filter(s => s.nunca || (s.diasSemEstudar !== null && s.diasSemEstudar >= limit))
            .sort((a, b) => {
                if (a.nunca && !b.nunca) return -1;
                if (!a.nunca && b.nunca) return 1;
                return (b.diasSemEstudar || 0) - (a.diasSemEstudar || 0);
            });
    }

    getStudyHoursSummary() {
        const sessoesConcluidas = this.data.sessions.filter(s => s.concluida);
        const hoje = toDateOnly(new Date());
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

        return {
            hoje: sessoesConcluidas
                .filter(s => toDateOnly(s.data).getTime() === hoje.getTime())
                .reduce((acc, s) => acc + s.duracao, 0) / 60,
            semana: sessoesConcluidas
                .filter(s => new Date(s.data) >= inicioSemana)
                .reduce((acc, s) => acc + s.duracao, 0) / 60,
            mes: sessoesConcluidas
                .filter(s => new Date(s.data) >= inicioMes)
                .reduce((acc, s) => acc + s.duracao, 0) / 60,
            total: sessoesConcluidas.reduce((acc, s) => acc + s.duracao, 0) / 60
        };
    }

    generateAlerts() {
        const alerts = [];

        this.data.subjects.forEach(materia => {
            const ultimo = this.data.sessions
                .filter(ses => ses.materia === materia.nome && ses.concluida)
                .sort((a, b) => new Date(b.data) - new Date(a.data))[0];

            if (ultimo && diasDesde(ultimo.data) >= 5) {
                alerts.push({
                    type: 'warning',
                    title: `${materia.nome} esquecida`,
                    message: `${diasDesde(ultimo.data)} dias sem estudar`
                });
            }
        });

        this.data.exams.forEach(e => {
            const dias = diasAte(e.data);
            if (dias <= 3 && dias >= 0) {
                const horas = this.data.sessions
                    .filter(s => s.materia === e.materia && s.concluida)
                    .reduce((a, s) => a + s.duracao, 0) / 60;

                if (horas < 2) {
                    alerts.push({
                        type: 'danger',
                        title: `Prova de ${e.materia} em ${dias} dias`,
                        message: `Estudou apenas ${horas.toFixed(1)}h`
                    });
                }
            }
        });

        return alerts;
    }

    analyzeAcademicRisk() {
        const risks = [];
        const hoje = new Date();

        this.data.subjects.forEach(subject => {
            const notas = this.data.grades.filter(g => g.materia === subject.nome);
            const media = calcularMediaPonderada(notas);
            const exames = this.data.exams.filter(e => e.materia === subject.nome && new Date(e.data) >= hoje && diasAte(e.data) <= 14);
            const horas = this.data.sessions
                .filter(ses => ses.materia === subject.nome && ses.concluida)
                .reduce((a, ses) => a + ses.duracao, 0) / 60;

            if (media > 0 && media < 6) {
                risks.push({ materia: subject.nome, nivel: 'alto', motivo: `Média ${media.toFixed(1)}` });
            } else if (exames.length && horas < 3) {
                risks.push({ materia: subject.nome, nivel: 'alto', motivo: `Prova próxima, ${horas.toFixed(1)}h estudadas` });
            } else if (subject.dificuldade >= 4 && horas < 2) {
                risks.push({ materia: subject.nome, nivel: 'medio', motivo: 'Matéria difícil, pouco estudo' });
            }
        });

        return risks;
    }

    calcularMedia(notas) {
        return calcularMediaPonderada(notas);
    }

    calcularPrevisaoNota(subject, notas) {
        const media = calcularMediaPonderada(notas);
        const horas = this.data.sessions
            .filter(s => s.materia === subject.nome && s.concluida)
            .reduce((a, s) => a + s.duracao, 0) / 60;

        const restantes = this.data.exams.filter(
            e => e.materia === subject.nome && new Date(e.data) >= new Date()
        );

        const pesoRestante = restantes.reduce((a, e) => a + (e.peso || 0), 0);

        let notaNecessaria = subject.notaDesejada || 7;
        if (pesoRestante > 0) {
            notaNecessaria = (((subject.notaDesejada || 7) * 100) - (media * (100 - pesoRestante))) / pesoRestante;
        }

        let chance = 50;
        if (horas > subject.dificuldade * 5) chance += 20;
        if (media > 7) chance += 20;
        if (media < 5) chance -= 20;
        if (subject.dificuldade >= 4) chance -= 10;
        if (!restantes.length) chance = media >= 6 ? 100 : 0;

        chance = Math.min(100, Math.max(0, chance));

        const risco = chance < 30 ? 'alto' : chance < 60 ? 'medio' : 'baixo';
        const motivo =
            chance >= 80 ? 'Você está no caminho certo!' :
            chance >= 50 ? 'Mantenha o foco que dá tempo' :
            'Precisa intensificar os estudos';

        return {
            chance: Math.round(chance),
            notaNecessaria: Math.max(0, notaNecessaria).toFixed(1),
            risco,
            motivo
        };
    }

    calcularProgressoHoje() {
        const hoje = toDateString();
        const sessoes = this.data.sessions.filter(s => toDateString(s.data) === hoje);
        const planejado = sessoes.reduce((a, s) => a + (s.duracao || 0), 0) / 60;
        const concluido = sessoes.filter(s => s.concluida).reduce((a, s) => a + (s.duracao || 0), 0) / 60;
        const percentual = planejado ? Math.min((concluido / planejado) * 100, 100) : 0;

        return {
            planejado: planejado.toFixed(1),
            concluido: concluido.toFixed(1),
            percentual
        };
    }

    calcularProdutividade() {
        const hoje = toDateString();
        const total = this.data.sessions.filter(s => toDateString(s.data) === hoje).length;
        const concluidas = this.data.sessions.filter(s => toDateString(s.data) === hoje && s.concluida).length;
        return total ? `${Math.round((concluidas / total) * 100)}%` : '0%';
    }

    getUrgentTasks() {
        return this.data.tasks
            .filter(t => !t.concluida && diasAte(t.dataLimite) <= 3)
            .sort((a, b) => new Date(a.dataLimite) - new Date(b.dataLimite));
    }

    getUpcomingExams(days) {
        return this.data.exams
            .filter(e => !e.concluida && diasAte(e.data) <= days && diasAte(e.data) >= 0)
            .sort((a, b) => new Date(a.data) - new Date(b.data));
    }

    calcularHorasPorMateria() {
        const horas = {};
        this.data.sessions.filter(s => s.concluida).forEach(s => {
            horas[s.materia] = (horas[s.materia] || 0) + s.duracao / 60;
        });

        return Object.entries(horas)
            .map(([materia, h]) => ({ materia, horas: h }))
            .sort((a, b) => b.horas - a.horas);
    }

    calcularHorasPorTipo() {
        const tipos = {};
        this.data.sessions.filter(s => s.concluida).forEach(s => {
            tipos[s.tipo] = (tipos[s.tipo] || 0) + s.duracao / 60;
        });

        return Object.entries(tipos)
            .map(([tipo, horas]) => ({ tipo, horas }))
            .sort((a, b) => b.horas - a.horas);
    }

    calcularMediaDiaria() {
        if (!this.data.user?.createdAt) return '0.0';

        const dias = Math.max(1, Math.ceil((new Date() - new Date(this.data.user.createdAt)) / 86400000));
        const total = this.data.sessions
            .filter(s => s.concluida)
            .reduce((a, s) => a + s.duracao / 60, 0);

        return (total / dias).toFixed(1);
    }

    calcularMelhorDia() {
        const dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const horas = new Array(7).fill(0);

        this.data.sessions.filter(s => s.concluida).forEach(s => {
            horas[new Date(s.data).getDay()] += s.duracao / 60;
        });

        const maxIndex = horas.indexOf(Math.max(...horas));
        return maxIndex >= 0 ? dias[maxIndex] : 'N/A';
    }

    calcularMelhorDiaHoras() {
        const horas = new Array(7).fill(0);

        this.data.sessions.filter(s => s.concluida).forEach(s => {
            horas[new Date(s.data).getDay()] += s.duracao / 60;
        });

        return Math.max(...horas).toFixed(1);
    }

    calcularTaxaConclusaoTarefas() {
        if (!this.data.tasks.length) return 0;
        return Math.round((this.data.tasks.filter(t => t.concluida).length / this.data.tasks.length) * 100);
    }

    calcularConsistencia() {
        const hoje = new Date();
        const inicio = new Date(hoje);
        inicio.setDate(hoje.getDate() - hoje.getDay());

        const dias = new Set();
        this.data.sessions.filter(s => s.concluida).forEach(s => {
            const d = new Date(s.data);
            if (d >= inicio) dias.add(toDateString(d));
        });

        return Math.round((dias.size / 7) * 100);
    }

    getExamRiskClass(e) {
        const d = diasAte(e.data);
        return d <= 3 ? 'danger' : d <= 7 ? 'warning' : 'success';
    }
}

window.StudyLifeControl = StudyLifeControl;

const UFOB_ENGINEERING_CIVIL_REFERENCE = [
    { semestre: '1', nome: 'Cálculo Diferencial I', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: [] },
    { semestre: '1', nome: 'Introdução à Engenharia Civil', cargaHoraria: 30, creditos: 0, tipo: 'obrigatoria', prerequisitos: [] },
    { semestre: '1', nome: 'Geometria Analítica', cargaHoraria: 90, creditos: 0, tipo: 'obrigatoria', prerequisitos: [] },
    { semestre: '1', nome: 'Programação de Computadores I', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: [] },
    { semestre: '1', nome: 'Introdução ao Desenho Técnico', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: [] },
    { semestre: '1', nome: 'Filosofia e História das Ciências', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: [] },
    { semestre: '1', nome: 'Oficina de Leitura e Produção Textual', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: [] },
    { semestre: '1', nome: 'Ética e Política', cargaHoraria: 30, creditos: 0, tipo: 'obrigatoria', prerequisitos: [] },
    { semestre: '2', nome: 'Cálculo Diferencial II', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Cálculo Diferencial I', 'Geometria Analítica'] },
    { semestre: '2', nome: 'Física Geral I', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: [] },
    { semestre: '2', nome: 'Álgebra Linear I', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Geometria Analítica'] },
    { semestre: '2', nome: 'Programação de Computadores II', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Programação de Computadores I'] },
    { semestre: '2', nome: 'Desenho Arquitetônico', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Introdução ao Desenho Técnico'] },
    { semestre: '2', nome: 'Cálculo Integral I', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Cálculo Diferencial I'] },
    { semestre: '2', nome: 'Oficina de Leitura e Produção de Textos Acadêmicos', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Oficina de Leitura e Produção Textual'] },
    { semestre: '2', nome: 'Física Experimental I', cargaHoraria: 30, creditos: 0, tipo: 'obrigatoria', prerequisitos: [] },
    { semestre: '3', nome: 'Cálculo Integral II', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Geometria Analítica', 'Cálculo Integral I'] },
    { semestre: '3', nome: 'Física Geral II', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Física Geral I'] },
    { semestre: '3', nome: 'Mecânica Geral', cargaHoraria: 90, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Física Geral I', 'Cálculo Integral I'] },
    { semestre: '3', nome: 'Equações Diferenciais Ordinárias', cargaHoraria: 90, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Álgebra Linear I', 'Cálculo Integral I'] },
    { semestre: '3', nome: 'Fundamentos de Química Geral e Inorgânica', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: [] },
    { semestre: '3', nome: 'Fundamentos de Química Geral Experimental', cargaHoraria: 30, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Fundamentos de Química Geral e Inorgânica'] },
    { semestre: '3', nome: 'Geologia Geral', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: [] },
    { semestre: '3', nome: 'Física Experimental II', cargaHoraria: 30, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Física Geral I', 'Física Experimental I'] },
    { semestre: '4', nome: 'Cálculo Numérico', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Equações Diferenciais Ordinárias', 'Programação de Computadores II'] },
    { semestre: '4', nome: 'Física Geral III', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Física Geral II'] },
    { semestre: '4', nome: 'Resistência dos Materiais I', cargaHoraria: 90, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Mecânica Geral'] },
    { semestre: '4', nome: 'Introdução à Administração', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Introdução à Engenharia Civil'] },
    { semestre: '4', nome: 'Topografia', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Desenho Arquitetônico'] },
    { semestre: '4', nome: 'Materiais de Construção I', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Fundamentos de Química Geral Experimental'] },
    { semestre: '4', nome: 'Métodos Estatísticos', cargaHoraria: 60, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Cálculo Integral I'] },
    { semestre: '4', nome: 'Física Experimental III', cargaHoraria: 30, creditos: 0, tipo: 'obrigatoria', prerequisitos: ['Física Geral II', 'Física Experimental II'] }
];

StudyLifeControl.prototype.getUfobCurriculumReference = function() {
    return UFOB_ENGINEERING_CIVIL_REFERENCE.map(item => ({ ...item, prerequisitosLista: [...item.prerequisitos] }));
};

StudyLifeControl.prototype.slugifyName = function(value) {
    return String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
};

StudyLifeControl.prototype.normalizePrerequisitos = function(value) {
    if (Array.isArray(value)) {
        return value.map(v => String(v || '').trim()).filter(Boolean);
    }
    const raw = String(value || '').trim();
    if (!raw) return [];
    return raw
        .split(/\s*(?:,|;|\+|\/|\be\b|\band\b)\s*/i)
        .map(v => v.trim())
        .filter(Boolean);
};

StudyLifeControl.prototype.normalizeCurriculumItem = function(item) {
    const normalized = { ...item };
    normalized.semestre = String(item.semestre || '').trim();
    normalized.nome = String(item.nome || '').trim();
    normalized.cargaHoraria = Number(item.cargaHoraria) || 0;
    normalized.creditos = Number(item.creditos) || 0;
    normalized.status = item.status || 'nao-cursada';
    normalized.tipo = item.tipo || 'obrigatoria';
    normalized.prerequisitosLista = this.normalizePrerequisitos(item.prerequisitosLista || item.prerequisitos || '');
    normalized.prerequisitos = normalized.prerequisitosLista.join(' | ');
    return normalized;
};

StudyLifeControl.prototype.normalizeCurriculumInMemory = function() {
    if (!Array.isArray(this.data.curriculum)) this.data.curriculum = [];
    this.data.curriculum = this.data.curriculum.map(item => this.normalizeCurriculumItem(item));
    if (!Array.isArray(this.data.extraCourses)) this.data.extraCourses = [];
};

StudyLifeControl.prototype.getNormalizedCurriculum = function() {
    this.normalizeCurriculumInMemory();
    return this.data.curriculum;
};

StudyLifeControl.prototype.setupCurriculumModalUI = function(currentName = '') {
    const searchInput = document.getElementById('curriculum-prerequisito-busca');
    const hiddenInput = document.getElementById('curriculum-prerequisitos');
    const tagsContainer = document.getElementById('curriculum-prerequisitos-tags');
    const suggestions = document.getElementById('curriculum-prerequisitos-sugestoes');
    if (!searchInput || !hiddenInput || !tagsContainer || !suggestions) return;

    const updateHidden = () => {
        hiddenInput.value = this.curriculumPrerequisitosSelecionados.join(' | ');
        tagsContainer.innerHTML = this.curriculumPrerequisitosSelecionados.map(req => `
            <span class="chip chip-removable">${escapeHtml(req)} <button type="button" class="chip-remove" data-value="${escapeHtml(req)}">×</button></span>
        `).join('');
        tagsContainer.querySelectorAll('.chip-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                this.curriculumPrerequisitosSelecionados = this.curriculumPrerequisitosSelecionados.filter(item => item !== btn.dataset.value);
                updateHidden();
                renderSuggestions();
            });
        });
    };

    const pool = [...new Map([...this.getNormalizedCurriculum(), ...this.getUfobCurriculumReference()]
        .filter(item => item.nome && this.slugifyName(item.nome) !== this.slugifyName(currentName))
        .map(item => [this.slugifyName(item.nome), item.nome])).values()];

    const renderSuggestions = () => {
        const term = this.slugifyName(searchInput.value);
        const filtered = pool.filter(nome => !this.curriculumPrerequisitosSelecionados.includes(nome) && (!term || this.slugifyName(nome).includes(term))).slice(0, 12);
        suggestions.innerHTML = filtered.map(nome => `<button type="button" class="prereq-option" data-value="${escapeHtml(nome)}">${escapeHtml(nome)}</button>`).join('');
        suggestions.querySelectorAll('.prereq-option').forEach(btn => {
            btn.addEventListener('click', () => {
                this.curriculumPrerequisitosSelecionados.push(btn.dataset.value);
                this.curriculumPrerequisitosSelecionados = [...new Set(this.curriculumPrerequisitosSelecionados)];
                searchInput.value = '';
                updateHidden();
                renderSuggestions();
            });
        });
    };

    searchInput.oninput = renderSuggestions;
    searchInput.onclick = renderSuggestions;
    document.getElementById('btn-add-custom-prereq')?.addEventListener('click', () => {
        const value = searchInput.value.trim();
        if (!value) return;
        if (!this.curriculumPrerequisitosSelecionados.includes(value)) this.curriculumPrerequisitosSelecionados.push(value);
        searchInput.value = '';
        updateHidden();
        renderSuggestions();
    });

    document.querySelectorAll('.btn-ch-preset').forEach(btn => {
        btn.onclick = () => {
            if (btn.dataset.value === '0') {
                document.getElementById('curriculum-carga-horaria').focus();
                return;
            }
            document.getElementById('curriculum-carga-horaria').value = btn.dataset.value;
        };
    });

    const nomeInput = document.getElementById('curriculum-nome');
    nomeInput?.addEventListener('blur', () => {
        const typed = this.slugifyName(nomeInput.value);
        const match = this.getUfobCurriculumReference().find(item => this.slugifyName(item.nome) === typed);
        if (!match) return;
        if (!document.getElementById('curriculum-carga-horaria').value) document.getElementById('curriculum-carga-horaria').value = match.cargaHoraria;
        if (!document.getElementById('curriculum-semestre').value) document.getElementById('curriculum-semestre').value = match.semestre;
        if (!Number(document.getElementById('curriculum-creditos').value)) document.getElementById('curriculum-creditos').value = match.creditos || '';
        if (!this.curriculumPrerequisitosSelecionados.length && match.prerequisitos?.length) {
            this.curriculumPrerequisitosSelecionados = [...match.prerequisitos];
            updateHidden();
            renderSuggestions();
        }
    });

    updateHidden();
    renderSuggestions();
};

StudyLifeControl.prototype.importarGradeUfob = async function() {
    this.normalizeCurriculumInMemory();
    const current = this.getNormalizedCurriculum();
    const existingMap = new Map(current.map(item => [this.slugifyName(item.nome), item]));
    const merged = [...current];
    let added = 0;
    this.getUfobCurriculumReference().forEach(item => {
        const key = this.slugifyName(item.nome);
        if (existingMap.has(key)) {
            const target = existingMap.get(key);
            target.semestre = target.semestre || item.semestre;
            target.cargaHoraria = Number(target.cargaHoraria) || item.cargaHoraria;
            target.creditos = Number(target.creditos) || item.creditos;
            const prereqs = new Set([...(target.prerequisitosLista || []), ...(item.prerequisitos || [])]);
            target.prerequisitosLista = [...prereqs];
            target.prerequisitos = target.prerequisitosLista.join(' | ');
            target.tipo = target.tipo || item.tipo;
        } else {
            merged.push({ id: generateId(), ...item, prerequisitosLista: [...item.prerequisitos], prerequisitos: item.prerequisitos.join(' | '), status: 'nao-cursada', observacoes: '' });
            added += 1;
        }
    });
    this.data.curriculum = merged.map(item => this.normalizeCurriculumItem(item));
    const success = await dbService.saveData('curriculum', this.data.curriculum);
    if (success) {
        this.loadView('grade-curricular');
        showToast(added ? `${added} componente(s) sugerido(s) pela UFOB foram adicionados.` : 'Sua grade já foi reorganizada com as referências da UFOB.');
    }
};

const originalHandleCurriculumSubmit = StudyLifeControl.prototype.handleCurriculumSubmit;
StudyLifeControl.prototype.handleCurriculumSubmit = async function(e) {
    e.preventDefault();
    const curriculumData = {
        nome: document.getElementById('curriculum-nome')?.value?.trim() || '',
        semestre: document.getElementById('curriculum-semestre')?.value?.trim() || '',
        cargaHoraria: parseInt(document.getElementById('curriculum-carga-horaria')?.value, 10) || 0,
        status: document.getElementById('curriculum-status')?.value || 'nao-cursada',
        tipo: document.getElementById('curriculum-tipo')?.value || 'obrigatoria',
        creditos: parseFloat(document.getElementById('curriculum-creditos')?.value) || 0,
        prerequisitosLista: [...new Set(this.curriculumPrerequisitosSelecionados || [])],
        observacoes: document.getElementById('curriculum-observacoes')?.value?.trim() || ''
    };
    curriculumData.prerequisitos = curriculumData.prerequisitosLista.join(' | ');
    if (!curriculumData.nome) return showToast('Informe o nome da disciplina/componente', 'warning');
    if (!curriculumData.cargaHoraria) return showToast('Informe a carga horária', 'warning');
    if (this.editingCurriculumId) await this.salvarCurriculumEditado(this.editingCurriculumId, curriculumData);
    else await this.salvarNovoCurriculum(curriculumData);
    document.getElementById('modal-curriculum').style.display = 'none';
    this.resetModalStates();
};

StudyLifeControl.prototype.handleExtraCourseSubmit = async function(e) {
    e.preventDefault();
    const courseData = {
        nome: document.getElementById('extra-course-nome')?.value?.trim() || '',
        plataforma: document.getElementById('extra-course-plataforma')?.value?.trim() || '',
        area: document.getElementById('extra-course-area')?.value?.trim() || '',
        status: document.getElementById('extra-course-status')?.value || 'em-andamento',
        metaHoras: parseFloat(document.getElementById('extra-course-meta-horas')?.value) || 0,
        horasEstudadas: parseFloat(document.getElementById('extra-course-horas-estudadas')?.value) || 0,
        progresso: parseFloat(document.getElementById('extra-course-progresso')?.value) || 0,
        dataInicio: document.getElementById('extra-course-data-inicio')?.value || '',
        link: document.getElementById('extra-course-link')?.value?.trim() || '',
        observacoes: document.getElementById('extra-course-observacoes')?.value?.trim() || ''
    };
    if (!courseData.nome) return showToast('Informe o nome do curso', 'warning');
    if (!Array.isArray(this.data.extraCourses)) this.data.extraCourses = [];
    if (this.editingExtraCourseId) {
        const success = await dbService.updateItem('extraCourses', this.editingExtraCourseId, courseData);
        if (success) showToast('Curso extra atualizado!');
    } else {
        const success = await dbService.addItem('extraCourses', { id: generateId(), ...courseData });
        if (success) showToast('Curso extra adicionado!');
    }
    document.getElementById('modal-extra-course').style.display = 'none';
    this.resetModalStates();
    this.loadView('cursos-extras');
};

StudyLifeControl.prototype.editarExtraCourse = function(id) {
    const item = (this.data.extraCourses || []).find(c => c.id === id);
    if (!item) return;
    this.editingExtraCourseId = id;
    this.openModal('extra-course', item);
};

StudyLifeControl.prototype.excluirExtraCourse = async function(id) {
    if (!confirm('Deseja excluir este curso extra?')) return;
    const success = await dbService.removeItem('extraCourses', id);
    if (success) {
        this.loadView('cursos-extras');
        showToast('Curso extra excluído!');
    }
};
