const { db, verify } = require('../lib/tg');
const { daily } = require('../lib/days');
module.exports = async (req, res) => {
  const u = verify(req.headers['x-init']);
  if (!u) return res.status(401).json({ error: 'Telegram orqali oching' });
  const m = /^(\d{4})-(\d{2})$/.exec(req.query.m || '');
  if (!m) return res.status(400).json({ error: 'Oy xato' });
  const y = +m[1], mo = +m[2];
  const s = await db.collection('results').where('at', '>=', Date.UTC(y, mo - 1, 1) - 18e6).where('at', '<', Date.UTC(y, mo, 1) - 18e6).get();
  const d = daily(s.docs.map(x => x.data()));
  const days = {};
  for (const k in d) days[k] = {
    win: { n: d[k].win.n, photo: d[k].win.photo, pts: d[k].win.pts, tests: d[k].win.tests },
    top: d[k].top.map(t => ({ n: t.n, photo: t.photo, pts: t.pts, tests: t.tests }))
  };
  res.json({ days });
};
