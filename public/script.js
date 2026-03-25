/* ============================================================
   Forest Fire & Smoke Monitor — Dashboard Script
   Polls GET /api/data every 5 seconds and updates the UI.
   ============================================================ */

const API_URL = '/api/data';
const REFRESH_INTERVAL_MS = 5000;

// ── Thresholds ────────────────────────────────────────────────
const TEMP_WARN   = 40;   // °C
const TEMP_DANGER = 60;   // °C
const SMOKE_WARN  = 300;  // ppm
const SMOKE_DANGER = 600; // ppm
const HUMIDITY_WARN = 20; // % (low humidity → more fire risk)

// ── Chart instances ───────────────────────────────────────────
let tempHumidityChart = null;
let smokeChart = null;

// ── DOM helpers ───────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

function setStatus(state) {
  const el = $('connection-status');
  el.className = 'badge';
  if (state === 'online') {
    el.className += ' badge-online';
    el.textContent = '🟢 Live';
  } else if (state === 'error') {
    el.className += ' badge-error';
    el.textContent = '🔴 Offline';
  } else {
    el.className += ' badge-connecting';
    el.textContent = '⏳ Connecting…';
  }
}

function setLastUpdated() {
  $('last-updated').textContent = new Date().toLocaleTimeString();
}

// Determine color level for a numeric value based on warn/danger thresholds
function levelFor(value, warnThreshold, dangerThreshold, invert = false) {
  if (invert) {
    // lower is more dangerous (e.g. humidity)
    if (value <= dangerThreshold) return 'danger';
    if (value <= warnThreshold)   return 'warn';
    return 'safe';
  }
  if (value >= dangerThreshold) return 'danger';
  if (value >= warnThreshold)   return 'warn';
  return 'safe';
}

function applyIndicator(indicatorId, level) {
  const el = $(indicatorId);
  el.className = `card-indicator ${level}`;
}

// ── Update sensor cards ───────────────────────────────────────
function updateCards(latest) {
  const { temperature, smoke, flame, humidity, latitude, longitude } = latest;

  // Temperature
  $('val-temperature').textContent = temperature.toFixed(1);
  applyIndicator('ind-temperature', levelFor(temperature, TEMP_WARN, TEMP_DANGER));

  // Smoke
  $('val-smoke').textContent = smoke.toFixed(0);
  applyIndicator('ind-smoke', levelFor(smoke, SMOKE_WARN, SMOKE_DANGER));

  // Flame
  const flameIsYes = flame === 'YES';
  $('val-flame').textContent = flame;
  $('val-flame').className = `card-value ${flameIsYes ? 'flame-yes' : 'flame-no'}`;
  applyIndicator('ind-flame', flameIsYes ? 'danger' : 'safe');
  const cardFlame = $('card-flame');
  if (flameIsYes) {
    cardFlame.classList.add('flame-danger');
  } else {
    cardFlame.classList.remove('flame-danger');
  }

  // Alert banner
  const alertBanner = $('flame-alert');
  if (flameIsYes) {
    alertBanner.classList.remove('hidden');
  } else {
    alertBanner.classList.add('hidden');
  }

  // Humidity
  $('val-humidity').textContent = humidity.toFixed(1);
  applyIndicator('ind-humidity', levelFor(humidity, HUMIDITY_WARN, 10, true));

  // Location
  const locText = `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`;
  $('val-location').textContent = locText;
  const mapLink = $('map-link');
  mapLink.href = `https://www.google.com/maps?q=${latitude},${longitude}`;
  mapLink.classList.remove('hidden');
}

// ── Update table ──────────────────────────────────────────────
function updateTable(records) {
  const tbody = $('table-body');

  if (!records.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="no-data">No data available yet.</td></tr>';
    return;
  }

  tbody.innerHTML = records
    .map((r, i) => {
      const time = new Date(r.createdAt).toLocaleString();
      const flameClass = r.flame === 'YES' ? 'flame-yes' : 'flame-no';
      const mapsUrl = `https://www.google.com/maps?q=${r.latitude},${r.longitude}`;
      return `
        <tr>
          <td>${i + 1}</td>
          <td>${time}</td>
          <td>${r.temperature.toFixed(1)}</td>
          <td>${r.smoke.toFixed(0)}</td>
          <td class="${flameClass}">${r.flame}</td>
          <td>${r.humidity.toFixed(1)}</td>
          <td>
            <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
               style="color:#3b82f6;text-decoration:none;">
              ${r.latitude.toFixed(3)}°, ${r.longitude.toFixed(3)}°
            </a>
          </td>
        </tr>`;
    })
    .join('');
}

// ── Charts ────────────────────────────────────────────────────
function initCharts(records) {
  const reversed = records.slice().reverse();
  const labels = reversed.map((r) => new Date(r.createdAt).toLocaleTimeString());
  const temps  = reversed.map((r) => r.temperature);
  const humid  = reversed.map((r) => r.humidity);
  const smokes = reversed.map((r) => r.smoke);

  // Temperature & Humidity chart
  const ctx1 = document.getElementById('chart-temp-humidity').getContext('2d');
  if (tempHumidityChart) tempHumidityChart.destroy();
  tempHumidityChart = new Chart(ctx1, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: temps,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.15)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
        },
        {
          label: 'Humidity (%)',
          data: humid,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.15)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
        },
      ],
    },
    options: chartOptions('Temperature & Humidity'),
  });

  // Smoke chart
  const ctx2 = document.getElementById('chart-smoke').getContext('2d');
  if (smokeChart) smokeChart.destroy();
  smokeChart = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Smoke Level (ppm)',
          data: smokes,
          backgroundColor: smokes.map((v) =>
            v >= SMOKE_DANGER ? 'rgba(239,68,68,0.8)' :
            v >= SMOKE_WARN   ? 'rgba(234,179,8,0.8)' :
                                'rgba(34,197,94,0.8)'
          ),
          borderRadius: 4,
        },
      ],
    },
    options: chartOptions('Smoke (ppm)'),
  });
}

function chartOptions(yLabel) {
  return {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 11 } },
      },
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', maxRotation: 45, font: { size: 10 } },
        grid:  { color: 'rgba(148,163,184,0.1)' },
      },
      y: {
        ticks: { color: '#94a3b8', font: { size: 10 } },
        grid:  { color: 'rgba(148,163,184,0.1)' },
        title: { display: true, text: yLabel, color: '#94a3b8', font: { size: 11 } },
      },
    },
  };
}

// ── Main fetch loop ───────────────────────────────────────────
async function fetchAndUpdate() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const json = await response.json();
    const records = json.data;

    if (!records || records.length === 0) {
      setStatus('online');
      $('table-body').innerHTML =
        '<tr><td colspan="7" class="no-data">No sensor data yet. Waiting for IoT device…</td></tr>';
      setLastUpdated();
      return;
    }

    setStatus('online');
    updateCards(records[0]);   // latest reading
    updateTable(records);
    initCharts(records);
    setLastUpdated();
  } catch (err) {
    setStatus('error');
    console.error('Fetch error:', err.message);
  }
}

// ── Bootstrap ─────────────────────────────────────────────────
fetchAndUpdate();
setInterval(fetchAndUpdate, REFRESH_INTERVAL_MS);
