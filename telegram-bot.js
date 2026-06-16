import TelegramBot from 'node-telegram-bot-api';

// Telegram botni ishga tushiradi.
// - db: server.js bilan bir xil sqlite3 ulanish (lock muammosi bo'lmaydi)
// - app: express app (webhook rejimida route mount qilish uchun)
//
// Rejim avtomatik tanlanadi:
//   TELEGRAM_WEBHOOK_URL yoki RENDER_EXTERNAL_URL bo'lsa -> WEBHOOK (Render/production)
//   bo'lmasa -> POLLING (lokal development)
export function initTelegramBot({ db, app }) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_TOKEN) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN topilmadi — Telegram bot ishga tushmadi.');
    return null;
  }

  const WEBHOOK_BASE = process.env.TELEGRAM_WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL;
  const useWebhook = Boolean(WEBHOOK_BASE) && Boolean(app);

  const bot = new TelegramBot(TELEGRAM_TOKEN, useWebhook ? {} : { polling: true });

  if (useWebhook) {
    const secretPath = `/telegram/webhook/${TELEGRAM_TOKEN}`;
    const fullUrl = `${WEBHOOK_BASE.replace(/\/$/, '')}${secretPath}`;
    app.post(secretPath, (req, res) => {
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });
    bot.setWebHook(fullUrl)
      .then(() => console.log('✅ Telegram bot WEBHOOK rejimida ishga tushdi:', fullUrl))
      .catch((e) => console.error('❌ Webhook o\'rnatishda xato:', e.message));
  } else {
    // Lokal: avval eski webhook qoldiqlarini tozalaymiz, keyin polling
    bot.deleteWebHook().catch(() => {});
    console.log('✅ Telegram bot POLLING rejimida ishga tushdi (lokal)');
  }

  // Polling/webhook xatolari botni to'xtatib qo'ymasin
  bot.on('polling_error', (err) => {
    console.error('⚠️  Polling xatosi:', err.code || err.message);
  });
  bot.on('webhook_error', (err) => {
    console.error('⚠️  Webhook xatosi:', err.code || err.message);
  });

  // Suhbat davomidagi vaqtinchalik holat
  const userStates = {};

  function generateOrderId() {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // Sana: avval kun, keyin oy, ixtiyoriy yil. Har qanday ajratuvchi yoki ajratuvchisiz.
  function parseFlexibleDate(input) {
    const currentYear = new Date().getFullYear();
    let day, month, year;

    const parts = input.trim().split(/\D+/).filter(Boolean);

    if (parts.length === 2) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = currentYear;
    } else if (parts.length === 3) {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
      if (year < 100) year += 2000;
    } else if (parts.length === 1) {
      const digits = parts[0];
      if (digits.length === 3) {
        day = parseInt(digits.substring(0, 1), 10);
        month = parseInt(digits.substring(1, 3), 10);
      } else if (digits.length === 4) {
        day = parseInt(digits.substring(0, 2), 10);
        month = parseInt(digits.substring(2, 4), 10);
      } else {
        return null;
      }
      year = currentYear;
    } else {
      return null;
    }

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const candidate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (parts.length !== 3 && candidate < today) {
      year += 1;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function mainMenuKeyboard() {
    return {
      reply_markup: {
        inline_keyboard: [
          [{ text: '➕ Yangi buyurtma qo\'shish', callback_data: 'add_order' }],
          [{ text: '📋 Hisobot', callback_data: 'report' }],
          [{ text: '💳 To\'lov holati', callback_data: 'payment_status' }],
        ],
      },
    };
  }

  function getMainMenu() {
    return {
      reply_markup: {
        inline_keyboard: [[{ text: '⬅️ Bosh menyu', callback_data: 'main' }]],
      },
    };
  }

  // /start
  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, '👋 Xush kelibsiz! Nima qilmoqchisiz?', mainMenuKeyboard());
  });

  // Callback tugmalar
  bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const action = query.data;

    if (action === 'add_order') {
      startAddingOrder(chatId);
    } else if (action === 'report') {
      showReport(chatId);
    } else if (action === 'payment_status') {
      showPaymentStatus(chatId);
    } else if (action === 'back' || action === 'main') {
      bot.sendMessage(chatId, '👋 Bosh menu. Nima qilmoqchisiz?', mainMenuKeyboard());
    }

    // Eski/yaroqsiz query'lar uchun xatoni jim o'tkazib yuboramiz
    bot.answerCallbackQuery(query.id).catch(() => {});
  });

  function startAddingOrder(chatId) {
    userStates[chatId] = { step: 'fullName' };
    bot.sendMessage(chatId, '📝 Ism va familiyangizni kiriting:');
  }

  // Matnli xabarlar
  bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (!text || text.startsWith('/')) return;
    if (!userStates[chatId]) return;

    const state = userStates[chatId];

    if (state.step === 'fullName') {
      state.fullName = text.trim();
      state.step = 'quantity';
      bot.sendMessage(chatId, '🥟 Nechta somsa kerak?');
    } else if (state.step === 'quantity') {
      if (isNaN(text.trim())) {
        return bot.sendMessage(chatId, '❌ Iltimos, raqam kiriting!');
      }
      state.quantity = parseInt(text.trim());
      state.step = 'location';
      bot.sendMessage(chatId, '📍 Lokatsiyani kiriting (masalan: Mirobod, Shaykhantaur):');
    } else if (state.step === 'location') {
      state.location = text.trim();
      state.step = 'deliveryTime';
      bot.sendMessage(chatId, '⏰ Qaysi soatda kerak? (masalan: 18:00):');
    } else if (state.step === 'deliveryTime') {
      if (!/^\d{1,2}:\d{2}$/.test(text.trim())) {
        return bot.sendMessage(chatId, '❌ Vaqt formati xato! (soat:minut, masalan: 18:00)');
      }
      // "4:00" → "04:00" (ISO 8601 uchun)
      const t = text.trim();
      state.deliveryTime = t.length === 4 ? '0' + t : t;
      state.step = 'date';
      bot.sendMessage(chatId, '📅 Qaysi kuni? (avval kun, keyin oy. Masalan: 31 12 yoki 5 3):');
    } else if (state.step === 'date') {
      const parsedDate = parseFlexibleDate(text.trim());
      if (!parsedDate) {
        return bot.sendMessage(chatId, '❌ Sana noto\'g\'ri.\nAvval kun, keyin oy yozing:\n• 31 12\n• 5 3\n• 31.12\n• 31/12');
      }
      state.deliveryDate = parsedDate;
      saveOrder(chatId, state);
      delete userStates[chatId];
    }
  });

  function saveOrder(chatId, state) {
    const orderId = generateOrderId();
    const now = new Date().toISOString();
    const products = [{ name: 'Somsa', quantity: state.quantity }];

    const sql = `
      INSERT INTO orders (
        id, title, customerName, phone, address,
        products, notes, deliveryDate, deliveryTime,
        status, createdAt, updatedAt, paymentStatus, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      orderId,
      `${state.fullName} - Somsa (${state.quantity})`,
      state.fullName,
      chatId.toString(),
      state.location,
      JSON.stringify(products),
      'Telegram botdan qo\'shilgan',
      state.deliveryDate,
      state.deliveryTime,
      'pending',
      now,
      now,
      'unpaid',
      'telegram',
    ];

    db.run(sql, values, function (err) {
      if (err) {
        bot.sendMessage(chatId, '❌ Xato: ' + err.message);
        return;
      }

      const confirmMsg = `
✅ Buyurtma muvaffaqiyatli qo'shildi!

📋 Buyurtma ma'lumotlari:
👤 Ismi-Familiyasi: ${state.fullName}
🥟 Somsa: ${state.quantity} ta
📍 Lokatsiya: ${state.location}
⏰ Vaqti: ${state.deliveryTime}
📅 Sana: ${state.deliveryDate}
💳 To'lov: Qilinmagani

🆔 Buyurtma ID: ${orderId}
      `;

      bot.sendMessage(chatId, confirmMsg, getMainMenu());
    });
  }

  function showReport(chatId) {
    const sql = `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN paymentStatus = 'unpaid' THEN 1 ELSE 0 END) as unpaid,
        SUM(CASE WHEN paymentStatus = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(json_extract(products, '$[0].quantity')) as totalItems
      FROM orders
      WHERE source = 'telegram'
    `;

    db.get(sql, [], (err, stats) => {
      if (err) {
        bot.sendMessage(chatId, '❌ Xato: ' + err.message);
        return;
      }

      const reportMsg = `
📊 HISOBOT

📦 Jami buyurtmalar: ${stats.total || 0}
✅ To'langan: ${stats.paid || 0}
❌ To'lanmagani: ${stats.unpaid || 0}
🥟 Jami somsa: ${stats.totalItems || 0}

Telegram botdan: ${stats.total || 0}
      `;

      bot.sendMessage(chatId, reportMsg, getMainMenu());
    });
  }

  function showPaymentStatus(chatId) {
    const sql = `
      SELECT id, customerName, quantity, location, deliveryTime, paymentStatus
      FROM (
        SELECT
          id, customerName, json_extract(products, '$[0].quantity') as quantity,
          address as location, deliveryTime, paymentStatus
        FROM orders
        WHERE source = 'telegram'
        ORDER BY createdAt DESC
        LIMIT 20
      )
    `;

    db.all(sql, [], (err, orders) => {
      if (err) {
        bot.sendMessage(chatId, '❌ Xato: ' + err.message);
        return;
      }

      if (!orders || orders.length === 0) {
        bot.sendMessage(chatId, '📭 Hali buyurtma yo\'q', getMainMenu());
        return;
      }

      let reportText = '💳 TO\'LOV HOLATI\n\n';
      let unpaidCount = 0;

      orders.forEach((order, index) => {
        const statusEmoji = order.paymentStatus === 'paid' ? '✅' : '❌';
        const statusText = order.paymentStatus === 'paid' ? 'To\'langan' : 'To\'lanmagani';
        if (order.paymentStatus === 'unpaid') unpaidCount++;

        reportText += `${index + 1}. ${order.customerName}\n`;
        reportText += `   📍 ${order.location} | ⏰ ${order.deliveryTime}\n`;
        reportText += `   🥟 ${order.quantity} ta somsa\n`;
        reportText += `   ${statusEmoji} ${statusText}\n`;
        reportText += `   🆔 ${order.id}\n\n`;
      });

      reportText += `\n❌ To'lanmagani: ${unpaidCount}`;

      const keyboard = {
        reply_markup: {
          inline_keyboard: [
            [{ text: '💰 To\'lovni belgilash', callback_data: 'mark_payment' }],
            [{ text: '← Orqaga', callback_data: 'back' }],
          ],
        },
      };

      bot.sendMessage(chatId, reportText, keyboard);
    });
  }

  // /pay <orderId> — to'lovni belgilash
  bot.onText(/\/pay (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const orderId = match[1];

    const sql = 'UPDATE orders SET paymentStatus = ?, updatedAt = ? WHERE id = ? AND source = ?';
    const now = new Date().toISOString();

    db.run(sql, ['paid', now, orderId, 'telegram'], function (err) {
      if (err) {
        bot.sendMessage(chatId, '❌ Xato: ' + err.message);
        return;
      }
      if (this.changes === 0) {
        bot.sendMessage(chatId, '❌ Buyurtma topilmadi!');
        return;
      }
      bot.sendMessage(chatId, `✅ To'lov belgilandi!\n\nBuyurtma ID: ${orderId}`, getMainMenu());
    });
  });

  // /help
  bot.onText(/\/help/, (msg) => {
    const helpText = `
📖 BUYURTMA BOTI YORDAM

Mavjud buyrutmalar:
/start - Bosh menyu
/help - Bu yordam

Buyurtmalar Telegram botdan qo'shiladi va web saytda ko'rinadi!

Telegram bot imkoniyatlari:
✅ Yangi buyurtma qo'shish
✅ To'lov holatini ko'rish
✅ Hisobotlarni ko'rish
✅ To'lovni belgilash (/pay [ID])
    `;
    bot.sendMessage(msg.chat.id, helpText);
  });

  console.log('🤖 Bot: @xumor_somsa_order_bot');
  return bot;
}
