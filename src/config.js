// Central config (reads .env)
require('dotenv').config();

module.exports = {
  app: {
    name: process.env.APP_NAME || 'OFFC',
    version: process.env.APP_VERSION || '1.0',
    developer: process.env.DEVELOPER_NAME || 'OFFC DEVELOPR',
    domain: process.env.APP_DOMAIN || 'https://panel.example.com'
  },

  whatsapp: {
    ownerNumber: process.env.WA_OWNER || '+0000000000',
    botNumber: process.env.WA_BOT || '+0000000000',
    botName: process.env.WA_BOT_NAME || 'OFFC'
  },

  pterodactyl: {
    url: process.env.PTERO_URL || '',
    apiKey: process.env.PTERO_API_KEY || '',
    node: process.env.PTERO_NODE || '',
    eggId: process.env.PTERO_EGG_ID || '',
    allocationId: process.env.PTERO_ALLOC_ID || ''
  },

  plans: {
    '1gb': { code: '1gb', label: '1GB', memoryMB: 1024, diskMB: 10240, cpu: 100 },
    '2gb': { code: '2gb', label: '2GB', memoryMB: 2048, diskMB: 20480, cpu: 200 },
    'unli': { code: 'unli', label: 'UNLIMITED', unlimited: true }
  },

  storage: {
    galleryPath: process.env.GALLERY_PATH || './data/gallery'
  },

  server: {
    port: parseInt(process.env.PORT || '3000', 10)
  }
};
