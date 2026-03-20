// auth.js - fluxo de autenticação mais defensivo para novos usuários
let currentUser = null;

async function handleAuthenticatedUser(user) {
  const loginScreen = document.getElementById('login-screen');
  const setupScreen = document.getElementById('setup-screen');
  const mainDashboard = document.getElementById('main-dashboard');

  currentUser = user;
  if (loginScreen) loginScreen.style.display = 'none';

  if (!window.app) {
    console.error('window.app ainda não existe');
    if (setupScreen) setupScreen.style.display = 'flex';
    if (mainDashboard) mainDashboard.style.display = 'none';
    return;
  }

  let data = null;
  try {
    data = await window.dbService.loadUserData(user.uid);
  } catch (error) {
    console.error('Erro ao carregar dados do usuário:', error);
  }

  const hasUserProfile = !!(data && data.user && (data.user.nome || data.user.curso || data.user.universidade));

  if (!hasUserProfile) {
    if (setupScreen) setupScreen.style.display = 'flex';
    if (mainDashboard) mainDashboard.style.display = 'none';

    if (window.app && typeof window.app.renderSetupForm === 'function') {
      try {
        window.app.data = data || window.app.data || {};
        if (!window.app.data.user) {
          window.app.data.user = {
            nome: user.displayName || '',
            curso: '',
            universidade: '',
            semestre: ''
          };
        } else if (!window.app.data.user.nome && user.displayName) {
          window.app.data.user.nome = user.displayName;
        }
        window.app.renderSetupForm();
        document.dispatchEvent(new Event('app-ready'));
      } catch (error) {
        console.error('Erro ao renderizar setup inicial:', error);
      }
    }
    return;
  }

  if (setupScreen) setupScreen.style.display = 'none';
  if (mainDashboard) mainDashboard.style.display = 'block';
  await window.app.init();
}

auth.onAuthStateChanged(async (user) => {
  const loginScreen = document.getElementById('login-screen');
  const setupScreen = document.getElementById('setup-screen');
  const mainDashboard = document.getElementById('main-dashboard');

  try {
    if (window.showLoading) window.showLoading();

    if (user) {
      await handleAuthenticatedUser(user);
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

window.authService = { getCurrentUser: () => currentUser };
