// src/world/chunk-manager.js
// Maintains a sparse map of loaded chunks and provides block queries.
// For MC 1.8.9 chunks: each chunk section is 16x16x16 blocks.
// Block IDs and metadata are stored compactly as (id << 4 | meta).

class ChunkManager {
  constructor() {
    // Map key: `${chunkX},${chunkZ}` → Map of `${sectionY}` → Uint16Array (4096 entries)
    this.chunks = new Map();
  }

  _key(chunkX, chunkZ) {
    return `${chunkX},${chunkZ}`;
  }

  _blockIndex(lx, ly, lz) {
    return (ly * 16 + lz) * 16 + lx;
  }

  /**
   * Store a full chunk from map_chunk packet.
   * @param {number} chunkX
   * @param {number} chunkZ
   * @param {number} primaryBitMask - bitmask of which sections are included
   * @param {Buffer}  data          - raw chunk data (block IDs + metadata)
   */
  setChunk(chunkX, chunkZ, primaryBitMask, data) {
    const key = this._key(chunkX, chunkZ);
    let sections = this.chunks.get(key);
    if (!sections) {
      sections = new Map();
      this.chunks.set(key, sections);
    }

    let offset = 0;
    for (let sectionY = 0; sectionY < 16; sectionY++) {
      if (!(primaryBitMask & (1 << sectionY))) continue;

      const blockIds = new Uint8Array(4096);
      const addData = new Uint8Array(2048); // 4 bits per block

      // Block IDs (1 byte per block = 4096 bytes)
      if (offset + 4096 > data.length) break;
      data.copy(Buffer.from(blockIds.buffer), 0, offset, offset + 4096);
      offset += 4096;

      // Metadata (4 bits per block = 2048 bytes)
      if (offset + 2048 > data.length) break;
      data.copy(Buffer.from(addData.buffer), 0, offset, offset + 2048);
      offset += 2048;

      // Skip block light (2048 bytes) + sky light (2048 bytes)
      offset += 4096;

      // Build combined Uint16Array: high byte = blockId, low nibble = meta
      const section = new Uint16Array(4096);
      for (let i = 0; i < 4096; i++) {
        const meta = (i % 2 === 0)
          ? addData[i >> 1] & 0x0F
          : (addData[i >> 1] >> 4) & 0x0F;
        section[i] = (blockIds[i] << 4) | meta;
      }
      sections.set(sectionY, section);
    }
  }

  /** Handle single block change */
  setBlock(x, y, z, typeId) {
    const chunkX = Math.floor(x / 16);
    const chunkZ = Math.floor(z / 16);
    const sectionY = Math.floor(y / 16);
    const lx = ((x % 16) + 16) % 16;
    const ly = ((y % 16) + 16) % 16;
    const lz = ((z % 16) + 16) % 16;

    const key = this._key(chunkX, chunkZ);
    const sections = this.chunks.get(key);
    if (!sections) return;

    const section = sections.get(sectionY);
    if (!section) return;

    section[this._blockIndex(lx, ly, lz)] = typeId;
  }

  /** Handle multi_block_change packet */
  setBlocks(chunkX, chunkZ, records) {
    const key = this._key(chunkX, chunkZ);
    const sections = this.chunks.get(key);
    if (!sections) return;

    for (const record of records) {
      const lx = (record.horizontalPos >> 4) & 0xF;
      const lz = record.horizontalPos & 0xF;
      const ly = record.y;
      const sectionY = Math.floor(ly / 16);
      const localY = ly % 16;

      const section = sections.get(sectionY);
      if (!section) continue;

      section[this._blockIndex(lx, localY, lz)] = record.blockId;
    }
  }

  /** Get block at world coordinates. Returns { id, meta } or null if chunk not loaded */
  getBlock(x, y, z) {
    const chunkX = Math.floor(x / 16);
    const chunkZ = Math.floor(z / 16);
    const sectionY = Math.floor(y / 16);

    const key = this._key(chunkX, chunkZ);
    const sections = this.chunks.get(key);
    if (!sections) return null;

    const section = sections.get(sectionY);
    if (!section) return { id: 0, meta: 0 }; // Air in unloaded section

    const lx = ((x % 16) + 16) % 16;
    const ly = ((y % 16) + 16) % 16;
    const lz = ((z % 16) + 16) % 16;

    const packed = section[this._blockIndex(lx, ly, lz)];
    return {
      id: packed >> 4,
      meta: packed & 0xF
    };
  }

  hasChunk(chunkX, chunkZ) {
    return this.chunks.has(this._key(chunkX, chunkZ));
  }

  unloadChunk(chunkX, chunkZ) {
    this.chunks.delete(this._key(chunkX, chunkZ));
  }

  getLoadedChunks() {
    return Array.from(this.chunks.keys()).map(key => {
      const [x, z] = key.split(',').map(Number);
      return { x, z };
    });
  }

  clear() {
    this.chunks.clear();
  }
}

module.exports = ChunkManager;
