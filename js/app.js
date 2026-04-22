/**
 * app.js — LunaSync main application logic
 * State management, rendering, tab routing, reset modal
 */

import {
  getCycleDay, getPhase, getMoodProfile,
  getDaysUntilNextPeriod, getForecast, PHASE_PROFILES
} from './cycle.js';
import { getRealMoonPhase, checkMoonSync } from './moon.js';
import {
  registerServiceWorker, requestNotificationPermission,
  scheduleNextNotification, listenForReschedule, sendTestNotification
} from './notifications.js';

// ── State ──────────────────────────────────────────────────────────────────
const DEFAULT_STATE = {
  cycleStartDate: null,
  cycleLength: 29,
  notificationsEnabled: false,
  notificationTime: '08:00',
  setupComplete: false
};

function loadState() {
  try {
    const raw = localStorage.getItem('lunasync');
    return raw ? { ...DEFAULT_STATE, ...JSON.parse(raw) } : { ...DEFAULT_STATE };
  } catch { return { ...DEFAULT_STATE }; }
}

function saveState(state) {
  localStorage.setItem('lunasync', JSON.stringify(state));
}

let state = loadState();

// ── Initialization ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await registerServiceWorker();

  if (!state.setupComplete || !state.cycleStartDate) {
    showSetupScreen();
  } else {
    showMainApp();
    renderAll();
    scheduleIfEnabled();
  }

  bindGlobalEvents();
});

// ── Setup Screen ────────────────────────────────────────────────────────────
function showSetupScreen() {
  document.getElementById('setup-screen').classList.remove('hidden');
  document.getElementById('main-app').classList.add('hidden');

  document.getElementById('setup-form').addEventListener('submit', e => {
    e.preventDefault();
    const daysAgo = parseInt(document.getElementById('setup-days-ago').value) || 0;
    const cycleLength = parseInt(document.getElementById('setup-cycle-length').value) || 29;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    state.cycleStartDate = startDate.toISOString().split('T')[0];
    state.cycleLength = cycleLength;
    state.setupComplete = true;
    saveState(state);

    document.getElementById('setup-screen').classList.add('hidden');
    showMainApp();
    renderAll();
    scheduleIfEnabled();
  });
}

function showMainApp() {
  document.getElementById('main-app').classList.remove('hidden');
  document.getElementById('setup-screen').classList.add('hidden');
}

// ── Tab Routing ────────────────────────────────────────────────────────────
let activeTab = 'today';

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tab}`);
  });
}

// ── Master Render ──────────────────────────────────────────────────────────
function renderAll() {
  if (!state.cycleStartDate) return;

  const today = new Date();
  const cycleDay = getCycleDay(state.cycleStartDate, today);
  const adjustedDay = ((cycleDay - 1) % state.cycleLength) + 1;
  const phase = getPhase(adjustedDay, state.cycleLength);
  const profile = getMoodProfile(phase);
  const daysLeft = getDaysUntilNextPeriod(adjustedDay, state.cycleLength);
  const realMoon = getRealMoonPhase(today);
  const inSync = checkMoonSync(realMoon, phase);

  renderTodayCard(adjustedDay, phase, profile, daysLeft, realMoon, inSync);
  renderForecast();
  renderTimeline(adjustedDay);
  renderSettings();
  applyPhaseTheme(phase, profile);
}

// ── Today Card ─────────────────────────────────────────────────────────────
function renderTodayCard(cycleDay, phase, profile, daysLeft, realMoon, inSync) {
  // Moon glow
  document.getElementById('today-moon').textContent = profile.moonEmoji;
  document.getElementById('today-moon').style.setProperty('--glow-color', profile.glowColor);

  // Phase label + tagline
  document.getElementById('today-phase-name').textContent = profile.name;
  document.getElementById('today-label').textContent = profile.label;
  document.getElementById('today-tagline').textContent = profile.tagline;

  // Mood summary
  document.getElementById('today-mood-summary').textContent = profile.moodSummary;

  // Day counter
  document.getElementById('today-day-counter').textContent = `Day ${cycleDay} of ${state.cycleLength}`;
  document.getElementById('today-days-left').textContent =
    daysLeft === 1 ? '⚠️ Period expected today' :
    daysLeft <= 3 ? `⚠️ Period in ~${daysLeft} days` :
    `${daysLeft} days until next period`;

  // Tips list
  const tipsList = document.getElementById('today-tips');
  tipsList.innerHTML = profile.tips.map(t =>
    `<li class="tip-item">${t}</li>`
  ).join('');

  // Real moon secondary
  document.getElementById('real-moon-emoji').textContent = realMoon.emoji;
  document.getElementById('real-moon-name').textContent = realMoon.phaseName;
  document.getElementById('real-moon-illumination').textContent = `${realMoon.illumination} illuminated`;

  // Sync badge
  const syncBadge = document.getElementById('sync-badge');
  if (inSync) {
    syncBadge.textContent = '✨ In sync with the moon';
    syncBadge.classList.add('synced');
  } else {
    syncBadge.textContent = 'Out of lunar sync';
    syncBadge.classList.remove('synced');
  }
}

// ── Forecast Strip ─────────────────────────────────────────────────────────
function renderForecast() {
  const forecast = getForecast(state.cycleStartDate, state.cycleLength);
  const strip = document.getElementById('forecast-strip');
  const fullList = document.getElementById('forecast-full-list');
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Compact strip
  strip.innerHTML = forecast.map((day, i) => {
    const isToday = i === 0;
    const dateLabel = isToday ? 'Today' : DAYS_SHORT[day.date.getDay()];
    const dateNum = day.date.getDate();
    return `
      <div class="forecast-card ${isToday ? 'today' : ''}">
        <span class="forecast-day">${dateLabel}</span>
        <span class="forecast-date">${dateNum}</span>
        <span class="forecast-moon">${day.profile.moonEmoji}</span>
        <span class="forecast-tag" style="color:${day.profile.color}">${day.profile.label}</span>
        <span class="forecast-tip">${day.profile.tipShort}</span>
      </div>
    `;
  }).join('');

  // Full expanded cards
  if (fullList) {
    fullList.innerHTML = forecast.map((day, i) => {
      const isToday = i === 0;
      const dayName = isToday ? 'Today' : DAYS[day.date.getDay()];
      const dateStr = day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      // Pick a random tip for each day
      const tip = day.profile.tips[i % day.profile.tips.length];
      return `
        <div class="forecast-full-card" style="border-left: 3px solid ${day.profile.glowColor}">
          <span class="forecast-full-moon">${day.profile.moonEmoji}</span>
          <div class="forecast-full-info">
            <div class="forecast-full-date-label">${dayName} · ${dateStr} · Day ${day.cycleDay}</div>
            <div class="forecast-full-phase" style="color:${day.profile.color}">${day.profile.label}</div>
            <div class="forecast-full-tip">${tip}</div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// ── Cycle Timeline Wheel ────────────────────────────────────────────────────
function renderTimeline(currentDay) {
  const canvas = document.getElementById('cycle-wheel');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 300;
  const H = canvas.height = canvas.offsetWidth || 300;
  const cx = W / 2, cy = H / 2;
  const outerR = W * 0.43;
  const innerR = W * 0.28;
  const len = state.cycleLength;

  ctx.clearRect(0, 0, W, H);

  // Phase arc colors
  const phaseColors = [
    { days: [1, 5], color: '#6b7db3' },                               // Menstrual
    { days: [6, 13], color: '#4ecdc4' },                              // Follicular
    { days: [14, 16], color: '#f9c74f' },                             // Ovulatory
    { days: [17, 22], color: '#f4a261' },                             // Early Luteal
    { days: [23, 26], color: '#e07a8f' },                             // PMS
    { days: [27, len], color: '#c9184a' }                             // Peak PMS
  ];

  // Draw phase arcs
  phaseColors.forEach(({ days, color }) => {
    const startAngle = ((days[0] - 1) / len) * Math.PI * 2 - Math.PI / 2;
    const endAngle = (days[1] / len) * Math.PI * 2 - Math.PI / 2;

    ctx.beginPath();
    ctx.arc(cx, cy, outerR, startAngle, endAngle);
    ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    ctx.closePath();
    ctx.fillStyle = color + 'aa';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Draw day tick marks
  for (let d = 1; d <= len; d++) {
    const angle = ((d - 1) / len) * Math.PI * 2 - Math.PI / 2;
    const tickLen = d % 7 === 0 ? 8 : 4;
    const r1 = outerR + 2;
    const r2 = outerR + 2 + tickLen;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
    ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw today dot
  const todayAngle = ((currentDay - 1) / len) * Math.PI * 2 - Math.PI / 2;
  const todayR = (outerR + innerR) / 2;
  const tx = cx + Math.cos(todayAngle) * todayR;
  const ty = cy + Math.sin(todayAngle) * todayR;

  // Glow effect
  const gradient = ctx.createRadialGradient(tx, ty, 0, tx, ty, 12);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.6)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.beginPath();
  ctx.arc(tx, ty, 12, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(tx, ty, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Center text
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.font = `bold ${W * 0.1}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${currentDay}`, cx, cy - W * 0.05);
  ctx.font = `${W * 0.045}px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText('day', cx, cy + W * 0.06);
}

// ── Settings ───────────────────────────────────────────────────────────────
function renderSettings() {
  document.getElementById('setting-cycle-length').value = state.cycleLength;
  document.getElementById('setting-notif-time').value = state.notificationTime;
  document.getElementById('setting-notif-toggle').checked = state.notificationsEnabled;
  document.getElementById('setting-start-date').textContent =
    state.cycleStartDate
      ? new Date(state.cycleStartDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
      : 'Not set';
}

// ── Phase Theme ────────────────────────────────────────────────────────────
function applyPhaseTheme(phase, profile) {
  document.documentElement.style.setProperty('--current-phase-color', profile.color);
  document.documentElement.style.setProperty('--current-glow', profile.glowColor);
  document.body.dataset.phase = phase;
}

// ── Reset Modal ────────────────────────────────────────────────────────────
function openResetModal() {
  document.getElementById('reset-modal').classList.add('visible');
  document.getElementById('reset-days-ago').value = 0;
}

function closeResetModal() {
  document.getElementById('reset-modal').classList.remove('visible');
}

function confirmReset() {
  const daysAgo = parseInt(document.getElementById('reset-days-ago').value) || 0;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysAgo);
  state.cycleStartDate = startDate.toISOString().split('T')[0];
  saveState(state);
  closeResetModal();
  renderAll();
  if (state.notificationsEnabled) {
    scheduleNextNotification(state.notificationTime, state.cycleStartDate, state.cycleLength);
  }

  // Visual feedback
  showToast('✅ Cycle reset! Day 1 is now set.');
}

// ── Toast ──────────────────────────────────────────────────────────────────
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3000);
}

// ── Notifications Toggle ───────────────────────────────────────────────────
async function toggleNotifications(enabled) {
  if (enabled) {
    const granted = await requestNotificationPermission();
    if (!granted) {
      showToast('⚠️ Notification permission denied. Check Settings.');
      document.getElementById('setting-notif-toggle').checked = false;
      return;
    }
    state.notificationsEnabled = true;
    saveState(state);
    scheduleNextNotification(state.notificationTime, state.cycleStartDate, state.cycleLength);
    listenForReschedule(state.cycleStartDate, state.cycleLength, state.notificationTime);
    showToast('🔔 Daily notifications enabled!');
  } else {
    state.notificationsEnabled = false;
    saveState(state);
    showToast('🔕 Notifications disabled.');
  }
}

function scheduleIfEnabled() {
  if (state.notificationsEnabled && state.cycleStartDate) {
    scheduleNextNotification(state.notificationTime, state.cycleStartDate, state.cycleLength);
    listenForReschedule(state.cycleStartDate, state.cycleLength, state.notificationTime);
  }
}

// ── Global Event Bindings ──────────────────────────────────────────────────
function bindGlobalEvents() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.dataset.tab);
      if (btn.dataset.tab === 'forecast') renderForecast();
      if (btn.dataset.tab === 'timeline') {
        const cycleDay = getCycleDay(state.cycleStartDate);
        const adj = ((cycleDay - 1) % state.cycleLength) + 1;
        setTimeout(() => renderTimeline(adj), 50); // allow layout
      }
    });
  });

  // Reset buttons
  document.getElementById('btn-reset-today')?.addEventListener('click', openResetModal);
  document.getElementById('btn-reset-settings')?.addEventListener('click', openResetModal);
  document.getElementById('btn-modal-cancel')?.addEventListener('click', closeResetModal);
  document.getElementById('btn-modal-confirm')?.addEventListener('click', confirmReset);
  document.getElementById('reset-modal')?.addEventListener('click', e => {
    if (e.target === document.getElementById('reset-modal')) closeResetModal();
  });

  // Settings changes
  document.getElementById('setting-cycle-length')?.addEventListener('change', e => {
    state.cycleLength = parseInt(e.target.value) || 29;
    saveState(state);
    renderAll();
  });

  document.getElementById('setting-notif-time')?.addEventListener('change', e => {
    state.notificationTime = e.target.value;
    saveState(state);
    if (state.notificationsEnabled) {
      scheduleNextNotification(state.notificationTime, state.cycleStartDate, state.cycleLength);
    }
  });

  document.getElementById('setting-notif-toggle')?.addEventListener('change', e => {
    toggleNotifications(e.target.checked);
  });

  document.getElementById('btn-test-notif')?.addEventListener('click', () => {
    const cycleDay = getCycleDay(state.cycleStartDate);
    const adj = ((cycleDay - 1) % state.cycleLength) + 1;
    const phase = getPhase(adj, state.cycleLength);
    sendTestNotification(adj, phase);
    showToast('🔔 Test notification sent!');
  });

  document.getElementById('btn-clear-data')?.addEventListener('click', () => {
    if (confirm('Clear all LunaSync data? This cannot be undone.')) {
      localStorage.removeItem('lunasync');
      location.reload();
    }
  });

  // Window resize for wheel redraw
  window.addEventListener('resize', () => {
    if (activeTab === 'timeline' && state.cycleStartDate) {
      const cycleDay = getCycleDay(state.cycleStartDate);
      const adj = ((cycleDay - 1) % state.cycleLength) + 1;
      renderTimeline(adj);
    }
  });
}
