import express from 'express';
import sqlite3 from 'sqlite3';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initTelegramBot } from './telegram-bot.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Database Setup
// DB_PATH bilan Render persistent disk'ga (masalan /data/orders.db) yo'naltirish mumkin.
const DB_FILE = process.env.DB_PATH || path.join(__dirname, 'orders.db');
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, 'backups');

// Ensure backup dir exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR);
}

const db = new sqlite3.Database(DB_FILE, (err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to SQLite database:', DB_FILE);
    createTables();
    // Telegram botni shu jarayonda, shu DB ulanishi bilan ishga tushiramiz
    initTelegramBot({ db, app });
  }
});

function createTables() {
  db.serialize(() => {
    // Active orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        title TEXT,
        customerName TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        location_lat REAL,
        location_lng REAL,
        products TEXT NOT NULL, -- JSON string
        notes TEXT,
        deliveryDate TEXT NOT NULL,
        deliveryTime TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        lastNotified TEXT,
        paymentStatus TEXT DEFAULT 'unpaid',
        source TEXT DEFAULT 'web'
      )
    `);

    // Archived orders table
    db.run(`
      CREATE TABLE IF NOT EXISTS archived_orders (
        id TEXT PRIMARY KEY,
        title TEXT,
        customerName TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        location_lat REAL,
        location_lng REAL,
        products TEXT NOT NULL, -- JSON string
        notes TEXT,
        deliveryDate TEXT NOT NULL,
        deliveryTime TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        lastNotified TEXT,
        archivedAt TEXT NOT NULL,
        paymentStatus TEXT DEFAULT 'unpaid',
        source TEXT DEFAULT 'web'
      )
    `);
  });
}

// Helper: Perform DB Backup
function performBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.db`);
  
  db.serialize(() => {
    db.run(`VACUUM INTO ?`, [backupFile], (err) => {
      if (err) {
        console.error('Backup failed:', err.message);
      } else {
        console.log(`Database backup created successfully: ${backupFile}`);
        // Prune backups (keep last 7 days/backups)
        pruneBackups();
      }
    });
  });
}

function pruneBackups() {
  fs.readdir(BACKUP_DIR, (err, files) => {
    if (err) return;
    const dbBackups = files
      .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
      .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time);

    if (dbBackups.length > 7) {
      dbBackups.slice(7).forEach(fileObj => {
        fs.unlink(path.join(BACKUP_DIR, fileObj.name), (err) => {
          if (err) console.error('Failed to delete old backup:', err);
        });
      });
    }
  });
}

// Scheduled auto-backup every 24 hours
setInterval(performBackup, 24 * 60 * 60 * 1000);

// --- REST API API Endpoints ---

// Get active orders
app.get('/api/orders', (req, res) => {
  db.all('SELECT * FROM orders ORDER BY datetime(deliveryDate || "T" || deliveryTime)', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const parsedRows = rows.map(row => ({
      ...row,
      location: row.location_lat ? { lat: row.location_lat, lng: row.location_lng } : null,
      products: JSON.parse(row.products)
    }));
    res.json(parsedRows);
  });
});

// Create or update order (Upsert)
app.post('/api/orders', (req, res) => {
  const o = req.body;
  const now = new Date().toISOString();
  
  const sql = `
    INSERT INTO orders (
      id, title, customerName, phone, address, 
      location_lat, location_lng, products, notes, 
      deliveryDate, deliveryTime, status, createdAt, updatedAt, lastNotified
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      title = excluded.title,
      customerName = excluded.customerName,
      phone = excluded.phone,
      address = excluded.address,
      location_lat = excluded.location_lat,
      location_lng = excluded.location_lng,
      products = excluded.products,
      notes = excluded.notes,
      deliveryDate = excluded.deliveryDate,
      deliveryTime = excluded.deliveryTime,
      status = excluded.status,
      updatedAt = excluded.updatedAt,
      lastNotified = COALESCE(excluded.lastNotified, orders.lastNotified)
  `;

  const values = [
    o.id,
    o.title,
    o.customerName,
    o.phone,
    o.address,
    o.location ? o.location.lat : null,
    o.location ? o.location.lng : null,
    JSON.stringify(o.products),
    o.notes,
    o.deliveryDate,
    o.deliveryTime,
    o.status || 'pending',
    o.createdAt || now,
    now,
    o.lastNotified || null
  ];

  db.run(sql, values, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Order saved successfully', id: o.id });
  });
});

// Update order status/properties
app.put('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Build dynamic update query
  const fields = [];
  const values = [];
  
  Object.keys(updates).forEach(key => {
    if (key === 'id' || key === 'createdAt') return;
    
    if (key === 'location') {
      fields.push('location_lat = ?', 'location_lng = ?');
      values.push(updates.location ? updates.location.lat : null, updates.location ? updates.location.lng : null);
    } else if (key === 'products') {
      fields.push('products = ?');
      values.push(JSON.stringify(updates.products));
    } else {
      fields.push(`${key} = ?`);
      values.push(updates[key]);
    }
  });

  fields.push('updatedAt = ?');
  values.push(new Date().toISOString());

  values.push(id);

  const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`;

  db.run(sql, values, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order updated successfully' });
  });
});

// Delete order
app.delete('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM orders WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Order deleted successfully' });
  });
});

// Archive an order (Moves from active to archived table)
app.post('/api/orders/archive/:id', (req, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();

  db.serialize(() => {
    // 1. Get order details
    db.get('SELECT * FROM orders WHERE id = ?', [id], (err, order) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!order) {
        return res.status(404).json({ message: 'Order not found in active orders' });
      }

      // 2. Insert into archived_orders
      const insertSql = `
        INSERT OR REPLACE INTO archived_orders (
          id, title, customerName, phone, address, 
          location_lat, location_lng, products, notes, 
          deliveryDate, deliveryTime, status, createdAt, updatedAt, lastNotified, archivedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const insertValues = [
        order.id,
        order.title,
        order.customerName,
        order.phone,
        order.address,
        order.location_lat,
        order.location_lng,
        order.products,
        order.notes,
        order.deliveryDate,
        order.deliveryTime,
        'delivered', // Guarantee status in archive is completed/delivered
        order.createdAt,
        now,
        order.lastNotified,
        now
      ];

      db.run(insertSql, insertValues, (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        // 3. Delete from active orders
        db.run('DELETE FROM orders WHERE id = ?', [id], (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ message: 'Order moved to archive successfully' });
        });
      });
    });
  });
});

// Get archived orders
app.get('/api/archive', (req, res) => {
  db.all('SELECT * FROM archived_orders ORDER BY datetime(archivedAt) DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    const parsedRows = rows.map(row => ({
      ...row,
      location: row.location_lat ? { lat: row.location_lat, lng: row.location_lng } : null,
      products: JSON.parse(row.products)
    }));
    res.json(parsedRows);
  });
});

// Restore from archive back to active orders
app.post('/api/archive/restore/:id', (req, res) => {
  const { id } = req.params;
  const now = new Date().toISOString();

  db.serialize(() => {
    db.get('SELECT * FROM archived_orders WHERE id = ?', [id], (err, order) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!order) {
        return res.status(404).json({ message: 'Order not found in archive' });
      }

      const insertSql = `
        INSERT OR REPLACE INTO orders (
          id, title, customerName, phone, address, 
          location_lat, location_lng, products, notes, 
          deliveryDate, deliveryTime, status, createdAt, updatedAt, lastNotified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const insertValues = [
        order.id,
        order.title,
        order.customerName,
        order.phone,
        order.address,
        order.location_lat,
        order.location_lng,
        order.products,
        order.notes,
        order.deliveryDate,
        order.deliveryTime,
        'pending', // reset status to pending when restoring
        order.createdAt,
        now,
        null // reset last notified so reminders start fresh
      ];

      db.run(insertSql, insertValues, (err) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        
        db.run('DELETE FROM archived_orders WHERE id = ?', [id], (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          res.json({ message: 'Order restored to active orders successfully' });
        });
      });
    });
  });
});

// Trigger manual backup
app.post('/api/backup', (req, res) => {
  performBackup();
  res.json({ message: 'Manual backup initiated' });
});

// Update payment status
app.put('/api/orders/:id/payment', (req, res) => {
  const { id } = req.params;
  const { paymentStatus } = req.body;

  if (!['paid', 'unpaid', 'partial'].includes(paymentStatus)) {
    return res.status(400).json({ error: 'Invalid payment status' });
  }

  const sql = 'UPDATE orders SET paymentStatus = ?, updatedAt = ? WHERE id = ?';
  const now = new Date().toISOString();

  db.run(sql, [paymentStatus, now, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Payment status updated successfully', id, paymentStatus });
  });
});

// Get payment summary report
app.get('/api/report/payment', (req, res) => {
  const sql = `
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN paymentStatus = 'paid' THEN 1 ELSE 0 END) as paid,
      SUM(CASE WHEN paymentStatus = 'unpaid' THEN 1 ELSE 0 END) as unpaid,
      SUM(CASE WHEN paymentStatus = 'partial' THEN 1 ELSE 0 END) as partial,
      SUM(CASE WHEN source = 'telegram' THEN 1 ELSE 0 END) as telegram_orders,
      SUM(CASE WHEN source = 'web' THEN 1 ELSE 0 END) as web_orders
    FROM orders
  `;

  db.get(sql, [], (err, stats) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(stats);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
