const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'deliva.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('retailer','dispatcher','rider')),
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS delivery_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  retailer_id INTEGER NOT NULL REFERENCES users(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  address TEXT NOT NULL,
  item_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Requested'
    CHECK(status IN ('Requested','Assigned','PickedUp','Delivered','Cancelled')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_request_id INTEGER NOT NULL REFERENCES delivery_requests(id),
  rider_id INTEGER NOT NULL REFERENCES users(id),
  assigned_by INTEGER NOT NULL REFERENCES users(id),
  assigned_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS status_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_request_id INTEGER NOT NULL REFERENCES delivery_requests(id),
  status TEXT NOT NULL,
  updated_by INTEGER NOT NULL REFERENCES users(id),
  note TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS confirmations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_request_id INTEGER NOT NULL UNIQUE REFERENCES delivery_requests(id),
  code TEXT NOT NULL,
  confirmed_at TEXT DEFAULT (datetime('now'))
);
`);

module.exports = db;
