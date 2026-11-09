const crypto = require('crypto');
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();

// Telegram initData imzosini tekshirish (soxtalashtirishdan himoya)
function verify(initData) {
  const p = new URLSearchParams(initData || '');
  const hash = p.get('hash'); p.delete('hash');
  if (!hash) return null;
  const s = [...p.entries()].map(([k, v]) => k + '=' + v).sort().join('\n');
  const key = crypto.createHmac('sha256', 'WebAppData').update(process.env.BOT_TOKEN).digest();
  if (crypto.createHmac('sha256', key).update(s).digest('hex') !== hash) return null;
  if (Date.now() / 1000 - Number(p.get('auth_date')) > 86400) return null;
  return JSON.parse(p.get('user'));
}

// Reyting: ball kamayish bo'yicha, teng bo'lsa tezroq ishlagan yuqorida (JS-tomonda saralash)
async function state(id, u) {
  const d = await db.collection('tests').doc(id).get();
  if (!d.exists) return null;
  const t = d.data();
  const s = await db.collection('results').where('testId', '==', id).get();
  const b = s.docs.map(x => x.data()).sort((a, c) => c.score - a.score || a.time - c.time || a.at - c.at);
  const i = b.findIndex(r => r.uid === u.id);
  let prog = [];
  if (i < 0) {
    const pd = await db.collection('progress').doc(id + '_' + u.id).get();
    if (pd.exists) prog = Object.entries(pd.data().answers).map(([k, v]) => ({ qi: +k, choice: v, right: t.questions[+k].a }));
  }
  return {
    prog,
    title: t.title,
    qs: t.questions.map(q => ({ q: q.q, o: q.o })),
    done: i >= 0 ? { score: b[i].score, total: t.questions.length, rank: i + 1 } : null,
    top: b.slice(0, 10).map(r => ({ n: r.name, s: r.score, me: r.uid === u.id })),
    count: b.length
  };
}
module.exports = { db, verify, state };
