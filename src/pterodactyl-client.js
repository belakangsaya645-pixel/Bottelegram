// Pterodactyl client with mock fallback
const axios = require('axios');
const config = require('./config');

const hasPtero = !!(config.pterodactyl.url && config.pterodactyl.apiKey);

const client = hasPtero ? axios.create({
  baseURL: config.pterodactyl.url.replace(/\/+$/, '') + '/api/application',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.pterodactyl.apiKey}`,
    Accept: 'application/json'
  },
  timeout: 20000
}) : null;

async function createServer({ name, planCode }) {
  if (!hasPtero) {
    // return mocked server info
    const id = `mock-${Date.now()}`;
    const username = `u${Math.random().toString(36).slice(2,8)}`;
    const password = Math.random().toString(36).slice(2,10);
    const panelUrl = config.pterodactyl.url || 'https://panel.example.com';
    return {
      mock: true,
      id,
      name,
      username,
      password,
      panelUrl,
      planCode
    };
  }

  // Real Pterodactyl create server payload - adjust fields to your panel
  const plan = config.plans[planCode] || { memoryMB: 1024, diskMB: 10240, cpu: 100 };
  const payload = {
    name,
    user: 1, // change to proper pterodactyl user UUID/id if needed
    egg: parseInt(config.pterodactyl.eggId) || undefined,
    docker_image: undefined,
    env: {},
    memory: plan.unlimited ? 0 : plan.memoryMB,
    swap: 0,
    disk: plan.unlimited ? 0 : plan.diskMB,
    io: 500,
    cpu: plan.unlimited ? 0 : plan.cpu,
    allocation: config.pterodactyl.allocationId ? [parseInt(config.pterodactyl.allocationId)] : [],
    feature_limits: {}
  };

  try {
    const res = await client.post('/servers', payload);
    return res.data;
  } catch (err) {
    if (err.response) {
      throw new Error(`Pterodactyl error: ${err.response.status} ${JSON.stringify(err.response.data)}`);
    }
    throw err;
  }
}

module.exports = { createServer, hasPtero };
