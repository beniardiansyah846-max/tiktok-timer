// Overlay client: WebSocket connection with auto-reconnect for real-time timer updates
// Syncs timer/colors/gift effects in real-time.

const timerEl = document.getElementById('overlay-timer') || document.getElementById('overlayTimer');
const timerDigitsEl = document.getElementById('timer-digits');
const resetCueEl = document.getElementById('resetCue');
const addCueEl = document.getElementById('addCue');

let lastRemaining = null;
let lastRunning = null;
let lastGiftTime = 0;
let lastAddValue = 0;
let lastGiftCount = 0;
let lastGifterUsername = null;

// WebSocket connection
let ws = null;
let reconnectTimeout = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_DELAY = 5000;

// Step 1: visual defaults (no logic change)
function initOverlayVisual() {
  const avatarEl = document.getElementById('avatar');
  const usernameEl = document.getElementById('username');
  if (avatarEl && usernameEl) {
    avatarEl.src = avatarEl.src || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23cccccc"/><text x="50%" y="54%" font-family="Arial" font-size="12" text-anchor="middle" fill="%23666666">Avatar</text></svg>';
    usernameEl.textContent = usernameEl.textContent || 'Nama Pengguna';
  }

  const giftCountEl = document.getElementById('gift-count');
  if (giftCountEl) {
    giftCountEl.textContent = giftCountEl.textContent || '1';
  }
}

// Gift popup helper (visual only)
function showGiftPopup(giftType, amount = 1) {
  const map = { rose: '💛', finger_heart: '💛' };
  const emoji = map[giftType] || '🎁';

  const giftIconEl = document.querySelector('.gift-icon');
  if (giftIconEl) giftIconEl.textContent = emoji;

  const giftCountEl = document.getElementById('gift-count');
  if (giftCountEl) giftCountEl.textContent = String(amount);

  // Animasi pop pada jumlah gift
  if (giftCountEl) giftCountEl.style.animation = 'pop-in 0.25s ease';
  setTimeout(() => {
    if (giftCountEl) giftCountEl.style.animation = '';
  }, 300);
}

function formatMMSS(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0));
  const seconds = s % 60;
  return String(seconds).padStart(2, '0');
}

function applyTimerVisuals(remaining, changed) {
  if (!timerEl) return;
  const warn = remaining < 10 && remaining >= 5;
  const critical = remaining < 5 && remaining > 0;
  timerEl.classList.toggle('warn', warn);
  timerEl.classList.toggle('critical', critical);
  if (changed) {
    timerEl.classList.remove('tick');
    void timerEl.offsetWidth; // restart tick animation
    timerEl.classList.add('tick');
  }
}

function showResetCue() {
  if (!resetCueEl) return;
  resetCueEl.classList.remove('visible');
  void resetCueEl.offsetWidth;
  resetCueEl.classList.add('visible');
  setTimeout(() => resetCueEl.classList.remove('visible'), 1000);
}

function showAddCue(text = '+5s') {
  if (!addCueEl) return;
  addCueEl.textContent = text;
  addCueEl.classList.remove('visible');
  void addCueEl.offsetWidth;
  addCueEl.classList.add('visible');
  setTimeout(() => addCueEl.classList.remove('visible'), 1000);
}

function renderStatus(data) {
  if (!timerEl || !data) return;

  const remaining = Number(data.remaining ?? data.timeLeft ?? 0);
  const running = Boolean(data.running);
  const lastAdd = Number(data.lastAdd ?? 0);
  const activeMode = data.activeGiftType || 'unknown';
  const lastGifter = data.lastGifter || data.gifter || null;
  const giftCount = Number(data.giftCount ?? 0);
  const giftType = data.lastGift || data.giftType || (lastGifter ? lastGifter.giftName : null);

  // ===== Avatar & Username (real-time) =====
  if (lastGifter && lastGifter.username) {
    const avatarEl = document.getElementById('avatar');
    const usernameEl = document.getElementById('username');
    
    // Update username jika berubah
    if (usernameEl && lastGifter.username !== lastGifterUsername) {
      usernameEl.textContent = lastGifter.username;
      lastGifterUsername = lastGifter.username;
      console.log('👤 Gifter updated:', lastGifter.username);
    }
    
    // Update avatar jika ada URL
    if (avatarEl && lastGifter.avatarUrl) {
      avatarEl.src = lastGifter.avatarUrl;
    }
  }

  // ===== Gift Count Display =====
  if (giftCount > lastGiftCount) {
    const giftCountEl = document.getElementById('gift-count');
    if (giftCountEl) {
      giftCountEl.textContent = String(giftCount);
      // Animasi pop
      giftCountEl.style.animation = 'none';
      void giftCountEl.offsetWidth; // Force reflow
      giftCountEl.style.animation = 'pop-in 0.25s ease';
      console.log('🎁 Gift count:', giftCount);
    }
    lastGiftCount = giftCount;
  }

  // ===== Timer Display & Colors (only update if changed) =====
  if (lastRemaining !== remaining) {
    const formatted = formatMMSS(remaining);
    if (timerDigitsEl) {
      timerDigitsEl.textContent = formatted;
    } else {
      timerEl.textContent = formatted;
    }
    const changed = lastRemaining !== null;
    applyTimerVisuals(remaining, changed);
    // ===== Detect reset (30s and running, but wasn't before) =====
  if (running && !lastRunning && remaining === 30) {
    showResetCue();
    lastRunning = true;
  } else if (running) {
    lastRunning = true;
  } else {
    lastRunning = false;
  }

  // ===== Detect gift add (+5s event, debounce within 1.5s) =====
  if (lastAdd > 0 && Date.now() - lastGiftTime > 1500) {
    showAddCue(`+${lastAdd}s`);
    lastGiftTime = Date.now();
    lastAddValue = lastAdd;
    
    // Animate gift emoji/count if changed
    if (giftType) {
      const giftTypeKey = String(giftType).toLowerCase().includes('rose') ? 'rose' : 'finger_heart';
      showGiftPopup(giftTypeKey, giftCount);
    }
  }
}

// ===== WebSocket Connection =====
function connectWebSocket() {
  // Get WebSocket URL from query param or default to current host
  const urlParams = new URLSearchParams(window.location.search);
  let wsUrl = urlParams.get('ws');
  
  if (!wsUrl) {
    // Auto-detect: if HTTPS use wss://, if HTTP use ws://
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsUrl = `${protocol}//${window.location.host}`;
  }
  
  console.log('🔌 Connecting to WebSocket:', wsUrl);
  
  try {
    ws = new WebSocket(wsUrl);
    
    ws.addEventListener('open', () => {
      console.log('✅ WebSocket connected');
      reconnectAttempts = 0; // Reset counter on success
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    });
    
    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'state') {
          renderStatus(data);
        }
      } catch (err) {
        console.error('❌ Error parsing WebSocket message:', err);
      }
    });
    
    ws.addEventListener('close', (event) => {
      console.log('❌ WebSocket closed. Code:', event.code, 'Reason:', event.reason || 'none');
      ws = null;
      scheduleReconnect();
    });
    
    ws.addEventListener('error', (error) => {
      console.error('⚠️ WebSocket error:', error);
      // Close will be called automatically, triggering reconnect
    });
    
  } catch (err) {
    console.error('❌ Failed to create WebSocket:', err);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimeout) return; // Already scheduled
  
  // Exponential backoff: 1s, 2s, 4s, max 5s
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  reconnectAttempts++;
  
  console.log(`🔄 Reconnecting in ${delay}ms... (attempt ${reconnectAttempts})`);
  
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    connectWebSocket();
  }, delay);
}

// ===== Initialize on load =====
function init() {
  console.log('🚀 Overlay initializing...');
  initOverlayVisual();
  connectWebSocket();
}

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Expose functions per spec (overlay will be driven by server)
// Note: these call server endpoints; overlay does not change time locally.
window.setTime = function setTime() {
  fetch('/start').catch(() => {});
};

window.addTime = function addTime(seconds) {
  if (Number(seconds) > 0) {
    fetch('/simulate-gift').catch(() => {});
  }
};

// Optional: keep buttons on index working by delegating to server
window.start = function start() { fetch('/start').catch(() => {}); };
window.reset = function reset() { fetch('/start').catch(() => {}); };
