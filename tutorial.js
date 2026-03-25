(function () {
  function el(id) { return document.getElementById(id); }

  const HELP_SECTIONS = [
    {
      icon: '🚀',
      title: 'Primeiros passos',
      body: `Comece cadastrando suas matérias, depois adicione tarefas, provas e sessões de estudo. O Dashboard vai ficando cada vez mais útil conforme você alimenta o sistema.`
    },
    {
      icon: '🧠',
      title: 'Mentor IA',
      body: `O Mentor IA usa seus dados reais do site para responder melhor. Perguntas boas: “o que estudar hoje?”, “como estou em física?”, “o que está atrasado?” e “organiza meu dia agora”.`
    },
    {
      icon: '📊',
      title: 'Dashboard',
      body: `Mostra progresso, horas estudadas, matérias em risco, próximas provas e visão geral da semana. É a tela principal para entender sua situação acadêmica.`
    },
    {
      icon: '✅',
      title: 'Tarefas, provas e materiais',
      body: `Registre tudo por matéria. Quanto mais completo estiver, melhores ficam os alertas, o plano de estudo e a ajuda da IA.`
    },
    {
      icon: '🎮',
      title: 'Gamificação',
      body: `Você ganha XP ao concluir tarefas, revisões e sessões. Também desbloqueia conquistas. A aba de Gamificação mostra seu nível, histórico e conquistas bloqueadas e desbloqueadas.`
    },
    {
      icon: '🔔',
      title: 'Notificações',
      body: `Use o sino no topo para ver alertas de tarefas atrasadas, provas chegando, pendências e recomendações importantes.`
    },
    {
      icon: '⚙️',
      title: 'Configuração inteligente',
      body: `Cadastre sua grade horária, frequência, notas e metas. Isso permite análises mais avançadas, risco acadêmico mais preciso e respostas melhores do Mentor IA.`
    },
  ];

  const steps = [
    {
      id: 'dashboard',
      title: 'Bem-vindo ao Study Life Control',
      text: 'Esse é o seu painel principal. Aqui você acompanha horas estudadas, risco acadêmico, provas e o que precisa de atenção primeiro.',
      selector: '[data-view="dashboard"]',
      pre() {
        window.app?.loadView?.('dashboard');
      }
    },
    {
      id: 'mentor',
      title: 'Mentor IA',
      text: 'Aqui fica o seu assistente inteligente. Ele responde com base nos seus dados reais do site e ajuda a decidir o que estudar e onde você está pior.',
      selector: '[data-view="mentor-ia"]',
      pre() {
        window.app?.loadView?.('mentor-ia');
      }
    },
    {
      id: 'tarefas',
      title: 'Tarefas e organização',
      text: 'Cadastre tarefas, trabalhos e pendências aqui. Isso alimenta as notificações, o plano de estudo e a visão de prioridade.',
      selector: '[data-view="tarefas"]',
      pre() {
        window.app?.loadView?.('tarefas');
      }
    },
    {
      id: 'gamificacao',
      title: 'Nível, XP e conquistas',
      text: 'A gamificação transforma seu progresso em algo visível. Concluir tarefas, revisões e sessões gera XP e pode desbloquear conquistas.',
      selector: '[data-view="gamificacao"]',
      pre() {
        window.app?.loadView?.('gamificacao');
      }
    },
    {
      id: 'notificacoes',
      title: 'Central de notificações',
      text: 'O sino do topo concentra seus alertas importantes. Quando você entrar no site com pendências, ele pode abrir automaticamente para chamar sua atenção.',
      selector: '#notification-badge',
      pre() {
        window.app?.loadView?.(window.app?.currentView || 'dashboard');
      }
    },
    {
      id: 'ajuda',
      title: 'Central de ajuda',
      text: 'Essa aba reúne o manual do sistema, perguntas que valem a pena fazer para a IA e um botão para reabrir este tutorial quando quiser.',
      selector: '[data-view="ajuda"]',
      pre() {
        window.app?.loadView?.('ajuda');
      }
    }
  ];

  function ensureOverlay() {
    let overlay = el('tutorial-overlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'tutorial-overlay';
    overlay.className = 'tutorial-overlay';
    overlay.innerHTML = `
      <div class="tutorial-backdrop"></div>
      <div class="tutorial-spotlight"></div>
      <div class="tutorial-card">
        <div class="tutorial-progress"><span id="tutorial-progress-text"></span><button class="tutorial-skip" id="tutorial-skip">Pular</button></div>
        <h3 id="tutorial-title"></h3>
        <p id="tutorial-text"></p>
        <div class="tutorial-actions">
          <button class="btn-secondary" id="tutorial-prev">Voltar</button>
          <button class="btn-primary" id="tutorial-next">Próximo</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function markNavActive(view) {
    document.querySelectorAll('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.view === view));
    const pageTitle = el('page-title');
    if (pageTitle) {
      const map = { ajuda: 'Ajuda', 'mentor-ia': 'Mentor IA', dashboard: 'Dashboard', tarefas: 'Tarefas', gamificacao: 'Gamificação' };
      pageTitle.textContent = map[view] || pageTitle.textContent;
    }
  }

  function renderHelpPage() {
    const suggestions = [
      'o que estudar hoje?',
      'quais matérias estão em risco?',
      'organiza meu dia agora',
      'como estou em física?',
      'o que está atrasado?',
      'me dá um raio-x completo'
    ];
    return `
      <div class="view-header">
        <h2><i class="fas fa-question-circle"></i> Central de Ajuda</h2>
        <div class="help-header-actions">
          <button class="btn-primary" id="btn-start-tutorial"><i class="fas fa-wand-magic-sparkles"></i> Ver tutorial guiado</button>
        </div>
      </div>
      <div class="help-hero-card">
        <div>
          <span class="tag">Tutorial interativo</span>
          <h3>Aprenda tudo que dá para fazer no site</h3>
          <p>Use esta área para entender o fluxo completo do sistema, descobrir recursos escondidos e ver exemplos de perguntas que funcionam muito bem com o Mentor IA.</p>
        </div>
        <div class="help-hero-actions">
          <button class="btn-secondary" id="btn-open-tutorial-inline">Começar agora</button>
        </div>
      </div>
      <div class="help-grid">
        ${HELP_SECTIONS.map(section => `
          <article class="help-card-pro">
            <div class="help-card-icon">${section.icon}</div>
            <div>
              <h3>${section.title}</h3>
              <p>${section.body}</p>
            </div>
          </article>
        `).join('')}
      </div>
      <div class="card">
        <div class="card-header">
          <h3><i class="fas fa-robot"></i> Perguntas que chamam atenção no Mentor IA</h3>
        </div>
        <div class="card-body">
          <div class="help-chip-list">
            ${suggestions.map(text => `<button class="help-chip" data-help-question="${text.replace(/"/g, '&quot;')}">${text}</button>`).join('')}
          </div>
          <p class="text-secondary" style="margin-top:12px;">Ao clicar, a pergunta abre na aba do Mentor IA para você testar direto.</p>
        </div>
      </div>
    `;
  }

  const SiteTutorial = {
    index: 0,
    running: false,
    pendingAutostart: false,

    hasCompleted() {
      return localStorage.getItem('slc_tutorial_completed') === '1';
    },

    markCompleted() {
      localStorage.setItem('slc_tutorial_completed', '1');
    },

    reset() {
      localStorage.removeItem('slc_tutorial_completed');
    },

    maybeStart() {
      if (this.running || this.hasCompleted() || !window.app || !document.getElementById('app-screen') || document.getElementById('app-screen').classList.contains('hidden')) return;
      if (this.pendingAutostart) return;
      this.pendingAutostart = true;
      setTimeout(() => {
        this.pendingAutostart = false;
        if (!this.hasCompleted() && !this.running) this.start();
      }, 600);
    },

    start(startIndex = 0) {
      this.index = Math.max(0, Math.min(startIndex, steps.length - 1));
      this.running = true;
      const overlay = ensureOverlay();
      overlay.classList.add('open');
      this.bindControls();
      this.showStep();
    },

    stop(markDone = false) {
      this.running = false;
      const overlay = ensureOverlay();
      overlay.classList.remove('open');
      document.querySelectorAll('.tutorial-target-active').forEach(node => node.classList.remove('tutorial-target-active'));
      if (markDone) this.markCompleted();
    },

    bindControls() {
      const overlay = ensureOverlay();
      const nextBtn = el('tutorial-next');
      const prevBtn = el('tutorial-prev');
      const skipBtn = el('tutorial-skip');
      const backdrop = overlay.querySelector('.tutorial-backdrop');
      if (nextBtn) nextBtn.onclick = () => this.next();
      if (prevBtn) prevBtn.onclick = () => this.prev();
      if (skipBtn) skipBtn.onclick = () => this.stop(true);
      if (backdrop) backdrop.onclick = () => this.stop(true);
    },

    next() {
      if (this.index >= steps.length - 1) {
        this.stop(true);
        window.app?.loadView?.('dashboard');
        markNavActive('dashboard');
        return;
      }
      this.index += 1;
      this.showStep();
    },

    prev() {
      if (this.index <= 0) {
        this.showStep();
        return;
      }
      this.index -= 1;
      this.showStep();
    },

    async showStep() {
      const step = steps[this.index];
      step?.pre?.();
      if (step?.id) markNavActive(step.id);
      await new Promise(resolve => setTimeout(resolve, 260));
      const target = document.querySelector(step.selector);
      const overlay = ensureOverlay();
      const spotlight = overlay.querySelector('.tutorial-spotlight');
      document.querySelectorAll('.tutorial-target-active').forEach(node => node.classList.remove('tutorial-target-active'));
      if (!target) {
        if (this.index < steps.length - 1) {
          this.index += 1;
          this.showStep();
          return;
        }
      }
      if (target) {
        target.classList.add('tutorial-target-active');
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        const rect = target.getBoundingClientRect();
        spotlight.style.top = `${Math.max(8, rect.top - 10)}px`;
        spotlight.style.left = `${Math.max(8, rect.left - 10)}px`;
        spotlight.style.width = `${Math.max(80, rect.width + 20)}px`;
        spotlight.style.height = `${Math.max(40, rect.height + 20)}px`;
      }
      el('tutorial-title').textContent = step.title;
      el('tutorial-text').textContent = step.text;
      el('tutorial-progress-text').textContent = `Passo ${this.index + 1} de ${steps.length}`;
      const nextBtn = el('tutorial-next');
      if (nextBtn) nextBtn.textContent = this.index === steps.length - 1 ? 'Finalizar' : 'Próximo';
    }
  };

  function bindHelpActions(root = document) {
    root.querySelectorAll('#btn-start-tutorial,#btn-open-tutorial-inline').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => SiteTutorial.start(0));
    });

    root.querySelectorAll('[data-help-question]').forEach(btn => {
      if (btn.dataset.bound) return;
      btn.dataset.bound = '1';
      btn.addEventListener('click', () => {
        const question = btn.getAttribute('data-help-question') || '';
        window.app?.loadView?.('mentor-ia');
        markNavActive('mentor-ia');
        setTimeout(() => {
          const input = document.querySelector('#mentor-ia-input, #ai-chat-input, .mentor-chat-input textarea, .mentor-chat-input input');
          if (input) {
            input.value = question;
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.focus();
          }
        }, 120);
      });
    });
  }

  window.SiteTutorial = SiteTutorial;
  window.renderHelpPage = renderHelpPage;
  window.bindHelpActions = bindHelpActions;

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => SiteTutorial.maybeStart(), 1200);
  });
})();
