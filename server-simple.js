const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve overlay
app.use(express.static(path.join(__dirname, 'public')));

const START_TIME = 30;
let timeLeft = START_TIME;
let isRunning = false;
let totalGifts = 0;
let lastGifter = null;
let currentWinner = null;

wss.on('connection', (socket) => {
  console.log('✅ Client connected');
  socket.on('close', () => console.log('❌ Client disconnected'));
  socket.on('error', (err) => console.error('WS error:', err));
});

function broadcast(event = 'tick') {
  const payload = JSON.stringify({ timeLeft, isRunning, totalGifts, lastGifter, currentWinner, event });
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
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
  broadcast('tick');
  res.send("OK");
});

app.get("/reset", (req, res) => {
  timeLeft = START_TIME;
  isRunning = false;
  currentWinner = null;
  broadcast('tick');
  res.send("OK");
});

app.get("/simulate-gift", (req, res) => {
  const username = req.query.username || 'TestUser';
  lastGifter = { username, avatarUrl: null };
  totalGifts++;
  timeLeft += 30;
  broadcast('gift');
  res.send("OK");
});

app.get("/status", (req, res) => {
  res.json({ timeLeft, isRunning, totalGifts, lastGifter, currentWinner });
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
  console.log(`📺 Overlay: http://localhost:${PORT}/overlay.html`);
});
