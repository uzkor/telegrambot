const { db, verify } = require('../lib/tg');
const { daily } = require('../lib/days');
module.exports = async (req, res) => {
  const u = verify(req.headers['x-init']);
  if (!u) return res.status(401).json({ error: 'Telegram orqali oching' });
  const all = (await db.collection('results').get()).docs.map(d => d.data());
  const by = {};
  for (const r of all) { const x = by[r.uid] || (by[r.uid] = { uid: r.uid, name: r.name, pts: 0, n: 0 }); x.pts += r.score; x.n++; }
  const board = Object.values(by).sort((a, b) => b.pts - a.pts || a.n - b.n);
  const mine = all.filter(r => r.uid === u.id).sort((a, b) => b.at - a.at);
  const ids = [...new Set(mine.map(r => r.testId))];
  const docs = await Promise.all(ids.map(i => db.collection('tests').doc(i).get()));
  const meta = {};
  docs.forEach(d => { if (d.exists) meta[d.id] = { t: d.data().title, n: d.data().questions.length }; });
  const rank = r => 1 + all.filter(x => x.testId === r.testId && (x.score > r.score || (x.score === r.score && x.time < r.time))).length;
  const nq = r => r.total || (meta[r.testId] || {}).n || 0;
  const pts = mine.reduce((s, r) => s + r.score, 0), tq = mine.reduce((s, r) => s + nq(r), 0);
  const wins = Object.values(daily(all)).filter(d => String(d.win.uid) === String(u.id)).length;
  res.json({
    me: { n: mine.length, pts, acc: tq ? Math.round(100 * pts / tq) : 0, rank: board.findIndex(b => b.uid === u.id) + 1, wins },
    users: board.length,
    list: mine.slice(0, 50).map(r => ({ id: r.testId, t: (meta[r.testId] || {}).t || 'Test', s: r.score, n: nq(r), rank: rank(r) })),
    board: board.slice(0, 100).map(b => ({ n: b.name, s: b.pts, me: b.uid === u.id }))
  });
};
