// share-card.js — Gera uma imagem (canvas) da sequência de estudo do
// usuário pra compartilhar no Instagram Stories/WhatsApp. 100% client-side,
// sem custo de servidor. Usa o streak que o Mentor IA já calcula
// (proto._calcularSequenciaDias, adicionado no v9).

(function () {
  'use strict';

  function desenharCard(streak, nome) {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920; // proporção de Stories (9:16)
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, '#0a0f1f');
    grad.addColorStop(1, '#1a1040');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = 'center';

    ctx.font = '600 44px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.65)';
    ctx.fillText('STUDY LIFE CONTROL', canvas.width / 2, 260);

    ctx.font = '260px system-ui, sans-serif';
    ctx.fillText('🔥', canvas.width / 2, 760);

    ctx.font = '700 220px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(streak), canvas.width / 2, 1000);

    ctx.font = '600 60px system-ui, sans-serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.fillText(streak === 1 ? 'DIA SEGUIDO ESTUDANDO' : 'DIAS SEGUIDOS ESTUDANDO', canvas.width / 2, 1100);

    if (nome) {
      ctx.font = '500 46px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,.8)';
      ctx.fillText(nome, canvas.width / 2, 1550);
    }

    ctx.font = '500 38px system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,.5)';
    ctx.fillText('organize seus estudos também 👉', canvas.width / 2, 1780);

    return canvas;
  }

  async function compartilharSequencia() {
    const streak = window.aiAssistant?._calcularSequenciaDias?.() ?? 0;
    if (streak < 1) {
      window.showToast?.('Comece a estudar hoje pra desbloquear sua primeira sequência! 🔥', 'info');
      return;
    }

    const nome = window.app?.data?.user?.nome || '';
    const canvas = desenharCard(streak, nome);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'minha-sequencia-slc.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Study Life Control',
            text: `${streak} dias seguidos estudando! 🔥`
          });
          return;
        } catch {
          // usuário cancelou o compartilhamento — cai pro download abaixo
        }
      }

      // Fallback: baixa a imagem
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'minha-sequencia-slc.png';
      a.click();
      URL.revokeObjectURL(url);
      window.showToast?.('Imagem baixada! Agora é só postar 🚀');
    }, 'image/png');
  }

  window.SLC_shareStreak = compartilharSequencia;
})();
