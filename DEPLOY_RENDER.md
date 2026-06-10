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
