// auth.js - autenticação e roteamento inicial (hotfix sem conflito global)

let currentUser = null;
let authInitialized = false;
let appInitPromise = null;
let lastHandledUid = null;

function getEl(id) {
  return document.getElementById(id);
}

function setDisplay(id, value) {
  const el = getEl(id);
  if (el) el.style.display = value;
}

const uiShowLoading = () => {
  try {
    if (window.utils?.showLoading) {
      window.utils.showLoading();
      return;
    }

    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'flex';
  } catch (error) {
    console.warn('[auth] Falha ao exibir loading:', error);
  }
};

const uiHideLoading = () => {
  try {
    if (window.utils?.hideLoading) {
      window.utils.hideLoading();
      return;
    }

    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.style.display = 'none';
  } catch (error) {
    console.warn('[auth] Falha ao ocultar loading:', error);
  }
};

const uiShowToast = (message, type = 'info') => {
  try {
    window.showToast?.(message, type);
  } catch (error) {
    console.warn('[auth] Falha ao mostrar toast:', error);
  }
};

function logError(context, error, extra = null) {
  console.error(`[auth] ${context}:`, error, extra || '');
}

function logWarn(context, extra = null) {
  console.warn(`[auth] ${context}`, extra || '');
}

function isAppAvailable() {
  return !!window.app;
}

function isDbServiceAvailable() {
  return !!window.dbService && typeof window.dbService.loadUserData === 'function';
}

function resetAppInitState() {
  appInitPromise = null;
}

function showLoginScreen() {
  setDisplay('login-screen', 'flex');
  setDisplay('setup-screen', 'none');
  setDisplay('main-dashboard', 'none');
}

function showSetupScreen() {
  setDisplay('login-screen', 'none');
  setDisplay('setup-screen', 'flex');
  setDisplay('main-dashboard', 'none');
}

function showDashboardScreen() {
  setDisplay('login-screen', 'none');
  setDisplay('setup-screen', 'none');
  setDisplay('main-dashboard', 'block');
}

function dispatchAppReady() {
  document.dispatchEvent(new Event('app-ready'));
}

function hasUserProfile(data) {
  return !!(
    data &&
    data.user &&
    (
      String(data.user.nome || '').trim() ||
      String(data.user.curso || '').trim() ||
      String(data.user.universidade || '').trim()
    )
  );
}

async function waitForDependencies(maxAttempts = 40, delay = 150) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (isAppAvailable() && isDbServiceAvailable()) return true;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  return false;
}

async function ensureAppInitialized() {
  if (!window.app || typeof window.app.init !== 'function') {
    throw new Error('App não está disponível para inicialização.');
  }

  if (appInitPromise) {
    return appInitPromise;
  }

  appInitPromise = (async () => {
    await window.app.init();
  })();

  try {
    await appInitPromise;
  } finally {
    resetAppInitState();
  }
}

async function renderSetupIfAvailable() {
  if (window.app && typeof window.app.renderSetupForm === 'function') {
    await window.app.renderSetupForm();
  } else {
    logWarn('renderSetupForm não está disponível no window.app');
  }
}

async function handleSignedInUser(user) {
  if (!user || !user.uid) {
    throw new Error('Usuário autenticado inválido.');
  }

  currentUser = user;
  lastHandledUid = user.uid;

  showLoginScreen();
  setDisplay('login-screen', 'none');

  const dependenciesReady = await waitForDependencies();

  if (!dependenciesReady) {
    const error = new Error('Dependências da aplicação não ficaram prontas a tempo.');
    logError('Dependências indisponíveis após login', error);
    uiShowToast('App ainda não inicializado. Recarregue a página.', 'error');
    return;
  }

  let data;
  try {
    data = await window.dbService.loadUserData(user.uid);
  } catch (error) {
    logError('Falha ao carregar dados do usuário', error, { uid: user.uid });
    uiShowToast('Erro ao carregar seus dados. Recarregue a página.', 'error');
    throw error;
  }

  const profileExists = hasUserProfile(data);

  if (!profileExists) {
    showSetupScreen();
    await renderSetupIfAvailable();
    dispatchAppReady();
    return;
  }

  showDashboardScreen();

  try {
    await ensureAppInitialized();
  } catch (error) {
    logError('Falha ao inicializar app após login', error, { uid: user.uid });
    uiShowToast('Erro ao abrir o painel. Recarregue a página.', 'error');
    throw error;
  }
}

function handleSignedOutUser() {
  currentUser = null;
  lastHandledUid = null;
  resetAppInitState();
  showLoginScreen();
}

async function handleAuthStateChange(user) {
  try {
    uiShowLoading();

    if (user) {
      await handleSignedInUser(user);
    } else {
      handleSignedOutUser();
    }
  } catch (error) {
    logError('Erro na autenticação/inicialização', error);
    uiShowToast('Erro ao inicializar aplicação. Recarregue a página.', 'error');
    handleSignedOutUser();
  } finally {
    uiHideLoading();
  }
}

function getFriendlyAuthErrorMessage(error) {
  const code = error?.code || '';
  const rawMessage = error?.message || '';

  const errorMap = {
    'auth/popup-closed-by-user': 'Login cancelado antes da conclusão.',
    'auth/popup-blocked': 'O navegador bloqueou a janela de login. Libere pop-ups e tente novamente.',
    'auth/cancelled-popup-request': 'Já existe uma tentativa de login em andamento.',
    'auth/network-request-failed': 'Falha de conexão. Verifique sua internet e tente novamente.',
    'auth/too-many-requests': 'Muitas tentativas em pouco tempo. Tente novamente em instantes.',
    'auth/account-exists-with-different-credential': 'Já existe uma conta com esse e-mail usando outro método de acesso.',
    'auth/operation-not-allowed': 'Método de login não habilitado no Firebase.',
    'auth/internal-error': 'Erro interno de autenticação. Tente novamente.'
  };

  return errorMap[code] || rawMessage || 'Falha ao entrar com Google';
}

async function loginWithGoogle() {
  if (!window.auth || !window.googleProvider) {
    logWarn('loginWithGoogle chamado sem auth/googleProvider disponíveis');
    uiShowToast('Login indisponível no momento. Recarregue a página.', 'error');
    return;
  }

  try {
    uiShowLoading();
    await window.auth.signInWithPopup(window.googleProvider);
  } catch (error) {
    logError('Erro no login com Google', error);
    const message = getFriendlyAuthErrorMessage(error);
    uiShowToast(`Erro ao fazer login: ${message}`, 'error');
  } finally {
    uiHideLoading();
  }
}

async function logout() {
  if (!window.auth) {
    logWarn('logout chamado sem auth disponível');
    uiShowToast('Logout indisponível no momento.', 'error');
    return;
  }

  try {
    uiShowLoading();
    await window.auth.signOut();
    uiShowToast('Desconectado com sucesso', 'success');
  } catch (error) {
    logError('Erro no logout', error);
    const message = error?.message || 'Falha ao sair';
    uiShowToast(`Erro ao sair: ${message}`, 'error');
  } finally {
    uiHideLoading();
  }
}

function bindAuthEvents() {
  getEl('login-google')?.addEventListener('click', loginWithGoogle);
  getEl('logout-btn')?.addEventListener('click', logout);
}

function initAuthListener() {
  if (authInitialized) return;

  if (!window.auth || typeof window.auth.onAuthStateChanged !== 'function') {
    logWarn('auth.onAuthStateChanged ainda não está disponível');
    return;
  }

  authInitialized = true;
  window.auth.onAuthStateChanged(async (user) => {
    await handleAuthStateChange(user);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  bindAuthEvents();

  const ready = await waitForDependencies(20, 100);

  if (!ready) {
    logWarn('Dependências principais ainda não estavam prontas no DOMContentLoaded');
  }

  initAuthListener();
});

window.authService = {
  getCurrentUser: () => currentUser,
  isAuthenticated: () => !!currentUser,
  getLastHandledUid: () => lastHandledUid,
  loginWithGoogle,
  logout,
  handleSignedOutUser,
  handleSignedInUser
};
