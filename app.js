// app.js - Classe principal do aplicativo

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
            classSchedule: [],
            dailyLogs: [],
            classDiaries: [],
            reviews: [],
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
        this.viewRenderer = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;
        
        await this.loadData();
        this.viewRenderer = new ViewRenderer(this);
        this.setupEventListeners();
        this.updateSidebarInfo();
        this.applyHeavyMode();
        
        // Carregar dados nos serviços
        if (window.scheduleManager) window.scheduleManager.loadAulas();
        if (window.reviewSystem) window.reviewSystem.loadReviews();
        if (window.dailyLogService) window.dailyLogService.loadLogs();
        if (window.classDiaryService) window.classDiaryService.loadDiaries();
        if (window.gradeCalculator) window.gradeCalculator.loadData();
        
        if (window.aiAssistant) window.aiAssistant.updateContext(this.data);
        
        this.loadView('dashboard');
        this.initialized = true;
        
        this.checkDailyReviews();
    }
async init() {
    if (this.initialized) return;
    
    await this.loadData();
    this.viewRenderer = new ViewRenderer(this);
    this.setupEventListeners();
    this.updateSidebarInfo();
    this.applyHeavyMode();
    
    // ADICIONE ESTA LINHA: Disparar evento para outros módulos
    document.dispatchEvent(new Event('app-ready'));
    
    // Carregar dados nos serviços
    if (window.scheduleManager) window.scheduleManager.loadAulas();
    if (window.reviewSystem) window.reviewSystem.loadReviews();
    if (window.dailyLogService) window.dailyLogService.loadLogs();
    if (window.classDiaryService) window.classDiaryService.loadDiaries();
    if (window.gradeCalculator) window.gradeCalculator.loadData();
    
    if (window.aiAssistant) window.aiAssistant.updateContext(this.data);
    
    this.loadView('dashboard');
    this.initialized = true;
    
    this.checkDailyReviews();
}
    async loadData() {
        const user = auth.currentUser;
        if (user) {
            await dbService.loadUserData(user.uid);
        }
        return this.data;
    }

    checkDailyReviews() {
        if (window.reviewSystem) {
            const revisoesHoje = window.reviewSystem.getRevisoesHoje();
            if (revisoesHoje.length > 0) {
                showToast(`Você tem ${revisoesHoje.length} revisão(ões) para hoje!`, 'info');
            }
        }
    }

    renderSetupForm() {
        const container = document.getElementById('materias-container');
        if (!container) return;
        
        container.innerHTML = '';
        this.addMateriaField();

        const aulasContainer = document.getElementById('aulas-container');
        if (aulasContainer) {
            aulasContainer.innerHTML = '';
        }
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

    addAulaField() {
        const container = document.getElementById('aulas-container');
        if (!container) return;
        
        const materiaInputs = document.querySelectorAll('.materia-nome');
        const materias = [];
        materiaInputs.forEach(input => {
            if (input.value.trim()) {
                materias.push(input.value.trim());
            }
        });
        
        if (!materias.length) {
            showToast('Adicione pelo menos uma matéria primeiro', 'warning');
            return;
        }
        
        const item = document.createElement('div');
        item.className = 'aula-item';
        
        let optionsHtml = '<option value="">Selecione</option>';
        materias.forEach(m => {
            optionsHtml += `<option value="${m}">${m}</option>`;
        });
        
        item.innerHTML = `
            <div class="aula-fields">
                <select class="aula-materia" required>
                    ${optionsHtml}
                </select>
                <select class="aula-dia" required>
                    <option value="0">Domingo</option>
                    <option value="1">Segunda</option>
                    <option value="2">Terça</option>
                    <option value="3">Quarta</option>
                    <option value="4">Quinta</option>
                    <option value="5">Sexta</option>
                    <option value="6">Sábado</option>
                </select>
                <input type="time" class="aula-inicio" placeholder="Início" required>
                <input type="time" class="aula-fim" placeholder="Fim" required>
                <input type="text" class="aula-sala" placeholder="Sala">
                <input type="text" class="aula-professor" placeholder="Professor">
            </div>
            <button type="button" class="btn-remove"><i class="fas fa-times"></i></button>
        `;
        item.querySelector('.btn-remove').addEventListener('click', () => item.remove());
        container.appendChild(item);
    }

    async handleSetupSubmit(e) {
        e.preventDefault();
        showLoading();

        const subjects = [];
        document.querySelectorAll('.materia-item').forEach(item => {
            const nome = item.querySelector('.materia-nome').value;
            if (nome) {
                subjects.push({
                    id: generateId(),
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
            createdAt: new Date().toISOString(),
            streak: 0,
            lastStudyDate: null
        };

        this.data.subjects = subjects;

        const aulas = [];
        document.querySelectorAll('.aula-item').forEach(item => {
            const materia = item.querySelector('.aula-materia')?.value;
            if (materia) {
                aulas.push({
                    id: generateId(),
                    materia: materia,
                    dia: item.querySelector('.aula-dia').value,
                    inicio: item.querySelector('.aula-inicio').value,
                    fim: item.querySelector('.aula-fim').value,
                    sala: item.querySelector('.aula-sala')?.value || '',
                    professor: item.querySelector('.aula-professor')?.value || '',
                    bloco: '',
                    cor: '#3b82f6'
                });
            }
        });
        this.data.classSchedule = aulas;

        const success = await dbService.saveAllData();
        
        hideLoading();
        
        if (success) {
            document.getElementById('setup-screen').style.display = 'none';
            document.getElementById('main-dashboard').style.display = 'block';
            
            this.updateSidebarInfo();
            this.loadView('dashboard');
            showToast('Configuração concluída!');
        }
    }

    setupEventListeners() {
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
        document.getElementById('form-aula')?.addEventListener('submit', (e) => this.handleAulaSubmit(e));

        document.getElementById('modo-faculdade-pesada')?.addEventListener('change', (e) => {
            this.data.settings.heavyMode = e.target.checked;
            dbService.saveData('settings', this.data.settings);
            this.applyHeavyMode();
            showToast(`Modo Faculdade Pesada ${e.target.checked ? 'ativado' : 'desativado'}`);
        });

        document.getElementById('refresh-data')?.addEventListener('click', () => {
            this.loadView(this.currentView);
            showToast('Dados atualizados');
        });
    }

    applyHeavyMode() {
        if (this.data.settings.heavyMode) {
            document.body.classList.add('heavy-mode');
        } else {
            document.body.classList.remove('heavy-mode');
        }
    }

    updateSidebarInfo() {
        if (!this.data.user) return;
        
        const user = auth.currentUser;
        if (user) {
            document.getElementById('sidebar-user-name').textContent = this.data.user.nome;
            document.getElementById('sidebar-user-email').textContent = user.email || '';
            document.getElementById('sidebar-streak').textContent = `${this.data.user.streak || 0} dias`;
            
            if (user.photoURL) {
                document.getElementById('user-avatar').src = user.photoURL;
            }
        }
    }

    loadView(view) {
        if (!this.viewRenderer) {
            this.viewRenderer = new ViewRenderer(this);
        }
        
        this.currentView = view;
        const container = document.getElementById('view-container');
        let html = '';
        
        switch(view) {
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

        if (view === 'grade-horaria') {
            document.getElementById('btn-nova-aula')?.addEventListener('click', () => this.openModal('aula'));
            document.querySelectorAll('.btn-remover-aula').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const id = e.currentTarget.dataset.id;
                    if (window.scheduleManager) {
                        await window.scheduleManager.removeAula(id);
                    }
                    this.loadView('grade-horaria');
                    showToast('Aula removida');
                });
            });
        }

        if (view === 'mentor-ia') {
            this.setupIAEvents();
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

        if (view === 'foco') {
            document.getElementById('timer-start')?.addEventListener('click', () => this.startTimer());
            document.getElementById('timer-pause')?.addEventListener('click', () => this.pauseTimer());
            document.getElementById('timer-reset')?.addEventListener('click', () => this.resetTimer());
        }

        if (view === 'habitos') {
            document.querySelectorAll('.toggle-habito').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const habitoId = e.currentTarget.dataset.habito;
                    this.toggleHabito(habitoId);
                });
            });
        }

        if (view === 'configuracoes') {
            document.getElementById('config-notificacoes')?.addEventListener('change', (e) => {
                this.data.settings.notifications = e.target.checked;
                dbService.saveData('settings', this.data.settings);
            });
            document.getElementById('config-auto-plan')?.addEventListener('change', (e) => {
                this.data.settings.autoPlan = e.target.checked;
                dbService.saveData('settings', this.data.settings);
            });
            document.getElementById('config-heavy-mode')?.addEventListener('change', (e) => {
                this.data.settings.heavyMode = e.target.checked;
                dbService.saveData('settings', this.data.settings);
                this.applyHeavyMode();
            });
            document.getElementById('exportar-dados')?.addEventListener('click', () => this.exportarDados());
            document.getElementById('limpar-dados')?.addEventListener('click', () => this.limparDados());
        }

        document.getElementById('quick-sessao')?.addEventListener('click', () => this.openModal('sessao'));
        document.getElementById('quick-tarefa')?.addEventListener('click', () => this.openModal('tarefa'));
        document.getElementById('quick-prova')?.addEventListener('click', () => this.openModal('prova'));
        document.getElementById('quick-foco')?.addEventListener('click', () => this.loadView('foco'));
        document.getElementById('perguntar-ia')?.addEventListener('click', () => this.loadView('mentor-ia'));

        document.querySelectorAll('.btn-adicionar-sessao-rapida').forEach(btn => {
            btn.addEventListener('click', (e) => {
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

        const sendMessage = async () => {
            const text = input.value.trim();
            if (!text) return;

            messages.innerHTML += `
                <div class="message user">
                    <div class="message-content">${text}</div>
                </div>
            `;
            input.value = '';

            messages.innerHTML += `
                <div class="message assistant loading">
                    <div class="message-content">Pensando...</div>
                </div>
            `;
            messages.scrollTop = messages.scrollHeight;

            if (window.aiAssistant) {
                window.aiAssistant.updateContext(this.data);
                const resposta = await window.aiAssistant.ask(text);

                messages.querySelector('.loading')?.remove();
                messages.innerHTML += `
                    <div class="message assistant">
                        <div class="message-content">${resposta.replace(/\n/g, '<br>')}</div>
                    </div>
                `;
                messages.scrollTop = messages.scrollHeight;
            }
        };

        sendBtn?.addEventListener('click', sendMessage);
        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });

        document.querySelectorAll('.sugestao-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                input.value = btn.dataset.pergunta;
                sendMessage();
            });
        });

        document.getElementById('ia-plano-hoje')?.addEventListener('click', () => {
            input.value = "Qual meu plano de estudo para hoje?";
            sendMessage();
        });
        document.getElementById('ia-plano-semana')?.addEventListener('click', () => {
            input.value = "Qual o plano para a semana?";
            sendMessage();
        });
        document.getElementById('ia-analisar-risco')?.addEventListener('click', () => {
            input.value = "Quais os riscos acadêmicos?";
            sendMessage();
        });
    }

    openModal(modalType, data = {}) {
        if (['sessao', 'tarefa', 'prova', 'topico', 'nota', 'material', 'aula'].includes(modalType)) {
            const select = document.getElementById(`${modalType}-materia`);
            if (select && this.data.subjects.length > 0) {
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
        
        const modal = document.getElementById(`modal-${modalType}`);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    openDailyLogModal() {
        const modal = document.getElementById('modal-daily-log');
        if (!modal) return;

        const hoje = new Date().toISOString().split('T')[0];
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
        select.innerHTML = '<option value="">Selecione</option>';
        this.data.subjects.forEach(s => {
            select.innerHTML += `<option value="${s.nome}">${s.nome}</option>`;
        });

        if (aulaId && window.scheduleManager) {
            const aula = window.scheduleManager.aulas.find(a => a.id === aulaId);
            if (aula) {
                select.value = aula.materia;
                document.getElementById('class-diary-data').value = new Date().toISOString().split('T')[0];
            }
        }

        modal.style.display = 'block';
    }

    openAulaModal(aulaId) {
        const modal = document.getElementById('modal-aula-detail');
        if (!modal) return;

        if (!window.scheduleManager) return;
        const aula = window.scheduleManager.aulas.find(a => a.id === aulaId);
        if (!aula) return;

        document.getElementById('aula-detail-materia').textContent = aula.materia;
        document.getElementById('aula-detail-horario').textContent = `${aula.inicio} - ${aula.fim}`;
        document.getElementById('aula-detail-sala').textContent = aula.sala || 'Não informada';
        document.getElementById('aula-detail-professor').textContent = aula.professor || 'Não informado';

        const hoje = new Date().toISOString().split('T')[0];
        const key = `${aulaId}_${hoje}`;
        const presencaHoje = this.data.attendance[key];

        const presencaContainer = document.getElementById('aula-detail-presenca');
        if (presencaHoje) {
            presencaContainer.innerHTML = `<span class="tag ${presencaHoje === 'present' ? 'success' : 'danger'}">${presencaHoje === 'present' ? 'Presente' : 'Faltou'}</span>`;
        } else {
            presencaContainer.innerHTML = `
                <button class="btn-small btn-success" onclick="window.app.marcarPresenca('${aulaId}', 'present')">✅ Presente</button>
                <button class="btn-small btn-danger" onclick="window.app.marcarPresenca('${aulaId}', 'absent')">❌ Faltei</button>
            `;
        }

        const ultimoDiario = window.classDiaryService?.getUltimoDiarioPorMateria(aula.materia);
        if (ultimoDiario) {
            document.getElementById('aula-detail-ultimo-conteudo').innerHTML = `
                <strong>${ultimoDiario.data}</strong>: ${ultimoDiario.conteudoExplicado || 'Nenhum conteúdo registrado'}
                ${ultimoDiario.precisoRevisar ? '<span class="badge warning">Revisar</span>' : ''}
            `;
        } else {
            document.getElementById('aula-detail-ultimo-conteudo').textContent = 'Nenhum registro de aula';
        }

        modal.style.display = 'block';
    }

    async marcarPresenca(aulaId, status) {
        const hoje = new Date().toISOString().split('T')[0];
        if (window.scheduleManager) {
            const success = await window.scheduleManager.marcarPresenca(aulaId, hoje, status);
            if (success) {
                showToast(`Presença marcada como ${status === 'present' ? 'presente' : 'falta'}`);
                this.openAulaModal(aulaId);
            }
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
            trabalhoDuracao: parseInt(document.getElementById('daily-log-trabalho-duracao').value) || 0,
            energia: document.getElementById('daily-log-energia').value,
            foco: document.getElementById('daily-log-foco').value,
            observacoes: document.getElementById('daily-log-observacoes').value
        };

        if (window.dailyLogService) {
            await window.dailyLogService.registrarLog(logData);
        }
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
            dificuldade: parseInt(document.getElementById('class-diary-dificuldade').value) || 3,
            precisoRevisar: document.getElementById('class-diary-revisar').checked,
            observacoes: document.getElementById('class-diary-observacoes').value
        };

        if (window.classDiaryService) {
            await window.classDiaryService.registrarDiario(diaryData);
        }
        document.getElementById('modal-class-diary').style.display = 'none';
        this.loadView(this.currentView);
    }

    async handleSessaoSubmit(e) {
        e.preventDefault();
        const novaSessao = {
            id: generateId(),
            materia: document.getElementById('sessao-materia').value,
            tipo: document.getElementById('sessao-tipo').value,
            duracao: parseInt(document.getElementById('sessao-duracao').value),
            topico: document.getElementById('sessao-topico').value,
            data: document.getElementById('sessao-data').value,
            concluida: false
        };

        const success = await dbService.addItem('sessions', novaSessao);
        if (success) {
            document.getElementById('modal-sessao').style.display = 'none';
            this.loadView(this.currentView);
            showToast('Sessão adicionada!');
        }
    }

    async handleTarefaSubmit(e) {
        e.preventDefault();
        const novaTarefa = {
            id: generateId(),
            titulo: document.getElementById('tarefa-titulo').value,
            materia: document.getElementById('tarefa-materia').value,
            prioridade: document.getElementById('tarefa-prioridade').value,
            dataLimite: document.getElementById('tarefa-data').value,
            estimativa: parseInt(document.getElementById('tarefa-estimativa').value) || 60,
            concluida: false
        };

        const success = await dbService.addItem('tasks', novaTarefa);
        if (success) {
            document.getElementById('modal-tarefa').style.display = 'none';
            this.loadView(this.currentView);
            showToast('Tarefa adicionada!');
        }
    }

    async handleProvaSubmit(e) {
        e.preventDefault();
        const novaProva = {
            id: generateId(),
            titulo: document.getElementById('prova-titulo').value,
            materia: document.getElementById('prova-materia').value,
            tipo: document.getElementById('prova-tipo').value,
            data: document.getElementById('prova-data').value,
            peso: parseInt(document.getElementById('prova-peso').value) || 100,
            importancia: document.getElementById('prova-importancia').value,
            concluida: false
        };

        const success = await dbService.addItem('exams', novaProva);
        if (success) {
            document.getElementById('modal-prova').style.display = 'none';
            this.loadView(this.currentView);
            showToast('Evento adicionado!');
        }
    }

    async handleAulaSubmit(e) {
        e.preventDefault();
        const novaAula = {
            id: generateId(),
            materia: document.getElementById('aula-materia').value,
            dia: document.getElementById('aula-dia').value,
            inicio: document.getElementById('aula-inicio').value,
            fim: document.getElementById('aula-fim').value,
            sala: document.getElementById('aula-sala').value,
            professor: document.getElementById('aula-professor').value,
            bloco: document.getElementById('aula-bloco').value,
            cor: document.getElementById('aula-cor').value || '#3b82f6'
        };

        if (window.scheduleManager) {
            const success = await window.scheduleManager.addAula(novaAula);
            if (success) {
                document.getElementById('modal-aula').style.display = 'none';
                this.loadView('grade-horaria');
                showToast('Aula adicionada!');
            }
        }
    }

    async handleTopicoSubmit(e) {
        e.preventDefault();
        const novoTopico = {
            id: generateId(),
            materia: document.getElementById('topico-materia').value,
            nome: document.getElementById('topico-nome').value,
            dificuldade: parseInt(document.getElementById('topico-dificuldade').value) || 3,
            status: document.getElementById('topico-status').value,
            confianca: parseInt(document.getElementById('topico-confianca').value) || 3,
            ultimaRevisao: new Date().toISOString()
        };

        const success = await dbService.addItem('learningMap', novoTopico);
        if (success) {
            document.getElementById('modal-topico').style.display = 'none';
            this.loadView(this.currentView);
            showToast('Tópico adicionado!');
        }
    }

    async handleNotaSubmit(e) {
        e.preventDefault();
        const novaNota = {
            id: generateId(),
            materia: document.getElementById('nota-materia').value,
            avaliacao: document.getElementById('nota-avaliacao').value,
            valor: parseFloat(document.getElementById('nota-valor').value),
            peso: parseInt(document.getElementById('nota-peso').value) || 100,
            data: new Date().toISOString()
        };

        const success = await dbService.addItem('grades', novaNota);
        if (success) {
            document.getElementById('modal-nota').style.display = 'none';
            this.loadView(this.currentView);
            showToast('Nota registrada!');
        }
    }

    async handleMaterialSubmit(e) {
        e.preventDefault();
        const novoMaterial = {
            id: generateId(),
            titulo: document.getElementById('material-titulo').value,
            materia: document.getElementById('material-materia').value,
            tipo: document.getElementById('material-tipo').value,
            conteudo: document.getElementById('material-conteudo').value
        };

        const success = await dbService.addItem('materials', novoMaterial);
        if (success) {
            document.getElementById('modal-material').style.display = 'none';
            this.loadView(this.currentView);
            showToast('Material adicionado!');
        }
    }

    async concluirSessao(id) {
        const s = this.data.sessions.find(s => s.id === id);
        if (s) {
            s.concluida = true;
            this.updateStreak();
            const success = await dbService.updateItem('sessions', id, { concluida: true });
            if (success) {
                this.loadView(this.currentView);
                showToast('Sessão concluída!');
            }
        }
    }

    async concluirTarefa(id) {
        const t = this.data.tasks.find(t => t.id === id);
        if (t) {
            t.concluida = true;
            const success = await dbService.updateItem('tasks', id, { concluida: true });
            if (success) {
                this.loadView(this.currentView);
                showToast('Tarefa concluída!');
            }
        }
    }

    async toggleHabito(id) {
        const hoje = new Date().toDateString();
        const idx = this.data.habits.findIndex(h => h.id === id && new Date(h.data).toDateString() === hoje);
        
        let success;
        if (idx >= 0) {
            this.data.habits.splice(idx, 1);
            success = await dbService.saveData('habits', this.data.habits);
        } else {
            const novoHabito = { id, data: new Date().toISOString() };
            this.data.habits.push(novoHabito);
            success = await dbService.saveData('habits', this.data.habits);
        }
        
        if (success) {
            this.loadView(this.currentView);
        }
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
    }

    updateTimerDisplay() {
        const m = Math.floor(this.timerSeconds / 60);
        const s = this.timerSeconds % 60;
        const display = document.getElementById('timer-display');
        if (display) {
            display.textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
        }
    }

    updateStreak() {
        if (!this.data.user) return;
        
        const hoje = new Date().toDateString();
        if (this.data.user.lastStudyDate === hoje) return;
        
        const ontem = new Date();
        ontem.setDate(ontem.getDate() - 1);
        
        if (this.data.user.lastStudyDate === ontem.toDateString()) {
            this.data.user.streak = (this.data.user.streak || 0) + 1;
        } else {
            this.data.user.streak = 1;
        }
        
        this.data.user.lastStudyDate = hoje;
        dbService.saveData('user', this.data.user);
        this.updateSidebarInfo();
    }

    async whatsNow() {
        if (window.aiAssistant) {
            const sugestao = await window.aiAssistant.sugerirEstudoAgora();
            
            const modal = document.getElementById('modal-whats-now');
            if (modal) {
                document.getElementById('whats-now-content').innerHTML = sugestao.replace(/\n/g, '<br>');
                modal.style.display = 'block';
            } else {
                showToast(sugestao, 'info');
            }
        }
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
        if (confirm('Tem certeza? Todos os dados serão perdidos.')) {
            const success = await dbService.clearAllData();
            if (success) {
                localStorage.clear();
                showToast('Dados limpos!');
                location.reload();
            }
        }
    }

    generateAlerts() {
        const alerts = [];
        const hoje = new Date();
        
        this.data.subjects.forEach(s => {
            const ultimo = this.data.sessions.filter(ses => ses.materia === s.nome && ses.concluida)
                .sort((a,b)=>new Date(b.data)-new Date(a.data))[0];
            if (ultimo && diasDesde(ultimo.data) >= 5) {
                alerts.push({ 
                    type: 'warning', 
                    title: `${s.nome} esquecida`, 
                    message: `${diasDesde(ultimo.data)} dias sem estudar` 
                });
            }
        });
        
        this.data.exams.forEach(e => {
            const dias = diasAte(e.data);
            if (dias <= 3 && dias >= 0) {
                const horas = this.data.sessions.filter(s => s.materia === e.materia && s.concluida)
                    .reduce((a,s)=>a+s.duracao,0)/60;
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
        
        this.data.subjects.forEach(s => {
            const notas = this.data.grades.filter(g => g.materia === s.nome);
            const media = this.calcularMedia(notas);
            const exames = this.data.exams.filter(e => e.materia === s.nome && new Date(e.data) >= hoje && diasAte(e.data) <= 14);
            const horas = this.data.sessions.filter(ses => ses.materia === s.nome && ses.concluida)
                .reduce((a,s)=>a+s.duracao,0)/60;
                
            if (media > 0 && media < 6) {
                risks.push({ materia: s.nome, nivel: 'alto', motivo: `Média ${media.toFixed(1)}` });
            } else if (exames.length && horas < 3) {
                risks.push({ materia: s.nome, nivel: 'alto', motivo: `Prova próxima, ${horas.toFixed(1)}h estudadas` });
            } else if (s.dificuldade >= 4 && horas < 2) {
                risks.push({ materia: s.nome, nivel: 'medio', motivo: 'Matéria difícil, pouco estudo' });
            }
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
        const horas = this.data.sessions.filter(s => s.materia === subject.nome && s.concluida)
            .reduce((a,s)=>a+s.duracao,0)/60;
        const restantes = this.data.exams.filter(e => e.materia === subject.nome && new Date(e.data) >= new Date());
        const pesoRestante = restantes.reduce((a, e) => a + e.peso, 0);
        
        let notaNecessaria = subject.notaDesejada;
        if (pesoRestante > 0) {
            notaNecessaria = ((subject.notaDesejada * 100) - (media * (100 - pesoRestante))) / pesoRestante;
        }
        
        let chance = 50;
        if (horas > subject.dificuldade * 5) chance += 20;
        if (media > 7) chance += 20;
        if (media < 5) chance -= 20;
        if (subject.dificuldade >= 4) chance -= 10;
        if (!restantes.length) chance = media >= 6 ? 100 : 0;
        
        chance = Math.min(100, Math.max(0, chance));
        
        const risco = chance < 30 ? 'alto' : chance < 60 ? 'medio' : 'baixo';
        const motivo = chance >= 80 ? 'Você está no caminho certo!' : 
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
        return this.data.tasks.filter(t => !t.concluida && diasAte(t.dataLimite) <= 3)
            .sort((a,b)=>new Date(a.dataLimite)-new Date(b.dataLimite));
    }

    getUpcomingExams(days) {
        const hoje = new Date();
        return this.data.exams.filter(e => !e.concluida && diasAte(e.data) <= days && diasAte(e.data) >= 0)
            .sort((a,b)=>new Date(a.data)-new Date(b.data));
    }

    calcularHorasPorMateria() {
        const h = {};
        this.data.sessions.filter(s => s.concluida).forEach(s => {
            h[s.materia] = (h[s.materia] || 0) + s.duracao / 60;
        });
        return Object.entries(h).map(([m, horas]) => ({ materia: m, horas }))
            .sort((a,b) => b.horas - a.horas);
    }

    calcularHorasPorTipo() {
        const t = {};
        this.data.sessions.filter(s => s.concluida).forEach(s => {
            t[s.tipo] = (t[s.tipo] || 0) + s.duracao / 60;
        });
        return Object.entries(t).map(([tipo, horas]) => ({ tipo, horas }))
            .sort((a,b) => b.horas - a.horas);
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
        return Math.round(this.data.tasks.filter(t => t.concluida).length / this.data.tasks.length * 100);
    }

    calcularConsistencia() {
        const hoje = new Date();
        const inicio = new Date(hoje);
        inicio.setDate(hoje.getDate() - hoje.getDay());
        
        const dias = new Set();
        this.data.sessions.filter(s => s.concluida).forEach(s => {
            const d = new Date(s.data);
            if (d >= inicio) dias.add(d.toDateString());
        });
        
        return Math.round(dias.size / 7 * 100);
    }

    getExamRiskClass(e) {
        const d = diasAte(e.data);
        return d <= 3 ? 'danger' : d <= 7 ? 'warning' : 'success';
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    window.app = new StudyLifeControl();
});