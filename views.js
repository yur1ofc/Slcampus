// views.js - Renderizador de visualizações COMPLETO, CORRIGIDO E COMPATÍVEL

class ViewRenderer {
    constructor(app) {
        this.app = app;
    }

    esc(value) {
        return escapeHtml(value ?? '');
    }

    renderDashboard() {
        const hoje = new Date();
        const alerts = this.app.generateAlerts();
        const risk = this.app.analyzeAcademicRisk();
        const progresso = this.app.calcularProgressoHoje();
        const tarefasUrgentes = this.app.getUrgentTasks();
        const proximosExames = this.app.getUpcomingExams(7);
        const horasResumo = this.getResumoHorasEstudo();
        const materiasAtrasadas = this.getMateriasAtrasadas();
        const resumoSemana = this.getResumoSemana();

        window.aiAssistant?.updateContext(this.app.data);

        const planoIA = window.aiAssistant ? window.aiAssistant.generateDailyPlan() : [];
        const proximaAula = window.scheduleManager ? window.scheduleManager.getProximaAula() : null;
        const aulaAtual = window.scheduleManager ? window.scheduleManager.getAulaAtual() : null;

        const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

        return `
            <div class="dashboard-header">
                <h2>Olá, ${this.esc(this.app.data.user?.nome || 'Estudante')}! 👋</h2>
                <p>${hoje.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            ${aulaAtual ? `
                <div class="current-class-card">
                    <i class="fas fa-chalkboard-teacher"></i>
                    <div class="current-class-info">
                        <h3>Aula Agora: ${this.esc(aulaAtual.materia)}</h3>
                        <p>
                            ${aulaAtual.sala ? `Sala ${this.esc(aulaAtual.sala)}` : ''}
                            ${aulaAtual.professor ? `${aulaAtual.sala ? ' • ' : ''}Prof. ${this.esc(aulaAtual.professor)}` : ''}
                        </p>
                        <small>Até às ${this.esc(aulaAtual.fim)}</small>
                    </div>
                </div>
            ` : proximaAula ? `
                <div class="next-class-card">
                    <i class="fas fa-clock"></i>
                    <div class="next-class-info">
                        <h3>Próxima Aula: ${this.esc(proximaAula.materia)}</h3>
                        <p>
                            ${diasSemana[parseInt(proximaAula.dia, 10)]} • ${this.esc(proximaAula.inicio)} - ${this.esc(proximaAula.fim)}
                            ${proximaAula.sala ? ` • Sala ${this.esc(proximaAula.sala)}` : ''}
                        </p>
                        <small>${tempoRestante(this.getProximaAulaDateTime(proximaAula))}</small>
                    </div>
                </div>
            ` : ''}

            ${alerts.length ? `
                <div class="alerts-container">
                    <h3><i class="fas fa-exclamation-triangle"></i> Alertas Inteligentes</h3>
                    ${alerts.map(a => this.renderAlert(a)).join('')}
                </div>
            ` : ''}

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-clock"></i> Progresso Hoje</h3>
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="card-body">
                        <div class="progress-container">
                            <div class="progress-label">
                                <span>Planejado: ${this.esc(this.app.data.user?.horasMaximas || 6)}h</span>
                                <span>${this.esc(progresso.concluido)}h</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progresso.percentual}%"></div>
                            </div>
                        </div>
                        <div class="stats-row">
                            <div class="stat-item">
                                <span class="stat-value">${this.esc(this.app.data.user?.streak || 0)}</span>
                                <span class="stat-label">streak</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${this.esc(this.app.calcularProdutividade())}</span>
                                <span class="stat-label">produtividade</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${tarefasUrgentes.length}</span>
                                <span class="stat-label">urgentes</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-book-open"></i> Horas Estudadas</h3>
                        <i class="fas fa-stopwatch"></i>
                    </div>
                    <div class="card-body">
                        <div class="stats-row">
                            <div class="stat-item">
                                <span class="stat-value">${horasResumo.hoje.toFixed(1)}h</span>
                                <span class="stat-label">hoje</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${horasResumo.semana.toFixed(1)}h</span>
                                <span class="stat-label">semana</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${horasResumo.total.toFixed(1)}h</span>
                                <span class="stat-label">total</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-exclamation-circle"></i> Risco Acadêmico</h3>
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    <div class="card-body">
                        ${risk.length ? risk.map(r => `
                            <div class="risk-item">
                                <div class="risk-info">
                                    <strong>${this.esc(r.materia)}</strong>
                                    <span class="risk-indicator risk-${this.esc(r.nivel)}">${this.esc(r.nivel)}</span>
                                </div>
                                <p class="risk-desc">${this.esc(r.motivo)}</p>
                            </div>
                        `).join('') : '<p class="text-secondary">Nenhum risco identificado</p>'}
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-tasks"></i> Tarefas Urgentes</h3>
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="card-body">
                        <ul class="item-list">
                            ${tarefasUrgentes.map(t => `
                                <li>
                                    <div>
                                        <strong>${this.esc(t.titulo)}</strong>
                                        <small>${this.esc(t.materia)}</small>
                                    </div>
                                    <span class="tag high">${diasAte(t.dataLimite)}d</span>
                                </li>
                            `).join('')}
                            ${!tarefasUrgentes.length ? '<li>Nenhuma tarefa urgente</li>' : ''}
                        </ul>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-graduation-cap"></i> Próximas Provas</h3>
                        <i class="fas fa-calendar"></i>
                    </div>
                    <div class="card-body">
                        <ul class="item-list">
                            ${proximosExames.map(e => `
                                <li>
                                    <div>
                                        <strong>${this.esc(e.titulo)}</strong>
                                        <small>${this.esc(e.materia)}</small>
                                    </div>
                                    <span class="tag ${this.app.getExamRiskClass(e)}">${diasAte(e.data)}d</span>
                                </li>
                            `).join('')}
                            ${!proximosExames.length ? '<li>Nenhuma prova próxima</li>' : ''}
                        </ul>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3><i class="fas fa-history"></i> Matérias Atrasadas</h3>
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="card-body">
                        <ul class="item-list">
                            ${materiasAtrasadas.map(m => `
                                <li>
                                    <div>
                                        <strong>${this.esc(m.materia)}</strong>
                                        <small>${m.nuncaEstudou ? 'Sem registro de estudo' : `${m.dias} dias sem estudar`}</small>
                                    </div>
                                    <span class="tag ${m.nuncaEstudou || m.dias >= 7 ? 'danger' : 'warning'}">
                                        ${m.nuncaEstudou ? 'Novo' : `${m.dias}d`}
                                    </span>
                                </li>
                            `).join('')}
                            ${!materiasAtrasadas.length ? '<li>Nenhuma matéria atrasada</li>' : ''}
                        </ul>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-calendar-week"></i> Resumo da Semana</h3>
                    <i class="fas fa-chart-bar"></i>
                </div>
                <div class="card-body">
                    <div class="semana-grid">
                        ${resumoSemana.map(dia => `
                            <div class="dia-card">
                                <h4>${this.esc(dia.nome)}</h4>
                                <div class="sessao-item">
                                    <span>Estudo</span>
                                    <strong>${dia.horas.toFixed(1)}h</strong>
                                </div>
                                <div class="sessao-item">
                                    <span>Aulas</span>
                                    <strong>${dia.aulas}</strong>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3><i class="fas fa-robot"></i> Plano de Hoje (IA)</h3>
                    <button class="btn-secondary" id="perguntar-ia">Perguntar à IA</button>
                </div>
                <div class="card-body">
                    <div class="plano-ia">
                        ${planoIA.map(item => `
                            <div class="plano-item">
                                <div class="plano-materia">${this.esc(item.materia)}</div>
                                <div class="plano-detalhes">
                                    <span class="tag ${this.esc(item.prioridade)}">${this.esc(item.tipo)} • ${this.esc(item.duracao)}min</span>
                                </div>
                                <div class="plano-motivo">💡 ${this.esc(item.motivo)}</div>
                                <button class="btn-secondary btn-adicionar-sessao-rapida"
                                        data-materia="${this.esc(item.materia)}"
                                        data-tipo="${this.esc(item.tipo)}"
                                        data-duracao="${this.esc(item.duracao)}">
                                    <i class="fas fa-plus"></i> Adicionar
                                </button>
                            </div>
                        `).join('')}
                        ${!planoIA.length ? '<p class="text-secondary">Nenhuma recomendação para hoje</p>' : ''}
                    </div>
                </div>
            </div>

            <div class="quick-actions">
                <button class="btn-primary" id="quick-sessao"><i class="fas fa-clock"></i> Nova Sessão</button>
                <button class="btn-primary" id="quick-tarefa"><i class="fas fa-tasks"></i> Nova Tarefa</button>
                <button class="btn-primary" id="quick-prova"><i class="fas fa-graduation-cap"></i> Nova Prova</button>
                <button class="btn-primary" id="quick-foco"><i class="fas fa-bullseye"></i> Modo Foco</button>
            </div>
        `;
    }

    renderMentorIA() {
        return `
            <div class="view-header">
                <h2><i class="fas fa-robot"></i> Mentor IA</h2>
                <div class="header-actions">
                    <button class="btn-secondary" id="ia-plano-hoje"><i class="fas fa-calendar-day"></i> Plano Hoje</button>
                    <button class="btn-secondary" id="ia-plano-semana"><i class="fas fa-calendar-week"></i> Plano Semana</button>
                    <button class="btn-secondary" id="ia-analisar-risco"><i class="fas fa-exclamation-triangle"></i> Analisar Risco</button>
                </div>
            </div>

            <div class="mentor-ia-container">
                <div class="chat-container" id="chat-container">
                    <div class="chat-messages" id="chat-messages">
                        <div class="message assistant">
                            <div class="message-content">
                                Olá! Sou seu mentor IA. Posso ajudar com planos de estudo, análise de risco, próximas aulas e muito mais. Como posso ajudar hoje?
                            </div>
                        </div>
                    </div>

                    <div class="chat-input-container">
                        <input type="text" id="chat-input" placeholder="Digite sua pergunta..." class="chat-input">
                        <button class="btn-primary" id="chat-send"><i class="fas fa-paper-plane"></i></button>
                    </div>
                </div>

                <div class="sugestoes-container">
                    <h3>Sugestões de Perguntas</h3>
                    <div class="sugestoes-grid">
                        <button class="sugestao-btn" data-pergunta="Qual meu plano de estudo para hoje?">
                            <i class="fas fa-calendar-day"></i> Plano para hoje
                        </button>
                        <button class="sugestao-btn" data-pergunta="Qual o plano para a semana?">
                            <i class="fas fa-calendar-week"></i> Plano semanal
                        </button>
                        <button class="sugestao-btn" data-pergunta="Quais os riscos acadêmicos?">
                            <i class="fas fa-exclamation-triangle"></i> Riscos acadêmicos
                        </button>
                        <button class="sugestao-btn" data-pergunta="Qual a próxima aula?">
                            <i class="fas fa-chalkboard-teacher"></i> Próxima aula
                        </button>
                        <button class="sugestao-btn" data-pergunta="Próximas provas?">
                            <i class="fas fa-graduation-cap"></i> Próximas provas
                        </button>
                        <button class="sugestao-btn" data-pergunta="Dica de estudo">
                            <i class="fas fa-lightbulb"></i> Dica de estudo
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderGradeHoraria() {
        if (!window.scheduleManager) {
            return '<div class="card"><div class="card-body"><p class="text-secondary">Erro ao carregar grade horária</p></div></div>';
        }

        window.scheduleManager.loadAulas();

        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const aulas = window.scheduleManager.loadAulas() || [];
        const totalAulas = aulas.length;
        const horasSemana = this.calcularHorasAulaSemana(aulas);

        const uid = Date.now().toString();
        const viewModeId = `grade-view-mode-${uid}`;
        const daySelectId = `grade-day-select-${uid}`;
        const wrapperId = `grade-day-select-wrapper-${uid}`;
        const containerId = `schedule-vertical-container-${uid}`;

        const currentViewMode = window.scheduleManager.viewMode === 'week' ? 'semana' : 'dia';
        const currentDay = Number.isInteger(window.scheduleManager.selectedDay)
            ? window.scheduleManager.selectedDay
            : new Date().getDay();

        setTimeout(() => {
            this.setupGradeHoraria(containerId, viewModeId, daySelectId, wrapperId);
        }, 50);

        return `
            <div class="view-header">
                <h2><i class="fas fa-calendar-week"></i> Grade Horária</h2>
                <button class="btn-primary" id="btn-nova-aula"><i class="fas fa-plus"></i> Nova Aula</button>
            </div>

            <div class="card" style="margin-bottom: 24px;">
                <div class="card-body">
                    <div class="form-row" style="margin-bottom:0;">
                        <div class="form-group" style="margin-bottom:0;">
                            <label>Visualização</label>
                            <select id="${viewModeId}" class="grade-view-mode">
                                <option value="dia" ${currentViewMode === 'dia' ? 'selected' : ''}>Dia atual / um dia</option>
                                <option value="semana" ${currentViewMode === 'semana' ? 'selected' : ''}>Semana toda</option>
                            </select>
                        </div>
                        <div class="form-group" style="margin-bottom:0;" id="${wrapperId}">
                            <label>Dia</label>
                            <select id="${daySelectId}" class="grade-day-select">
                                ${dias.map((dia, index) => `
                                    <option value="${index}" ${index === currentDay ? 'selected' : ''}>${dia}</option>
                                `).join('')}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div class="schedule-container card" style="padding: 20px; margin-bottom: 24px;">
                <div id="${containerId}" style="min-height: 600px;"></div>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header">
                        <h3>Resumo da Grade</h3>
                    </div>
                    <div class="card-body">
                        <div class="stats-row">
                            <div class="stat-item">
                                <span class="stat-value">${totalAulas}</span>
                                <span class="stat-label">aulas</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${horasSemana.toFixed(1)}h</span>
                                <span class="stat-label">semana</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${(totalAulas ? horasSemana / totalAulas : 0).toFixed(1)}h</span>
                                <span class="stat-label">média</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="aulas-list card">
                <div class="card-header">
                    <h3>Minhas Aulas (${this.app.data.classSchedule?.length || 0})</h3>
                </div>
                <div class="card-body">
                    <ul class="item-list">
                        ${(this.app.data.classSchedule || []).map(a => `
                            <li>
                                <div>
                                    <strong>${this.esc(a.materia)}</strong><br>
                                    <small>${dias[parseInt(a.dia, 10)]} • ${this.esc(a.inicio)} - ${this.esc(a.fim)}</small>
                                    ${a.sala ? `<br><small>Sala: ${this.esc(a.sala)}</small>` : ''}
                                    ${a.professor ? `<br><small>Prof: ${this.esc(a.professor)}</small>` : ''}
                                </div>
                                <div style="display:flex; gap:8px;">
                                    <button class="btn-icon btn-editar-aula" data-id="${this.esc(a.id)}" title="Editar aula">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon btn-remover-aula" data-id="${this.esc(a.id)}" title="Remover aula" style="color: var(--accent-danger);">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </li>
                        `).join('') || '<li>Nenhuma aula cadastrada</li>'}
                    </ul>
                </div>
            </div>
        `;
    }

    setupGradeHoraria(containerId, viewModeId, daySelectId, wrapperId) {
        const container = document.getElementById(containerId);
        const modoSelect = document.getElementById(viewModeId);
        const diaSelect = document.getElementById(daySelectId);
        const dayWrapper = document.getElementById(wrapperId);

        if (!container || !window.scheduleManager || !modoSelect || !diaSelect) return;

        const renderizar = () => {
            const modo = modoSelect.value;
            const diaSelecionado = parseInt(diaSelect.value, 10);

            if (dayWrapper) {
                dayWrapper.style.display = modo === 'semana' ? 'none' : 'block';
            }

            window.scheduleManager.viewMode = modo === 'semana' ? 'week' : 'day';
            window.scheduleManager.selectedDay = diaSelecionado;

            const aulas = window.scheduleManager.loadAulas() || [];

            if (!aulas.length) {
                container.innerHTML = '<p class="text-secondary" style="padding:20px;">Nenhuma aula cadastrada</p>';
                return;
            }

            if (modo === 'semana') {
                window.scheduleManager.renderGradeSemanal(containerId);
            } else {
                window.scheduleManager.renderGradeDia(diaSelecionado, containerId);
            }
        };

        renderizar();

        modoSelect.addEventListener('change', renderizar);
        diaSelect.addEventListener('change', renderizar);
    }

    renderSessoes() {
        const hoje = toDateString();
        const agora = new Date();

        const sessoesHoje = this.app.data.sessions.filter(s => toDateString(s.data) === hoje && !s.concluida);
        const futuras = this.app.data.sessions
            .filter(s => new Date(s.data) > agora && !s.concluida && toDateString(s.data) !== hoje)
            .sort((a, b) => new Date(a.data) - new Date(b.data));

        const concluidas = this.app.data.sessions
            .filter(s => s.concluida)
            .sort((a, b) => new Date(b.data) - new Date(a.data))
            .slice(0, 10);

        return `
            <div class="view-header">
                <h2><i class="fas fa-clock"></i> Sessões de Estudo</h2>
                <button class="btn-primary" id="btn-nova-sessao"><i class="fas fa-plus"></i> Nova Sessão</button>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header"><h3>⏰ Hoje (${sessoesHoje.length})</h3></div>
                    <div class="card-body">
                        <ul class="item-list">
                            ${sessoesHoje.map(s => `
                                <li>
                                    <div>
                                        <strong>${this.esc(s.materia)}</strong>
                                        <small>${this.esc(s.tipo)} • ${this.esc(s.duracao)}min • ${formatarHora(s.data)}</small>
                                    </div>
                                    <div style="display:flex; gap:8px;">
                                        <button class="btn-icon btn-editar-sessao" data-id="${this.esc(s.id)}" title="Editar sessão">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-icon btn-concluir-sessao" data-id="${this.esc(s.id)}" title="Concluir sessão">
                                            <i class="fas fa-check-circle"></i>
                                        </button>
                                        <button class="btn-icon btn-excluir-sessao" data-id="${this.esc(s.id)}" title="Excluir sessão" style="color: var(--accent-danger);">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </li>
                            `).join('')}
                            ${!sessoesHoje.length ? '<li>Nenhuma sessão programada para hoje</li>' : ''}
                        </ul>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h3>📅 Próximas (${futuras.length})</h3></div>
                    <div class="card-body">
                        <ul class="item-list">
                            ${futuras.map(s => `
                                <li>
                                    <div>
                                        <strong>${this.esc(s.materia)}</strong>
                                        <small>${formatarData(s.data)} • ${formatarHora(s.data)} • ${this.esc(s.tipo)}</small>
                                    </div>
                                    <div style="display:flex; gap:8px;">
                                        <button class="btn-icon btn-editar-sessao" data-id="${this.esc(s.id)}" title="Editar sessão">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-icon btn-excluir-sessao" data-id="${this.esc(s.id)}" title="Excluir sessão" style="color: var(--accent-danger);">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </li>
                            `).join('')}
                            ${!futuras.length ? '<li>Nenhuma sessão futura</li>' : ''}
                        </ul>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h3>✅ Concluídas Recentemente</h3></div>
                    <div class="card-body">
                        <ul class="item-list">
                            ${concluidas.map(s => `
                                <li>
                                    <div>
                                        <strong>${this.esc(s.materia)}</strong>
                                        <small>${formatarData(s.data)}</small>
                                    </div>
                                    <div style="display:flex; gap:8px;">
                                        <i class="fas fa-check" style="color: var(--accent-success);"></i>
                                        <button class="btn-icon btn-excluir-sessao" data-id="${this.esc(s.id)}" title="Excluir sessão" style="color: var(--accent-danger);">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </li>
                            `).join('')}
                            ${!concluidas.length ? '<li>Nenhuma sessão concluída</li>' : ''}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    renderTarefas() {
        const pendentes = this.app.data.tasks
            .filter(t => !t.concluida)
            .sort((a, b) => new Date(a.dataLimite) - new Date(b.dataLimite));

        const concluidas = this.app.data.tasks
            .filter(t => t.concluida)
            .sort((a, b) => new Date(b.dataLimite) - new Date(a.dataLimite));

        return `
            <div class="view-header">
                <h2><i class="fas fa-tasks"></i> Tarefas</h2>
                <button class="btn-primary" id="btn-nova-tarefa"><i class="fas fa-plus"></i> Nova Tarefa</button>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header"><h3>📋 Pendentes (${pendentes.length})</h3></div>
                    <div class="card-body">
                        <ul class="item-list">
                            ${pendentes.map(t => `
                                <li>
                                    <div>
                                        <strong>${this.esc(t.titulo)}</strong>
                                        <small>${this.esc(t.materia)} • até ${formatarData(t.dataLimite)}</small>
                                    </div>
                                    <div style="display:flex; gap:8px;">
                                        <span class="tag ${this.esc(t.prioridade)}">${this.esc(t.prioridade)}</span>
                                        <button class="btn-icon btn-editar-tarefa" data-id="${this.esc(t.id)}" title="Editar tarefa">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-icon btn-concluir-tarefa" data-id="${this.esc(t.id)}" title="Concluir tarefa">
                                            <i class="fas fa-check-circle"></i>
                                        </button>
                                        <button class="btn-icon btn-excluir-tarefa" data-id="${this.esc(t.id)}" title="Excluir tarefa" style="color: var(--accent-danger);">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </li>
                            `).join('')}
                            ${!pendentes.length ? '<li>Nenhuma tarefa pendente</li>' : ''}
                        </ul>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h3>✅ Concluídas (${concluidas.length})</h3></div>
                    <div class="card-body">
                        <ul class="item-list">
                            ${concluidas.slice(0, 10).map(t => `
                                <li>
                                    <div>
                                        <strong>${this.esc(t.titulo)}</strong>
                                        <small>${this.esc(t.materia)}</small>
                                    </div>
                                    <div style="display:flex; gap:8px;">
                                        <i class="fas fa-check" style="color: var(--accent-success);"></i>
                                        <button class="btn-icon btn-editar-tarefa" data-id="${this.esc(t.id)}" title="Editar tarefa">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-icon btn-excluir-tarefa" data-id="${this.esc(t.id)}" title="Excluir tarefa" style="color: var(--accent-danger);">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </li>
                            `).join('')}
                            ${!concluidas.length ? '<li>Nenhuma tarefa concluída</li>' : ''}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    renderProvas() {
        const agora = toDateOnly(new Date());

        const proximas = this.app.data.exams
            .filter(e => toDateOnly(e.data) >= agora && !e.concluida)
            .sort((a, b) => new Date(a.data) - new Date(b.data));

        const passadas = this.app.data.exams
            .filter(e => toDateOnly(e.data) < agora || e.concluida)
            .sort((a, b) => new Date(b.data) - new Date(a.data))
            .slice(0, 10);

        return `
            <div class="view-header">
                <h2><i class="fas fa-graduation-cap"></i> Provas e Trabalhos</h2>
                <button class="btn-primary" id="btn-nova-prova"><i class="fas fa-plus"></i> Novo Evento</button>
            </div>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header"><h3>📅 Próximos (${proximas.length})</h3></div>
                    <div class="card-body">
                        <ul class="item-list">
                            ${proximas.map(e => `
                                <li>
                                    <div>
                                        <strong>${this.esc(e.titulo)}</strong>
                                        <small>${this.esc(e.materia)} • ${this.esc(e.tipo)} • ${formatarData(e.data)}</small>
                                    </div>
                                    <div style="display:flex; gap:8px;">
                                        <span class="tag ${this.app.getExamRiskClass(e)}">${diasAte(e.data)} dias</span>
                                        <button class="btn-icon btn-editar-prova" data-id="${this.esc(e.id)}" title="Editar evento">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-icon btn-excluir-prova" data-id="${this.esc(e.id)}" title="Excluir evento" style="color: var(--accent-danger);">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </li>
                            `).join('')}
                            ${!proximas.length ? '<li>Nenhum evento próximo</li>' : ''}
                        </ul>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h3>📜 Eventos Passados</h3></div>
                    <div class="card-body">
                        <ul class="item-list">
                            ${passadas.map(e => `
                                <li>
                                    <div>
                                        <strong>${this.esc(e.titulo)}</strong>
                                        <small>${this.esc(e.materia)} • ${formatarData(e.data)}</small>
                                    </div>
                                    <div style="display:flex; gap:8px;">
                                        <span class="tag success">Concluído</span>
                                        <button class="btn-icon btn-editar-prova" data-id="${this.esc(e.id)}" title="Editar evento">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-icon btn-excluir-prova" data-id="${this.esc(e.id)}" title="Excluir evento" style="color: var(--accent-danger);">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </li>
                            `).join('')}
                            ${!passadas.length ? '<li>Nenhum evento passado</li>' : ''}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    renderMapaAprendizado() {
        return `
            <div class="view-header">
                <h2><i class="fas fa-map"></i> Mapa de Aprendizado</h2>
                <button class="btn-primary" id="btn-novo-topico"><i class="fas fa-plus"></i> Novo Tópico</button>
            </div>

            <div class="mapa-grid">
                ${this.app.data.subjects.map(s => {
                    const topicos = this.app.data.learningMap.filter(t => t.materia === s.nome);
                    return `
                        <div class="card materia-map">
                            <div class="card-header">
                                <h3>${this.esc(s.nome)}</h3>
                                <span class="badge">${topicos.length} tópicos</span>
                            </div>
                            <div class="card-body">
                                ${topicos.map(t => `
                                    <div class="topico-item">
                                        <div class="topico-info">
                                            <strong>${this.esc(t.nome)}</strong>
                                            <span class="tag ${this.esc(t.status)}">${this.esc(t.status)}</span>
                                        </div>
                                        <div class="topico-meta">
                                            <span>📊 ${this.esc(t.dificuldade)}/5</span>
                                            <span>🎯 ${this.esc(t.confianca)}/5</span>
                                            <span>🔄 ${t.ultimaRevisao ? diasDesde(t.ultimaRevisao) : 0}d</span>
                                        </div>
                                        <div style="margin-top:10px; display:flex; justify-content:flex-end; gap:8px;">
                                            <button class="btn-icon btn-editar-topico" data-id="${this.esc(t.id)}" title="Editar tópico">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn-icon btn-excluir-topico" data-id="${this.esc(t.id)}" title="Excluir tópico" style="color: var(--accent-danger);">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                                ${!topicos.length ? '<p class="text-secondary">Nenhum tópico cadastrado</p>' : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderMateriais() {
        return `
            <div class="view-header">
                <h2><i class="fas fa-folder"></i> Materiais de Estudo</h2>
                <button class="btn-primary" id="btn-novo-material"><i class="fas fa-plus"></i> Novo Material</button>
            </div>

            <div class="materiais-grid">
                ${this.app.data.subjects.map(s => {
                    const materiais = this.app.data.materials.filter(m => m.materia === s.nome);
                    return `
                        <div class="card">
                            <div class="card-header">
                                <h3>${this.esc(s.nome)}</h3>
                                <span>${materiais.length} itens</span>
                            </div>
                            <div class="card-body">
                                <ul class="item-list">
                                    ${materiais.map(m => {
                                        const isExternal = ['link', 'pdf', 'video'].includes(m.tipo);
                                        const contentPreview = m.tipo === 'anotacao'
                                            ? `<small>${this.esc(String(m.conteudo || '').slice(0, 80))}${String(m.conteudo || '').length > 80 ? '...' : ''}</small>`
                                            : `<small>${this.esc(m.tipo)}</small>`;

                                        return `
                                            <li>
                                                <div style="display:flex; align-items:center; gap:8px;">
                                                    <i class="fas ${this.getMaterialIcon(m.tipo)}"></i>
                                                    <div>
                                                        <strong>${this.esc(m.titulo)}</strong><br>
                                                        ${contentPreview}
                                                    </div>
                                                </div>
                                                <div style="display:flex; gap:8px;">
                                                    ${isExternal ? `
                                                        <a href="${this.esc(m.conteudo)}" target="_blank" rel="noopener noreferrer" class="btn-icon" title="Abrir material">
                                                            <i class="fas fa-external-link-alt"></i>
                                                        </a>
                                                    ` : ''}
                                                    <button class="btn-icon btn-editar-material" data-id="${this.esc(m.id)}" title="Editar material">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn-icon btn-excluir-material" data-id="${this.esc(m.id)}" title="Excluir material" style="color: var(--accent-danger);">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </li>
                                        `;
                                    }).join('')}
                                    ${!materiais.length ? '<li>Nenhum material cadastrado</li>' : ''}
                                </ul>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderCalendario() {
        const hoje = new Date();
        const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        const diasNoMes = ultimoDia.getDate();
        const primeiroDiaSemana = primeiroDia.getDay();

        const dias = [];
        for (let i = 0; i < primeiroDiaSemana; i++) dias.push(null);
        for (let i = 1; i <= diasNoMes; i++) dias.push(i);

        const eventos = [
            ...this.app.data.sessions.map(s => ({ ...s, tipo: 'sessao', data: s.data, label: s.topico || s.materia })),
            ...this.app.data.tasks.map(t => ({ ...t, tipo: 'tarefa', data: t.dataLimite, label: t.titulo })),
            ...this.app.data.exams.map(e => ({ ...e, tipo: 'exame', data: e.data, label: e.titulo }))
        ];

        return `
            <h2><i class="fas fa-calendar"></i> Calendário</h2>

            <div class="card">
                <div class="card-header">
                    <h3>${hoje.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                </div>
                <div class="card-body">
                    <div class="calendar-grid">
                        <div class="calendar-weekdays">
                            <div>Dom</div><div>Seg</div><div>Ter</div><div>Qua</div><div>Qui</div><div>Sex</div><div>Sáb</div>
                        </div>
                        <div class="calendar-days">
                            ${dias.map(d => {
                                if (!d) return '<div class="calendar-day empty"></div>';

                                const eventosDia = eventos.filter(e => {
                                    const data = new Date(e.data);
                                    return data.getDate() === d &&
                                        data.getMonth() === hoje.getMonth() &&
                                        data.getFullYear() === hoje.getFullYear();
                                });

                                return `
                                    <div class="calendar-day ${eventosDia.length ? 'has-events' : ''}">
                                        <span class="day-number">${d}</span>
                                        ${eventosDia.length ? `
                                            <div class="day-events">
                                                ${eventosDia.slice(0, 3).map(e => `
                                                    <div class="event-indicator" title="${this.esc(e.label)}">
                                                        <i class="fas ${this.getEventIcon(e.tipo)}"></i>
                                                    </div>
                                                `).join('')}
                                                ${eventosDia.length > 3 ? `<span class="more-events">+${eventosDia.length - 3}</span>` : ''}
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPrevisaoNotas() {
        return `
            <div class="view-header">
                <h2><i class="fas fa-chart-line"></i> Previsão de Notas</h2>
                <button class="btn-primary" id="btn-registrar-nota"><i class="fas fa-plus"></i> Registrar Nota</button>
            </div>

            <div class="dashboard-grid">
                ${this.app.data.subjects.map(s => {
                    const notas = this.app.data.grades.filter(g => g.materia === s.nome);
                    const media = this.app.calcularMedia(notas);
                    const previsao = this.app.calcularPrevisaoNota(s, notas);

                    return `
                        <div class="card subject-grade-card">
                            <div class="card-header">
                                <h3>${this.esc(s.nome)}</h3>
                                <span class="risk-indicator risk-${this.esc(previsao.risco)}">${this.esc(previsao.risco)}</span>
                            </div>
                            <div class="card-body">
                                <div class="grade-stats">
                                    <div class="grade-item">
                                        <span class="grade-label">Média atual</span>
                                        <span class="grade-value">${media.toFixed(1)}</span>
                                    </div>
                                    <div class="grade-item">
                                        <span class="grade-label">Nota desejada</span>
                                        <span class="grade-value">${this.esc(s.notaDesejada)}</span>
                                    </div>
                                    <div class="grade-item">
                                        <span class="grade-label">Necessário</span>
                                        <span class="grade-value">${this.esc(previsao.notaNecessaria)}</span>
                                    </div>
                                </div>
                                <div class="progress-container">
                                    <div class="progress-label">
                                        <span>Chance de aprovação</span>
                                        <span>${previsao.chance}%</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${previsao.chance}%"></div>
                                    </div>
                                </div>
                                <p class="previsao-motivo">💡 ${this.esc(previsao.motivo)}</p>
                                
                                <div style="margin-top:16px;">
                                    <h4>Notas Registradas</h4>
                                    <ul class="item-list">
                                        ${notas.map(n => `
                                            <li>
                                                <div>
                                                    <strong>${this.esc(n.avaliacao)}</strong>
                                                    <small>Nota: ${this.esc(n.valor)} • Peso: ${this.esc(n.peso)}%</small>
                                                </div>
                                                <div style="display:flex; gap:8px;">
                                                    <button class="btn-icon btn-editar-nota" data-id="${this.esc(n.id)}" title="Editar nota">
                                                        <i class="fas fa-edit"></i>
                                                    </button>
                                                    <button class="btn-icon btn-excluir-nota" data-id="${this.esc(n.id)}" title="Excluir nota" style="color: var(--accent-danger);">
                                                        <i class="fas fa-trash"></i>
                                                    </button>
                                                </div>
                                            </li>
                                        `).join('')}
                                        ${!notas.length ? '<li>Nenhuma nota registrada</li>' : ''}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderHabitos() {
        const habitos = [
            { id: 'estudar', nome: 'Estudar', icone: 'fa-book' },
            { id: 'revisar', nome: 'Revisar conteúdo', icone: 'fa-sync-alt' },
            { id: 'dormir', nome: 'Dormir bem', icone: 'fa-bed' },
            { id: 'aula', nome: 'Ir para aula', icone: 'fa-university' },
            { id: 'exercicio', nome: 'Fazer exercícios', icone: 'fa-dumbbell' },
            { id: 'agua', nome: 'Beber água', icone: 'fa-tint' },
            { id: 'anotacoes', nome: 'Ler anotações', icone: 'fa-sticky-note' }
        ];

        const hoje = toDateString();

        return `
            <h2><i class="fas fa-heart"></i> Hábitos e Rotina</h2>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header">
                        <h3>📋 Hábitos Diários</h3>
                    </div>
                    <div class="card-body">
                        <div class="habitos-list">
                            ${habitos.map(h => {
                                const feito = this.app.data.habits.some(hb => hb.id === h.id && toDateString(hb.data) === hoje);
                                return `
                                    <div class="habito-item">
                                        <div class="habito-info">
                                            <i class="fas ${h.icone}"></i>
                                            <span>${this.esc(h.nome)}</span>
                                        </div>
                                        <button class="btn-icon toggle-habito ${feito ? 'active' : ''}" data-habito="${this.esc(h.id)}">
                                            <i class="fas ${feito ? 'fa-check-circle' : 'fa-circle'}"></i>
                                        </button>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>📊 Consistência Semanal</h3>
                    </div>
                    <div class="card-body">
                        <div class="consistency-chart">
                            ${this.renderConsistencyChart()}
                        </div>
                        <div class="consistency-stats">
                            <div class="stat-item">
                                <span class="stat-value">${this.app.calcularConsistencia()}%</span>
                                <span class="stat-label">esta semana</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-value">${this.esc(this.app.data.user?.streak || 0)}</span>
                                <span class="stat-label">dias seguidos</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderEstatisticas() {
        const horasPorMateria = this.app.calcularHorasPorMateria();
        const horasPorTipo = this.app.calcularHorasPorTipo();
        const total = this.app.data.sessions.filter(s => s.concluida)
            .reduce((a, s) => a + s.duracao / 60, 0);

        const maxHorasMateria = horasPorMateria.length ? Math.max(...horasPorMateria.map(h => h.horas)) : 1;
        const maxHorasTipo = horasPorTipo.length ? Math.max(...horasPorTipo.map(t => t.horas)) : 1;

        return `
            <h2><i class="fas fa-chart-bar"></i> Estatísticas</h2>

            <div class="dashboard-grid">
                <div class="card">
                    <div class="card-header"><h3>⏱️ Total Estudado</h3></div>
                    <div class="card-body text-center">
                        <div class="big-number">${total.toFixed(1)}</div>
                        <p>horas no total</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h3>📊 Média Diária</h3></div>
                    <div class="card-body text-center">
                        <div class="big-number">${this.app.calcularMediaDiaria()}</div>
                        <p>horas por dia</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h3>🔥 Melhor Dia</h3></div>
                    <div class="card-body text-center">
                        <div class="big-number">${this.esc(this.app.calcularMelhorDia())}</div>
                        <p>${this.app.calcularMelhorDiaHoras()}h</p>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header"><h3>✅ Tarefas</h3></div>
                    <div class="card-body text-center">
                        <div class="big-number">${this.app.calcularTaxaConclusaoTarefas()}%</div>
                        <p>concluídas</p>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3>📚 Horas por Matéria</h3></div>
                <div class="card-body">
                    ${horasPorMateria.map(item => `
                        <div class="stat-row">
                            <div class="stat-label">${this.esc(item.materia)}</div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(item.horas / maxHorasMateria) * 100}%"></div>
                            </div>
                            <div class="stat-value">${item.horas.toFixed(1)}h</div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3>📖 Tipos de Estudo</h3></div>
                <div class="card-body">
                    <div class="tipos-grid">
                        ${horasPorTipo.map(t => `
                            <div class="tipo-item">
                                <div class="tipo-header">
                                    <span>${this.esc(t.tipo)}</span>
                                    <span>${t.horas.toFixed(1)}h</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${(t.horas / maxHorasTipo) * 100}%"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderModoFoco() {
        return `
            <h2><i class="fas fa-clock"></i> Modo Foco</h2>

            <div class="card timer-card">
                <div class="card-body text-center">
                    <div class="timer-display" id="timer-display">25:00</div>

                    <div class="timer-settings">
                        <select id="timer-duracao" class="timer-select">
                            <option value="25">Pomodoro (25 min)</option>
                            <option value="50">Estudo longo (50 min)</option>
                            <option value="90">Bloco pesado (90 min)</option>
                            <option value="15">Pausa curta (15 min)</option>
                        </select>
                    </div>

                    <div class="timer-controls">
                        <button class="timer-btn start" id="timer-start">
                            <i class="fas fa-play"></i> Iniciar
                        </button>
                        <button class="timer-btn pause" id="timer-pause" style="display: none;">
                            <i class="fas fa-pause"></i> Pausar
                        </button>
                        <button class="timer-btn reset" id="timer-reset">
                            <i class="fas fa-undo"></i> Reset
                        </button>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3>📊 Sessões de Foco Hoje</h3>
                </div>
                <div class="card-body">
                    <ul class="item-list" id="sessoes-foco-hoje">
                        ${this.renderSessoesFocoHoje()}
                    </ul>
                </div>
            </div>
        `;
    }

    renderConfiguracoes() {
        return `
            <h2><i class="fas fa-cog"></i> Configurações</h2>

            <div class="card">
                <div class="card-header"><h3>⚙️ Preferências</h3></div>
                <div class="card-body">
                    <div class="config-item">
                        <div class="config-info">
                            <h4>Notificações</h4>
                            <p>Receber alertas e lembretes</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" ${this.app.data.settings.notifications ? 'checked' : ''} id="config-notificacoes">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="config-item">
                        <div class="config-info">
                            <h4>Planejamento automático</h4>
                            <p>Gerar recomendações automaticamente</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" ${this.app.data.settings.autoPlan ? 'checked' : ''} id="config-auto-plan">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>

                    <div class="config-item">
                        <div class="config-info">
                            <h4>Modo Faculdade Pesada</h4>
                            <p>Priorizar matérias difíceis e aumentar alertas</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" ${this.app.data.settings.heavyMode ? 'checked' : ''} id="config-heavy-mode">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3>📊 Gerenciar Dados</h3></div>
                <div class="card-body">
                    <button class="btn-secondary" id="exportar-dados">
                        <i class="fas fa-download"></i> Exportar dados
                    </button>
                    <button class="btn-danger" id="limpar-dados">
                        <i class="fas fa-trash"></i> Limpar todos os dados
                    </button>
                </div>
            </div>

            <div class="card">
                <div class="card-header"><h3>ℹ️ Sobre</h3></div>
                <div class="card-body">
                    <p><strong>Study Life Control</strong></p>
                    <p>Versão: 3.0.0</p>
                    <p>Sistema inteligente para estudantes universitários</p>
                    <p>Conectado como: ${this.esc(auth.currentUser?.email || 'Não conectado')}</p>
                </div>
            </div>
        `;
    }

    renderMaterias() {
        return `
            <div class="view-header">
                <h2><i class="fas fa-book"></i> Matérias</h2>
                <button class="btn-primary" id="btn-nova-materia"><i class="fas fa-plus"></i> Nova Matéria</button>
            </div>

            <div class="dashboard-grid">
                ${this.app.data.subjects.map(s => {
                    const totalSessoes = this.app.data.sessions.filter(ses => ses.materia === s.nome).length;
                    const totalTarefas = this.app.data.tasks.filter(t => t.materia === s.nome && !t.concluida).length;
                    const totalProvas = this.app.data.exams.filter(e => e.materia === s.nome && new Date(e.data) >= new Date()).length;

                    return `
                        <div class="card subject-card">
                            <div class="card-header">
                                <h3>${this.esc(s.nome)}</h3>
                                <span class="badge" style="background: ${this.getDificuldadeColor(s.dificuldade)};">Dificuldade ${this.esc(s.dificuldade)}/5</span>
                            </div>
                            <div class="card-body">
                                <div class="subject-stats">
                                    <div><i class="fas fa-clock"></i> ${totalSessoes} sessões</div>
                                    <div><i class="fas fa-tasks"></i> ${totalTarefas} tarefas</div>
                                    <div><i class="fas fa-graduation-cap"></i> ${totalProvas} provas</div>
                                </div>
                                <div class="subject-actions" style="display:flex; gap:8px; margin-top:16px;">
                                    <button class="btn-secondary btn-editar-materia" data-id="${this.esc(s.id)}" style="flex:1;">
                                        <i class="fas fa-edit"></i> Editar
                                    </button>
                                    <button class="btn-danger btn-excluir-materia" data-id="${this.esc(s.id)}" style="flex:1;">
                                        <i class="fas fa-trash"></i> Excluir
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderAlert(alert) {
        const icon = alert.type === 'warning'
            ? 'fa-exclamation-triangle'
            : alert.type === 'danger'
                ? 'fa-exclamation-circle'
                : 'fa-info-circle';

        return `
            <div class="alert-card ${this.esc(alert.type)}">
                <i class="fas ${icon}"></i>
                <div class="alert-content">
                    <div class="alert-title">${this.esc(alert.title)}</div>
                    <div class="alert-description">${this.esc(alert.message)}</div>
                </div>
            </div>
        `;
    }

    renderConsistencyChart() {
        const hoje = new Date();
        const inicio = new Date(hoje);
        inicio.setDate(hoje.getDate() - hoje.getDay());

        let html = '<div class="chart-bars">';

        for (let i = 0; i < 7; i++) {
            const data = new Date(inicio);
            data.setDate(inicio.getDate() + i);

            const temEstudo = this.app.data.sessions.some(s =>
                new Date(s.data).toDateString() === data.toDateString() && s.concluida
            );

            const intensidade = temEstudo ? 100 : 20;

            html += `
                <div class="chart-bar-container" title="${temEstudo ? 'Estudou' : 'Não estudou'}">
                    <div class="chart-bar" style="height: ${intensidade}px"></div>
                    <span class="chart-label">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][i]}</span>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    renderSessoesFocoHoje() {
        const hoje = toDateString();
        const sessoes = this.app.data.sessions.filter(s =>
            toDateString(s.data) === hoje && s.concluida && s.tipo === 'foco'
        );

        if (!sessoes.length) {
            return '<li>Nenhuma sessão de foco concluída hoje</li>';
        }

        return sessoes.map(s => `
            <li>
                <span>${this.esc(s.materia)}</span>
                <span>${this.esc(s.duracao)} min</span>
            </li>
        `).join('');
    }

    getProximaAulaDateTime(aula) {
        const hoje = new Date();
        const diaSemana = hoje.getDay();
        const dataAula = new Date(hoje);

        if (parseInt(aula.dia, 10) > diaSemana) {
            dataAula.setDate(hoje.getDate() + (parseInt(aula.dia, 10) - diaSemana));
        } else if (parseInt(aula.dia, 10) < diaSemana) {
            dataAula.setDate(hoje.getDate() + (7 - diaSemana + parseInt(aula.dia, 10)));
        } else {
            const [h, m] = aula.inicio.split(':');
            const horaAula = new Date(hoje);
            horaAula.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

            if (horaAula < hoje) {
                dataAula.setDate(hoje.getDate() + 7);
            }
        }

        const [h, m] = aula.inicio.split(':');
        dataAula.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);

        return dataAula.toISOString();
    }

    getMaterialIcon(tipo) {
        const icons = {
            link: 'fa-link',
            pdf: 'fa-file-pdf',
            video: 'fa-video',
            anotacao: 'fa-sticky-note'
        };
        return icons[tipo] || 'fa-file';
    }

    getEventIcon(tipo) {
        const icons = {
            sessao: 'fa-clock',
            tarefa: 'fa-tasks',
            exame: 'fa-graduation-cap'
        };
        return icons[tipo] || 'fa-calendar';
    }

    getDificuldadeColor(dificuldade) {
        const cores = {
            1: '#10b981',
            2: '#34d399',
            3: '#f59e0b',
            4: '#f97316',
            5: '#ef4444'
        };
        return cores[dificuldade] || '#3b82f6';
    }

    getResumoHorasEstudo() {
        const hoje = toDateString();
        const inicioSemana = new Date();
        inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());

        const sessoesConcluidas = this.app.data.sessions.filter(s => s.concluida);

        const horasHoje = sessoesConcluidas
            .filter(s => toDateString(s.data) === hoje)
            .reduce((acc, s) => acc + s.duracao, 0) / 60;

        const horasSemana = sessoesConcluidas
            .filter(s => new Date(s.data) >= inicioSemana)
            .reduce((acc, s) => acc + s.duracao, 0) / 60;

        const horasTotal = sessoesConcluidas
            .reduce((acc, s) => acc + s.duracao, 0) / 60;

        return {
            hoje: horasHoje,
            semana: horasSemana,
            total: horasTotal
        };
    }

    getMateriasAtrasadas() {
        return this.app.data.subjects.map(subject => {
            const ultimaSessao = this.app.data.sessions
                .filter(s => s.materia === subject.nome && s.concluida)
                .sort((a, b) => new Date(b.data) - new Date(a.data))[0];

            if (!ultimaSessao) {
                return {
                    materia: subject.nome,
                    dias: null,
                    nuncaEstudou: true
                };
            }

            return {
                materia: subject.nome,
                dias: diasDesde(ultimaSessao.data),
                nuncaEstudou: false
            };
        })
        .filter(item => item.nuncaEstudou || item.dias >= 5)
        .sort((a, b) => {
            if (a.nuncaEstudou && !b.nuncaEstudou) return -1;
            if (!a.nuncaEstudou && b.nuncaEstudou) return 1;
            return (b.dias || 0) - (a.dias || 0);
        })
        .slice(0, 5);
    }

    getResumoSemana() {
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const hoje = new Date();
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());

        return diasSemana.map((nome, index) => {
            const data = new Date(inicioSemana);
            data.setDate(inicioSemana.getDate() + index);

            const horas = this.app.data.sessions
                .filter(s => s.concluida && new Date(s.data).toDateString() === data.toDateString())
                .reduce((acc, s) => acc + s.duracao, 0) / 60;

            const aulas = (window.scheduleManager?.getAulasPorDia(index) || []).length;

            return { nome, horas, aulas };
        });
    }

    calcularHorasAulaSemana(aulas) {
        return aulas.reduce((total, aula) => total + (calcularDuracaoMinutos(aula.inicio, aula.fim) / 60), 0);
    }
}

window.ViewRenderer = ViewRenderer;