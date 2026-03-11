// schedule.js - Gerenciamento de Grade Horária com Posicionamento Preciso

class ScheduleManager {
    constructor() {
        this.aulas = [];
        this.HORARIO_INICIO = 7;
        this.HORARIO_FIM = 22;
        this.ALTURA_POR_HORA = 80;
    }

    // Carregar aulas do app
    loadAulas() {
        this.aulas = window.app?.data?.classSchedule || [];
    }

    // Adicionar aula
    async addAula(aula) {
        if (!aula.id) aula.id = generateId();
        const success = await dbService.addItem('classSchedule', aula);
        if (success) {
            this.loadAulas();
        }
        return success;
    }

    async removeAula(id) {
        const success = await dbService.removeItem('classSchedule', id);
        if (success) {
            this.loadAulas();
        }
        return success;
    }

    async updateAula(id, updates) {
        const success = await dbService.updateItem('classSchedule', id, updates);
        if (success) {
            this.loadAulas();
        }
        return success;
    }

    // Obter aulas de um dia específico
    getAulasPorDia(diaSemana) {
        return this.aulas.filter(a => parseInt(a.dia) === diaSemana)
            .sort((a, b) => a.inicio.localeCompare(b.inicio));
    }

    // Calcular posição top em pixels baseada no horário
    calcularPosicaoTop(horario) {
        const [horas, minutos] = horario.split(':').map(Number);
        const minutosDesdeInicio = (horas - this.HORARIO_INICIO) * 60 + minutos;
        return Math.max(0, (minutosDesdeInicio / 60) * this.ALTURA_POR_HORA);
    }

    // Calcular altura em pixels baseada na duração
    calcularAltura(inicio, fim) {
        const duracaoMinutos = calcularDuracaoMinutos(inicio, fim);
        return Math.max(20, (duracaoMinutos / 60) * this.ALTURA_POR_HORA);
    }

    // Renderizar grade vertical para um dia específico
    renderGradeDia(diaSemana, containerId) {
    this.loadAulas();
    const aulas = this.getAulasPorDia(diaSemana);
    const container = document.getElementById(containerId);
    if (!container) return;

    // Limpar container
    container.innerHTML = '';
    
    // Calcular altura total da grade
    const totalHoras = this.HORARIO_FIM - this.HORARIO_INICIO + 1;
    const alturaTotal = totalHoras * this.ALTURA_POR_HORA;
    
    // Criar container principal da grade
    const scheduleDiv = document.createElement('div');
    scheduleDiv.className = 'schedule-vertical';
    scheduleDiv.style.height = `${alturaTotal}px`;
    scheduleDiv.style.position = 'relative';
    
    // Criar linhas de hora
    for (let hora = this.HORARIO_INICIO; hora <= this.HORARIO_FIM; hora++) {
        const horaFormatada = hora.toString().padStart(2, '0') + ':00';
        const hourRow = document.createElement('div');
        hourRow.className = 'schedule-hour-row';
        hourRow.style.height = `${this.ALTURA_POR_HORA}px`;
        
        hourRow.innerHTML = `
            <div class="hour-label">${horaFormatada}</div>
            <div class="hour-line"></div>
        `;
        scheduleDiv.appendChild(hourRow);
    }
    
    container.appendChild(scheduleDiv);
    
    // Container para eventos (dentro do scheduleDiv, posicionado absolutamente)
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'schedule-events';
    eventsContainer.style.position = 'absolute';
    eventsContainer.style.top = '0';
    eventsContainer.style.left = '60px';
    eventsContainer.style.right = '0';
    eventsContainer.style.height = `${alturaTotal}px`;
    eventsContainer.style.pointerEvents = 'none';
    
    // Adicionar eventos (aulas)
    aulas.forEach(aula => {
        const top = this.calcularPosicaoTop(aula.inicio);
        const altura = this.calcularAltura(aula.inicio, aula.fim);
        
        // Buscar cor da matéria ou usar padrão
        const materia = window.app?.data?.subjects?.find(s => s.nome === aula.materia);
        const cor = materia?.cor || aula.cor || '#3b82f6';
        
        const eventBlock = document.createElement('div');
        eventBlock.className = 'schedule-event-block';
        eventBlock.style.position = 'absolute';
        eventBlock.style.top = `${top}px`;
        eventBlock.style.height = `${altura}px`;
        eventBlock.style.left = '4px';
        eventBlock.style.right = '4px';
        eventBlock.style.backgroundColor = `${cor}20`;
        eventBlock.style.borderLeft = `4px solid ${cor}`;
        eventBlock.style.pointerEvents = 'auto';
        eventBlock.setAttribute('data-aula-id', aula.id);
        
        eventBlock.innerHTML = `
            <div class="event-content">
                <strong>${aula.materia}</strong>
                <div class="event-time">${aula.inicio} - ${aula.fim}</div>
                ${aula.sala ? `<div class="event-room">Sala: ${aula.sala}</div>` : ''}
                ${aula.professor ? `<div class="event-prof">Prof: ${aula.professor}</div>` : ''}
            </div>
        `;
        
        eventBlock.onclick = () => {
            if (window.app) window.app.openAulaModal(aula.id);
        };
        
        eventsContainer.appendChild(eventBlock);
    });
    
    scheduleDiv.appendChild(eventsContainer);
}
    // Renderizar grade semanal (versão simplificada)
    renderGrade() {
        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        let html = '<div class="weekly-schedule" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px;">';
        
        dias.forEach((dia, index) => {
            html += `<div class="weekly-day-column" data-dia="${index}" style="background: var(--bg-tertiary); border-radius: 12px; padding: 12px;">`;
            html += `<h4 style="text-align: center; margin-bottom: 12px; color: var(--accent-primary);">${dia}</h4>`;
            html += `<div class="weekly-events" id="weekly-events-${index}" style="display: flex; flex-direction: column; gap: 8px;"></div>`;
            html += '</div>';
        });
        
        html += '</div>';
        return html;
    }

    // Popular grade semanal
    populateWeeklySchedule() {
        for (let dia = 0; dia < 7; dia++) {
            const container = document.getElementById(`weekly-events-${dia}`);
            if (!container) continue;

            const aulas = this.getAulasPorDia(dia);
            container.innerHTML = '';

            aulas.forEach(aula => {
                const materia = window.app?.data?.subjects?.find(s => s.nome === aula.materia);
                const cor = materia?.cor || aula.cor || '#3b82f6';
                
                const evento = document.createElement('div');
                evento.className = 'weekly-event';
                evento.style.cssText = `background: var(--bg-secondary); border-left: 4px solid ${cor}; border-radius: 6px; padding: 8px; font-size: 12px; cursor: pointer;`;
                evento.innerHTML = `
                    <strong>${aula.materia}</strong>
                    <div>${aula.inicio} - ${aula.fim}</div>
                    ${aula.sala ? `<small>${aula.sala}</small>` : ''}
                `;
                evento.onclick = () => {
                    if (window.app) window.app.openAulaModal(aula.id);
                };
                container.appendChild(evento);
            });
        }
    }

    // Verificar conflitos de horário
    verificarConflito(novaAula) {
        const aulasMesmoDia = this.getAulasPorDia(parseInt(novaAula.dia));
        const novoInicio = calcularDuracaoMinutos('00:00', novaAula.inicio);
        const novoFim = calcularDuracaoMinutos('00:00', novaAula.fim);

        return aulasMesmoDia.some(aula => {
            if (aula.id === novaAula.id) return false;
            const aulaInicio = calcularDuracaoMinutos('00:00', aula.inicio);
            const aulaFim = calcularDuracaoMinutos('00:00', aula.fim);
            return (novoInicio < aulaFim && novoFim > aulaInicio);
        });
    }

    // Obter próxima aula
    getProximaAula() {
        const hoje = new Date();
        const diaSemana = hoje.getDay();
        const minutosAtuais = hoje.getHours() * 60 + hoje.getMinutes();
        
        const aulasHoje = this.getAulasPorDia(diaSemana);
        
        const proximaHoje = aulasHoje.find(a => {
            const minutosInicio = calcularDuracaoMinutos('00:00', a.inicio);
            return minutosInicio > minutosAtuais;
        });
        
        if (proximaHoje) return proximaHoje;
        
        for (let i = 1; i <= 7; i++) {
            const proximoDia = (diaSemana + i) % 7;
            const aulasProximoDia = this.getAulasPorDia(proximoDia);
            if (aulasProximoDia.length) {
                return aulasProximoDia[0];
            }
        }
        
        return null;
    }

    // Obter aula atual
    getAulaAtual() {
        const hoje = new Date();
        const diaSemana = hoje.getDay();
        const minutosAtuais = hoje.getHours() * 60 + hoje.getMinutes();
        
        return this.getAulasPorDia(diaSemana).find(a => {
            const minutosInicio = calcularDuracaoMinutos('00:00', a.inicio);
            const minutosFim = calcularDuracaoMinutos('00:00', a.fim);
            return minutosAtuais >= minutosInicio && minutosAtuais <= minutosFim;
        });
    }

    // Marcar presença em uma aula
    async marcarPresenca(aulaId, data, status) {
        const key = `${aulaId}_${data}`;
        const attendance = { ...(window.app?.data?.attendance || {}), [key]: status };
        const success = await dbService.saveData('attendance', attendance);
        
        if (success && status === 'absent') {
            const aula = this.aulas.find(a => a.id === aulaId);
            if (aula) {
                const tarefa = {
                    id: generateId(),
                    titulo: `Recuperar conteúdo da aula perdida - ${aula.materia}`,
                    materia: aula.materia,
                    prioridade: 'alta',
                    dataLimite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    estimativa: 60,
                    concluida: false,
                    automatica: true
                };
                await dbService.addItem('tasks', tarefa);
                showToast('Tarefa de recuperação criada automaticamente!');
            }
        }
        
        return success;
    }
}

window.scheduleManager = new ScheduleManager();