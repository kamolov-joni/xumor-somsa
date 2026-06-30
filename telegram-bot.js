import { Bot, GrammyError, HttpError, webhookCallback } from 'grammy';

export function initTelegramBot({ db, app }) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  if (!TELEGRAM_TOKEN) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN topilmadi — bot ishga tushmadi.');
    return null;
  }

  const bot = new Bot(TELEGRAM_TOKEN);

  // Suhbat davomidagi vaqtinchalik holat (xotirada). Server qayta ishga tushsa
  // yo'qoladi — shuning uchun pastda "holat yo'q" holati JIM qolmaydi, menyu beradi.
  const userStates = {};

  // ─── DB yordamchilari: Promise + TIMEOUT ─────────────────────────────────
  // Eng muhim "qotish" sababi — Turso/baza sekin javob bersa yoki ulanmasa,
  // callback umuman chaqirilmaydi va bot jim qoladi. Timeout shuni oldini oladi:
  // baza 8 soniyada javob bermasa — foydalanuvchiga aniq xato ko'rsatamiz.
  const DB_TIMEOUT_MS = 8000;

  function withTimeout(promise, ms = DB_TIMEOUT_MS) {
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('DB_TIMEOUT')), ms);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
  }

  const dbRun = (sql, params = []) =>
    withTimeout(new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ changes: this?.changes ?? 0, lastID: this?.lastID });
      });
    }));

  const dbGet = (sql, params = []) =>
    withTimeout(new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    }));

  const dbAll = (sql, params = []) =>
    withTimeout(new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows || [])));
    }));

  // Baza xatosini foydalanuvchiga tushunarli matnga aylantiramiz
  function dbErrorText(e) {
    const msg = e?.message || '';
    if (msg === 'DB_TIMEOUT')
      return '⏳ Baza hozir sekin javob beryapti. Birozdan keyin qayta urinib ko\'ring.';
    if (/401|unauth|expired|token/i.test(msg))
      return '🔌 Baza ulanishini yangilash kerak (TURSO_AUTH_TOKEN eskirgan). Admin bilan bog\'laning.';
    return '❌ Baza xatosi. Birozdan keyin qayta urinib ko\'ring.';
  }

  // Har qanday holatda javob beramiz — hech qachon jim qolmaymiz
  const safeReply = (ctx, text, extra) => ctx.reply(text, extra).catch(() => {});

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
    safeReply(ctx, '👋 Xush kelibsiz! Nima qilmoqchisiz?', { reply_markup: mainMenu() })
  );

  // /help
  bot.command('help', (ctx) =>
    safeReply(ctx, `📖 BUYURTMA BOTI YORDAM\n\n/start - Bosh menyu\n/help - Yordam\n/pay [ID] - To'lovni belgilash\n\n✅ Yangi buyurtma qo'shish\n✅ To'lov holatini ko'rish\n✅ Hisobotlarni ko'rish`)
  );

  // /pay <orderId>
  bot.command('pay', async (ctx) => {
    try {
      const orderId = ctx.match?.trim();
      if (!orderId) return safeReply(ctx, '❌ Buyurtma ID kiriting: /pay ORD-...');
      const now = new Date().toISOString();
      const { changes } = await dbRun(
        'UPDATE orders SET paymentStatus=?, updatedAt=? WHERE id=? AND source=?',
        ['paid', now, orderId, 'telegram']
      );
      if (changes === 0) return safeReply(ctx, '❌ Buyurtma topilmadi!');
      await safeReply(ctx, `✅ To'lov belgilandi!\n🆔 ${orderId}`, { reply_markup: backMenu() });
    } catch (e) {
      await safeReply(ctx, dbErrorText(e), { reply_markup: backMenu() });
    }
  });

  // Callback tugmalar — har biri try/catch ichida, hech qachon jim qolmaydi
  bot.on('callback_query:data', async (ctx) => {
    await ctx.answerCallbackQuery().catch(() => {});
    const action = ctx.callbackQuery.data;
    const chatId = ctx.chat?.id;

    try {
      if (action === 'add_order') {
        userStates[chatId] = { step: 'fullName' };
        await safeReply(ctx, '📝 Ism va familiyangizni kiriting:');
      } else if (action === 'report') {
        await showReport(ctx);
      } else if (action === 'payment_status') {
        await showPaymentStatus(ctx);
      } else if (action === 'main' || action === 'back') {
        delete userStates[chatId];
        await safeReply(ctx, '👋 Bosh menyu:', { reply_markup: mainMenu() });
      }
    } catch (e) {
      await safeReply(ctx, dbErrorText(e), { reply_markup: backMenu() });
    }
  });

  // Matnli xabarlar — suhbat qadamlari
  bot.on('message:text', async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;
    if (text.startsWith('/')) return;

    const state = userStates[chatId];

    // Holat yo'q (masalan server qayta ishga tushgan) — JIM QOLMAYMIZ.
    // Aks holda bot "qotgan"dek ko'rinadi. Menyuni ko'rsatamiz.
    if (!state) {
      return safeReply(ctx, '👋 Buyurtma berish uchun quyidagi tugmani bosing:', {
        reply_markup: mainMenu(),
      });
    }

    try {
      if (state.step === 'fullName') {
        if (!text.trim()) return safeReply(ctx, '❌ Iltimos, ismingizni kiriting:');
        state.fullName = text.trim();
        state.step = 'quantity';
        await safeReply(ctx, '🥟 Nechta somsa kerak?');
      } else if (state.step === 'quantity') {
        const qty = parseInt(text.trim(), 10);
        if (!Number.isInteger(qty) || qty <= 0)
          return safeReply(ctx, '❌ Iltimos, musbat raqam kiriting (masalan: 5):');
        state.quantity = qty;
        state.step = 'location';
        await safeReply(ctx, '📍 Lokatsiyani kiriting (masalan: Mirobod, Shaykhantaur):');
      } else if (state.step === 'location') {
        if (!text.trim()) return safeReply(ctx, '❌ Iltimos, lokatsiyani kiriting:');
        state.location = text.trim();
        state.step = 'deliveryTime';
        await safeReply(ctx, '⏰ Qaysi soatda kerak? (masalan: 18:00):');
      } else if (state.step === 'deliveryTime') {
        if (!/^\d{1,2}:\d{2}$/.test(text.trim()))
          return safeReply(ctx, '❌ Vaqt formati xato! (soat:minut, masalan: 18:00)');
        state.deliveryTime = padTime(text.trim());
        state.step = 'date';
        await safeReply(ctx, '📅 Qaysi kuni? (avval kun, keyin oy. Masalan: 31 12 yoki 5 3):');
      } else if (state.step === 'date') {
        const parsedDate = parseFlexibleDate(text.trim());
        if (!parsedDate)
          return safeReply(ctx, '❌ Sana noto\'g\'ri.\nAvval kun, keyin oy:\n• 31 12\n• 5 3\n• 31.12\n• 31/12');
        state.deliveryDate = parsedDate;
        delete userStates[chatId];          // saqlashdan OLDIN tozalaymiz (qayta yozilmasin)
        await saveOrder(ctx, chatId, state);
      }
    } catch (e) {
      delete userStates[chatId];            // xato bo'lsa suhbatni tozalaymiz
      await safeReply(ctx, dbErrorText(e) + '\n\nQaytadan boshlang:', { reply_markup: mainMenu() });
    }
  });

  async function saveOrder(ctx, chatId, state) {
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

    await dbRun(sql, vals);
    await safeReply(
      ctx,
      `✅ Buyurtma qo'shildi!\n\n👤 ${state.fullName}\n🥟 ${state.quantity} ta somsa\n📍 ${state.location}\n⏰ ${state.deliveryTime}\n📅 ${state.deliveryDate}\n💳 To'lanmagan\n\n🆔 ${orderId}\n\n🌐 Buyurtma saytda ko'rinadi.`,
      { reply_markup: backMenu() }
    );
  }

  async function showReport(ctx) {
    const s = await dbGet(`SELECT COUNT(*) as total,
      SUM(CASE WHEN paymentStatus='unpaid' THEN 1 ELSE 0 END) as unpaid,
      SUM(CASE WHEN paymentStatus='paid' THEN 1 ELSE 0 END) as paid,
      SUM(json_extract(products,'$[0].quantity')) as totalItems
      FROM orders WHERE source='telegram'`);
    await safeReply(
      ctx,
      `📊 HISOBOT\n\n📦 Jami: ${s?.total || 0}\n✅ To'langan: ${s?.paid || 0}\n❌ To'lanmagan: ${s?.unpaid || 0}\n🥟 Jami somsa: ${s?.totalItems || 0}`,
      { reply_markup: backMenu() }
    );
  }

  async function showPaymentStatus(ctx) {
    const rows = await dbAll(`SELECT id, customerName,
      json_extract(products,'$[0].quantity') as quantity,
      address as location, deliveryTime, paymentStatus
      FROM orders WHERE source='telegram' ORDER BY createdAt DESC LIMIT 20`);
    if (!rows.length)
      return safeReply(ctx, '📭 Hali buyurtma yo\'q', { reply_markup: backMenu() });

    let text = '💳 TO\'LOV HOLATI\n\n';
    let unpaid = 0;
    rows.forEach((o, i) => {
      const paid = o.paymentStatus === 'paid';
      if (!paid) unpaid++;
      text += `${i + 1}. ${o.customerName}\n   📍 ${o.location} | ⏰ ${o.deliveryTime}\n   🥟 ${o.quantity} ta | ${paid ? '✅ To\'langan' : '❌ To\'lanmagan'}\n   🆔 ${o.id}\n\n`;
    });
    text += `\n❌ To'lanmagan: ${unpaid}`;
    await safeReply(ctx, text, { reply_markup: backMenu() });
  }

  // Global xato handler — hech qanday xato botni to'xtatmasin
  bot.catch((err) => {
    const e = err.error;
    if (e instanceof GrammyError) console.error('Telegram xatosi:', e.description);
    else if (e instanceof HttpError) console.error('Network xatosi:', e.message);
    else console.error('Kutilmagan xato:', e?.message || e);
  });

  // Webhook (Render) yoki Polling (lokal) rejimi
  const WEBHOOK_BASE = process.env.TELEGRAM_WEBHOOK_URL || process.env.RENDER_EXTERNAL_URL;

  if (WEBHOOK_BASE && app) {
    const secretPath = `/telegram/webhook/${TELEGRAM_TOKEN}`;
    const fullUrl = `${WEBHOOK_BASE.replace(/\/$/, '')}${secretPath}`;

    // webhookCallback botni avtomatik init qiladi.
    // timeoutMilliseconds + onTimeout:'return' — agar bir update sekin ishlasa,
    // Telegramga tez 200 qaytaramiz. Shunda Telegram qayta-qayta yubormaydi
    // (takror buyurtma bo'lmaydi) va webhook "qotmaydi".
    app.post(secretPath, webhookCallback(bot, 'express', {
      timeoutMilliseconds: 9000,
      onTimeout: 'return',
    }));

    setWebhookWithRetry(fullUrl);
  } else {
    // Lokal: eski webhook'ni tozalab, polling'ni boshlash
    bot.api.deleteWebhook({ drop_pending_updates: true })
      .then(() => bot.start({
        onStart: () => {
          console.log('✅ Bot POLLING rejimida ishga tushdi (lokal)');
          console.log('🤖 Bot: @xumor_somsa_order_bot');
        }
      }))
      .catch((e) => console.error('❌ Start xatosi:', e.message));
  }

  // Webhook o'rnatishni qayta urinish bilan — bitta tarmoq uzilishi botni
  // "o'lik" qoldirmasin (avval bir marta urinilardi, fail bo'lsa bot jim edi).
  async function setWebhookWithRetry(url, attempt = 1) {
    try {
      await bot.api.setWebhook(url, {
        drop_pending_updates: false,                 // uxlab turganda kelgan buyurtmalar yo'qolmasin
        allowed_updates: ['message', 'callback_query'],
      });
      console.log('✅ Bot WEBHOOK rejimida:', url);
    } catch (e) {
      console.error(`❌ Webhook xatosi (urinish ${attempt}):`, e.message);
      if (attempt < 6) {
        const delay = Math.min(30000, 5000 * attempt);
        setTimeout(() => setWebhookWithRetry(url, attempt + 1), delay);
      } else {
        console.error('❌ Webhook 6 marta o\'rnatilmadi — keyingi deploy/restartda qayta urinadi.');
      }
    }
  }

  return bot;
}
