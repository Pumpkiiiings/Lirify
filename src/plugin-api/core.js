// src/plugin-api/core.js
// Core config + logging per plugin. Ported from Starfish with hypixelSafeMode removed.

const fs = require('fs');
const path = require('path');
const { getPluginConfigDir } = require('../utils/paths');

class Core {
  constructor(proxy, metadata) {
    this.proxy = proxy;
    this.metadata = metadata;
    this.enabled = true;
    this.debug = false;
    this.configSchema = null;

    this._initializeConfig();
  }

  // ── Starfish compatibility stubs ──
  // Lirify has no "safe mode" — all plugins have equal permissions.
  isHypixelSafe(_method) { return true; }
  logHypixelBlock(_method) {}

  _initializeConfig() {
    if (!this.metadata?.path) {
      this.config = {
        get: () => ({}),
        set: () => true
      };
      return;
    }

    const configPath = path.join(getPluginConfigDir(), `${this.metadata.name}.config.json`);
    const defaultConfig = { enabled: true, debug: false };

    let config = { ...defaultConfig };
    if (fs.existsSync(configPath)) {
      try {
        const saved = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config = { ...defaultConfig, ...saved };
      } catch (e) {
        this.log(`Failed to load config: ${e.message}`);
      }
    }

    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    } catch (e) {
      this.log(`Failed to save config: ${e.message}`);
    }

    this.enabled = config.enabled;
    this.debug = config.debug;

    this.config = {
      get: (key) => {
        try {
          const current = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          return key ? this._getNestedValue(current, key) : current;
        } catch (e) {
          return key ? this._getNestedValue(defaultConfig, key) : defaultConfig;
        }
      },
      set: (key, value) => {
        try {
          const current = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          this._setNestedValue(current, key, value);
          fs.writeFileSync(configPath, JSON.stringify(current, null, 2));
          if (key === 'enabled') this.enabled = value;
          if (key === 'debug') this.debug = value;
          return true;
        } catch (e) {
          this.log(`Failed to save config: ${e.message}`);
          return false;
        }
      }
    };
  }

  _getNestedValue(obj, keyPath) {
    if (!keyPath) return obj;
    return keyPath.split('.').reduce((cur, k) =>
      (cur && typeof cur === 'object' && k in cur) ? cur[k] : undefined, obj);
  }

  _setNestedValue(obj, keyPath, value) {
    const keys = keyPath.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in cur) || typeof cur[keys[i]] !== 'object') cur[keys[i]] = {};
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
  }

  log(message) {
    const name = this.metadata?.displayName || 'Lirify';
    const ts = new Date().toLocaleTimeString();
    console.log(`[${ts}] [${name}] ${message}`);
  }

  debugLog(message) {
    if (this.config.get('debug')) {
      const name = this.metadata?.displayName || 'Lirify';
      const ts = new Date().toLocaleTimeString();
      console.log(`[${ts}] [${name}] [DEBUG] ${message}`);
    }
  }

  initializeConfig(schema) {
    this.configSchema = schema;
    if (!schema || !Array.isArray(schema)) return;

    const configPath = path.join(getPluginConfigDir(), `${this.metadata.name}.config.json`);
    const current = this.config.get();

    schema.forEach(section => {
      if (section.defaults) this._mergeDefaults(current, section.defaults);
    });

    try {
      fs.writeFileSync(configPath, JSON.stringify(current, null, 2));
    } catch (e) {
      this.log(`Failed to save config defaults: ${e.message}`);
    }
  }

  _mergeDefaults(current, defaults) {
    for (const [key, value] of Object.entries(defaults)) {
      if (!(key in current)) {
        current[key] = value;
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        if (typeof current[key] !== 'object' || !current[key]) current[key] = {};
        this._mergeDefaults(current[key], value);
      }
    }
  }

  saveCurrentConfig() {
    const current = this.config.get();
    Object.entries(current).forEach(([k, v]) => this.config.set(k, v));
    return true;
  }
}

module.exports = Core;
