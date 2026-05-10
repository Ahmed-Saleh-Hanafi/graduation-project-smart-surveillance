// ===== HELPERS =====
const getBaseUrl = () => document.getElementById('api-url').value.replace(/\/+$/, '');
const getToken = () => document.getElementById('auth-token').value.trim();
function headers() {
  const h = { 'Content-Type': 'application/json' };
  const t = getToken(); if (t) h['Authorization'] = `Bearer ${t}`;
  return h;
}
async function api(method, path, body) {
  const url = `${getBaseUrl()}${path}`;
  const opts = { method, headers: headers() };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let data; try { data = JSON.parse(text); } catch { data = text; }
    return { ok: res.ok, status: res.status, data };
  } catch (e) { return { ok: false, status: 0, data: { message: e.message } }; }
}

// ===== TOAST =====
function toast(msg, type = 'info') {
  const c = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]||''}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(40px)'; setTimeout(() => t.remove(), 300); }, 3500);
}

// ===== MODAL =====
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
document.querySelectorAll('.modal-overlay').forEach(el => {
  el.addEventListener('click', e => { if (e.target === el) el.classList.remove('active'); });
});

// ===== USER STATE =====
let allUsers = [];

function getInitials(first, last) {
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
}

// ===== RENDER ALL USERS =====
function renderUsers(users) {
  const list = document.getElementById('user-list');
  document.getElementById('user-count').textContent = `${users.length} user${users.length !== 1 ? 's' : ''}`;

  if (!users.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">👥</div><p>No users found</p></div>`;
    return;
  }

  list.innerHTML = users.map(u => `
    <div class="user-row" id="row-${u.id}">
      <div class="user-row-header" onclick="togglePanel('${u.id}')">
        <div class="avatar">${getInitials(u.firstName, u.lastName)}</div>
        <div class="user-info">
          <div class="user-name">${u.firstName || ''} ${u.lastName || ''}</div>
          <div class="user-email">${u.email || '—'}</div>
        </div>
        <div class="user-meta">
          <span class="badge badge-blue">@${u.userName || '—'}</span>
        </div>
        <div class="user-actions" onclick="event.stopPropagation()">
          <button class="icon-btn" title="Edit" onclick="openEditModal(allUsers.find(x=>x.id==='${u.id}'))">✏️</button>
          <button class="icon-btn danger" title="Delete" onclick="deleteUser('${u.id}')">🗑️</button>
        </div>
        <button class="chevron-btn" title="Camera assignments">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </div>
      <div class="camera-panel">
        <div class="camera-columns" id="cameras-${u.id}">
          <div class="camera-loading"><div class="spinner"></div> Loading cameras...</div>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== TOGGLE PANEL =====
async function togglePanel(userId) {
  const row = document.getElementById(`row-${userId}`);
  const isOpen = row.classList.contains('expanded');

  // close all others
  document.querySelectorAll('.user-row.expanded').forEach(r => {
    if (r.id !== `row-${userId}`) r.classList.remove('expanded');
  });

  if (isOpen) {
    row.classList.remove('expanded');
  } else {
    row.classList.add('expanded');
    await loadCamerasForUser(userId);
  }
}

// ===== LOAD CAMERAS FOR A USER =====
async function loadCamerasForUser(userId) {
  const container = document.getElementById(`cameras-${userId}`);
  container.innerHTML = `<div class="camera-loading" style="grid-column:1/-1"><div class="spinner"></div> Loading cameras...</div>`;

  const [assignedRes, unassignedRes] = await Promise.all([
    api('get', `/api/usercamera/user/${encodeURIComponent(userId)}/cameras`),
    api('get', `/api/usercamera/user/${encodeURIComponent(userId)}/UnassignedCameras`)
  ]);

  const assigned = (assignedRes.ok && assignedRes.data?.isSuccess) ? (assignedRes.data.data || []) : [];
  const unassigned = (unassignedRes.ok && unassignedRes.data?.isSuccess) ? (unassignedRes.data.data || []) : [];

  container.innerHTML = `
    <div class="camera-col">
      <div class="camera-col-title">
        <span class="dot dot-green"></span> Assigned
        <span class="count">${assigned.length}</span>
      </div>
      ${assigned.length === 0
        ? `<div class="camera-empty">No cameras assigned</div>`
        : assigned.map(c => `
          <div class="camera-item">
            <span class="camera-item-id">#${c.id}</span>
            <div class="camera-item-info">
              <div class="camera-item-name">${c.name || 'Camera ' + c.id}</div>
              <div class="camera-item-ip">${c.ipAddress || '—'}${c.port ? ':' + c.port : ''}</div>
            </div>
            <button class="btn btn-danger btn-xs" onclick="unassignAndReload('${userId}', ${c.id})">Unassign</button>
          </div>
        `).join('')
      }
    </div>
    <div class="camera-col">
      <div class="camera-col-title">
        <span class="dot dot-gray"></span> Not Assigned
        <span class="count">${unassigned.length}</span>
      </div>
      ${unassigned.length === 0
        ? `<div class="camera-empty">All cameras are assigned</div>`
        : unassigned.map(c => `
          <div class="camera-item">
            <span class="camera-item-id">#${c.id}</span>
            <div class="camera-item-info">
              <div class="camera-item-name">${c.name || 'Camera ' + c.id}</div>
              <div class="camera-item-ip">${c.ipAddress || '—'}${c.port ? ':' + c.port : ''}</div>
            </div>
            <button class="btn btn-success btn-xs" onclick="assignAndReload('${userId}', ${c.id})">Assign</button>
          </div>
        `).join('')
      }
    </div>
  `;
}

// ===== ASSIGN / UNASSIGN =====
async function assignAndReload(userId, cameraId) {
  const res = await api('post', `/api/usercamera/user/${encodeURIComponent(userId)}/camera/${cameraId}`);
  if (res.ok && res.data?.isSuccess) {
    toast('Camera assigned!', 'success');
    await loadCamerasForUser(userId);
  } else { toast(res.data?.message || 'Failed to assign', 'error'); }
}

async function unassignAndReload(userId, cameraId) {
  const res = await api('delete', `/api/usercamera/user/${encodeURIComponent(userId)}/camera/${cameraId}`);
  if (res.ok && res.data?.isSuccess) {
    toast('Camera unassigned!', 'success');
    await loadCamerasForUser(userId);
  } else { toast(res.data?.message || 'Failed to unassign', 'error'); }
}

// ===== LOAD ALL USERS =====
async function loadAllUsers() {
  const list = document.getElementById('user-list');
  list.innerHTML = `<div class="camera-loading"><div class="spinner"></div> Loading users...</div>`;
  const res = await api('get', '/api/usermanagement/get-all-users');
  if (res.ok && res.data?.isSuccess) {
    allUsers = res.data.data || [];
    renderUsers(allUsers);
    toast(`Loaded ${allUsers.length} users`, 'success');
  } else {
    toast(res.data?.message || 'Failed to load users', 'error');
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">⚠️</div><p>Error loading users</p></div>`;
  }
}

// ===== CREATE USER =====
async function createUser() {
  const body = {
    firstName: document.getElementById('cu-firstname').value,
    lastName: document.getElementById('cu-lastname').value,
    userName: document.getElementById('cu-username').value,
    email: document.getElementById('cu-email').value,
    password: document.getElementById('cu-password').value
  };
  if (!body.email || !body.password || !body.userName) { toast('Email, username and password required', 'error'); return; }
  const res = await api('post', '/api/usermanagement/create-user', body);
  if (res.ok && res.data?.isSuccess) {
    toast('User created!', 'success');
    closeModal('create-user-modal');
    ['cu-firstname','cu-lastname','cu-username','cu-email','cu-password'].forEach(id => document.getElementById(id).value = '');
    loadAllUsers();
  } else { toast(res.data?.message || 'Failed to create user', 'error'); }
}

// ===== EDIT USER =====
function openEditModal(user) {
  if (!user) return;
  document.getElementById('eu-id').value = user.id;
  document.getElementById('eu-firstname').value = user.firstName || '';
  document.getElementById('eu-lastname').value = user.lastName || '';
  document.getElementById('eu-username').value = user.userName || '';
  document.getElementById('eu-email').value = user.email || '';
  document.getElementById('eu-password').value = '';
  openModal('edit-user-modal');
}

async function updateUser() {
  const body = {
    id: document.getElementById('eu-id').value,
    firstName: document.getElementById('eu-firstname').value,
    lastName: document.getElementById('eu-lastname').value,
    userName: document.getElementById('eu-username').value,
    email: document.getElementById('eu-email').value,
    password: document.getElementById('eu-password').value || undefined
  };
  const res = await api('put', '/api/usermanagement/update-user', body);
  if (res.ok && res.data?.isSuccess) {
    toast('User updated!', 'success');
    closeModal('edit-user-modal');
    loadAllUsers();
  } else { toast(res.data?.message || 'Failed to update', 'error'); }
}

// ===== DELETE USER =====
async function deleteUser(id) {
  if (!confirm('Delete this user?')) return;
  const res = await api('delete', `/api/usermanagement/delete-user?id=${encodeURIComponent(id)}`);
  if (res.ok && res.data?.isSuccess) {
    toast('User deleted', 'success');
    loadAllUsers();
  } else { toast(res.data?.message || 'Failed to delete', 'error'); }
}
