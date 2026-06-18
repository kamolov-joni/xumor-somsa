// Baza adapteri:
//   - TURSO_DATABASE_URL bo'lsa -> Turso (bepul bulutli, ma'lumotlar saqlanadi)
//   - bo'lmasa -> lokal sqlite3 fayl (development)
//
// Ikkalasi ham bir xil sqlite3-uslubdagi API beradi: db.run / db.get / db.all / db.serialize
import sqlite3 from 'sqlite3';

export function createDatabase({ filePath }, onReady) {
  const TURSO_URL = process.env.TURSO_DATABASE_URL;
  const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

  if (TURSO_URL) {
    return createTursoAdapter(TURSO_URL, TURSO_TOKEN, onReady);
  }
  // Lokal sqlite3
  return new sqlite3.Database(filePath, onReady);
}

function createTursoAdapter(url, authToken, onReady) {
  // Dinamik import (faqat kerak bo'lganda yuklanadi)
  let clientPromise = import('@libsql/client').then(({ createClient }) =>
    createClient({ url, authToken, intMode: 'number' })
  );

  // ResultSet -> toza obyektlar massivi
  const toPlainRows = (rs) =>
    rs.rows.map((row) => {
      const o = {};
      rs.columns.forEach((c, i) => { o[c] = row[i]; });
      return o;
    });

  const exec = (sql, params, onOk, onErr) => {
    clientPromise
      .then((client) => client.execute({ sql, args: params || [] }))
      .then(onOk)
      .catch(onErr);
  };

  const adapter = {
    isTurso: true,

    run(sql, params, cb) {
      if (typeof params === 'function') { cb = params; params = []; }
      exec(sql, params,
        (rs) => {
          if (cb) cb.call(
            { changes: rs.rowsAffected, lastID: rs.lastInsertRowid != null ? Number(rs.lastInsertRowid) : undefined },
            null
          );
        },
        (err) => { if (cb) cb.call({}, err); }
      );
    },

    get(sql, params, cb) {
      if (typeof params === 'function') { cb = params; params = []; }
      exec(sql, params,
        (rs) => { if (cb) cb(null, toPlainRows(rs)[0]); },
        (err) => { if (cb) cb(err); }
      );
    },

    all(sql, params, cb) {
      if (typeof params === 'function') { cb = params; params = []; }
      exec(sql, params,
        (rs) => { if (cb) cb(null, toPlainRows(rs)); },
        (err) => { if (cb) cb(err); }
      );
    },

    // Turso ulanishlarida tartib o'z-o'zidan saqlanadi
    serialize(fn) { if (fn) fn(); },
  };

  // Ulanishni tekshiramiz
  clientPromise
    .then((client) => client.execute('SELECT 1'))
    .then(() => onReady && onReady(null))
    .catch((e) => onReady && onReady(e));

  return adapter;
}
