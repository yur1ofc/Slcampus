// script.js - Inicialização principal + melhorias avançadas
(function () {
  const PATCH_FLAG = '__slc_ultra_patch_v4__';

  function el(id) { return document.getElementById(id); }
  function normalizeText(value) { return String(value ?? '').trim().replace(/\s+/g, ' ').toLowerCase(); }
  function normalizeDateValue(value) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return normalizeText(value);
    return date.toISOString();
  }
  function stableValue(value) {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.map(stableValue).join('|');
    if (typeof value === 'object') {
      return Object.keys(value).sort().map(key => `${key}:${stableValue(value[key])}`).join('|');
    }
    return normalizeText(value);
  }
  function signatureForItem(collection, item) {
    const ignored = new Set(['id','createdAt','updatedAt','timestamp','uid','_tempId','__localId','ultimaAtualizacao','ultimaInteracao','streak','lastStudyDate']);
    const clone = {};
    Object.keys(item || {}).sort().forEach(key => {
      if (ignored.has(key)) return;
      const value = item[key];
      clone[key] = ['data','dataLimite','inicio','fim'].includes(key) ? normalizeDateValue(value) : stableValue(value);
    });
    return `${collection}::${JSON.stringify(clone)}`;
  }
  function dedupeCollection(collection, items) {
    if (!Array.isArray(items)) return items;
    const byId = new Set();
    const bySignature = new Set();
    const result = [];
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const id = item.id ? String(item.id) : '';
      const signature = signatureForItem(collection, item);
      if (id && byId.has(id)) continue;
      if (bySignature.has(signature)) continue;
      if (id) byId.add(id);
      bySignature.add(signature);
      result.push(item);
    }
    return result;
  }

  function injectStyles() {
    if (el('slc-ultra-styles')) return;
    const style = document.createElement('style');
    style.id = 'slc-ultra-styles';
    style.textContent = `
      .dashboard-grid--smart,.goal-grid,.subject-performance-grid,.agenda-grid,.situation-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;}
      .today-hero{display:grid;grid-template-columns:1.5fr 1fr;gap:18px;margin-bottom:20px;}
      .today-panel,.summary-panel,.goal-card,.subject-performance-card,.agenda-card,.situation-card,.report-card{background:rgba(15,23,42,.24);border:1px solid rgba(148,163,184,.14);border-radius:22px;padding:18px;box-shadow:0 8px 24px rgba(2,6,23,.18);}
      .today-checklist{display:grid;gap:10px;margin-top:14px;}
      .today-check{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding:12px 14px;background:rgba(15,23,42,.18);border-radius:16px;}
      .today-check small,.agenda-item small,.subject-performance-card small{display:block;opacity:.78;margin-top:3px;}
      .today-badge,.risk-pill,.phase-pill,.calendar-filter-btn{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:6px 12px;font-size:.8rem;font-weight:700;background:rgba(59,130,246,.14);border:1px solid rgba(59,130,246,.18);}
      .risk-pill.alto,.calendar-filter-btn.active[data-filter="risco"]{background:rgba(239,68,68,.14);border-color:rgba(239,68,68,.2)}
      .risk-pill.medio{background:rgba(245,158,11,.14);border-color:rgba(245,158,11,.2)}
      .risk-pill.baixo{background:rgba(16,185,129,.14);border-color:rgba(16,185,129,.2)}
      .goal-card .progress-bar,.subject-performance-card .progress-bar{margin-top:10px;}
      .goal-stat{display:flex;justify-content:space-between;gap:10px;font-size:.9rem;margin-bottom:8px;}
      .goal-edit-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-top:14px;}
      .goal-edit-grid input{width:100%;padding:10px 12px;border-radius:14px;border:1px solid rgba(148,163,184,.16);background:rgba(15,23,42,.12);color:inherit;}
      .subject-performance-head,.agenda-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start;margin-bottom:10px;}
      .subject-performance-metrics{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0;}
      .subject-metric{padding:10px 12px;border-radius:16px;background:rgba(15,23,42,.12);}
      .subject-metric strong{display:block;font-size:1.05rem;margin-top:4px;}
      .agenda-filters{display:flex;flex-wrap:wrap;gap:8px;margin:14px 0;}
      .agenda-list{display:grid;gap:10px;}
      .agenda-item{display:flex;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:16px;background:rgba(15,23,42,.12);}
      .focus-cycle-card{margin-top:18px;padding:18px;border-radius:18px;border:1px solid rgba(99,102,241,.18);background:linear-gradient(135deg,rgba(99,102,241,.1),rgba(59,130,246,.08));}
      .focus-cycle-top{display:flex;flex-wrap:wrap;gap:12px;justify-content:space-between;align-items:center;margin-bottom:14px;}
      .focus-phase-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;font-size:.86rem;font-weight:700;background:rgba(15,23,42,.14);}
      .focus-next-action{display:none;margin-top:12px;gap:10px;flex-wrap:wrap;}.focus-next-action.is-visible{display:flex;}
      .focus-hints{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:14px;}
      .compact-weekly-schedule .weekly-timeline{border:1px solid rgba(148,163,184,.2);border-radius:18px;overflow:hidden;background:rgba(15,23,42,.15);}
      .compact-weekly-schedule .weekly-timeline-header{position:sticky;top:0;z-index:2;background:rgba(15,23,42,.94);backdrop-filter:blur(10px);}
      .compact-weekly-schedule .weekly-day-header,.compact-weekly-schedule .weekly-time-spacer{min-height:44px;display:flex;align-items:center;justify-content:center;font-size:.82rem;}
      .compact-weekly-schedule .weekly-time-column{width:62px;}
      .compact-weekly-schedule .weekly-time-slot{font-size:.75rem;padding-right:10px;}
      .compact-weekly-schedule .weekly-event-block{border-radius:14px;box-shadow:0 6px 18px rgba(15,23,42,.16);overflow:hidden;}
      .compact-weekly-schedule .event-content{padding:8px 9px;font-size:.78rem;line-height:1.2;}.compact-weekly-schedule .event-content strong{display:block;font-size:.8rem;margin-bottom:4px;}
      .mentor-highlight-box{margin:14px 0 18px;padding:16px 18px;border-radius:18px;background:linear-gradient(135deg,rgba(16,185,129,.10),rgba(59,130,246,.08));border:1px solid rgba(16,185,129,.16);}
      .mentor-highlight-box h3{margin:0 0 8px;font-size:1rem;}.mentor-highlight-box p{margin:0;opacity:.95;}
      .situation-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:16px;}
      .situation-kpi{padding:14px;border-radius:18px;background:rgba(15,23,42,.12);}
      .situation-list{display:grid;gap:10px;}
      .report-stack{display:grid;gap:14px;margin-top:18px;}
      .calendar-grid + .agenda-filters{margin-top:18px;}
      @media (max-width: 980px){.today-hero{grid-template-columns:1fr;}}
      @media (max-width: 820px){.compact-weekly-schedule{overflow-x:auto;}.compact-weekly-schedule .weekly-timeline{min-width:860px;}}
    `;
    document.head.appendChild(style);
  }

  function patchDbService() {
    if (!window.dbService || window.dbService.__dedupePatched) return;
    const originalSaveAllData = window.dbService.saveAllData?.bind(window.dbService);
    const originalSaveData = window.dbService.saveData?.bind(window.dbService);
    if (originalSaveAllData) {
      window.dbService.saveAllData = async function (dataOverride = null) {
        const payload = dataOverride || window.app?.data || {};
        Object.keys(payload).forEach(key => { if (Array.isArray(payload[key])) payload[key] = dedupeCollection(key, payload[key]); });
        if (window.app?.data) window.app.data = payload;
        return originalSaveAllData(payload);
      };
    }
    if (originalSaveData) {
      window.dbService.saveData = async function (field, data) {
        const clean = Array.isArray(data) ? dedupeCollection(field, data) : data;
        if (window.app?.data && field) window.app.data[field] = clean;
        return originalSaveData(field, clean);
      };
    }
    window.dbService.__dedupePatched = true;
  }

  function calculateCompactHourHeight(manager) {
    const horarios = (manager?.aulas || window.app?.data?.classSchedule || []).map(item => [item?.inicio, item?.fim]).flat().filter(Boolean)
      .map(value => String(value).split(':').map(Number)).filter(parts => parts.length === 2 && parts.every(Number.isFinite));
    const earliest = horarios.length ? Math.min(...horarios.map(([h]) => h)) : (manager?.HORARIO_INICIO || 7);
    const latest = horarios.length ? Math.max(...horarios.map(([h]) => h)) : (manager?.HORARIO_FIM || 22);
    const total = Math.max(8, (latest - earliest) + 2);
    const available = Math.max(420, window.innerHeight - 290);
    return Math.max(26, Math.min(52, Math.floor(available / total)));
  }

  function ensureFocusState(app) {
    if (!app.focusCycleState) {
      app.focusCycleState = { phase: 'focus', lastFocusMinutes: 25, shortBreakMinutes: 15, heavyMinutes: 90, longFocusMinutes: 50, canAdvance: false, completedFocusBlocks: 0 };
    }
    return app.focusCycleState;
  }

  function updateFocusUI(app) {
    const state = ensureFocusState(app);
    const display = el('timer-display');
    const phase = el('focus-phase-label');
    const summary = el('focus-cycle-summary');
    const nextBox = el('focus-next-action');
    const nextBtn = el('focus-next-button');
    if (display) {
      const seconds = Math.max(0, Number(app.timerSeconds) || 0);
      const min = Math.floor(seconds / 60); const sec = seconds % 60;
      display.textContent = `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    }
    if (phase) phase.innerHTML = state.phase === 'break' ? '<i class="fas fa-mug-hot"></i> Descanso' : '<i class="fas fa-brain"></i> Foco';
    if (summary) summary.textContent = state.phase === 'break' ? 'Quando esse descanso acabar, você volta para o foco com um clique.' : `Blocos de foco concluídos hoje: ${state.completedFocusBlocks}.`;
    if (nextBox) nextBox.classList.toggle('is-visible', !!state.canAdvance);
    if (nextBtn) nextBtn.textContent = state.phase === 'break' ? 'Iniciar foco' : 'Iniciar descanso';
  }

  function configureFocusMode(app, mode) {
    const state = ensureFocusState(app);
    if (mode === 'focus') { state.phase = 'focus'; state.lastFocusMinutes = 25; app.timerDuration = 25 * 60; }
    if (mode === 'long-focus') { state.phase = 'focus'; state.lastFocusMinutes = state.longFocusMinutes; app.timerDuration = state.longFocusMinutes * 60; }
    if (mode === 'heavy-focus') { state.phase = 'focus'; state.lastFocusMinutes = state.heavyMinutes; app.timerDuration = state.heavyMinutes * 60; }
    if (mode === 'break') { state.phase = 'break'; app.timerDuration = state.shortBreakMinutes * 60; }
    app.timerSeconds = app.timerDuration; state.canAdvance = false; updateFocusUI(app);
  }

  function bindFocusButtons(app) {
    if (!app || app.currentView !== 'foco') return;
    const start = el('timer-start'); const longBtn = el('focus-long-start'); const heavyBtn = el('focus-heavy-start'); const breakBtn = el('focus-break-start'); const nextBtn = el('focus-next-button');
    if (start) start.onclick = () => { configureFocusMode(app, 'focus'); app.startTimer(); };
    if (longBtn) longBtn.onclick = () => { configureFocusMode(app, 'long-focus'); app.startTimer(); };
    if (heavyBtn) heavyBtn.onclick = () => { configureFocusMode(app, 'heavy-focus'); app.startTimer(); };
    if (breakBtn) breakBtn.onclick = () => { configureFocusMode(app, 'break'); app.startTimer(); };
    if (nextBtn) nextBtn.onclick = () => { const state = ensureFocusState(app); configureFocusMode(app, state.phase === 'break' ? 'focus' : 'break'); app.startTimer(); };
    updateFocusUI(app);
  }

  function patchFocusTimer() {
    if (!window.StudyLifeControl || window.StudyLifeControl.prototype.__focusEnhanced) return;
    const proto = window.StudyLifeControl.prototype;
    proto.startTimer = function () {
      const state = ensureFocusState(this);
      if (!this.timerDuration) this.timerDuration = (state.phase === 'break' ? state.shortBreakMinutes : state.lastFocusMinutes) * 60;
      if (!this.timerSeconds) this.timerSeconds = this.timerDuration;
      if (this.timerRunning) return;
      this.timerRunning = true;
      clearInterval(this.timerInterval);
      this.timerInterval = setInterval(async () => {
        this.timerSeconds = Math.max(0, (this.timerSeconds || 0) - 1);
        updateFocusUI(this);
        if (this.timerSeconds <= 0) {
          clearInterval(this.timerInterval);
          this.timerRunning = false;
          state.canAdvance = true;
          if (state.phase === 'focus') {
            state.completedFocusBlocks += 1;
            const item = { id: generateId(), materia: 'Modo Foco', tipo: 'foco', duracao: Math.round((this.timerDuration || 0) / 60), data: new Date().toISOString(), concluida: true, topico: 'Bloco de foco concluído' };
            await dbService.addItem('sessions', item);
            if (window.reviewSystem?.gerarRevisoesFromSessao) await window.reviewSystem.gerarRevisoesFromSessao(item);
            showToast('Bloco de foco concluído. Hora do descanso.', 'success');
          } else {
            showToast('Descanso concluído. Bora voltar para o foco.', 'info');
          }
          updateFocusUI(this);
          if (this.currentView === 'foco') {
            const list = el('sessoes-foco-hoje');
            if (list && this.viewRenderer?.renderSessoesFocoHoje) list.innerHTML = this.viewRenderer.renderSessoesFocoHoje();
          }
        }
      }, 1000);
      updateFocusUI(this);
    };
    proto.pauseTimer = function () { clearInterval(this.timerInterval); this.timerRunning = false; updateFocusUI(this); };
    proto.resetTimer = function () { const state = ensureFocusState(this); clearInterval(this.timerInterval); this.timerRunning = false; this.timerDuration = (state.phase === 'break' ? state.shortBreakMinutes : state.lastFocusMinutes) * 60; this.timerSeconds = this.timerDuration; state.canAdvance = false; updateFocusUI(this); };
    proto.__focusEnhanced = true;
  }

  function renderTodayHero(view) {
    const snap = view.app.getHojeInteligenteData();
    const progress = snap.todayProgress;
    return `
      <div class="today-hero">
        <div class="today-panel">
          <div class="subject-performance-head">
            <div>
              <h3><i class="fas fa-bolt"></i> Modo Hoje</h3>
              <small>Só o que importa agora para você.</small>
            </div>
            <span class="today-badge"><i class="fas fa-stopwatch"></i> Pomodoro sugerido: ${snap.pomodoroMinutes} min</span>
          </div>
          <div class="today-checklist">
            <div class="today-check"><div><strong>${snap.currentClass ? 'Aula agora' : 'Próxima aula'}</strong><small>${snap.currentClass ? `${view.esc(snap.currentClass.materia)} até ${view.esc(snap.currentClass.fim)}` : snap.nextClass ? `${view.esc(snap.nextClass.materia)} • ${view.esc(snap.nextClass.inicio)}-${view.esc(snap.nextClass.fim)}` : 'Sem aula próxima cadastrada'}</small></div><span class="risk-pill baixo">${snap.currentClass ? 'ao vivo' : 'agenda'}</span></div>
            <div class="today-check"><div><strong>Tarefas vencendo</strong><small>${snap.urgentTasks.length ? snap.urgentTasks.map(t => `${view.esc(t.titulo)} (${Math.max(0, diasAte(t.dataLimite))}d)`).join(' • ') : 'Nenhuma urgente agora'}</small></div><span class="risk-pill ${snap.urgentTasks.length ? 'medio' : 'baixo'}">${snap.urgentTasks.length}</span></div>
            <div class="today-check"><div><strong>Revisões do dia</strong><small>${snap.reviewsToday.length ? snap.reviewsToday.map(r => `${view.esc(r.materia)}: ${view.esc(r.topico || 'revisão geral')}`).join(' • ') : 'Nada pendente hoje'}</small></div><span class="risk-pill ${snap.reviewsToday.length ? 'medio' : 'baixo'}">${snap.reviewsToday.length}</span></div>
            <div class="today-check"><div><strong>Meta de estudo</strong><small>${Number(progress.concluido).toFixed(1)}h concluídas de ${snap.dailyTargetHours}h hoje.</small></div><span class="risk-pill ${Number(progress.percentual) >= 70 ? 'baixo' : 'medio'}">${Math.round(Number(progress.percentual)||0)}%</span></div>
            <div class="today-check"><div><strong>Prioridade real</strong><small>${snap.topSuggestion ? `<strong>${view.esc(snap.topSuggestion.materia)}</strong> — ${view.esc(snap.topSuggestion.tipo)} por ${view.esc(snap.topSuggestion.duracao)} min. ${view.esc(snap.topSuggestion.motivo)}` : 'Cadastre mais dados para a IA sugerir melhor.'}</small></div><span class="risk-pill ${snap.risk.length ? 'alto' : 'baixo'}">${snap.risk.length ? 'atenção' : 'ok'}</span></div>
          </div>
        </div>
        <div class="summary-panel">
          <h3><i class="fas fa-shield-alt"></i> Alerta de risco real</h3>
          ${snap.risk.length ? snap.risk.slice(0, 4).map(item => `<div class="agenda-item"><div><strong>${view.esc(item.materia)}</strong><small>${view.esc(item.motivo)}</small></div><span class="risk-pill ${view.esc(item.nivel)}">${view.esc(item.nivel)}</span></div>`).join('') : '<p class="text-secondary">Nenhum alerta forte agora.</p>'}
          ${snap.antiProcrastination ? `<div class="report-card" style="margin-top:14px;"><strong>Modo recuperação</strong><small>${view.esc(snap.antiProcrastination.reason)}</small>${snap.antiProcrastination.days.map(day => `<div class="agenda-item"><div><strong>${view.esc(day.date)}</strong><small>${view.esc(day.focus)} — ${view.esc(day.action)}<br>${view.esc(day.extra)}</small></div></div>`).join('')}</div>` : ''}
        </div>
      </div>`;
  }

  function renderGoalsPanel(view) {
    const goals = view.app.getStudyGoalsSnapshot();
    const cards = [
      ['Horas na semana', `${goals.weeklyHours.toFixed(1)}h / ${goals.goals.weeklyHours}h`, goals.progress.weeklyHours],
      ['Horas no mês', `${goals.monthlyHours.toFixed(1)}h / ${goals.goals.monthlyHours}h`, goals.progress.monthlyHours],
      ['Pomodoros', `${goals.weeklyPomodoros} / ${goals.goals.weeklyPomodoros}`, goals.progress.weeklyPomodoros],
      ['Tarefas concluídas', `${goals.weeklyTasksDone} / ${goals.goals.weeklyTasks}`, goals.progress.weeklyTasks],
      ['Revisões concluídas', `${goals.weeklyReviewsDone} / ${goals.goals.weeklyReviews}`, goals.progress.weeklyReviews]
    ];
    return `
      <div class="card"><div class="card-header"><h3><i class="fas fa-bullseye"></i> Metas semanais e mensais</h3></div><div class="card-body">
        <div class="goal-grid">${cards.map(([label, value, progress]) => `<div class="goal-card"><div class="goal-stat"><span>${label}</span><strong>${value}</strong></div><div class="progress-bar"><div class="progress-fill" style="width:${progress}%"></div></div><small>${progress}% da meta</small></div>`).join('')}</div>
        <div class="goal-edit-grid">
          <input type="number" id="goal-weekly-hours" value="${goals.goals.weeklyHours}" min="1" placeholder="Horas semanais">
          <input type="number" id="goal-monthly-hours" value="${goals.goals.monthlyHours}" min="1" placeholder="Horas mensais">
          <input type="number" id="goal-weekly-pomodoros" value="${goals.goals.weeklyPomodoros}" min="1" placeholder="Pomodoros">
          <input type="number" id="goal-weekly-tasks" value="${goals.goals.weeklyTasks}" min="1" placeholder="Tarefas">
          <input type="number" id="goal-weekly-reviews" value="${goals.goals.weeklyReviews}" min="1" placeholder="Revisões">
        </div>
        <div style="margin-top:12px;display:flex;justify-content:flex-end;"><button class="btn-secondary" id="save-goals-btn"><i class="fas fa-save"></i> Salvar metas</button></div>
      </div></div>`;
  }

  function renderSubjectPerformance(view) {
    const subjects = (view.app.data.subjects || []).map(s => view.app.getSubjectPerformance(s.nome)).filter(Boolean);
    return `
      <div class="subject-performance-grid">${subjects.map(item => `
        <div class="subject-performance-card">
          <div class="subject-performance-head"><div><h3>${view.esc(item.subject.nome)}</h3><small>${view.esc(item.recommendation)}</small></div><span class="risk-pill ${view.esc(item.riskLevel)}">${view.esc(item.riskLevel)}</span></div>
          <div class="subject-performance-metrics">
            <div class="subject-metric"><span>Média atual</span><strong>${item.average > 0 ? item.average.toFixed(1) : '—'}</strong></div>
            <div class="subject-metric"><span>Horas estudadas</span><strong>${item.hours.toFixed(1)}h</strong></div>
            <div class="subject-metric"><span>Frequência</span><strong>${item.attendance}%</strong></div>
            <div class="subject-metric"><span>Tarefas pendentes</span><strong>${item.tasksPending}</strong></div>
            <div class="subject-metric"><span>Provas futuras</span><strong>${item.upcomingExamsCount}</strong></div>
            <div class="subject-metric"><span>Nota ideal na próxima</span><strong>${item.nextRequiredGrade}</strong></div>
          </div>
          <div class="progress-bar"><div class="progress-fill" style="width:${Math.max(8, Math.min(100, item.attendance))}%"></div></div>
          <small>Risco atual: ${view.esc(item.riskReason)}</small>
        </div>`).join('')}</div>`;
  }

  function renderAgendaPanel(view) {
    const events = [
      ...(view.app.data.sessions || []).map(item => ({ ...item, eventType: 'sessao', when: item.data, title: item.topico || item.materia, subtitle: `${item.materia} • ${item.tipo || 'estudo'}` })),
      ...(view.app.data.tasks || []).map(item => ({ ...item, eventType: 'tarefa', when: item.dataLimite, title: item.titulo, subtitle: `${item.materia} • tarefa` })),
      ...(view.app.data.exams || []).map(item => ({ ...item, eventType: 'exame', when: item.data, title: item.titulo, subtitle: `${item.materia} • ${item.tipo || 'avaliação'}` })),
      ...(view.app.data.reviews || []).map(item => ({ ...item, eventType: 'revisao', when: item.data, title: item.topico || 'Revisão', subtitle: `${item.materia} • revisão` })),
      ...(view.app.data.classDiaries || []).map(item => ({ ...item, eventType: 'aula', when: item.data, title: item.conteudoExplicado || 'Registro de aula', subtitle: `${item.materia} • diário de aula` }))
    ].filter(item => item.when).sort((a,b) => new Date(a.when) - new Date(b.when));

    const filters = ['todos', 'sessao', 'tarefa', 'exame', 'revisao', 'aula'];
    const buttons = filters.map(filter => `<button class="calendar-filter-btn ${filter === 'todos' ? 'active' : ''}" data-filter="${filter}">${filter === 'todos' ? 'Todos' : filter}</button>`).join('');
    const list = events.slice(0, 30).map(item => `
      <div class="agenda-item" data-event-filter="${item.eventType}">
        <div><strong>${view.esc(item.title)}</strong><small>${view.esc(item.subtitle)} • ${formatarData(item.when)}</small></div>
        <span class="risk-pill ${item.eventType === 'exame' ? 'alto' : item.eventType === 'tarefa' ? 'medio' : 'baixo'}">${item.eventType}</span>
      </div>`).join('') || '<p class="text-secondary">Nenhum evento cadastrado.</p>';
    return `<div class="agenda-card"><div class="agenda-head"><div><h3><i class="fas fa-calendar-check"></i> Agenda acadêmica completa</h3><small>Provas, trabalhos, revisões, sessões e diários.</small></div></div><div class="agenda-filters">${buttons}</div><div class="agenda-list" id="agenda-list">${list}</div></div>`;
  }

  function renderSituationPage(view) {
    const summary = view.app.getAcademicSituationSummary();
    const makeList = (items, empty) => items.length ? items.map(item => `<div class="agenda-item"><div><strong>${view.esc(item.subject.nome)}</strong><small>${view.esc(item.recommendation)}</small></div><span class="risk-pill ${view.esc(item.riskLevel)}">${view.esc(item.riskLevel)}</span></div>`).join('') : `<p class="text-secondary">${empty}</p>`;
    return `
      <div class="view-header"><h2><i class="fas fa-heartbeat"></i> Situação Acadêmica</h2></div>
      <div class="situation-kpis">
        <div class="situation-kpi"><span>Matérias seguras</span><strong>${summary.safe.length}</strong></div>
        <div class="situation-kpi"><span>Em atenção</span><strong>${summary.attention.length}</strong></div>
        <div class="situation-kpi"><span>Em risco</span><strong>${summary.risk.length}</strong></div>
        <div class="situation-kpi"><span>Frequência média</span><strong>${summary.avgAttendance}%</strong></div>
        <div class="situation-kpi"><span>Média geral</span><strong>${summary.generalAverage}</strong></div>
        <div class="situation-kpi"><span>Pendências da semana</span><strong>${summary.weekPending}</strong></div>
      </div>
      <div class="situation-grid">
        <div class="situation-card"><h3>Seguras</h3><div class="situation-list">${makeList(summary.safe, 'Nenhuma matéria em zona segura ainda.')}</div></div>
        <div class="situation-card"><h3>Em atenção</h3><div class="situation-list">${makeList(summary.attention, 'Nenhuma matéria em atenção agora.')}</div></div>
        <div class="situation-card"><h3>Em risco</h3><div class="situation-list">${makeList(summary.risk, 'Nenhuma matéria crítica agora.')}</div></div>
      </div>`;
  }

  function patchViewRenderer() {
    if (!window.ViewRenderer || window.ViewRenderer.prototype[PATCH_FLAG]) return;
    const proto = window.ViewRenderer.prototype;
    const originalDashboard = proto.renderDashboard;
    const originalMaterias = proto.renderMaterias;
    const originalCalendario = proto.renderCalendario;
    const originalMentor = proto.renderMentorIA;
    const originalFoco = proto.renderModoFoco;
    const originalGradeSemanal = proto.renderGradeSemanalComHoras;
    const originalConfig = proto.renderConfiguracoes;

    proto.renderDashboard = function () {
      const base = originalDashboard.call(this);
      const insert = `${renderTodayHero(this)}${renderGoalsPanel(this)}<div class="report-stack"><div class="report-card"><h3><i class="fas fa-file-alt"></i> Relatórios automáticos</h3><p>${this.esc(this.app.getAutoReports().daily)}</p><p>${this.esc(this.app.getAutoReports().weekly)}</p><p>${this.esc(this.app.getAutoReports().monthly)}</p></div>${renderAgendaPanel(this)}</div>`;
      return base.replace('<div class="dashboard-grid">', `${insert}<div class="dashboard-grid">`);
    };

    proto.renderMaterias = function () {
      const base = originalMaterias.call(this);
      return base.replace('<div class="dashboard-grid">', `${renderSubjectPerformance(this)}<div class="dashboard-grid">`);
    };

    proto.renderCalendario = function () {
      return `${originalCalendario.call(this)}${renderAgendaPanel(this)}`;
    };

    proto.renderMentorIA = function () {
      const base = originalMentor.call(this);
      const priority = window.aiAssistant?.generateDailyPlan?.()?.[0];
      const highlight = priority ? `<div class="mentor-highlight-box"><h3>Prioridade do dia</h3><p><strong>${this.esc(priority.materia)}</strong> — ${this.esc(priority.tipo)} por ${this.esc(priority.duracao)} min. Motivo principal: ${this.esc(priority.motivo || 'atenção acadêmica atual')}.</p></div>` : '';
      return base.replace('<div class="mentor-ia-container">', `${highlight}<div class="mentor-ia-container">`);
    };

    proto.renderModoFoco = function () {
      const base = originalFoco.call(this);
      if (base.includes('focus-cycle-card')) return base;
      const card = `
        <div class="focus-cycle-card">
          <div class="focus-cycle-top">
            <div class="focus-phase-badge" id="focus-phase-label"><i class="fas fa-brain"></i> Foco</div>
            <div id="focus-cycle-summary">Blocos de foco concluídos hoje: 0.</div>
          </div>
          <div class="focus-next-action" id="focus-next-action"><button class="btn-primary" id="focus-next-button"><i class="fas fa-forward"></i> Iniciar descanso</button></div>
          <div class="focus-hints">
            <button class="btn-secondary" id="focus-long-start"><i class="fas fa-hourglass-half"></i> Foco 50 min</button>
            <button class="btn-secondary" id="focus-heavy-start"><i class="fas fa-dumbbell"></i> Foco 90 min</button>
            <button class="btn-secondary" id="focus-break-start"><i class="fas fa-mug-hot"></i> Descanso 15 min</button>
          </div>
        </div>`;
      return `${base}${card}`;
    };

    proto.renderGradeSemanalComHoras = function (containerId) {
      if (window.scheduleManager) {
        window.scheduleManager.loadAulas?.();
        window.scheduleManager.ALTURA_POR_HORA = calculateCompactHourHeight(window.scheduleManager);
      }
      const result = originalGradeSemanal.call(this, containerId);
      const container = document.getElementById(containerId);
      const card = container?.closest('.schedule-container');
      if (container) container.classList.add('compact-weekly-schedule');
      if (card) card.classList.add('compact-schedule-card');
      return result;
    };

    proto.renderConfiguracoes = function () {
      return `${originalConfig.call(this)}<div class="card"><div class="card-header"><h3><i class="fas fa-bullseye"></i> Metas rápidas</h3></div><div class="card-body"><p>Você também pode editar suas metas diretamente no Dashboard, na seção de metas semanais e mensais.</p></div></div>`;
    };

    proto[PATCH_FLAG] = true;
  }

  function patchLoadView() {
    if (!window.StudyLifeControl || window.StudyLifeControl.prototype.__loadViewEnhanced) return;
    const proto = window.StudyLifeControl.prototype;
    const originalLoadView = proto.loadView;
    proto.loadView = function (view) {
      if (view === 'situacao-academica') {
        if (!this.viewRenderer) this.viewRenderer = new ViewRenderer(this);
        this.currentView = view;
        const container = el('view-container');
        if (!container) return;
        container.innerHTML = renderSituationPage(this.viewRenderer);
        window.aiAssistant?.updateContext(this.data);
        return;
      }
      const result = originalLoadView.call(this, view);
      setTimeout(() => {
        if (view === 'foco') bindFocusButtons(this);
        if (view === 'grade-horaria' && window.scheduleManager) {
          window.scheduleManager.ALTURA_POR_HORA = calculateCompactHourHeight(window.scheduleManager);
          const select = document.querySelector('[id^="grade-view-mode-"]');
          if (select && select.value !== 'semana') { select.value = 'semana'; select.dispatchEvent(new Event('change')); }
        }
        bindDashboardEvents(this);
        bindCalendarFilters();
      }, 80);
      return result;
    };
    proto.__loadViewEnhanced = true;
  }

  function patchSubmitGuards() {
    if (!window.StudyLifeControl || window.StudyLifeControl.prototype.__submitGuardPatched) return;
    const forms = ['handleSessaoSubmit','handleTarefaSubmit','handleProvaSubmit','handleAulaSubmit','handleTopicoSubmit','handleNotaSubmit','handleMaterialSubmit'];
    const proto = window.StudyLifeControl.prototype;
    forms.forEach(name => {
      const original = proto[name];
      if (typeof original !== 'function') return;
      proto[name] = async function (e) {
        const form = e?.target?.closest?.('form') || e?.target;
        if (form?.dataset?.submitting === '1') return;
        if (form?.dataset) form.dataset.submitting = '1';
        try { return await original.call(this, e); }
        finally { setTimeout(() => { if (form?.dataset) form.dataset.submitting = '0'; }, 400); }
      };
    });
    proto.__submitGuardPatched = true;
  }

  function bindDashboardEvents(app) {
    const saveGoals = el('save-goals-btn');
    if (saveGoals && !saveGoals.dataset.bound) {
      saveGoals.dataset.bound = '1';
      saveGoals.addEventListener('click', async () => {
        await app.saveStudyGoals({
          weeklyHours: Number(el('goal-weekly-hours')?.value || 0),
          monthlyHours: Number(el('goal-monthly-hours')?.value || 0),
          weeklyPomodoros: Number(el('goal-weekly-pomodoros')?.value || 0),
          weeklyTasks: Number(el('goal-weekly-tasks')?.value || 0),
          weeklyReviews: Number(el('goal-weekly-reviews')?.value || 0)
        });
        showToast('Metas salvas com sucesso!', 'success');
        app.loadView(app.currentView);
      });
    }
  }

  function bindCalendarFilters() {
    document.querySelectorAll('.calendar-filter-btn').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        document.querySelectorAll('.calendar-filter-btn').forEach(item => item.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('[data-event-filter]').forEach(item => {
          item.style.display = filter === 'todos' || item.dataset.eventFilter === filter ? 'flex' : 'none';
        });
      });
    });
  }

  function install() {
    injectStyles();
    patchDbService();
    patchSubmitGuards();
    patchFocusTimer();
    patchViewRenderer();
    patchLoadView();
    if (window.app) {
      ensureFocusState(window.app);
      bindDashboardEvents(window.app);
      bindCalendarFilters();
      if (window.app.currentView === 'foco') bindFocusButtons(window.app);
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.app = new StudyLifeControl();
    el('whats-now-btn')?.addEventListener('click', () => window.app?.whatsNow?.());
    el('daily-log-btn')?.addEventListener('click', () => window.app?.openDailyLogModal?.());
    el('setup-form')?.addEventListener('submit', e => { e.preventDefault(); window.app?.handleSetupSubmit?.(e); });
    el('add-materia')?.addEventListener('click', () => window.app?.addMateriaField?.());
    el('add-aula')?.addEventListener('click', () => window.app?.addAulaField?.());
    install();
  });

  document.addEventListener('app-ready', () => {
    install();
    if (window.app) {
      ensureFocusState(window.app);
      setTimeout(() => {
        if (window.app.currentView === 'grade-horaria' && window.scheduleManager) {
          window.scheduleManager.ALTURA_POR_HORA = calculateCompactHourHeight(window.scheduleManager);
        }
      }, 100);
    }
  });

  window.addEventListener('resize', () => {
    if (window.scheduleManager && window.app?.currentView === 'grade-horaria') {
      window.scheduleManager.ALTURA_POR_HORA = calculateCompactHourHeight(window.scheduleManager);
      const current = document.querySelector('[id^="schedule-vertical-container-"]');
      if (current && window.app?.viewRenderer?.renderGradeSemanalComHoras) {
        window.app.viewRenderer.renderGradeSemanalComHoras(current.id);
      }
    }
  });
})();
