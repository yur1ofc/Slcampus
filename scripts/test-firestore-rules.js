// Teste local das regras do Firestore (../firestore.rules) contra o emulador.
// Não toca em produção: roda só contra 127.0.0.1 com projeto demo-*.
//
// Como rodar:
//   1. Java instalado (o emulador do Firestore é um .jar): java -version
//   2. Emulador no ar (a seção `emulators` do firebase.json define as portas):
//        cmd /c firebase emulators:start --only firestore,auth --project demo-slcampus-rules
//   3. SDK client do Firebase (não altera package.json/lock):
//        cmd /c npm i --no-save --no-package-lock firebase
//   4. node scripts/test-firestore-rules.js   → exit 0 = 12/12 PASS
//
// Cada caso espera ALLOW ou DENY. O emulador mantém estado entre execuções e
// cada run tem uid anônimo novo, por isso ids de doc levam sufixo por run (RUN).
const { initializeApp } = require('firebase/app');
const { getFirestore, connectFirestoreEmulator, doc, setDoc, updateDoc } = require('firebase/firestore');
const { getAuth, connectAuthEmulator, signInAnonymously } = require('firebase/auth');

const ISO = '2026-11-08T12:00:00.000Z';

async function main() {
  const app = initializeApp({ projectId: 'demo-slcampus-rules', apiKey: 'demo-api-key' });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const cred = await signInAnonymously(auth);
  const uid = cred.user.uid;
  const RUN = uid.slice(0, 8); // id por run (emulador mantém estado entre execuções)
  console.log('auth ok (anonimo), uid =', uid);

  const results = [];
  async function expect(name, want, fn) {
    try {
      await fn();
      const got = 'allow';
      const pass = got === want;
      results.push({ name, want, got, pass });
      console.log((pass ? 'PASS' : 'FAIL') + ' | ' + name + ' | esperado ' + want + ', obtido ' + got);
    } catch (e) {
      const msg = String(e);
      const denied = /PERMISSION_DENIED|permission-denied|insufficient permissions|permission denied/i.test(msg);
      const got = denied ? 'deny' : 'ERRO: ' + msg.slice(0, 140);
      const pass = denied && want === 'deny';
      results.push({ name, want, got, pass });
      console.log((pass ? 'PASS' : 'FAIL') + ' | ' + name + ' | esperado ' + want + ', obtido ' + got);
    }
  }

  const userDoc = {
    sessions: [], tasks: [], exams: [], materials: [], grades: [], dailyLogs: [],
    classDiaries: [], curriculum: [], extraCourses: [], pushSubscriptions: [],
    sentReminders: [], sentTelegramReminders: [], telegramProcessedUpdates: [],
    telegramInbox: [], learningEvidence: [], questionAttempts: [], reviews: [],
    learningMap: [], classSchedule: [], archivedSemesters: [],
    settings: {}, user: {}
  };

  const catalogDoc = (extra) => Object.assign({
    key: 'teste__curso', faculdade: 'Teste', curso: 'Curso', subjects: ['a', 'b'],
    updatedAt: ISO, createdAt: ISO, updatedBy: uid, createdBy: uid,
    version: '1', confidence: 0.5, stats: { usersCount: 1, componentsCount: 2 }
  }, extra || {});

  // ── users ────────────────────────────────────────────────────────────────
  await expect('users create com todos os arrays', 'allow',
    () => setDoc(doc(db, 'users', uid), userDoc));

  await expect('users update valido (settings)', 'allow',
    () => updateDoc(doc(db, 'users', uid), { settings: { theme: 'dark' } }));

  await expect('users update legítimo alterando uma lista (sessions com item novo)', 'allow',
    () => updateDoc(doc(db, 'users', uid), { sessions: userDoc.sessions.concat([{ data: 'nova-sessao' }]) }));

  // Doc no formato do documento real de produção: campos ausentes (arquivados/
  // remessas de telegram nunca gravados). Prova que os guards `('x' in d) || ...`
  // curto-circuitam e não derrubam update de doc legado.
  // Auth separada: users exige id do doc == uid (isOwner), então este teste usa
  // um uid próprio sem trocar a sessão dos testes principais.
  const app2 = initializeApp({ projectId: 'demo-slcampus-rules', apiKey: 'demo-api-key' }, 'legacy');
  const auth2 = getAuth(app2);
  connectAuthEmulator(auth2, 'http://127.0.0.1:9099', { disableWarnings: true });
  const cred2 = await signInAnonymously(auth2);
  const db2 = getFirestore(app2);
  connectFirestoreEmulator(db2, '127.0.0.1', 8080);
  const uid2 = cred2.user.uid;
  await expect('users create/update em doc legado com campos ausentes', 'allow', async () => {
    await setDoc(doc(db2, 'users', uid2), { sessions: [], tasks: [], settings: {}, user: {} });
    await updateDoc(doc(db2, 'users', uid2), { tasks: [{ t: 'nova-tarefa' }] });
  });

  await expect('users update com sessions virando string (type-safety)', 'deny',
    () => updateDoc(doc(db, 'users', uid), { sessions: 'nao-e-lista' }));

  await expect('users update com learningMap virando string (type-safety)', 'deny',
    () => updateDoc(doc(db, 'users', uid), { learningMap: { hack: true } }));

  await expect('users update alterando campo so-do-servidor (telegramInbox)', 'deny',
    () => updateDoc(doc(db, 'users', uid), { telegramInbox: ['injected'] }));

  // ── feedback ─────────────────────────────────────────────────────────────
  // ids por RUN: o emulador mantém estado entre execuções e cada run tem uid
  // anônimo novo — ids fixos fariam create cair no caminho de update.
  await expect('feedback create completo (criadoEm ISO string)', 'allow',
    () => setDoc(doc(db, 'feedback', 't1-' + RUN), {
      tipo: 'sugestao', mensagem: 'mensagem de teste', uid,
      pagina: '#home', origem: 'botao', criadoEm: ISO
    }));

  await expect('feedback create sem criadoEm', 'deny',
    () => setDoc(doc(db, 'feedback', 't2-' + RUN), {
      tipo: 'sugestao', mensagem: 'mensagem de teste', uid, pagina: '', origem: 'x'
    }));

  // ── community_catalogs ───────────────────────────────────────────────────
  const CK = 'teste__curso_' + RUN;
  await expect('catalog create completo (createdAt ISO string)', 'allow',
    () => setDoc(doc(db, 'community_catalogs', CK), catalogDoc({ key: CK })));

  await expect('catalog create sem createdAt', 'deny',
    () => setDoc(doc(db, 'community_catalogs', 'teste__outro_' + RUN), (() => { const c = catalogDoc({ key: 'teste__outro_' + RUN }); delete c.createdAt; return c; })()));

  await expect('catalog update pelo owner (merge com mesmo createdAt)', 'allow',
    () => setDoc(doc(db, 'community_catalogs', CK),
      { updatedAt: ISO, confidence: 0.9, createdAt: ISO }, { merge: true }));

  const failed = results.filter(r => !r.pass);
  console.log('\nresumo: ' + (results.length - failed.length) + '/' + results.length + ' PASS');
  if (failed.length) process.exitCode = 1;
}

main().then(() => setTimeout(() => process.exit(process.exitCode || 0), 500))
  .catch(e => { console.error('FATAL:', e); process.exit(2); });
