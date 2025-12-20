# TikTok Live Overlay - King Auction Timer

Overlay untuk TikTok Live Studio dengan fitur auction/survival timer.

## 🚀 Deployment ke Render

1. Push repository ke GitHub
2. Buka https://render.com dan login
3. Klik **New** → **Web Service**
4. Connect repository GitHub Anda
5. Setting:
   - **Name**: tiktok-timer
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
6. Klik **Create Web Service**

Setelah deploy selesai, Render akan memberikan URL seperti:
```
https://tiktok-timer-xxxx.onrender.com
```

## 📺 URL Overlay untuk TikTok Live Studio

Gunakan URL berikut di TikTok Live Studio (Browser Source):
```
https://tiktok-timer-xxxx.onrender.com/overlay.html
```

## 🎮 Control Timer

Buka terminal dan jalankan:

**Start timer:**
```bash
curl https://tiktok-timer-xxxx.onrender.com/start
```

**Simulate gift (+30 detik):**
```bash
curl "https://tiktok-timer-xxxx.onrender.com/simulate-gift?username=Gaa."
```

**Reset:**
```bash
curl https://tiktok-timer-xxxx.onrender.com/reset
```

**Check status:**
```bash
curl https://tiktok-timer-xxxx.onrender.com/status
```

## 🎨 Fitur Overlay

- ✅ Avatar + crown pemenang (top-center)
- ✅ Username di bawah avatar
- ✅ Gift counter dengan icon (tengah)
- ✅ Timer format 00:30 (bottom-center)
- ✅ Animasi:
  - Float avatar saat menang
  - Pop animation saat gift
  - Pulse merah saat <5 detik
  - Confetti saat menang
- ✅ Transparent background untuk OBS/Live Studio

## 🛠️ Local Development

```bash
npm install
npm start
```

Buka browser: http://localhost:3000/overlay.html

Test gift:
```bash
curl http://localhost:3000/start
curl "http://localhost:3000/simulate-gift?username=TestUser"
```
