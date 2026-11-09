# Test bot + Mini App (Telegram kanal → test → ball → reyting)

## Ishlash tartibi
1. Siz botga `/yangi` xabarini yuborasiz → bot testni Firestore'ga yozadi va kanalga "✅ Testni ishlash" tugmali post joylaydi.
2. Tugma `t.me/BOT/APP?startapp=t_<testId>` ni ochadi → mini ilova aynan shu testni ko'rsatadi.
3. YUBORISH → server javoblarni tekshiradi, ball beradi, shu test bo'yicha o'rinni hisoblaydi.
4. Har bir foydalanuvchining faqat 1-urinishi hisoblanadi.

## Test yozish formati (botga yuboring)
```
/yangi 5-kun lug'at testi

1. 사과 nima degani?
a) Olma
b) Nok
c) Uzum
javob: a

2. 감사합니다 nima degani?
a) Kechirasiz
b) Rahmat
c) Xayr
d) Salom
javob: b
```
Savollar orasida bo'sh qator bo'lsin. Variantlar a)–d), javob: harf.

## O'rnatish
1. **Firebase**: Firestore yoqing → Project settings → Service accounts → "Generate new private key" (JSON).
2. **Vercel**: shu papkani GitHub orqali deploy qiling. Environment variables:
   - `BOT_TOKEN` — BotFather tokeni
   - `ADMIN_ID` — sizning Telegram ID'ingiz (@userinfobot dan)
   - `CHANNEL_ID` — kanal ID (`@kanal_username` yoki `-100...`); bot kanalda **admin** bo'lishi shart
   - `BOT_USERNAME` — botning username'i (@siz)
   - `APP_SHORT` — BotFather'da /newapp da bergan qisqa nom
   - `FIREBASE_SERVICE_ACCOUNT` — JSON faylning to'liq matni
3. **Webhook**: brauzerda oching:
   `https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://<loyiha>.vercel.app/api/bot`
4. **BotFather** → `/newapp` → botni tanlang → Web App URL: `https://<loyiha>.vercel.app/` (qisqa nom = `APP_SHORT`).
5. Botga `/yangi ...` yuboring — tayyor.

Firestore qoidalari: hammasini yopib qo'ying (`allow read, write: if false;`) — barcha ishni server (Admin SDK) bajaradi.
