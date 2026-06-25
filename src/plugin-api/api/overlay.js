// src/plugin-api/api/overlay.js
// Plugin API module for the Lirify overlay system.
// Plugins use this to register, update, and remove HUD widgets.

class OverlayAPI {
  constructor(proxy, pluginName) {
    this.proxy = proxy;
    this.pluginName = pluginName;
    this.registeredWidgets = new Set();
  }

  get _server() {
    return this.proxy.overlayServer;
  }

  /**
   * Register a new HUD widget in the overlay.
   *
   * @param {string} id       - Unique widget ID (scoped to your plugin automatically)
   * @param {object} options
   * @param {string} options.html     - Initial HTML content of the widget
   * @param {string} [options.css]    - CSS scoped inside the widget container
   * @param {string} [options.position] - 'top-left'|'top-right'|'bottom-left'|'bottom-right'|'top-center'|'bottom-center'
   */
  registerWidget(id, options = {}) {
    const scopedId = `${this.pluginName}:${id}`;
    this.registeredWidgets.add(scopedId);

    if (this._server) {
      this._server.broadcast('widget:register', {
        id: scopedId,
        html: options.html || '',
        css: options.css || '',
        position: options.position || 'top-right'
      });
    }
  }

  /**
   * Update an existing widget's content.
   *
   * Two modes:
   *  1. { html: '...' }        → Full HTML replacement
   *  2. { key: 'value', ... }  → Update elements with data-bind="key" attributes
   *
   * @param {string} id
   * @param {object} data
   */
  updateWidget(id, data = {}) {
    const scopedId = `${this.pluginName}:${id}`;
    if (this._server) {
      this._server.broadcast('widget:update', { id: scopedId, data });
    }
  }

  /**
   * Remove a widget from the overlay.
   * @param {string} id
   */
  removeWidget(id) {
    const scopedId = `${this.pluginName}:${id}`;
    this.registeredWidgets.delete(scopedId);
    if (this._server) {
      this._server.broadcast('widget:remove', { id: scopedId });
    }
  }

  /**
   * Remove all widgets registered by this plugin.
   * Called automatically on plugin disable.
   */
  clearAll() {
    for (const scopedId of this.registeredWidgets) {
      if (this._server) {
        this._server.broadcast('widget:remove', { id: scopedId });
      }
    }
    this.registeredWidgets.clear();
  }

  /**
   * Check if the overlay is currently connected.
   */
  isConnected() {
    return this._server &&
      this._server.isRunning() &&
      this._server.clients.size > 0;
  }
}

module.exports = OverlayAPI;
