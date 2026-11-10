const { db, verify, state, getTest, isOk, rightOf } = require('../lib/tg');
module.exports = async (req, res) => {
  const u = verify(req.headers['x-init']);
  if (!u) return res.status(401).json({ error: 'Telegram orqali oching' });
  const { id, qi, choice } = req.body || {};
  const sid = String(id);
  const rdoc = db.collection('results').doc(sid + '_' + u.id), pref = db.collection('progress').doc(sid + '_' + u.id);
  const [t, rs, ps] = await Promise.all([getTest(sid), rdoc.get(), pref.get()]); // bitta safarda o'qiladi
  if (!t) return res.status(404).json({ error: 'Test topilmadi' });
  if (rs.exists) return res.json({ finished: true, state: await state(sid, u) });
  const qs = t.questions, q = qs[qi];
  if (!q) return res.status(400).json({ error: 'Xato' });
  const valid = q.o ? (Number.isInteger(choice) && choice >= 0 && choice < q.o.length) : (typeof choice === 'string' && choice.length <= 200);
  if (!valid) return res.status(400).json({ error: 'Xato' });
  const p = ps.exists ? ps.data() : { start: Date.now(), answers: {} };
  if (p.answers[qi] === undefined) p.answers[qi] = choice; // birinchi javob o'zgarmaydi
  await pref.set(p);
  const chosen = p.answers[qi];
  const out = { right: rightOf(q), choice: chosen, correct: isOk(q, chosen) };
  if (Object.keys(p.answers).length >= qs.length) {
    const score = qs.reduce((s, x, i) => s + (isOk(x, p.answers[i]) ? 1 : 0), 0);
    try {
      await rdoc.create({
        testId: sid, uid: u.id, score, total: qs.length, time: Math.round((Date.now() - p.start) / 1000), at: Date.now(),
        name: u.first_name + (u.last_name ? ' ' + u.last_name : ''), photo: u.photo_url || ''
      });
    } catch (e) { /* allaqachon yozilgan */ }
    out.finished = true;
    out.state = await state(sid, u);
  }
  res.json(out);
};
