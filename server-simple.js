const express = require('express');
const path = require('path');

const PORT = process.env.PORT || 3000;
const app = express();

// ==== Timer State (server is the only timekeeper) ====
let remainingSeconds = 0;
let running = false;
let lastAddSeconds = 0;
let activeGiftType = 'finger_heart';

// Tick interval: decrement every second when running
setInterval(() => {
  if (running && remainingSeconds > 0) {
    remainingSeconds -= 1;
    if (remainingSeconds === 0) {
      running = false;
    }
  }
}, 1000);

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
  res.json({ ok: true, running, remaining: remainingSeconds, lastAdd: lastAddSeconds });
});

// Status: report current state (then reset lastAdd)
app.get('/status', (req, res) => {
  const payload = { running, remaining: remainingSeconds, lastAdd: lastAddSeconds };
  res.json(payload);
  lastAddSeconds = 0;
});

// Simulate gift: add +5s
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
    }
  }
  res.json({ ok: true, running, remaining: remainingSeconds, lastAdd: lastAddSeconds });
});

// Set active gift type (finger_heart | rose). Others ignored.
app.get('/set-gift-type', (req, res) => {
  const t = String(req.query.type || '').toLowerCase();
  if (t === 'finger_heart' || t === 'rose') {
    activeGiftType = t;
    res.json({ ok: true, activeGiftType });
  } else {
    res.status(400).json({ ok: false, error: 'invalid type' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
