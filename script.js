// script.js - Inicialização principal + melhorias do projeto

(function () {
  const APP_PATCH_FLAG = '__slc_enhanced_v2__';

  function injectEnhancementStyles() {
    if (document.getElementById('slc-enhancement-styles')) return;

    const style = document.createElement('style');
    style.id = 'slc-enhancement-styles';
    style.textContent = `
      .schedule-container.compact-schedule-card {
        padding: 14px !important;
      }

      .compact-schedule-card #schedule-vertical-container,
      .compact-schedule-card [id^="schedule-vertical-container-"] {
        min-height: auto !important;
      }

      .compact-weekly-schedule .weekly-timeline {
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 18px;
        overflow: hidden;
        background: rgba(15, 23, 42, 0.15);
      }

      .compact-weekly-schedule .weekly-timeline-header {
        position: sticky;
        top: 0;
        z-index: 2;
        background: rgba(15, 23, 42, 0.94);
        backdrop-filter: blur(10px);
      }

      .compact-weekly-schedule .weekly-day-header,
      .compact-weekly-schedule .weekly-time-spacer {
        min-height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.82rem;
      }

      .compact-weekly-schedule .weekly-time-column {
        width: 62px;
      }

      .compact-weekly-schedule .weekly-time-slot {
        font-size: 0.75rem;
        padding-right: 10px;
      }

      .compact-weekly-schedule .weekly-event-block {
        border-radius: 14px;
        box-shadow: 0 6px 18px rgba(15, 23, 42, 0.16);
        overflow: hidden;
      }

      .compact-weekly-schedule .event-content {
        padding: 8px 9px;
        font-size: 0.78rem;
        line-height: 1.2;
      }

      .compact-weekly-schedule .event-content strong {
        display: block;
        font-size: 0.8rem;
        margin-bottom: 4px;
      }

      .compact-weekly-schedule .event-time,
      .compact-weekly-schedule .event-room,
      .compact-weekly-schedule .event-prof {
        font-size: 0.72rem;
        opacity: 0.9;
      }

      .focus-cycle-card {
        margin-top: 18px;
        padding: 18px;
        border-radius: 18px;
        border: 1px solid rgba(99, 102, 241, 0.18);
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.10), rgba(59, 130, 246, 0.08));
      }

      .focus-cycle-top {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }

      .focus-phase-badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 999px;
        font-size: 0.86rem;
        font-weight: 700;
        background: rgba(15, 23, 42, 0.14);
      }

      .focus-next-action {
        display: none;
        margin-top: 12px;
        gap: 10px;
        flex-wrap: wrap;
      }

      .focus-next-action.is-visible {
        display: flex;
      }

      .focus-hints {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 10px;
        margin-top: 14px;
      }

      .focus-hint-pill {
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.08);
        font-size: 0.84rem;
      }

      .mentor-highlight-box {
        margin: 14px 0 18px;
        padding: 16px 18px;
        border-radius: 18px;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.10), rgba(59, 130, 246, 0.08));
        border: 1px solid rgba(16, 185, 129, 0.16);
      }

      .mentor-highlight-box h3 {
        margin: 0 0 8px;
        font-size: 1rem;
      }

      .mentor-highlight-box p {
        margin: 0;
        opacity: 0.95;
      }

      @media (max-width: 1100px) {
        .compact-weekly-schedule .event-content {
          padding: 7px;
          font-size: 0.74rem;
        }
      }

      @media (max-width: 820px) {
        .compact-weekly-schedule {
          overflow-x: auto;
        }

        .compact-weekly-schedule .weekly-timeline {
          min-width: 860px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function normalizeText(value) {
    return String(value ?? '')
      .trim()
      .replace(/\s+/g, ' ')
      .toLowerCase();
  }

  function normalizeDateValue(value) {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return normalizeText(value);
    return date.toISOString();
  }

  function stableValue(value) {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) {
      return value.map(stableValue).join('|');
    }
    if (typeof value === 'object') {
      return Object.keys(value)
        .sort()
        .map(key => `${key}:${stableValue(value[key])}`)
        .join('|');
    }
    return normalizeText(value);
  }

  function signatureForItem(collection, item) {
    const ignoredKeys = new Set([
      'id', 'createdAt', 'updatedAt', 'timestamp', 'uid', '_tempId', '__localId',
      'ultimaAtualizacao', 'ultimaInteracao', 'streak', 'lastStudyDate'
    ]);

    const clone = {};
    Object.keys(item || {}).sort().forEach(key => {
      if (ignoredKeys.has(key)) return;
      const value = item[key];
      if (key === 'data' || key === 'dataLimite' || key === 'inicio' || key === 'fim') {
        clone[key] = normalizeDateValue(value);
      } else {
        clone[key] = stableValue(value);
      }
    });

    return `${collection}::${JSON.stringify(clone)}`;
  }

  function dedupeCollection(collection, items) {
    if (!Array.isArray(items)) return items;
    const byId = new Map();
    const bySignature = new Map();
    const result = [];

    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const id = item.id ? String(item.id) : '';
      const signature = signatureForItem(collection, item);

      if (id && byId.has(id)) {
        continue;
      }
      if (bySignature.has(signature)) {
        continue;
      }

      if (id) byId.set(id, true);
      bySignature.set(signature, true);
      result.push(item);
    }

    return result;
  }

  function sanitizeDataPayload(payload) {
    if (!payload || typeof payload !== 'object') return payload;

    const collections = [
      'subjects', 'sessions', 'tasks', 'exams', 'materials', 'grades', 'habits',
      'learningMap', 'classSchedule', 'dailyLogs', 'classDiaries', 'reviews',
      'curriculum', 'extraCourses'
    ];

    const cleaned = { ...payload };
    collections.forEach(name => {
      if (Array.isArray(cleaned[name])) {
        cleaned[name] = dedupeCollection(name, cleaned[name]);
      }
    });

    return cleaned;
  }

  function patchDbService() {
    if (!window.dbService || window.dbService.__dedupePatched) return;

    const originalSaveAllData = window.dbService.saveAllData?.bind(window.dbService);
    const originalSaveData = window.dbService.saveData?.bind(window.dbService);

    if (originalSaveAllData) {
      window.dbService.saveAllData = async function saveAllDataPatched(dataOverride = null) {
        const sanitized = sanitizeDataPayload(dataOverride || window.app?.data || {});
        if (window.app?.data) {
          window.app.data = sanitized;
        }
        return originalSaveAllData(sanitized);
      };
    }

    if (originalSaveData) {
      window.dbService.saveData = async function saveDataPatched(field, data) {
        const sanitizedFieldData = Array.isArray(data) ? dedupeCollection(field, data) : data;
        if (window.app?.data && field) {
          window.app.data[field] = sanitizedFieldData;
        }
        return originalSaveData(field, sanitizedFieldData);
      };
    }

    window.dbService.__dedupePatched = true;
  }

  function calculateCompactHourHeight(manager) {
    const horarios = (manager?.aulas || window.app?.data?.classSchedule || [])
      .map(item => [item?.inicio, item?.fim])
      .flat()
      .filter(Boolean)
      .map(value => String(value).split(':').map(Number))
      .filter(parts => parts.length === 2 && parts.every(Number.isFinite));

    const earliestHour = horarios.length ? Math.min(...horarios.map(([h]) => h)) : (manager?.HORARIO_INICIO || 7);
    const latestHour = horarios.length ? Math.max(...horarios.map(([h]) => h)) : (manager?.HORARIO_FIM || 22);
    const totalHoras = Math.max(8, (latestHour - earliestHour) + 2);
    const available = Math.max(420, window.innerHeight - 290);
    return Math.max(26, Math.min(52, Math.floor(available / totalHoras)));
  }

  function ensureFocusState(app) {
    if (!app.focusCycleState) {
      app.focusCycleState = {
        phase: 'focus',
        lastFocusMinutes: 25,
        shortBreakMinutes: 15,
        longBreakMinutes: 15,
        heavyMinutes: 90,
        longFocusMinutes: 50,
        canAdvance: false,
        completedFocusBlocks: 0
      };
    }
    return app.focusCycleState;
  }

  function formatTimeFromSeconds(totalSeconds) {
    const safe = Math.max(0, Number(totalSeconds) || 0);
    const minutes = Math.floor(safe / 60);
    const seconds = safe % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function updateFocusUI(app) {
    const state = ensureFocusState(app);
    const display = document.getElementById('timer-display');
    const phase = document.getElementById('focus-phase-label');
    const summary = document.getElementById('focus-cycle-summary');
    const nextBox = document.getElementById('focus-next-action');
    const nextButton = document.getElementById('focus-next-button');

    if (display) display.textContent = formatTimeFromSeconds(app.timerSeconds || 0);

    if (phase) {
      const label = state.phase === 'break' ? 'Descanso' : 'Foco';
      phase.innerHTML = state.phase === 'break'
        ? '<i class="fas fa-mug-hot"></i> Descanso'
        : '<i class="fas fa-brain"></i> Foco';
      phase.dataset.phase = label.toLowerCase();
    }

    if (summary) {
      if (state.phase === 'break') {
        summary.textContent = 'Quando esse descanso acabar, você volta para o foco com um clique.';
      } else {
        summary.textContent = `Blocos de foco concluídos hoje: ${state.completedFocusBlocks}.`;
      }
    }

    if (nextBox) nextBox.classList.toggle('is-visible', !!state.canAdvance);
    if (nextButton) {
      nextButton.textContent = state.phase === 'break' ? 'Iniciar foco' : 'Iniciar descanso';
    }
  }

  function configureFocusMode(app, mode) {
    const state = ensureFocusState(app);
    if (mode === 'focus') {
      state.phase = 'focus';
      app.timerDuration = state.lastFocusMinutes * 60;
    } else if (mode === 'long-focus') {
      state.phase = 'focus';
      state.lastFocusMinutes = state.longFocusMinutes;
      app.timerDuration = state.longFocusMinutes * 60;
    } else if (mode === 'heavy-focus') {
      state.phase = 'focus';
      state.lastFocusMinutes = state.heavyMinutes;
      app.timerDuration = state.heavyMinutes * 60;
    } else if (mode === 'break') {
      state.phase = 'break';
      app.timerDuration = state.shortBreakMinutes * 60;
    }

    app.timerSeconds = app.timerDuration;
    state.canAdvance = false;
    updateFocusUI(app);
  }

  function bindFocusButtons(app) {
    if (!app || app.currentView !== 'foco') return;

    const nextButton = document.getElementById('focus-next-button');
    const focusPreset = document.getElementById('timer-start');
    const longFocusPreset = document.getElementById('focus-long-start');
    const heavyFocusPreset = document.getElementById('focus-heavy-start');
    const breakPreset = document.getElementById('focus-break-start');

    if (focusPreset) {
      focusPreset.onclick = () => {
        configureFocusMode(app, 'focus');
        app.startTimer();
      };
    }

    if (longFocusPreset) {
      longFocusPreset.onclick = () => {
        configureFocusMode(app, 'long-focus');
        app.startTimer();
      };
    }

    if (heavyFocusPreset) {
      heavyFocusPreset.onclick = () => {
        configureFocusMode(app, 'heavy-focus');
        app.startTimer();
      };
    }

    if (breakPreset) {
      breakPreset.onclick = () => {
        configureFocusMode(app, 'break');
        app.startTimer();
      };
    }

    if (nextButton) {
      nextButton.onclick = () => {
        const state = ensureFocusState(app);
        configureFocusMode(app, state.phase === 'break' ? 'focus' : 'break');
        app.startTimer();
      };
    }

    updateFocusUI(app);
  }

  function patchFocusTimer() {
    if (!window.StudyLifeControl || window.StudyLifeControl.prototype.__focusEnhanced) return;

    const proto = window.StudyLifeControl.prototype;

    proto.startTimer = function startTimerEnhanced() {
      const state = ensureFocusState(this);
      if (!this.timerDuration) {
        this.timerDuration = (state.phase === 'break' ? state.shortBreakMinutes : state.lastFocusMinutes) * 60;
      }
      if (!this.timerSeconds) {
        this.timerSeconds = this.timerDuration;
      }
      if (this.timerRunning) return;

      this.timerRunning = true;
      clearInterval(this.timerInterval);

      this.timerInterval = setInterval(() => {
        this.timerSeconds = Math.max(0, (this.timerSeconds || 0) - 1);
        updateFocusUI(this);

        if (this.timerSeconds <= 0) {
          clearInterval(this.timerInterval);
          this.timerRunning = false;
          state.canAdvance = true;

          if (state.phase === 'focus') {
            state.completedFocusBlocks += 1;
            if (typeof window.showToast === 'function') {
              window.showToast('Bloco de foco concluído. Hora do descanso.', 'success');
            }
          } else if (typeof window.showToast === 'function') {
            window.showToast('Descanso concluído. Bora voltar para o foco.', 'info');
          }

          updateFocusUI(this);
        }
      }, 1000);

      updateFocusUI(this);
    };

    proto.pauseTimer = function pauseTimerEnhanced() {
      clearInterval(this.timerInterval);
      this.timerRunning = false;
      updateFocusUI(this);
    };

    proto.resetTimer = function resetTimerEnhanced() {
      const state = ensureFocusState(this);
      clearInterval(this.timerInterval);
      this.timerRunning = false;
      this.timerDuration = (state.phase === 'break' ? state.shortBreakMinutes : state.lastFocusMinutes) * 60;
      this.timerSeconds = this.timerDuration;
      state.canAdvance = false;
      updateFocusUI(this);
    };

    proto.__focusEnhanced = true;
  }

  function patchViewRenderer() {
    if (!window.ViewRenderer || window.ViewRenderer.prototype[APP_PATCH_FLAG]) return;

    const proto = window.ViewRenderer.prototype;
    const originalRenderModoFoco = proto.renderModoFoco;
    const originalRenderGradeSemanalComHoras = proto.renderGradeSemanalComHoras;
    const originalRenderMentorIA = proto.renderMentorIA;

    proto.renderModoFoco = function renderModoFocoEnhanced() {
      const base = typeof originalRenderModoFoco === 'function'
        ? originalRenderModoFoco.call(this)
        : '';

      const focusCard = `
        <div class="focus-cycle-card">
          <div class="focus-cycle-top">
            <div class="focus-phase-badge" id="focus-phase-label">
              <i class="fas fa-brain"></i> Foco
            </div>
            <div id="focus-cycle-summary">Blocos de foco concluídos hoje: 0.</div>
          </div>

          <div class="focus-next-action" id="focus-next-action">
            <button class="btn-primary" id="focus-next-button">
              <i class="fas fa-forward"></i> Iniciar descanso
            </button>
          </div>

          <div class="focus-hints">
            <button class="btn-secondary" id="focus-long-start"><i class="fas fa-hourglass-half"></i> Foco 50 min</button>
            <button class="btn-secondary" id="focus-heavy-start"><i class="fas fa-dumbbell"></i> Foco 90 min</button>
            <button class="btn-secondary" id="focus-break-start"><i class="fas fa-mug-hot"></i> Descanso 15 min</button>
          </div>
        </div>
      `;

      if (base.includes('focus-cycle-card')) return base;
      return base.replace('</div>\n\n      `;', '') || `${base}${focusCard}`;
    };

    proto.renderMentorIA = function renderMentorIAEnhanced() {
      const base = typeof originalRenderMentorIA === 'function'
        ? originalRenderMentorIA.call(this)
        : '';

      const app = this?.app || window.app;
      window.aiAssistant?.updateContext(app?.data || {});
      const prioridade = window.aiAssistant?.generateDailyPlan?.()?.[0];

      const highlight = prioridade
        ? `
          <div class="mentor-highlight-box">
            <h3>Prioridade do dia</h3>
            <p><strong>${prioridade.materia}</strong> — ${prioridade.tipo} por ${prioridade.duracao} min. Motivo principal: ${prioridade.motivo || 'atenção acadêmica atual'}.</p>
          </div>
        `
        : '';

      return base.replace('<div class="mentor-ia-container">', `${highlight}<div class="mentor-ia-container">`);
    };

    proto.renderGradeSemanalComHoras = function renderGradeSemanalComHorasEnhanced(containerId) {
      if (window.scheduleManager) {
        window.scheduleManager.loadAulas?.();
        window.scheduleManager.ALTURA_POR_HORA = calculateCompactHourHeight(window.scheduleManager);
      }
      const result = originalRenderGradeSemanalComHoras.call(this, containerId);
      const container = document.getElementById(containerId);
      const scheduleCard = container?.closest('.schedule-container');
      if (container) container.classList.add('compact-weekly-schedule');
      if (scheduleCard) scheduleCard.classList.add('compact-schedule-card');
      return result;
    };

    proto[APP_PATCH_FLAG] = true;
  }

  function patchLoadViewBinding() {
    if (!window.StudyLifeControl || window.StudyLifeControl.prototype.__loadViewEnhanced) return;

    const proto = window.StudyLifeControl.prototype;
    const originalLoadView = proto.loadView;

    proto.loadView = function loadViewEnhanced(view) {
      const result = originalLoadView.call(this, view);

      setTimeout(() => {
        if (view === 'foco') {
          bindFocusButtons(this);
        }

        if (view === 'grade-horaria' && window.scheduleManager) {
          window.scheduleManager.ALTURA_POR_HORA = calculateCompactHourHeight(window.scheduleManager);
          const select = document.querySelector('[id^="grade-view-mode-"]');
          if (select && select.value !== 'semana') {
            select.value = 'semana';
            select.dispatchEvent(new Event('change'));
          }
        }
      }, 60);

      return result;
    };

    proto.__loadViewEnhanced = true;
  }

  function installEnhancements() {
    injectEnhancementStyles();
    patchDbService();
    patchFocusTimer();
    patchViewRenderer();
    patchLoadViewBinding();

    if (window.app) {
      ensureFocusState(window.app);
      if (window.app.currentView === 'foco') bindFocusButtons(window.app);
    }
  }

  // Garantir que todas as funções globais estão disponíveis
  if (typeof generateId === 'undefined') {
    console.error('utils.js não carregado corretamente');
  }

  if (typeof showToast === 'undefined') {
    console.error('showToast não definido');
  }

  document.addEventListener('DOMContentLoaded', () => {
    window.app = new StudyLifeControl();

    const whatsNowBtn = document.getElementById('whats-now-btn');
    if (whatsNowBtn) {
      whatsNowBtn.addEventListener('click', () => {
        if (window.app) window.app.whatsNow();
      });
    }

    const dailyLogBtn = document.getElementById('daily-log-btn');
    if (dailyLogBtn) {
      dailyLogBtn.addEventListener('click', () => {
        if (window.app) window.app.openDailyLogModal();
      });
    }

    const setupForm = document.getElementById('setup-form');
    if (setupForm) {
      setupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (window.app) window.app.handleSetupSubmit(e);
      });
    }

    const addMateriaBtn = document.getElementById('add-materia');
    if (addMateriaBtn) {
      addMateriaBtn.addEventListener('click', () => {
        if (window.app) window.app.addMateriaField();
      });
    }

    const addAulaBtn = document.getElementById('add-aula');
    if (addAulaBtn) {
      addAulaBtn.addEventListener('click', () => {
        if (window.app) window.app.addAulaField();
      });
    }

    installEnhancements();
  });

  document.addEventListener('app-ready', () => {
    installEnhancements();
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
      const currentContainer = document.querySelector('[id^="schedule-vertical-container-"]');
      if (currentContainer && window.app?.viewRenderer?.renderGradeSemanalComHoras) {
        window.app.viewRenderer.renderGradeSemanalComHoras(currentContainer.id);
      }
    }
  });
})();
