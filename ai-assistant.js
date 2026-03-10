// Assistente IA - Versão Heurística Avançada

class AIAssistant {
    constructor() {
        this.context = {};
        this.conversationHistory = [];
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
            habits: data.habits,
            learningMap: data.learningMap,
            classSchedule: data.classSchedule
        };
    }

    // Analisar risco acadêmico
    analyzeRisk() {
        const risks = [];
        const hoje = new Date();
        
        this.context.subjects?.forEach(subject => {
            const notas = this.context.grades?.filter(g => g.materia === subject.nome) || [];
            const media = this.calcularMedia(notas);
            
            const examesProximos = this.context.exams?.filter(e => 
                e.materia === subject.nome && 
                new Date(e.data) >= hoje && 
                diasAte(e.data) <= 14
            ) || [];
            
            const horasEstudadas = this.context.sessions?.filter(s => 
                s.materia === subject.nome && s.concluida
            ).reduce((acc, s) => acc + s.duracao, 0) / 60 || 0;
            
            if (media > 0 && media < 6) {
                risks.push({
                    materia: subject.nome,
                    nivel: 'alto',
                    motivo: `Média ${media.toFixed(1)} - precisa de atenção urgente`
                });
            } else if (examesProximos.length > 0 && horasEstudadas < 3) {
                risks.push({
                    materia: subject.nome,
                    nivel: 'alto',
                    motivo: `Prova em ${diasAte(examesProximos[0].data)} dias, apenas ${horasEstudadas.toFixed(1)}h estudadas`
                });
            } else if (subject.dificuldade >= 4 && horasEstudadas < 2) {
                risks.push({
                    materia: subject.nome,
                    nivel: 'medio',
                    motivo: 'Matéria difícil com pouco estudo'
                });
            }
        });
        
        return risks;
    }

    // Gerar plano de estudo para hoje
    generateDailyPlan() {
        const hoje = new Date();
        const diaSemana = hoje.getDay();
        
        // Verificar aulas de hoje
        const aulasHoje = this.context.classSchedule?.filter(a => parseInt(a.dia) === diaSemana) || [];
        const horariosOcupados = aulasHoje.map(a => ({
            inicio: a.inicio,
            fim: a.fim
        }));
        
        // Calcular horas disponíveis (considerando aulas)
        const horasDisponiveis = this.calcularHorasDisponiveis(horariosOcupados);
        
        // Priorizar matérias
        const prioridades = this.calcularPrioridades();
        
        // Gerar plano
        const plano = [];
        let horasAlocadas = 0;
        
        for (const p of prioridades) {
            if (horasAlocadas >= horasDisponiveis) break;
            
            const horasParaHoje = Math.min(2, horasDisponiveis - horasAlocadas);
            if (horasParaHoje <= 0) continue;
            
            plano.push({
                materia: p.materia,
                tipo: this.sugerirTipoEstudo(p.materia),
                duracao: horasParaHoje * 60,
                prioridade: p.prioridade,
                motivo: p.motivo
            });
            
            horasAlocadas += horasParaHoje;
        }
        
        return plano;
    }

    // Gerar plano semanal
    generateWeeklyPlan() {
        const plano = {
            segunda: [],
            terca: [],
            quarta: [],
            quinta: [],
            sexta: [],
            sabado: [],
            domingo: []
        };
        
        const prioridades = this.calcularPrioridades();
        const dias = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
        
        prioridades.forEach((p, index) => {
            // Distribuir estudos durante a semana
            const diasParaEstudo = Math.min(5, Math.ceil(p.prioridade * 2));
            
            for (let i = 0; i < diasParaEstudo; i++) {
                const dia = dias[i % 5]; // Segunda a sexta prioritariamente
                plano[dia].push({
                    materia: p.materia,
                    tipo: this.sugerirTipoEstudo(p.materia),
                    duracao: p.dificuldade >= 4 ? 90 : 60,
                    motivo: p.motivo
                });
            }
        });
        
        return plano;
    }

    // Calcular prioridades das matérias
    calcularPrioridades() {
        const hoje = new Date();
        
        return this.context.subjects?.map(s => {
            let prioridade = s.peso * s.dificuldade;
            let motivo = [];
            
            // Verificar provas próximas
            const exames = this.context.exams?.filter(e => 
                e.materia === s.nome && 
                new Date(e.data) >= hoje && 
                diasAte(e.data) <= 14
            ) || [];
            
            if (exames.length > 0) {
                prioridade *= 2;
                motivo.push(`prova em ${diasAte(exames[0].data)} dias`);
            }
            
            // Verificar média
            const notas = this.context.grades?.filter(g => g.materia === s.nome) || [];
            const media = this.calcularMedia(notas);
            if (media < 6 && media > 0) {
                prioridade *= 1.5;
                motivo.push(`média ${media.toFixed(1)}`);
            }
            
            // Verificar horas estudadas
            const horas = this.context.sessions?.filter(ses => 
                ses.materia === s.nome && ses.concluida
            ).reduce((acc, s) => acc + s.duracao, 0) / 60 || 0;
            
            if (horas < s.dificuldade * 2) {
                prioridade *= 1.2;
                motivo.push('pouco estudo');
            }
            
            // Modo pesado
            if (window.app.data.settings.heavyMode && s.dificuldade >= 4) {
                prioridade *= 1.3;
                motivo.push('modo pesado');
            }
            
            return {
                materia: s.nome,
                prioridade: prioridade,
                dificuldade: s.dificuldade,
                motivo: motivo.length ? motivo.join(', ') : 'manter consistência'
            };
        }).sort((a, b) => b.prioridade - a.prioridade) || [];
    }

    // Sugerir tipo de estudo baseado no contexto
    sugerirTipoEstudo(materia) {
        const notas = this.context.grades?.filter(g => g.materia === materia) || [];
        const media = this.calcularMedia(notas);
        
        if (media < 6) return 'exercicios';
        if (media >= 8) return 'revisao';
        
        const exames = this.context.exams?.filter(e => 
            e.materia === materia && diasAte(e.data) <= 7
        ) || [];
        
        if (exames.length > 0) return 'exercicios';
        
        // Verificar tópicos não dominados
        const topicosNaoDominados = this.context.learningMap?.filter(t => 
            t.materia === materia && t.status !== 'dominado'
        ) || [];
        
        if (topicosNaoDominados.length > 3) return 'teoria';
        
        return 'revisao';
    }

    // Calcular média ponderada
    calcularMedia(notas) {
        if (!notas.length) return 0;
        const soma = notas.reduce((a, n) => a + n.valor * n.peso / 100, 0);
        const totalPeso = notas.reduce((a, n) => a + n.peso, 0);
        return totalPeso ? (soma / totalPeso) * 10 : 0;
    }

    // Calcular horas disponíveis considerando aulas
    calcularHorasDisponiveis(horariosOcupados) {
        const horasMaximas = this.context.user?.horasMaximas || 6;
        let horasOcupadas = 0;
        
        horariosOcupados.forEach(h => {
            const [hInicio, mInicio] = h.inicio.split(':');
            const [hFim, mFim] = h.fim.split(':');
            const duracao = (parseInt(hFim) + parseInt(mFim)/60) - (parseInt(hInicio) + parseInt(mInicio)/60);
            horasOcupadas += duracao;
        });
        
        return Math.max(0, horasMaximas - horasOcupadas);
    }

    // Responder perguntas do usuário
    async ask(pergunta) {
        // Adicionar ao histórico
        this.conversationHistory.push({ role: 'user', content: pergunta });
        
        // Analisar pergunta e gerar resposta baseada em heurísticas
        let resposta = this.gerarRespostaHeuristica(pergunta);
        
        this.conversationHistory.push({ role: 'assistant', content: resposta });
        return resposta;
    }

    gerarRespostaHeuristica(pergunta) {
        const p = pergunta.toLowerCase();
        
        // Identificar intenção
        if (p.includes('plano') && p.includes('hoje')) {
            const plano = this.generateDailyPlan();
            return this.formatarPlanoResposta(plano, 'hoje');
        }
        
        if (p.includes('plano') && p.includes('semana')) {
            const plano = this.generateWeeklyPlan();
            return this.formatarPlanoSemanalResposta(plano);
        }
        
        if (p.includes('risco') || p.includes('alerta')) {
            const riscos = this.analyzeRisk();
            return this.formatarRiscosResposta(riscos);
        }
        
        if (p.includes('próxima aula') || p.includes('proxima aula')) {
            return this.obterProximaAula();
        }
        
        if (p.includes('próximas provas') || p.includes('proximas provas')) {
            return this.obterProximasProvas();
        }
        
        if (p.includes('como estudar') || p.includes('dica')) {
            return this.obterDicaEstudo();
        }
        
        // Resposta padrão
        return "Posso ajudar com planos de estudo, análise de risco, próximas aulas e provas, e dicas de estudo. O que você gostaria de saber?";
    }

    formatarPlanoResposta(plano, periodo) {
        if (!plano.length) return "Não há recomendações para hoje. Aproveite para descansar ou revisar conteúdos.";
        
        let resposta = `📚 Plano de estudo para ${periodo}:\n\n`;
        plano.forEach((item, i) => {
            resposta += `${i+1}. ${item.materia} - ${item.tipo} (${item.duracao}min)\n`;
            resposta += `   💡 ${item.motivo}\n\n`;
        });
        return resposta;
    }

    formatarPlanoSemanalResposta(plano) {
        let resposta = "📅 Plano de estudo semanal:\n\n";
        for (const [dia, sessoes] of Object.entries(plano)) {
            if (sessoes.length) {
                resposta += `${dia.charAt(0).toUpperCase() + dia.slice(1)}:\n`;
                sessoes.forEach(s => {
                    resposta += `   • ${s.materia} - ${s.duracao}min (${s.motivo})\n`;
                });
                resposta += '\n';
            }
        }
        return resposta;
    }

    formatarRiscosResposta(riscos) {
        if (!riscos.length) return "Nenhum risco acadêmico identificado no momento.";
        
        let resposta = "⚠️ Alertas de risco acadêmico:\n\n";
        riscos.forEach(r => {
            resposta += `• ${r.materia}: ${r.motivo}\n`;
        });
        return resposta;
    }

    obterProximaAula() {
        const hoje = new Date();
        const diaSemana = hoje.getDay();
        
        const aulasHoje = this.context.classSchedule?.filter(a => parseInt(a.dia) === diaSemana) || [];
        
        // Ordenar por horário
        aulasHoje.sort((a, b) => a.inicio.localeCompare(b.inicio));
        
        // Encontrar próxima aula
        const agora = hoje.getHours() * 60 + hoje.getMinutes();
        const proximaAula = aulasHoje.find(a => {
            const [h, m] = a.inicio.split(':');
            const inicio = parseInt(h) * 60 + parseInt(m);
            return inicio > agora;
        });
        
        if (proximaAula) {
            const materia = this.context.subjects?.find(s => s.nome === proximaAula.materia);
            return `Próxima aula: ${proximaAula.materia} às ${proximaAula.inicio} ${proximaAula.sala ? `- Sala ${proximaAula.sala}` : ''}`;
        }
        
        // Se não tem mais aula hoje, buscar próxima aula em outro dia
        for (let i = 1; i <= 7; i++) {
            const proximoDia = (diaSemana + i) % 7;
            const aulasProximoDia = this.context.classSchedule?.filter(a => parseInt(a.dia) === proximoDia) || [];
            if (aulasProximoDia.length) {
                aulasProximoDia.sort((a, b) => a.inicio.localeCompare(b.inicio));
                const dias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
                return `Próxima aula: ${aulasProximoDia[0].materia} ${dias[proximoDia]} às ${aulasProximoDia[0].inicio}`;
            }
        }
        
        return "Nenhuma aula cadastrada.";
    }

    obterProximasProvas() {
        const hoje = new Date();
        const provas = this.context.exams?.filter(e => new Date(e.data) >= hoje)
            .sort((a, b) => new Date(a.data) - new Date(b.data))
            .slice(0, 5) || [];
        
        if (!provas.length) return "Nenhuma prova próxima.";
        
        let resposta = "📝 Próximas provas:\n\n";
        provas.forEach(p => {
            const dias = diasAte(p.data);
            resposta += `• ${p.materia}: ${p.titulo} em ${dias} dia${dias > 1 ? 's' : ''}\n`;
        });
        return resposta;
    }

    obterDicaEstudo() {
        const dicas = [
            "Use a técnica Pomodoro: 25min foco, 5min pausa",
            "Revise o conteúdo 24h depois de estudar",
            "Explique o conteúdo para alguém (ou para si mesmo)",
            "Faça exercícios variados, não só os mais fáceis",
            "Durma bem: o cérebro consolida memórias durante o sono",
            "Estude em blocos de 50-90min para melhor concentração",
            "Use mapas mentais para conectar conceitos",
            "Ensine o que aprendeu - é a melhor forma de fixar",
            "Faça pausas ativas: levante-se, alongue-se",
            "Revise antes de dormir: ajuda na consolidação"
        ];
        return `💡 Dica de estudo: ${dicas[Math.floor(Math.random() * dicas.length)]}`;
    }
}

window.aiAssistant = new AIAssistant();