const WebSocket = require('ws');
const url = 'wss://unshieldable-nonaseptically-annemarie.ngrok-free.dev';
const ws = new WebSocket(url);
ws.on('open', () => { console.log('OPEN'); });
ws.on('message', (m) => { console.log('MSG', m.toString()); });
ws.on('close', (code, reason) => { console.log('CLOSE', code, reason && reason.toString()); });
ws.on('error', (e) => { console.error('ERROR', e && e.stack ? e.stack : String(e)); });
setInterval(()=>{},1000);
