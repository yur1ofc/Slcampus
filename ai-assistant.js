// ai-assistant.js - Assistente IA melhorado e compatível com o projeto atual

class AIAssistant {
    constructor() {
        this.context = {};
    }

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
            if (key.includes('_') && status === 'absent') {
                const aulaId = key.split('_')[0];
                const aula = (this.context.classSchedule || []).find(a => a.id === aulaId);
                if (aula?.materia === materiaNome) faltas++;
            }
        });
        return faltas;
    }

    getProximaAulaInfo() {
        const proximaAula = window.scheduleManager?.getProximaAula();
        if (!proximaAula) return 'Não há próximas aulas cadastradas.';

        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return `📌 Próxima aula:\n\nMatéria: ${proximaAula.materia}\nDia: ${dias[parseInt(proximaAula.dia, 10)]}\nHorário: ${proximaAula.inicio} - ${proximaAula.fim}\nSala: ${proximaAula.sala || 'Não informada'}`;
    }

    getDicaEstudo() {
        const dicas = [
            'Use Pomodoro: 25 minutos focado, 5 minutos de pausa.',
            'Revise o conteúdo no mesmo dia da aula para fixar mais.',
            'Faça exercícios antes de reler a teoria inteira.',
            'Explique o conteúdo em voz alta como se estivesse ensinando.',
            'Estude primeiro a matéria mais difícil do dia.',
            'Transforme assuntos em perguntas para testar sua memória.',
            'Não confie só na leitura passiva. Resolva questões.',
            'Deixe o celular longe na hora do foco pesado.'
        ];

        return `💡 Dica de estudo:\n\n${dicas[Math.floor(Math.random() * dicas.length)]}`;
    }

    sugerirEstudoAgora() {
        const hoje = new Date().getDay();
        const aulasHoje = (this.context.classSchedule || []).filter(a => parseInt(a.dia, 10) === hoje);
        const agora = new Date();
        const minutosAtuais = agora.getHours() * 60 + agora.getMinutes();

        const aulaAgora = aulasHoje.find(a => {
            const minutosInicio = calcularDuracaoMinutos('00:00', a.inicio);
            const minutosFim = calcularDuracaoMinutos('00:00', a.fim);
            return minutosAtuais >= minutosInicio && minutosAtuais <= minutosFim;
        });

        if (aulaAgora) {
            const aulaDiario = this.getUltimaAulaRegistrada(aulaAgora.materia);
            if (aulaDiario && aulaDiario.precisoRevisar) {
                return `Você está em aula de ${aulaAgora.materia} agora. Depois, revise "${aulaDiario.conteudoExplicado}".`;
            }
            return `Você está em aula de ${aulaAgora.materia} agora. Foque nela.`;
        }

        const revisoesHoje = this.getRevisoesPendentes();
        if (revisoesHoje.length > 0) {
            const rev = revisoesHoje[0];
            return `Você tem revisão pendente de ${rev.materia}: "${rev.topico}". Faz ela agora.`;
        }

        const provasProximas = this.getProximasProvas(7);
        if (provasProximas.length > 0) {
            const prova = provasProximas[0];
            const horasEstudadas = this.getHorasEstudadasMateria(prova.materia);
            return `Faltam ${diasAte(prova.data)} dias para ${prova.materia} e você estudou ${horasEstudadas.toFixed(1)}h. Minha prioridade seria essa matéria agora.`;
        }

        const materiasComPoucoEstudo = (this.context.subjects || [])
            .filter(s => this.getHorasEstudadasMateria(s.nome) < s.dificuldade * 1.5)
            .sort((a, b) => b.dificuldade - a.dificuldade);

        if (materiasComPoucoEstudo.length > 0) {
            const materia = materiasComPoucoEstudo[0];
            return `Você estudou pouco ${materia.nome}. Faz uma sessão de 45 minutos nela agora.`;
        }

        return 'Sem urgência agora. Pode revisar um tópico antigo ou adiantar tarefas.';
    }

    analisarRiscoAcademico() {
        const riscos = [];

        this.getProximasProvas(14).forEach(prova => {
            const horasEstudadas = this.getHorasEstudadasMateria(prova.materia);
            if (horasEstudadas < 3) {
                riscos.push(`🔴 Prova de ${prova.materia} em ${diasAte(prova.data)} dias com só ${horasEstudadas.toFixed(1)}h estudadas.`);
            } else if (horasEstudadas < 6) {
                riscos.push(`🟡 ${prova.materia} está perto. Melhor aumentar o ritmo.`);
            }
        });

        (this.context.subjects || []).forEach(subject => {
            const notasMateria = (this.context.grades || []).filter(g => g.materia === subject.nome);
            if (notasMateria.length > 0) {
                const media = this.calcularMedia(notasMateria);
                if (media < 6) {
                    riscos.push(`🔴 Média em ${subject.nome} está ${media.toFixed(1)}.`);
                } else if (media < 7) {
                    riscos.push(`🟡 Média em ${subject.nome} está ${media.toFixed(1)}.`);
                }
            }
        });

        (this.context.learningMap || []).forEach(topico => {
            if (topico.status === 'estudando' && diasDesde(topico.ultimaRevisao) > 7) {
                riscos.push(`🟡 ${topico.nome} (${topico.materia}) sem revisão há ${diasDesde(topico.ultimaRevisao)} dias.`);
            }
        });

        if (!riscos.length) return '✅ Nenhum risco acadêmico forte agora.';

        return `📊 Análise de risco acadêmico:\n\n${riscos.join('\n')}`;
    }

    gerarPlanoHoje() {
        const hoje = new Date().getDay();
        const plano = [];

        this.getRevisoesPendentes().forEach(rev => {
            plano.push(`- 📚 Revisar ${rev.materia}: ${rev.topico} (${rev.duracao || 45} min)`);
        });

        this.getProximasProvas(7).forEach(prova => {
            plano.push(`- 📝 Estudar para ${prova.materia} (prova em ${diasAte(prova.data)} dias)`);
        });

        const aulasHoje = (this.context.classSchedule || []).filter(a => parseInt(a.dia, 10) === hoje);
        aulasHoje.forEach(aula => {
            const faltas = this.getFaltasMateria(aula.materia);
            if (faltas > 0) {
                plano.push(`- 🔁 Recuperar conteúdo de ${aula.materia} (${faltas} falta(s))`);
            }
        });

        (this.context.subjects || []).forEach(subject => {
            const horas = this.getHorasEstudadasMateria(subject.nome);
            const horasNecessarias = subject.dificuldade * 1.5;
            if (horas < horasNecessarias) {
                plano.push(`- ⏳ Aumentar estudo em ${subject.nome} (${horas.toFixed(1)}h / ${horasNecessarias.toFixed(1)}h)`);
            }
        });

        if (!plano.length) return 'Seu dia está tranquilo. Use para revisar ou descansar.';

        return `📅 Plano para hoje:\n\n${plano.join('\n')}`;
    }

    gerarPlanoSemanal() {
        const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const base = this.generateDailyPlan().slice(0, 6);

        let texto = '📆 Plano da semana:\n\n';

        for (let i = 0; i < 7; i++) {
            const data = new Date();
            data.setDate(data.getDate() + i);
            const diaSemana = data.getDay();
            const aulas = (this.context.classSchedule || []).filter(a => parseInt(a.dia, 10) === diaSemana);

            texto += `${dias[diaSemana]} (${data.toLocaleDateString('pt-BR')})\n`;

            if (aulas.length) {
                texto += `Aulas: ${aulas.map(a => `${a.materia} ${a.inicio}-${a.fim}`).join(' | ')}\n`;
            }

            const recomendacao = base[i % Math.max(base.length, 1)];
            if (recomendacao) {
                texto += `Estudo sugerido: ${recomendacao.materia} • ${recomendacao.tipo} • ${recomendacao.duracao}min\n`;
            } else {
                texto += 'Estudo sugerido: revisão leve ou exercícios.\n';
            }

            texto += '\n';
        }

        return texto;
    }

    generateDailyPlan() {
        return this.gerarPlanoHoje()
            .split('\n')
            .filter(line => line.startsWith('-'))
            .map(line => {
                const materia = line
                    .replace('- ', '')
                    .replace('📚 Revisar ', '')
                    .replace('📝 Estudar para ', '')
                    .replace('🔁 Recuperar conteúdo de ', '')
                    .replace('⏳ Aumentar estudo em ', '')
                    .split(' (')[0]
                    .trim();

                const duracaoMatch = line.match(/\((\d+) min\)/);
                const duracao = duracaoMatch ? parseInt(duracaoMatch[1], 10) : 45;

                let tipo = 'teoria';
                if (line.includes('Revisar')) tipo = 'revisao';
                if (line.includes('Estudar para')) tipo = 'exercicios';
                if (line.includes('Recuperar')) tipo = 'revisao';

                let prioridade = 'media';
                if (line.includes('prova')) prioridade = 'alta';

                return {
                    materia,
                    tipo,
                    duracao,
                    prioridade,
                    motivo: line
                };
            });
    }

    listarProvas() {
        const provas = this.getProximasProvas(30);
        if (!provas.length) return 'Nenhuma prova nos próximos 30 dias.';

        return `📌 Próximas provas:\n\n${provas
            .map(p => `- ${p.materia}: ${p.titulo} (${diasAte(p.data)} dias)`)
            .join('\n')}`;
    }

    sugerirMateriasDificeis() {
        const dificeis = (this.context.subjects || [])
            .filter(s => s.dificuldade >= 4)
            .sort((a, b) => b.dificuldade - a.dificuldade);

        if (!dificeis.length) return 'Nenhuma matéria com dificuldade 4 ou 5.';

        return `⚠️ Matérias mais difíceis:\n\n${dificeis.map(s => {
            const horas = this.getHorasEstudadasMateria(s.nome);
            return `- ${s.nome} (${s.dificuldade}/5) • ${horas.toFixed(1)}h estudadas`;
        }).join('\n')}`;
    }

    listarRevisoes() {
        const pendentes = this.getRevisoesPendentes();
        if (!pendentes.length) return 'Nenhuma revisão pendente hoje.';
        return `🔄 Revisões de hoje:\n\n${pendentes.map(r => `- ${r.materia}: ${r.topico}`).join('\n')}`;
    }

    preverDificuldadeMateria(materiaNome) {
        const subject = (this.context.subjects || []).find(s => s.nome === materiaNome);
        if (!subject) return `Não encontrei a matéria ${materiaNome}.`;

        const horas = this.getHorasEstudadasMateria(materiaNome);
        const notas = (this.context.grades || []).filter(g => g.materia === materiaNome);
        const media = this.calcularMedia(notas);

        let nivel = 'média';
        if (subject.dificuldade >= 4 || media < 6 || horas < 3) nivel = 'alta';
        if (subject.dificuldade <= 2 && media >= 7 && horas >= 5) nivel = 'baixa';

        return `Previsão de dificuldade para ${materiaNome}: ${nivel}. Você tem ${horas.toFixed(1)}h estudadas e média ${media.toFixed(1)}.`;
    }

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
        if (p.includes('plano para a semana') || p.includes('plano semanal')) {
            return this.gerarPlanoSemanal();
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
        if (p.includes('próxima aula')) {
            return this.getProximaAulaInfo();
        }
        if (p.includes('dica de estudo')) {
            return this.getDicaEstudo();
        }

        const materiaEncontrada = (this.context.subjects || []).find(s => p.includes(s.nome.toLowerCase()));
        if (p.includes('prever dificuldade') && materiaEncontrada) {
            return this.preverDificuldadeMateria(materiaEncontrada.nome);
        }

        return 'Posso ajudar com plano de hoje, plano da semana, riscos acadêmicos, próximas provas, próxima aula, revisões e dicas de estudo.';
    }

    calcularMedia(notas) {
        if (!notas || !notas.length) return 0;
        const soma = notas.reduce((acc, n) => acc + n.valor * (n.peso / 100), 0);
        const somaPesos = notas.reduce((acc, n) => acc + n.peso, 0);
        return somaPesos ? (soma / somaPesos) * 10 : 0;
    }
}

window.aiAssistant = new AIAssistant();