// ai-assistant.js - Assistente IA Baseado em Dados Reais

class AIAssistant {
    constructor() {
        this.context = {};
    }

    // Atualizar contexto com dados atuais do usuário
    updateContext(data) {
        this.context = {
            user: data.user,
            subjects: data.subjects,
            sessions: data.sessions,
            tasks: data.tasks,
            exams: data.exams,
            grades: data.grades,
            learningMap: data.learningMap,
            classSchedule: data.classSchedule,
            dailyLogs: data.dailyLogs,
            classDiaries: data.classDiaries,
            reviews: data.reviews,
            attendance: data.attendance
        };
    }

    // --- Funções de Análise de Contexto ---
    getProximasProvas(dias = 30) {
        const hoje = new Date();
        return (this.context.exams || [])
            .filter(e => new Date(e.data) >= hoje && diasAte(e.data) <= dias)
            .sort((a, b) => new Date(a.data) - new Date(b.data));
    }

    getRevisoesPendentes() {
        const hoje = new Date().toISOString().split('T')[0];
        return (this.context.reviews || []).filter(r => r.data === hoje && !r.concluida);
    }

    getHorasEstudadasMateria(materiaNome) {
        return (this.context.sessions || [])
            .filter(s => s.materia === materiaNome && s.concluida)
            .reduce((acc, s) => acc + s.duracao, 0) / 60;
    }

    getUltimaAulaRegistrada(materiaNome) {
        const aulas = (this.context.classDiaries || [])
            .filter(cd => cd.materia === materiaNome)
            .sort((a, b) => new Date(b.data) - new Date(a.data));
        return aulas[0];
    }

    getFaltasMateria(materiaNome) {
        let faltas = 0;
        Object.entries(this.context.attendance || {}).forEach(([key, status]) => {
            if (key.startsWith(materiaNome) && status === 'absent') {
                faltas++;
            }
        });
        return faltas;
    }

    // --- Gerador de Respostas ---
    async ask(pergunta) {
        const p = pergunta.toLowerCase();

        if (p.includes('o que devo estudar agora') || p.includes('oque estudar agora')) {
            return this.sugerirEstudoAgora();
        }
        if (p.includes('risco acadêmico') || p.includes('como está meu risco')) {
            return this.analisarRiscoAcademico();
        }
        if (p.includes('plano de estudo para hoje') || p.includes('plano para hoje')) {
            return this.gerarPlanoHoje();
        }
        if (p.includes('próximas provas') || p.includes('provas')) {
            return this.listarProvas();
        }
        if (p.includes('dificuldade') || p.includes('matéria difícil')) {
            return this.sugerirMateriasDificeis();
        }
        if (p.includes('revisão') || p.includes('revisoes')) {
            return this.listarRevisoes();
        }
        return "Posso ajudar com planos de estudo, análise de risco, próximas provas, e revisões. O que você gostaria de saber?";
    }

    sugerirEstudoAgora() {
        const hoje = new Date().getDay();
        const aulasHoje = (this.context.classSchedule || []).filter(a => parseInt(a.dia) === hoje);
        const tempoAgora = new Date();
        const horaAtual = tempoAgora.getHours();
        const minutoAtual = tempoAgora.getMinutes();
        const minutosAtuais = horaAtual * 60 + minutoAtual;

        // 1. Verificar se está em aula
        const aulaAgora = aulasHoje.find(a => {
            const minutosInicio = calcularDuracaoMinutos('00:00', a.inicio);
            const minutosFim = calcularDuracaoMinutos('00:00', a.fim);
            return minutosAtuais >= minutosInicio && minutosAtuais <= minutosFim;
        });

        if (aulaAgora) {
            const aulaDiario = this.getUltimaAulaRegistrada(aulaAgora.materia);
            if (aulaDiario && aulaDiario.precisoRevisar) {
                return `Você está em aula de ${aulaAgora.materia} agora. Depois, revise "${aulaDiario.conteudoExplicado}" que você marcou como importante.`;
            }
            return `Aproveite a aula de ${aulaAgora.materia} agora!`;
        }

        // 2. Revisões pendentes
        const revisoesHoje = this.getRevisoesPendentes();
        if (revisoesHoje.length > 0) {
            const rev = revisoesHoje[0];
            return `Você tem uma revisão pendente de ${rev.materia}: "${rev.topico}". Que tal fazer agora (${rev.duracao} min)?`;
        }

        // 3. Próximas provas
        const provasProximas = this.getProximasProvas(7);
        if (provasProximas.length > 0) {
            const prova = provasProximas[0];
            const horasEstudadas = this.getHorasEstudadasMateria(prova.materia);
            return `Faltam ${diasAte(prova.data)} dias para a prova de ${prova.materia} e você estudou apenas ${horasEstudadas.toFixed(1)}h. Sugiro focar nela agora.`;
        }

        // 4. Matérias com dificuldade ou poucas horas
        const materiasComPoucoEstudo = (this.context.subjects || [])
            .filter(s => {
                const horas = this.getHorasEstudadasMateria(s.nome);
                return horas < s.dificuldade * 1.5;
            })
            .sort((a, b) => b.dificuldade - a.dificuldade);

        if (materiasComPoucoEstudo.length > 0) {
            const materiaSugerida = materiasComPoucoEstudo[0];
            return `Você estudou poucas horas de ${materiaSugerida.nome} (dificuldade ${materiaSugerida.dificuldade}/5). Que tal uma sessão de 45 minutos?`;
        }

        return "Sem recomendações urgentes. Que tal revisar um tópico aleatório ou adiantar alguma tarefa?";
    }

    analisarRiscoAcademico() {
        const riscos = [];
        const hoje = new Date();

        this.getProximasProvas(14).forEach(prova => {
            const horasEstudadas = this.getHorasEstudadasMateria(prova.materia);
            if (horasEstudadas < 3) {
                riscos.push(`🔴 Prova de ${prova.materia} em ${diasAte(prova.data)} dias com apenas ${horasEstudadas.toFixed(1)}h de estudo.`);
            } else if (horasEstudadas < 6) {
                riscos.push(`🟡 Prova de ${prova.materia} em ${diasAte(prova.data)} dias. Aumente o ritmo (${horasEstudadas.toFixed(1)}h estudadas).`);
            }
        });

        (this.context.subjects || []).forEach(subject => {
            const notasMateria = (this.context.grades || []).filter(g => g.materia === subject.nome);
            if (notasMateria.length > 0) {
                const media = this.calcularMedia(notasMateria);
                if (media < 6) {
                    riscos.push(`🔴 Média em ${subject.nome} está ${media.toFixed(1)}. Precisa melhorar urgentemente.`);
                } else if (media < 7) {
                    riscos.push(`🟡 Média em ${subject.nome} está ${media.toFixed(1)}. Fique atento.`);
                }
            }
        });

        (this.context.learningMap || []).forEach(topico => {
            if (topico.status === 'estudando' && diasDesde(topico.ultimaRevisao) > 7) {
                riscos.push(`🟡 Você não revisa "${topico.nome}" (${topico.materia}) há ${diasDesde(topico.ultimaRevisao)} dias.`);
            }
        });

        if (riscos.length === 0) {
            return "✅ Nenhum risco acadêmico identificado. Continue assim!";
        }

        return "📊 **Análise de Risco Acadêmico:**\n\n" + riscos.join('\n');
    }

    gerarPlanoHoje() {
        const hoje = new Date().getDay();
        const plano = [];
        
        this.getRevisoesPendentes().forEach(rev => {
            plano.push(`- 📚 Revisar ${rev.materia}: ${rev.topico} (${rev.duracao} min)`);
        });

        this.getProximasProvas(7).forEach(prova => {
            plano.push(`- 📝 Estudar para ${prova.materia} (prova em ${diasAte(prova.data)} dias)`);
        });

        const aulasHoje = (this.context.classSchedule || []).filter(a => parseInt(a.dia) === hoje);
        aulasHoje.forEach(aula => {
            const faltas = this.getFaltasMateria(aula.materia);
            if (faltas > 0) {
                plano.push(`- 🔁 Recuperar conteúdo da aula perdida de ${aula.materia} (${faltas} falta(s))`);
            }
        });

        (this.context.subjects || []).forEach(subject => {
            const horas = this.getHorasEstudadasMateria(subject.nome);
            const horasNecessarias = subject.dificuldade * 1.5;
            if (horas < horasNecessarias) {
                plano.push(`- ⏳ Aumentar estudo em ${subject.nome} (${horas.toFixed(1)}h / ${horasNecessarias.toFixed(1)}h sugeridas)`);
            }
        });

        if (plano.length === 0) {
            return "Seu dia está tranquilo! Aproveite para descansar ou revisar.";
        }

        return "📅 **Sugestão de Plano para Hoje:**\n\n" + plano.join('\n');
    }

    generateDailyPlan() {
        return this.gerarPlanoHoje().split('\n').filter(line => line.startsWith('-')).map(line => {
            const partes = line.replace('- ', '').split(' (');
            const materia = partes[0].replace('📚 Revisar ', '').replace('📝 Estudar para ', '').replace('🔁 Recuperar conteúdo da aula perdida de ', '').replace('⏳ Aumentar estudo em ', '');
            const duracaoMatch = line.match(/\((\d+) min\)/);
            const duracao = duracaoMatch ? parseInt(duracaoMatch[1]) : 45;
            const tipo = line.includes('Revisar') ? 'revisao' : line.includes('Estudar para') ? 'exercicios' : 'teoria';
            
            return {
                materia: materia.split(' (')[0],
                tipo: tipo,
                duracao: duracao,
                prioridade: 'media',
                motivo: line
            };
        });
    }

    listarProvas() {
        const provas = this.getProximasProvas(30);
        if (provas.length === 0) return "Nenhuma prova nos próximos 30 dias.";
        return "📌 **Próximas Provas:**\n\n" + provas.map(p => 
            `- ${p.materia}: ${p.titulo} (${diasAte(p.data)} dias)`
        ).join('\n');
    }

    sugerirMateriasDificeis() {
        const dificeis = (this.context.subjects || [])
            .filter(s => s.dificuldade >= 4)
            .sort((a, b) => b.dificuldade - a.dificuldade);
        
        if (dificeis.length === 0) return "Nenhuma matéria com dificuldade alta (4 ou 5) identificada.";

        return "⚠️ **Matérias com Alta Dificuldade:**\n\n" + dificeis.map(s => {
            const horas = this.getHorasEstudadasMateria(s.nome);
            return `- ${s.nome} (Dificuldade ${s.dificuldade}/5) - ${horas.toFixed(1)}h estudadas.`;
        }).join('\n');
    }

    listarRevisoes() {
        const pendentes = this.getRevisoesPendentes();
        if (pendentes.length === 0) return "Nenhuma revisão pendente para hoje. Bom trabalho!";
        return "🔄 **Revisões para Hoje:**\n\n" + pendentes.map(r => 
            `- ${r.materia}: ${r.topico}`
        ).join('\n');
    }

    calcularMedia(notas) {
        if (!notas || notas.length === 0) return 0;
        const somaPonderada = notas.reduce((acc, n) => acc + n.valor * (n.peso / 100), 0);
        const somaPesos = notas.reduce((acc, n) => acc + n.peso, 0);
        return somaPesos ? (somaPonderada / somaPesos) * 10 : 0;
    }
}

window.aiAssistant = new AIAssistant();