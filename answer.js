const { db, verify, state } = require('../lib/tg');
module.exports = async (req, res) => {
  const u = verify(req.headers['x-init']);
  if (!u) return res.status(401).json({ error: 'Telegram orqali oching' });
  const { id, qi, choice } = req.body || {};
  const td = await db.collection('tests').doc(String(id)).get();
  if (!td.exists) return res.status(404).json({ error: 'Test topilmadi' });
  const qs = td.data().questions;
  if (!(qi >= 0 && qi < qs.length) || !(choice >= 0 && choice < qs[qi].o.length)) return res.status(400).json({ error: 'Xato' });
  const rdoc = db.collection('results').doc(id + '_' + u.id);
  if ((await rdoc.get()).exists) return res.json({ finished: true, state: await state(id, u) });
  const pref = db.collection('progress').doc(id + '_' + u.id);
  const ps = await pref.get();
  const p = ps.exists ? ps.data() : { start: Date.now(), answers: {} };
  if (p.answers[qi] === undefined) p.answers[qi] = choice; // birinchi javob o'zgarmaydi
  await pref.set(p);
  const chosen = p.answers[qi];
  const out = { right: qs[qi].a, choice: chosen, correct: chosen === qs[qi].a };
  if (Object.keys(p.answers).length >= qs.length) {
    const score = qs.reduce((s, q, i) => s + (p.answers[i] === q.a ? 1 : 0), 0);
    try {
      await rdoc.create({
        testId: id, uid: u.id, score, total: qs.length, time: Math.round((Date.now() - p.start) / 1000), at: Date.now(),
        name: u.first_name + (u.last_name ? ' ' + u.last_name : '')
      });
    } catch (e) { /* allaqachon yozilgan */ }
    out.finished = true;
    out.state = await state(id, u);
  }
  res.json(out);
};
