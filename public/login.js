const $ = s => document.querySelector(s);
let mode = 'login'; // 'login' | 'register'

const roleOf = () => document.querySelector('input[name=role]:checked').value;

function showError(msg) {
  const e = $('#authError');
  e.textContent = msg;
  e.hidden = !msg;
}

function refresh() {
  const staff = roleOf() === 'staff';
  if (staff) mode = 'login'; // staff accounts are created by the college, not here
  const reg = mode === 'register';

  document.querySelectorAll('.reg-only').forEach(el => (el.hidden = !reg));
  $('#name').required = reg;
  $('#department').required = reg;
  $('#year').required = reg;
  $('#password').autocomplete = reg ? 'new-password' : 'current-password';

  $('#authTitle').textContent = reg ? 'Create student account' : 'Log in';
  $('#authSubmit').textContent = reg ? 'Create account' : 'Log in';
  $('#idLabel').textContent = staff ? 'Staff ID' : 'Register number';
  $('#switchRow').hidden = staff;
  $('#switchRow').firstChild.textContent = reg ? 'Already have an account? ' : 'New student? ';
  $('#switchMode').textContent = reg ? 'Log in' : 'Create an account';
  showError('');
}

document.querySelectorAll('input[name=role]').forEach(r => r.addEventListener('change', refresh));
$('#switchMode').addEventListener('click', () => {
  mode = mode === 'login' ? 'register' : 'login';
  refresh();
});

$('#authForm').addEventListener('submit', async e => {
  e.preventDefault();
  showError('');
  const btn = $('#authSubmit');
  btn.disabled = true;

  const body = mode === 'register'
    ? {
        name: $('#name').value,
        loginId: $('#loginId').value,
        department: $('#department').value,
        year: $('#year').value,
        password: $('#password').value
      }
    : { role: roleOf(), loginId: $('#loginId').value, password: $('#password').value };

  try {
    const res = await fetch(mode === 'register' ? '/api/register' : '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Could not log in');
    location.href = 'index.html';
  } catch (err) {
    showError(err.message === 'Failed to fetch' ? 'Cannot reach the server. Is it running?' : err.message);
    btn.disabled = false;
  }
});

// Departments for the sign-up form
fetch('/api/departments').then(r => r.json()).then(list => {
  $('#department').innerHTML = '<option value="">Choose</option>' + list.map(d => `<option>${d}</option>`).join('');
}).catch(() => {});

// Already logged in? Skip this page.
fetch('/api/me').then(r => { if (r.ok) location.href = 'index.html'; }).catch(() => {});

refresh();
