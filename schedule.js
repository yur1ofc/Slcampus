// Gerenciamento de Grade Horária

class ScheduleManager {
    constructor() {
        this.aulas = [];
    }

    // Adicionar aula
    async addAula(aula) {
        // Não gerar ID aqui - já vem do script.js
        const success = await dbService.addItem('classSchedule', aula);
        if (success) {
            this.aulas = [...window.app.data.classSchedule];
        }
        return success;
    }

    async removeAula(id) {
        this.aulas = this.aulas.filter(a => a.id !== id);
        const success = await dbService.saveData('classSchedule', this.aulas);
        if (success) {
            window.app.data.classSchedule = this.aulas;
        }
        return success;
    }

    // Obter aulas de hoje
    getAulasHoje() {
        const hoje = new Date().getDay();
        return this.aulas.filter(a => parseInt(a.dia) === hoje)
            .sort((a, b) => a.inicio.localeCompare(b.inicio));
    }

    // Obter próxima aula
    getProximaAula() {
        const hoje = new Date();
        const diaSemana = hoje.getDay();
        const agora = hoje.getHours() * 60 + hoje.getMinutes();
        
        const aulasHoje = this.getAulasHoje();
        
        // Próxima aula hoje
        const proximaHoje = aulasHoje.find(a => {
            const [h, m] = a.inicio.split(':');
            const inicio = parseInt(h) * 60 + parseInt(m);
            return inicio > agora;
        });
        
        if (proximaHoje) return proximaHoje;
        
        // Próxima aula em outro dia
        for (let i = 1; i <= 7; i++) {
            const proximoDia = (diaSemana + i) % 7;
            const aulasProximoDia = this.aulas.filter(a => parseInt(a.dia) === proximoDia);
            if (aulasProximoDia.length) {
                aulasProximoDia.sort((a, b) => a.inicio.localeCompare(b.inicio));
                return aulasProximoDia[0];
            }
        }
        
        return null;
    }

    // Verificar se está em horário de aula
    getAulaAtual() {
        const hoje = new Date();
        const diaSemana = hoje.getDay();
        const agora = hoje.getHours() * 60 + hoje.getMinutes();
        
        return this.aulas.find(a => {
            if (parseInt(a.dia) !== diaSemana) return false;
            
            const [hInicio, mInicio] = a.inicio.split(':');
            const [hFim, mFim] = a.fim.split(':');
            
            const inicio = parseInt(hInicio) * 60 + parseInt(mInicio);
            const fim = parseInt(hFim) * 60 + parseInt(mFim);
            
            return agora >= inicio && agora <= fim;
        });
    }

    // Renderizar grade semanal
    renderGrade() {
        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const horas = Array.from({ length: 14 }, (_, i) => i + 7); // 7h às 20h
        
        let html = '<div class="schedule-grid">';
        
        // Cabeçalho
        html += '<div class="schedule-header"><div class="time-column">Horário</div>';
        dias.forEach(dia => {
            html += `<div class="day-column">${dia}</div>`;
        });
        html += '</div>';
        
        // Linhas de horário
        horas.forEach(hora => {
            html += '<div class="schedule-row">';
            html += `<div class="time-cell">${hora}:00</div>`;
            
            dias.forEach((_, index) => {
                const aulasNesteHorario = this.aulas.filter(a => {
                    if (parseInt(a.dia) !== index) return false;
                    const [hInicio] = a.inicio.split(':');
                    return parseInt(hInicio) === hora;
                });
                
                html += '<div class="schedule-cell">';
                aulasNesteHorario.forEach(a => {
                    html += `<div class="schedule-event" style="background-color: ${a.cor || '#3b82f6'}20; border-left: 3px solid ${a.cor || '#3b82f6'}">
                        <strong>${a.materia}</strong><br>
                        <small>${a.sala || ''} ${a.professor ? `- ${a.professor}` : ''}</small>
                    </div>`;
                });
                html += '</div>';
            });
            
            html += '</div>';
        });
        
        html += '</div>';
        return html;
    }
}

window.scheduleManager = new ScheduleManager();