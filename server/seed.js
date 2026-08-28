const bcrypt = require('bcryptjs');
const db = require('./db');

const users = [
  { name: 'Amina (Retailer)', phone: '0700000001', role: 'retailer' },
  { name: 'Brian (Dispatcher)', phone: '0700000002', role: 'dispatcher' },
  { name: 'Charles (Rider)', phone: '0700000003', role: 'rider' },
  { name: 'Dorcas (Rider)', phone: '0700000004', role: 'rider' },
];

const insert = db.prepare(
  'INSERT OR IGNORE INTO users (name, phone, role, password_hash) VALUES (?,?,?,?)'
);

const hash = bcrypt.hashSync('demo123', 8);
for (const u of users) {
  insert.run(u.name, u.phone, u.role, hash);
}

console.log('Seeded demo users (password for all: demo123):');
console.table(db.prepare('SELECT id, name, phone, role FROM users').all());
