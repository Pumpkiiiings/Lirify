module.exports = (api) => {
  api.metadata({
    name: 'item-alerts',
    displayName: 'Item Alerts',
    prefix: '§6Alerts',
    version: '1.0.0',
    apiVersion: '^1.0.0',
    author: 'Lirify',
    description: 'Detects what items other players are holding or wearing (like Raven B+).'
  });

  api.configSchema([
    {
      label: 'General',
      settings: [
        { key: 'enabled', type: 'toggle', description: 'Enable item alerts' },
        { key: 'chatAlerts', type: 'toggle', description: 'Show alerts in chat' },
        { key: 'hudAlerts', type: 'toggle', description: 'Show alerts in HUD' }
      ],
      defaults: { enabled: true, chatAlerts: true, hudAlerts: true }
    }
  ]);

  // blockId mapping based on standard 1.8.9 IDs
  const ITEM_MAP = {
    303: { name: 'Chainmail Armor', color: '§f' }, // chainmail_leggings
    307: { name: 'Iron Armor', color: '§f' },      // iron_leggings
    311: { name: 'Diamond Armor', color: '§b' },   // diamond_leggings
    267: { name: 'Iron Sword', color: '§f' },      // iron_sword
    276: { name: 'Diamond Sword', color: '§b' },   // diamond_sword
    278: { name: 'Diamond Pickaxe', color: '§b' }, // diamond_pickaxe
    368: { name: 'Ender Pearl', color: '§3' },     // ender_pearl
    344: { name: 'Bridge Egg', color: '§e' },      // egg
    385: { name: 'Fireball', color: '§6' },        // fire_charge
    261: { name: 'Bow', color: '§2' },             // bow
    49:  { name: 'Obsidian', color: '§5' },        // obsidian
    46:  { name: 'TNT', color: '§c' },             // tnt
    373: { name: 'Potion', color: '§d' }           // potion
  };

  // We keep track of the last alerted item so we don't spam
  const lastAlerts = new Map(); // entityId_slot -> blockId

  // HUD Widget Registration
  api.overlay.registerWidget('item_alerts_hud', {
    position: 'top-left',
    html: `<div id="alerts-container" style="display:flex; flex-direction:column; gap:4px; font-size:14px; text-shadow: 1px 1px 0 #000;"></div>`,
    css: `
      #alerts-container { font-family: 'Minecraft', sans-serif; }
      .alert-item { color: #fff; background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 3px; animation: fadeout 3s forwards; }
      @keyframes fadeout {
        0% { opacity: 1; }
        80% { opacity: 1; }
        100% { opacity: 0; display: none; }
      }
    `
  });

  function triggerAlert(entity, slot, blockId) {
    if (!api.config.get('enabled')) return;
    if (!entity || entity.type !== 'player') return;
    if (slot !== 0 && slot !== 2) return;

    const knownItem = ITEM_MAP[blockId];
    if (!knownItem) return;

    const entityId = entity.entityId;

    // Prevent spamming the same item for the same player/slot
    const cacheKey = `${entityId}_${slot}`;
    if (lastAlerts.get(cacheKey) === blockId) return;
    lastAlerts.set(cacheKey, blockId);

    // Format the alert
    let playerName = entity.name;
    const playerObj = api.players.find(p => p.entityId === entityId || (entity.uuid && p.uuid === entity.uuid));
    if (!playerName && playerObj && playerObj.name) {
        playerName = playerObj.name;
    }
    if (!playerName && entity.uuid) {
        const playerInfo = api.getPlayerInfo(entity.uuid);
        if (playerInfo && playerInfo.name) {
            playerName = playerInfo.name;
        } else {
            playerName = api.getPlayerName(entity.uuid);
        }
    }
    playerName = playerName || 'Unknown Player';

    const action = slot === 0 ? 'is holding' : 'equipped';
    const currentPlayer = api.getCurrentPlayer();
    let distance = '?';
    if (currentPlayer && currentPlayer.position && entity.position) {
        distance = Math.floor(api.calculateDistance(currentPlayer.position, entity.position));
    }

    const chatMsg = `§8[§6Lirify§8] §eAlert: §c${playerName} §7${action} ${knownItem.color}${knownItem.name} §7(§d${distance}m§7)`;
    const hudMsg = `<span style="color:#ff5555">${playerName}</span> <span style="color:#aaaaaa">has</span> <span style="color:${getColorHex(knownItem.color)}">${knownItem.name}</span>`;

    if (api.config.get('chatAlerts')) {
      api.chat(chatMsg);
    }

    if (api.config.get('hudAlerts')) {
      const alertId = 'alert_' + Date.now() + Math.random().toString(36).substr(2, 5);
      api.overlay.updateWidget('item_alerts_hud', {
        html: `
          <div id="${alertId}" class="alert-item">${hudMsg}</div>
          <script>
            setTimeout(() => {
              const el = document.getElementById('${alertId}');
              if (el) el.remove();
            }, 3000);
          </script>
        `,
        append: true
      });
    }
  }

  // Track equipment packets from the server
  api.on('entity_equipment', (data) => {
    const { entity, slot, item } = data;
    if (!item || item.blockId === -1) return;
    triggerAlert(entity, slot, item.blockId);
  });

  // Track when a player spawns already holding an item
  api.on('named_entity_spawn', (data) => {
    const entity = data.player;
    if (entity && entity.currentItem !== undefined && entity.currentItem !== 0) {
      // currentItem is the blockId in 1.8.9 named_entity_spawn
      triggerAlert(entity, 0, entity.currentItem);
    }
  });

  // Cleanup on disable
  return {
    disable() {
      api.overlay.removeWidget('item_alerts_hud');
    }
  };
};

function getColorHex(mcColor) {
  const map = {
    '§f': '#ffffff', '§b': '#55ffff', '§3': '#00aaaa',
    '§e': '#ffff55', '§6': '#ffaa00', '§2': '#00aa00',
    '§5': '#aa00aa', '§c': '#ff5555', '§d': '#ff55ff'
  };
  return map[mcColor] || '#ffffff';
}
