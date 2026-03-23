// database.js - Gerenciamento do Firestore (hotfix sem conflito global)

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

const APP_COLLECTION_FIELDS = [
    'subjects',
    'sessions',
    'tasks',
    'exams',
    'materials',
    'grades',
    'habits',
    'learningMap',
    'classSchedule',
    'dailyLogs',
    'classDiaries',
    'reviews',
    'curriculum',
    'extraCourses'
];

function deepClone(value) {
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (error) {
        console.warn('Falha ao clonar dados, retornando valor original:', error);
        return value;
    }
}

function isPlainObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
}

function normalizeObject(value) {
    return isPlainObject(value) ? value : {};
}

function normalizeUser(value) {
    return value === null || isPlainObject(value) ? value : null;
}

function normalizeAppData(rawData = {}) {
    const defaults = DEFAULT_APP_DATA();
    const safeRaw = isPlainObject(rawData) ? rawData : {};

    const normalized = {
        ...defaults,
        ...safeRaw,
        user: normalizeUser(safeRaw.user ?? defaults.user),
        attendance: normalizeObject(safeRaw.attendance),
        settings: {
            ...defaults.settings,
            ...normalizeObject(safeRaw.settings)
        }
    };

    APP_COLLECTION_FIELDS.forEach((field) => {
        normalized[field] = normalizeArray(safeRaw[field] ?? defaults[field]);
    });

    return normalized;
}

function getCurrentUser() {
    if (!window.auth || !window.auth.currentUser) return null;
    return window.auth.currentUser;
}

function getUsersCollection() {
    if (!window.db) {
        throw new Error('Firestore não está inicializado.');
    }
    return window.db.collection('users');
}

function setAppData(data) {
    if (window.app) {
        window.app.data = deepClone(data);
    }
}

function updateAppField(field, value) {
    if (window.app && window.app.data) {
        window.app.data[field] = deepClone(value);
    }
}

function notifySyncStatus(success) {
    if (typeof window.updateSyncStatus === 'function') {
        window.updateSyncStatus(!!success);
    }
}

function showErrorToast(message) {
    if (typeof window.showToast === 'function') {
        window.showToast(message, 'error');
    }
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
        console.warn('[dbService] Falha ao exibir loading:', error);
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
        console.warn('[dbService] Falha ao ocultar loading:', error);
    }
};

function logError(context, error, extra = null) {
    console.error(`[dbService] ${context}:`, error, extra || '');
}

function logWarn(context, extra = null) {
    console.warn(`[dbService] ${context}`, extra || '');
}

function isValidField(field) {
    return typeof field === 'string' && field.trim().length > 0;
}

function isValidCollection(collection) {
    return APP_COLLECTION_FIELDS.includes(collection);
}

function isValidItemId(id) {
    return id !== undefined && id !== null && String(id).trim() !== '';
}

function prepareDataToSave(data) {
    return normalizeAppData(deepClone(data));
}

const dbService = {
    async loadUserData(userId) {
        if (!userId || typeof userId !== 'string') {
            const error = new Error('ID do usuário inválido para carregar dados.');
            logError('loadUserData - userId inválido', error, { userId });
            notifySyncStatus(false);
            throw error;
        }

        try {
            const userDoc = await getUsersCollection().doc(userId).get();

            let data;
            if (!userDoc.exists) {
                data = DEFAULT_APP_DATA();
                await getUsersCollection().doc(userId).set(prepareDataToSave(data), { merge: true });
            } else {
                const raw = userDoc.data() || {};
                data = normalizeAppData(raw);
            }

            setAppData(data);
            notifySyncStatus(true);

            return deepClone(data);
        } catch (error) {
            logError('Erro ao carregar dados', error, { userId });
            notifySyncStatus(false);
            showErrorToast('Erro ao sincronizar dados');
            throw error;
        }
    },

    async saveAllData(dataOverride = null) {
        const user = getCurrentUser();
        if (!user) {
            logWarn('saveAllData chamado sem usuário autenticado');
            return false;
        }

        try {
            uiShowLoading();

            const sourceData = dataOverride || window.app?.data || DEFAULT_APP_DATA();
            const dataToSave = prepareDataToSave(sourceData);

            await getUsersCollection().doc(user.uid).set(dataToSave, { merge: true });

            setAppData(dataToSave);
            notifySyncStatus(true);

            return true;
        } catch (error) {
            logError('Erro ao salvar todos os dados', error);
            notifySyncStatus(false);
            showErrorToast('Erro ao salvar dados');
            return false;
        } finally {
            uiHideLoading();
        }
    },

    async saveData(field, data) {
        const user = getCurrentUser();
        if (!user) {
            logWarn('saveData chamado sem usuário autenticado', { field });
            return false;
        }

        if (!isValidField(field)) {
            logWarn('saveData recebeu campo inválido', { field });
            showErrorToast('Campo inválido para salvar');
            return false;
        }

        try {
            const safeValue =
                field === 'settings' ? {
                    ...DEFAULT_APP_DATA().settings,
                    ...normalizeObject(data)
                }
                : field === 'attendance'
                    ? normalizeObject(data)
                    : APP_COLLECTION_FIELDS.includes(field)
                        ? normalizeArray(data)
                        : deepClone(data);

            await getUsersCollection().doc(user.uid).set({
                [field]: safeValue
            }, { merge: true });

            updateAppField(field, safeValue);
            notifySyncStatus(true);

            return true;
        } catch (error) {
            logError(`Erro ao salvar campo "${field}"`, error);
            notifySyncStatus(false);
            showErrorToast('Erro ao salvar');
            return false;
        }
    },

    async addItem(collection, item) {
        if (!isValidCollection(collection)) {
            logWarn('addItem recebeu coleção inválida', { collection });
            showErrorToast('Coleção inválida');
            return false;
        }

        if (!item || typeof item !== 'object') {
            logWarn('addItem recebeu item inválido', { collection, item });
            showErrorToast('Item inválido');
            return false;
        }

        const currentData = normalizeAppData(window.app?.data || DEFAULT_APP_DATA());
        const updatedCollection = [...currentData[collection], deepClone(item)];

        const saved = await this.saveData(collection, updatedCollection);
        if (saved) {
            updateAppField(collection, updatedCollection);
        }

        return saved;
    },

    async updateItem(collection, id, updates) {
        if (!isValidCollection(collection)) {
            logWarn('updateItem recebeu coleção inválida', { collection });
            showErrorToast('Coleção inválida');
            return false;
        }

        if (!isValidItemId(id)) {
            logWarn('updateItem recebeu id inválido', { collection, id });
            showErrorToast('ID inválido');
            return false;
        }

        if (!updates || typeof updates !== 'object') {
            logWarn('updateItem recebeu updates inválidos', { collection, id, updates });
            showErrorToast('Dados inválidos para atualização');
            return false;
        }

        const currentData = normalizeAppData(window.app?.data || DEFAULT_APP_DATA());
        const currentCollection = normalizeArray(currentData[collection]);
        const index = currentCollection.findIndex((item) => String(item?.id) === String(id));

        if (index === -1) {
            logWarn('updateItem não encontrou item', { collection, id });
            return false;
        }

        const updatedCollection = [...currentCollection];
        updatedCollection[index] = {
            ...updatedCollection[index],
            ...deepClone(updates)
        };

        const saved = await this.saveData(collection, updatedCollection);
        if (saved) {
            updateAppField(collection, updatedCollection);
        }

        return saved;
    },

    async removeItem(collection, id) {
        if (!isValidCollection(collection)) {
            logWarn('removeItem recebeu coleção inválida', { collection });
            showErrorToast('Coleção inválida');
            return false;
        }

        if (!isValidItemId(id)) {
            logWarn('removeItem recebeu id inválido', { collection, id });
            showErrorToast('ID inválido');
            return false;
        }

        const currentData = normalizeAppData(window.app?.data || DEFAULT_APP_DATA());
        const currentCollection = normalizeArray(currentData[collection]);

        const exists = currentCollection.some((item) => String(item?.id) === String(id));
        if (!exists) {
            logWarn('removeItem não encontrou item', { collection, id });
            return false;
        }

        const updatedCollection = currentCollection.filter(
            (item) => String(item?.id) !== String(id)
        );

        const saved = await this.saveData(collection, updatedCollection);
        if (saved) {
            updateAppField(collection, updatedCollection);
        }

        return saved;
    },

    async clearAllData() {
        const user = getCurrentUser();
        if (!user) {
            logWarn('clearAllData chamado sem usuário autenticado');
            return false;
        }

        try {
            uiShowLoading();

            const emptyData = prepareDataToSave(DEFAULT_APP_DATA());
            await getUsersCollection().doc(user.uid).set(emptyData, { merge: false });

            setAppData(emptyData);
            notifySyncStatus(true);

            return true;
        } catch (error) {
            logError('Erro ao limpar dados', error);
            notifySyncStatus(false);
            showErrorToast('Erro ao limpar dados');
            return false;
        } finally {
            uiHideLoading();
        }
    },

    getDefaultData() {
        return deepClone(DEFAULT_APP_DATA());
    },

    normalizeData(rawData = {}) {
        return normalizeAppData(rawData);
    }
};

window.DEFAULT_APP_DATA = DEFAULT_APP_DATA;
window.dbService = dbService;
