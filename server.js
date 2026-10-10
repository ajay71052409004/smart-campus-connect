require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 16) {
  console.error('Set JWT_SECRET (16+ characters) in your .env file.');
  process.exit(1);
}
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AI&DS'];
const LEAVE_TYPES = ['Medical', 'Personal', 'Family function', 'On-duty', 'Other'];
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10);

const app = express();
app.disable('x-powered-by');
// Behind Render's proxy: use the real visitor IP (needed for the login throttle)
if (IS_PROD) app.set('trust proxy', 1);
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());
app.use((req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY' });
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

/* ---------- helpers ---------- */
const wrap = fn => (req, res, next) => fn(req, res, next).catch(next);
const fail = (res, code, msg) => res.status(code).json({ error: msg });
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00:00Z'));
const dayNum = s => Math.round(new Date(s + 'T00:00:00Z').getTime() / 86400000);
const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Simple login throttle: 10 failed tries per 15 minutes per IP
const failed = new Map();
const recent = ip => {
  const now = Date.now();
  const list = (failed.get(ip) || []).filter(t => now - t < 15 * 60 * 1000);
  failed.set(ip, list);
  return list;
};

async function auth(req, res, next) {
  try {
    const token = req.cookies.token;
    if (!token) return fail(res, 401, 'Please log in');
    const { id } = jwt.verify(token, SECRET);
    const [rows] = await pool.execute(
      'SELECT id, role, login_id AS loginId, name, department, year FROM users WHERE id = ?', [id]);
    if (!rows[0]) return fail(res, 401, 'Please log in again');
    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return fail(res, 401, 'Session expired. Please log in again');
    }
    next(err);
  }
}
const only = role => (req, res, next) =>
  req.user.role === role ? next() : fail(res, 403, 'This is not available for your account');

function setSession(res, userId) {
  const token = jwt.sign({ id: userId }, SECRET, { expiresIn: '8h' });
  res.cookie('token', token, { httpOnly: true, sameSite: 'strict', secure: IS_PROD, maxAge: 8 * 3600 * 1000 });
}

/* ---------- auth ---------- */
app.get('/api/departments', (req, res) => res.json(DEPARTMENTS));

app.post('/api/register', wrap(async (req, res) => {
  const { loginId, name, department, year, password } = req.body || {};
  const id = String(loginId || '').trim().toUpperCase();
  const nm = String(name || '').trim();
  if (!/^[A-Z0-9-]{4,20}$/.test(id)) return fail(res, 400, 'Register number must be 4 to 20 letters or numbers');
  if (nm.length < 2 || nm.length > 60) return fail(res, 400, 'Enter your full name');
  if (!DEPARTMENTS.includes(department)) return fail(res, 400, 'Choose your department');
  if (![1, 2, 3, 4].includes(Number(year))) return fail(res, 400, 'Choose your year');
  if (typeof password !== 'string' || password.length < 8) return fail(res, 400, 'Password must be at least 8 characters');

  const hash = await bcrypt.hash(password, 10);
  try {
    const [r] = await pool.execute(
      'INSERT INTO users (role, login_id, name, department, year, password_hash) VALUES (?,?,?,?,?,?)',
      ['student', id, nm, department, Number(year), hash]);
    setSession(res, r.insertId);
    res.status(201).json({ ok: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return fail(res, 409, 'This register number already has an account. Log in instead');
    throw err;
  }
}));

app.post('/api/login', wrap(async (req, res) => {
  const ip = req.ip;
  if (recent(ip).length >= 10) return fail(res, 429, 'Too many wrong attempts. Try again in 15 minutes');

  const { loginId, password, role } = req.body || {};
  if (!loginId || !password || !['student', 'staff'].includes(role)) return fail(res, 400, 'Enter your ID and password');

  const [rows] = await pool.execute(
    'SELECT id, password_hash FROM users WHERE login_id = ? AND role = ?',
    [String(loginId).trim().toUpperCase(), role]);
  const user = rows[0];
  const ok = await bcrypt.compare(String(password), user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) {
    recent(ip).push(Date.now());
    return fail(res, 401, 'Wrong ID or password');
  }
  setSession(res, user.id);
  res.json({ ok: true });
}));

app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

app.get('/api/me', auth, (req, res) => res.json(req.user));

/* ---------- leave letters ---------- */
const LEAVE_FIELDS = `
  l.id, l.leave_type AS leaveType, l.from_date AS fromDate, l.to_date AS toDate,
  l.days, l.reason, l.status, l.staff_remark AS staffRemark,
  l.created_at AS createdAt, l.decided_at AS decidedAt`;

// Student: send a leave letter
app.post('/api/leaves', auth, only('student'), wrap(async (req, res) => {
  const { leaveType, fromDate, toDate } = req.body || {};
  const reason = String(req.body?.reason || '').trim();

  if (!LEAVE_TYPES.includes(leaveType)) return fail(res, 400, 'Choose a leave type');
  if (!isDate(fromDate) || !isDate(toDate)) return fail(res, 400, 'Choose valid dates');
  const days = dayNum(toDate) - dayNum(fromDate) + 1;
  if (days < 1) return fail(res, 400, 'The "To" date cannot be before the "From" date');
  if (days > 30) return fail(res, 400, 'You can request up to 30 days at a time');
  if (dayNum(fromDate) < dayNum(todayStr()) - 7) return fail(res, 400, 'The "From" date can be at most 7 days in the past');
  if (reason.length < 10) return fail(res, 400, 'Write the reason in at least 10 characters');
  if (reason.length > 1000) return fail(res, 400, 'Reason is too long (1000 characters max)');

  const [clash] = await pool.execute(
    `SELECT id FROM leave_requests
     WHERE student_id = ? AND status IN ('Pending','Approved') AND from_date <= ? AND to_date >= ? LIMIT 1`,
    [req.user.id, toDate, fromDate]);
  if (clash.length) return fail(res, 409, 'You already have a leave request for these dates');

  await pool.execute(
    'INSERT INTO leave_requests (student_id, leave_type, from_date, to_date, days, reason) VALUES (?,?,?,?,?,?)',
    [req.user.id, leaveType, fromDate, toDate, days, reason]);
  res.status(201).json({ ok: true });
}));

// Student: my requests
app.get('/api/leaves/mine', auth, only('student'), wrap(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT ${LEAVE_FIELDS}, dc.name AS decidedBy
     FROM leave_requests l LEFT JOIN users dc ON dc.id = l.staff_id
     WHERE l.student_id = ? ORDER BY l.created_at DESC, l.id DESC LIMIT 100`,
    [req.user.id]);
  res.json(rows);
}));

// Student: cancel my pending request
app.post('/api/leaves/:id/cancel', auth, only('student'), wrap(async (req, res) => {
  const [r] = await pool.execute(
    `UPDATE leave_requests SET status = 'Cancelled' WHERE id = ? AND student_id = ? AND status = 'Pending'`,
    [Number(req.params.id), req.user.id]);
  if (!r.affectedRows) return fail(res, 404, 'Only pending requests can be cancelled');
  res.json({ ok: true });
}));

// Staff: pending count for dashboard
app.get('/api/leaves/summary', auth, only('staff'), wrap(async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS pending FROM leave_requests l JOIN users st ON st.id = l.student_id
     WHERE l.status = 'Pending' AND st.department = ?`, [req.user.department]);
  res.json({ pending: rows[0].pending });
}));

// Staff: requests from students of their department
app.get('/api/leaves', auth, only('staff'), wrap(async (req, res) => {
  const status = req.query.status;
  const valid = ['Pending', 'Approved', 'Rejected', 'Cancelled'];
  const params = [req.user.department];
  let filter = '';
  if (valid.includes(status)) { filter = 'AND l.status = ?'; params.push(status); }

  const [rows] = await pool.execute(
    `SELECT ${LEAVE_FIELDS}, st.name AS studentName, st.login_id AS studentLoginId, st.year AS studentYear,
            dc.name AS decidedBy
     FROM leave_requests l
     JOIN users st ON st.id = l.student_id
     LEFT JOIN users dc ON dc.id = l.staff_id
     WHERE st.department = ? ${filter}
     ORDER BY (l.status = 'Pending') DESC, l.created_at DESC, l.id DESC LIMIT 200`,
    params);
  res.json(rows);
}));

// Staff: approve or reject
app.post('/api/leaves/:id/decision', auth, only('staff'), wrap(async (req, res) => {
  const { decision } = req.body || {};
  const remark = String(req.body?.remark || '').trim().slice(0, 300);
  if (!['Approved', 'Rejected'].includes(decision)) return fail(res, 400, 'Choose approve or reject');
  if (decision === 'Rejected' && !remark) return fail(res, 400, 'Write a short reason for rejecting');

  const [r] = await pool.execute(
    `UPDATE leave_requests l JOIN users st ON st.id = l.student_id
     SET l.status = ?, l.staff_id = ?, l.staff_remark = ?, l.decided_at = NOW()
     WHERE l.id = ? AND l.status = 'Pending' AND st.department = ?`,
    [decision, req.user.id, remark || null, Number(req.params.id), req.user.department]);
  if (!r.affectedRows) return fail(res, 404, 'Request not found or already decided');
  res.json({ ok: true });
}));

/* ---------- errors & start ---------- */
app.use('/api', (req, res) => fail(res, 404, 'Not found'));
app.use((err, req, res, next) => {
  console.error(err);
  fail(res, 500, 'Something went wrong on the server');
});

app.listen(PORT, async () => {
  console.log(`Smart Campus Connect: http://localhost:${PORT}/login.html`);
  try {
    await pool.query('SELECT 1');
    console.log('MySQL connected');
  } catch (err) {
    console.error('Cannot connect to MySQL:', err.message);
    console.error('Check DB_HOST, DB_USER, DB_PASSWORD in .env and run: npm run setup');
  }
});
