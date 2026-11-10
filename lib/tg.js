const crypto = require('crypto');
const admin = require('firebase-admin');
if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = admin.firestore();

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

// Test hujjati xotirada 60 soniya saqlanadi (javob tezroq qaytishi uchun)
const cache = {};
async function getTest(id) {
  const c = cache[id];
  if (c && Date.now() - c.at < 60000) return c.t;
  const d = await db.collection('tests').doc(id).get();
  if (!d.exists) return null;
  cache[id] = { t: d.data(), at: Date.now() };
  return cache[id].t;
}
// Yoziladigan javob: katta-kichik harf, bo'shliq va tinish belgilari hisobga olinmaydi
const norm = s => String(s == null ? '' : s).normalize('NFC').toLowerCase().replace(/[\s.,!?'"“”‘’·~\-]/g, '');
const isOk = (q, a) => q.o ? a === q.a : typeof a === 'string' && q.acc.some(x => norm(x) === norm(a));
const rightOf = q => q.o ? q.a : q.acc[0];

async function state(id, u) {
  const t = await getTest(id);
  if (!t) return null;
  const [s, pd] = await Promise.all([
    db.collection('results').where('testId', '==', id).get(),
    db.collection('progress').doc(id + '_' + u.id).get()
  ]);
  const b = s.docs.map(x => x.data()).sort((a, c) => c.score - a.score || a.time - c.time || a.at - c.at);
  const i = b.findIndex(r => r.uid === u.id);
  const prog = i < 0 && pd.exists ? Object.entries(pd.data().answers).map(([k, v]) => {
    const q = t.questions[+k]; return { qi: +k, choice: v, right: rightOf(q), ok: isOk(q, v) };
  }) : [];
  return {
    prog, title: t.title, img: !!t.photo,
    qs: t.questions.map(q => ({ q: q.q, o: q.o || null })),
    done: i >= 0 ? { score: b[i].score, total: t.questions.length, rank: i + 1 } : null,
    top: b.slice(0, 50).map(r => ({ n: r.name, s: r.score, me: r.uid === u.id })),
    count: b.length
  };
}
module.exports = { db, verify, state, getTest, isOk, rightOf };
