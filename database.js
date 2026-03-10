// database.js - Gerenciamento do Firestore

const dbService = {
    // Carregar todos os dados do usuário
    async loadUserData(userId) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            
            if (!userDoc.exists) {
                // Inicializar com dados padrão para novas funcionalidades
                window.app.data = {
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
                    attendance: {},
                    settings: {
                        heavyMode: false,
                        notifications: true,
                        autoPlan: true
                    }
                };
                return window.app.data;
            }
            
            const data = userDoc.data();
            window.app.data = {
                user: data.user || null,
                subjects: data.subjects || [],
                sessions: data.sessions || [],
                tasks: data.tasks || [],
                exams: data.exams || [],
                materials: data.materials || [],
                grades: data.grades || [],
                habits: data.habits || [],
                learningMap: data.learningMap || [],
                classSchedule: data.classSchedule || [],
                dailyLogs: data.dailyLogs || [],
                classDiaries: data.classDiaries || [],
                reviews: data.reviews || [],
                attendance: data.attendance || {},
                settings: data.settings || {
                    heavyMode: false,
                    notifications: true,
                    autoPlan: true
                }
            };
            
            if (window.updateSyncStatus) window.updateSyncStatus(true);
            return window.app.data;
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            if (window.updateSyncStatus) window.updateSyncStatus(false);
            if (window.showToast) window.showToast('Erro ao sincronizar dados', 'error');
            throw error;
        }
    },

    // Salvar todos os dados
    async saveAllData() {
        const user = auth.currentUser;
        if (!user) return false;
        
        try {
            if (window.showLoading) window.showLoading();
            await db.collection('users').doc(user.uid).set(window.app.data, { merge: true });
            if (window.updateSyncStatus) window.updateSyncStatus(true);
            if (window.hideLoading) window.hideLoading();
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            if (window.updateSyncStatus) window.updateSyncStatus(false);
            if (window.showToast) window.showToast('Erro ao salvar dados', 'error');
            if (window.hideLoading) window.hideLoading();
            return false;
        }
    },

    // Salvar dados específicos
    async saveData(field, data) {
        const user = auth.currentUser;
        if (!user) return false;
        
        try {
            await db.collection('users').doc(user.uid).update({
                [field]: data
            });
            if (window.updateSyncStatus) window.updateSyncStatus(true);
            return true;
        } catch (error) {
            console.error('Erro ao salvar:', error);
            if (window.updateSyncStatus) window.updateSyncStatus(false);
            if (window.showToast) window.showToast('Erro ao salvar', 'error');
            return false;
        }
    },

    // Adicionar item a uma coleção
    async addItem(collection, item) {
        window.app.data[collection].push(item);
        return await this.saveData(collection, window.app.data[collection]);
    },

    // Atualizar item
    async updateItem(collection, id, updates) {
        const index = window.app.data[collection].findIndex(i => i.id === id);
        if (index !== -1) {
            window.app.data[collection][index] = { ...window.app.data[collection][index], ...updates };
            return await this.saveData(collection, window.app.data[collection]);
        }
        return false;
    },

    // Remover item
    async removeItem(collection, id) {
        window.app.data[collection] = window.app.data[collection].filter(i => i.id !== id);
        return await this.saveData(collection, window.app.data[collection]);
    },
    
    // Limpar todos os dados do usuário
    async clearAllData() {
        const user = auth.currentUser;
        if (!user) return false;
        
        try {
            if (window.showLoading) window.showLoading();
            const emptyData = {
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
                attendance: {},
                settings: {
                    heavyMode: false,
                    notifications: true,
                    autoPlan: true
                }
            };
            
            await db.collection('users').doc(user.uid).set(emptyData);
            window.app.data = emptyData;
            if (window.updateSyncStatus) window.updateSyncStatus(true);
            if (window.hideLoading) window.hideLoading();
            return true;
        } catch (error) {
            console.error('Erro ao limpar dados:', error);
            if (window.updateSyncStatus) window.updateSyncStatus(false);
            if (window.showToast) window.showToast('Erro ao limpar dados', 'error');
            if (window.hideLoading) window.hideLoading();
            return false;
        }
    }
};

window.dbService = dbService;