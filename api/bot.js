const { db } = require('../lib/tg');
const T = process.env.BOT_TOKEN;
const call = (m, b) => fetch(`https://api.telegram.org/bot${T}/${m}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(b)
}).then(r => r.json());

function parse(text) {
  const lines = text.split('\n');
  const title = lines.shift().replace(/^\/yangi\s*/, '').trim();
  if (!title) throw new Error('birinchi qatorda sarlavha yozing');
  // sarlavhadan keyingi, bo'sh qatorgacha bo'lgan qatorlar: tugma: va matn:
  const head = [];
  while (lines.length && lines[0].trim()) head.push(lines.shift().trim());
  let btn = '', msg = [], inMsg = false;
  for (const h of head) {
    if (/^tugma\s*:/i.test(h)) { btn = h.replace(/^tugma\s*:/i, '').trim(); inMsg = false; }
    else if (/^matn\s*:/i.test(h)) { msg = [h.replace(/^matn\s*:/i, '').trim()]; inMsg = true; }
    else if (inMsg) msg.push(h);
  }
  const blocks = lines.join('\n').split(/\n\s*\n/).map(b => b.trim()).filter(Boolean);
  // javobsiz va variantsiz boshlang'ich bloklar (bo'sh qatorli matn abzaclari) matnga qo'shiladi
  while (blocks.length && !/^javob\s*:/im.test(blocks[0]) && !/^[a-d]\)/im.test(blocks[0])) msg.push('', blocks.shift());
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
  return { title, questions, btn, msg: msg.join('\n') };
}

module.exports = async (req, res) => {
  const m = (req.body || {}).message;
  const text = m && (m.text || m.caption);
  if (text) {
    if (String(m.from.id) === process.env.ADMIN_ID && text.startsWith('/yangi')) {
      try {
        const t = parse(text);
        const ref = await db.collection('tests').add({ title: t.title, questions: t.questions, at: Date.now() });
        const link = `https://t.me/${process.env.BOT_USERNAME}/${process.env.APP_SHORT}?startapp=t_${ref.id}`;
        const caption = t.msg || `📝 ${t.title}\n${t.questions.length} ta savol`;
        const reply_markup = { inline_keyboard: [[{ text: t.btn || '✅ Testni ishlash', url: link }]] };
        // rasm: /yangi xabarining o'zida yoki rasmga reply qilingan bo'lsa
        const photo = m.photo || (m.reply_to_message && m.reply_to_message.photo);
        let r;
        if (photo) {
          if (caption.length > 1024) throw new Error('matn 1024 belgidan uzun (rasmli postda limit shu)');
          r = await call('sendPhoto', { chat_id: process.env.CHANNEL_ID, photo: photo[photo.length - 1].file_id, caption, reply_markup });
        } else {
          r = await call('sendMessage', { chat_id: process.env.CHANNEL_ID, text: caption, reply_markup });
        }
        if (!r.ok) throw new Error(r.description);
        await call('sendMessage', { chat_id: m.chat.id, text: 'Test kanalga joylandi ✅' });
      } catch (e) {
        await call('sendMessage', { chat_id: m.chat.id, text: 'Format xato: ' + e.message });
      }
    } else if (text === '/start') {
      await call('sendMessage', { chat_id: m.chat.id, text: 'Salom! Testlar kanalimizda joylanadi.' });
    }
  }
  res.status(200).send('ok');
};
