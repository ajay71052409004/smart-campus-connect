// Creates the database, tables and (optionally) accounts.  Run once:  npm run setup
//
// Local development:  creates demo accounts (STAFF001, 21CS001, 21CS002).
// Production:         set SEED_DEMO=false and give your own staff account with
//                     STAFF_ID, STAFF_NAME, STAFF_DEPT, STAFF_PASSWORD.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_NAME = process.env.DB_NAME || 'smart_campus';
const SEED_DEMO = process.env.SEED_DEMO !== 'false';

(async () => {
  if (!/^\w+$/.test(DB_NAME)) throw new Error('DB_NAME can only have letters, numbers and _');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true' ? { minVersion: 'TLSv1.2', rejectUnauthorized: true } : undefined,
    multipleStatements: true
  });

  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4`);
  await conn.query(`USE \`${DB_NAME}\``);
  await conn.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

  const accounts = [];
  if (SEED_DEMO) {
    accounts.push(
      ['staff',   'STAFF001', 'Dr. Meena Kumar', 'CSE', null, 'staff123'],
      ['student', '21CS001',  'Arun Kumar',      'CSE', 3,    'student123'],
      ['student', '21CS002',  'Divya S',         'CSE', 3,    'student123']
    );
  }
  if (process.env.STAFF_ID && process.env.STAFF_PASSWORD) {
    if (process.env.STAFF_PASSWORD.length < 8) throw new Error('STAFF_PASSWORD must be at least 8 characters');
    accounts.push(['staff', process.env.STAFF_ID.trim().toUpperCase(),
      process.env.STAFF_NAME || 'Staff', process.env.STAFF_DEPT || 'CSE', null, process.env.STAFF_PASSWORD]);
  }

  for (const [role, loginId, name, dept, year, pass] of accounts) {
    const hash = await bcrypt.hash(pass, 10);
    await conn.execute(
      'INSERT IGNORE INTO users (role, login_id, name, department, year, password_hash) VALUES (?,?,?,?,?,?)',
      [role, loginId, name, dept, year, hash]
    );
  }

  console.log(`Database "${DB_NAME}" is ready.`);
  if (SEED_DEMO) {
    console.log('Demo staff:   STAFF001 / staff123');
    console.log('Demo student: 21CS001  / student123');
    console.log('Do NOT use demo accounts on a public site (set SEED_DEMO=false).');
  }
  await conn.end();
})().catch(err => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
