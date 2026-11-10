// Kunlik g'oliblar (Toshkent vaqti, UTC+5): kun ichidagi jami ball eng ko'p bo'lgan foydalanuvchi
const day = a => new Date(a + 18e6).toISOString().slice(0, 10);
function daily(all) {
  const D = {};
  for (const r of all) {
    const x = D[day(r.at)] || (D[day(r.at)] = {});
    const y = x[r.uid] || (x[r.uid] = { uid: r.uid, n: r.name, photo: r.photo || '', pts: 0, tests: 0, t: 0, at: r.at });
    y.pts += r.score; y.tests++; y.t += r.time || 0; y.at = Math.min(y.at, r.at);
    if (r.photo) y.photo = r.photo;
  }
  const out = {};
  for (const k in D) {
    const a = Object.values(D[k]).sort((p, q) => q.pts - p.pts || p.t - q.t || p.at - q.at);
    out[k] = { win: a[0], top: a.slice(0, 3) };
  }
  return out;
}
module.exports = { day, daily };
