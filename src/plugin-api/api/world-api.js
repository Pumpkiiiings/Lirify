// src/plugin-api/api/world-api.js
// Plugin-facing world API. Wraps WorldState for plugins.

class WorldAPI {
  constructor(proxy) {
    this.proxy = proxy;
  }

  get _state() {
    return this.proxy.worldState;
  }

  // ── Blocks ──

  /**
   * Get the block at world coordinates.
   * @returns {{ id: number, meta: number } | null} null if chunk not loaded
   */
  getBlock(x, y, z) {
    if (!this._state) return null;
    return this._state.getBlock(x, y, z);
  }

  /** Check if a chunk is loaded */
  hasChunk(chunkX, chunkZ) {
    if (!this._state) return false;
    return this._state.hasChunk(chunkX, chunkZ);
  }

  /** Get all loaded chunk coordinates */
  getLoadedChunks() {
    if (!this._state) return [];
    return this._state.getLoadedChunks();
  }

  // ── Entities ──

  /** Get all tracked entities */
  getAllEntities() {
    if (!this._state) return [];
    return this._state.getAllEntities();
  }

  /** Get entity by numeric entity ID */
  getEntityById(id) {
    if (!this._state) return null;
    return this._state.getEntityById(id);
  }

  /** Get entity by UUID */
  getEntityByUUID(uuid) {
    if (!this._state) return null;
    return this._state.getEntityByUUID(uuid);
  }

  /**
   * Get all entities within a radius of a position.
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @param {number} radius - in blocks
   */
  getEntitiesNearby(x, y, z, radius) {
    if (!this._state) return [];
    return this._state.getEntitiesNearby(x, y, z, radius);
  }

  /** Get only player-type entities */
  getTrackedPlayers() {
    if (!this._state) return [];
    return this._state.getTrackedPlayers();
  }

  // ── World info ──

  /** Current world time in ticks (0-24000) */
  getTime() {
    if (!this._state) return 0;
    return this._state.getTime();
  }

  /** Current weather: 'clear' | 'rain' | 'thunder' */
  getWeather() {
    if (!this._state) return 'clear';
    return this._state.getWeather();
  }

  /** Current dimension: -1 nether, 0 overworld, 1 end */
  getDimension() {
    if (!this._state) return 0;
    return this._state.getDimension();
  }

  /** Get all world info at once */
  getWorldInfo() {
    return {
      time: this.getTime(),
      weather: this.getWeather(),
      dimension: this.getDimension(),
      loadedChunks: this.getLoadedChunks().length
    };
  }
}

module.exports = WorldAPI;
