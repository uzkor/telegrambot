const { db } = require('../lib/tg');
const T = process.env.BOT_TOKEN;
const call = (m, b) => fetch(`https://api.telegram.org/bot${T}/${m}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b)
}).then(r => r.json());

function parse(text) {
  const lines = text.split('\n');
  const title = lines.shift().replace(/^\/yangi\s*/, '').trim();
  if (!title) throw new Error('birinchi qatorda sarlavha yozing');
  const blocks = lines.join('\n').split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  if (!blocks.length) throw new Error('savollar yo\'q');
  const questions = blocks.map((b, n) => {
    const L = b.split('\n').map(x => x.trim());
    const ans = L.find(x => /^javob\s*:/i.test(x));
    if (!ans) throw new Error(`${n + 1}-savolda "javob: b" yo'q`);
    const a = 'abcd'.indexOf(ans.split(':')[1].trim().toLowerCase()[0]);
    const o = L.filter(x => /^[a-d]\)/i.test(x)).map(x => x.slice(2).trim());
    if (o.length < 2 || a < 0 || a >= o.length) throw new Error(`${n + 1}-savol variantlari/javobi xato`);
    return { q: L[0].replace(/^\d+[.)]\s*/, ''), o, a };
  });
  return { title, questions };
}

module.exports = async (req, res) => {
  const m = (req.body || {}).message;
  if (m && m.text) {
    if (String(m.from.id) === process.env.ADMIN_ID && m.text.startsWith('/yangi')) {
      try {
        const t = parse(m.text);
        const ref = await db.collection('tests').add({ ...t, at: Date.now() });
        const link = `https://t.me/${process.env.BOT_USERNAME}/${process.env.APP_SHORT}?startapp=t_${ref.id}`;
        await call('sendMessage', {
          chat_id: process.env.CHANNEL_ID,
          text: `📝 ${t.title}\n${t.questions.length} ta savol`,
          reply_markup: { inline_keyboard: [[{ text: '✅ Testni ishlash', url: link }]] }
        });
        await call('sendMessage', { chat_id: m.chat.id, text: 'Test kanalga joylandi ✅' });
      } catch (e) {
        await call('sendMessage', { chat_id: m.chat.id, text: 'Format xato: ' + e.message });
      }
    } else if (m.text === '/start') {
      await call('sendMessage', { chat_id: m.chat.id, text: 'Salom! Testlar kanalimizda joylanadi.' });
    }
  }
  res.status(200).send('ok');
};
