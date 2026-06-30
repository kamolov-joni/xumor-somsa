# Render'ga deploy qilish (backend + Telegram bot)

Backend (Express API + SQLite baza + Telegram bot) endi **bitta jarayonda** ishlaydi.
Render'da bot avtomatik **webhook** rejimiga o'tadi, lokalda esa **polling**.

---

## 1. Kodni GitHub'ga yuklang

```bash
git add -A
git commit -m "Render deploy: bot + server birlashtirildi"
git push
```

## 2. Render'da Web Service yarating

1. https://render.com → **New +** → **Blueprint** (loyihadagi `render.yaml`ni o'qiydi)
   yoki **Web Service** → GitHub repo'ni tanlang.
2. Agar qo'lda sozlasangiz:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

## 3. Muhit o'zgaruvchilari (Environment)

Render dashboard → **Environment** bo'limida qo'shing:

| Key | Value |
|-----|-------|
| `TELEGRAM_BOT_TOKEN` | `8674171432:AAFq-bURjN_7Thk5iAMasFEDmO9zK_Mm35w` |
| `DB_PATH` | `/data/orders.db` (faqat persistent disk bo'lsa) |
| `BACKUP_DIR` | `/data/backups` (faqat persistent disk bo'lsa) |

> `RENDER_EXTERNAL_URL` ni Render avtomatik beradi — bot webhookni shundan oladi.
> Qo'shimcha hech narsa sozlash shart emas.

## 4. Deploy

Deploy tugagach, Render sizga manzil beradi, masalan:
`https://somsa-order-backend.onrender.com`

Loglarda quyidagini ko'rishingiz kerak:
```
✅ Telegram bot WEBHOOK rejimida ishga tushdi: https://somsa-order-backend.onrender.com/telegram/webhook/...
```

Telegramda botga `/start` yuborib sinab ko'ring.

## 5. Netlify'ni backendga ulang

Netlify dashboard → **Site settings → Environment variables**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://somsa-order-backend.onrender.com/api` |

So'ng Netlify'da **Redeploy** qiling (env o'zgarishi build vaqtida o'qiladi).

Endi Netlifedagi sayt Render'dagi backendga ulanadi va bot qo'shgan buyurtmalar saytda ko'rinadi.

---

## ⚠️ MUHIM: Free vs Starter tarif

**Render Free tarif:**
- ❌ Persistent disk **yo'q** → SQLite bazasi har deploy/qayta ishga tushishda **o'chib ketadi** (buyurtmalar yo'qoladi).
- ❌ 15 daqiqa harakatsizlikdan keyin **uyquga ketadi**; yangi xabar kelganda uyg'onadi, lekin birinchi javob 30–60 soniya kechikadi.
- ✅ Sinov uchun yaxshi.
- Free ishlatish uchun: `render.yaml`dan `disk:` blokini va `DB_PATH`/`BACKUP_DIR` ni olib tashlang, `plan: free` qiling.

**Render Starter (~$7/oy) — haqiqiy biznes uchun tavsiya:**
- ✅ Persistent disk (`/data`) → ma'lumotlar saqlanib qoladi.
- ✅ Doimiy yoniq, uyquga ketmaydi, bot tez javob beradi.
- `render.yaml` allaqachon shu rejimga sozlangan.

> Eslatma: SQLite kichik loyiha uchun yetarli. Agar kelajakda kattaroq kerak bo'lsa,
> bepul hostlangan Postgres (Neon/Supabase) yoki Turso'ga o'tish mumkin.

---

## 🤖 Bot QOTMASLIGI uchun (eng muhim)

Bot "qotishi" (javob bermay qolishi)ning 4 sababi bor. Kod tomonidan 1–3 hal qilindi;
4-chisi siz dashboardda bajaradigan ish.

**1. Baza tokeni eskirib qolishi (eng ko'p uchraydigan sabab) — `TURSO_AUTH_TOKEN` 401.**
Bu sodir bo'lsa bot avval umuman jim qolardi. Endi:
- Bot baza ulanmasa ham ishga tushadi va menyu ishlaydi.
- Buyurtma/hisobotda baza javob bermasa, foydalanuvchiga aniq xato chiqadi (jim qolmaydi).

**Lekin asl yechim — tokenni MUDDATSIZ qilish**, shunda u hech qachon eskirmaydi:
```bash
turso db tokens create <db-nomi> --expiration none
```
So'ng Render → **Environment** → `TURSO_AUTH_TOKEN` ni yangilang → **Manual Deploy**.

**2. Baza sekin javob bersa — endi 8 soniyalik timeout bor.** Bot kutib qotmaydi,
"⏳ Baza sekin javob beryapti" deb javob beradi.

**3. Suhbat o'rtasida server qayta ishga tushsa** (Render free reboot) — eski kodda bot
keyingi xabarni JIM YUTAR edi. Endi menyu ko'rsatadi: "Buyurtma berish uchun tugmani bosing".

**4. Render free 15 daqiqada uxlab qoladi.** Server o'zini har 4 daqiqada ping qiladi
(kodda) — odatda shuning o'zi yetarli. **Kafolatli bo'lishi uchun** tashqi pingni ham qo'shing:
- https://cron-job.org (bepul) yoki https://uptimerobot.com
- URL: `https://somsa-order-backend.onrender.com/api/health`
- Interval: **5 daqiqa**

> ⚠️ 750 soat/oy bepul limit — bitta doimiy yoniq servis ~730 soat ishlatadi, limitга sig'adi.

### Tezkor tashxis (bot javob bermayotganda)
```bash
# Webhook to'g'ri o'rnatilganmi? (url bo'sh yoki last_error 404 bo'lsa — muammo bot init'da)
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Baza ishlayaptimi? (401 -> TURSO_AUTH_TOKEN eskirgan)
curl "https://somsa-order-backend.onrender.com/api/orders"

# Server uyg'oqmi?
curl "https://somsa-order-backend.onrender.com/api/health"
```

> ⚠️ Render jonli turganda lokalda `node server.js` ni ISHGA TUSHIRMANG — lokal polling
> `deleteWebhook` chaqirib, Render webhookini o'chiradi (Render restart bo'lguncha bot o'lik qoladi).

---

## 🌐 Buyurtmalar saytda ko'rinishi (telegram → sayt)

Bot qo'shgan buyurtma avtomatik saytda ko'rinadi, chunki:
- Bot va sayt **bitta Turso bazasini** ishlatadi (bot yozadi → API o'qiydi).
- Sayt har **5 soniyada** `/api/orders` ni so'raydi (sahifani yangilash shart emas).

Buning ishlashi uchun Netlify'da **`VITE_API_URL`** to'g'ri bo'lishi SHART:
`https://somsa-order-backend.onrender.com/api` (oxirida `/api`). O'zgartirgach Netlify'da **Redeploy** qiling.
