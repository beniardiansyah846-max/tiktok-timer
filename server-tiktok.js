const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const { WebcastPushConnection } = require('tiktok-live-connector');

const PORT = process.env.PORT || 3000;
const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || ''; // Set username TikTok yang live
const ENABLE_TIKTOK = process.env.ENABLE_TIKTOK === 'true';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ==== Timer State (server is the only timekeeper) ====
let remainingSeconds = 0;
let running = false;
let lastAddSeconds = 0;
let activeGiftType = 'rose'; // default: rose
let lastGifter = null;
let giftCount = 0;
let tiktokLiveConnection = null;

// Broadcast timer state to all connected WebSocket clients
function broadcastState() {
  const payload = JSON.stringify({
    type: 'state',
    running,
    remaining: remainingSeconds,
    lastAdd: lastAddSeconds,
    activeGiftType,
    lastGifter,
    giftCount
  });
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// ==== WebSocket Connection Management ====
const clients = new Set();

wss.on('connection', (ws, req) => {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  console.log('🔌 WebSocket client connected', userAgent);
  clients.add(ws);
  
  // Send current state immediately upon connection
  ws.send(JSON.stringify({
    type: 'state',
    running,
    remaining: remainingSeconds,
    lastAdd: lastAddSeconds,
    activeGiftType,
    lastGifter,
    giftCount
  }));

  ws.on('close', () => {
    console.log('❌ WebSocket client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('⚠️ WebSocket error:', error.message);
    clients.delete(ws);
  });
});

// Tick interval: decrement every second when running
setInterval(() => {
  if (running && remainingSeconds > 0) {
    remainingSeconds -= 1;
    if (remainingSeconds === 0) {
      running = false;
    }
    // Broadcast state update setiap detik
    broadcastState();
  }
}, 1000);

// ==== TikTok Live Integration ====
function connectToTikTok(username) {
  if (!username) {
    console.log('⚠️ TikTok username tidak diset. Gunakan TIKTOK_USERNAME env variable.');
    return;
  }

  tiktokLiveConnection = new WebcastPushConnection(username, {
    enableExtendedGiftInfo: true,
    requestPollingIntervalMs: 3000,
  });

  console.log(`🔗 Mencoba koneksi ke TikTok Live: @${username}...`);

  // Event: Connected
  tiktokLiveConnection.connect()
    .then((state) => {
      console.log(`✅ Terhubung ke TikTok Live @${username}`);
      console.log(`👥 Room ID: ${state.roomId}`);
    })
    .catch((err) => {
      console.error('❌ Gagal terhubung ke TikTok Live:', err.message);
      console.log('💡 Tips: Pastikan username benar dan sedang LIVE');
    });

  // Event: Gift received
  tiktokLiveConnection.on('gift', (data) => {
    const giftName = data.giftName ? data.giftName.toLowerCase() : '';
    const giftId = data.giftId;
    const username = data.uniqueId || data.nickname || 'Unknown';
    const repeatCount = data.repeatCount || 1;
    const avatarUrl = data.profilePictureUrl || '';

    console.log(`🎁 Gift dari @${username}: ${data.giftName} (x${repeatCount})`);

    // Mapping gift name ke type yang digunakan sistem
    let detectedType = null;
    
    // Rose gift (ID biasanya 5655)
    if (giftName.includes('rose') || giftId === 5655) {
      detectedType = 'rose';
    }
    // Finger Heart / TikTok gift (ID biasanya 5269)
    else if (giftName.includes('heart') || giftName.includes('tiktok') || giftId === 5269) {
      detectedType = 'finger_heart';
    }

    // Jika gift sesuai dengan activeGiftType, tambah waktu
    if (detectedType === activeGiftType) {
      const addSeconds = 5 * repeatCount; // 5 detik per gift
      remainingSeconds += addSeconds;
      running = true;
      lastAddSeconds = addSeconds;
      giftCount += repeatCount;
      
      // Simpan info gifter terakhir
      lastGifter = {
        username: username,
        avatarUrl: avatarUrl,
        giftName: data.giftName,
        repeatCount: repeatCount
      };

      console.log(`⏱️ Timer +${addSeconds}s (Total: ${remainingSeconds}s)`);
      broadcastState(); // Broadcast to WebSocket clients
    } else {
      console.log(`ℹ️ Gift diabaikan (aktif: ${activeGiftType}, terima: ${detectedType})`);
    }
  });

  // Event: Chat
  tiktokLiveConnection.on('chat', (data) => {
    console.log(`💬 ${data.uniqueId}: ${data.comment}`);
  });

  // Event: Like
  tiktokLiveConnection.on('like', (data) => {
    console.log(`❤️ ${data.uniqueId} mengirim ${data.likeCount} like`);
  });

  // Event: Member join
  tiktokLiveConnection.on('member', (data) => {
    console.log(`👋 ${data.uniqueId} bergabung!`);
  });

  // Event: Disconnected
  tiktokLiveConnection.on('disconnected', () => {
    console.log('❌ Terputus dari TikTok Live');
  });

  // Event: Error
  tiktokLiveConnection.on('error', (err) => {
    console.error('⚠️ TikTok Live error:', err.message);
  });
}

// Serve static files from /public
app.use(express.static('public'));

// Root serves index.html for convenience/health
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==== Timer endpoints ====
// Start: set to 30s and run
app.get('/start', (req, res) => {
  remainingSeconds = 30;
  running = true;
  lastAddSeconds = 0;
  giftCount = 0;
  broadcastState(); // Broadcast to WebSocket clients
  res.json({ ok: true, running, remaining: remainingSeconds, lastAdd: lastAddSeconds });
});

// Status: report current state (includes gifter info)
app.get('/status', (req, res) => {
  const payload = { 
    running, 
    remaining: remainingSeconds, 
    lastAdd: lastAddSeconds,
    activeGiftType,
    lastGifter,
    giftCount
  };
  res.json(payload);
  lastAddSeconds = 0; // reset after sending
});

// Simulate gift: add +5s (untuk testing tanpa TikTok Live)
app.get('/simulate-gift', (req, res) => {
  const type = String(req.query.type || '').toLowerCase();
  
  // Jika tidak ada type atau type kosong, gunakan activeGiftType
  const giftType = type || activeGiftType;
  
  if (giftType === activeGiftType || !type) {
    if (giftType === 'finger_heart' || giftType === 'rose') {
      // Tambahkan 5 detik ke waktu yang tersisa
      remainingSeconds += 5;
      running = true;
      lastAddSeconds = 5;
      giftCount += 1;
      
      // Simulasi gifter info
      lastGifter = {
        username: req.query.username || 'TestUser',
        avatarUrl: '',
        giftName: giftType === 'rose' ? 'Rose' : 'TikTok',
        repeatCount: 1
      };
      
      broadcastState(); // Broadcast to WebSocket clients
    }
  }
  res.json({ ok: true, running, remaining: remainingSeconds, lastAdd: lastAddSeconds });
});

// Set active gift type (finger_heart | rose). Others ignored.
app.get('/set-gift-type', (req, res) => {
  const t = String(req.query.type || '').toLowerCase();
  if (t === 'finger_heart' || t === 'rose') {
    activeGiftType = t;
    console.log(`🎁 Active gift type changed to: ${activeGiftType}`);
    broadcastState(); // Broadcast to WebSocket clients
    res.json({ ok: true, activeGiftType });
  } else {
    res.status(400).json({ ok: false, error: 'invalid type' });
  }
});

// Connect to TikTok Live (manual trigger via endpoint)
app.get('/connect-tiktok', (req, res) => {
  const username = req.query.username || TIKTOK_USERNAME;
  if (!username) {
    return res.status(400).json({ ok: false, error: 'username required' });
  }
  
  // Disconnect existing connection
  if (tiktokLiveConnection) {
    try {
      tiktokLiveConnection.disconnect();
    } catch (e) {}
  }
  
  connectToTikTok(username);
  res.json({ ok: true, message: `Connecting to @${username}...` });
});

// Disconnect from TikTok Live
app.get('/disconnect-tiktok', (req, res) => {
  if (tiktokLiveConnection) {
    try {
      tiktokLiveConnection.disconnect();
      tiktokLiveConnection = null;
      console.log('❌ Disconnected from TikTok Live');
      res.json({ ok: true, message: 'Disconnected from TikTok Live' });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  } else {
    res.json({ ok: true, message: 'Not connected' });
  }
});

// Check TikTok connection status
app.get('/tiktok-status', (req, res) => {
  const isConnected = tiktokLiveConnection !== null;
  res.json({ 
    ok: true, 
    connected: isConnected,
    username: TIKTOK_USERNAME || null
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server starting...`);
  console.log(`🌐 HTTP Server running at http://localhost:${PORT}`);
  console.log(`🔌 WebSocket Server running at ws://localhost:${PORT}`);
  console.log(`📺 Overlay: http://localhost:${PORT}/overlay.html`);
  console.log(`🎮 Dashboard: http://localhost:${PORT}/dashboard.html`);
  
  // Auto-connect to TikTok if enabled
  if (ENABLE_TIKTOK && TIKTOK_USERNAME) {
    console.log(`🔗 Auto-connecting to TikTok Live...`);
    connectToTikTok(TIKTOK_USERNAME);
  } else {
    console.log(`⚠️ TikTok integration disabled (set ENABLE_TIKTOK=true to enable).`);
    console.log(`💡 Set ENABLE_TIKTOK=true and TIKTOK_USERNAME=<username> untuk auto-connect`);
    console.log(`💡 Atau akses: http://localhost:${PORT}/connect-tiktok?username=<username>`);
  }
});
