// ===== FAKE DATA =====
const fakeCameras = [
  { id: 1, name: 'Front Gate', ipAddress: '192.168.1.10', port: 554 },
  { id: 2, name: 'Parking Lot A', ipAddress: '192.168.1.11', port: 554 },
  { id: 3, name: 'Main Lobby', ipAddress: '192.168.1.12', port: 8554 },
  { id: 4, name: 'Server Room', ipAddress: '192.168.1.13', port: 554 },
  { id: 5, name: 'Back Entrance', ipAddress: '192.168.1.14', port: 554 },
  { id: 6, name: 'Rooftop', ipAddress: '192.168.1.15', port: 8554 },
];

const types = ['FaceDetection', 'MotionDetection', 'Intrusion', 'Loitering', 'ObjectLeft', 'VehicleDetected', 'UnknownFace', 'Tampering'];
const names = ['Person Detected', 'Unknown Individual', 'Motion in Zone A', 'Suspicious Activity', 'Vehicle Entered', 'Object Abandoned', 'Face Matched', 'Camera Blocked', 'Perimeter Breach', 'Crowd Detected'];
const descs = [
  'An unrecognized individual was detected near the restricted area. Confidence: 87%.',
  'Motion detected in monitored zone. Duration: 12 seconds.',
  'A known person from the whitelist was identified entering the building.',
  'Suspicious loitering behavior detected for over 3 minutes near entrance.',
  'An unattended bag was detected on the floor near the exit.',
  'A vehicle with unregistered plates entered the parking lot.',
  'Camera feed was obstructed. Possible tampering detected.',
  'Multiple persons detected crossing the perimeter fence after hours.',
  'High-confidence face match with database entry. Match score: 94.2%.',
  'Unusual crowd gathering detected in the lobby area.',
];

function randomDate(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
  return d.toISOString();
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateDetections() {
  const all = {};
  let idCounter = 1;
  fakeCameras.forEach(cam => {
    const count = 2 + Math.floor(Math.random() * 7); // 2-8 detections per camera
    const dets = [];
    for (let i = 0; i < count; i++) {
      dets.push({
        id: idCounter++,
        name: pick(names),
        type: pick(types),
        description: pick(descs),
        cameraId: cam.id,
        detectedAt: randomDate(14),
        snapShotUrl: null,
        videoUrl: Math.random() > 0.6 ? 'https://example.com/video/clip_' + idCounter + '.mp4' : null
      });
    }
    // Sort by date descending
    dets.sort((a, b) => new Date(b.detectedAt) - new Date(a.detectedAt));
    all[cam.id] = dets;
  });
  return all;
}

// ===== STATE =====
let allCameras = fakeCameras;
let detectionsByCamera = generateDetections();
let allDetectionsByCamera = { ...detectionsByCamera }; // keep a copy for filtering
let totalDetections = Object.values(detectionsByCamera).reduce((s, d) => s + d.length, 0);

const iconVariants = 6;
function camIconClass(index) { return `cam-icon-${index % iconVariants}`; }

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    + '  ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function shortTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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
function closeModal() { document.getElementById('detail-modal').classList.remove('active'); }
document.getElementById('detail-modal').addEventListener('click', e => {
  if (e.target.id === 'detail-modal') closeModal();
});

// ===== LOAD / REFRESH =====
function loadEverything() {
  detectionsByCamera = generateDetections();
  allDetectionsByCamera = {};
  for (const k in detectionsByCamera) allDetectionsByCamera[k] = [...detectionsByCamera[k]];
  totalDetections = Object.values(detectionsByCamera).reduce((s, d) => s + d.length, 0);
  document.getElementById('camera-count').textContent = `${allCameras.length} camera${allCameras.length !== 1 ? 's' : ''}`;
  document.getElementById('detection-count').textContent = `${totalDetections} detection${totalDetections !== 1 ? 's' : ''}`;
  document.getElementById('filter-date').value = '';
  renderGrid();
  toast(`Loaded ${allCameras.length} cameras, ${totalDetections} detections`, 'success');
}

// ===== DATE FILTER =====
function onDateFilter() {
  const dateVal = document.getElementById('filter-date').value;
  if (!dateVal) return;
  const target = new Date(dateVal);
  detectionsByCamera = {};
  let count = 0;
  allCameras.forEach(c => {
    detectionsByCamera[c.id] = (allDetectionsByCamera[c.id] || []).filter(d => {
      const dd = new Date(d.detectedAt);
      return dd.getFullYear() === target.getFullYear() && dd.getMonth() === target.getMonth() && dd.getDate() === target.getDate();
    });
    count += detectionsByCamera[c.id].length;
  });
  totalDetections = count;
  document.getElementById('detection-count').textContent = `${totalDetections} detection${totalDetections !== 1 ? 's' : ''}`;
  renderGrid();
  toast(`Showing ${totalDetections} detections for ${dateVal}`, 'info');
}

function clearDateFilter() {
  document.getElementById('filter-date').value = '';
  detectionsByCamera = {};
  for (const k in allDetectionsByCamera) detectionsByCamera[k] = [...allDetectionsByCamera[k]];
  totalDetections = Object.values(detectionsByCamera).reduce((s, d) => s + d.length, 0);
  document.getElementById('detection-count').textContent = `${totalDetections} detection${totalDetections !== 1 ? 's' : ''}`;
  renderGrid();
}

// ===== RENDER =====
function renderGrid() {
  const grid = document.getElementById('camera-grid');
  grid.innerHTML = allCameras.map((cam, i) => {
    const dets = detectionsByCamera[cam.id] || [];
    const detBars = dets.length === 0
      ? `<div class="cam-empty"><div class="cam-empty-icon">🔍</div><p>No detections</p></div>`
      : dets.map((d, di) => `
        <div class="det-bar" onclick="showDetail(${cam.id}, ${di})">
          <span class="det-id">#${d.id}</span>
          <span class="det-type">${escHtml(d.type)}</span>
          <span class="det-name">${escHtml(d.name || '')}</span>
          <span class="det-time">${shortTime(d.detectedAt)}</span>
          <span class="det-arrow">›</span>
        </div>
      `).join('');

    return `
      <div class="camera-card">
        <div class="camera-card-header">
          <div class="cam-icon ${camIconClass(i)}">📷</div>
          <div class="cam-info">
            <div class="cam-name">${escHtml(cam.name)}</div>
            <div class="cam-ip">${escHtml(cam.ipAddress)}:${cam.port}</div>
          </div>
          <span class="cam-badge">${dets.length} det.</span>
        </div>
        <div class="camera-card-body">${detBars}</div>
      </div>
    `;
  }).join('');
}

// ===== DETAIL MODAL =====
function showDetail(cameraId, index) {
  const d = (detectionsByCamera[cameraId] || [])[index];
  if (!d) return;

  document.getElementById('dm-id').textContent = d.id ?? '—';
  document.getElementById('dm-camera').textContent = d.cameraId ?? '—';
  document.getElementById('dm-type').textContent = d.type || '—';
  document.getElementById('dm-type-badge').textContent = d.type || 'Detection';
  document.getElementById('dm-name').textContent = d.name || '—';
  document.getElementById('dm-desc').textContent = d.description || '—';
  document.getElementById('dm-date').textContent = formatDate(d.detectedAt);
  document.getElementById('dm-title').textContent = d.name || 'Detection #' + (d.id ?? '');

  const snapWrap = document.getElementById('dm-snapshot-wrap');
  if (d.snapShotUrl) {
    document.getElementById('dm-snapshot').src = d.snapShotUrl;
    snapWrap.style.display = 'block';
  } else { snapWrap.style.display = 'none'; }

  const videoWrap = document.getElementById('dm-video-wrap');
  if (d.videoUrl) {
    document.getElementById('dm-video-link').href = d.videoUrl;
    videoWrap.style.display = 'block';
  } else { videoWrap.style.display = 'none'; }

  document.getElementById('detail-modal').classList.add('active');
}

// ===== HTML ESCAPE =====
function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

// ===== AUTO LOAD =====
loadEverything();
