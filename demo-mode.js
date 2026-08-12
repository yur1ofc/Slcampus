// demo-mode.js — "Ver demonstração" sem precisar criar conta. Carrega dados
// fictícios só na memória (nada vai pro Firestore — loadData()/saveAllData()
// já não tocam no Firebase quando não há usuário logado, então isso funciona
// sem mexer no fluxo de auth existente).

(function () {
  'use strict';

  function gerarDadosDemo() {
    const hoje = new Date();
    const iso = (diasAtras) => new Date(hoje.getTime() - diasAtras * 86400000).toISOString();

    const materias = ['Cálculo I', 'Algoritmos', 'Física I', 'Banco de Dados'];

    const sessions = [];
    materias.forEach((materia, i) => {
      for (let d = 0; d < 6; d++) {
        if ((d + i) % 2 === 0) {
          sessions.push({
            id: `demo_s_${materia}_${d}`,
            materia,
            duracao: 40 + (d % 3) * 15,
            data: iso(d),
            concluida: true
          });
        }
      }
    });

    return {
      user: {
        nome: 'Visitante',
        curso: 'Ciência da Computação',
        universidade: 'Universidade Demonstração',
        semestre: '4',
        turnoPrincipal: 'noite',
        diasPreferidos: ['seg', 'ter', 'qua', 'qui', 'sex'],
        horasMaximas: 4,
        createdAt: iso(20),
        streak: 4,
        lastStudyDate: iso(0)
      },
      subjects: materias.map((nome, i) => ({
        id: `demo_sub_${i}`,
        nome,
        dificuldade: 2 + (i % 3),
        peso: 3,
        notaDesejada: 7
      })),
      sessions,
      exams: [
        { id: 'demo_e1', materia: 'Cálculo I', nome: 'P2', data: iso(-3) },
        { id: 'demo_e2', materia: 'Banco de Dados', nome: 'Prova prática', data: iso(-9) }
      ],
      tasks: [
        { id: 'demo_t1', titulo: 'Lista de exercícios — Física I', concluida: false, dataVencimento: iso(-2) },
        { id: 'demo_t2', titulo: 'Trabalho de Algoritmos', concluida: true, concluidaEm: iso(1) }
      ],
      grades: [
        { id: 'demo_g1', materia: 'Cálculo I', avaliacao: 'P1', valor: 7.5, peso: 40 },
        { id: 'demo_g2', materia: 'Banco de Dados', avaliacao: 'Trabalho 1', valor: 8.8, peso: 30 }
      ],
      curriculum: [],
      classSchedule: [],
      dailyLogs: []
    };
  }

  function ativarBannerDemo() {
    if (document.getElementById('demo-mode-banner')) return;
    const banner = document.createElement('div');
    banner.id = 'demo-mode-banner';
    banner.style.cssText = `
      position: sticky; top: 0; z-index: 9998; width: 100%; text-align: center;
      background: #6366f1; color: #fff; padding: 8px 12px; font-size: 13px; font-weight: 600;
    `;
    banner.innerHTML = `👀 Modo demonstração — dados fictícios, nada é salvo. <a href="#" id="demo-exit-link" style="color:#fff;text-decoration:underline;margin-left:6px;">Criar minha conta</a>`;
    document.body.prepend(banner);
    document.getElementById('demo-exit-link').addEventListener('click', (e) => {
      e.preventDefault();
      location.reload();
    });
  }

  async function iniciarDemo() {
    window.SLC_DEMO_MODE = true;
    if (!window.app) { console.error('[demo-mode] app ainda não carregou.'); return; }

    window.app.data = gerarDadosDemo();

    const login = document.getElementById('login-screen');
    const dash = document.getElementById('main-dashboard');
    if (login) login.style.display = 'none';
    if (dash) dash.style.display = 'block';

    ativarBannerDemo();
    await window.app.init();
    window.showToast?.('Explorando em modo demonstração — crie sua conta quando quiser salvar de verdade!');
  }

  function injetarBotaoDemo() {
    const loginBody = document.querySelector('.login-body');
    if (!loginBody || document.getElementById('demo-mode-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'demo-mode-btn';
    btn.type = 'button';
    btn.style.cssText = `
      width: 100%; margin-top: 10px; padding: 12px; border-radius: 10px;
      background: transparent; border: 1px solid rgba(255,255,255,.18);
      color: inherit; cursor: pointer; font-weight: 600;
    `;
    btn.innerHTML = '<i class="fas fa-eye"></i> Ver demonstração (sem cadastro)';
    btn.addEventListener('click', iniciarDemo);

    const googleBtn = document.getElementById('login-google');
    googleBtn?.insertAdjacentElement('afterend', btn);
  }

  // Evita salvar/sobrescrever dados fictícios sem querer.
  function patchSaveNoDemoMode() {
    const svc = window.dbService;
    if (!svc || svc.__demoGuardPatched || typeof svc.saveAllData !== 'function') return;
    svc.__demoGuardPatched = true;

    const _orig = svc.saveAllData.bind(svc);
    svc.saveAllData = async function (...args) {
      if (window.SLC_DEMO_MODE) {
        window.showToast?.('Isso é só uma demonstração — crie sua conta pra salvar de verdade.', 'info');
        return false;
      }
      return _orig(...args);
    };
  }

  document.addEventListener('DOMContentLoaded', injetarBotaoDemo);
  if (document.readyState !== 'loading') injetarBotaoDemo();
  setTimeout(patchSaveNoDemoMode, 500);
})();
