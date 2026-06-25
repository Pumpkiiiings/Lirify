// src/utils/paths.js
const path = require('path');
const os = require('os');

function getBaseDir() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    return process.env.PORTABLE_EXECUTABLE_DIR;
  }
  if (process.pkg) {
    return path.dirname(process.execPath);
  }
  const resolved = path.resolve(__dirname, '..', '..');
  // If we are inside an ASAR, fallback to a writable user directory
  if (resolved.includes('app.asar')) {
    return path.join(os.homedir(), 'LirifyProxy');
  }
  return resolved;
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
