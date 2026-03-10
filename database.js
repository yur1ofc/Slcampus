// database.js - Gerenciamento do Firestore

const dbService = {
    // Carregar todos os dados do usuário
    async loadUserData(userId) {
        try {
            const userDoc = await db.collection('users').doc(userId).get();
            
            if (!userDoc.exists) {
                // Inicializar com dados padrão
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
                    settings: {
                        heavyMode: false,
                        notifications: true,
                        autoPlan: true
                    }
                };
                return;
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
                settings: data.settings || {
                    heavyMode: false,
                    notifications: true,
                    autoPlan: true
                }
            };
            
            updateSyncStatus(true);
            return window.app.data;
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            updateSyncStatus(false);
            showToast('Erro ao sincronizar dados', 'error');
            throw error;
        }
    },

    // Salvar todos os dados
    async saveAllData() {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
            showLoading();
            await db.collection('users').doc(user.uid).set(window.app.data, { merge: true });
            updateSyncStatus(true);
            hideLoading();
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            updateSyncStatus(false);
            showToast('Erro ao salvar dados', 'error');
            hideLoading();
            return false;
        }
    },

    // Salvar dados específicos
    async saveData(field, data) {
        const user = auth.currentUser;
        if (!user) return;
        
        try {
            await db.collection('users').doc(user.uid).update({
                [field]: data
            });
            updateSyncStatus(true);
            return true;
        } catch (error) {
            console.error('Erro ao salvar:', error);
            updateSyncStatus(false);
            showToast('Erro ao salvar', 'error');
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
            showLoading();
            // Inicializar com dados vazios
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
                settings: {
                    heavyMode: false,
                    notifications: true,
                    autoPlan: true
                }
            };
            
            await db.collection('users').doc(user.uid).set(emptyData);
            window.app.data = emptyData;
            updateSyncStatus(true);
            hideLoading();
            return true;
        } catch (error) {
            console.error('Erro ao limpar dados:', error);
            updateSyncStatus(false);
            showToast('Erro ao limpar dados', 'error');
            hideLoading();
            return false;
        }
    }
};

window.dbService = dbService;