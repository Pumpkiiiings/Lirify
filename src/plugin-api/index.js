// src/plugin-api/index.js
// Lirify Plugin API — main orchestrator.
// Adds: world state access, overlay API, semver API versioning.

const fs = require('fs');
const path = require('path');
const Core         = require('./core');
const Events       = require('./events');
const DisplayNames = require('./display-names');
const WorldAPI     = require('./api/world-api');
const OverlayAPI   = require('./api/overlay');
const { VersionUtils } = require('../utils/version-utils');
const { DependencyResolver } = require('../utils/dependency-resolver');
const { getPluginsDir, getPluginConfigDir } = require('../utils/paths');
const packageJson  = require('../../package.json');

// Import remaining Starfish API modules (unchanged)
const Players    = require('./api/player');
const Communication = require('./api/chat');
const Commands   = require('./api/command');
const World      = require('./api/world');       // Starfish world (send packets)
const Entities   = require('./api/entity');
const Inventory  = require('./api/inventory');
const Movement   = require('./api/movement');
const Misc       = require('./api/misc');
const Hypixel    = require('./api/hypixel');

const LIRIFY_VERSION = packageJson.version;

class PluginAPI {
  constructor(proxy, metadata) {
    this.proxy = proxy;
    this.metadata = metadata;
    this.loadedPlugins = [];
    this.pluginStates = new Map();
    this.pluginInstances = new Map();

    this.dependencyResolver = new DependencyResolver();

    // Shared modules
    this.core            = new Core(proxy, metadata);
    this.events          = new Events(proxy, this.core);
    this.displayNames    = new DisplayNames(proxy, this.core, this.events);
    this.playersModule   = new Players(proxy, this.core);
    this.communicationModule = new Communication(proxy, this.core);
    this.commandsModule  = new Commands(proxy, this.core);
    this.worldModule     = new World(proxy, this.core);
    this.entitiesModule  = new Entities(proxy, this.core);
    this.inventoryModule = new Inventory(proxy, this.core);
    this.movementModule  = new Movement(proxy, this.core);
    this.miscModule      = new Misc(proxy, this.core);
    this.hypixelModule   = new Hypixel(proxy, this.core);

    // Lirify additions
    this.worldAPIModule  = new WorldAPI(proxy);

    // Bind common methods
    this.on        = this.events.on.bind(this.events);
    this.emit      = this.events.emit.bind(this.events);
    this.intercept = this.events.intercept.bind(this.events);
    this.everyTick = this.events.everyTick.bind(this.events);

    // Communication (full set)
    this.chat              = this.communicationModule.chat.bind(this.communicationModule);
    this.chatInteractive   = this.communicationModule.chatInteractive?.bind(this.communicationModule) || this.communicationModule.chat.bind(this.communicationModule);
    this.sendTitle         = this.communicationModule.sendTitle.bind(this.communicationModule);
    this.sendActionBar     = this.communicationModule.sendActionBar.bind(this.communicationModule);
    this.sendTabComplete   = this.communicationModule.sendTabComplete?.bind(this.communicationModule) || (() => {});
    this.sendChatToServer  = this.communicationModule.sendChatToServer.bind(this.communicationModule);
    this.sound             = this.worldModule.sendSound.bind(this.worldModule);
    this.sendParticle      = this.worldModule.sendParticle.bind(this.worldModule);

    // Misc
    this.kick              = this.miscModule.kick.bind(this.miscModule);
    this.sendKeepAlive     = this.miscModule.sendKeepAlive.bind(this.miscModule);
    this.sendCustomPayload = this.miscModule.sendCustomPayload.bind(this.miscModule);
    this.sendLogin         = this.miscModule.sendLogin.bind(this.miscModule);

    // Hypixel
    this.getPartyInfo      = this.hypixelModule.getPartyInfo.bind(this.hypixelModule);
    this.getPartyInfoAsync = this.hypixelModule.getPartyInfoAsync.bind(this.hypixelModule);
    this.isInParty         = this.hypixelModule.isInParty.bind(this.hypixelModule);
    this.getPlayerRole     = this.hypixelModule.getPlayerRole.bind(this.hypixelModule);
    this.getPing           = this.hypixelModule.getPing.bind(this.hypixelModule);
    this.getPingAsync      = this.hypixelModule.getPingAsync.bind(this.hypixelModule);

    // Inventory (full set)
    this.openWindow              = this.inventoryModule.openWindow.bind(this.inventoryModule);
    this.closeWindow             = this.inventoryModule.closeWindow.bind(this.inventoryModule);
    this.setSlot                 = this.inventoryModule.setSlot.bind(this.inventoryModule);
    this.setWindowItems          = this.inventoryModule.setWindowItems.bind(this.inventoryModule);
    this.sendTransaction         = this.inventoryModule.sendTransaction.bind(this.inventoryModule);
    this.sendCraftProgress       = this.inventoryModule.sendCraftProgress.bind(this.inventoryModule);
    this.setHeldItemSlot         = this.inventoryModule.setHeldItemSlot.bind(this.inventoryModule);
    this.creativeInventoryAction = this.inventoryModule.creativeInventoryAction.bind(this.inventoryModule);
    this.enchantItem             = this.inventoryModule.enchantItem.bind(this.inventoryModule);
    this.createChest             = this.inventoryModule.createChest.bind(this.inventoryModule);
    this.createHopper            = this.inventoryModule.createHopper.bind(this.inventoryModule);
    this.createDispenser         = this.inventoryModule.createDispenser.bind(this.inventoryModule);
    this.fillWindow              = this.inventoryModule.fillWindow.bind(this.inventoryModule);
    this.clearWindow             = this.inventoryModule.clearWindow.bind(this.inventoryModule);

    // Players (full set)
    this.getPlayer               = this.playersModule.getPlayer.bind(this.playersModule);
    this.getPlayerByName         = this.playersModule.getPlayerByName.bind(this.playersModule);
    this.getCurrentPlayer        = this.playersModule.getCurrentPlayer.bind(this.playersModule);
    this.getPlayerInfo           = this.playersModule.getPlayerInfo.bind(this.playersModule);
    this.getPlayerName           = this.playersModule.getPlayerName.bind(this.playersModule);
    this.calculateDistance       = this.playersModule.calculateDistance.bind(this.playersModule);
    this.getPlayersWithinDistance = this.playersModule.getPlayersWithinDistance.bind(this.playersModule);
    this.getPlayersInTeam        = this.playersModule.getPlayersInTeam.bind(this.playersModule);
    this.sendHealth              = this.playersModule.sendHealth.bind(this.playersModule);
    this.sendExperience          = this.playersModule.sendExperience.bind(this.playersModule);
    this.sendPosition            = this.playersModule.sendPosition.bind(this.playersModule);
    this.sendAbilities           = this.playersModule.sendAbilities.bind(this.playersModule);
    this.sendPlayerInfo          = this.playersModule.sendPlayerInfo.bind(this.playersModule);

    // Movement
    this.sendPosition_mv = this.movementModule.sendPosition?.bind(this.movementModule) || this.sendPosition;

    // World send methods (full set)
    this.getTeams                = this.worldModule.getTeams.bind(this.worldModule);
    this.getPlayerTeam           = this.worldModule.getPlayerTeam.bind(this.worldModule);
    this.sendExplosion           = this.worldModule.sendExplosion.bind(this.worldModule);
    this.sendBlockChange         = this.worldModule.sendBlockChange.bind(this.worldModule);
    this.sendMultiBlockChange    = this.worldModule.sendMultiBlockChange?.bind(this.worldModule) || (() => {});
    this.sendWorldEvent          = this.worldModule.sendWorldEvent?.bind(this.worldModule) || (() => {});
    this.sendTimeUpdate          = this.worldModule.sendTimeUpdate.bind(this.worldModule);
    this.sendSpawnPosition       = this.worldModule.sendSpawnPosition?.bind(this.worldModule) || (() => {});
    this.sendGameStateChange     = this.worldModule.sendGameStateChange.bind(this.worldModule);
    this.sendScoreboardObjective = this.miscModule.sendScoreboardObjective.bind(this.miscModule);
    this.sendScoreboardScore     = this.miscModule.sendScoreboardScore.bind(this.miscModule);
    this.sendScoreboardDisplay   = this.miscModule.sendScoreboardDisplay.bind(this.miscModule);
    this.sendScoreboardTeam      = this.miscModule.sendScoreboardTeam.bind(this.miscModule);

    // Entities (full set)
    this.spawnPlayer          = this.entitiesModule.spawnPlayer.bind(this.entitiesModule);
    this.spawnLiving          = this.entitiesModule.spawnLiving.bind(this.entitiesModule);
    this.spawnObject          = this.entitiesModule.spawnObject.bind(this.entitiesModule);
    this.spawnExperienceOrb   = this.entitiesModule.spawnExperienceOrb?.bind(this.entitiesModule) || (() => {});
    this.setEntityVelocity    = this.entitiesModule.setVelocity.bind(this.entitiesModule);
    this.teleportEntity       = this.entitiesModule.teleport.bind(this.entitiesModule);
    this.moveEntity           = this.entitiesModule.move?.bind(this.entitiesModule) || (() => {});
    this.setEntityLook        = this.entitiesModule.look?.bind(this.entitiesModule) || (() => {});
    this.setEntityLookAndMove = this.entitiesModule.lookAndMove?.bind(this.entitiesModule) || (() => {});
    this.setEntityHeadRotation = this.entitiesModule.setHeadRotation?.bind(this.entitiesModule) || (() => {});
    this.setEntityEquipment   = this.entitiesModule.setEquipment.bind(this.entitiesModule);
    this.addEntityEffect      = this.entitiesModule.addEffect.bind(this.entitiesModule);
    this.removeEntityEffect   = this.entitiesModule.removeEffect.bind(this.entitiesModule);
    this.setEntityStatus      = this.entitiesModule.setStatus?.bind(this.entitiesModule) || (() => {});
    this.setEntityMetadata    = this.entitiesModule.setMetadata.bind(this.entitiesModule);
    this.animateEntity        = this.entitiesModule.animate.bind(this.entitiesModule);
    this.collectEntity        = this.entitiesModule.collect?.bind(this.entitiesModule) || (() => {});
    this.attachEntity         = this.entitiesModule.attach?.bind(this.entitiesModule) || (() => {});

    Object.defineProperty(this, 'players', {
      get: () => this.playersModule.getPlayers()
    });
  }

  async loadPlugins() {
    const pluginsDir = getPluginsDir();
    if (!fs.existsSync(pluginsDir)) {
      console.log('[Lirify] No plugins directory found.');
      return;
    }

    const pluginFiles = fs.readdirSync(pluginsDir).filter(f => f.endsWith('.js'));
    const pluginMetadataMap = new Map();
    const pluginModules     = new Map();
    const skipped = [];
    const loaded  = [];

    // ── Phase 1: Extract metadata ──
    for (const file of pluginFiles) {
      let pluginName;
      try {
        const pluginPath = path.join(pluginsDir, file);
        delete require.cache[require.resolve(pluginPath)];
        const plugin = require(pluginPath);

        const tempMeta = {
          name: null, displayName: null, prefix: null,
          version: '1.0.0', apiVersion: null,
          minVersion: null, maxVersion: null,
          dependencies: [], optionalDependencies: [],
          path: pluginPath
        };

        const metaWrapper = this._createMetadataOnlyWrapper(tempMeta);
        try {
          if (typeof plugin.init === 'function') plugin.init(metaWrapper);
          else if (typeof plugin === 'function') plugin(metaWrapper);
        } catch (_) {}

        if (!tempMeta.name) {
          skipped.push(`${file} (no name declared)`);
          continue;
        }

        pluginName = tempMeta.name;

        if (pluginMetadataMap.has(pluginName)) {
          skipped.push(`${file} (duplicate name: ${pluginName})`);
          continue;
        }

        // ── API version check (NEW) ──
        if (tempMeta.apiVersion) {
          if (!VersionUtils.isAPICompatible(tempMeta.apiVersion)) {
            skipped.push(`${tempMeta.displayName || pluginName} (requires API ${tempMeta.apiVersion}, Lirify provides ${VersionUtils.getAPIVersion()})`);
            continue;
          }
        }

        pluginMetadataMap.set(pluginName, tempMeta);
        pluginModules.set(pluginName, plugin);
        this.dependencyResolver.addPlugin(tempMeta);

      } catch (e) {
        skipped.push(`${pluginName || file} (parse error: ${e.message})`);
      }
    }

    // ── Phase 2: Validate dependencies ──
    const depErrors = this.dependencyResolver.validateDependencies();
    const bad = new Set();
    for (const err of depErrors) {
      const match = err.match(/Plugin "([^"]+)"/i);
      if (match) {
        bad.add(match[1]);
        const m = pluginMetadataMap.get(match[1]);
        skipped.push(`${m?.displayName || match[1]} (${err})`);
      }
    }
    for (const name of bad) {
      pluginMetadataMap.delete(name);
      pluginModules.delete(name);
    }

    // ── Phase 3: Load in dependency order ──
    const loadOrder = this.dependencyResolver.getLoadOrder();

    if (skipped.length > 0) {
      console.log('[Lirify] Skipped plugins:', skipped.join(', '));
    }

    for (const pluginName of loadOrder) {
      const meta   = pluginMetadataMap.get(pluginName);
      const plugin = pluginModules.get(pluginName);
      if (!meta || !plugin) continue;

      const enabledFromConfig = this._getPluginEnabledState(pluginName);

      this.pluginStates.set(pluginName, {
        enabled: enabledFromConfig,
        modifications: {
          displayNames: new Set(),
          interceptors: new Set(),
          eventHandlers: new Set()
        }
      });

      const pluginAPI = this._createPluginWrapper(meta);

      try {
        let instance = null;
        if (typeof plugin.init === 'function') instance = plugin.init(pluginAPI);
        else if (typeof plugin === 'function') instance = plugin(pluginAPI);
        if (instance) this.pluginInstances.set(pluginName, instance);
      } catch (e) {
        skipped.push(`${meta.displayName || pluginName} (init error: ${e.message})`);
        this.pluginStates.delete(pluginName);
        continue;
      }

      this.loadedPlugins.push({
        name: pluginName,
        displayName: meta.displayName || pluginName,
        path: meta.path,
        enabled: enabledFromConfig,
        metadata: meta,
        version: meta.version,
        apiVersion: meta.apiVersion,
        dependencies: meta.dependencies || [],
        optionalDependencies: meta.optionalDependencies || [],
        compatible: true
      });

      loaded.push(`${meta.displayName || pluginName} v${meta.version}`);
    }

    if (skipped.length > 0) console.log(`[Lirify] Skipped: ${skipped.join(', ')}`);
    if (loaded.length > 0) console.log(`[Lirify] Loaded: ${loaded.join(', ')}`);
    else console.log('[Lirify] No plugins loaded');
  }

  // ──────────────────────────────
  // Plugin wrapper factory
  // ──────────────────────────────

  _createPluginWrapper(pluginMetadata) {
    const pluginName  = pluginMetadata.name;
    const pluginState = this.pluginStates.get(pluginName);
    const mainAPI     = this;
    const pluginCore  = new Core(this.proxy, pluginMetadata);
    const overlayAPI  = new OverlayAPI(this.proxy, pluginName);

    const registeredInterceptors = [];

    const withCheck = (fn, name) => (...args) => {
      if (!this._isEnabled(pluginName)) return;
      if (typeof fn !== 'function') return;
      return fn(...args);
    };

    return {
      // ── Metadata (no-op after loading) ──
      metadata: () => {},

      configSchema: (schema) => {
        pluginMetadata.configSchema = schema;
        pluginCore.initializeConfig(schema);
        this._ensureCommandModule(pluginName);
      },

      // Aliases for Starfish plugin compatibility
      initializeConfig: (schema) => {
        pluginMetadata.configSchema = schema;
        pluginCore.initializeConfig(schema);
        this._ensureCommandModule(pluginName);
      },

      config:   pluginCore.config,
      getConfig: () => pluginCore.config,
      saveCurrentConfig: pluginCore.saveCurrentConfig.bind(pluginCore),
      log:      withCheck(pluginCore.log.bind(pluginCore), 'log'),
      debugLog: withCheck(pluginCore.debugLog.bind(pluginCore), 'debugLog'),
      get debug() { return pluginCore.config.get('debug'); },

      getPrefix: () => `§8[§6Lirify §7Proxy§8-§r${pluginMetadata.prefix || pluginName}§8]§r`,
      isEnabled: () => !!(pluginState?.enabled),
      isOfficial: () => false, // Lirify has no official plugin system — all plugins equal

      // ── Events ──
      on: (event, handler) => {
        if (!pluginState) return () => {};
        const wrapped = withCheck(handler, 'event');
        pluginState.modifications.eventHandlers.add({ event, handler: wrapped });
        return mainAPI.on(event, wrapped);
      },

      emit: withCheck(mainAPI.emit.bind(mainAPI), 'emit'),

      intercept: (event, handler) => {
        if (!this._isEnabled(pluginName)) return () => {};
        const resolvedEvent = this._resolvePacketEvent(event);
        const wrapped = withCheck(handler, 'intercept');
        const unsub   = mainAPI.intercept(resolvedEvent, wrapped);
        const info    = { event: resolvedEvent, handler: wrapped, unsubscribe: unsub };
        pluginState.modifications.interceptors.add(info);
        registeredInterceptors.push(info);
        return () => {
          unsub();
          pluginState.modifications.interceptors.delete(info);
        };
      },

      // Starfish legacy: interceptPackets({ direction, packets }, handler)
      interceptPackets: (options, handler) => {
        if (!this._isEnabled(pluginName)) return () => {};
        if (!options?.direction || !Array.isArray(options.packets)) {
          throw new Error('interceptPackets requires { direction, packets[] }');
        }
        const wrapped = withCheck(handler, 'interceptPackets');
        mainAPI.events.registerPacketInterceptor(options.direction, options.packets, wrapped);
        const info = { direction: options.direction, packets: options.packets, handler: wrapped };
        pluginState.modifications.interceptors.add(info);
        registeredInterceptors.push(info);
        return () => {
          mainAPI.events.unregisterPacketInterceptor(options.direction, options.packets, wrapped);
          pluginState.modifications.interceptors.delete(info);
        };
      },

      everyTick: (cb) => {
        if (!pluginState) return () => {};
        return mainAPI.everyTick(withCheck(cb, 'tick'));
      },

      // Starfish: onWorldChange shortcut
      onWorldChange: (cb) => {
        if (!pluginState) return () => {};
        const wrapped = withCheck(cb, 'worldChange');
        pluginState.modifications.eventHandlers.add({ event: 'world_change', handler: wrapped });
        return mainAPI.on('world_change', wrapped);
      },

      // ── Communication ──
      chat:             withCheck(mainAPI.chat, 'chat'),
      chatInteractive:  withCheck(mainAPI.chatInteractive, 'chatInteractive'),
      sendTitle:        withCheck(mainAPI.sendTitle, 'sendTitle'),
      sendActionBar:    withCheck(mainAPI.sendActionBar, 'sendActionBar'),
      sendTabComplete:  withCheck(mainAPI.sendTabComplete, 'sendTabComplete'),
      sendChatToServer: withCheck(mainAPI.sendChatToServer, 'sendChatToServer'),
      sound:            withCheck(mainAPI.sound, 'sound'),
      sendParticle:     withCheck(mainAPI.sendParticle, 'sendParticle'),

      // ── Server admin ──
      kick:              withCheck(mainAPI.kick, 'kick'),
      sendKeepAlive:     withCheck(mainAPI.sendKeepAlive, 'sendKeepAlive'),
      sendCustomPayload: withCheck(mainAPI.sendCustomPayload, 'sendCustomPayload'),
      sendLogin:         withCheck(mainAPI.sendLogin, 'sendLogin'),

      // ── Players ──
      get players() { return mainAPI._isEnabled(pluginName) ? mainAPI.playersModule.getPlayers() : []; },
      getPlayer:               withCheck(mainAPI.getPlayer, 'getPlayer'),
      getPlayerByName:         withCheck(mainAPI.getPlayerByName, 'getPlayerByName'),
      getCurrentPlayer:        withCheck(mainAPI.getCurrentPlayer, 'getCurrentPlayer'),
      getPlayerInfo:           withCheck(mainAPI.getPlayerInfo, 'getPlayerInfo'),
      getPlayerName:           withCheck(mainAPI.getPlayerName, 'getPlayerName'),
      calculateDistance:       withCheck(mainAPI.calculateDistance, 'calculateDistance'),
      getPlayersWithinDistance:withCheck(mainAPI.getPlayersWithinDistance, 'getPlayersWithinDistance'),
      getPlayersInTeam:        withCheck(mainAPI.getPlayersInTeam, 'getPlayersInTeam'),
      sendHealth:              withCheck(mainAPI.sendHealth, 'sendHealth'),
      sendExperience:          withCheck(mainAPI.sendExperience, 'sendExperience'),
      sendPosition:            withCheck(mainAPI.sendPosition, 'sendPosition'),
      sendAbilities:           withCheck(mainAPI.sendAbilities, 'sendAbilities'),
      sendPlayerInfo:          withCheck(mainAPI.sendPlayerInfo, 'sendPlayerInfo'),

      // ── World (read state — Lirify extension) ──
      world: {
        getBlock:           (x,y,z)    => mainAPI.worldAPIModule.getBlock(x,y,z),
        hasChunk:           (cx,cz)    => mainAPI.worldAPIModule.hasChunk(cx,cz),
        getLoadedChunks:    ()         => mainAPI.worldAPIModule.getLoadedChunks(),
        getAllEntities:      ()         => mainAPI.worldAPIModule.getAllEntities(),
        getEntityById:      (id)       => mainAPI.worldAPIModule.getEntityById(id),
        getEntityByUUID:    (uuid)     => mainAPI.worldAPIModule.getEntityByUUID(uuid),
        getEntitiesNearby:  (x,y,z,r) => mainAPI.worldAPIModule.getEntitiesNearby(x,y,z,r),
        getTrackedPlayers:  ()         => mainAPI.worldAPIModule.getTrackedPlayers(),
        getTime:            ()         => mainAPI.worldAPIModule.getTime(),
        getWeather:         ()         => mainAPI.worldAPIModule.getWeather(),
        getDimension:       ()         => mainAPI.worldAPIModule.getDimension(),
        getWorldInfo:       ()         => mainAPI.worldAPIModule.getWorldInfo()
      },

      // ── World (send packets) ──
      getTeams:                withCheck(mainAPI.getTeams, 'getTeams'),
      getPlayerTeam:           withCheck(mainAPI.getPlayerTeam, 'getPlayerTeam'),
      sendExplosion:           withCheck(mainAPI.sendExplosion, 'sendExplosion'),
      sendBlockChange:         withCheck(mainAPI.sendBlockChange, 'sendBlockChange'),
      sendMultiBlockChange:    withCheck(mainAPI.sendMultiBlockChange, 'sendMultiBlockChange'),
      sendWorldEvent:          withCheck(mainAPI.sendWorldEvent, 'sendWorldEvent'),
      sendTimeUpdate:          withCheck(mainAPI.sendTimeUpdate, 'sendTimeUpdate'),
      sendSpawnPosition:       withCheck(mainAPI.sendSpawnPosition, 'sendSpawnPosition'),
      sendGameStateChange:     withCheck(mainAPI.sendGameStateChange, 'sendGameStateChange'),
      sendScoreboardObjective: withCheck(mainAPI.sendScoreboardObjective, 'sendScoreboardObjective'),
      sendScoreboardScore:     withCheck(mainAPI.sendScoreboardScore, 'sendScoreboardScore'),
      sendScoreboardDisplay:   withCheck(mainAPI.sendScoreboardDisplay, 'sendScoreboardDisplay'),
      sendScoreboardTeam:      withCheck(mainAPI.sendScoreboardTeam, 'sendScoreboardTeam'),

      // ── Entities ──
      spawnPlayer:          withCheck(mainAPI.spawnPlayer, 'spawnPlayer'),
      spawnLiving:          withCheck(mainAPI.spawnLiving, 'spawnLiving'),
      spawnObject:          withCheck(mainAPI.spawnObject, 'spawnObject'),
      spawnExperienceOrb:   withCheck(mainAPI.spawnExperienceOrb, 'spawnExperienceOrb'),
      setEntityVelocity:    withCheck(mainAPI.setEntityVelocity, 'setEntityVelocity'),
      teleportEntity:       withCheck(mainAPI.teleportEntity, 'teleportEntity'),
      moveEntity:           withCheck(mainAPI.moveEntity, 'moveEntity'),
      setEntityLook:        withCheck(mainAPI.setEntityLook, 'setEntityLook'),
      setEntityLookAndMove: withCheck(mainAPI.setEntityLookAndMove, 'setEntityLookAndMove'),
      setEntityHeadRotation:withCheck(mainAPI.setEntityHeadRotation, 'setEntityHeadRotation'),
      setEntityEquipment:   withCheck(mainAPI.setEntityEquipment, 'setEntityEquipment'),
      addEntityEffect:      withCheck(mainAPI.addEntityEffect, 'addEntityEffect'),
      removeEntityEffect:   withCheck(mainAPI.removeEntityEffect, 'removeEntityEffect'),
      setEntityStatus:      withCheck(mainAPI.setEntityStatus, 'setEntityStatus'),
      setEntityMetadata:    withCheck(mainAPI.setEntityMetadata, 'setEntityMetadata'),
      animateEntity:        withCheck(mainAPI.animateEntity, 'animateEntity'),
      collectEntity:        withCheck(mainAPI.collectEntity, 'collectEntity'),
      attachEntity:         withCheck(mainAPI.attachEntity, 'attachEntity'),

      // ── Inventory/GUI ──
      openWindow:              withCheck(mainAPI.openWindow, 'openWindow'),
      closeWindow:             withCheck(mainAPI.closeWindow, 'closeWindow'),
      setSlot:                 withCheck(mainAPI.setSlot, 'setSlot'),
      setWindowItems:          withCheck(mainAPI.setWindowItems, 'setWindowItems'),
      sendTransaction:         withCheck(mainAPI.sendTransaction, 'sendTransaction'),
      sendCraftProgress:       withCheck(mainAPI.sendCraftProgress, 'sendCraftProgress'),
      setHeldItemSlot:         withCheck(mainAPI.setHeldItemSlot, 'setHeldItemSlot'),
      creativeInventoryAction: withCheck(mainAPI.creativeInventoryAction, 'creativeInventoryAction'),
      enchantItem:             withCheck(mainAPI.enchantItem, 'enchantItem'),
      createChest:             withCheck(mainAPI.createChest, 'createChest'),
      createHopper:            withCheck(mainAPI.createHopper, 'createHopper'),
      createDispenser:         withCheck(mainAPI.createDispenser, 'createDispenser'),
      fillWindow:              withCheck(mainAPI.fillWindow, 'fillWindow'),
      clearWindow:             withCheck(mainAPI.clearWindow, 'clearWindow'),

      // ── Display names ──
      setDisplayNamePrefix:   (uuid, p) => { if(this._isEnabled(pluginName)) mainAPI.displayNames.setPrefix(pluginName, uuid, p); },
      appendDisplayNamePrefix:(uuid, p) => { if(this._isEnabled(pluginName)) mainAPI.displayNames.appendPrefix(pluginName, uuid, p); },
      prependDisplayNamePrefix:(uuid,p) => { if(this._isEnabled(pluginName)) mainAPI.displayNames.prependPrefix(pluginName, uuid, p); },
      setDisplayNameSuffix:   (uuid, s) => { if(this._isEnabled(pluginName)) mainAPI.displayNames.setSuffix(pluginName, uuid, s); },
      appendDisplayNameSuffix:(uuid, s) => { if(this._isEnabled(pluginName)) mainAPI.displayNames.appendSuffix(pluginName, uuid, s); },
      prependDisplayNameSuffix:(uuid,s) => { if(this._isEnabled(pluginName)) mainAPI.displayNames.prependSuffix(pluginName, uuid, s); },
      clearDisplayNamePrefix: (uuid)    => { if(this._isEnabled(pluginName)) mainAPI.displayNames.clearPrefix(pluginName, uuid); },
      clearDisplayNameSuffix: (uuid)    => { if(this._isEnabled(pluginName)) mainAPI.displayNames.clearSuffix(pluginName, uuid); },
      clearAllDisplayNames:   ()        => { if(this._isEnabled(pluginName)) mainAPI.displayNames.clearAll(pluginName); },
      getDisplayNamePrefix:   withCheck((uuid) => mainAPI.displayNames.getPrefix(uuid), 'getPrefix'),
      getDisplayNameSuffix:   withCheck((uuid) => mainAPI.displayNames.getSuffix(uuid), 'getSuffix'),

      // ── Hypixel ──
      getPartyInfo:      withCheck(mainAPI.getPartyInfo, 'getPartyInfo'),
      getPartyInfoAsync: withCheck(mainAPI.getPartyInfoAsync, 'getPartyInfoAsync'),
      isInParty:         withCheck(mainAPI.isInParty, 'isInParty'),
      getPlayerRole:     withCheck(mainAPI.getPlayerRole, 'getPlayerRole'),
      getPing:           withCheck(mainAPI.getPing, 'getPing'),
      getPingAsync:      withCheck(mainAPI.getPingAsync, 'getPingAsync'),

      // ── Overlay (Lirify extension) ──
      overlay: overlayAPI,

      // ── Commands ──
      commands: (cb) => mainAPI.commandsModule.register(pluginMetadata.name, cb),

      // ── Plugin inter-op ──
      getPluginInstance: (targetName) => {
        const deps = pluginMetadata.dependencies || [];
        const allowed = deps.some(d => (typeof d === 'string' ? d : d.name) === targetName);
        if (!allowed) throw new Error(`'${pluginName}' did not declare '${targetName}' as a dependency`);
        const state = mainAPI.pluginStates.get(targetName);
        if (!state?.enabled) return null;
        return mainAPI.pluginInstances.get(targetName) || null;
      },

      // ── Version info ──
      getLirifyAPIVersion: () => VersionUtils.getAPIVersion(),

      // Internal cleanup (called on disable)
      _cleanup: () => {
        for (const info of registeredInterceptors) {
          if (info.unsubscribe) {
            info.unsubscribe();
          } else if (info.direction && info.packets && info.handler) {
            mainAPI.events.unregisterPacketInterceptor(info.direction, info.packets, info.handler);
          }
        }
        registeredInterceptors.length = 0;
        overlayAPI.clearAll();
      }
    };
  }

  _createMetadataOnlyWrapper(tempMeta) {
    return {
      metadata: (meta) => { Object.assign(tempMeta, meta); },
      configSchema: () => {},
      initializeConfig: () => {},
      log: () => {},
      on: () => () => {},
      intercept: () => () => {},
      everyTick: () => () => {},
      commands: () => {},
      chat: () => {},
      sound: () => {},
      config: { get: () => undefined, set: () => {} },
      world: {},
      overlay: { registerWidget: () => {}, updateWidget: () => {}, removeWidget: () => {} },
      players: []
    };
  }

  _isEnabled(pluginName) {
    const state = this.pluginStates.get(pluginName);
    return !!(state && state.enabled);
  }

  _getPluginEnabledState(pluginName) {
    try {
      const configPath = path.join(getPluginConfigDir(), `${pluginName}.config.json`);
      if (fs.existsSync(configPath)) {
        const data = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return data.enabled !== false;
      }
    } catch (_) {}
    return true;
  }

  _resolvePacketEvent(event) {
    // Already in correct format
    if (event.startsWith('packet:')) return event;
    
    // Known client-bound (server→client) packet shorthands
    const serverPackets = new Set([
      'chat', 'login', 'respawn', 'position', 'entity_metadata',
      'player_info', 'scoreboard_objective', 'scoreboard_score',
      'scoreboard_display', 'teams', 'health_update', 'game_state_change',
      'map_chunk', 'block_change', 'multi_block_change', 'update_time',
      'explosion', 'sound_effect', 'named_sound_effect', 'spawn_entity',
      'spawn_named_entity', 'entity_velocity', 'entity_move_look',
      'entity_teleport', 'entity_head_rotation', 'entity_equipment',
      'entity_effect', 'remove_entity_effect', 'entity_destroy',
      'window_open', 'window_items', 'set_slot', 'window_close',
      'tab_list', 'resource_pack_send', 'kick_disconnect', 'abilities'
    ]);
    
    // Known server-bound (client→server) packet shorthands
    const clientPackets = new Set([
      'client_chat', 'client_position', 'client_look', 'client_position_look',
      'use_entity', 'block_place', 'block_dig', 'client_command',
      'window_click', 'client_window_close', 'client_abilities',
      'entity_action', 'steer_vehicle', 'item_action', 'client_settings',
      'transaction', 'creative_inventory_action', 'update_sign', 'player_block_placement'
    ]);
    
    if (clientPackets.has(event)) return `packet:client:${event}`;
    // Default: assume server-bound if not explicitly client
    return `packet:server:${event}`;
  }

  _ensureCommandModule(pluginName) {
    if (this.proxy.commandHandler && !this.proxy.commandHandler.modules?.has(pluginName.toLowerCase())) {
      this.proxy.commandHandler.register(pluginName, () => {});
    }
  }

  getLoadedPlugins() {
    return this.loadedPlugins;
  }

  setPluginEnabled(pluginName, enabled) {
    const state = this.pluginStates.get(pluginName);
    if (!state) return { success: false, reason: 'Plugin not found' };

    const wasEnabled = state.enabled;
    state.enabled = enabled;

    if (wasEnabled && !enabled) {
      // Cleanup interceptors + overlay widgets
      const wrapper = this.pluginInstances.get(pluginName);
      if (wrapper?._cleanup) wrapper._cleanup();
      this.displayNames.clearAll(pluginName);
    } else if (!wasEnabled && enabled) {
      this.emit('plugin_restored', { pluginName });
    }

    return { success: true };
  }
}

module.exports = PluginAPI;
