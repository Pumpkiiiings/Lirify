// src/storage/config.js
const DEFAULT_CONFIG = {
  proxyPort: 25565,
  overlayPort: 25580,
  targetHost: 'mc.hypixel.net',
  targetPort: 25565,
  servers: {
    hypixel: { host: 'mc.hypixel.net', port: 25565 }
  }
};

module.exports = { DEFAULT_CONFIG };