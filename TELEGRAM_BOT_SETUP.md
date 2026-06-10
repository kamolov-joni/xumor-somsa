# 🤖 Telegram Bot O'rnatish Qo'llanmasi

Bu qo'llanma Telegram botni o'rnatish va ishga tushirish uchun zarur qadamlarni ko'rsatadi.

## 📋 Zarur narsalar

- Telegram akkaunt
- @BotFather dan yaratilgan bot token
- Node.js installed

## 🚀 O'rnatish qadamlari

### 1. Telegram Bot Yaratish

1. Telegramda `@BotFather` ga xabar yuboring
2. `/newbot` komandasini yuboring
3. Bot nomini kiriting (masalan: "Somsa Order Bot")
4. Bot username ni kiriting (masalan: "somsa_order_bot")
5. BotFather sizga **TOKEN** beradi - bu token ni saqlab qo'ying

### 2. Bot Tokeni Qo'shish

1. Proyekt papkasida `.env` faylini yarating yoki mavjud `.env` ni tahrirlang:

```env
TELEGRAM_BOT_TOKEN=YOUR_TOKEN_HERE
```

Yoki `telegram-bot.example.env` faylini `.env` ga nomi o'zgartiring va tokenni qo'ying.

### 3. Dependencies O'rnatish

```bash
npm install
```

Bu `node-telegram-bot-api` ham o'rnatadi.

### 4. Bot Ishga Tushirish

**Faqat Telegram Bot:**
```bash
npm run telegram
```

**Telegram Bot + Server + Frontend (dev mode):**
```bash
npm run dev
```

## 📱 Telegram Bot Buyurtmasi

Telegram botda quyidagi buyrutmalar mavjud:

### `/start` - Bosh menyu
Bot bosh menyusini ochadi:
- ➕ Yangi buyurtma qo'shish
- 📋 Hisobot
- 💳 To'lov holati

### Yangi Buyurtma Qo'shish (`➕`)

Bot sizga quyidagi ma'lumotlarni so'raydi:

1. **Ism** - Sizning ismingiz
   ```
   Javob: Jaloliddin
   ```

2. **Familiya** - Sizning familiyangiz
   ```
   Javob: Otabekov
   ```

3. **Nechta Somsa** - Somsa soni
   ```
   Javob: 5
   ```

4. **Lokatsiya** - Yaşash joyingiz
   ```
   Javob: Mirobod, Tashkent
   ```

5. **Vaqt** - Somsa kerak bo'lgan vaqt (HH:MM formati)
   ```
   Javob: 18:00
   ```

6. **Sana** - Somsa kerak bo'lgan sana (YYYY-MM-DD formati)
   ```
   Javob: 2025-12-31
   ```

Bot buyurtmani saqlab, ID bilan tasdiqlovchi xabar yuboradi.

### 📋 Hisobot (`📋`)

Barcha buyurtmalarning statistikasini ko'rsatadi:
- Jami buyurtmalar
- To'langan buyurtmalar
- To'lanmagani buyurtmalar
- Jami somsa soni

### 💳 To'lov Holati (`💳`)

Oxirgi 20 ta buyurtmaning to'lov holatini ko'rsatadi:

```
1. Jaloliddin Otabekov
   📍 Mirobod | ⏰ 18:00
   🥟 5 ta somsa
   ❌ To'lanmagani
   🆔 ORD-1234567890-abcdefg
```

**To'lovni belgilash:**
- `/pay ORD-1234567890-abcdefg` - buyurtmani "To'langan" qilib belgilaydi

## 🔗 Web Interfeys bilan Integratsiya

Telegram botdan qo'shilgan barcha buyurtmalar web saytda ham ko'rinadi:

1. Web saytga kiring: `http://localhost:5173`
2. Yangi "Telegram" ustuni bilan buy-urtmalarni ko'rishingiz mumkin
3. Web saytdan ham to'lov holatini yangilashingiz mumkin

## 🌐 API Endpoints (Telegram Bot uchun)

Bot quyidagi REST API endpoints dan foydalanadi:

- `POST /api/orders` - Yangi buyurtma qo'shish
- `GET /api/orders` - Barcha buyurtmalarni olish
- `PUT /api/orders/:id/payment` - To'lov holatini yangilash
- `GET /api/report/payment` - To'lov holatining hisoboti

## 🐛 Muammolar va Yechimlar

### Bot xabar qabul qilmayapti
- Telegramda `/start` yuboring
- Bot token to'g'ri ekanligini tekshiring
- `npm run telegram` to'g'ri ishlapti ekanligini tekshiring

### Database xatosi
- `orders.db` faylining ruxsatlari tekshiring
- Database ishga tushgan ekanligini tekshiring (`npm run server`)

### Token xatosi
- `.env` faylida `TELEGRAM_BOT_TOKEN` to'g'ri o'rnatilganini tekshiring
- @BotFather dan yangi token olib ko'ring

## 📊 Database Tuzilishi

Telegram botdan qo'shilgan buyurtmalar quyidagi ma'lumotlarni saqlab qoladi:

```sql
- id: Buyurtma ID (ORD-xxxxx)
- customerName: Ismi-familiyasi
- address: Lokatsiya
- products: Somsa miqdori (JSON)
- deliveryDate: Sana
- deliveryTime: Vaqt
- paymentStatus: To'lov holati (paid/unpaid/partial)
- source: Manbai (telegram/web)
- createdAt: Yaratilgan sana
```

## 💡 Maslahatlar

1. **Telegram Grupp:** Botni group chatga qo'shib, o'quv xonasidan buyurtma qo'shishingiz mumkin
2. **Admin Panel:** Web saytda to'lov holatini yangilashingiz mumkin
3. **Hisobotlar:** `/api/report/payment` API dan hisobotlarni olib, Google Sheets ga joylashtira olasiz

## 📞 Qo'shimcha Yordam

- Telegram Bot API: https://core.telegram.org/bots/api
- @BotFather: Telegramda @BotFather ni izlang

---

✨ Bot muvaffaqiyatli o'rnatildi! Telegram botingizda `/start` buyurtmasini yuboring!
