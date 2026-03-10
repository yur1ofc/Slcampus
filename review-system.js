// review-system.js - Gerenciamento de Revisões Automáticas

class ReviewSystem {
    constructor() {
        this.revisoes = [];
    }

    // Carregar revisões
    loadReviews() {
        this.revisoes = window.app?.data?.reviews || [];
    }

    // Gerar revisões a partir de um diário de aula
    async gerarRevisoesFromAula(classDiary) {
        const hoje = new Date();
        const dataAula = new Date(classDiary.data);
        const revisoesGeradas = [];

        // Revisão em 24h
        const revisao24h = new Date(dataAula);
        revisao24h.setDate(dataAula.getDate() + 1);
        revisoesGeradas.push({
            id: generateId(),
            materia: classDiary.materia,
            topico: classDiary.conteudoExplicado || 'Conteúdo da aula',
            data: revisao24h.toISOString().split('T')[0],
            duracao: 30,
            tipo: '24h',
            concluida: false,
            aulaId: classDiary.id
        });

        // Revisão em 7 dias
        const revisao7d = new Date(dataAula);
        revisao7d.setDate(dataAula.getDate() + 7);
        revisoesGeradas.push({
            id: generateId(),
            materia: classDiary.materia,
            topico: classDiary.conteudoExplicado || 'Conteúdo da aula',
            data: revisao7d.toISOString().split('T')[0],
            duracao: 45,
            tipo: '7d',
            concluida: false,
            aulaId: classDiary.id
        });

        // Revisão antes da prova (se houver prova próxima)
        const provasMateria = (window.app?.data?.exams || [])
            .filter(e => e.materia === classDiary.materia && new Date(e.data) > hoje);
        
        if (provasMateria.length > 0) {
            const provaMaisProxima = provasMateria.sort((a, b) => new Date(a.data) - new Date(b.data))[0];
            const dataProva = new Date(provaMaisProxima.data);
            const dataRevisaoPreProva = new Date(dataProva);
            dataRevisaoPreProva.setDate(dataProva.getDate() - 3);

            if (dataRevisaoPreProva > hoje && 
                dataRevisaoPreProva.toISOString().split('T')[0] !== revisao24h.toISOString().split('T')[0] &&
                dataRevisaoPreProva.toISOString().split('T')[0] !== revisao7d.toISOString().split('T')[0]) {
                revisoesGeradas.push({
                    id: generateId(),
                    materia: classDiary.materia,
                    topico: `Revisão pré-prova: ${classDiary.conteudoExplicado || 'Conteúdo da aula'}`,
                    data: dataRevisaoPreProva.toISOString().split('T')[0],
                    duracao: 90,
                    tipo: 'pre-exam',
                    concluida: false,
                    aulaId: classDiary.id,
                    provaId: provaMaisProxima.id
                });
            }
        }

        // Salvar todas as revisões geradas
        for (const rev of revisoesGeradas) {
            await dbService.addItem('reviews', rev);
        }

        this.loadReviews();
        return revisoesGeradas;
    }

    // Obter revisões para uma data específica
    getRevisoesPorData(data) {
        this.loadReviews();
        return this.revisoes.filter(r => r.data === data && !r.concluida)
            .sort((a, b) => {
                if (a.tipo === 'pre-exam') return -1;
                if (b.tipo === 'pre-exam') return 1;
                return 0;
            });
    }

    // Obter revisões pendentes para hoje
    getRevisoesHoje() {
        const hoje = new Date().toISOString().split('T')[0];
        return this.getRevisoesPorData(hoje);
    }

    // Marcar revisão como concluída
    async concluirRevisao(revisaoId) {
        const revisao = this.revisoes.find(r => r.id === revisaoId);
        if (!revisao) return false;

        if (revisao.aulaId) {
            const topico = (window.app?.data?.learningMap || []).find(t => 
                t.materia === revisao.materia && t.nome === revisao.topico
            );

            if (topico) {
                const novoStatus = topico.status === 'estudando' ? 'revisando' : 'dominado';
                await dbService.updateItem('learningMap', topico.id, { 
                    status: novoStatus,
                    ultimaRevisao: new Date().toISOString()
                });
            } else {
                const novoTopico = {
                    id: generateId(),
                    materia: revisao.materia,
                    nome: revisao.topico,
                    dificuldade: 3,
                    status: 'revisando',
                    confianca: 4,
                    ultimaRevisao: new Date().toISOString()
                };
                await dbService.addItem('learningMap', novoTopico);
            }
        }

        const success = await dbService.updateItem('reviews', revisaoId, { concluida: true });
        if (success) {
            this.loadReviews();
            showToast('Revisão concluída! 🎯');
        }
        return success;
    }

    // Reprogramar revisão
    async reprogramarRevisao(revisaoId, novaData) {
        return await dbService.updateItem('reviews', revisaoId, { data: novaData });
    }
}

window.reviewSystem = new ReviewSystem();