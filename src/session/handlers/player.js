function stripColorCodes(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/§./g, '');
}

class PlayerHandler {
    constructor(gameState) {
        this.gameState = gameState;
    }

    handlePlayerInfo(data) {
        if (!data.data || !Array.isArray(data.data)) return;
        
        for (const player of data.data) {
            const action = data.action;
            const uuid = player.uuid || player.UUID;
            if (!uuid) continue;

            switch (action) {
                case 0:
                case 'add_player':
                    this.gameState.playerInfo.set(uuid, {
                        name: stripColorCodes(player.name),
                        properties: player.properties || [],
                        gamemode: player.gamemode,
                        ping: player.ping,
                        displayName: player.displayName
                    });
                    const strippedName = stripColorCodes(player.name);
                    this.gameState.uuidToName.set(uuid, strippedName);
                    
                    // Retroactively update spawned entities
                    const entityId = this.gameState.uuidToEntityId.get(uuid);
                    if (entityId) {
                        const entity = this.gameState.entities.get(entityId);
                        if (entity && (!entity.name || entity.name === 'Unknown Player')) {
                            entity.name = strippedName;
                        }
                    }
                    break;
                case 1:
                case 'update_game_mode':
                    const existing = this.gameState.playerInfo.get(uuid);
                    if (existing) existing.gamemode = player.gamemode;
                    break;
                case 2:
                case 'update_latency':
                    const info = this.gameState.playerInfo.get(uuid);
                    if (info) info.ping = player.ping;
                    break;
                case 3:
                case 'update_display_name':
                    const p = this.gameState.playerInfo.get(uuid);
                    if (p) p.displayName = player.displayName;
                    break;
                case 4:
                case 'remove_player':
                    this.gameState.playerInfo.delete(uuid);
                    break;
            }
        }
    }

    handleLogin(data) {
        this.gameState.loginPacket = data;
        this.gameState.gameMode = data.gameMode;
    }

    handleRespawn(data) {
        this.gameState.worldReset();
        this.gameState.gameMode = data.gameMode;
    }

    handleUpdateHealth(data) {
        this.gameState.health = data.health;
        this.gameState.food = data.food;
        this.gameState.saturation = data.foodSaturation;
    }

    handleExperience(data) {
        this.gameState.experience = {
            progress: data.experienceBar,
            level: data.level,
            total: data.totalExperience
        };
    }

    handleGameStateChange(data) {
        if (data.reason === 3) {
            this.gameState.gameMode = data.gameMode;
        }
    }
}

module.exports = PlayerHandler;