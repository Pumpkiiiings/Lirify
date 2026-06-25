// src/plugin-api/events.js
// Event + packet interception system for Lirify.
// No packet restrictions — all packets are readable and interceptable.

const EventEmitter = require('events');

class Events extends EventEmitter {
  constructor(proxy, core) {
    super();
    this.proxy = proxy;
    this.core = core;
    this.eventHandlers = new Map();

    // packetInterceptors: direction → packetName → Set<handler>
    this.packetInterceptors = new Map([
      ['server', new Map()],
      ['client', new Map()]
    ]);
  }

  // ──────────────────────────────
  // High-level event subscription
  // ──────────────────────────────

  on(event, handler) {
    if (event.startsWith('packet:')) {
      return this._handlePacketEvent(event, handler, false);
    }

    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);

    return () => {
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) this.eventHandlers.delete(event);
      }
    };
  }

  intercept(event, handler) {
    if (event.startsWith('packet:')) {
      return this._handlePacketEvent(event, handler, true);
    }
    throw new Error('intercept() only supports packet events. Format: packet:direction:packetName');
  }

  everyTick(callback) {
    if (typeof callback !== 'function') throw new Error('everyTick requires a function');
    const interval = setInterval(() => {
      if (!this.core.enabled) { clearInterval(interval); return; }
      try { callback(); } catch (e) { this.core.log(`Tick error: ${e.message}`); }
    }, 50);
    return () => clearInterval(interval);
  }

  emit(event, data) {
    if (!this.core.enabled) return;
    if (!data || typeof data !== 'object') return;

    data.api = this.proxy.pluginAPI;

    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try { handler(data); } catch (e) {
          this.core.log(`Error in handler for ${event}: ${e.message}`);
        }
      }
    }
    super.emit(event, data);
  }

  // ──────────────────────────────
  // Packet event internals
  // ──────────────────────────────

  _handlePacketEvent(event, handler, canModify) {
    const parts = event.split(':');
    if (parts.length !== 3 || parts[0] !== 'packet') {
      throw new Error('Packet events must use format: packet:direction:packetName');
    }
    const [, direction, packetName] = parts;
    if (!['server', 'client'].includes(direction)) {
      throw new Error('Direction must be "server" or "client"');
    }

    const wrappedHandler = (evt) => {
      if (!canModify) {
        // Read-only view: strip modify/cancel
        handler({
          data: evt.data,
          meta: evt.meta,
          cancel: () => { throw new Error('Use api.intercept() to cancel packets'); },
          modify: () => { throw new Error('Use api.intercept() to modify packets'); }
        });
      } else {
        handler(evt);
      }
    };

    this.registerPacketInterceptor(direction, [packetName], wrappedHandler);

    return () => {
      this.unregisterPacketInterceptor(direction, [packetName], wrappedHandler);
    };
  }

  registerPacketInterceptor(direction, packetNames, handler) {
    const dirMap = this.packetInterceptors.get(direction);
    if (!dirMap) return;
    for (const name of packetNames) {
      if (!dirMap.has(name)) dirMap.set(name, new Set());
      dirMap.get(name).add(handler);
    }
  }

  unregisterPacketInterceptor(direction, packetNames, handler) {
    const dirMap = this.packetInterceptors.get(direction);
    if (!dirMap) return;
    for (const name of packetNames) {
      const set = dirMap.get(name);
      if (set) {
        set.delete(handler);
        if (set.size === 0) dirMap.delete(name);
      }
    }
  }

  hasPacketInterceptors(direction, packetName) {
    const dirMap = this.packetInterceptors.get(direction);
    return !!(dirMap && dirMap.has(packetName) && dirMap.get(packetName).size > 0);
  }

  getPacketInterceptors(direction, packetName) {
    const dirMap = this.packetInterceptors.get(direction);
    if (!dirMap || !dirMap.has(packetName)) return [];
    return Array.from(dirMap.get(packetName));
  }
}

module.exports = Events;
