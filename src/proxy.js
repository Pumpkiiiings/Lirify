// src/proxy.js — Lirify Proxy Core

const mc = require('minecraft-protocol');
const path = require('path');
const fs = require('fs');
const { PlayerSession } = require('./session');
const { CommandHandler } = require('./commands');
const PluginAPI = require('./plugin-api');
const { Storage } = require('./storage');
const OverlayServer = require('./overlay/overlay-server');
const WorldState = require('./world/world-state');
const { getBaseDir } = require('./utils/paths');
const packageJson = require('../package.json');

const LIRIFY_VERSION = packageJson.version;
const PROXY_PORT = 25565;
const PROXY_PREFIX = '§6Lirify §7Proxy§r';

class LirifyProxy {
  constructor() {
    this.PROXY_PREFIX = PROXY_PREFIX;

    // Storage & config
    this.storage = new Storage();
    this.config  = this.storage.loadConfig();

    // World state reconstruction (NEW)
    this.worldState = new WorldState();

    // Overlay WebSocket server (NEW)
    this.overlayServer = new OverlayServer(
      this.config.overlayPort || 25580
    );
    this.overlayServer.start();

    // Plugin API & commands
    this.pluginAPI      = new PluginAPI(this, null);
    this.commandHandler = new CommandHandler(this);

    this.server        = null;
    this.currentPlayer = null;
    this.loginAttempts = new Map();

    this.initializeProxy().catch(console.error);
  }

  getBaseDir() { return getBaseDir(); }
  getLirifyVersion() { return LIRIFY_VERSION; }

  async initializeProxy() {
    this._registerCoreCommands();
    await this.pluginAPI.loadPlugins();
    this._createServer();
  }

  _createServer() {
    this.server = mc.createServer({
      'online-mode': true,
      version: false,          // ← Multi-version: auto-detect client version
      port: this.config.proxyPort || PROXY_PORT,
      keepAlive: false,
      motd: this._generateMOTD(),
      maxPlayers: 1,
    });

    this.server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n[Lirify] ERROR: Port ${err.port || this.config.proxyPort || PROXY_PORT} is already in use.`);
        console.error(`[Lirify] Is another instance of Lirify or Minecraft server running?`);
        process.exit(1);
      } else {
        console.error(`[Lirify] Server error: ${err.message}`);
      }
    });

    this.server.on('login', (client) => this._handleLogin(client));
    this.server.on('listening', () => {
      console.log(`[Lirify] Proxy listening on port ${this.config.proxyPort || PROXY_PORT}`);
      console.log(`[Lirify] Target: ${this._getTargetDisplay()}`);
      console.log(`[Lirify] API version: ${require('./utils/version-utils').VersionUtils.getAPIVersion()}`);
    });
  }

  _handleLogin(client) {
    if (this.currentPlayer) {
      client.end('§cProxy is already in use.');
      return;
    }
    if (this._checkRateLimit(client.username)) {
      client.end('§cPlease wait before reconnecting (Microsoft rate limit).');
      return;
    }

    client.on('end', () => {
      if (this.currentPlayer) {
        this.currentPlayer.disconnect('Client disconnected.');
        this.currentPlayer = null;
      }
    });

    client.on('error', (err) => {
      if (this.currentPlayer) {
        this.currentPlayer.disconnect(`Client error: ${err.message}`);
        this.currentPlayer = null;
      }
    });

    this.currentPlayer = new PlayerSession(this, client);
  }

  _checkRateLimit(username) {
    const now = Date.now();
    const attempts = this.loginAttempts.get(username) || { count: 0, lastAttempt: 0 };
    if (now - attempts.lastAttempt > 20000) attempts.count = 0;
    if (attempts.count >= 2 && now - attempts.lastAttempt < 20000) return true;
    attempts.count++;
    attempts.lastAttempt = now;
    this.loginAttempts.set(username, attempts);
    return false;
  }

  _registerCoreCommands() {
    this.commandHandler.register('proxy', (registry) => {
      const { command } = registry;

      command('server')
        .description('List and switch servers')
        .argument('target', { optional: true })
        .handler((ctx) => this._handleServerCommand(ctx));

      command('addserver')
        .description('Add a server to the list')
        .argument('name')
        .argument('hostport')
        .handler((ctx) => this._handleAddServerCommand(ctx));

      command('removeserver')
        .description('Remove a server from the list')
        .argument('name')
        .handler((ctx) => this._handleRemoveServerCommand(ctx));

      command('reauth')
        .description('Force re-authentication')
        .handler((ctx) => this._handleReauthCommand(ctx));

      command('plugins')
        .description('List loaded plugins')
        .handler((ctx) => this._handlePluginsCommand(ctx));

      command('world')
        .description('Show world state info')
        .handler((ctx) => this._handleWorldInfoCommand(ctx));
    });
  }

  // ── Command handlers ──

  _handleServerCommand(ctx) {
    if (!ctx.args.target) {
      const chat = ctx.createChat();
      chat.text('--- Available Servers ---', ctx.THEME.primary).newline();
      chat.text('Current: ', ctx.THEME.secondary)
          .text(this._getTargetDisplay(), ctx.THEME.success).newline().newline();
      Object.entries(this.config.servers).forEach(([name, server]) => {
        chat.button(`[${name}]`, `/proxy server ${name}`, `Switch to ${name}`, 'run_command', ctx.THEME.accent)
            .space().text(`${server.host}:${server.port}`, ctx.THEME.muted).newline();
      });
      chat.send();
    } else {
      this.switchServer(ctx.args.target, ctx);
    }
  }

  _handleAddServerCommand(ctx) {
    const { name, hostport } = ctx.args;
    if (!name || !hostport) return ctx.sendError('Usage: /proxy addserver <name> <host[:port]>');
    const [host, portStr] = hostport.split(':');
    const port = parseInt(portStr) || 25565;
    this.config.servers[name] = { host, port };
    this.storage.saveConfig(this.config);
    ctx.sendSuccess(`Added server '${name}' → ${host}:${port}`);
  }

  _handleRemoveServerCommand(ctx) {
    const { name } = ctx.args;
    if (!this.config.servers[name]) return ctx.sendError(`Server '${name}' not found`);
    delete this.config.servers[name];
    this.storage.saveConfig(this.config);
    ctx.sendSuccess(`Removed '${name}'`);
  }

  _handleReauthCommand(ctx) {
    if (!this.currentPlayer) return ctx.sendError('Not connected to a server');
    const authPath = path.join(this.storage.getAuthCacheDir(), this.currentPlayer.username);
    if (fs.existsSync(authPath)) fs.rmSync(authPath, { recursive: true, force: true });
    this.currentPlayer.forceReauth = true;
    ctx.sendSuccess('Auth cache cleared. Reconnect to re-authenticate.');
  }

  _handlePluginsCommand(ctx) {
    const plugins = this.pluginAPI.getLoadedPlugins();
    if (plugins.length === 0) return ctx.send('§7No plugins loaded.');
    const chat = ctx.createChat();
    chat.text('Loaded Plugins', ctx.THEME.primary).newline();
    plugins.forEach(p => {
      const status  = p.enabled ? '§aEnabled' : '§cDisabled';
      const apiVer  = p.apiVersion ? ` §7(API ${p.apiVersion})` : '';
      chat.text(`§7• `, ctx.THEME.muted)
          .text(p.displayName, ctx.THEME.secondary)
          .text(` v${p.version}${apiVer} `, ctx.THEME.muted)
          .text(status).newline();
    });
    chat.send();
  }

  _handleWorldInfoCommand(ctx) {
    const ws = this.worldState;
    const chat = ctx.createChat();
    chat.text('World State', ctx.THEME.primary).newline();
    chat.text(`§7Dimension: §f${ws.getDimension()}`, ctx.THEME.muted).newline();
    chat.text(`§7Time: §f${ws.getTime()}`, ctx.THEME.muted).newline();
    chat.text(`§7Weather: §f${ws.getWeather()}`, ctx.THEME.muted).newline();
    chat.text(`§7Loaded chunks: §f${ws.getLoadedChunks().length}`, ctx.THEME.muted).newline();
    chat.text(`§7Tracked entities: §f${ws.getAllEntities().length}`, ctx.THEME.muted).newline();
    chat.send();
  }

  switchServer(target, ctx = null) {
    const info = this.config.servers[target]
      || (() => { const [h, p] = target.split(':'); return { host: h, port: parseInt(p) || 25565 }; })();

    this.config.targetHost = info.host;
    this.config.targetPort = info.port;
    this.storage.saveConfig(this.config);
    this.server.motd = this._generateMOTD();

    if (ctx) ctx.sendSuccess(`Switched to ${target}. Reconnect to apply.`);
    this.kickPlayer(`§aSwitched to ${target}. Please reconnect.`);
  }

  _generateMOTD() {
    const pluginCount = this.pluginAPI.getLoadedPlugins().length;
    return `${PROXY_PREFIX} §8v${LIRIFY_VERSION}§r §8| ${pluginCount} plugin(s)\n§7→ §e${this._getTargetDisplay()}`;
  }

  _getTargetDisplay() {
    const port = this.config.targetPort || 25565;
    return port === 25565 ? this.config.targetHost : `${this.config.targetHost}:${port}`;
  }

  sendMessage(client, message) {
    if (!client || client.state !== mc.states.PLAY) return;
    try {
      const isJson = typeof message === 'string' && message.trim().startsWith('{');
      client.write('chat', {
        message: isJson ? message : JSON.stringify({ text: message }),
        position: 0,
        sender: '0'
      });
    } catch (e) {
      console.error('[Lirify] Failed to send message:', e.message);
    }
  }

  kickPlayer(reason = 'Disconnected') {
    if (this.currentPlayer) this.currentPlayer.disconnect(reason);
  }

  clearSession() {
    this.currentPlayer = null;
  }
}

new LirifyProxy();
