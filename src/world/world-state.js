// src/world/world-state.js
// Central world state manager. Feeds EntityTracker and ChunkManager
// from server packets. Also tracks time, weather, dimension.

const EntityTracker = require('./entity-tracker');
const ChunkManager  = require('./chunk-manager');

class WorldState {
  constructor() {
    this.entities = new EntityTracker();
    this.chunks   = new ChunkManager();

    this.time      = 0;
    this.worldAge  = 0;
    this.weather   = 'clear';   // 'clear' | 'rain' | 'thunder'
    this.dimension = 0;         // -1 = nether, 0 = overworld, 1 = end
  }

  // ──────────────────────────────
  // Called by the packet handler on every server packet
  // ──────────────────────────────
  handleServerPacket(name, data) {
    switch (name) {
      // ── World/Dimension ──
      case 'login':
        this.dimension = data.dimension;
        this.entities.clear();
        this.chunks.clear();
        break;

      case 'respawn':
        this.dimension = data.dimension;
        this.entities.clear();
        this.chunks.clear();
        break;

      case 'update_time':
        this.worldAge = data.age;
        this.time     = data.time;
        break;

      case 'game_state_change':
        // reason 1 = end raining, 2 = begin raining, 3 = change game mode,
        // 7 = fade value (thunder), 8 = fade time
        if (data.reason === 1) this.weather = 'clear';
        if (data.reason === 2) this.weather = 'rain';
        break;

      // ── Chunks ──
      case 'map_chunk':
        if (data.chunkX !== undefined) {
          this.chunks.setChunk(
            data.chunkX, data.chunkZ,
            data.bitMap,
            data.chunkData
          );
        }
        break;

      case 'map_chunk_bulk':
        if (data.meta && data.data) {
          let offset = 0;
          for (const meta of data.meta) {
            const size = this._chunkDataSize(meta.bitMap);
            const chunkData = data.data.slice(offset, offset + size);
            this.chunks.setChunk(meta.x, meta.z, meta.bitMap, chunkData);
            offset += size;
          }
        }
        break;

      case 'block_change':
        if (data.location) {
          this.chunks.setBlock(
            data.location.x, data.location.y, data.location.z,
            data.type
          );
        }
        break;

      case 'multi_block_change':
        this.chunks.setBlocks(data.chunkX, data.chunkZ, data.records || []);
        break;

      case 'unload_chunk':
        this.chunks.unloadChunk(data.chunkX, data.chunkZ);
        break;

      // ── Entities ──
      case 'named_entity_spawn':
        this.entities.handleNamedEntitySpawn(data);
        break;

      case 'spawn_entity':
        this.entities.handleSpawnEntity(data);
        break;

      case 'spawn_entity_living':
        this.entities.handleSpawnEntityLiving(data);
        break;

      case 'spawn_entity_experience_orb':
        this.entities.handleSpawnExperienceOrb(data);
        break;

      case 'entity_destroy':
        this.entities.handleEntityDestroy(data);
        break;

      case 'entity_teleport':
        this.entities.handleEntityTeleport(data);
        break;

      case 'rel_entity_move':
        this.entities.handleRelEntityMove(data);
        break;

      case 'entity_move_look':
        this.entities.handleEntityMoveLook(data);
        break;

      case 'entity_look':
        this.entities.handleEntityLook(data);
        break;

      case 'entity_metadata':
        this.entities.handleEntityMetadata(data);
        break;

      case 'entity_equipment':
        this.entities.handleEntityEquipment(data);
        break;

      case 'entity_effect':
        this.entities.handleEntityEffect(data);
        break;

      case 'remove_entity_effect':
        this.entities.handleRemoveEntityEffect(data);
        break;
    }
  }

  // ──────────────────────────────
  // Public query API
  // ──────────────────────────────

  /** Get block at world coords. Returns { id, meta } or null */
  getBlock(x, y, z) {
    return this.chunks.getBlock(Math.floor(x), Math.floor(y), Math.floor(z));
  }

  /** Check if a chunk is loaded */
  hasChunk(chunkX, chunkZ) {
    return this.chunks.hasChunk(chunkX, chunkZ);
  }

  /** All loaded chunk coordinates */
  getLoadedChunks() {
    return this.chunks.getLoadedChunks();
  }

  /** All tracked entities */
  getAllEntities() {
    return this.entities.getAll();
  }

  /** Entity by numeric ID */
  getEntityById(id) {
    return this.entities.getById(id);
  }

  /** Entity by UUID string */
  getEntityByUUID(uuid) {
    return this.entities.getByUUID(uuid);
  }

  /** Entities within a radius (3D) */
  getEntitiesNearby(x, y, z, radius) {
    return this.entities.getNearby(x, y, z, radius);
  }

  /** Only player-type entities */
  getTrackedPlayers() {
    return this.entities.getPlayers();
  }

  /** Current world time (ticks, 0-24000) */
  getTime() {
    return this.time;
  }

  /** Current weather string */
  getWeather() {
    return this.weather;
  }

  /** Current dimension: -1 nether, 0 overworld, 1 end */
  getDimension() {
    return this.dimension;
  }

  // ──────────────────────────────
  // Helpers
  // ──────────────────────────────

  /** Calculate the byte size of chunk data for a given primary bit mask */
  _chunkDataSize(bitMap) {
    let sectionCount = 0;
    for (let i = 0; i < 16; i++) {
      if (bitMap & (1 << i)) sectionCount++;
    }
    // Each section: 4096 block IDs + 2048 metadata + 2048 block light + 2048 sky light
    return sectionCount * (4096 + 2048 + 2048 + 2048);
  }
}

module.exports = WorldState;
