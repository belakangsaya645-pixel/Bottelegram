# OFFC Panel WA (Node 20+) — Scaffold lengkap

Fitur utama:
- Bot WhatsApp (Baileys) menampilkan MENU, GALERI, WELCOME
- Flow Create Panel (1GB / 2GB / UNLI) — otomatis provisioning via Pterodactyl API atau mock
- Owner commands: add owner, add reseller, addprem, list srv, del srv
- Admin HTTP endpoints (orders, servers, add-owner, add-reseller)
- Target Node.js 20+, Dockerfile disertakan

Quickstart:
1. Salin file-file project ke folder.
2. Copy `.env.example` → `.env`, isi nilai (nomor owner, PTERO API jika ada).
3. Install dependencies:
   npm install
4. Jalankan:
   npm start
5. Di terminal akan tampil QR code; scan via WhatsApp untuk login.
6. Dari nomor lain (pelanggan) kirim `MENU` untuk memulai.

Catatan:
- Jika tidak ingin pakai Baileys, kamu bisa ubah integrasi WA ke WhatsApp Business API di src/wa.js.
- Jangan commit `.env`.
- Jika mau deploy ke Pterodactyl sebagai egg/container, gunakan Dockerfile & env.

Developer: OFFC DEVELOPR | Bot: OFFC | Version: 1.0
