// src/utils/paths.js
const path = require('path');
const os = require('os');

function getBaseDir() {
  if (process.pkg) {
    // Si se ejecuta como .exe compilado, crea la carpeta en el Escritorio
    return path.join(os.homedir(), 'Desktop', 'Lirify');
  }
  
  // Durante el desarrollo local, usa la carpeta del proyecto
  return path.resolve(__dirname, '..', '..');
}

function getConfigDir()       { return path.join(getBaseDir(), 'config'); }
function getPluginConfigDir() { return path.join(getBaseDir(), 'config', 'plugins'); }
function getPluginDataDir()   { return path.join(getBaseDir(), 'data'); }
function getAuthCacheDir()    { return path.join(getBaseDir(), 'auth_cache'); }
function getPluginsDir()      { return path.join(getBaseDir(), 'plugins'); }

module.exports = {
  getBaseDir,
  getConfigDir,
  getPluginConfigDir,
  getPluginDataDir,
  getAuthCacheDir,
  getPluginsDir
};
