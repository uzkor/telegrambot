const { db, verify, state } = require('../lib/tg');
module.exports = async (req, res) => {
  const u = verify(req.headers['x-init']);
  if (!u) return res.status(401).json({ error: 'Telegram orqali oching' });
  const { id, answers, time } = req.body || {};
  const d = await db.collection('tests').doc(String(id)).get();
  if (!d.exists) return res.status(404).json({ error: 'Test topilmadi' });
  const qs = d.data().questions;
  const score = qs.reduce((s, q, i) => s + (answers && answers[i] === q.a ? 1 : 0), 0); // javoblar faqat serverda tekshiriladi
  try {
    // create() faqat birinchi urinishni saqlaydi, qayta ishlash ballni o'zgartirmaydi
    await db.collection('results').doc(id + '_' + u.id).create({
      testId: id, uid: u.id, score, time: Number(time) || 0, at: Date.now(),
      name: u.first_name + (u.last_name ? ' ' + u.last_name : '')
    });
  } catch (e) { /* allaqachon ishlagan */ }
  res.json(await state(id, u));
};
