// auth.js - Gerenciamento de autenticação

let currentUser = null;

auth.onAuthStateChanged(async (user) => {
    const loginScreen = document.getElementById('login-screen');
    const setupScreen = document.getElementById('setup-screen');
    const mainDashboard = document.getElementById('main-dashboard');

    try {
        if (window.showLoading) window.showLoading();

        if (!window.app) {
            console.error('window.app ainda não existe');
            if (window.showToast) {
                window.showToast('App ainda não inicializado. Recarregue a página.', 'error');
            }
            return;
        }

        if (user) {
            currentUser = user;

            if (loginScreen) loginScreen.style.display = 'none';

            const data = await window.dbService.loadUserData(user.uid);

            if (!data.user) {
                if (setupScreen) setupScreen.style.display = 'flex';
                if (mainDashboard) mainDashboard.style.display = 'none';
                window.app.renderSetupForm();
            } else {
                if (setupScreen) setupScreen.style.display = 'none';
                if (mainDashboard) mainDashboard.style.display = 'block';
                await window.app.init();
            }
        } else {
            currentUser = null;

            if (loginScreen) loginScreen.style.display = 'flex';
            if (setupScreen) setupScreen.style.display = 'none';
            if (mainDashboard) mainDashboard.style.display = 'none';
        }
    } catch (error) {
        console.error('Erro na autenticação/inicialização:', error);
        if (window.showToast) {
            window.showToast('Erro ao inicializar aplicação. Recarregue a página.', 'error');
        }
    } finally {
        if (window.hideLoading) window.hideLoading();
    }
});

async function loginWithGoogle() {
    try {
        if (window.showLoading) window.showLoading();
        await auth.signInWithPopup(googleProvider);
    } catch (error) {
        console.error('Erro no login:', error);
        if (window.showToast) {
            window.showToast('Erro ao fazer login: ' + error.message, 'error');
        }
    } finally {
        if (window.hideLoading) window.hideLoading();
    }
}

async function logout() {
    try {
        await auth.signOut();
        if (window.showToast) window.showToast('Desconectado com sucesso', 'success');
    } catch (error) {
        console.error('Erro no logout:', error);
        if (window.showToast) {
            window.showToast('Erro ao sair: ' + error.message, 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('login-google')?.addEventListener('click', loginWithGoogle);
    document.getElementById('logout-btn')?.addEventListener('click', logout);
});

window.authService = {
    getCurrentUser: () => currentUser
};