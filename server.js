const { WebcastPushConnection } = require("tiktok-live-connector");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (socket, req) => {
  console.log('🔌 WebSocket client connected', req && req.headers && req.headers['user-agent']);
  socket.on('close', () => console.log('❌ WebSocket client disconnected'));
});

// Serve overlay and other static assets from /public
app.use(express.static(path.join(__dirname, 'public')));

const TIKTOK_USERNAME = process.env.TIKTOK_USERNAME || "siscaa_x";
const START_TIME = 30;

let timeLeft = START_TIME;
let isRunning = false;
let totalGifts = 0;
let lastGifter = null; // { username, avatarUrl }
let currentWinner = null; // { username, avatarUrl }

console.log("🚀 Server starting...");

// TikTok integration can be enabled via environment variable ENABLE_TIKTOK=true
const ENABLE_TIKTOK = process.env.ENABLE_TIKTOK === 'true';
let tiktok;

function broadcast(event = 'tick') {
  const payload = JSON.stringify({ timeLeft, isRunning, totalGifts, lastGifter, currentWinner, event });
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

if (ENABLE_TIKTOK) {
  tiktok = new WebcastPushConnection(TIKTOK_USERNAME, { disableEulerFallbacks: true });

  tiktok.connect()
    .then(() => {
      console.log("✅ Connected to TikTok Live:", TIKTOK_USERNAME);
    })
    .catch(err => {
      console.error("❌ TikTok connection failed:", err);
    });

  tiktok.on("gift", data => {
    const username = data?.uniqueId || data?.nickname || 'User';
    const avatarUrl = data?.profilePictureUrl || data?.user?.profilePicture || null;
    console.log("🎁 Gift received:", username);
    lastGifter = { username, avatarUrl };
    totalGifts++;
    if (!isRunning) return;
    timeLeft += 30;
    broadcast('gift');
  });
} else {
  console.log("⚠️ TikTok integration disabled (set ENABLE_TIKTOK=true to enable).");
}

setInterval(() => {
  if (!isRunning) return;
  if (timeLeft > 0) {
    timeLeft--;
    if (timeLeft === 0) {
      isRunning = false;
      currentWinner = lastGifter;
      broadcast('win');
    } else {
      broadcast('tick');
    }
  }
}, 1000);

app.get("/start", (req, res) => {
  isRunning = true;
  console.log("▶ START");
  broadcast('tick');
  res.send("OK");
});

app.get("/reset", (req, res) => {
  timeLeft = START_TIME;
  isRunning = false;
  currentWinner = null;
  console.log("🔄 RESET");
  broadcast('tick');
  res.send("OK");
});

// Simulate a gift: adds 30s and updates gifter info if provided
app.get("/simulate-gift", (req, res) => {
  const username = req.query.username || lastGifter?.username || 'User';
  const avatarUrl = req.query.avatar || lastGifter?.avatarUrl || null;
  lastGifter = { username, avatarUrl };
  totalGifts++;
  timeLeft += 30;
  console.log("🎁 Simulated gift: +30s from", username);
  broadcast('gift');
  res.send("OK");
});

// Status endpoint for debugging
app.get("/status", (req, res) => {
  res.json({ timeLeft, isRunning, totalGifts, lastGifter, currentWinner });
});

// Forced test connect endpoint to debug TikTok connection issues
app.get("/test-connect", async (req, res) => {
  if (!ENABLE_TIKTOK) return res.status(400).send('TikTok integration not enabled');
  try {
    await tiktok.connect();
    console.log('✅ Test connect success');
    res.send('OK');
  } catch (err) {
    console.error('❌ Test connect failed:', err);
    res.status(500).send(String(err));
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});