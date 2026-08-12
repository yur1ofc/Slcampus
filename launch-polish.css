// invite-friend.js — Link de convite (?ref=uid) + contagem simples de
// quantos amigos cada usuário trouxe. Não depende de nenhum serviço externo:
// grava direto no Firestore que o app já usa (via window.db, já autenticado
// pelas regras do próprio usuário).

(function () {
  'use strict';

  const STORAGE_REF = 'slc_ref_code';

  // Captura o ?ref= da URL assim que a página carrega, antes do usuário logar.
  function capturarRefDaURL() {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref && !localStorage.getItem(STORAGE_REF)) {
      localStorage.setItem(STORAGE_REF, ref);
    }
  }

  // Depois que o primeiro cadastro (finishSetup) salva os dados, registra
  // o referral uma única vez — sem tocar no setup-wizard.js, só observando
  // o dbService que ele já chama.
  function patchDbServiceParaReferral() {
    const svc = window.dbService;
    if (!svc || svc.__referralPatched || typeof svc.saveAllData !== 'function') return;
    svc.__referralPatched = true;

    const _origSave = svc.saveAllData.bind(svc);
    svc.saveAllData = async function (...args) {
      const result = await _origSave(...args);

      const refCode = localStorage.getItem(STORAGE_REF);
      const uid = window.auth?.currentUser?.uid;
      if (refCode && uid && refCode !== uid && window.db) {
        try {
          const already = await window.db.collection('referrals').doc(uid).get();
          if (!already.exists) {
            // Só grava "quem me indicou" no meu próprio documento — as regras
            // do Firestore não deixam escrever em documento de outro usuário.
            // Quem quiser saber quantos indicou conta via query (abaixo).
            await window.db.collection('referrals').doc(uid).set({
              referrer: refCode,
              criadoEm: new Date().toISOString()
            });
          }
        } catch (err) {
          console.warn('[invite-friend] não foi possível registrar o referral:', err.message);
        } finally {
          localStorage.removeItem(STORAGE_REF);
        }
      }

      return result;
    };
  }

  async function convidarAmigo() {
    const uid = window.auth?.currentUser?.uid;
    if (!uid) return;

    const link = `${location.origin}${location.pathname}?ref=${uid}`;
    const texto = 'Tô usando o Study Life Control pra organizar meus estudos, é bem bom — dá uma olhada:';

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Study Life Control', text: texto, url: link });
        return;
      } catch {
        // usuário cancelou — cai pro clipboard abaixo
      }
    }

    try {
      await navigator.clipboard.writeText(`${texto} ${link}`);
      window.showToast?.('Link copiado! Cola pra quem quiser 😉');
    } catch {
      window.prompt('Copie seu link de convite:', link);
    }
  }

  async function contarIndicacoes() {
    const uid = window.auth?.currentUser?.uid;
    if (!uid || !window.db) return 0;
    const snap = await window.db.collection('referrals').where('referrer', '==', uid).get();
    return snap.size;
  }

  capturarRefDaURL();

  document.addEventListener('app-ready', () => {
    setTimeout(patchDbServiceParaReferral, 500);
  });

  window.SLC_inviteFriend = convidarAmigo;
  window.SLC_countReferrals = contarIndicacoes;
})();
