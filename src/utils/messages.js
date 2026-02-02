// Pesan template (Bahasa Indonesia)
const config = require('../config');

function welcomeText() {
  return `Selamat datang di ${config.app.name} (v${config.app.version})
Developer: ${config.app.developer}
Bot: ${config.whatsapp.botName}

Ketik MENU untuk melihat layanan.`;
}

function mainMenu() {
  return `MENU UTAMA:
1. Create Panel
2. Galeri
3. Store
4. Download
5. Grup
Ketik nomor atau kata (contoh: Create Panel) untuk memilih.`;
}

function ownerMenu() {
  return `MENU OWNER:
- add owner <nomor>
- add reseller <nomor> <level>
- addprem <nomor>
- list srv
- del srv <id>
(Perintah hanya bisa dari nomor owner)`;
}

module.exports = { welcomeText, mainMenu, ownerMenu };
