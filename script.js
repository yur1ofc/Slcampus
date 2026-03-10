// script.js - Arquivo principal de inicialização

// Garantir que todas as funções globais estão disponíveis
(function() {
    // Verificar se as funções utilitárias existem
    if (typeof generateId === 'undefined') {
        console.error('utils.js não carregado corretamente');
    }
    
    if (typeof showToast === 'undefined') {
        console.error('showToast não definido');
    }
    
    // Inicializar app quando o DOM estiver pronto
    document.addEventListener('DOMContentLoaded', () => {
        // Criar instância do app
        window.app = new StudyLifeControl();
        
        // Configurar botões globais
        const whatsNowBtn = document.getElementById('whats-now-btn');
        if (whatsNowBtn) {
            whatsNowBtn.addEventListener('click', () => {
                if (window.app) window.app.whatsNow();
            });
        }
        
        const dailyLogBtn = document.getElementById('daily-log-btn');
        if (dailyLogBtn) {
            dailyLogBtn.addEventListener('click', () => {
                if (window.app) window.app.openDailyLogModal();
            });
        }
        
        // Configurar formulário de setup
        const setupForm = document.getElementById('setup-form');
        if (setupForm) {
            setupForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (window.app) window.app.handleSetupSubmit(e);
            });
        }
        
        const addMateriaBtn = document.getElementById('add-materia');
        if (addMateriaBtn) {
            addMateriaBtn.addEventListener('click', () => {
                if (window.app) window.app.addMateriaField();
            });
        }
        
        const addAulaBtn = document.getElementById('add-aula');
        if (addAulaBtn) {
            addAulaBtn.addEventListener('click', () => {
                if (window.app) window.app.addAulaField();
            });
        }
    });
})();