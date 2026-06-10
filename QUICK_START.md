# ⚡ Tez O'rnatish - Telegram Bot

## 1️⃣ Bot Token Oling

1. Telegramda `@BotFather` ga yozing
2. `/newbot` yuboring
3. Bot nomi kiriting: `Somsa Order Bot` (yoki o'z nomingiz)
4. Bot username kiriting: `somsa_order_bot_XXXXX` (noyob nom)
5. BotFather sizga **TOKEN** beradi

**Misol:**
```
123456789:ABCdefGHIjklmnoPQRstuvwxyz
```

## 2️⃣ Proyektni Setup Qiling

```bash
# Proyekt papkasiga kiring
cd /Users/jony/Desktop/order

# .env faylini yarating
echo "TELEGRAM_BOT_TOKEN=YOUR_TOKEN_HERE" > .env

# Dependencies o'rnatish
npm install
```

## 3️⃣ Bot va Serverni Ishga Tushiring

```bash
# Hammasi birga (bot + server + web):
npm run dev

# Yoki faqat bot:
npm run telegram

# Yoki faqat server:
npm run server
```

## 4️⃣ Telegram Botdan Foydalaning

Bot bilansoruv qiling:
- Telegramda botni izlang: `somsa_order_bot_XXXXX`
- `/start` yuboring
- Menyu paydo bo'ladi ✨

## 📱 Bot Menyu

```
➕ Yangi buyurtma qo'shish
   └─ Ism, Familiya, Somsa soni, Lokatsiya, Vaqt, Sana

📋 Hisobot
   └─ Jami, To'langan, To'lanmagani, Jami somsa

💳 To'lov Holati
   └─ Barcha buyurtmalar + /pay ORD-ID untuk belgilash
```

## 🌐 Web Saytga Kiring

```
http://localhost:5173
```

Telegram botdan qo'shilgan buyurtmalar automatik ko'rinadi! 🎉

## 🐛 Xato bo'lsa?

| Muammo | Yechim |
|--------|--------|
| Bot javob bermayapti | Token to'g'ri ekanligini tekshiring |
| Database xatosi | Server ishlagani tekshiring: `npm run server` |
| Port band | Port 5001 ochiqmi? |

## 📖 Ko'proq Bilish

Batafsil qo'llanma: `TELEGRAM_BOT_SETUP.md`

---

✅ Tayyor! Telegram botingizda `/start` yuboring!
