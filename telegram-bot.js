import { Bot, GrammyError, HttpError, webhookCallback } from 'grammy';

export function initTelegramBot({ db, app }) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_TOKEN) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN topilmadi — bot ishga tushmadi.');
    return null;
  }

  const bot = new Bot(TELEGRAM_TOKEN);

  // Suhbat davomidagi vaqtinchalik holat
  const userStates = {};

  function generateOrderId() {
    return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // "4:00" → "04:00" (ISO 8601 uchun)
  function padTime(t) {
    if (!t) return '00:00';
    return t.length === 4 ? '0' + t : t;
  }

  // Sana: avval kun, keyin oy. Har qanday ajratuvchi.
  function parseFlexibleDate(input) {
    const currentYear = new Date().getFullYear();
    let day, month, year;
    const parts = input.trim().split(/\D+/).filter(Boolean);

    if (parts.length === 2) {
      [day, month] = parts.map(Number);
      year = currentYear;
    } else if (parts.length === 3) {
      [day, month, year] = parts.map(Number);
      if (year < 100) year += 2000;
    } else if (parts.length === 1) {
      const d = parts[0];
      if (d.length === 3) { day = +d[0]; month = +d.slice(1); }
      else if (d.length === 4) { day = +d.slice(0, 2); month = +d.slice(2); }
      else return null;
      year = currentYear;
    } else return null;

    if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    const candidate = new Date(year, month - 1, day);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (parts.length !== 3 && candidate < today) year += 1;

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function mainMenu() {
    return {
      inline_keyboard: [
        [{ text: '➕ Yangi buyurtma qo\'shish', callback_data: 'add_order' }],
        [{ text: '📋 Hisobot', callback_data: 'report' }],
        [{ text: '💳 To\'lov holati', callback_data: 'payment_status' }],
      ]
    };
  }

  function backMenu() {
    return { inline_keyboard: [[{ text: '⬅️ Bosh menyu', callback_data: 'main' }]] };
  }

  // /start
  bot.command('start', (ctx) =>
    ctx.reply('👋 Xush kelibsiz! Nima qilmoqchisiz?', { reply_markup: mainMenu() })
  );

  // /help
  bot.command('help', (ctx) =>
    ctx.reply(`📖 BUYURTMA BOTI YORDAM\n\n/start - Bosh menyu\n/help - Yordam\n/pay [ID] - To'lovni belgilash\n\n✅ Yangi buyurtma qo'shish\n✅ To'lov holatini ko'rish\n✅ Hisobotlarni ko'rish`)
  );

  // /pay <orderId>
  bot.command('pay', (ctx) => {
    const orderId = ctx.match?.trim();
    if (!orderId) return ctx.reply('❌ Buyurtma ID kiriting: /pay ORD-...');
    const now = new Date().toISOString();
    db.run('UPDATE orders SET paymentStatus=?, updatedAt=? WHERE id=? AND source=?',
      ['paid', now, orderId, 'telegram'],
      function (err) {
        if (err) return ctx.reply('❌ Xato: ' + err.message);
        if (this.changes === 0) return ctx.reply('❌ Buyurtma topilmadi!');
        ctx.reply(`✅ To'lov belgilandi!\n🆔 ${orderId}`, { reply_markup: backMenu() });
      }
    );
  });

  // Callback tugmalar
  bot.on('callback_query:data', async (ctx) => {
    const action = ctx.callbackQuery.data;
    const chatId = ctx.chat.id;

    await ctx.answerCallbackQuery().catch(() => {});

    if (action === 'add_order') {
      userStates[chatId] = { step: 'fullName' };
      await ctx.reply('📝 Ism va familiyangizni kiriting:');
    } else if (action === 'report') {
      showReport(ctx, chatId);
    } else if (action === 'payment_status') {
      showPaymentStatus(ctx, chatId);
    } else if (action === 'main' || action === 'back') {
      await ctx.reply('👋 Bosh menu:', { reply_markup: mainMenu() });
    }
  });

  // Matnli xabarlar — suhbat qadamlari
  bot.on('message:text', async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;
    if (text.startsWith('/')) return;

    const state = userStates[chatId];
    if (!state) return;

    if (state.step === 'fullName') {
      state.fullName = text.trim();
      state.step = 'quantity';
      await ctx.reply('🥟 Nechta somsa kerak?');
    } else if (state.step === 'quantity') {
      if (isNaN(text.trim())) return ctx.reply('❌ Iltimos, raqam kiriting!');
      state.quantity = parseInt(text.trim());
      state.step = 'location';
      await ctx.reply('📍 Lokatsiyani kiriting (masalan: Mirobod, Shaykhantaur):');
    } else if (state.step === 'location') {
      state.location = text.trim();
      state.step = 'deliveryTime';
      await ctx.reply('⏰ Qaysi soatda kerak? (masalan: 18:00):');
    } else if (state.step === 'deliveryTime') {
      if (!/^\d{1,2}:\d{2}$/.test(text.trim()))
        return ctx.reply('❌ Vaqt formati xato! (soat:minut, masalan: 18:00)');
      state.deliveryTime = padTime(text.trim());
      state.step = 'date';
      await ctx.reply('📅 Qaysi kuni? (avval kun, keyin oy. Masalan: 31 12 yoki 5 3):');
    } else if (state.step === 'date') {
      const parsedDate = parseFlexibleDate(text.trim());
      if (!parsedDate)
        return ctx.reply('❌ Sana noto\'g\'ri.\nAvval kun, keyin oy:\n• 31 12\n• 5 3\n• 31.12\n• 31/12');
      state.deliveryDate = parsedDate;
      delete userStates[chatId];
      saveOrder(ctx, chatId, state);
    }
  });

  function saveOrder(ctx, chatId, state) {
    const orderId = generateOrderId();
    const now = new Date().toISOString();
    const products = JSON.stringify([{ name: 'Somsa', quantity: state.quantity }]);

    const sql = `INSERT INTO orders
      (id,title,customerName,phone,address,products,notes,deliveryDate,deliveryTime,status,createdAt,updatedAt,paymentStatus,source)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;

    const vals = [
      orderId,
      `${state.fullName} - Somsa (${state.quantity})`,
      state.fullName,
      String(chatId),
      state.location,
      products,
      'Telegram botdan qo\'shilgan',
      state.deliveryDate,
      state.deliveryTime,
      'pending',
      now, now,
      'unpaid',
      'telegram',
    ];

    db.run(sql, vals, function (err) {
      if (err) return ctx.reply('❌ Xato: ' + err.message);
      ctx.reply(
        `✅ Buyurtma qo'shildi!\n\n👤 ${state.fullName}\n🥟 ${state.quantity} ta somsa\n📍 ${state.location}\n⏰ ${state.deliveryTime}\n📅 ${state.deliveryDate}\n💳 To'lanmagan\n\n🆔 ${orderId}`,
        { reply_markup: backMenu() }
      );
    });
  }

  function showReport(ctx, chatId) {
    db.get(`SELECT COUNT(*) as total,
      SUM(CASE WHEN paymentStatus='unpaid' THEN 1 ELSE 0 END) as unpaid,
      SUM(CASE WHEN paymentStatus='paid' THEN 1 ELSE 0 END) as paid,
      SUM(json_extract(products,'$[0].quantity')) as totalItems
      FROM orders WHERE source='telegram'`, [], (err, s) => {
      if (err) return ctx.reply('❌ Xato: ' + err.message);
      ctx.reply(
        `📊 HISOBOT\n\n📦 Jami: ${s.total || 0}\n✅ To'langan: ${s.paid || 0}\n❌ To'lanmagan: ${s.unpaid || 0}\n🥟 Jami somsa: ${s.totalItems || 0}`,
        { reply_markup: backMenu() }
      );
    });
  }

  function showPaymentStatus(ctx, chatId) {
    db.all(`SELECT id, customerName,
      json_extract(products,'$[0].quantity') as quantity,
      address as location, deliveryTime, paymentStatus
      FROM orders WHERE source='telegram' ORDER BY createdAt DESC LIMIT 20`, [], (err, rows) => {
      if (err) return ctx.reply('❌ Xato: ' + err.message);
      if (!rows?.length) return ctx.reply('📭 Hali buyurtma yo\'q', { reply_markup: backMenu() });

      let text = '💳 TO\'LOV HOLATI\n\n';
      let unpaid = 0;
      rows.forEach((o, i) => {
        const paid = o.paymentStatus === 'paid';
        if (!paid) unpaid++;
        text += `${i + 1}. ${o.customerName}\n   📍 ${o.location} | ⏰ ${o.deliveryTime}\n   🥟 ${o.quantity} ta | ${paid ? '✅ To\'langan' : '❌ To\'lanmagan'}\n   🆔 ${o.id}\n\n`;
      });
      text += `\n❌ To'lanmagan: ${unpaid}`;
      ctx.reply(text, { reply_markup: backMenu() });
    });
  }

  // Xato handler
  bot.catch((err) => {
    if (err instanceof GrammyError) {
      console.error('Telegram xatosi:', err.message);
    } else if (err instanceof HttpError) {
      console.error('Network xatosi:', err.message);
    } else {
      console.error('Kutilmagan xato:', err.message);
    }
  });

  // Webhook (Render) yoki Polling (lokal) rejimi
  const WEBHOOK_BASE = process.env.TELEGRAM_WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL;

  if (WEBHOOK_BASE && app) {
    const secretPath = `/telegram/webhook/${TELEGRAM_TOKEN}`;
    const fullUrl = `${WEBHOOK_BASE.replace(/\/$/, '')}${secretPath}`;
    // webhookCallback botni avtomatik init qiladi (bot.init) va xatolarni boshqaradi.
    // Eski kod bot.handleUpdate'ni init qilmasdan chaqirardi -> "Bot not initialized!"
    // xatosi jimgina yo'qolardi va bot /start'da qotib qolardi.
    app.post(secretPath, webhookCallback(bot, 'express'));
    bot.api.setWebhook(fullUrl)
      .then(() => console.log('✅ Bot WEBHOOK rejimida:', fullUrl))
      .catch((e) => console.error('❌ Webhook xatosi:', e.message));
  } else {
    // Eski webhook'ni tozalab, polling'ni boshlash
    bot.api.deleteWebhook({ drop_pending_updates: true })
      .then(() => {
        bot.start({
          onStart: () => {
            console.log('✅ Bot POLLING rejimida ishga tushdi (lokal)');
            console.log('🤖 Bot: @xumor_somsa_order_bot');
          }
        });
      })
      .catch((e) => console.error('❌ Start xatosi:', e.message));
  }

  return bot;
}
