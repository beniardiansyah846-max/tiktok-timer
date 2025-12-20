# TikTok Timer Overlay (Deploy Guide)

## Overview
- Overlay file: `public/overlay.html` (WebSocket client)
- Server: `server.js` (Express + WebSocket, optional TikTok integration)
- WebSocket URL is configurable via query param: `?ws=`

## Local Test
```powershell
cd C:\Users\WIN 10\Documents\tiktok-timer
node server.js
# Test endpoints
Invoke-WebRequest -Uri http://localhost:3000/status -UseBasicParsing
Invoke-WebRequest -Uri http://localhost:3000/start -UseBasicParsing
Invoke-WebRequest -Uri http://localhost:3000/simulate-gift -UseBasicParsing
# Overlay (browser)
http://localhost:3000/overlay.html
# Or explicitly set WS endpoint
http://localhost:3000/overlay.html?ws=ws://localhost:3000
```

## Deploy Overlay to Vercel
- Requirements: Vercel account, `vercel` CLI
- Config: see `vercel.json` (serves `public/` as static)
```powershell
npm i -g vercel
vercel login
vercel --prod public
```
- Result: `https://<project>.vercel.app/overlay.html`
- If server is on another domain (Render), use:
```
https://<project>.vercel.app/overlay.html?ws=wss://<your-service>.onrender.com
```

## Deploy Server to Render
- Requirements: Render account
- Config blueprint: `render.yaml`
- Steps (Dashboard): New → Web Service → Connect repo
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Env Vars: `ENABLE_TIKTOK=false`, `TIKTOK_USERNAME=siscaa_x`
- Result: `https://<your-service>.onrender.com`
- Test:
```powershell
Invoke-WebRequest -Uri https://<your-service>.onrender.com/status -UseBasicParsing
Invoke-WebRequest -Uri https://<your-service>.onrender.com/start -UseBasicParsing
Invoke-WebRequest -Uri https://<your-service>.onrender.com/simulate-gift -UseBasicParsing
```

## TikTok Live Studio
- Use the Vercel overlay URL and point WS to your server:
```
https://<project>.vercel.app/overlay.html?ws=wss://<your-service>.onrender.com
```

## Notes
- Server reads `PORT` from env; Render provides it automatically.
- Set `ENABLE_TIKTOK=true` only when you intend to connect during a real live.
- WebSocket over HTTPS requires `wss://`.
