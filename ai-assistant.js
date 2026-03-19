// ai-assistant.js - Mentor IA mais útil, contextual e menos genérico

(function () {
  const safeToDate = (value) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const getTodayDateOnly = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const dateOnly = (value) => {
    if (typeof window.toDateOnly === 'function') {
      try {
        return window.toDateOnly(value);
      } catch (_) {}
    }
    const date = safeToDate(value);
    if (!date) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const dateString = (value) => {
    if (typeof window.toDateString === 'function') {
      try {
        return window.toDateString(value);
      } catch (_) {}
    }
    const date = safeToDate(value) || new Date();
    return date.toISOString().slice(0, 10);
  };

  const diffDays = (value) => {
    if (typeof window.diasAte === 'function') {
      try {
        return window.diasAte(value);
      } catch (_) {}
    }
    const date = dateOnly(value);
    if (!date) return Infinity;
    return Math.round((date - getTodayDateOnly()) / 86400000);
  };

  const daysSince = (value) => {
    if (!value) return Infinity;
    const date = safeToDate(value);
    if (!date) return Infinity;
    return Math.floor((Date.now() - date.getTime()) / 86400000);
  };

  const weightedAverage = (items = []) => {
    if (typeof window.calcularMediaPonderada === 'function') {
      try {
        return window.calcularMediaPonderada(items);
      } catch (_) {}
    }
    const valid = items
      .map(item => ({
        nota: Number(item?.nota ?? item?.notaObtida ?? item?.valor),
        peso: Number(item?.peso ?? 1)
      }))
      .filter(item => Number.isFinite(item.nota) && Number.isFinite(item.peso) && item.peso > 0);

    if (!valid.length) return 0;
    const totalPeso = valid.reduce((acc, item) => acc + item.peso, 0);
    const total = valid.reduce((acc, item) => acc + (item.nota * item.peso), 0);
    return totalPeso ? total / totalPeso : 0;
  };

  const formatDate = (value) => {
    const date = safeToDate(value);
    if (!date) return 'data indefinida';
    return date.toLocaleDateString('pt-BR');
  };

  const formatWeekdayDate = (value) => {
    const date = safeToDate(value);
    if (!date) return 'data indefinida';
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const formatHours = (minutes) => `${(Math.round((minutes / 60) * 10) / 10).toFixed(1)}h`;

  class AIAssistant {
    constructor() {
      this.context = {};
      this.lastPlans = [];
      this.lastReasoningSnapshot = '';
      this.defaultFocusMinutes = 45;
    }

    updateContext(data) {
      this.context = {
        user: data?.user || null,
        subjects: Array.isArray(data?.subjects) ? data.subjects : [],
        sessions: Array.isArray(data?.sessions) ? data.sessions : [],
        tasks: Array.isArray(data?.tasks) ? data.tasks : [],
        exams: Array.isArray(data?.exams) ? data.exams : [],
        grades: Array.isArray(data?.grades) ? data.grades : [],
        learningMap: Array.isArray(data?.learningMap) ? data.learningMap : [],
        classSchedule: Array.isArray(data?.classSchedule) ? data.classSchedule : [],
        dailyLogs: Array.isArray(data?.dailyLogs) ? data.dailyLogs : [],
        classDiaries: Array.isArray(data?.classDiaries) ? data.classDiaries : [],
        reviews: Array.isArray(data?.reviews) ? data.reviews : [],
        attendance: data?.attendance || {}
      };
    }

    getProximasProvas(dias = 30) {
      const hoje = getTodayDateOnly();
      return (this.context.exams || [])
        .filter(item => {
          const data = dateOnly(item?.data);
          return data && data >= hoje && diffDays(data) <= dias && !item?.concluida;
        })
        .sort((a, b) => new Date(a.data) - new Date(b.data));
    }

    getRevisoesPendentes() {
      const hoje = dateString();
      return (this.context.reviews || [])
        .filter(item => (item?.data === hoje || dateString(item?.data) === hoje) && !item?.concluida);
    }

    getHorasEstudadasMateria(materiaNome) {
      return ((this.context.sessions || [])
        .filter(s => s?.materia === materiaNome && (s?.concluida || s?.status === 'concluida'))
        .reduce((acc, s) => acc + (Number(s?.duracao) || 0), 0)) / 60;
    }

    getMinutosEstudadosUltimosDias(materiaNome, dias = 7) {
      const now = Date.now();
      return (this.context.sessions || [])
        .filter(s => s?.materia === materiaNome && (s?.concluida || s?.status === 'concluida'))
        .filter(s => {
          const data = safeToDate(s?.data);
          return data && (now - data.getTime()) <= dias * 86400000;
        })
        .reduce((acc, s) => acc + (Number(s?.duracao) || 0), 0);
    }

    getUltimaAulaRegistrada(materiaNome) {
      return (this.context.classDiaries || [])
        .filter(item => item?.materia === materiaNome)
        .sort((a, b) => new Date(b.data) - new Date(a.data))[0] || null;
    }

    getFaltasMateria(materiaNome) {
      let faltas = 0;
      Object.entries(this.context.attendance || {}).forEach(([key, status]) => {
        if (!key.includes('_') || status !== 'absent') return;
        const aulaId = key.split('_')[0];
        const aula = (this.context.classSchedule || []).find(item => item?.id === aulaId);
        if (aula?.materia === materiaNome) faltas += 1;
      });
      return faltas;
    }

    getProximaAulaInfo() {
      if (window.scheduleManager?.getProximaAula) {
        const aula = window.scheduleManager.getProximaAula();
        if (aula) {
          return [
            `Próxima aula: ${aula.materia}.`,
            `Horário: ${aula.inicio} até ${aula.fim}.`,
            aula.sala ? `Sala: ${aula.sala}.` : '',
            aula.professor ? `Professor: ${aula.professor}.` : '',
            'Se tiver tempo antes, vale revisar o último conteúdo ou separar os materiais agora.'
          ].filter(Boolean).join(' ');
        }
      }

      const agora = new Date();
      const diaAtual = agora.getDay();
      const minutosAgora = agora.getHours() * 60 + agora.getMinutes();
      const aulas = (this.context.classSchedule || [])
        .map(item => ({
          ...item,
          dia: Number(item?.dia),
          minutosInicio: this._timeToMinutes(item?.inicio)
        }))
        .filter(item => Number.isFinite(item.minutosInicio))
        .sort((a, b) => (a.dia - b.dia) || (a.minutosInicio - b.minutosInicio));

      if (!aulas.length) return 'Você ainda não cadastrou aulas na grade horária.';

      for (let offset = 0; offset < 7; offset += 1) {
        const dia = (diaAtual + offset) % 7;
        const candidatas = aulas.filter(item => item.dia === dia);
        const aula = candidatas.find(item => offset > 0 || item.minutosInicio >= minutosAgora);
        if (aula) {
          return `Próxima aula: ${aula.materia} em ${this._weekdayName(dia)}, ${aula.inicio}-${aula.fim}${aula.sala ? `, sala ${aula.sala}` : ''}.`;
        }
      }

      return 'Não encontrei a próxima aula na sua grade.';
    }

    getDicaEstudo() {
      const materiaCritica = this._getMatterPriorityList()[0];
      if (!materiaCritica) {
        return 'Cadastre matérias, tarefas, provas ou sessões para eu conseguir te dar uma dica mais precisa.';
      }

      const dicas = [
        `Hoje a melhor jogada é começar por ${materiaCritica.nome}. Ela está no topo porque ${materiaCritica.justificativaCurta.toLowerCase()}.`,
        `Para ${materiaCritica.nome}, faça 20 min de revisão + 25 min de exercício. Isso costuma render mais do que ficar só lendo.`,
        materiaCritica.provaProxima
          ? `Como existe avaliação próxima em ${materiaCritica.nome}, foque em resolver questões do conteúdo que mais cai e revisar erros no final.`
          : `Como ${materiaCritica.nome} está pedindo atenção, tente fechar 1 tópico específico hoje em vez de estudar tudo de forma solta.`
      ];

      return dicas.join(' ');
    }

    listarProvas() {
      const provas = this.getProximasProvas(30);
      if (!provas.length) return 'Você não tem provas ou trabalhos próximos cadastrados nos próximos 30 dias.';
      return [
        'Próximas provas e trabalhos:',
        ...provas.slice(0, 6).map(item => `- ${item.titulo} (${item.materia}) em ${formatDate(item.data)}${item.tipo ? ` • ${item.tipo}` : ''} • faltam ${diffDays(item.data)} dia(s)`)
      ].join('\n');
    }

    listarRevisoes() {
      const revisoes = this.getRevisoesPendentes();
      if (!revisoes.length) return 'Nenhuma revisão pendente para hoje.';
      return [
        'Revisões para hoje:',
        ...revisoes.map(item => `- ${item.materia}: ${item.topico || 'revisão geral'}`)
      ].join('\n');
    }

    sugerirMateriasDificeis() {
      const prioridades = this._getMatterPriorityList();
      if (!prioridades.length) return 'Ainda não tenho dados suficientes para apontar matérias mais críticas.';
      return [
        'Matérias que mais merecem atenção agora:',
        ...prioridades.slice(0, 4).map((item, index) => `${index + 1}. ${item.nome} — ${item.justificativaCurta}.`)
      ].join('\n');
    }

    preverDificuldadeMateria(materiaNome) {
      const subject = (this.context.subjects || []).find(item => item?.nome === materiaNome);
      if (!subject) return `Não encontrei a matéria ${materiaNome}.`;

      const horas = this.getHorasEstudadasMateria(materiaNome);
      const notas = (this.context.grades || []).filter(item => item?.materia === materiaNome);
      const media = weightedAverage(notas);
      const ultimaAula = this.getUltimaAulaRegistrada(materiaNome);
      const faltas = this.getFaltasMateria(materiaNome);

      let nivel = 'média';
      if ((Number(subject?.dificuldade) || 3) >= 4 || media < 6 || horas < 3 || faltas >= 2) nivel = 'alta';
      if ((Number(subject?.dificuldade) || 3) <= 2 && media >= 7 && horas >= 5 && faltas === 0) nivel = 'baixa';

      return [
        `Previsão para ${materiaNome}: dificuldade ${nivel}.`,
        `Você tem ${horas.toFixed(1)}h estudadas no total${notas.length ? ` e média ${media.toFixed(1)}` : ''}.`,
        faltas ? `Há ${faltas} falta(s) registradas.` : 'Sem faltas registradas.',
        ultimaAula?.conteudo ? `Último conteúdo anotado: ${ultimaAula.conteudo}.` : ''
      ].filter(Boolean).join(' ');
    }

    analisarRiscoAcademico() {
      const prioridades = this._getMatterPriorityList();
      const riscos = [];
      const urgencias = [];

      this.getProximasProvas(14).forEach(prova => {
        const horas = this.getHorasEstudadasMateria(prova.materia);
        if (horas < 3) {
          urgencias.push(`${prova.materia}: prova/trabalho em ${diffDays(prova.data)} dia(s) e só ${horas.toFixed(1)}h estudadas.`);
        } else if (horas < 6) {
          urgencias.push(`${prova.materia}: avaliação próxima e preparação ainda média.`);
        }
      });

      (this.context.subjects || []).forEach(subject => {
        const notas = (this.context.grades || []).filter(item => item?.materia === subject.nome);
        if (!notas.length) return;
        const media = weightedAverage(notas);
        if (media < 6) riscos.push(`${subject.nome}: média ${media.toFixed(1)}.`);
        else if (media < 7) riscos.push(`${subject.nome}: média ${media.toFixed(1)} ainda pede margem de segurança.`);
      });

      (this.context.learningMap || []).forEach(topico => {
        if ((topico?.status === 'estudando' || topico?.status === 'revisando') && daysSince(topico?.ultimaRevisao) > 7) {
          riscos.push(`${topico.materia}: tópico "${topico.topico || topico.nome || 'sem nome'}" sem revisão recente.`);
        }
      });

      const cabecalho = prioridades[0]
        ? `Maior ponto de atenção agora: ${prioridades[0].nome}.`
        : 'Ainda faltam dados para uma análise profunda de risco.';

      return [
        cabecalho,
        urgencias.length ? `Urgências: ${urgencias.join(' ')}` : 'Urgências imediatas: nenhuma crítica encontrada.',
        riscos.length ? `Sinais de risco: ${riscos.join(' ')}` : 'Sinais de risco: nenhum alerta forte encontrado.',
        prioridades.length
          ? `Prioridade prática de ação: foque primeiro em ${prioridades.slice(0, 2).map(item => item.nome).join(' e ')}.`
          : ''
      ].filter(Boolean).join('\n\n');
    }

    sugerirEstudoAgora() {
      const prioridades = this._getMatterPriorityList();
      if (!prioridades.length) {
        return 'Ainda não tenho dados suficientes. Cadastre matérias, provas, tarefas ou sessões concluídas para eu sugerir algo realmente útil.';
      }

      const melhor = prioridades[0];
      const partes = [
        `Agora, eu começaria por ${melhor.nome}.`,
        `Motivo: ${melhor.justificativaCurta}.`,
        `Plano rápido: ${melhor.planoRapido}.`
      ];

      if (melhor.provaProxima) {
        partes.push(`Atenção extra: existe uma avaliação próxima em ${formatDate(melhor.provaProxima.data)}.`);
      }

      if (melhor.ultimaAula?.conteudo) {
        partes.push(`Gancho da última aula: ${melhor.ultimaAula.conteudo}.`);
      }

      return partes.join(' ');
    }

    gerarPlanoHoje() {
      const prioridades = this._getMatterPriorityList();
      if (!prioridades.length) {
        return 'Cadastre mais dados para eu montar um plano de hoje mais certeiro.';
      }

      const horasMaximas = Math.max(2, Math.min(6, Number(this.context.user?.horasMaximas) || 4));
      const blocos = [];
      let minutosDisponiveis = horasMaximas * 60;

      prioridades.slice(0, 4).forEach((item, index) => {
        if (minutosDisponiveis < 25) return;
        const duracao = index === 0 ? 60 : index === 1 ? 45 : 35;
        const minutos = Math.min(duracao, minutosDisponiveis);
        blocos.push({
          materia: item.nome,
          tipo: item.tipoSugestao,
          duracao: minutos,
          motivo: item.justificativaCurta
        });
        minutosDisponiveis -= minutos;
      });

      this.lastPlans = blocos;
      this.lastReasoningSnapshot = prioridades.map(item => `${item.nome}: ${item.justificativaCurta}`).join(' | ');

      return [
        'Plano de estudo para hoje:',
        ...blocos.map((bloco, index) =>
          `- ${bloco.materia} — ${this._labelForStudyType(bloco.tipo)} (${bloco.duracao} min). Motivo: ${bloco.motivo}.`
        ),
        '',
        'Ordem sugerida: comece pela maior urgência, faça uma pausa curta entre blocos e termine revisando erros/anotações.'
      ].join('\n');
    }

    gerarPlanoSemanal() {
      const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const prioridades = this._getMatterPriorityList();
      if (!prioridades.length) return 'Cadastre mais dados para eu gerar um plano semanal realmente útil.';

      const materias = prioridades.slice(0, 5);
      let cursor = 0;
      const linhas = ['Plano da semana:'];

      for (let i = 0; i < 7; i += 1) {
        const data = new Date();
        data.setDate(data.getDate() + i);
        const diaSemana = data.getDay();
        const aulas = (this.context.classSchedule || []).filter(a => Number(a?.dia) === diaSemana);
        const materia = materias[cursor % materias.length];
        cursor += 1;

        linhas.push(`\n${dias[diaSemana]} (${formatDate(data)})`);
        if (aulas.length) {
          linhas.push(`Aulas: ${aulas.map(a => `${a.materia} ${a.inicio}-${a.fim}`).join(' | ')}`);
        }
        linhas.push(`Estudo principal: ${materia.nome} • ${this._labelForStudyType(materia.tipoSugestao)} • ${materia.duracaoBase} min.`);
        linhas.push(`Foco do dia: ${materia.metaSemanal}.`);
      }

      return linhas.join('\n');
    }

    generateDailyPlan() {
      const prioridades = this._getMatterPriorityList();
      if (!prioridades.length) return [];
      return prioridades.slice(0, 4).map(item => ({
        materia: item.nome,
        tipo: item.tipoSugestao,
        duracao: item.duracaoBase,
        motivo: item.justificativaCurta
      }));
    }

    async ask(pergunta) {
      const texto = String(pergunta || '').trim();
      const p = texto.toLowerCase();

      if (!texto) {
        return 'Manda uma pergunta que eu respondo com base nos seus dados reais do site.';
      }

      const materiaEncontrada = this._findSubjectInQuestion(texto);

      if (p.includes('o que devo estudar agora') || p.includes('oque estudar agora') || p.includes('o que estudar')) {
        return this.sugerirEstudoAgora();
      }

      if (p.includes('risco acadêmico') || p.includes('risco academico') || p.includes('como está meu risco') || p.includes('como esta meu risco')) {
        return this.analisarRiscoAcademico();
      }

      if (p.includes('plano de estudo para hoje') || p.includes('plano para hoje') || p.includes('hoje eu estudo o que')) {
        return this.gerarPlanoHoje();
      }

      if (p.includes('plano para a semana') || p.includes('plano semanal') || p.includes('semana')) {
        return this.gerarPlanoSemanal();
      }

      if (p.includes('próximas provas') || p.includes('proximas provas') || p.includes('provas') || p.includes('trabalhos')) {
        return this.listarProvas();
      }

      if (p.includes('revisão') || p.includes('revisao') || p.includes('revisões') || p.includes('revisoes')) {
        return this.listarRevisoes();
      }

      if (p.includes('próxima aula') || p.includes('proxima aula')) {
        return this.getProximaAulaInfo();
      }

      if (p.includes('dica de estudo') || p.includes('me dá uma dica') || p.includes('me de uma dica')) {
        return this.getDicaEstudo();
      }

      if ((p.includes('dificuldade') || p.includes('matéria difícil') || p.includes('materia dificil')) && materiaEncontrada) {
        return this.preverDificuldadeMateria(materiaEncontrada.nome);
      }

      if (materiaEncontrada && (p.includes('como estou') || p.includes('como tá') || p.includes('como ta') || p.includes('situação') || p.includes('situacao'))) {
        return this._buildSubjectStatusAnswer(materiaEncontrada.nome);
      }

      if (materiaEncontrada && (p.includes('quanto estudei') || p.includes('horas') || p.includes('estudei'))) {
        const horas = this.getHorasEstudadasMateria(materiaEncontrada.nome);
        return `Você estudou ${horas.toFixed(1)}h de ${materiaEncontrada.nome} no total.${horas < 3 ? ' Ainda está pouco para ter folga na matéria.' : ''}`;
      }

      return [
        'Posso responder com base nos seus dados reais.',
        'Perguntas que funcionam muito bem:',
        '- qual meu plano de hoje?',
        '- quais os riscos acadêmicos?',
        '- próximas provas?',
        '- qual a próxima aula?',
        '- como estou em [nome da matéria]?'
      ].join('\n');
    }

    _buildSubjectStatusAnswer(materiaNome) {
      const subject = (this.context.subjects || []).find(item => item?.nome === materiaNome);
      if (!subject) return `Não achei a matéria ${materiaNome}.`;

      const horas = this.getHorasEstudadasMateria(materiaNome);
      const minutos7d = this.getMinutosEstudadosUltimosDias(materiaNome, 7);
      const notas = (this.context.grades || []).filter(item => item?.materia === materiaNome);
      const media = weightedAverage(notas);
      const prova = this.getProximasProvas(21).find(item => item?.materia === materiaNome);
      const faltas = this.getFaltasMateria(materiaNome);
      const ultimaAula = this.getUltimaAulaRegistrada(materiaNome);

      const partes = [
        `Status de ${materiaNome}:`,
        `- dificuldade cadastrada: ${Number(subject?.dificuldade) || 3}/5`,
        `- horas estudadas no total: ${horas.toFixed(1)}h`,
        `- estudo nos últimos 7 dias: ${formatHours(minutos7d)}`,
      ];

      if (notas.length) partes.push(`- média atual: ${media.toFixed(1)}`);
      if (prova) partes.push(`- próxima avaliação: ${formatDate(prova.data)} (${diffDays(prova.data)} dia(s))`);
      if (faltas) partes.push(`- faltas registradas: ${faltas}`);
      if (ultimaAula?.conteudo) partes.push(`- último conteúdo anotado: ${ultimaAula.conteudo}`);

      let conclusao = 'Situação controlada.';
      if (prova && diffDays(prova.data) <= 7 && horas < 4) conclusao = 'Situação de atenção: avaliação próxima e pouca carga de estudo.';
      else if (notas.length && media < 6) conclusao = 'Situação de risco: média baixa.';
      else if ((Number(subject?.dificuldade) || 3) >= 4 && minutos7d < 90) conclusao = 'Situação de atenção: matéria difícil com pouco estudo recente.';

      partes.push(`- leitura do mentor: ${conclusao}`);
      return partes.join('\n');
    }

    _getMatterPriorityList() {
      const subjects = this.context.subjects || [];
      const provas = this.getProximasProvas(21);
      const revisoesHoje = this.getRevisoesPendentes();
      const tarefas = (this.context.tasks || []).filter(item => !item?.concluida);
      const topicos = this.context.learningMap || [];

      const list = subjects.map(subject => {
        const nome = subject?.nome;
        const horasTotal = this.getHorasEstudadasMateria(nome);
        const minutos7d = this.getMinutosEstudadosUltimosDias(nome, 7);
        const notas = (this.context.grades || []).filter(item => item?.materia === nome);
        const media = weightedAverage(notas);
        const provaProxima = provas.find(item => item?.materia === nome);
        const revisoes = revisoesHoje.filter(item => item?.materia === nome);
        const tarefasPendentes = tarefas.filter(item => item?.materia === nome);
        const topicosAtrasados = topicos.filter(item => item?.materia === nome && (item?.status === 'estudando' || item?.status === 'revisando') && daysSince(item?.ultimaRevisao) > 7);
        const faltas = this.getFaltasMateria(nome);
        const ultimaAula = this.getUltimaAulaRegistrada(nome);

        let score = 0;
        const motivos = [];

        const dificuldade = Number(subject?.dificuldade) || 3;
        score += dificuldade * 5;
        if (dificuldade >= 4) motivos.push('é uma matéria difícil para você');

        if (provaProxima) {
          const dias = Math.max(0, diffDays(provaProxima.data));
          const pesoUrgencia = Math.max(0, 24 - dias);
          score += pesoUrgencia * 4;
          motivos.push(`tem avaliação em ${dias} dia(s)`);
        }

        if (tarefasPendentes.length) {
          score += tarefasPendentes.length * 8;
          motivos.push(`tem ${tarefasPendentes.length} tarefa(s) pendente(s)`);
        }

        if (revisoes.length) {
          score += revisoes.length * 10;
          motivos.push(`tem revisão pendente hoje`);
        }

        if (topicosAtrasados.length) {
          score += topicosAtrasados.length * 7;
          motivos.push(`há tópico(s) sem revisão recente`);
        }

        if (horasTotal < 3) {
          score += 14;
          motivos.push(`você ainda estudou pouco essa matéria`);
        } else if (horasTotal < 6) {
          score += 7;
        }

        if (minutos7d < 90) {
          score += 10;
          motivos.push(`o estudo recente está baixo`);
        }

        if (notas.length) {
          if (media < 6) {
            score += 18;
            motivos.push(`a média está baixa`);
          } else if (media < 7) {
            score += 8;
            motivos.push(`a média ainda não está confortável`);
          }
        }

        if (faltas > 0) {
          score += faltas * 4;
          motivos.push(`${faltas} falta(s) registrada(s)`);
        }

        const justificativaCurta = motivos.length
          ? motivos.slice(0, 3).join(', ')
          : 'está equilibrada, mas ainda vale manter constância';

        const tipoSugestao = provaProxima ? 'exercicios' : revisoes.length ? 'revisao' : topicosAtrasados.length ? 'revisao' : 'teoria';
        const duracaoBase = provaProxima ? 60 : dificuldade >= 4 ? 50 : 40;
        const metaSemanal = provaProxima
          ? 'priorize exercícios e correção de erros'
          : tarefasPendentes.length
            ? 'avance nas pendências e feche um conteúdo'
            : 'ganhe constância com teoria + exercícios curtos';

        const planoRapido = provaProxima
          ? '15 min de revisão + 35 min de exercícios + 10 min corrigindo erros'
          : revisoes.length
            ? '20 min revisando anotações + 25 min testando memória ativa'
            : '25 min de teoria prática + 20 min de exercício ou resumo';

        return {
          nome,
          score,
          justificativaCurta: justificativaCurta.charAt(0).toUpperCase() + justificativaCurta.slice(1),
          tipoSugestao,
          duracaoBase,
          metaSemanal,
          planoRapido,
          provaProxima,
          ultimaAula
        };
      });

      return list.sort((a, b) => b.score - a.score);
    }

    _findSubjectInQuestion(question) {
      const normalized = String(question || '').toLowerCase();
      return (this.context.subjects || [])
        .find(item => normalized.includes(String(item?.nome || '').toLowerCase()));
    }

    _timeToMinutes(value) {
      if (!value || !String(value).includes(':')) return NaN;
      const [h, m] = String(value).split(':').map(Number);
      if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
      return h * 60 + m;
    }

    _weekdayName(index) {
      return ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][index] || 'dia indefinido';
    }

    _labelForStudyType(type) {
      if (type === 'revisao') return 'revisão';
      if (type === 'exercicios') return 'exercícios';
      if (type === 'pratica') return 'prática';
      return 'teoria';
    }
  }

  window.AIAssistant = AIAssistant;
  window.aiAssistant = new AIAssistant();
})();


// __mentor_upgrade_v4__
(function () {
  if (!window.AIAssistant || window.AIAssistant.prototype.__mentorUpgradePatched) return;
  const proto = window.AIAssistant.prototype;

  proto.getMemorySnapshot = function () {
    const weak = this._getMatterPriorityList().slice(0, 3).map(item => item.nome);
    const exams = this.getProximasProvas(10).slice(0, 3).map(item => `${item.materia} (${diffDays(item.data)}d)`);
    const reviews = this.getRevisoesPendentes().slice(0, 3).map(item => item.materia);
    return { weak, exams, reviews };
  };

  proto.generateDailyPlan = function () {
    const prioridades = this._getMatterPriorityList();
    if (!prioridades.length) return [];
    const userHours = Math.max(2, Math.min(8, Number(this.context.user?.horasMaximas) || 4));
    let remaining = userHours * 60;
    return prioridades.slice(0, 5).map((item, index) => {
      const base = item.provaProxima ? 60 : item.revisoesPendentes ? 35 : index === 0 ? 50 : 40;
      const duracao = Math.max(25, Math.min(base, remaining));
      remaining -= duracao;
      return {
        materia: item.nome,
        tipo: item.tipoSugestao,
        duracao,
        prioridade: item.score >= 80 ? 'danger' : item.score >= 55 ? 'warning' : 'success',
        motivo: `${item.justificativaCurta}${item.provaProxima ? ` • avaliação em ${diffDays(item.provaProxima.data)} dia(s)` : ''}`
      };
    }).filter(item => item.duracao > 0);
  };

  proto._getMatterPriorityList = function () {
    const subjects = this.context.subjects || [];
    const provas = this.getProximasProvas(21);
    const revisoesHoje = this.getRevisoesPendentes();
    const tarefas = (this.context.tasks || []).filter(item => !item?.concluida);
    const topicos = this.context.learningMap || [];

    return subjects.map(subject => {
      const nome = subject?.nome;
      const horasTotal = this.getHorasEstudadasMateria(nome);
      const minutos7d = this.getMinutosEstudadosUltimosDias(nome, 7);
      const notas = (this.context.grades || []).filter(item => item?.materia === nome);
      const media = weightedAverage(notas);
      const provaProxima = provas.find(item => item?.materia === nome);
      const revisoes = revisoesHoje.filter(item => item?.materia === nome);
      const tarefasPendentes = tarefas.filter(item => item?.materia === nome);
      const topicosAtrasados = topicos.filter(item => item?.materia === nome && (item?.status === 'estudando' || item?.status === 'revisando') && daysSince(item?.ultimaRevisao) > 7);
      const faltas = this.getFaltasMateria(nome);
      const ultimaAula = this.getUltimaAulaRegistrada(nome);
      const attendance = (this.context.classDiaries || []).filter(item => item?.materia === nome);
      const taxaPresenca = attendance.length ? Math.round((attendance.filter(item => item?.presenca === 'present').length / attendance.length) * 100) : 100;

      let score = 0;
      const motivos = [];
      const dificuldade = Number(subject?.dificuldade) || 3;
      score += dificuldade * 5;
      if (dificuldade >= 4) motivos.push('é uma matéria difícil para você');

      if (provaProxima) {
        const dias = Math.max(0, diffDays(provaProxima.data));
        score += Math.max(0, 26 - dias) * 4;
        motivos.push(`tem avaliação em ${dias} dia(s)`);
      }
      if (tarefasPendentes.length) {
        score += tarefasPendentes.length * 8;
        motivos.push(`tem ${tarefasPendentes.length} tarefa(s) pendente(s)`);
      }
      if (revisoes.length) {
        score += revisoes.length * 11;
        motivos.push('tem revisão pendente hoje');
      }
      if (topicosAtrasados.length) {
        score += topicosAtrasados.length * 7;
        motivos.push('há tópico sem revisão recente');
      }
      if (horasTotal < 3) {
        score += 16;
        motivos.push('você estudou pouco essa matéria');
      } else if (horasTotal < 6) {
        score += 7;
      }
      if (minutos7d < 90) {
        score += 11;
        motivos.push('o estudo recente está baixo');
      }
      if (notas.length) {
        if (media < 6) {
          score += 18;
          motivos.push('a média está baixa');
        } else if (media < 7) {
          score += 8;
          motivos.push('a média ainda não está confortável');
        }
      }
      if (faltas > 0 || taxaPresenca < 80) {
        score += Math.max(faltas * 4, taxaPresenca < 80 ? 10 : 0);
        motivos.push(`presença em ${taxaPresenca}% das aulas`);
      }

      const tipoSugestao = provaProxima ? 'exercicios' : revisoes.length || topicosAtrasados.length ? 'revisao' : 'teoria';
      const duracaoBase = provaProxima ? 60 : dificuldade >= 4 ? 50 : 40;
      const metaSemanal = provaProxima ? 'priorize exercícios e correção de erros' : tarefasPendentes.length ? 'feche pendências e avance um conteúdo' : 'ganhe constância com teoria e prática';
      const justificativaCurta = motivos.length ? motivos.slice(0, 3).join(', ') : 'está equilibrada, mas vale manter constância';

      return {
        nome,
        score,
        justificativaCurta: justificativaCurta.charAt(0).toUpperCase() + justificativaCurta.slice(1),
        tipoSugestao,
        duracaoBase,
        metaSemanal,
        provaProxima,
        ultimaAula,
        revisoesPendentes: revisoes.length,
        tarefasPendentes: tarefasPendentes.length,
        attendance: taxaPresenca,
        media: Number.isFinite(media) ? media : 0,
        planoRapido: provaProxima ? '15 min de revisão + 35 min de exercícios + 10 min corrigindo erros' : revisoes.length ? '20 min revisando anotações + 25 min de memória ativa' : '25 min teoria prática + 20 min exercícios'
      };
    }).sort((a, b) => b.score - a.score);
  };

  const originalAsk = proto.ask;
  proto.ask = async function (pergunta) {
    const texto = String(pergunta || '').trim();
    const p = texto.toLowerCase();
    const materia = this._findSubjectInQuestion(texto);
    const memory = this.getMemorySnapshot();

    if (p.includes('recuperação') || p.includes('recuperacao') || p.includes('anti procrast') || p.includes('procrast')) {
      const plano = window.app?.getRecoveryPlan?.(3);
      if (!plano) return 'Ainda não vi sinais fortes de acúmulo. Continue mantendo constância.';
      return [
        `Modo recuperação: ${plano.reason}.`,
        ...plano.days.map((item, index) => `${index + 1}. ${item.date} — foco em ${item.focus}: ${item.action}. Extra: ${item.extra}.`)
      ].join('\n');
    }

    if (p.includes('meta') || p.includes('metas')) {
      const goals = window.app?.getStudyGoalsSnapshot?.();
      if (!goals) return 'Cadastre mais dados para eu acompanhar suas metas.';
      return `Metas atuais: ${goals.weeklyHours.toFixed(1)}h/${goals.goals.weeklyHours}h na semana, ${goals.monthlyHours.toFixed(1)}h/${goals.goals.monthlyHours}h no mês, ${goals.weeklyPomodoros}/${goals.goals.weeklyPomodoros} pomodoros e ${goals.weeklyReviewsDone}/${goals.goals.weeklyReviews} revisões.`;
    }

    if (p.includes('relatório') || p.includes('relatorio') || p.includes('resumo da semana')) {
      const report = window.app?.getAutoReports?.();
      if (!report) return 'Ainda faltam dados para um relatório confiável.';
      return `${report.daily}

${report.weekly}

${report.monthly}`;
    }

    if (materia && (p.includes('próxima nota') || p.includes('proxima nota') || p.includes('quanto preciso'))) {
      const perf = window.app?.getSubjectPerformance?.(materia.nome);
      if (!perf) return `Não encontrei dados suficientes de ${materia.nome}.`;
      return `Para ${materia.nome}, sua média atual está em ${perf.average.toFixed(1)}. Para buscar a meta desejada, a próxima nota ideal seria perto de ${perf.nextRequiredGrade}. ${perf.recommendation}`;
    }

    if (materia && (p.includes('como estou') || p.includes('situação') || p.includes('situacao'))) {
      const perf = window.app?.getSubjectPerformance?.(materia.nome);
      if (perf) {
        return [
          `Raio-x de ${materia.nome}:`,
          `- média atual: ${perf.average > 0 ? perf.average.toFixed(1) : 'sem notas ainda'}`,
          `- horas estudadas: ${perf.hours.toFixed(1)}h`,
          `- presença: ${perf.attendance}%`,
          `- tarefas pendentes: ${perf.tasksPending}`,
          `- provas futuras: ${perf.upcomingExamsCount}`,
          `- risco: ${perf.riskLevel} (${perf.riskReason})`,
          `- recomendação: ${perf.recommendation}`
        ].join('\n');
      }
    }

    if (p.includes('memória') || p.includes('memoria') || p.includes('lembra do que eu preciso')) {
      return `O que mais pede atenção agora: ${memory.weak.join(', ') || 'nenhuma matéria crítica'}. Provas próximas: ${memory.exams.join(', ') || 'nenhuma'}. Revisões de hoje: ${memory.reviews.join(', ') || 'nenhuma'}.`;
    }

    return originalAsk.call(this, pergunta);
  };

  proto.__mentorUpgradePatched = true;
})();
