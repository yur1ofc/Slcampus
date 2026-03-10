// utils.js

// Gerar ID único
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Calcular dias até uma data
function diasAte(data) {
    const diff = new Date(data) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Calcular dias desde uma data
function diasDesde(data) {
    const diff = new Date() - new Date(data);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Formatar data
function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

// Formatar hora
function formatarHora(data) {
    return new Date(data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Formatar hora a partir de string "HH:MM"
function formatarHoraString(horaString) {
    return horaString;
}

// Calcular tempo restante para próximo evento
function tempoRestante(data) {
    const agora = new Date();
    const evento = new Date(data);
    const diff = evento - agora;
    
    if (diff < 0) return "Passado";
    
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (dias > 0) return `${dias} dia${dias > 1 ? 's' : ''}`;
    if (horas > 0) return `${horas}h ${minutos}min`;
    if (minutos > 0) return `${minutos}min`;
    return "Agora";
}

// Calcular duração em minutos entre dois horários "HH:MM"
function calcularDuracaoMinutos(inicio, fim) {
    if (!inicio || !fim) return 0;
    const [hInicio, mInicio] = inicio.split(':').map(Number);
    const [hFim, mFim] = fim.split(':').map(Number);
    return (hFim * 60 + mFim) - (hInicio * 60 + mInicio);
}

// Mostrar toast
function showToast(msg, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i><span>${msg}</span>`;
    container.appendChild(t);
    
    setTimeout(() => t.classList.add('show'), 10);
    setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 300);
    }, 3000);
}

// Mostrar loading
function showLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'flex';
}

function hideLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';
}

// Atualizar status de sincronização
function updateSyncStatus(success) {
    const status = document.getElementById('sync-status');
    if (!status) return;
    if (success) {
        status.innerHTML = '<i class="fas fa-check-circle" style="color: var(--accent-success);"></i>';
        setTimeout(() => {
            status.innerHTML = '<i class="fas fa-sync-alt"></i>';
        }, 2000);
    } else {
        status.innerHTML = '<i class="fas fa-exclamation-circle" style="color: var(--accent-danger);"></i>';
    }
}

// Exportar funções globais
window.utils = {
    generateId,
    diasAte,
    diasDesde,
    formatarData,
    formatarHora,
    formatarHoraString,
    tempoRestante,
    calcularDuracaoMinutos,
    showToast,
    showLoading,
    hideLoading,
    updateSyncStatus
};

// Disponibilizar funções mais usadas no escopo global
window.generateId = generateId;
window.diasAte = diasAte;
window.diasDesde = diasDesde;
window.formatarData = formatarData;
window.formatarHora = formatarHora;
window.calcularDuracaoMinutos = calcularDuracaoMinutos;
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.updateSyncStatus = updateSyncStatus;