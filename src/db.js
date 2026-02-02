// SQLite init (better-sqlite3)
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'offc.db');
const db = new Database(dbPath);

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wa_number TEXT UNIQUE,
      name TEXT,
      role TEXT DEFAULT 'customer',
      reseller_level INTEGER DEFAULT 0,
      premium_until TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_number TEXT,
      plan_code TEXT,
      contact_number TEXT,
      status TEXT DEFAULT 'pending',
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS servers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ptero_id TEXT,
      owner_number TEXT,
      plan_code TEXT,
      status TEXT DEFAULT 'active',
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

migrate();

module.exports = db;
