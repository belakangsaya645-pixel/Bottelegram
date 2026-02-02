// WhatsApp integration with Baileys
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode-terminal');
const baileys = require('@adiwajshing/baileys');
const { default: makeWASocket, useSingleFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;
const config = require('./config');
const { User, Order, Server } = require('./models');
const { createServer } = require('./pterodactyl-client');
const msgs = require('./utils/messages');

const authFile = path.join(__dirname, 'auth_info_multi.json');
const { state, saveState } = useSingleFileAuthState(authFile);

let sock;
const userStates = new Map(); // per-number conversation state

async function startWhatsApp() {
  const { version } = await fetchLatestBaileysVersion().catch(()=>({ version: [4, 0, 0] }));
  sock = makeWASocket({
    version,
    printQRInTerminal: false,
    auth: state,
    logger: null
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('QR code printed above — scan with WhatsApp');
    }
    if (connection === 'close') {
      const reason = (lastDisconnect && lastDisconnect.error && lastDisconnect.error.output) ? lastDisconnect.error.output.statusCode : null;
      console.log('Connection closed, reason:', reason);
      // reconnect on non-logged out
      if (lastDisconnect.error && lastDisconnect.error.output && lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut) {
        startWhatsApp();
      } else {
        console.log('Logged out from WA, delete auth and restart to login again');
      }
    } else if (connection === 'open') {
      console.log('WhatsApp connected');
    }
  });

  sock.ev.on('creds.update', saveState);

  sock.ev.on('messages.upsert', async (m) => {
    try {
      const upsert = m.messages[0];
      if (!upsert.message || upsert.key.fromMe) return;
      const sender = upsert.key.remoteJid; // either number@s.whatsapp.net or group id
      if (!sender.endsWith('@s.whatsapp.net')) {
        // group or broadcast - ignore for now
        return;
      }
      const number = sender.split('@')[0];
      const text = (upsert.message.conversation || (upsert.message.extendedTextMessage && upsert.message.extendedTextMessage.text) || '').trim();
      await handleMessage(number, text);
    } catch (e) {
      console.error('messages.upsert error', e);
    }
  });

  return sock;
}

async function sendText(number, text) {
  if (!sock) throw new Error('WA socket not initialized');
  const jid = `${number}@s.whatsapp.net`;
  await sock.sendMessage(jid, { text });
}

async function sendPanelDetails(number, details) {
  const text = `Panel siap!
Panel URL: ${details.panelUrl || config.app.domain}
Username: ${details.username}
Password: ${details.password}
Plan: ${details.planCode || 'unknown'}
Developer: ${config.app.developer}
Bot: ${config.whatsapp.botName}
Versi: ${config.app.version}`;
  await sendText(number, text);
}

async function handleMessage(number, text) {
  const lower = (text || '').toLowerCase();
  const isOwner = (number === config.whatsapp.ownerNumber.replace(/^\+/, '') || number === config.whatsapp.ownerNumber.replace('+', ''));

  // owner commands (simple parsing)
  if (isOwner && lower.startsWith('add owner')) {
    const parts = text.split(/\s+/);
    const num = parts[2];
    if (!num) return sendText(number, 'Format: add owner <nomor>');
    User.addOwner(num);
    return sendText(number, `Owner ditambahkan: ${num}`);
  }
  if (isOwner && lower.startsWith('add reseller')) {
    const parts = text.split(/\s+/);
    const num = parts[2];
    const level = parseInt(parts[3]) || 1;
    if (!num) return sendText(number, 'Format: add reseller <nomor> <level>');
    User.addReseller(num, level);
    return sendText(number, `Reseller ditambahkan: ${num} level ${level}`);
  }
  if (isOwner && lower.startsWith('addprem')) {
    const parts = text.split(/\s+/);
    const num = parts[1];
    const until = parts[2] || null;
    if (!num) return sendText(number, 'Format: addprem <nomor> <yyyy-mm-dd>');
    User.addPremium(num, until);
    return sendText(number, `Premium diberikan ke: ${num} sampai ${until || 'tidak ditentukan'}`);
  }
  if (isOwner && lower === 'list srv') {
    const servers = Server.list();
    if (!servers || servers.length === 0) return sendText(number, 'Belum ada server.');
    const lines = servers.map(s => `ID:${s.id} ptero:${s.ptero_id} owner:${s.owner_number} plan:${s.plan_code}`);
    return sendText(number, lines.join('\n'));
  }
  if (isOwner && lower.startsWith('del srv')) {
    const parts = text.split(/\s+/);
    const id = parseInt(parts[2]);
    if (!id) return sendText(number, 'Format: del srv <id>');
    Server.deleteById(id);
    return sendText(number, `Server dengan id ${id} dihapus.`);
  }

  // conversation state machine for Create Panel
  const state = userStates.get(number) || null;

  if (!text || text.length === 0) return;

  if (lower === 'menu' || lower === '/menu') {
    await sendText(number, msgs.mainMenu());
    return;
  }

  if (lower === 'welcome' || lower === 'hi' || lower === 'halo') {
    await sendText(number, msgs.welcomeText());
    return;
  }

  if (lower === 'owner menu' || lower === 'owner') {
    if (isOwner) return sendText(number, msgs.ownerMenu());
    return sendText(number, 'Perintah owner hanya untuk owner terdaftar.');
  }

  // Start Create Panel flow
  if (lower.includes('create panel') || lower === '1' || state && state.step) {
    if (!state) {
      // start flow
      userStates.set(number, { step: 'choose_plan' });
      return sendText(number, 'Pilih paket: 1) 1GB  2)
