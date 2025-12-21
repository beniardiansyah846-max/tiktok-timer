// Dashboard controller
const startBtn = document.getElementById('startBtn');
const modeBtns = document.querySelectorAll('.mode-btn');
const statusEls = document.querySelectorAll('.status p');
const tiktokUsernameInput = document.getElementById('tiktokUsername');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const tiktokStatusEl = document.getElementById('tiktokStatus');

let activeMode = 'rose';
let isConnectedToTikTok = false;
let connectedUsername = '';

// Panggil endpoint
async function callAPI(url) {
  try {
    const resp = await fetch(url);
    if (resp.ok) {
      const data = await resp.json();
      console.log('✓', url, data);
      return data;
    }
  } catch (e) {
    console.error('✗', url, e);
  }
}

// START/RESET button
startBtn.addEventListener('click', () => {
  callAPI('/start');
});

// Add simulate gift button handler
const simulateBtn = document.getElementById('simulateBtn');
if (simulateBtn) {
  simulateBtn.addEventListener('click', () => {
    callAPI('/simulate-gift?username=DashboardTest');
  });
}

// TikTok Connect button
connectBtn.addEventListener('click', async () => {
  const username = tiktokUsernameInput.value.trim();
  if (!username) {
    alert('Masukkan username TikTok terlebih dahulu!');
    return;
  }
  
  updateTikTokStatus('🟡 CONNECTING...', '#ffaa00');
  const data = await callAPI(`/connect-tiktok?username=${encodeURIComponent(username)}`);
  
  if (data && data.ok) {
    isConnectedToTikTok = true;
    connectedUsername = username;
    updateTikTokStatus(`🟢 TERHUBUNG: @${username}`, '#00ff88');
  } else {
    updateTikTokStatus('🔴 GAGAL CONNECT', '#ff4444');
    setTimeout(() => {
      updateTikTokStatus('⚪ TIDAK TERHUBUNG', '#888');
    }, 3000);
  }
});

// TikTok Disconnect button
disconnectBtn.addEventListener('click', async () => {
  updateTikTokStatus('🟡 DISCONNECTING...', '#ffaa00');
  const data = await callAPI('/disconnect-tiktok');
  
  if (data && data.ok) {
    isConnectedToTikTok = false;
    connectedUsername = '';
    updateTikTokStatus('⚪ TIDAK TERHUBUNG', '#888');
  }
});

// Update TikTok status display
function updateTikTokStatus(text, color) {
  if (tiktokStatusEl) {
    tiktokStatusEl.textContent = text;
    tiktokStatusEl.style.color = color;
  }
}

// Mode buttons
modeBtns.forEach((btn, idx) => {
  btn.addEventListener('click', () => {
    const type = idx === 0 ? 'finger_heart' : 'rose';
    callAPI(`/set-gift-type?type=${type}`).then(() => {
      activeMode = type;
      updateModeHighlight();
    });
  });
});

// Highlight active mode
function updateModeHighlight() {
  modeBtns.forEach((btn, idx) => {
    const isActive = (idx === 0 && activeMode === 'finger_heart') || 
                     (idx === 1 && activeMode === 'rose');
    btn.style.background = isActive ? '#4caf50' : '#2a2e39';
    btn.style.color = isActive ? '#000' : '#fff';
  });
}

// Poll status setiap 1 detik
async function updateStatus() {
  const data = await callAPI('/status');
  if (data) {
    const mm = String(Math.floor(data.remaining / 60)).padStart(2, '0');
    const ss = String(data.remaining % 60).padStart(2, '0');
    const timeStr = `${mm}:${ss}`;
    const runningStr = data.running ? '🟢 RUNNING' : '⚪ IDLE';
    const modeStr = (data.activeGiftType || activeMode).toUpperCase().replace('_', ' ');
    const gifterStr = data.lastGifter ? data.lastGifter.username : '—';
    const countStr = data.giftCount || 0;
    
    statusEls[0].textContent = `Status: ${runningStr}`;
    statusEls[1].textContent = `Time: ${timeStr}`;
    statusEls[2].textContent = `Gift Mode: ${modeStr}`;
    
    // Add gifter info if there's a 4th status element
    if (statusEls[3]) {
      statusEls[3].textContent = `Last Gifter: ${gifterStr} (${countStr} gifts)`;
    }
    
    if (data.activeGiftType) {
      activeMode = data.activeGiftType;
      updateModeHighlight();
    }
  }
  
  // Check TikTok connection status
  const tiktokStatus = await callAPI('/tiktok-status');
  if (tiktokStatus && tiktokStatus.connected) {
    if (!isConnectedToTikTok) {
      isConnectedToTikTok = true;
      connectedUsername = tiktokStatus.username || 'Unknown';
      updateTikTokStatus(`🟢 TERHUBUNG: @${connectedUsername}`, '#00ff88');
    }
  } else {
    if (isConnectedToTikTok) {
      isConnectedToTikTok = false;
      connectedUsername = '';
      updateTikTokStatus('⚪ TIDAK TERHUBUNG', '#888');
    }
  }
}

setInterval(updateStatus, 1000);
updateStatus();
updateModeHighlight();

console.log('Dashboard ready. Active mode:', activeMode);
