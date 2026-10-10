/* ---------- Helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = ts => new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const to12 = t => { let [h, m] = t.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`; };
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.id);
  toast.id = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- Sample data (edit these for your college) ---------- */
const daysAgo = n => Date.now() - n * 86400000;

const ANNOUNCEMENTS = [
  { id: 1, cat: 'Exams', title: 'Internal assessment 2 timetable released', body: 'IA-2 starts next Monday. Check the department notice board for your subject-wise schedule. Bring your ID card to the hall.', ts: daysAgo(0), pinned: true },
  { id: 2, cat: 'Events', title: 'Tech symposium registrations open', body: 'Paper presentation, coding contest and project expo. Register with your department coordinator before Friday.', ts: daysAgo(1) },
  { id: 3, cat: 'Placements', title: 'Campus drive: aptitude test this week', body: 'Final-year students who registered must report to the seminar hall at 9:30 AM in formal dress.', ts: daysAgo(2) },
  { id: 4, cat: 'Holidays', title: 'College closed on Saturday', body: 'The college will remain closed for the local festival. Classes resume on Monday.', ts: daysAgo(3) },
  { id: 5, cat: 'Exams', title: 'Fee payment last date extended', body: 'The last date to pay the semester exam fee is now the 25th. Pay at the accounts office or online.', ts: daysAgo(5) },
  { id: 6, cat: 'Events', title: 'Library extended hours during exams', body: 'The library will stay open until 8:00 PM on all weekdays during the exam period.', ts: daysAgo(6) }
];

const TIMETABLE = {
  1: [['09:00', '09:50', 'Data Structures', 'Room 204'], ['10:00', '10:50', 'Mathematics III', 'Room 204'], ['11:10', '12:00', 'Digital Electronics', 'Room 105'], ['13:00', '15:40', 'DS Lab', 'Lab 2']],
  2: [['09:00', '09:50', 'Operating Systems', 'Room 204'], ['10:00', '10:50', 'Data Structures', 'Room 204'], ['11:10', '12:00', 'Mathematics III', 'Room 204'], ['13:00', '13:50', 'Communication Skills', 'Room 110']],
  3: [['09:00', '09:50', 'Digital Electronics', 'Room 105'], ['10:00', '10:50', 'Operating Systems', 'Room 204'], ['11:10', '12:00', 'Data Structures', 'Room 204'], ['13:00', '15:40', 'OS Lab', 'Lab 1']],
  4: [['09:00', '09:50', 'Mathematics III', 'Room 204'], ['10:00', '10:50', 'Digital Electronics', 'Room 105'], ['11:10', '12:00', 'Operating Systems', 'Room 204'], ['13:00', '13:50', 'Library hour', 'Library']],
  5: [['09:00', '09:50', 'Operating Systems', 'Room 204'], ['10:00', '10:50', 'Communication Skills', 'Room 110'], ['11:10', '12:00', 'Mathematics III', 'Room 204'], ['13:00', '15:40', 'Electronics Lab', 'Lab 3']],
  6: [['09:00', '09:50', 'Mentor meeting', 'Room 204'], ['10:00', '12:00', 'Club activities', 'Auditorium']],
  0: []
};

const ROUTES = [
  { id: 'R1', name: 'Route 1: City Centre', stops: 'City Centre, Bus Stand, Market, College Gate', times: ['07:00', '07:45', '08:15', '16:30', '17:15', '18:00'] },
  { id: 'R2', name: 'Route 2: Railway Station', stops: 'Railway Station, Hospital, Park Road, College Gate', times: ['06:50', '07:30', '08:10', '16:40', '17:20', '18:10'] },
  { id: 'R3', name: 'Route 3: North Town', stops: 'North Town, Temple Street, Ring Road, College Gate', times: ['07:10', '07:55', '08:20', '16:35', '17:30', '18:15'] },
  { id: 'R4', name: 'Route 4: Hostel Shuttle', stops: 'Boys Hostel, Girls Hostel, Main Block', times: ['08:30', '09:00', '12:30', '13:15', '15:50', '17:00'] }
];

const LF_SEED = [
  { id: 101, type: 'Lost', item: 'Blue umbrella', place: 'Canteen', contact: 'office@college.edu', ts: daysAgo(1), done: false },
  { id: 102, type: 'Found', item: 'Calculator (Casio fx-991)', place: 'Room 204', contact: 'Library desk', ts: daysAgo(2), done: false }
];

const COMPLAINT_SEED = [
  { id: 201, category: 'Wi-Fi / Internet', location: 'Library', details: 'Wi-Fi keeps disconnecting on the second floor.', status: 'In progress', ts: daysAgo(2) }
];

const HELP = [
  { keys: ['bus', 'transport', 'route'], answer: () => nextBusText() + '\nOpen the Transport page for all routes.' },
  { keys: ['library', 'book'], answer: () => 'The library is open 8:30 AM to 5:00 PM on weekdays (until 8:00 PM during exams). Carry your ID card to borrow books.' },
  { keys: ['fee', 'fees', 'payment', 'pay'], answer: () => 'Fees are paid at the accounts office (10:00 AM to 3:00 PM) or online through the college portal.' },
  { keys: ['hostel', 'warden', 'mess'], answer: () => 'Hostel gate closes at 9:00 PM. Mess timings: breakfast 7:30, lunch 12:30, dinner 7:30. For room issues, post a complaint here.' },
  { keys: ['exam', 'ia', 'hall ticket', 'timetable'], answer: () => 'Exam schedules are posted in Announcements and on the department notice board. Bring your ID card to the hall.' },
  { keys: ['complaint', 'problem', 'issue', 'report'], answer: () => 'Go to Complaints, choose a category, add the location and describe the problem. You can track its status on the same page.' },
  { keys: ['lost', 'found', 'missing'], answer: () => 'Use Lost & Found to post what you lost or found. Include the place and a contact number.' },
  { keys: ['canteen', 'food'], answer: () => 'The canteen is open 8:00 AM to 5:30 PM. For hygiene or price complaints, use the Complaints page.' },
  { keys: ['hello', 'hi', 'hey', 'vanakkam'], answer: () => 'Hi! Ask me about buses, library, fees, hostel or exams.' },
  { keys: ['office', 'contact', 'phone'], answer: () => 'The college office is open 9:00 AM to 4:30 PM on weekdays. Email: office@college.edu' }
];

/* ---------- State ---------- */
let announcements = ANNOUNCEMENTS;
let user = null;
let complaints = [];
let lostFound = [];
let seenAnn = [];
let myRoute = 'R1';
let annFilter = 'All';
let lfFilter = 'All';
let lfQuery = '';
const K = k => `scc_${user.loginId}_${k}`; // each login keeps its own local data
const isStudent = () => user.role === 'student';

async function api(path, opts = {}) {
  const res = await fetch(path, {
    credentials: 'same-origin',
    method: opts.method || 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  if (res.status === 401) { location.href = 'login.html'; throw new Error('auth'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}
async function logout() {
  try { await fetch('/api/logout', { method: 'POST' }); } catch {}
  location.href = 'login.html';
}

/* ---------- Navigation ---------- */
function go(view) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  if (view === 'announcements') {
    seenAnn = announcements.map(a => a.id);
    save(K('seen_ann'), seenAnn);
    renderDashboard();
  }
  if (view === 'leave') refreshLeaves();
  history.replaceState(null, '', '#' + view);
  window.scrollTo(0, 0);
}
document.addEventListener('click', e => {
  const nav = e.target.closest('[data-view]');
  const gt = e.target.closest('[data-goto]');
  if (nav) go(nav.dataset.view);
  if (gt) go(gt.dataset.goto);
});

/* ---------- Profile ---------- */
function renderProfile() {
  $('#profileName').textContent = user.name;
  $('#avatar').textContent = user.name.trim().charAt(0).toUpperCase() || 'S';
}
$('#profileBtn').addEventListener('click', logout);
$('#logoutBtn').addEventListener('click', logout);

/* ---------- Transport ---------- */
function nextBusFor(route) {
  const n = nowMin();
  return route.times.find(t => toMin(t) >= n) || null;
}
function nextBusText() {
  const r = ROUTES.find(x => x.id === myRoute) || ROUTES[0];
  const t = nextBusFor(r);
  if (!t) return `No more buses today on ${r.name}. The first bus tomorrow is at ${to12(r.times[0])}.`;
  const diff = toMin(t) - nowMin();
  return `Next bus on ${r.name} leaves at ${to12(t)} (${diff === 0 ? 'now' : 'in ' + diff + ' min'}).`;
}
function renderTransport() {
  const n = nowMin();
  $('#routeList').innerHTML = ROUTES.map(r => {
    const next = nextBusFor(r);
    const mine = r.id === myRoute;
    return `<article class="card route ${mine ? 'pinned' : ''}">
      <div class="route-head">
        <h4>${esc(r.name)}</h4>
        <button class="btn ghost" data-route="${r.id}">${mine ? 'My route' : 'Set as my route'}</button>
      </div>
      <p class="stops">${esc(r.stops)}</p>
      <div class="times">${r.times.map(t => {
        const cls = toMin(t) < n ? 'past' : (t === next ? 'next' : '');
        return `<span class="time ${cls}">${to12(t)}</span>`;
      }).join('')}</div>
    </article>`;
  }).join('');
}
$('#routeList').addEventListener('click', e => {
  const b = e.target.closest('[data-route]');
  if (!b) return;
  myRoute = b.dataset.route;
  save(K('route'), myRoute);
  renderTransport();
  renderDashboard();
  toast('Route saved');
});

/* ---------- Announcements ---------- */
function renderAnnouncements() {
  const cats = ['All', ...new Set(announcements.map(a => a.cat))];
  $('#annFilters').innerHTML = cats.map(c => `<button class="chip ${c === annFilter ? 'active' : ''}" data-cat="${c}">${c}</button>`).join('');
  const list = announcements
    .filter(a => annFilter === 'All' || a.cat === annFilter)
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.ts - a.ts);
  $('#annList').innerHTML = list.map(a => `
    <article class="card ${a.pinned ? 'pinned' : ''}">
      <div class="card-top"><span class="tag">${esc(a.cat)}</span><span class="date">${a.pinned ? 'Pinned · ' : ''}${fmtDate(a.ts)}</span></div>
      <h4>${esc(a.title)}</h4>
      <p>${esc(a.body)}</p>
    </article>`).join('') || '<div class="empty">No announcements in this category.</div>';
}
$('#annFilters').addEventListener('click', e => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  annFilter = b.dataset.cat;
  renderAnnouncements();
});

/* ---------- Complaints ---------- */
function renderComplaints() {
  const list = [...complaints].sort((a, b) => b.ts - a.ts);
  $('#complaintList').innerHTML = list.map(c => {
    const cls = c.status === 'Open' ? 'open' : c.status === 'In progress' ? 'progress' : 'resolved';
    return `<article class="card">
      <div class="card-top"><span class="tag ${cls}">${esc(c.status)}</span><span class="date">${fmtDate(c.ts)}</span></div>
      <h4>${esc(c.category)}: ${esc(c.location)}</h4>
      <p>${esc(c.details)}</p>
      <div class="card-actions">
        ${c.status !== 'Resolved' ? `<button class="btn ghost" data-resolve="${c.id}">Mark as resolved</button>` : ''}
        <button class="btn ghost" data-delcomp="${c.id}">Delete</button>
      </div>
    </article>`;
  }).join('') || '<div class="empty">No complaints yet. Fill the form to report a problem.</div>';
}
$('#complaintForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  complaints.push({
    id: Date.now(),
    category: f.get('category'),
    location: f.get('location').trim(),
    details: f.get('details').trim(),
    status: 'Open',
    ts: Date.now()
  });
  save(K('complaints'), complaints);
  e.target.reset();
  renderComplaints();
  renderDashboard();
  toast('Complaint submitted');
});
$('#complaintList').addEventListener('click', e => {
  const r = e.target.closest('[data-resolve]');
  const d = e.target.closest('[data-delcomp]');
  if (r) {
    const c = complaints.find(x => x.id == r.dataset.resolve);
    if (c) c.status = 'Resolved';
    toast('Marked as resolved');
  }
  if (d) {
    complaints = complaints.filter(x => x.id != d.dataset.delcomp);
    toast('Complaint deleted');
  }
  save(K('complaints'), complaints);
  renderComplaints();
  renderDashboard();
});

/* ---------- Lost & Found ---------- */
function renderLF() {
  const q = lfQuery.toLowerCase();
  const list = lostFound
    .filter(i => lfFilter === 'All' || i.type === lfFilter)
    .filter(i => !q || (i.item + ' ' + i.place).toLowerCase().includes(q))
    .sort((a, b) => a.done - b.done || b.ts - a.ts);
  $('#lfList').innerHTML = list.map(i => `
    <article class="card" style="${i.done ? 'opacity:.55' : ''}">
      <div class="card-top"><span class="tag ${i.type.toLowerCase()}">${i.type}</span><span class="date">${fmtDate(i.ts)}</span></div>
      <h4>${esc(i.item)}</h4>
      <p>${i.type === 'Lost' ? 'Lost' : 'Found'} at ${esc(i.place)}<br>Contact: ${esc(i.contact)}</p>
      <div class="card-actions">
        ${i.done ? '<span class="date">Returned to owner</span>' : `<button class="btn ghost" data-done="${i.id}">${i.type === 'Lost' ? 'I got it back' : 'Returned to owner'}</button>`}
        <button class="btn ghost" data-dellf="${i.id}">Delete</button>
      </div>
    </article>`).join('') || '<div class="empty">Nothing here. Post an item using the form.</div>';
}
$('#lfForm').addEventListener('submit', e => {
  e.preventDefault();
  const f = new FormData(e.target);
  lostFound.push({
    id: Date.now(),
    type: f.get('type'),
    item: f.get('item').trim(),
    place: f.get('place').trim(),
    contact: f.get('contact').trim(),
    ts: Date.now(),
    done: false
  });
  save(K('lf'), lostFound);
  e.target.reset();
  renderLF();
  renderDashboard();
  toast('Item posted');
});
$('#lfList').addEventListener('click', e => {
  const d = e.target.closest('[data-done]');
  const x = e.target.closest('[data-dellf]');
  if (d) { const i = lostFound.find(v => v.id == d.dataset.done); if (i) i.done = true; toast('Updated'); }
  if (x) { lostFound = lostFound.filter(v => v.id != x.dataset.dellf); toast('Item deleted'); }
  save(K('lf'), lostFound);
  renderLF();
  renderDashboard();
});
$('#lfFilters').addEventListener('click', e => {
  const b = e.target.closest('[data-f]');
  if (!b) return;
  lfFilter = b.dataset.f;
  $$('#lfFilters .chip').forEach(c => c.classList.toggle('active', c === b));
  renderLF();
});
$('#lfSearch').addEventListener('input', e => { lfQuery = e.target.value; renderLF(); });

/* ---------- Dashboard ---------- */
function renderDashboard() {
  const name = user.name.split(' ')[0];
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  $('#greeting').textContent = `${part}, ${name}`;
  $('#todayText').textContent = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }) + (isStudent() ? ` · ${user.department}, year ${user.year}` : ` · Staff, ${user.department}`);

  // Next bus
  const r = ROUTES.find(x => x.id === myRoute) || ROUTES[0];
  const t = nextBusFor(r);
  $('#nextBusTitle').textContent = t ? to12(t) : 'No more buses today';
  $('#nextBusSub').textContent = t ? `${r.name}${toMin(t) - nowMin() > 0 ? ' · in ' + (toMin(t) - nowMin()) + ' min' : ' · leaving now'}` : `First bus tomorrow: ${to12(r.times[0])} on ${r.name}`;

  // Stats
  $('#statLeave').textContent = pendingCount;
  $('#statLeaveLabel').textContent = isStudent() ? 'Leave requests pending' : 'Leave requests to review';
  $('#timetablePanel').hidden = !isStudent();
  $('#statAnn').textContent = announcements.filter(a => !seenAnn.includes(a.id)).length;
  $('#statComp').textContent = complaints.filter(c => c.status !== 'Resolved').length;
  $('#statLost').textContent = lostFound.filter(i => !i.done).length;

  // Timetable
  const day = TIMETABLE[new Date().getDay()] || [];
  const n = nowMin();
  $('#timetable').innerHTML = day.length
    ? day.map(([s, e, sub, room]) => `<li class="${n >= toMin(s) && n < toMin(e) ? 'now' : ''}"><time>${to12(s)}</time><div><strong>${esc(sub)}</strong><small>${esc(room)}</small></div></li>`).join('')
    : '<li><div><strong>No classes today</strong><small>Enjoy your day off.</small></div></li>';

  // Pinned notice
  const p = announcements.find(a => a.pinned);
  $('#pinnedBox').innerHTML = p
    ? `<div class="card pinned"><span class="tag">${esc(p.cat)}</span><h4>${esc(p.title)}</h4><p>${esc(p.body)}</p></div>`
    : '<div class="empty">No pinned notice.</div>';
}

/* ---------- Assistant ---------- */
const CHIPS = ['Next bus', 'Library timings', 'How to pay fees', 'Hostel rules', 'Report a problem'];
function addMsg(text, who) {
  const d = document.createElement('div');
  d.className = 'msg ' + who;
  d.textContent = text;
  $('#chatLog').appendChild(d);
  $('#chatLog').scrollTop = $('#chatLog').scrollHeight;
}
function reply(q) {
  const s = q.toLowerCase();
  const hit = HELP.find(h => h.keys.some(k => new RegExp('\\b' + k.replace(/ /g, '\\s') + '\\b').test(s)));
  return hit ? hit.answer() : "I'm not sure about that yet. Try asking about buses, library, fees, hostel or exams, or contact the college office.";
}
function ask(q) {
  if (!q.trim()) return;
  addMsg(q, 'me');
  setTimeout(() => addMsg(reply(q), 'bot'), 350);
}
$('#chatForm').addEventListener('submit', e => {
  e.preventDefault();
  const i = $('#chatInput');
  ask(i.value);
  i.value = '';
});
$('#chatChips').innerHTML = CHIPS.map(c => `<button class="chip" type="button">${c}</button>`).join('');
$('#chatChips').addEventListener('click', e => { const b = e.target.closest('.chip'); if (b) ask(b.textContent); });
addMsg('Hi! I can help with buses, library, fees, hostel and exams. What do you want to know?', 'bot');

/* ---------- Leave letters ---------- */
let leaves = [];
let leaveFilter = 'Pending';
let pendingCount = 0;
const fmtD = str => new Date(String(str).slice(0, 10) + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const statusClass = s => ({ Pending: 'progress', Approved: 'resolved', Rejected: 'open' }[s] || '');

async function refreshLeaves() {
  try {
    if (isStudent()) {
      leaves = await api('/api/leaves/mine');
      pendingCount = leaves.filter(l => l.status === 'Pending').length;
    } else {
      leaves = await api('/api/leaves?status=' + encodeURIComponent(leaveFilter));
      pendingCount = (await api('/api/leaves/summary')).pending;
    }
  } catch (e) {
    if (e.message !== 'auth') toast(e.message);
  }
  renderLeave();
  renderDashboard();
}

function renderLeave() {
  $('#studentLeave').hidden = !isStudent();
  $('#staffLeave').hidden = isStudent();
  $('#leaveTitle').textContent = isStudent() ? 'Leave letter' : 'Leave requests';
  $('#leaveSub').textContent = isStudent()
    ? 'Ask your staff for leave permission online and track the answer here.'
    : `Requests from ${user.department} students. Approve or reject with a remark.`;

  if (isStudent()) {
    $('#myLeaves').innerHTML = leaves.map(l => `
      <article class="card letter">
        <div class="card-top"><span class="tag ${statusClass(l.status)}">${esc(l.status)}</span><span class="date">Sent ${fmtD(l.createdAt)}</span></div>
        <h4>${esc(l.leaveType)} leave · ${l.days} day${l.days > 1 ? 's' : ''}</h4>
        <p class="dates">${fmtD(l.fromDate)}${l.fromDate === l.toDate ? '' : ' to ' + fmtD(l.toDate)}</p>
        <p>${esc(l.reason)}</p>
        ${l.decidedAt ? `<p class="remark"><strong>${esc(l.status)} by ${esc(l.decidedBy || 'staff')}</strong>${l.staffRemark ? ': ' + esc(l.staffRemark) : ''}</p>` : ''}
        ${l.status === 'Pending' ? `<div class="card-actions"><button class="btn ghost" data-cancel="${l.id}">Cancel request</button></div>` : ''}
      </article>`).join('') || '<div class="empty">No leave letters yet. Fill the form to send one.</div>';
    return;
  }

  $$('#leaveFilters .chip').forEach(c => c.classList.toggle('active', c.dataset.lf === leaveFilter));
  $('#leaveQueue').innerHTML = leaves.map(l => `
    <article class="card letter">
      <div class="card-top"><span class="tag ${statusClass(l.status)}">${esc(l.status)}</span><span class="date">Sent ${fmtD(l.createdAt)}</span></div>
      <h4>${esc(l.studentName)}</h4>
      <p class="who">${esc(l.studentLoginId)} · Year ${l.studentYear}</p>
      <p class="dates" style="margin-top:8px">${esc(l.leaveType)} leave · ${fmtD(l.fromDate)}${l.fromDate === l.toDate ? '' : ' to ' + fmtD(l.toDate)} (${l.days} day${l.days > 1 ? 's' : ''})</p>
      <p>${esc(l.reason)}</p>
      ${l.status === 'Pending' ? `
        <div class="decide">
          <input type="text" id="remark-${l.id}" maxlength="300" placeholder="Remark (needed if you reject)">
          <div class="card-actions" style="margin-top:0">
            <button class="btn ok" data-decide="Approved" data-id="${l.id}">Approve</button>
            <button class="btn no" data-decide="Rejected" data-id="${l.id}">Reject</button>
          </div>
        </div>`
      : l.decidedAt ? `<p class="remark"><strong>${esc(l.status)} by ${esc(l.decidedBy || 'staff')}</strong>${l.staffRemark ? ': ' + esc(l.staffRemark) : ''}</p>` : ''}
    </article>`).join('') || `<div class="empty">No ${leaveFilter === 'All' ? '' : leaveFilter.toLowerCase() + ' '}leave requests.</div>`;
}

// Student: form
const leaveForm = $('#leaveForm');
function updateDays() {
  const f = leaveForm.fromDate.value, t = leaveForm.toDate.value;
  leaveForm.toDate.min = f || '';
  if (f && t && t >= f) {
    const d = Math.round((new Date(t) - new Date(f)) / 86400000) + 1;
    $('#leaveDays').textContent = `${d} day${d > 1 ? 's' : ''} of leave`;
  } else {
    $('#leaveDays').textContent = '';
  }
}
leaveForm.fromDate.addEventListener('change', updateDays);
leaveForm.toDate.addEventListener('change', updateDays);
leaveForm.addEventListener('submit', async e => {
  e.preventDefault();
  const f = new FormData(leaveForm);
  try {
    await api('/api/leaves', { method: 'POST', body: {
      leaveType: f.get('leaveType'), fromDate: f.get('fromDate'), toDate: f.get('toDate'), reason: f.get('reason')
    } });
    leaveForm.reset();
    updateDays();
    toast('Leave letter sent to staff');
    refreshLeaves();
  } catch (err) { if (err.message !== 'auth') toast(err.message); }
});
$('#myLeaves').addEventListener('click', async e => {
  const b = e.target.closest('[data-cancel]');
  if (!b) return;
  try {
    await api(`/api/leaves/${b.dataset.cancel}/cancel`, { method: 'POST' });
    toast('Request cancelled');
    refreshLeaves();
  } catch (err) { if (err.message !== 'auth') toast(err.message); }
});

// Staff: decide
$('#leaveFilters').addEventListener('click', e => {
  const b = e.target.closest('[data-lf]');
  if (!b) return;
  leaveFilter = b.dataset.lf;
  refreshLeaves();
});
$('#leaveQueue').addEventListener('click', async e => {
  const b = e.target.closest('[data-decide]');
  if (!b) return;
  const id = b.dataset.id;
  const remark = $('#remark-' + id).value.trim();
  if (b.dataset.decide === 'Rejected' && !remark) {
    toast('Write a short reason for rejecting');
    $('#remark-' + id).focus();
    return;
  }
  try {
    await api(`/api/leaves/${id}/decision`, { method: 'POST', body: { decision: b.dataset.decide, remark } });
    toast(b.dataset.decide === 'Approved' ? 'Leave approved' : 'Leave rejected');
    refreshLeaves();
  } catch (err) { if (err.message !== 'auth') toast(err.message); }
});

/* ---------- Start ---------- */
async function init() {
  try { user = await api('/api/me'); } catch { return; }

  complaints = load(K('complaints'), COMPLAINT_SEED);
  lostFound = load(K('lf'), LF_SEED);
  seenAnn = load(K('seen_ann'), []);
  myRoute = load(K('route'), 'R1');

  const min = new Date(Date.now() - 7 * 86400000);
  leaveForm.fromDate.min = `${min.getFullYear()}-${String(min.getMonth() + 1).padStart(2, '0')}-${String(min.getDate()).padStart(2, '0')}`;

  renderProfile();
  renderAnnouncements();
  renderComplaints();
  renderLF();
  renderTransport();
  renderDashboard();
  const start = location.hash.slice(1);
  go(start && $('#view-' + start) ? start : 'dashboard');
  refreshLeaves();
  setInterval(() => { renderTransport(); renderDashboard(); }, 60000);
  setInterval(() => { if (document.visibilityState === 'visible') refreshLeaves(); }, 60000);
}
init();
