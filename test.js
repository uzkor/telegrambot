const { verify, state } = require('../lib/tg');
module.exports = async (req, res) => {
  const u = verify(req.headers['x-init']);
  if (!u) return res.status(401).json({ error: 'Telegram orqali oching' });
  const r = await state(String(req.query.id), u);
  if (!r) return res.status(404).json({ error: 'Test topilmadi' });
  res.json(r);
};
