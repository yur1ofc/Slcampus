// schedule.js - Gerenciamento de Grade Horária com Posicionamento Preciso

class ScheduleManager {
    constructor() {
        this.aulas = [];
        this.HORARIO_INICIO = 7;
        this.HORARIO_FIM = 22;
        this.ALTURA_POR_HORA = 80;
        this.initialized = false;
    }

    // Inicializar com dados do app
    init() {
        if (window.app?.data?.classSchedule) {
            this.aulas = window.app.data.classSchedule;
            this.initialized = true;
            console.log('📚 ScheduleManager inicializado com', this.aulas.length, 'aulas');
        } else {
            console.warn('⏳ Aguardando dados do app...');
            setTimeout(() => this.init(), 100);
        }
    }

    // Carregar aulas do app
    loadAulas() {
        if (window.app?.data?.classSchedule) {
            this.aulas = window.app.data.classSchedule;
            console.log('📚 Aulas carregadas:', this.aulas.length);
        }
        return this.aulas;
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

    // Obter aulas de um dia específico
    getAulasPorDia(diaSemana) {
        this.loadAulas();
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
    
    // Container para eventos (CORRIGIDO: position absolute dentro do scheduleDiv)
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

    // Obter próxima aula
    getProximaAula() {
        this.loadAulas();
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
        this.loadAulas();
        const hoje = new Date();
        const diaSemana = hoje.getDay();
        const minutosAtuais = hoje.getHours() * 60 + hoje.getMinutes();
        
        return this.getAulasPorDia(diaSemana).find(a => {
            const minutosInicio = calcularDuracaoMinutos('00:00', a.inicio);
            const minutosFim = calcularDuracaoMinutos('00:00', a.fim);
            return minutosAtuais >= minutosInicio && minutosAtuais <= minutosFim;
        });
    }
}

// Criar instância global
window.scheduleManager = new ScheduleManager();

// Inicializar quando o app estiver pronto
if (window.app) {
    window.scheduleManager.init();
} else {
    document.addEventListener('app-ready', () => {
        window.scheduleManager.init();
    });
}