// database.js - Gerenciamento do Firestore

const DEFAULT_APP_DATA = () => ({
    user: null,
    subjects: [],
    sessions: [],
    tasks: [],
    exams: [],
    materials: [],
    grades: [],
    habits: [],
    learningMap: [],
    classSchedule: [],
    dailyLogs: [],
    classDiaries: [],
    reviews: [],
    curriculum: [],
    extraCourses: [],
    attendance: {},
    settings: {
        heavyMode: false,
        notifications: true,
        autoPlan: true
    }
});

const LOCAL_BACKUP_PREFIX = 'slc-backup:';

function getBackupKey(userId) {
    return `${LOCAL_BACKUP_PREFIX}${userId}`;
}

function saveLocalBackup(userId, data) {
    try {
        localStorage.setItem(getBackupKey(userId), JSON.stringify({
            savedAt: new Date().toISOString(),
            data
        }));
    } catch (error) {
        console.warn('Não foi possível salvar backup local:', error);
    }
}

function loadLocalBackup(userId) {
    try {
        const raw = localStorage.getItem(getBackupKey(userId));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.data || null;
    } catch (error) {
        console.warn('Não foi possível ler backup local:', error);
        return null;
    }
}

const dbService = {
    async loadUserData(userId) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();

            let data;
            if (!userDoc.exists) {
                data = DEFAULT_APP_DATA();
            } else {
                const raw = userDoc.data() || {};
                data = {
                    ...DEFAULT_APP_DATA(),
                    ...raw,
                    settings: {
                        ...DEFAULT_APP_DATA().settings,
                        ...(raw.settings || {})
                    }
                };
            }

            if (window.app) {
                window.app.data = data;
            }

            saveLocalBackup(userId, data);

            if (window.updateSyncStatus) window.updateSyncStatus(true);
            return data;
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            const backup = loadLocalBackup(userId);
            if (backup) {
                if (window.updateSyncStatus) window.updateSyncStatus(false);
                if (window.showToast) window.showToast('Sem conexão com o banco. Carregando último backup local.', 'warning');
                return {
                    ...DEFAULT_APP_DATA(),
                    ...backup,
                    settings: {
                        ...DEFAULT_APP_DATA().settings,
                        ...(backup.settings || {})
                    }
                };
            }
            if (window.updateSyncStatus) window.updateSyncStatus(false);
            if (window.showToast) window.showToast('Erro ao sincronizar dados', 'error');
            throw error;
        }
    },

    async saveAllData(dataOverride = null) {
        const user = auth.currentUser;
        if (!user) return false;

        try {
            if (window.showLoading) window.showLoading();

            const dataToSave = dataOverride || window.app?.data || DEFAULT_APP_DATA();
            await db.collection('users').doc(user.uid).set(dataToSave, { merge: true });
            saveLocalBackup(user.uid, dataToSave);

            if (window.app) {
                window.app.data = dataToSave;
            }

            if (window.updateSyncStatus) window.updateSyncStatus(true);
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            if (window.updateSyncStatus) window.updateSyncStatus(false);
            if (window.showToast) window.showToast('Erro ao salvar dados', 'error');
            return false;
        } finally {
            if (window.hideLoading) window.hideLoading();
        }
    },

    async saveData(field, data) {
        const user = auth.currentUser;
        if (!user) return false;

        try {
            await db.collection('users').doc(user.uid).set({
                [field]: data
            }, { merge: true });

            if (window.app?.data) {
                window.app.data[field] = data;
                saveLocalBackup(user.uid, window.app.data);
            }

            if (window.updateSyncStatus) window.updateSyncStatus(true);
            return true;
        } catch (error) {
            console.error(`Erro ao salvar campo "${field}":`, error);
            if (window.updateSyncStatus) window.updateSyncStatus(false);
            if (window.showToast) window.showToast('Erro ao salvar', 'error');
            return false;
        }
    },

    async addItem(collection, item) {
        if (!window.app?.data?.[collection]) return false;
        window.app.data[collection].push(item);
        return this.saveData(collection, window.app.data[collection]);
    },

    async updateItem(collection, id, updates) {
        if (!window.app?.data?.[collection]) return false;

        const index = window.app.data[collection].findIndex(i => i.id === id);
        if (index === -1) return false;

        window.app.data[collection][index] = {
            ...window.app.data[collection][index],
            ...updates
        };

        return this.saveData(collection, window.app.data[collection]);
    },

    async removeItem(collection, id) {
        if (!window.app?.data?.[collection]) return false;

        window.app.data[collection] = window.app.data[collection].filter(i => i.id !== id);
        return this.saveData(collection, window.app.data[collection]);
    },

    async clearAllData() {
        const user = auth.currentUser;
        if (!user) return false;

        try {
            if (window.showLoading) window.showLoading();

            const emptyData = DEFAULT_APP_DATA();
            await db.collection('users').doc(user.uid).set(emptyData);
            if (window.app) window.app.data = emptyData;

            if (window.updateSyncStatus) window.updateSyncStatus(true);
            return true;
        } catch (error) {
            console.error('Erro ao limpar dados:', error);
            if (window.updateSyncStatus) window.updateSyncStatus(false);
            if (window.showToast) window.showToast('Erro ao limpar dados', 'error');
            return false;
        } finally {
            if (window.hideLoading) window.hideLoading();
        }
    }
};

window.DEFAULT_APP_DATA = DEFAULT_APP_DATA;
window.dbService = dbService;

// Demo mode: localStorage-only data service (bypasses Firebase)
const DEMO_KEY = 'slc-demo-data';
const DEMO_USER_KEY = 'slc-demo-user';

function isDemoMode() {
    return localStorage.getItem('slc-demo-mode') === 'true' || new URLSearchParams(window.location.search).get('demo') === '1';
}

function getDemoData() {
    try {
        const raw = localStorage.getItem(DEMO_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (error) {
        console.warn('Erro ao ler dados demo:', error);
        return null;
    }
}

function saveDemoData(data) {
    try {
        localStorage.setItem(DEMO_KEY, JSON.stringify(data));
    } catch (error) {
        console.warn('Erro ao salvar dados demo:', error);
    }
}

function getDemoUser() {
    try {
        const raw = localStorage.getItem(DEMO_USER_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (error) {
        return null;
    }
}

function saveDemoUser(user) {
    try {
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user));
    } catch (error) {
        console.warn('Erro ao salvar usuário demo:', error);
    }
}

const demoDbService = {
    async loadUserData(userId) {
        if (!isDemoMode()) return null;
        const data = getDemoData() || DEFAULT_APP_DATA();
        const user = getDemoUser();
        if (user) data.user = user;
        if (window.app) window.app.data = data;
        return data;
    },

    async saveAllData(data) {
        if (!isDemoMode()) return false;
        saveDemoData(data);
        if (data.user) saveDemoUser(data.user);
        if (window.showToast) window.showToast('Dados salvos (modo demo)', 'success');
        return true;
    },

    async saveData(field, value) {
        if (!isDemoMode()) return false;
        const data = getDemoData() || DEFAULT_APP_DATA();
        data[field] = value;
        if (field === 'user') saveDemoUser(value);
        saveDemoData(data);
        return true;
    },

    async addItem(collection, item) {
        if (!isDemoMode()) return false;
        const data = getDemoData() || DEFAULT_APP_DATA();
        if (!Array.isArray(data[collection])) data[collection] = [];
        data[collection].push(item);
        saveDemoData(data);
        return true;
    },

    async updateItem(collection, id, updates) {
        if (!isDemoMode()) return false;
        const data = getDemoData() || DEFAULT_APP_DATA();
        if (!Array.isArray(data[collection])) return false;
        const idx = data[collection].findIndex(i => i.id === id);
        if (idx === -1) return false;
        data[collection][idx] = { ...data[collection][idx], ...updates };
        saveDemoData(data);
        return true;
    },

    async removeItem(collection, id) {
        if (!isDemoMode()) return false;
        const data = getDemoData() || DEFAULT_APP_DATA();
        if (!Array.isArray(data[collection])) return false;
        data[collection] = data[collection].filter(i => i.id !== id);
        saveDemoData(data);
        return true;
    },

    async clearAllData() {
        if (!isDemoMode()) return false;
        localStorage.removeItem(DEMO_KEY);
        localStorage.removeItem(DEMO_USER_KEY);
        return true;
    }
};

window.demoDbService = demoDbService;

// Unified database service: automatically uses demo mode when enabled
const unifiedDbService = new Proxy(dbService, {
    get(target, prop) {
        if (window.isDemoMode?.() && window.demoDbService?.[prop]) {
            return window.demoDbService[prop].bind(window.demoDbService);
        }
        return target[prop];
    }
});

window.DEFAULT_APP_DATA = DEFAULT_APP_DATA;
window.dbService = unifiedDbService;
window.isDemoMode = isDemoMode;
