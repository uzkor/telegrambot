const { getTest } = require('../lib/tg');
module.exports = async (req, res) => {
  const t = await getTest(String(req.query.id));
  if (!t || !t.photo) return res.status(404).end();
  const T = process.env.BOT_TOKEN;
  const f = await fetch(`https://api.telegram.org/bot${T}/getFile?file_id=${encodeURIComponent(t.photo)}`).then(r => r.json());
  if (!f.ok) return res.status(404).end();
  const r = await fetch(`https://api.telegram.org/file/bot${T}/${f.result.file_path}`);
  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.send(Buffer.from(await r.arrayBuffer()));
};
