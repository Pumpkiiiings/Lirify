// src/world/entity-tracker.js
// Tracks all entities visible to the player by reconstructing
// server packets: spawn, despawn, teleport, move, metadata, equipment, effects.

class EntityTracker {
  constructor() {
    this.entities = new Map(); // entityId → EntityData
    this.entityIdToUuid = new Map();
    this.uuidToEntityId = new Map();
  }

  // ──────────────────────────────
  // Packet handlers (called from WorldState)
  // ──────────────────────────────

  handleNamedEntitySpawn(data) {
    const entity = {
      id: data.entityId,
      uuid: data.playerUUID,
      type: 'player',
      name: data.playerUsername,
      x: data.x / 32,
      y: data.y / 32,
      z: data.z / 32,
      yaw: data.yaw,
      pitch: data.pitch,
      currentItem: data.currentItem,
      metadata: data.metadata || [],
      effects: new Map(),
      equipment: {}
    };
    this.entities.set(data.entityId, entity);
    if (data.playerUUID) {
      this.entityIdToUuid.set(data.entityId, data.playerUUID);
      this.uuidToEntityId.set(data.playerUUID, data.entityId);
    }
  }

  handleSpawnEntity(data) {
    const entity = {
      id: data.entityId,
      uuid: data.objectUUID,
      type: 'object',
      objectType: data.type,
      x: data.x / 32,
      y: data.y / 32,
      z: data.z / 32,
      yaw: data.yaw,
      pitch: data.pitch,
      metadata: [],
      effects: new Map(),
      equipment: {}
    };
    this.entities.set(data.entityId, entity);
  }

  handleSpawnEntityLiving(data) {
    const entity = {
      id: data.entityId,
      uuid: data.entityUUID,
      type: 'living',
      mobType: data.type,
      x: data.x / 32,
      y: data.y / 32,
      z: data.z / 32,
      yaw: data.yaw,
      pitch: data.pitch,
      headPitch: data.headPitch,
      velocityX: data.velocityX,
      velocityY: data.velocityY,
      velocityZ: data.velocityZ,
      metadata: data.metadata || [],
      effects: new Map(),
      equipment: {}
    };
    this.entities.set(data.entityId, entity);
  }

  handleSpawnExperienceOrb(data) {
    this.entities.set(data.entityId, {
      id: data.entityId,
      type: 'experience_orb',
      x: data.x / 32,
      y: data.y / 32,
      z: data.z / 32,
      count: data.count,
      metadata: [],
      effects: new Map(),
      equipment: {}
    });
  }

  handleEntityDestroy(data) {
    for (const id of data.entityIds) {
      const entity = this.entities.get(id);
      if (entity?.uuid) {
        this.entityIdToUuid.delete(id);
        this.uuidToEntityId.delete(entity.uuid);
      }
      this.entities.delete(id);
    }
  }

  handleEntityTeleport(data) {
    const entity = this.entities.get(data.entityId);
    if (!entity) return;
    entity.x = data.x / 32;
    entity.y = data.y / 32;
    entity.z = data.z / 32;
    entity.yaw = data.yaw;
    entity.pitch = data.pitch;
  }

  handleRelEntityMove(data) {
    const entity = this.entities.get(data.entityId);
    if (!entity) return;
    entity.x += data.dX / 32;
    entity.y += data.dY / 32;
    entity.z += data.dZ / 32;
  }

  handleEntityMoveLook(data) {
    const entity = this.entities.get(data.entityId);
    if (!entity) return;
    entity.x += data.dX / 32;
    entity.y += data.dY / 32;
    entity.z += data.dZ / 32;
    entity.yaw = data.yaw;
    entity.pitch = data.pitch;
  }

  handleEntityLook(data) {
    const entity = this.entities.get(data.entityId);
    if (!entity) return;
    entity.yaw = data.yaw;
    entity.pitch = data.pitch;
  }

  handleEntityMetadata(data) {
    const entity = this.entities.get(data.entityId);
    if (!entity) return;
    entity.metadata = data.metadata || entity.metadata;
  }

  handleEntityEquipment(data) {
    const entity = this.entities.get(data.entityId);
    if (!entity) return;
    entity.equipment[data.slot] = data.item;
  }

  handleEntityEffect(data) {
    const entity = this.entities.get(data.entityId);
    if (!entity) return;
    entity.effects.set(data.effectId, {
      amplifier: data.amplifier,
      duration: data.duration,
      hideParticles: data.hideParticles
    });
  }

  handleRemoveEntityEffect(data) {
    const entity = this.entities.get(data.entityId);
    if (!entity) return;
    entity.effects.delete(data.effectId);
  }

  // ──────────────────────────────
  // Query API
  // ──────────────────────────────

  getAll() {
    return Array.from(this.entities.values());
  }

  getById(entityId) {
    return this.entities.get(entityId) || null;
  }

  getByUUID(uuid) {
    const id = this.uuidToEntityId.get(uuid);
    return id !== undefined ? this.entities.get(id) || null : null;
  }

  getByType(type) {
    return Array.from(this.entities.values()).filter(e => e.type === type);
  }

  getPlayers() {
    return Array.from(this.entities.values()).filter(e => e.type === 'player');
  }

  getNearby(x, y, z, radius) {
    const r2 = radius * radius;
    return Array.from(this.entities.values()).filter(e => {
      const dx = e.x - x;
      const dy = e.y - y;
      const dz = e.z - z;
      return dx * dx + dy * dy + dz * dz <= r2;
    });
  }

  clear() {
    this.entities.clear();
    this.entityIdToUuid.clear();
    this.uuidToEntityId.clear();
  }
}

module.exports = EntityTracker;
