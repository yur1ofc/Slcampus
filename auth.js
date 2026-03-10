// auth.js - Gerenciamento de autenticação

let currentUser = null;

// Função para aguardar app existir com timeout
function waitForApp(timeout = 5000) {
    return new Promise((resolve, reject) => {
        if (window.app) return resolve(window.app);

        const start = Date.now();
        const checkInterval = setInterval(() => {
            if (window.app) {
                clearInterval(checkInterval);
                resolve(window.app);
            } else if (Date.now() - start > timeout) {
                clearInterval(checkInterval);
                reject(new Error('window.app não foi inicializado a tempo'));
            }
        }, 50);
    });
}

// Inicializar listener de autenticação
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('login-screen').style.display = 'none';
        
        try {
            // Aguardar app ser criado com timeout
            const app = await waitForApp();
            
            // Carregar dados do usuário
            await window.dbService.loadUserData(user.uid);
            
            // Verificar se é primeira vez
            if (!app.data.user) {
                document.getElementById('setup-screen').style.display = 'flex';
                document.getElementById('main-dashboard').style.display = 'none';
                app.renderSetupForm();
            } else {
                document.getElementById('setup-screen').style.display = 'none';
                document.getElementById('main-dashboard').style.display = 'block';
                await app.init();
            }
        } catch (error) {
            console.error('Erro na inicialização:', error);
            showToast('Erro ao inicializar aplicação. Recarregue a página.', 'error');
        } finally {
            hideLoading();
        }
    } else {
        currentUser = null;
        document.getElementById('login-screen').style.display = 'flex';
        document.getElementById('setup-screen').style.display = 'none';
        document.getElementById('main-dashboard').style.display = 'none';
        hideLoading();
    }
});

// Login com Google
async function loginWithGoogle() {
    try {
        showLoading();
        await auth.signInWithPopup(googleProvider);
    } catch (error) {
        hideLoading();
        showToast('Erro ao fazer login: ' + error.message, 'error');
    }
}

// Logout
async function logout() {
    try {
        await auth.signOut();
        showToast('Desconectado com sucesso');
    } catch (error) {
        showToast('Erro ao sair: ' + error.message, 'error');
    }
}

// Event listeners
document.getElementById('login-google')?.addEventListener('click', loginWithGoogle);
document.getElementById('logout-btn')?.addEventListener('click', logout);

window.authService = {
    getCurrentUser: () => currentUser
};