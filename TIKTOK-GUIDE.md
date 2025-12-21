# 🎁 TikTok Live Auto-Detect Gift - Panduan Lengkap

Server sudah siap dengan **TikTok Live Integration**! 🚀

## 📋 Fitur Baru

✅ **Auto-detect gift** dari TikTok Live secara real-time
✅ Support **Rose** dan **Finger Heart** gift  
✅ Otomatis tambah waktu (+5s per gift)
✅ Tampilkan info gifter (username + avatar)
✅ Mode simulasi untuk testing tanpa TikTok Live

---

## 🚀 Cara Menggunakan

### **1. Jalankan Server**

```powershell
cd 'c:\Users\Hype\Downloads\tiktok-timer (1)\tiktok-timer'
node server-tiktok.js
```

### **2. Koneksi ke TikTok Live**

Ada 2 cara:

#### **Cara A: Via Browser/API**
Buka di browser atau PowerShell:
```
http://localhost:3000/connect-tiktok?username=NAMA_TIKTOK_ANDA
```

Contoh:
```powershell
curl "http://localhost:3000/connect-tiktok?username=siscaa_x" -UseBasicParsing
```

#### **Cara B: Auto-connect saat Server Start**
Set environment variable dulu:
```powershell
$env:ENABLE_TIKTOK="true"
$env:TIKTOK_USERNAME="siscaa_x"
node server-tiktok.js
```

### **3. Pilih Gift Type**

Default: **Rose** 🌹

Untuk ganti ke Finger Heart:
```powershell
curl "http://localhost:3000/set-gift-type?type=finger_heart" -UseBasicParsing
```

Untuk ganti ke Rose:
```powershell
curl "http://localhost:3000/set-gift-type?type=rose" -UseBasicParsing
```

---

## 🎮 Endpoints API

### **Status Timer**
```
GET /status
```
Response:
```json
{
  "running": true,
  "remaining": 35,
  "lastAdd": 5,
  "activeGiftType": "rose",
  "lastGifter": {
    "username": "johndoe",
    "avatarUrl": "https://...",
    "giftName": "Rose",
    "repeatCount": 1
  },
  "giftCount": 7
}
```

### **Start/Reset Timer**
```
GET /start
```
Set timer ke 30 detik dan mulai countdown.

### **Koneksi TikTok Live**
```
GET /connect-tiktok?username=NAMA_TIKTOK
```
Mulai monitoring TikTok Live dari username tertentu.

**⚠️ PENTING:** Username harus sedang **LIVE** saat koneksi!

### **Disconnect TikTok Live**
```
GET /disconnect-tiktok
```
Putus koneksi dari TikTok Live.

### **Set Gift Type**
```
GET /set-gift-type?type=rose
GET /set-gift-type?type=finger_heart
```
Pilih gift mana yang akan menambah waktu timer.

### **Simulate Gift (Testing)**
```
GET /simulate-gift
GET /simulate-gift?type=rose&username=TestUser
```
Simulasi gift tanpa koneksi TikTok Live (untuk testing).

---

## 📺 Link Interface

- **Dashboard:** http://localhost:3000/dashboard.html
- **Overlay:** http://localhost:3000/overlay.html  
- **Test Page:** http://localhost:3000/

---

## 🎁 Gift yang Didukung

| Gift Name | Gift ID | Type |
|-----------|---------|------|
| Rose 🌹 | 5655 | `rose` |
| TikTok / Finger Heart ❤️ | 5269 | `finger_heart` |

Hanya gift yang sesuai dengan `activeGiftType` yang akan menambah waktu.

---

## ⚡ Logika Auto-Detect

1. Server terhubung ke TikTok Live via WebSocket
2. Setiap ada gift yang masuk, server cek:
   - Apakah gift = activeGiftType? (Rose atau Finger Heart)
   - Jika YA: Tambah waktu +5s per gift
   - Jika TIDAK: Diabaikan
3. Info gifter (username, avatar) otomatis update di overlay
4. Timer langsung sync ke semua client yang polling `/status`

---

## 🔍 Troubleshooting

### **Error: Gagal terhubung ke TikTok Live**

**Kemungkinan:**
1. Username salah atau typo
2. Username tidak sedang LIVE
3. Live bersifat private/terbatas
4. Rate limit dari TikTok

**Solusi:**
- Pastikan username **PERSIS** seperti di TikTok
- Pastikan akun sedang **LIVE** (bisa diakses publik)
- Tunggu beberapa menit lalu coba lagi
- Cek console server untuk detail error

### **Gift tidak terdeteksi**

**Kemungkinan:**
1. Gift type tidak sesuai activeGiftType
2. Gift bukan Rose atau Finger Heart

**Solusi:**
- Cek active gift type: `curl http://localhost:3000/status`
- Pastikan viewer kirim gift yang sesuai (Rose atau Finger Heart)
- Lihat log server, ada info "🎁 Gift dari @username: ..."

### **Server terputus tiba-tiba**

TikTok kadang disconnect otomatis (rate limit, network issue).

**Solusi:**
- Reconnect: `curl "http://localhost:3000/connect-tiktok?username=NAMA"`

---

## 📝 Console Log Example

```
🚀 Server listening on port 3000
🌐 URL: http://localhost:3000
📺 Overlay: http://localhost:3000/overlay.html
🎮 Dashboard: http://localhost:3000/dashboard.html
⚠️ TikTok integration disabled.
💡 Set ENABLE_TIKTOK=true and TIKTOK_USERNAME=<username> untuk auto-connect
💡 Atau akses: http://localhost:3000/connect-tiktok?username=<username>

🔗 Mencoba koneksi ke TikTok Live: @siscaa_x...
✅ Terhubung ke TikTok Live @siscaa_x
👥 Room ID: 7123456789

💬 user123: halo kak!
❤️ user456 mengirim 5 like
🎁 Gift dari @johndoe: Rose (x1)
⏱️ Timer +5s (Total: 35s)
🎁 Gift dari @janedoe: Rose (x3)
⏱️ Timer +15s (Total: 50s)
```

---

## 🚀 Deploy ke Production

Saat deploy ke **Render** atau platform lain:

1. Set environment variables:
   ```
   ENABLE_TIKTOK=true
   TIKTOK_USERNAME=your_tiktok_username
   PORT=3000
   ```

2. Script start di package.json sudah update:
   ```json
   {
     "scripts": {
       "start": "node server-tiktok.js"
     }
   }
   ```

3. Push ke GitHub dan deploy!

---

## 🎯 Tips

- **Test dulu dengan `/simulate-gift`** sebelum koneksi ke TikTok Live
- Gunakan **Dashboard** untuk kontrol gift type secara real-time
- Monitor **console log** untuk lihat gift yang masuk
- Pastikan akun TikTok yang di-monitor sedang **LIVE dan PUBLIC**

---

## 📞 Need Help?

Jika ada masalah, cek:
1. Console log server (window PowerShell)
2. Browser console (F12) di overlay/dashboard
3. Endpoint `/status` untuk lihat state server

---

**Selamat mencoba! 🎉**
