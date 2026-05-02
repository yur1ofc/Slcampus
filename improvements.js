// improvements.js — Tema, sidebar colapsável, Ctrl+K, Charts, Export
(function () {
  'use strict';

  // ── 1. TEMA CLARO / ESCURO ────────────────────────────────────────────────
  function initTheme() {
    const saved = localStorage.getItem('slc-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('slc-theme', theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  // ── 2. SIDEBAR: grupos colapsáveis ────────────────────────────────────────
  function initSidebarGroups() {
    const headers = document.querySelectorAll('.nav-group-header');
    if (!headers.length) return;

    // Restaura estado salvo
    headers.forEach(btn => {
      const group = btn.dataset.group;
      const items = document.getElementById(`group-${group}`);
      if (!items) return;

      const collapsed = localStorage.getItem(`slc-nav-${group}`) === 'collapsed';
      if (collapsed) {
        items.style.display = 'none';
        btn.classList.add('collapsed');
      }

      btn.addEventListener('click', () => {
        const isCollapsed = items.style.display === 'none';
        items.style.display = isCollapsed ? '' : 'none';
        btn.classList.toggle('collapsed', !isCollapsed);
        localStorage.setItem(`slc-nav-${group}`, isCollapsed ? 'open' : 'collapsed');
      });
    });
  }

  // ── 3. BUSCA RÁPIDA Ctrl+K ────────────────────────────────────────────────
  const NAV_ITEMS = [
    { label: 'Dashboard',          view: 'dashboard',         icon: 'fa-chart-pie' },
    { label: 'Mentor IA',          view: 'mentor-ia',         icon: 'fa-robot' },
    { label: 'Matérias',           view: 'materias',          icon: 'fa-book' },
    { label: 'Grade Horária',      view: 'grade-horaria',     icon: 'fa-calendar-week' },
    { label: 'Grade Curricular',   view: 'grade-curricular',  icon: 'fa-sitemap' },
    { label: 'Cursos Extras',      view: 'cursos-extras',     icon: 'fa-language' },
    { label: 'Situação Acadêmica', view: 'situacao-academica',icon: 'fa-heartbeat' },
    { label: 'Previsão de Notas',  view: 'previsao-notas',    icon: 'fa-chart-line' },
    { label: 'Tarefas',            view: 'tarefas',           icon: 'fa-tasks' },
    { label: 'Provas e Trabalhos', view: 'provas',            icon: 'fa-graduation-cap' },
    { label: 'Sessões de Estudo',  view: 'sessoes',           icon: 'fa-clock' },
    { label: 'Calendário',         view: 'calendario',        icon: 'fa-calendar-alt' },
    { label: 'Hábitos',            view: 'habitos',           icon: 'fa-heart' },
    { label: 'Modo Foco',          view: 'foco',              icon: 'fa-bullseye' },
    { label: 'Mapa de Aprendizado',view: 'mapa-aprendizado',  icon: 'fa-map' },
    { label: 'Materiais',          view: 'materiais',         icon: 'fa-folder' },
    { label: 'Estatísticas',       view: 'estatisticas',      icon: 'fa-chart-bar' },
    { label: 'Configurações',      view: 'configuracoes',     icon: 'fa-cog' },
    { label: 'Ajuda',              view: 'ajuda',             icon: 'fa-question-circle' },
  ];

  function initNavSearch() {
    const modal   = document.getElementById('nav-search-modal');
    const input   = document.getElementById('nav-search-input');
    const results = document.getElementById('nav-search-results');
    const overlay = document.getElementById('nav-search-overlay');
    if (!modal || !input || !results) return;

    function open() {
      modal.hidden = false;
      input.value = '';
      renderResults('');
      setTimeout(() => input.focus(), 50);
    }

    function close() {
      modal.hidden = true;
    }

    function renderResults(query) {
      const q = query.toLowerCase().trim();
      const filtered = q
        ? NAV_ITEMS.filter(item => item.label.toLowerCase().includes(q))
        : NAV_ITEMS;

      results.innerHTML = filtered.map((item, i) => `
        <button class="nav-search-result${i === 0 ? ' active' : ''}" data-view="${item.view}">
          <i class="fas ${item.icon}"></i>
          <span>${item.label}</span>
        </button>
      `).join('');

      results.querySelectorAll('.nav-search-result').forEach(btn => {
        btn.addEventListener('click', () => {
          close();
          if (window.app?.loadView) window.app.loadView(btn.dataset.view);
        });
      });
    }

    input.addEventListener('input', e => renderResults(e.target.value));

    input.addEventListener('keydown', e => {
      const active = results.querySelector('.nav-search-result.active');
      const all    = [...results.querySelectorAll('.nav-search-result')];
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const idx = all.indexOf(active);
        const next = all[idx + 1] || all[0];
        active?.classList.remove('active');
        next?.classList.add('active');
        next?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const idx = all.indexOf(active);
        const prev = all[idx - 1] || all[all.length - 1];
        active?.classList.remove('active');
        prev?.classList.add('active');
        prev?.scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const target = active || all[0];
        if (target) { close(); if (window.app?.loadView) window.app.loadView(target.dataset.view); }
      } else if (e.key === 'Escape') {
        close();
      }
    });

    overlay?.addEventListener('click', close);

    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        modal.hidden ? open() : close();
      }
      if (e.key === 'Escape' && !modal.hidden) close();
    });
  }

  // ── 4. CHARTS NO DASHBOARD ───────────────────────────────────────────────
  // Injetado via patch no renderDashboard do ViewRenderer
  function initDashboardCharts() {
    if (!window.ViewRenderer) return;
    const proto = ViewRenderer.prototype;
    const originalDash = proto.renderDashboard;
    if (!originalDash || proto.__chartPatched) return;

    proto.renderDashboard = function () {
      const html = originalDash.call(this);
      // Injeta container de charts após o retorno
      setTimeout(() => renderCharts(this.app?.data), 100);
      return html;
    };
    proto.__chartPatched = true;
  }

  function renderCharts(data) {
    const container = document.getElementById('view-container');
    if (!container || !data) return;

    // Evita duplicar
    if (container.querySelector('#slc-charts-section')) return;

    const sessions = data.sessions || [];
    const grades   = data.grades   || [];

    // Horas estudadas por dia (últimos 14 dias)
    const today = new Date();
    const labels = [], hoursData = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      labels.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
      const mins = sessions
        .filter(s => (s.data || s.dataHora || '').slice(0, 10) === ds && s.completada)
        .reduce((acc, s) => acc + (Number(s.duracao) || 0), 0);
      hoursData.push(+(mins / 60).toFixed(1));
    }

    // Média de notas por matéria
    const subjectGrades = {};
    grades.forEach(g => {
      if (!g.materia || !g.nota) return;
      if (!subjectGrades[g.materia]) subjectGrades[g.materia] = [];
      subjectGrades[g.materia].push(Number(g.nota));
    });
    const gradeLabels = Object.keys(subjectGrades).slice(0, 8);
    const gradeData   = gradeLabels.map(m => {
      const arr = subjectGrades[m];
      return +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1);
    });

    // Heatmap de atividade (últimos 84 dias = 12 semanas)
    const activityMap = {};
    sessions.filter(s => s.completada).forEach(s => {
      const d = (s.data || s.dataHora || '').slice(0, 10);
      if (d) activityMap[d] = (activityMap[d] || 0) + 1;
    });

    const section = document.createElement('div');
    section.id = 'slc-charts-section';
    section.style.cssText = 'padding:0 0 32px;';
    section.innerHTML = `
      <div class="card" style="margin-bottom:20px;">
        <h3 style="margin-bottom:16px;font-size:15px;font-weight:600;"><i class="fas fa-clock" style="color:var(--accent-primary);margin-right:8px;"></i>Horas estudadas — últimos 14 dias</h3>
        <div style="position:relative;height:180px;"><canvas id="chart-hours"></canvas></div>
      </div>
      ${gradeLabels.length ? `
      <div class="card" style="margin-bottom:20px;">
        <h3 style="margin-bottom:16px;font-size:15px;font-weight:600;"><i class="fas fa-star" style="color:var(--accent-warning);margin-right:8px;"></i>Médias por matéria</h3>
        <div style="position:relative;height:180px;"><canvas id="chart-grades"></canvas></div>
      </div>` : ''}
      <div class="card">
        <h3 style="margin-bottom:16px;font-size:15px;font-weight:600;"><i class="fas fa-fire" style="color:var(--accent-danger);margin-right:8px;"></i>Atividade — últimas 12 semanas</h3>
        <div id="heatmap-container" style="overflow-x:auto;"></div>
      </div>
    `;

    container.appendChild(section);
    loadChartJS(labels, hoursData, gradeLabels, gradeData, activityMap);
  }

  function loadChartJS(labels, hoursData, gradeLabels, gradeData, activityMap) {
    if (window.Chart) {
      drawCharts(labels, hoursData, gradeLabels, gradeData, activityMap);
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
    s.onload = () => drawCharts(labels, hoursData, gradeLabels, gradeData, activityMap);
    document.head.appendChild(s);
  }

  function drawCharts(labels, hoursData, gradeLabels, gradeData, activityMap) {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

    const baseOpts = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: textColor, font: { size: 11 } }, grid: { color: gridColor } },
        y: { ticks: { color: textColor, font: { size: 11 } }, grid: { color: gridColor }, beginAtZero: true }
      }
    };

    // Horas chart
    const hoursCtx = document.getElementById('chart-hours');
    if (hoursCtx) {
      new Chart(hoursCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{ data: hoursData, backgroundColor: 'rgba(59,130,246,0.7)', borderRadius: 6, borderSkipped: false }]
        },
        options: { ...baseOpts }
      });
    }

    // Grades chart
    const gradesCtx = document.getElementById('chart-grades');
    if (gradesCtx && gradeLabels.length) {
      new Chart(gradesCtx, {
        type: 'bar',
        data: {
          labels: gradeLabels,
          datasets: [{
            data: gradeData,
            backgroundColor: gradeData.map(v => v >= 7 ? 'rgba(16,185,129,0.7)' : v >= 5 ? 'rgba(245,158,11,0.7)' : 'rgba(239,68,68,0.7)'),
            borderRadius: 6, borderSkipped: false
          }]
        },
        options: { ...baseOpts, scales: { ...baseOpts.scales, y: { ...baseOpts.scales.y, max: 10 } } }
      });
    }

    // Heatmap
    const heatDiv = document.getElementById('heatmap-container');
    if (heatDiv) {
      const today = new Date();
      let html = '<div style="display:flex;gap:3px;align-items:flex-start;">';
      for (let w = 11; w >= 0; w--) {
        html += '<div style="display:flex;flex-direction:column;gap:3px;">';
        for (let d = 6; d >= 0; d--) {
          const date = new Date(today);
          date.setDate(today.getDate() - (w * 7 + d));
          const ds = date.toISOString().slice(0, 10);
          const count = activityMap[ds] || 0;
          const opacity = count === 0 ? 0.08 : count === 1 ? 0.3 : count <= 3 ? 0.6 : 1;
          html += `<div title="${ds}: ${count} sessão(ões)" style="width:12px;height:12px;border-radius:2px;background:rgba(59,130,246,${opacity});"></div>`;
        }
        html += '</div>';
      }
      html += '</div>';
      heatDiv.innerHTML = html;
    }
  }

  // ── 5. EXPORT CSV ────────────────────────────────────────────────────────
  function initExport() {
    // Adiciona botão de export na view de configurações
    document.addEventListener('click', e => {
      if (e.target.closest('#btn-export-csv') || e.target.id === 'btn-export-csv') {
        exportCSV();
      }
      if (e.target.closest('#btn-export-pdf') || e.target.id === 'btn-export-pdf') {
        exportPDF();
      }
    });
  }

  function exportCSV() {
    const data = window.app?.data;
    if (!data) return;

    const sheets = {
      'sessoes': ['data', 'materia', 'tipo', 'duracao', 'completada'],
      'tarefas': ['titulo', 'materia', 'dataLimite', 'prioridade', 'concluida'],
      'provas':  ['titulo', 'materia', 'data', 'tipo', 'nota'],
      'grades':  ['materia', 'avaliacao', 'nota', 'peso'],
    };

    let csv = '';
    Object.entries(sheets).forEach(([key, fields]) => {
      const rows = data[key] || [];
      if (!rows.length) return;
      csv += `\n### ${key.toUpperCase()} ###\n`;
      csv += fields.join(',') + '\n';
      rows.forEach(row => {
        csv += fields.map(f => `"${String(row[f] ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
      });
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement('a'), { href: url, download: 'study-life-control-dados.csv' });
    a.click();
    URL.revokeObjectURL(url);
    if (window.showToast) window.showToast('CSV exportado com sucesso!', 'success');
  }

  function exportPDF() {
    const data = window.app?.data;
    if (!data) return;

    // PDF simples via print — sem dependência externa
    const user    = data.user || {};
    const tasks   = (data.tarefas || data.tasks || []).filter(t => !t.concluida).slice(0, 20);
    const exams   = (data.provas  || data.exams  || []).slice(0, 20);
    const grades  = data.grades || [];

    const html = `
      <html><head><title>Study Life Control — Relatório</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 32px; color: #1e293b; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        h2 { font-size: 16px; margin: 24px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #f1f5f9; text-align: left; padding: 6px 8px; }
        td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; }
        .badge { display:inline-block;padding:2px 8px;border-radius:99px;font-size:11px; }
        .alta { background:#fee2e2;color:#dc2626; }
        .media { background:#fef3c7;color:#d97706; }
        .baixa { background:#dcfce7;color:#16a34a; }
      </style></head><body>
      <h1>📚 Study Life Control</h1>
      <p style="color:#64748b;font-size:13px;">Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} • ${user.nome || 'Usuário'}</p>
      <h2>Tarefas Pendentes</h2>
      <table><tr><th>Tarefa</th><th>Matéria</th><th>Prazo</th><th>Prioridade</th></tr>
      ${tasks.map(t => `<tr><td>${t.titulo||''}</td><td>${t.materia||''}</td><td>${t.dataLimite||''}</td><td><span class="badge ${t.prioridade||''}">${t.prioridade||''}</span></td></tr>`).join('')}
      </table>
      <h2>Provas e Trabalhos</h2>
      <table><tr><th>Título</th><th>Matéria</th><th>Data</th><th>Tipo</th></tr>
      ${exams.map(e => `<tr><td>${e.titulo||''}</td><td>${e.materia||''}</td><td>${e.data||''}</td><td>${e.tipo||''}</td></tr>`).join('')}
      </table>
      <h2>Notas Registradas</h2>
      <table><tr><th>Matéria</th><th>Avaliação</th><th>Nota</th><th>Peso</th></tr>
      ${grades.map(g => `<tr><td>${g.materia||''}</td><td>${g.avaliacao||''}</td><td>${g.nota||''}</td><td>${g.peso||''}%</td></tr>`).join('')}
      </table>
      </body></html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.print();
  }

  // ── 6. Botões de export na tela de configurações ─────────────────────────
  function injectExportButtons() {
    if (!window.ViewRenderer) return;
    const proto = ViewRenderer.prototype;
    if (proto.__exportPatched) return;

    const originalConfig = proto.renderConfiguracoes;
    if (!originalConfig) return;

    proto.renderConfiguracoes = function () {
      const html = originalConfig.call(this);
      const exportSection = `
        <div class="card" style="margin-top:20px;">
          <h3 style="margin-bottom:16px;font-size:15px;font-weight:600;"><i class="fas fa-download" style="color:var(--accent-primary);margin-right:8px;"></i>Exportar Dados</h3>
          <p style="color:var(--text-secondary);font-size:13px;margin-bottom:16px;">Baixe seus dados acadêmicos para backup ou análise externa.</p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button id="btn-export-csv" class="btn-secondary"><i class="fas fa-file-csv"></i> Exportar CSV</button>
            <button id="btn-export-pdf" class="btn-secondary"><i class="fas fa-file-pdf"></i> Exportar PDF</button>
          </div>
        </div>`;
      return html + exportSection;
    };
    proto.__exportPatched = true;
  }

  // ── INIT ──────────────────────────────────────────────────────────────────
  function init() {
    initTheme();

    // Botão de toggle no header
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) toggleBtn.addEventListener('click', toggleTheme);

    initSidebarGroups();
    initNavSearch();
    initExport();

    // Patches de ViewRenderer (aguarda estar disponível)
    let attempts = 0;
    const interval = setInterval(() => {
      if (window.ViewRenderer) {
        initDashboardCharts();
        injectExportButtons();
        clearInterval(interval);
      }
      if (++attempts > 20) clearInterval(interval);
    }, 300);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
