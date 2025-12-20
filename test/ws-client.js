const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000');
ws.on('open', () => {
  console.log('OPEN');
});
ws.on('message', (m) => {
  console.log('MSG', m.toString());
});
ws.on('close', (code, reason) => console.log('CLOSE', code, reason && reason.toString()));
ws.on('error', (e) => console.error('ERROR', e && e.stack ? e.stack : String(e)));
// Keep process alive
setInterval(() => {}, 1000);
