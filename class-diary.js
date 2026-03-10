// class-diary.js - Registro de Aulas

class ClassDiaryService {
    constructor() {
        this.diaries = [];
    }

    loadDiaries() {
        this.diaries = window.app?.data?.classDiaries || [];
    }

    // Registrar diário de aula
    async registrarDiario(diaryData) {
        const novoDiario = {
            id: generateId(),
            materia: diaryData.materia,
            data: diaryData.data || new Date().toISOString().split('T')[0],
            presenca: diaryData.presenca,
            conteudoExplicado: diaryData.conteudoExplicado || '',
            exerciciosPassados: diaryData.exerciciosPassados || '',
            trabalhoAnunciado: diaryData.trabalhoAnunciado || '',
            dificuldade: diaryData.dificuldade || 3,
            precisoRevisar: diaryData.precisoRevisar || false,
            observacoes: diaryData.observacoes || ''
        };

        const success = await dbService.addItem('classDiaries', novoDiario);
        
        if (success) {
            this.loadDiaries();
            
            // Se marcou como precisa revisar, gerar revisões automáticas
            if (novoDiario.precisoRevisar && window.reviewSystem) {
                await window.reviewSystem.gerarRevisoesFromAula(novoDiario);
                showToast('Diário salvo e revisões automáticas criadas!');
            } else {
                showToast('Diário de aula salvo!');
            }
        }
        
        return success;
    }

    // Obter diários de uma matéria
    getDiariosPorMateria(materiaNome) {
        return this.diaries.filter(d => d.materia === materiaNome)
            .sort((a, b) => new Date(b.data) - new Date(a.data));
    }

    // Obter último diário de uma matéria
    getUltimoDiarioPorMateria(materiaNome) {
        const diarios = this.getDiariosPorMateria(materiaNome);
        return diarios[0];
    }

    // Obter diários que precisam de revisão
    getDiariosParaRevisar() {
        return this.diaries.filter(d => d.precisoRevisar)
            .sort((a, b) => new Date(b.data) - new Date(a.data));
    }

    // Calcular frequência em uma matéria
    calcularFrequencia(materiaNome) {
        const diarios = this.getDiariosPorMateria(materiaNome);
        if (diarios.length === 0) return 100;
        
        const presencas = diarios.filter(d => d.presenca === 'present').length;
        return Math.round((presencas / diarios.length) * 100);
    }
}

window.classDiaryService = new ClassDiaryService();