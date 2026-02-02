// Tiny model helpers using better-sqlite3
const db = require('./db');

const User = {
  findByNumber: (number) => db.prepare('SELECT * FROM users WHERE wa_number = ?').get(number),
  upsert: (number, name = null, role = 'customer') => {
    const existing = User.findByNumber(number);
    if (existing) {
      db.prepare('UPDATE users SET name = COALESCE(?, name), role = ? WHERE wa_number = ?').run(name, role, number);
      return User.findByNumber(number);
    }
    db.prepare('INSERT INTO users (wa_number, name, role) VALUES (?, ?, ?)').run(number, name || number, role);
    return User.findByNumber(number);
  },
  addReseller: (number, level = 1) => {
    const user = User.findByNumber(number);
    if (user) {
      db.prepare('UPDATE users SET role = ?, reseller_level = ? WHERE wa_number = ?').run('reseller', level, number);
      return User.findByNumber(number);
    } else {
      db.prepare('INSERT INTO users (wa_number, name, role, reseller_level) VALUES (?, ?, ?, ?)').run(number, number, 'reseller', level);
      return User.findByNumber(number);
    }
  },
  addOwner: (number) => {
    return User.upsert(number, number, 'owner');
  },
  addPremium: (number, untilDate) => {
    const user = User.findByNumber(number);
    if (user) {
      db.prepare('UPDATE users SET premium_until = ? WHERE wa_number = ?').run(untilDate, number);
      return User.findByNumber(number);
    }
    db.prepare('INSERT INTO users (wa_number, name, role, premium_until) VALUES (?, ?, ?, ?)').run(number, number, 'customer', untilDate);
    return User.findByNumber(number);
  }
};

const Order = {
  create: (user_number, plan_code, contact_number) => {
    const info = db.prepare('INSERT INTO orders (user_number, plan_code, contact_number) VALUES (?, ?, ?)').run(user_number, plan_code, contact_number);
    return db.prepare('SELECT * FROM orders WHERE id = ?').get(info.lastInsertRowid);
  },
  updateStatus: (id, status, details = null) => {
    db.prepare('UPDATE orders SET status = ?, details = ? WHERE id = ?').run(status, details ? JSON.stringify(details) : null, id);
    return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  },
  list: () => db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
};

const Server = {
  create: (ptero_id, owner_number, plan_code, details) => {
    const info = db.prepare('INSERT INTO servers (ptero_id, owner_number, plan_code, details) VALUES (?, ?, ?, ?)').run(ptero_id, owner_number, plan_code, JSON.stringify(details));
    return db.prepare('SELECT * FROM servers WHERE id = ?').get(info.lastInsertRowid);
  },
  list: () => db.prepare('SELECT * FROM servers ORDER BY created_at DESC').all(),
  deleteById: (id) => db.prepare('DELETE FROM servers WHERE id = ?').run(id)
};

module.exports = { User, Order, Server };
