// src/overlay/overlay-server.js
// WebSocket server that runs inside the Lirify proxy.
// The Electron overlay app connects to this to receive widget events.

const WebSocket = require('ws');

class OverlayServer {
  constructor(port = 25580) {
    this.port = port;
    this.wss = null;
    this.clients = new Set();
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port, host: '127.0.0.1' });

    this.wss.on('listening', () => {
      console.log(`[Lirify] Overlay WebSocket server listening on ws://localhost:${this.port}`);
    });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      console.log('[Lirify] Overlay client connected');

      ws.on('message', (raw) => {
        try {
          const message = JSON.parse(raw.toString());
          this._handleClientMessage(ws, message);
        } catch (e) {
          // ignore malformed
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('[Lirify] Overlay client disconnected');
      });

      ws.on('error', () => {
        this.clients.delete(ws);
      });
    });

    this.wss.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[Lirify] Overlay port ${this.port} already in use — overlay disabled. Is another Lirify running?`);
      } else {
        console.error(`[Lirify] Overlay server error: ${err.message}`);
      }
    });
  }

  /**
   * Broadcast a message to all connected overlay clients.
   * @param {string} event   - e.g. 'widget:register', 'widget:update', 'widget:remove'
   * @param {object} payload - data for the event
   */
  broadcast(event, payload) {
    if (this.clients.size === 0) return;
    const message = JSON.stringify({ event, payload });
    for (const ws of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  _handleClientMessage(ws, message) {
    // Future: handle click events from interactive widgets
    // For now, just log
    if (process.env.LIRIFY_DEV) {
      console.log('[Overlay → Proxy]', message);
    }
  }

  isRunning() {
    return this.wss !== null;
  }

  stop() {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}

module.exports = OverlayServer;
