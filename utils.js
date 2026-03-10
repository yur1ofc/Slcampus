// Utilitários gerais

// Gerar ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Calcular dias até uma data
function diasAte(data) {
    const diff = new Date(data) - new Date();
    return Math.ceil(diff / 86400000);
}

// Calcular dias desde uma data
function diasDesde(data) {
    const diff = new Date() - new Date(data);
    return Math.floor(diff / 86400000);
}

// Formatar data
function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

// Formatar hora
function formatarHora(data) {
    return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Calcular tempo restante para próximo evento
function tempoRestante(data) {
    const agora = new Date();
    const evento = new Date(data);
    const diff = evento - agora;
    
    if (diff < 0) return "Passado";
    
    const horas = Math.floor(diff / 3600000);
    const minutos = Math.floor((diff % 3600000) / 60000);
    
    if (horas > 24) {
        const dias = Math.floor(horas / 24);
        return `${dias} dia${dias > 1 ? 's' : ''}`;
    }
    if (horas > 0) return `${horas}h ${minutos}min`;
    if (minutos > 0) return `${minutos}min`;
    return "Agora";
}

// Verificar se está no horário de uma aula
function estaNoHorarioAula(aula) {
    const agora = new Date();
    const diaSemana = agora.getDay();
    
    if (parseInt(aula.dia) !== diaSemana) return false;
    
    const [horaInicio, minInicio] = aula.inicio.split(':');
    const [horaFim, minFim] = aula.fim.split(':');
    
    const inicio = new Date(agora);
    inicio.setHours(parseInt(horaInicio), parseInt(minInicio), 0);
    
    const fim = new Date(agora);
    fim.setHours(parseInt(horaFim), parseInt(minFim), 0);
    
    return agora >= inicio && agora <= fim;
}

// Mostrar toast
function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container') || (() => {
        const d = document.createElement('div');
        d.id = 'toast-container';
        document.body.appendChild(d);
        return d;
    })();
    
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i><span>${msg}</span>`;
    container.appendChild(t);
    
    setTimeout(() => t.classList.add('show'), 100);
    setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 300);
    }, 3000);
}

// Mostrar loading
function showLoading() {
    document.getElementById('loading-screen').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loading-screen').style.display = 'none';
}

// Atualizar status de sincronização
function updateSyncStatus(success) {
    const status = document.getElementById('sync-status');
    if (success) {
        status.innerHTML = '<i class="fas fa-check-circle" style="color: var(--success);"></i>';
        setTimeout(() => {
            status.innerHTML = '<i class="fas fa-sync-alt"></i>';
        }, 2000);
    } else {
        status.innerHTML = '<i class="fas fa-exclamation-circle" style="color: var(--danger);"></i>';
    }
}

// Exportar funções globais
window.utils = {
    generateId,
    diasAte,
    diasDesde,
    formatarData,
    formatarHora,
    tempoRestante,
    estaNoHorarioAula,
    showToast,
    showLoading,
    hideLoading,
    updateSyncStatus
};