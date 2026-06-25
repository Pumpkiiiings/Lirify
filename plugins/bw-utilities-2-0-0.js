var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/core/patcher.js
var require_patcher = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/core/patcher.js"(exports2, module2) {
    var path2 = require("node:path");
    var fs = require("node:fs");
    (function patchRequirePaths() {
      try {
        const baseDir = process.pkg ? path2.dirname(process.execPath) : path2.join(__dirname, "..", "..", "..", "..");
        const dataDir = path2.join(baseDir, "data");
        const dataNodeModules = path2.join(dataDir, "node_modules");
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        if (require.main?.paths && !require.main.paths.includes(dataNodeModules)) {
          require.main.paths.push(dataNodeModules);
          console.log(
            `[BWU Patcher] Require path modified. Reading from: ${dataNodeModules}`
          );
        } else if (require.main && !require.main.paths) {
          require.main.paths = [dataNodeModules];
        }
      } catch (e) {
        console.error(`[BWU Patcher] Failed to modify require path: ${e.message}`);
      }
    })();
    module2.exports = {};
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/cache/CacheManager.js
var require_CacheManager = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/cache/CacheManager.js"(exports2, module2) {
    var CacheManager = class {
      constructor(api) {
        this.api = api;
        this.playerStatsCache = /* @__PURE__ */ new Map();
        this.pingCache = /* @__PURE__ */ new Map();
        this.uuidCache = /* @__PURE__ */ new Map();
      }
      getPlayerStats(playerName) {
        const lowerCaseName = playerName.toLowerCase();
        const cacheTTL = (this.api.config.get("performance.cacheTTL") || 300) * 1e3;
        const cached = this.playerStatsCache.get(lowerCaseName);
        if (cached && Date.now() - cached.timestamp < cacheTTL) {
          return cached.data;
        }
        return null;
      }
      setPlayerStats(playerName, stats) {
        const lowerCaseName = playerName.toLowerCase();
        this.playerStatsCache.set(lowerCaseName, {
          data: stats,
          timestamp: Date.now()
        });
      }
      getPing(uuid) {
        const pingCacheTTL = (this.api.config.get("performance.pingCacheTTL") || 60) * 1e3;
        const cached = this.pingCache.get(uuid);
        if (cached && Date.now() - cached.timestamp < pingCacheTTL) {
          return cached.data;
        }
        return null;
      }
      setPing(uuid, ping) {
        this.pingCache.set(uuid, { data: ping, timestamp: Date.now() });
      }
      getUuid(playerName) {
        return this.uuidCache.get(playerName.toLowerCase());
      }
      setUuid(playerName, uuid) {
        this.uuidCache.set(playerName.toLowerCase(), uuid);
      }
    };
    module2.exports = CacheManager;
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/api/ApiService.js
var require_ApiService = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/api/ApiService.js"(exports2, module2) {
    var ApiService = class {
      constructor(api, cacheManager) {
        this.api = api;
        this.cache = cacheManager;
      }
      async testHypixelApiKey() {
        try {
          const apiKey = this.api.config.get("main.hypixelApiKey");
          if (!apiKey || apiKey === "YOUR_HYPIXEL_API_KEY_HERE") {
            return { isValid: false, reason: "API key not set." };
          }
          const response = await fetch(`https://api.hypixel.net/v2/counts`, {
            headers: { "API-Key": apiKey }
          });
          const data = await response.json();
          if (data.success) {
            return { isValid: true };
          } else {
            return { isValid: false, reason: data.cause || "Invalid API key." };
          }
        } catch (error) {
          console.error(`[BWU HYPIXEL API] API key test failed: ${error.message}`);
          return { isValid: false, reason: "Failed to connect to Hypixel API." };
        }
      }
      async getUuid(playerName) {
        const playerFromProxy = this.api.getPlayerByName(playerName);
        if (playerFromProxy?.uuid) {
          return playerFromProxy.uuid;
        }
        const cached = this.cache.getUuid(playerName);
        if (cached) return cached;
        try {
          const response = await fetch(
            `https://api.mojang.com/users/profiles/minecraft/${playerName}`
          );
          if (!response.ok) return null;
          const data = await response.json();
          this.cache.setUuid(playerName, data.id);
          return data.id;
        } catch (error) {
          console.error(
            `[BWU MOJANG API] Failed to fetch UUID for ${playerName}: ${error.message}`
          );
          return null;
        }
      }
      _getRankDisplay(player) {
        const colorMap = {
          BLACK: "\xA70",
          DARK_BLUE: "\xA71",
          DARK_GREEN: "\xA72",
          DARK_AQUA: "\xA73",
          DARK_RED: "\xA74",
          DARK_PURPLE: "\xA75",
          GOLD: "\xA76",
          GRAY: "\xA77",
          DARK_GRAY: "\xA78",
          BLUE: "\xA79",
          GREEN: "\xA7a",
          AQUA: "\xA7b",
          RED: "\xA7c",
          LIGHT_PURPLE: "\xA7d",
          YELLOW: "\xA7e",
          WHITE: "\xA7f"
        };
        let plusColor = "\xA7c";
        if (player.rankPlusColor && colorMap[player.rankPlusColor]) {
          plusColor = colorMap[player.rankPlusColor];
        }
        if (player.rank && player.rank !== "NORMAL") {
          const r = player.rank;
          if (r === "YOUTUBER") return "\xA7c[\xA7fYOUTUBE\xA7c]";
          if (r === "GAME_MASTER") return "\xA72[GM]";
          if (r === "ADMIN") return "\xA7c[ADMIN]";
          if (r === "MODERATOR") return "\xA72[MOD]";
          if (r === "HELPER") return "\xA79[HELPER]";
          if (r === "MAYOR") return "\xA7d[MAYOR]";
        }
        if (player.monthlyPackageRank === "SUPERSTAR") {
          let rankColor = "\xA76";
          if (player.monthlyRankColor === "AQUA") rankColor = "\xA7b";
          return `${rankColor}[MVP${plusColor}++${rankColor}]`;
        }
        if (player.newPackageRank === "MVP_PLUS") {
          return `\xA7b[MVP${plusColor}+\xA7b]`;
        }
        if (player.newPackageRank === "MVP") {
          return "\xA7b[MVP]";
        }
        if (player.newPackageRank === "VIP_PLUS") {
          return "\xA7a[VIP\xA76+\xA7a]";
        }
        if (player.newPackageRank === "VIP") {
          return "\xA7a[VIP]";
        }
        return "\xA77";
      }
      async getPlayerStats(playerName) {
        const cached = this.cache.getPlayerStats(playerName);
        if (cached) return cached;
        try {
          const apiKey = this.api.config.get("main.hypixelApiKey");
          if (!apiKey || apiKey === "YOUR_HYPIXEL_API_KEY_HERE") return null;
          const uuid = await this.getUuid(playerName);
          if (!uuid) return { isNicked: true };
          const response = await fetch(
            `https://api.hypixel.net/v2/player?uuid=${uuid}`,
            { headers: { "API-Key": apiKey } }
          );
          if (!response.ok) return null;
          const data = await response.json();
          if (!data.success || !data.player) return { isNicked: true };
          const rankDisplay = this._getRankDisplay(data.player);
          const stats = data.player.stats?.Bedwars || {};
          const finalKills = stats.final_kills_bedwars || 0;
          const finalDeaths = stats.final_deaths_bedwars || 0;
          const wins = stats.wins_bedwars || 0;
          const losses = stats.losses_bedwars || 0;
          const relevantStats = {
            rank: rankDisplay,
            isNicked: false,
            stars: data.player.achievements?.bedwars_level || 0,
            fkdr: finalKills / Math.max(1, finalDeaths),
            final_kills: finalKills,
            final_deaths: finalDeaths,
            beds_broken: stats.beds_broken_bedwars || 0,
            winstreak: stats.winstreak || 0,
            wins,
            losses,
            wlr: wins / Math.max(1, losses)
          };
          this.cache.setPlayerStats(playerName, relevantStats);
          return relevantStats;
        } catch (error) {
          console.error(
            `[BWU HYPIXEL API] Failed to fetch player stats for ${playerName}: ${error.message}`
          );
          return null;
        }
      }
      async getPlayerPing(uuid) {
        const cached = this.cache.getPing(uuid);
        if (cached !== null) return cached;
        try {
          const apiKey = this.api.config.get("main.auroraApiKey");
          if (!apiKey || apiKey === "YOUR_AURORA_API_KEY_HERE") return null;
          const response = await fetch(
            `https://bordic.xyz/api/v2/resources/ping?key=${apiKey}&uuid=${uuid}`
          );
          if (!response.ok) return null;
          const data = await response.json();
          if (!data.success || !Array.isArray(data.data) || data.data.length === 0)
            return null;
          const avgPing = Math.round(data.data[0].avg);
          this.cache.setPing(uuid, avgPing);
          return avgPing;
        } catch (error) {
          console.error(
            `[BWU AURORA API] Failed to fetch ping for ${uuid}: ${error.message}`
          );
          return null;
        }
      }
      async getNameHistory(playerName) {
        try {
          const response = await fetch(
            `https://laby.net/api/v3/search/profiles/${playerName}`
          );
          if (!response.ok) return null;
          const data = await response.json();
          if (!data.users || !Array.isArray(data.users) || data.users.length === 0) {
            return null;
          }
          const user = data.users[0];
          if (!user.history || !Array.isArray(user.history)) {
            return null;
          }
          return {
            currentName: user.name,
            uuid: user.uuid,
            history: user.history.map((entry) => ({
              name: entry.name,
              changedAt: entry.changed_at,
              accurate: entry.accurate,
              lastSeenAt: entry.last_seen_at
            }))
          };
        } catch (error) {
          console.error(
            `[BWU LABY API] Failed to fetch name history for ${playerName}: ${error.message}`
          );
          return null;
        }
      }
    };
    module2.exports = ApiService;
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/utils/StatsFormatter.js
var require_StatsFormatter = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/utils/StatsFormatter.js"(exports2, module2) {
    var STAT_DEFINITIONS = [
      {
        configKey: "showStars",
        formatter: "_formatStars"
      },
      {
        configKey: "showRank",
        dataKey: "rank",
        formatter: "_formatRank"
      },
      {
        configKey: "showFkdr",
        dataKey: "fkdr",
        formatter: "_formatStat",
        chatPrefix: "FKDR: ",
        tabPrefix: "FKDR "
      },
      {
        configKey: "showFK",
        dataKey: "final_kills",
        formatter: "_formatStat",
        chatPrefix: "FK: ",
        tabPrefix: "FK "
      },
      {
        configKey: "showFD",
        dataKey: "final_deaths",
        formatter: "_formatStat",
        chatPrefix: "FD: ",
        tabPrefix: "FD "
      },
      {
        configKey: "showWlr",
        dataKey: "wlr",
        formatter: "_formatStat",
        chatPrefix: "WLR: ",
        tabPrefix: "WLR "
      },
      {
        configKey: "showWins",
        dataKey: "wins",
        formatter: "_formatStat",
        chatPrefix: "Wins: ",
        tabPrefix: "W "
      },
      {
        configKey: "showLosses",
        dataKey: "losses",
        formatter: "_formatStat",
        chatPrefix: "Losses: ",
        tabPrefix: "L "
      },
      {
        configKey: "showBeds",
        dataKey: "beds_broken",
        formatter: "_formatStat",
        chatPrefix: "Beds: ",
        tabPrefix: "BB "
      },
      {
        configKey: "showWinstreak",
        dataKey: "winstreak",
        formatter: "_formatStat",
        chatPrefix: "WS: ",
        tabPrefix: "WS "
      },
      {
        configKey: "showPing",
        dataKey: "ping",
        formatter: "_formatStat",
        chatPrefix: "Ping: "
      }
    ];
    var StatsFormatter = class {
      constructor(api) {
        this.api = api;
        this.colorRules = {
          fkdr: [
            { max: 0.99, color: "\xA77" },
            { max: 1.49, color: "\xA7f" },
            { max: 2.99, color: "\xA7a" },
            { max: 4.99, color: "\xA72" },
            { max: 6.99, color: "\xA7e" },
            { max: 9.99, color: "\xA76" },
            { max: 19.99, color: "\xA7c" },
            { max: 29.99, color: "\xA74" },
            { max: 49.99, color: "\xA7d" },
            { min: 50, color: "\xA75" }
          ],
          wlr: [
            { max: 0.29, color: "\xA77" },
            { max: 0.89, color: "\xA7f" },
            { max: 1.49, color: "\xA7a" },
            { max: 2.09, color: "\xA72" },
            { max: 2.99, color: "\xA7e" },
            { max: 5.99, color: "\xA76" },
            { max: 8.99, color: "\xA7c" },
            { max: 14.99, color: "\xA74" },
            { max: 29.99, color: "\xA7d" },
            { min: 30, color: "\xA75" }
          ],
          wins: [
            { max: 149, color: "\xA77" },
            { max: 299, color: "\xA7f" },
            { max: 449, color: "\xA7a" },
            { max: 1499, color: "\xA72" },
            { max: 2249, color: "\xA7e" },
            { max: 4499, color: "\xA76" },
            { max: 7499, color: "\xA7c" },
            { max: 14999, color: "\xA74" },
            { max: 29999, color: "\xA7d" },
            { min: 3e4, color: "\xA75" }
          ],
          losses: [
            { max: 149, color: "\xA77" },
            { max: 299, color: "\xA7f" },
            { max: 449, color: "\xA7a" },
            { max: 1499, color: "\xA72" },
            { max: 2249, color: "\xA7e" },
            { max: 4499, color: "\xA76" },
            { max: 7499, color: "\xA7c" },
            { max: 14999, color: "\xA74" },
            { max: 29999, color: "\xA7d" },
            { min: 3e4, color: "\xA75" }
          ],
          final_kills: [
            { max: 499, color: "\xA77" },
            { max: 999, color: "\xA7f" },
            { max: 2499, color: "\xA7a" },
            { max: 4999, color: "\xA72" },
            { max: 7499, color: "\xA7e" },
            { max: 14999, color: "\xA76" },
            { max: 24999, color: "\xA7c" },
            { max: 49999, color: "\xA74" },
            { max: 99999, color: "\xA7d" },
            { min: 1e5, color: "\xA75" }
          ],
          final_deaths: [
            { max: 499, color: "\xA77" },
            { max: 999, color: "\xA7f" },
            { max: 2499, color: "\xA7a" },
            { max: 4999, color: "\xA72" },
            { max: 7499, color: "\xA7e" },
            { max: 14999, color: "\xA76" },
            { max: 24999, color: "\xA7c" },
            { max: 49999, color: "\xA74" },
            { max: 99999, color: "\xA7d" },
            { min: 1e5, color: "\xA75" }
          ],
          beds_broken: [
            { max: 249, color: "\xA77" },
            { max: 499, color: "\xA7f" },
            { max: 1249, color: "\xA7a" },
            { max: 2499, color: "\xA72" },
            { max: 3749, color: "\xA7e" },
            { max: 7499, color: "\xA76" },
            { max: 12499, color: "\xA7c" },
            { max: 24999, color: "\xA74" },
            { max: 49999, color: "\xA7d" },
            { min: 5e4, color: "\xA75" }
          ],
          winstreak: [
            { max: 4, color: "\xA77" },
            { max: 14, color: "\xA7f" },
            { max: 24, color: "\xA7a" },
            { max: 39, color: "\xA72" },
            { max: 49, color: "\xA7e" },
            { max: 74, color: "\xA76" },
            { max: 99, color: "\xA7c" },
            { max: 249, color: "\xA74" },
            { max: 499, color: "\xA7d" },
            { min: 500, color: "\xA75" }
          ],
          ping: [
            { max: 49, color: "\xA7a" },
            { max: 99, color: "\xA7e" },
            { max: 149, color: "\xA76" },
            { max: 199, color: "\xA7c" },
            { min: 200, color: "\xA74" }
          ]
        };
        this.gameStatsColorRules = {
          // kills: 1-3 gray, 3-8 white, 8-13 green, 13-16 yellow, 16-20 gold, 20+ red
          kills: [
            { max: 2, color: "\xA77" },
            { max: 7, color: "\xA7f" },
            { max: 12, color: "\xA7a" },
            { max: 15, color: "\xA7e" },
            { max: 19, color: "\xA76" },
            { min: 20, color: "\xA7c" }
          ],
          // deaths: reverse color scheme (more deaths = worse)
          deaths: [
            { max: 2, color: "\xA7a" },
            { max: 5, color: "\xA7e" },
            { max: 8, color: "\xA76" },
            { max: 12, color: "\xA7c" },
            { min: 13, color: "\xA74" }
          ],
          // final kills: 1-2 gray, 3-4 white, 5-6 green, 7+ yellow/gold
          finalKills: [
            { max: 2, color: "\xA77" },
            { max: 4, color: "\xA7f" },
            { max: 6, color: "\xA7a" },
            { min: 7, color: "\xA7e" }
          ],
          // bed breaks: 1 gray, 2 white, 3 green, 4+ yellow
          bedBreaks: [
            { max: 1, color: "\xA77" },
            { max: 2, color: "\xA7f" },
            { max: 3, color: "\xA7a" },
            { min: 4, color: "\xA7e" }
          ]
        };
      }
      _applyColor(stat, value) {
        if (value === void 0 || value === null) {
          return "\xA7c";
        }
        const rules = this.colorRules[stat];
        if (!rules) {
          return "\xA7f";
        }
        for (const element of rules) {
          const rule = element;
          const minOk = rule.min === void 0 || value >= rule.min;
          const maxOk = rule.max === void 0 || value <= rule.max;
          if (minOk && maxOk) {
            return rule.color;
          }
        }
        return "\xA7f";
      }
      _applyGameStatColor(stat, value) {
        if (value === void 0 || value === null || value === 0) {
          return "\xA78";
        }
        const rules = this.gameStatsColorRules[stat];
        if (!rules) {
          return "\xA7f";
        }
        for (const rule of rules) {
          const minOk = rule.min === void 0 || value >= rule.min;
          const maxOk = rule.max === void 0 || value <= rule.max;
          if (minOk && maxOk) {
            return rule.color;
          }
        }
        return "\xA7f";
      }
      _getPrefix(mode, definition, statConfig) {
        const prefixColor = statConfig.prefixColor || "\xA78";
        if (mode === "chat" || statConfig.showPrefix) {
          if (mode === "chat") {
            return definition.chatPrefix ? prefixColor + definition.chatPrefix : "";
          } else {
            return definition.tabPrefix ? prefixColor + definition.tabPrefix : "";
          }
        }
        return "";
      }
      _formatStars({ stats }) {
        return this._getPrestigeTag(stats.stars);
      }
      _formatRank({ stats }) {
        if (!stats.rank || stats.rank === "\xA77") {
          return null;
        }
        return stats.rank;
      }
      _formatStat({ stats, ping, mode, definition, statConfig }) {
        const statKey = definition.dataKey;
        let value = null;
        if (statKey === "ping") {
          value = ping;
        } else if (stats[statKey] !== void 0 && stats[statKey] !== null) {
          value = stats[statKey];
        }
        const color = this._applyColor(statKey, value);
        const prefix = this._getPrefix(mode, definition, statConfig);
        let formattedValue = "\xA7c?";
        if (value !== void 0 && value !== null) {
          if (statKey === "fkdr" || statKey === "wlr") {
            formattedValue = value.toFixed(2);
          } else {
            formattedValue = value.toString();
          }
        }
        if (statKey === "ping" && value !== void 0 && value !== null) {
          formattedValue = formattedValue + "ms";
        }
        if (mode === "tab" && !statConfig.showPrefix) {
          return color + formattedValue;
        }
        return prefix + color + formattedValue;
      }
      _formatMythicNumber(stars, colorPattern) {
        const starStr = stars.toString();
        const firstDigit = starStr.charAt(0);
        const middleDigits = starStr.substring(1, starStr.length - 1);
        const lastDigit = starStr.at(-1);
        return colorPattern[0] + firstDigit + colorPattern[1] + middleDigits + colorPattern[2] + lastDigit;
      }
      _getPrestigeTag(stars) {
        const prestige = Math.floor(stars / 100);
        let symbol = "\u272B";
        if (stars >= 1100 && stars < 2100) symbol = "\u272A";
        if (stars >= 2100 && stars < 3100) symbol = "\u269D";
        if (stars >= 3100) symbol = "\u2725";
        if (prestige < 10) {
          const colors = [
            "\xA77",
            "\xA7f",
            "\xA76",
            "\xA7b",
            "\xA72",
            "\xA73",
            "\xA74",
            "\xA7d",
            "\xA79",
            "\xA75"
          ];
          return colors[prestige] + "[" + stars + symbol + "]";
        }
        switch (prestige) {
          case 10:
            return `\xA7c[\xA76${stars.toString()[0]}\xA7e${stars.toString()[1]}\xA7a${stars.toString()[2]}\xA7b${stars.toString()[3]}\xA7d${symbol}\xA75]`;
          case 11:
            return `\xA77[\xA7f${stars}${symbol}\xA77]`;
          case 12:
            return `\xA77[\xA7e${stars}\xA76${symbol}\xA77]`;
          case 13:
            return `\xA77[\xA7b${stars}\xA73${symbol}\xA77]`;
          case 14:
            return `\xA77[\xA7a${stars}\xA72${symbol}\xA77]`;
          case 15:
            return `\xA77[\xA73${stars}\xA79${symbol}\xA77]`;
          case 16:
            return `\xA77[\xA7c${stars}\xA74${symbol}\xA77]`;
          case 17:
            return `\xA77[\xA7d${stars}\xA75${symbol}\xA77]`;
          case 18:
            return `\xA77[\xA79${stars}\xA71${symbol}\xA77]`;
          case 19:
            return `\xA77[\xA75${stars}\xA78${symbol}\xA77]`;
          case 20:
            return `\xA78[${this._formatMythicNumber(stars, [
              "\xA77",
              "\xA7f",
              "\xA77"
            ])}${symbol}\xA78]`;
          case 21:
            return `\xA7f[${this._formatMythicNumber(stars, [
              "\xA7f",
              "\xA7e",
              "\xA76"
            ])}${symbol}]`;
          case 22:
            return `\xA76[${this._formatMythicNumber(stars, [
              "\xA76",
              "\xA7f",
              "\xA7b"
            ])}${symbol}\xA73]`;
          case 23:
            return `\xA75[${this._formatMythicNumber(stars, [
              "\xA75",
              "\xA7d",
              "\xA76"
            ])}${symbol}\xA7e]`;
          case 24:
            return `\xA7b[${this._formatMythicNumber(stars, [
              "\xA7b",
              "\xA7f",
              "\xA77"
            ])}${symbol}\xA78]`;
          case 25:
            return `\xA7f[${this._formatMythicNumber(stars, [
              "\xA7f",
              "\xA7a",
              "\xA72"
            ])}${symbol}]`;
          case 26:
            return `\xA74[${this._formatMythicNumber(stars, [
              "\xA74",
              "\xA7c",
              "\xA7d"
            ])}${symbol}\xA75]`;
          case 27:
            return `\xA7e[${this._formatMythicNumber(stars, [
              "\xA7e",
              "\xA7f",
              "\xA78"
            ])}${symbol}]`;
          case 28:
            return `\xA7a[${this._formatMythicNumber(stars, [
              "\xA7a",
              "\xA72",
              "\xA76"
            ])}${symbol}\xA7e]`;
          case 29:
            return `\xA7b[${this._formatMythicNumber(stars, [
              "\xA7b",
              "\xA73",
              "\xA79"
            ])}${symbol}\xA71]`;
          case 30:
            return `\xA7e[${this._formatMythicNumber(stars, [
              "\xA7e",
              "\xA76",
              "\xA7c"
            ])}${symbol}\xA74]`;
          case 31:
            return `\xA79[${this._formatMythicNumber(stars, [
              "\xA79",
              "\xA73",
              "\xA76"
            ])}${symbol}\xA7e]`;
          case 32:
            return `\xA7c[${this._formatMythicNumber(stars, [
              "\xA74",
              "\xA77",
              "\xA74"
            ])}\xA7c${symbol}]`;
          case 33:
            return `\xA79[${this._formatMythicNumber(stars, [
              "\xA79",
              "\xA7d",
              "\xA7c"
            ])}${symbol}\xA74]`;
          case 34:
            return `\xA72[${this._formatMythicNumber(stars, [
              "\xA7a",
              "\xA7d",
              "\xA75"
            ])}${symbol}\xA72]`;
          case 35:
            return `\xA7c[${this._formatMythicNumber(stars, [
              "\xA7c",
              "\xA74",
              "\xA72"
            ])}\xA7a${symbol}]`;
          case 36:
            return `\xA7a[${this._formatMythicNumber(stars, [
              "\xA7a",
              "\xA7b",
              "\xA79"
            ])}${symbol}\xA71]`;
          case 37:
            return `\xA74[${this._formatMythicNumber(stars, [
              "\xA74",
              "\xA7c",
              "\xA7b"
            ])}\xA73${symbol}]`;
          case 38:
            return `\xA71[${this._formatMythicNumber(stars, [
              "\xA71",
              "\xA79",
              "\xA75"
            ])}\xA7d${symbol}\xA71]`;
          case 39:
            return `\xA7c[${this._formatMythicNumber(stars, [
              "\xA7c",
              "\xA7a",
              "\xA73"
            ])}\xA79${symbol}]`;
          case 40:
            return `\xA75[${this._formatMythicNumber(stars, [
              "\xA75",
              "\xA7c",
              "\xA76"
            ])}${symbol}\xA7e]`;
          case 41:
            return `\xA7e[${this._formatMythicNumber(stars, [
              "\xA7e",
              "\xA76",
              "\xA7c"
            ])}\xA7d${symbol}\xA75]`;
          case 42: {
            const s = stars.toString();
            return `\xA71[\xA79${s[0]}\xA73${s[1]}\xA7b${s[2]}\xA7f${s[3]}\xA77${symbol}]`;
          }
          case 43:
            return `\xA70[${this._formatMythicNumber(stars, [
              "\xA75",
              "\xA78",
              "\xA75"
            ])}${symbol}\xA70]`;
          case 44: {
            const s = stars.toString();
            return `\xA72[${s[0]}\xA7a${s[1]}\xA7e${s[2]}\xA76${s[3]}\xA75${symbol}\xA7d]`;
          }
          case 45:
            return `\xA7f[${this._formatMythicNumber(stars, [
              "\xA7f",
              "\xA7b",
              "\xA73"
            ])}${symbol}]`;
          case 46:
            return `\xA73[${this._formatMythicNumber(stars, [
              "\xA7b",
              "\xA7e",
              "\xA76"
            ])}\xA7d${symbol}\xA75]`;
          case 47:
            return `\xA7f[${this._formatMythicNumber(stars, [
              "\xA74",
              "\xA7c",
              "\xA79"
            ])}\xA71${symbol}\xA79]`;
          case 48: {
            const s = stars.toString();
            return `\xA75[${s[0]}\xA7c${s[1]}\xA76${s[2]}\xA7e${s[3]}\xA7b${symbol}\xA73]`;
          }
          case 49:
            return `\xA72[${this._formatMythicNumber(stars, [
              "\xA7a",
              "\xA7f",
              "\xA7a"
            ])}${symbol}\xA72]`;
          case 50:
            return `\xA74[${this._formatMythicNumber(stars, [
              "\xA74",
              "\xA75",
              "\xA79"
            ])}\xA71${symbol}\xA70]`;
          default:
            if (prestige > 50) {
              return `\xA74[${this._formatMythicNumber(stars, [
                "\xA74",
                "\xA75",
                "\xA79"
              ])}\xA71${symbol}\xA70]`;
            }
            return `\xA7f[${stars}${symbol}]`;
        }
      }
      _buildStatsParts(stats, ping, mode) {
        const config = this.api.config.get("stats");
        const isTabMode = mode === "tab";
        const parts = [];
        for (const element of STAT_DEFINITIONS) {
          const definition = element;
          const statConfig = config[definition.configKey];
          if (!statConfig?.enabled) {
            continue;
          }
          const displayMode = statConfig.displayMode;
          const shouldShow = displayMode === "both" || displayMode === "chat" && !isTabMode || displayMode === "tab" && isTabMode;
          if (!shouldShow) {
            continue;
          }
          const part = this[definition.formatter]({
            stats,
            ping,
            mode,
            definition,
            statConfig
          });
          if (part) {
            parts.push(part);
          }
        }
        return parts;
      }
      formatStats(mode, playerName, stats, ping, options = {}) {
        const isTab = mode === "tab";
        const includePrefix = options.includePrefix !== false;
        let playerDisplay = playerName;
        if (!isTab) {
          const playerObject = this.api.getPlayerByName(playerName);
          if (playerObject?.team?.prefix) {
            playerDisplay = playerObject.team.prefix + playerName;
          }
        }
        if (!stats || stats.isNicked) {
          if (isTab) {
            return " \xA7f| \xA7cNicked";
          } else {
            const prefix = includePrefix ? this.api.getPrefix() + " " : "";
            return prefix + playerDisplay + " \xA78- \xA7cNicked";
          }
        }
        const parts = this._buildStatsParts(stats, ping, mode);
        if (parts.length === 0) {
          if (isTab) {
            return "";
          } else {
            const prefix = includePrefix ? this.api.getPrefix() + " " : "";
            return prefix + "\xA7cYou have all stats disabled.";
          }
        }
        if (isTab) {
          return " \xA7f| " + parts.join(" \xA7f| ");
        } else {
          const prefix = includePrefix ? this.api.getPrefix() + " " : "";
          return prefix + playerDisplay + " \xA78- \xA77" + parts.join(" \xA78|\xA77 ");
        }
      }
      /**
       * Format in-game stats for tab display
       * @param {Object} gameStats - { kills, deaths, finalKills, bedsBroken }
       * @returns {string} Formatted stats string for tab suffix
       */
      formatGameStatsForTab(gameStats) {
        if (!gameStats) {
          return "";
        }
        const parts = [];
        const config = this.api.config;
        if (config.get("inGameTracker.tabShowKills") && gameStats.kills !== void 0) {
          const color = this._applyGameStatColor("kills", gameStats.kills);
          parts.push(`\xA77K: ${color}${gameStats.kills}`);
        }
        if (config.get("inGameTracker.tabShowDeaths") && gameStats.deaths !== void 0) {
          parts.push(`\xA77D: \xA77${gameStats.deaths}`);
        }
        if (config.get("inGameTracker.tabShowFinalKills") && gameStats.finalKills !== void 0) {
          const color = this._applyGameStatColor("finalKills", gameStats.finalKills);
          parts.push(`\xA77FK: ${color}${gameStats.finalKills}`);
        }
        if (config.get("inGameTracker.tabShowBedBreaks") && gameStats.bedsBroken !== void 0) {
          const color = this._applyGameStatColor("bedBreaks", gameStats.bedsBroken);
          parts.push(`\xA77BB: ${color}${gameStats.bedsBroken}`);
        }
        if (parts.length === 0) {
          return "";
        }
        return " \xA7f|  " + parts.join("  \xA78|  ");
      }
    };
    module2.exports = StatsFormatter;
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/handlers/ChatHandler.js
var require_ChatHandler = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/handlers/ChatHandler.js"(exports2, module2) {
    var ChatHandler = class {
      constructor(api, apiService, statsFormatter, tabManager, bwuInstance) {
        this.api = api;
        this.apiService = apiService;
        this.statsFormatter = statsFormatter;
        this.tabManager = tabManager;
        this.bwuInstance = bwuInstance;
      }
      async handleChat(cleanMessage, autoStatsMode, checkedPlayers, setAutoStatsMode) {
        const me = this.api.getCurrentPlayer();
        if (!me?.uuid) return;
        const myNick = this.api.getPlayerInfo(me.uuid)?.name || me.name;
        if (this.api.config.get("autoStats.enabled") && !autoStatsMode) {
          const joinRegex = new RegExp(`^${myNick} has joined \\([0-9]+\\/[0-9]+\\)!$`);
          if (joinRegex.test(cleanMessage)) {
            setAutoStatsMode(true);
            checkedPlayers.clear();
            let sendType = this.api.config.get("autoStats.sendType") || "private";
            if (sendType === "party" && this.bwuInstance.inParty !== true) {
              sendType = "private";
              this.api.debugLog(`[BWU] Auto Stats sendType: party -> private (not in party)`);
            } else {
              this.api.debugLog(`[BWU] Auto Stats sendType: ${sendType}`);
            }
            let modeText = sendType === "party" ? "Party Mode" : "Private Mode";
            const enabledMsg = `${this.api.getPrefix()} \xA7aAutomatic stats mode ENABLED (\xA7b${modeText}\xA7a)`;
            this.api.chat(enabledMsg);
            return;
          }
        }
        const chatRegex = /^(?:\[.*?\]\s*)*(\w{3,16})(?::| ») (.*)/;
        const match = cleanMessage.match(chatRegex);
        if (!match) return;
        const senderName = match[1];
        const messageContent = match[2];
        if (autoStatsMode && !checkedPlayers.has(senderName.toLowerCase())) {
          await this.displayStatsForPlayer(senderName);
          checkedPlayers.add(senderName.toLowerCase());
        }
        if (this.api.config.get("mentionStats.enabled")) {
          if (messageContent.toLowerCase().includes(myNick.toLowerCase())) {
            await this.displayStatsForPlayer(senderName);
          }
        }
      }
      async displayStatsForPlayer(playerName) {
        const stats = await this.apiService.getPlayerStats(playerName);
        if (!stats) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cFailed to fetch stats for ${playerName}.`
          );
          return;
        }
        let ping = null;
        if (this.api.config.get("stats.showPing")) {
          const uuid = await this.apiService.getUuid(playerName);
          if (uuid) {
            ping = await this.apiService.getPlayerPing(uuid);
          }
        }
        let sendType = this.api.config.get("autoStats.sendType") || "private";
        const includePrefix = !(sendType === "party" && this.bwuInstance.inParty === true);
        const message = this.statsFormatter.formatStats(
          "chat",
          playerName,
          stats,
          ping,
          { includePrefix }
        );
        if (sendType === "party" && this.bwuInstance.inParty === true) {
          this.api.debugLog(`[BWU] Auto Stats sending to party chat`);
          const cleanMsg = message.replaceAll(/§[0-9a-fk-or]/g, "");
          this.api.sendChatToServer(`/pc ${cleanMsg}`);
        } else if (sendType === "party") {
          this.api.debugLog(`[BWU] Auto Stats sendType: party -> private (not in party)`);
          this.api.chat(message);
        } else {
          this.api.chat(message);
        }
      }
      handleAutoMessage(cleanMessage) {
        try {
          if (cleanMessage.trim() !== "The game starts in 10 seconds!") {
            return;
          }
          if (!this.api.config.get("autoQdmsg.enabled")) {
            return;
          }
          const validMessages = [];
          for (let i = 1; i <= 5; i++) {
            const msg = this.api.config.get(`autoQdmsg.msg${i}`);
            if (msg && msg.trim().length > 0) {
              validMessages.push(msg);
            }
          }
          if (validMessages.length === 0) {
            return;
          }
          let possibleMessages = [...validMessages];
          if (this.bwuInstance.lastQdmsg && validMessages.length > 1) {
            possibleMessages = validMessages.filter(
              (msg) => msg !== this.bwuInstance.lastQdmsg
            );
          }
          const randomMsg = possibleMessages[Math.floor(Math.random() * possibleMessages.length)];
          this.bwuInstance.lastQdmsg = randomMsg;
          this.api.sendChatToServer(`/ac ${randomMsg}`);
        } catch (e) {
          console.error(`[BWU] Error on handleAutoMessage: ${e.message}`);
        }
      }
    };
    module2.exports = ChatHandler;
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/handlers/CommandHandler.js
var require_CommandHandler = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/handlers/CommandHandler.js"(exports2, module2) {
    var path2 = require("node:path");
    var fs = require("node:fs");
    var CommandHandler = class {
      constructor(api, apiService, tabManager, chatHandler, partyFinder, bwuInstance) {
        this.api = api;
        this.apiService = apiService;
        this.tabManager = tabManager;
        this.chatHandler = chatHandler;
        this.partyFinder = partyFinder;
        this.bwu = bwuInstance;
        this.fs = fs;
        const baseDir = process.pkg ? path2.dirname(process.execPath) : path2.join(__dirname, "..", "..", "..");
        const dataDir = path2.join(baseDir, "data");
        if (!this.fs.existsSync(dataDir)) {
          this.fs.mkdirSync(dataDir, { recursive: true });
        }
        this.macrosFilePath = path2.join(dataDir, "bwu_macros.json");
        this.shoutCooldown = 65e3;
        this.lastShoutTime = 0;
        this.pendingShoutMessage = null;
        this.shoutTimer = null;
      }
      _getMacros() {
        try {
          if (this.fs.existsSync(this.macrosFilePath)) {
            const data = this.fs.readFileSync(this.macrosFilePath, "utf8");
            return JSON.parse(data);
          }
        } catch (e) {
          this.api.debugLog(`[BWU] Error reading macros file: ${e.message}`);
          return {};
        }
        return {};
      }
      _saveMacros(macros) {
        try {
          const data = JSON.stringify(macros, null, 2);
          this.fs.writeFileSync(this.macrosFilePath, data, "utf8");
        } catch (e) {
          this.api.debugLog(`[BWU] Error saving macros file: ${e.message}`);
        }
      }
      handleSetMacroCommand(ctx) {
        const name = ctx.args.name;
        const contentArray = ctx.args.content;
        if (!name || !contentArray || contentArray.length === 0) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cUsage: /bwu setmacro <name> <content...>`
          );
          return;
        }
        const content = contentArray.join(" ");
        const macros = this._getMacros();
        macros[name.toLowerCase()] = content;
        this._saveMacros(macros);
        this.api.chat(
          `${this.api.getPrefix()} \xA7aMacro '${name}' saved with content: \xA7f${content}`
        );
      }
      handleDelMacroCommand(ctx) {
        const name = ctx.args.name;
        if (!name) {
          this.api.chat(`${this.api.getPrefix()} \xA7cUsage: /bwu delmacro <name>`);
          return;
        }
        const nameLower = name.toLowerCase();
        const macros = this._getMacros();
        if (macros[nameLower]) {
          delete macros[nameLower];
          this._saveMacros(macros);
          this.api.chat(
            `${this.api.getPrefix()} \xA7aMacro '${name}' successfully removed!`
          );
        } else {
          this.api.chat(`${this.api.getPrefix()} \xA7cMacro '${name}' not found.`);
        }
      }
      handleListMacrosCommand(ctx) {
        const macros = this._getMacros();
        const names = Object.keys(macros);
        if (names.length === 0) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cYou have no saved macros. Use /bwu setmacro <name> <content...>`
          );
          return;
        }
        this.api.chat(`${this.api.getPrefix()} \xA76Saved Macros (${names.length}):`);
        for (const name of names) {
          const content = macros[name];
          const chatComponent = {
            text: `\xA7e${name}: \xA7f${content} `,
            extra: [
              {
                text: "\xA7a[Run]",
                color: "green",
                hoverEvent: {
                  action: "show_text",
                  value: "\xA7aClick to run /bwu m " + name
                },
                clickEvent: {
                  action: "run_command",
                  value: `/bwu m ${name}`
                }
              },
              {
                text: " \xA7e[Edit]",
                color: "yellow",
                hoverEvent: {
                  action: "show_text",
                  value: "\xA7eClick to edit this macro"
                },
                clickEvent: {
                  action: "suggest_command",
                  value: `/bwu setmacro ${name} ${content}`
                }
              },
              {
                text: " \xA7c[Remove]",
                color: "red",
                hoverEvent: {
                  action: "show_text",
                  value: "\xA7cClick to remove /bwu delmacro " + name
                },
                clickEvent: {
                  action: "run_command",
                  value: `/bwu delmacro ${name}`
                }
              }
            ]
          };
          this.api.chat(chatComponent);
        }
      }
      handleRunMacroCommand(ctx) {
        const name = ctx.args.name;
        if (!name) {
          this.api.chat(`${this.api.getPrefix()} \xA7cUsage: /bwu m <name>`);
          return;
        }
        const nameLower = name.toLowerCase();
        const macros = this._getMacros();
        const content = macros[nameLower];
        if (content) {
          this.api.sendChatToServer(content);
        } else {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cMacro '${name}' not found. Use /bwu macros to list.`
          );
        }
      }
      handleFindCommand(ctx) {
        if (ctx.args.mode && ctx.args.mode.toLowerCase() === "stop") {
          this.partyFinder.stop();
          return;
        }
        const mode = ctx.args.mode;
        const playersToFind = ctx.args.playersToFind;
        const fkdrThreshold = ctx.args.fkdrThreshold;
        const positions = ctx.args.positions || [];
        const args = [mode, playersToFind, fkdrThreshold, ...positions];
        this.partyFinder.start(args);
      }
      async handleStatsCommand(ctx) {
        const playerName = ctx.args.nickname;
        if (!playerName || typeof playerName !== "string" || playerName.trim().length === 0) {
          this.api.chat(`${this.api.getPrefix()} \xA7cUsage: /bwu stats <nickname>`);
          return;
        }
        await this.chatHandler.displayStatsForPlayer(playerName.trim());
      }
      handleSetThresholdCommand(ctx) {
        const threshold = ctx.args.threshold;
        const numericThreshold = Number.parseFloat(threshold);
        if (Number.isNaN(numericThreshold) || numericThreshold < 0) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cError: Please provide a valid number for the threshold (e.g., 10.0).`
          );
          return;
        }
        this.api.config.set("autoRequeue.fkdrThreshold", numericThreshold);
        this.api.chat(
          `${this.api.getPrefix()} \xA7aFKDR threshold for auto-requeue set to \xA7f${numericThreshold.toFixed(
            2
          )}\xA7a.`
        );
      }
      handleClearCommand(ctx) {
        this.tabManager.clearManagedPlayers("all");
        this.api.chat(`${this.api.getPrefix()} \xA7aStats cleared successfully!`);
      }
      handleSetKeyCommand(ctx) {
        const apikey = ctx.args.apikey;
        if (!apikey || typeof apikey !== "string") {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cError: Please provide a valid API key!`
          );
          return;
        }
        const trimmedKey = apikey.trim();
        if (trimmedKey.length === 0) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cError: The key cannot be empty!`
          );
          return;
        }
        this.api.config.set("main.hypixelApiKey", trimmedKey);
        this.api.chat(
          `${this.api.getPrefix()} \xA7aHypixel API key set successfully!`
        );
      }
      handleSetAuroraCommand(ctx) {
        const apikey = ctx.args.apikey;
        if (!apikey || typeof apikey !== "string") {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cError: Please provide a valid API key!`
          );
          return;
        }
        const trimmedKey = apikey.trim();
        if (trimmedKey.length === 0) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cError: The key cannot be empty!`
          );
          return;
        }
        this.api.config.set("main.auroraApiKey", trimmedKey);
        this.api.chat(`${this.api.getPrefix()} \xA7aAurora API key set successfully!`);
      }
      sendQdMessage(slot) {
        if (!slot || slot < 1 || slot > 5) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cInvalid slot. Use a number from 1 to 5.`
          );
          return;
        }
        const message = this.api.config.get(`autoQdmsg.msg${slot}`);
        if (!message || message.trim().length === 0) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cSlot ${slot} is empty. Use /bwu setqdmsg ${slot} <message> to save.`
          );
          return;
        }
        this.api.sendChatToServer(`/ac ${message}`);
      }
      handleQdmsgCommand(ctx) {
        const slot = Number.parseInt(ctx.args.slot, 10);
        if (Number.isNaN(slot)) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cUsage: /bwu qdmsg <slot_number: 1-5>`
          );
          return;
        }
        this.sendQdMessage(slot);
      }
      handleSetQdmsgCommand(ctx) {
        const slot = Number.parseInt(ctx.args.slot, 10);
        const messageArray = ctx.args.message;
        if (Number.isNaN(slot) || slot < 1 || slot > 5) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cUsage: /bwu setqdmsg <slot: 1-5> <message>`
          );
          return;
        }
        let finalMessage = "";
        if (Array.isArray(messageArray) && messageArray.length > 0) {
          finalMessage = messageArray.join(" ");
        }
        if (finalMessage.length === 0) {
          this.api.config.set(`autoQdmsg.msg${slot}`, "");
          this.api.chat(
            `${this.api.getPrefix()} \xA7aMessage from Slot ${slot} has been cleared.`
          );
          return;
        }
        this.api.config.set(`autoQdmsg.msg${slot}`, finalMessage);
        this.api.chat(
          `${this.api.getPrefix()} \xA7aSlot ${slot} saved: \xA7f${finalMessage}`
        );
      }
      handleListQdmsgCommand(_ctx) {
        this.api.chat(`${this.api.getPrefix()} \xA76Saved Messages (Queue Dodge):`);
        let hasMessages = false;
        for (let i = 1; i <= 5; i++) {
          const msg = this.api.config.get(`autoQdmsg.msg${i}`);
          if (msg && msg.trim().length > 0) {
            hasMessages = true;
            const chatComponent = {
              text: `\xA7eSlot ${i}: \xA7f${msg} `,
              extra: [
                {
                  text: "\xA77[Send]",
                  color: "gray",
                  hoverEvent: {
                    action: "show_text",
                    value: "\xA7aClick to send this message"
                  },
                  clickEvent: {
                    action: "run_command",
                    value: `/bwu qdmsg ${i}`
                  }
                },
                {
                  text: " \xA7c[Edit]",
                  color: "red",
                  hoverEvent: {
                    action: "show_text",
                    value: "\xA7eClick to edit this message"
                  },
                  clickEvent: {
                    action: "suggest_command",
                    value: `/bwu setqdmsg ${i} ${msg}`
                  }
                }
              ]
            };
            this.api.chat(chatComponent);
          } else {
            this.api.chat(`\xA7eSlot ${i}: \xA77[Empty]`);
          }
        }
        if (!hasMessages) {
          this.api.chat(`\xA7cNo saved messages. Use /bwu setqdmsg <1-5> <message>`);
        }
      }
      sendSnipedMessage(slot, channel) {
        if (!slot || slot < 1 || slot > 5) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cInvalid slot. Use a number from 1 to 5.`
          );
          return;
        }
        const message = this.api.config.get(`snipedMsg.msg${slot}`);
        if (!message || message.trim().length === 0) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cSlot ${slot} is empty. Use /bwu setsniped ${slot} <message> to save.`
          );
          return;
        }
        const commandPrefix = channel && channel.toLowerCase() === "ac" ? "/ac" : "/shout";
        if (commandPrefix === "/shout") {
          this.sendShoutWithCooldown(message);
        } else {
          this.api.sendChatToServer(`${commandPrefix} ${message}`);
        }
      }
      sendShoutWithCooldown(message) {
        const now = Date.now();
        const timeSinceLastShout = now - this.lastShoutTime;
        const remainingCooldown = this.shoutCooldown - timeSinceLastShout;
        if (timeSinceLastShout >= this.shoutCooldown) {
          this.bwu._bypassShoutInterception = true;
          this.api.sendChatToServer(`/shout ${message}`);
          this.lastShoutTime = now;
          this.pendingShoutMessage = null;
          if (this.shoutTimer) {
            clearTimeout(this.shoutTimer);
            this.shoutTimer = null;
          }
        } else {
          this.pendingShoutMessage = message;
          if (this.shoutTimer) {
            clearTimeout(this.shoutTimer);
          }
          this.api.debugLog(`[BWU] Queuing shout: "${message}", will send in ${remainingCooldown}ms`);
          this.shoutTimer = setTimeout(() => {
            this.api.debugLog(`[BWU] Shout timer fired! Pending message: "${this.pendingShoutMessage}"`);
            if (this.pendingShoutMessage) {
              this.bwu._bypassShoutInterception = true;
              this.api.sendChatToServer(`/shout ${this.pendingShoutMessage}`);
              this.api.debugLog(`[BWU] Queued shout sent: "${this.pendingShoutMessage}"`);
              this.lastShoutTime = Date.now();
              this.pendingShoutMessage = null;
              this.shoutTimer = null;
            }
          }, remainingCooldown);
          const secondsLeft = Math.round(remainingCooldown / 1e3);
          this.api.chat(
            `${this.api.getPrefix()} \xA7eQueued message: \xA7f"${message}"`
          );
          this.api.chat(
            `${this.api.getPrefix()} \xA7eWill send in \xA7f${secondsLeft}s \xA7e(cooldown active)`
          );
        }
      }
      cancelPendingShout() {
        if (this.shoutTimer) {
          clearTimeout(this.shoutTimer);
          this.shoutTimer = null;
          this.pendingShoutMessage = null;
          return true;
        }
        return false;
      }
      handleSnipedCommand(ctx) {
        const slot = Number.parseInt(ctx.args.slot, 10);
        const channel = ctx.args.channel;
        if (Number.isNaN(slot)) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cUsage: /bwu sniped <slot_number: 1-5> [ac]`
          );
          return;
        }
        this.sendSnipedMessage(slot, channel);
      }
      handleSetSnipedCommand(ctx) {
        const slot = Number.parseInt(ctx.args.slot, 10);
        const messageArray = ctx.args.message;
        if (Number.isNaN(slot) || slot < 1 || slot > 5) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cUsage: /bwu setsniped <slot: 1-5> <message>`
          );
          return;
        }
        let finalMessage = "";
        if (Array.isArray(messageArray) && messageArray.length > 0) {
          finalMessage = messageArray.join(" ");
        }
        if (finalMessage.length === 0) {
          this.api.config.set(`snipedMsg.msg${slot}`, "");
          this.api.chat(
            `${this.api.getPrefix()} \xA7aMessage from Slot ${slot} has been cleared.`
          );
          return;
        }
        this.api.config.set(`snipedMsg.msg${slot}`, finalMessage);
        this.api.chat(
          `${this.api.getPrefix()} \xA7aSlot ${slot} saved: \xA7f${finalMessage}`
        );
      }
      handleListSnipedCommand(_ctx) {
        this.api.chat(`${this.api.getPrefix()} \xA76Saved Messages (Sniped):`);
        let hasMessages = false;
        for (let i = 1; i <= 5; i++) {
          const msg = this.api.config.get(`snipedMsg.msg${i}`);
          if (msg && msg.trim().length > 0) {
            hasMessages = true;
            const chatComponent = {
              text: `\xA7eSlot ${i}: \xA7f${msg} `,
              extra: [
                {
                  text: "\xA77[Send]",
                  color: "gray",
                  hoverEvent: {
                    action: "show_text",
                    value: "\xA7aClick to send this message"
                  },
                  clickEvent: {
                    action: "run_command",
                    value: `/bwu sniped ${i}`
                  }
                },
                {
                  text: " \xA7c[Edit]",
                  color: "red",
                  hoverEvent: {
                    action: "show_text",
                    value: "\xA7eClick to edit this message"
                  },
                  clickEvent: {
                    action: "suggest_command",
                    value: `/bwu setsniped ${i} ${msg}`
                  }
                }
              ]
            };
            this.api.chat(chatComponent);
          } else {
            this.api.chat(`\xA7eSlot ${i}: \xA77[Empty]`);
          }
        }
        if (!hasMessages) {
          this.api.chat(`\xA7cNo saved messages. Use /bwu setsniped <1-5> <message>`);
        }
      }
      handlePingCommand(_ctx) {
        try {
          const player = this.api.getCurrentPlayer();
          if (!player?.uuid) {
            this.api.chat(
              `${this.api.getPrefix()} \xA7cCould not retrieve your player data.`
            );
            return;
          }
          const playerInfo = this.api.getPlayerInfo(player.uuid);
          if (playerInfo?.ping === void 0) {
            this.api.chat(
              `${this.api.getPrefix()} \xA7cCould not retrieve your ping at this time.`
            );
          } else {
            this.api.chat(
              `${this.api.getPrefix()} \xA7aYour ping is: \xA7f${playerInfo.ping}ms`
            );
          }
        } catch (e) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cAn error occurred while fetching ping: ${e.message}`
          );
          console.error(`[BWU Ping Error]: ${e.stack}`);
        }
      }
      async handleMcnamesCommand(ctx) {
        const playerName = ctx.args.ign;
        if (!playerName || typeof playerName !== "string") {
          this.api.chat(`${this.api.getPrefix()} \xA7cUsage: /bwu mcnames <ign>`);
          return;
        }
        try {
          this.api.chat(
            `${this.api.getPrefix()} \xA77Fetching name history for \xA7b${playerName}\xA77...`
          );
          const nameData = await this.apiService.getNameHistory(playerName);
          if (!nameData) {
            this.api.chat(
              `${this.api.getPrefix()} \xA7cCouldn't find name history for \xA7f${playerName}\xA7c.`
            );
            return;
          }
          this.api.chat(
            `${this.api.getPrefix()} \xA7aCurrent name: \xA7f${nameData.currentName}`
          );
          this.api.chat(`${this.api.getPrefix()} \xA77UUID: \xA7f${nameData.uuid}`);
          if (nameData.history.length > 0) {
            this.api.chat(
              `${this.api.getPrefix()} \xA76Name History \xA77(${nameData.history.length} names):`
            );
            nameData.history.forEach((entry, index) => {
              const dateStr = entry.changedAt ? new Date(entry.changedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric"
              }) : "Original";
              const accurateTag = entry.accurate ? "\xA7a\u2713" : "\xA7c\u2717";
              const lastSeen = entry.lastSeenAt ? ` \xA78(Last seen: ${new Date(entry.lastSeenAt).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                }
              )})` : "";
              this.api.chat(
                `${this.api.getPrefix()} \xA77${index + 1}. \xA7f${entry.name} \xA77- \xA7e${dateStr} ${accurateTag}${lastSeen}`
              );
            });
          } else {
            this.api.chat(`${this.api.getPrefix()} \xA77No name history found.`);
          }
        } catch (e) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cAn error occurred while fetching name history: ${e.message}`
          );
          console.error(`[BWU Mcnames Error]: ${e.stack}`);
        }
      }
      handleSetInPartyCommand(ctx) {
        const value = ctx.args.value;
        if (!value) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cUsage: /bwu setinparty <true|false>`
          );
          return;
        }
        const valueLower = value.toLowerCase();
        if (valueLower === "true") {
          this.bwu.inParty = true;
          this.api.chat(
            `${this.api.getPrefix()} \xA7a[DEBUG] inParty set to \xA7ftrue`
          );
        } else if (valueLower === "false") {
          this.bwu.inParty = false;
          this.api.chat(
            `${this.api.getPrefix()} \xA7a[DEBUG] inParty set to \xA7ffalse`
          );
        } else {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cInvalid value. Use \xA7ftrue \xA7cor \xA7ffalse\xA7c.`
          );
        }
      }
      async handleRerankCommand(ctx) {
        try {
          this.api.chat(
            `${this.api.getPrefix()} \xA7eRefreshing team ranking and tab list...`
          );
          this.tabManager.clearManagedPlayers("all");
          this.bwu.rankingSentThisMatch = false;
          this.api.sendChatToServer("/who");
        } catch (error) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cError during rerank: ${error.message}`
          );
          console.error(`[BWU] Rerank error: ${error.stack}`);
        }
      }
      async handleAllStatsCommand(ctx) {
        try {
          const colorFilter = ctx.args.color?.toLowerCase();
          const sendTo = ctx.args.sendTo?.toLowerCase() || "private";
          if (!["private", "team", "party"].includes(sendTo)) {
            this.api.chat(
              `${this.api.getPrefix()} \xA7cInvalid sendTo option! Use: private, team, or party`
            );
            return;
          }
          if (sendTo === "party" && this.bwu.inParty !== true) {
            this.api.chat(
              `${this.api.getPrefix()} \xA7cYou must be in a party to send to party chat!`
            );
            return;
          }
          const colorMap = {
            red: "R",
            blue: "B",
            green: "G",
            yellow: "Y",
            aqua: "A",
            white: "W",
            pink: "P",
            gray: "S",
            grey: "S"
            // Alternative spelling
          };
          const teamNames = {
            R: "Red",
            B: "Blue",
            G: "Green",
            Y: "Yellow",
            A: "Aqua",
            W: "White",
            P: "Pink",
            S: "Gray"
          };
          const managedPlayers = Array.from(this.tabManager.managedPlayers.keys());
          if (managedPlayers.length === 0) {
            this.api.chat(
              `${this.api.getPrefix()} \xA7cNo players tracked. Try running \xA7f/who \xA7cor wait for a game to start!`
            );
            return;
          }
          let playersToShow = [];
          if (colorFilter) {
            const teamLetter = colorMap[colorFilter];
            if (!teamLetter) {
              this.api.chat(
                `${this.api.getPrefix()} \xA7cInvalid color! Valid colors: red, blue, green, yellow, aqua, white, pink, gray`
              );
              return;
            }
            for (const playerName of managedPlayers) {
              const team = this.api.getPlayerTeam(playerName);
              const playerTeamLetter = this._getTeamLetter(team?.prefix);
              if (playerTeamLetter === teamLetter) {
                playersToShow.push(playerName);
              }
            }
            if (playersToShow.length === 0) {
              this.api.chat(
                `${this.api.getPrefix()} \xA7cNo players found on ${teamNames[teamLetter]} team!`
              );
              return;
            }
            const modeText = sendTo === "private" ? "privately" : sendTo === "team" ? "in team chat" : "in party chat";
            this.api.chat(
              `${this.api.getPrefix()} \xA7eShowing stats for \xA7f${playersToShow.length} \xA7eplayers on \xA7f${teamNames[teamLetter]} \xA7eteam ${modeText}...`
            );
          } else {
            playersToShow = managedPlayers;
            const modeText = sendTo === "private" ? "privately" : sendTo === "team" ? "in team chat" : "in party chat";
            this.api.chat(
              `${this.api.getPrefix()} \xA7eShowing stats for \xA7f${playersToShow.length} \xA7eplayers ${modeText}...`
            );
          }
          for (const playerName of playersToShow) {
            const realName = this.bwu.resolvedNicks.get(playerName.toLowerCase()) || playerName;
            const stats = await this.apiService.getPlayerStats(realName);
            let ping = null;
            if (this.api.config.get("stats.showPing.enabled")) {
              const uuid = await this.apiService.getUuid(realName);
              if (uuid) {
                ping = await this.apiService.getPlayerPing(uuid);
              }
            }
            const message = this.bwu.statsFormatter.formatStats(
              "chat",
              playerName,
              stats,
              ping,
              { includePrefix: false }
            );
            if (sendTo === "private") {
              this.api.chat(message);
            } else {
              const cleanMessage = message.replaceAll(/§[0-9a-fk-or]/g, "");
              if (sendTo === "team") {
                this.api.sendChatToServer(`/ac ${cleanMessage}`);
              } else if (sendTo === "party") {
                this.api.sendChatToServer(`/pc ${cleanMessage}`);
              }
            }
            await new Promise((resolve) => setTimeout(resolve, 150));
          }
        } catch (error) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cError showing stats: ${error.message}`
          );
          console.error(`[BWU] AllStats error: ${error.stack}`);
        }
      }
      _getTeamLetter(rawPrefix) {
        if (!rawPrefix) return null;
        const match = rawPrefix.match(/[A-Z]/);
        return match ? match[0] : null;
      }
      handleGameStatsCommand(ctx) {
        this.bwu.inGameTracker.displayGameStats();
      }
      handlePlayerStatsCommand(ctx) {
        const playerName = ctx.args.player;
        if (!playerName) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cUsage: /bwu playerstats <player>`
          );
          return;
        }
        this.bwu.inGameTracker.displayPlayerStats(playerName);
      }
      handleGameTabCommand(ctx) {
        const setting = ctx.args.setting?.toLowerCase();
        const value = ctx.args.value;
        if (!setting) {
          const showInTab = this.api.config.get("inGameTracker.showInTab");
          const delay = this.api.config.get("inGameTracker.tabDelay");
          const showKills = this.api.config.get("inGameTracker.tabShowKills");
          const showDeaths = this.api.config.get("inGameTracker.tabShowDeaths");
          const showFK = this.api.config.get("inGameTracker.tabShowFinalKills");
          const showBB = this.api.config.get("inGameTracker.tabShowBedBreaks");
          this.api.chat(`${this.api.getPrefix()} \xA76\xA7l\u2550\u2550\u2550 Game Tab Settings \u2550\u2550\u2550`);
          this.api.chat(`  \xA77Show In Tab: ${showInTab ? "\xA7aON" : "\xA7cOFF"}`);
          this.api.chat(`  \xA77Delay: \xA7e${delay}s`);
          this.api.chat(`  \xA77Show Kills: ${showKills ? "\xA7aON" : "\xA7cOFF"}`);
          this.api.chat(`  \xA77Show Deaths: ${showDeaths ? "\xA7aON" : "\xA7cOFF"}`);
          this.api.chat(`  \xA77Show Final Kills: ${showFK ? "\xA7aON" : "\xA7cOFF"}`);
          this.api.chat(`  \xA77Show Bed Breaks: ${showBB ? "\xA7aON" : "\xA7cOFF"}`);
          this.api.chat(`  \xA78Usage: /bwu gametab <on|off|kills|deaths|fk|bb|delay> [value]`);
          return;
        }
        switch (setting) {
          case "on":
            this.api.config.set("inGameTracker.showInTab", true);
            this.api.chat(`${this.api.getPrefix()} \xA7aGame stats in tab enabled!`);
            if (this.bwu.inGameTracker.isTracking) {
              this.bwu.tabManager.startTabAlternation();
            }
            break;
          case "off":
            this.api.config.set("inGameTracker.showInTab", false);
            this.api.chat(`${this.api.getPrefix()} \xA7cGame stats in tab disabled!`);
            this.bwu.tabManager.stopTabAlternation();
            break;
          case "kills":
            const newKills = !this.api.config.get("inGameTracker.tabShowKills");
            this.api.config.set("inGameTracker.tabShowKills", newKills);
            this.api.chat(`${this.api.getPrefix()} \xA77Show Kills: ${newKills ? "\xA7aON" : "\xA7cOFF"}`);
            break;
          case "deaths":
            const newDeaths = !this.api.config.get("inGameTracker.tabShowDeaths");
            this.api.config.set("inGameTracker.tabShowDeaths", newDeaths);
            this.api.chat(`${this.api.getPrefix()} \xA77Show Deaths: ${newDeaths ? "\xA7aON" : "\xA7cOFF"}`);
            break;
          case "fk":
            const newFK = !this.api.config.get("inGameTracker.tabShowFinalKills");
            this.api.config.set("inGameTracker.tabShowFinalKills", newFK);
            this.api.chat(`${this.api.getPrefix()} \xA77Show Final Kills: ${newFK ? "\xA7aON" : "\xA7cOFF"}`);
            break;
          case "bb":
            const newBB = !this.api.config.get("inGameTracker.tabShowBedBreaks");
            this.api.config.set("inGameTracker.tabShowBedBreaks", newBB);
            this.api.chat(`${this.api.getPrefix()} \xA77Show Bed Breaks: ${newBB ? "\xA7aON" : "\xA7cOFF"}`);
            break;
          case "delay":
            const delayVal = parseInt(value);
            if (isNaN(delayVal) || delayVal < 5 || delayVal > 10) {
              this.api.chat(`${this.api.getPrefix()} \xA7cDelay must be between 5 and 10 seconds.`);
              return;
            }
            this.api.config.set("inGameTracker.tabDelay", delayVal);
            this.api.chat(`${this.api.getPrefix()} \xA77Tab delay set to \xA7e${delayVal}s`);
            if (this.bwu.tabManager.tabAlternationInterval) {
              this.bwu.tabManager.stopTabAlternation();
              this.bwu.tabManager.startTabAlternation();
            }
            break;
          default:
            this.api.chat(`${this.api.getPrefix()} \xA7cUnknown setting: ${setting}`);
            this.api.chat(`${this.api.getPrefix()} \xA77Usage: /bwu gametab <on|off|kills|deaths|fk|bb|delay> [value]`);
        }
      }
    };
    module2.exports = CommandHandler;
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/handlers/GameHandler.js
var require_GameHandler = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/handlers/GameHandler.js"(exports2, module2) {
    var TEAM_MAP = {
      R: { name: "Red", color: "\xA7c" },
      B: { name: "Blue", color: "\xA79" },
      G: { name: "Green", color: "\xA7a" },
      Y: { name: "Yellow", color: "\xA7e" },
      A: { name: "Aqua", color: "\xA7b" },
      W: { name: "White", color: "\xA7f" },
      P: { name: "Pink", color: "\xA7d" },
      S: { name: "Gray", color: "\xA77" }
    };
    var GameHandler = class {
      constructor(api, chatHandler, tabManager) {
        this.api = api;
        this.chatHandler = chatHandler;
        this.tabManager = tabManager;
        this.gameStarted = false;
        this.lastCleanMessage = null;
        this.myTeamName = null;
      }
      getTeamLetter(rawPrefix) {
        if (!rawPrefix) return null;
        const match = rawPrefix.match(/[A-Z]/);
        return match ? match[0] : null;
      }
      getMyTeamName() {
        try {
          const me = this.api.getCurrentPlayer();
          if (!me?.uuid) return null;
          const myServerInfo = this.api.getPlayerInfo(me.uuid);
          if (!myServerInfo?.name) return null;
          const nameAsSeenByServer = myServerInfo.name;
          const myTeam = this.api.getPlayerTeam(nameAsSeenByServer);
          const myTeamLetter = this.getTeamLetter(myTeam?.prefix);
          return TEAM_MAP[myTeamLetter]?.name || null;
        } catch (e) {
          this.api.debugLog(`[BWU] Error getting team name: ${e.message}`);
          return null;
        }
      }
      isBedwarsStartMessage(currentCleanMessage, lastCleanMessage) {
        const originalStartText = "Protect your bed and destroy the enemy beds.";
        if (currentCleanMessage.trim() === originalStartText) {
          return true;
        }
        const divider = "\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC";
        const validTitles = [
          "Bed Wars Lucky Blocks",
          "Bed Wars Ultimate",
          "Bed Wars Swappage",
          "Bed Wars Duels",
          "Bed Wars Rush",
          "Bed Wars"
        ];
        if (lastCleanMessage && lastCleanMessage.trim() === divider && validTitles.includes(currentCleanMessage.trim())) {
          return true;
        }
        return false;
      }
      async handleGameStart(currentCleanMessage, lastCleanMessage) {
        if (this.api.config.get("autoWho.enabled")) {
          if (!this.gameStarted && this.isBedwarsStartMessage(currentCleanMessage, lastCleanMessage)) {
            this.gameStarted = true;
            const delay = this.api.config.get("autoWho.delay") || 0;
            setTimeout(() => {
              this.api.sendChatToServer("/who");
            }, delay);
          }
        }
        if (this.api.config.get("autoRequeueGameEnd.enabled")) {
          if (this.gameStarted && !this.myTeamName) {
            this.myTeamName = this.getMyTeamName();
            if (this.myTeamName) {
              this.api.debugLog(`[BWU] My team detected as: ${this.myTeamName}`);
            }
          }
        }
      }
      isBedwarsEndMessage(currentCleanMessage) {
        const divider = "\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC\u25AC";
        const endTitle = "Reward Summary";
        const trimmedMessage = currentCleanMessage.trim();
        if (trimmedMessage.startsWith(divider)) {
          const lines = trimmedMessage.split("\n");
          if (lines.length > 1 && lines[1].trim() === endTitle) {
            return true;
          }
        }
        return false;
      }
      isTeamEliminatedMessage(currentCleanMessage) {
        if (!this.myTeamName) return false;
        const eliminationMessage = `TEAM ELIMINATED > ${this.myTeamName} Team has been eliminated!`;
        if (currentCleanMessage.trim() === eliminationMessage) {
          return true;
        }
        return false;
      }
      async handleGameEnd(currentCleanMessage, lastGameMode) {
      }
      resetGameState() {
        this.gameStarted = false;
        this.lastCleanMessage = null;
        this.myTeamName = null;
      }
    };
    module2.exports = GameHandler;
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/features/TeamRanking.js
var require_TeamRanking = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/features/TeamRanking.js"(exports2, module2) {
    var TEAM_MAP = {
      R: { name: "Red", color: "\xA7c" },
      B: { name: "Blue", color: "\xA79" },
      G: { name: "Green", color: "\xA7a" },
      Y: { name: "Yellow", color: "\xA7e" },
      A: { name: "Aqua", color: "\xA7b" },
      W: { name: "White", color: "\xA7f" },
      P: { name: "Pink", color: "\xA7d" },
      S: { name: "Gray", color: "\xA77" }
    };
    var TEAM_ORDER = ["R", "B", "G", "Y", "A", "W", "P", "S"];
    var TeamRanking = class {
      constructor(api, apiService, bwuInstance) {
        this.api = api;
        this.apiService = apiService;
        this.bwu = bwuInstance;
      }
      _sendMessage(message) {
        let sendType = this.api.config.get("teamRanking.sendType") || "team";
        if (sendType === "party" && this.bwu.inParty !== true) {
          sendType = "private";
          this.api.debugLog(`[BWU] Team Ranking sendType: party -> private (not in party)`);
        } else {
          this.api.debugLog(`[BWU] Team Ranking sendType: ${sendType}, inParty: ${this.bwu.inParty}`);
        }
        const cleanMessage = message.replaceAll(/§[0-9a-fk-or]/g, "");
        if (sendType === "private") {
          this.api.chat(message);
        } else if (sendType === "party") {
          this.api.sendChatToServer(`/pc ${cleanMessage}`);
        } else {
          this.api.sendChatToServer(`/ac ${cleanMessage}`);
        }
      }
      getTeamLetter(rawPrefix) {
        if (!rawPrefix) return null;
        const match = rawPrefix.match(/[A-Z]/);
        return match ? match[0] : null;
      }
      getMyTeamLetter() {
        const me = this.api.getCurrentPlayer();
        if (!me?.uuid) return null;
        const myServerInfo = this.api.getPlayerInfo(me.uuid);
        if (!myServerInfo?.name) return null;
        const nameAsSeenByServer = myServerInfo.name;
        const myTeam = this.api.getPlayerTeam(nameAsSeenByServer);
        return this.getTeamLetter(myTeam?.prefix);
      }
      /**
       * Calculate a normalized threat score for a player.
       * Uses sigmoid-based normalization to convert raw stats to 0-1 scale,
       * then applies weightage: 70% FKDR, 10% WLR, 15% Winstreak, 5% Stars
       * 
       * @param {number} fkdr - Final Kills/Deaths Ratio
       * @param {number} wlr - Win/Loss Ratio
       * @param {number} winstreak - Current winstreak
       * @param {number} stars - Star level (prestige)
       * @returns {number} Normalized threat score (0-100)
       */
      calculateThreatScore(fkdr, wlr, winstreak, stars) {
        const normalizedFkdr = 1 / (1 + Math.exp(-0.8 * (fkdr - 3)));
        const normalizedWlr = 1 / (1 + Math.exp(-1 * (wlr - 2)));
        const normalizedWinstreak = 1 / (1 + Math.exp(-0.5 * (winstreak - 3)));
        const normalizedStars = 1 / (1 + Math.exp(-0.01 * (stars - 250)));
        const weightedScore = 0.7 * normalizedFkdr + 0.1 * normalizedWlr + 0.15 * normalizedWinstreak + 0.05 * normalizedStars;
        return weightedScore * 100;
      }
      async processAndDisplayRanking(playerNames, rankingSent) {
        if (!this.api.config.get("teamRanking.enabled")) {
          return;
        }
        this.api.chat(
          `${this.api.getPrefix()} \xA7eAnalyzing ${playerNames.length} players for team ranking...`
        );
        const myTeamLetter = this.getMyTeamLetter();
        if (!myTeamLetter) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cUnable to detect your team. Ranking will not be calculated.`
          );
          return;
        }
        const { teamsData, isSolosMode } = await this.collectTeamsData(
          playerNames,
          myTeamLetter
        );
        await this.displayFirstRushes(playerNames, teamsData);
        await this.displayRanking(teamsData, isSolosMode, rankingSent);
      }
      async collectTeamsData(playerNames, myTeamLetter) {
        const teamsData = {};
        const teamPlayerCounts = {};
        await Promise.all(
          playerNames.map(async (playerName) => {
            const team = this.api.getPlayerTeam(playerName);
            const teamLetter = this.getTeamLetter(team?.prefix);
            if (teamLetter) {
              teamPlayerCounts[teamLetter] = (teamPlayerCounts[teamLetter] || 0) + 1;
            }
            if (!teamLetter) return;
            const isMyTeam = teamLetter === myTeamLetter;
            if (isMyTeam && !this.api.config.get("teamRanking.showYourTeam")) {
              return;
            }
            const realName = this.bwu.resolvedNicks.get(playerName.toLowerCase()) || playerName;
            const stats = await this.apiService.getPlayerStats(realName);
            const fkdr = stats && !stats.isNicked && stats.fkdr !== void 0 ? stats.fkdr : 5;
            const stars = stats && !stats.isNicked && stats.stars !== void 0 ? stats.stars : 500;
            const wlr = stats && !stats.isNicked && stats.wlr !== void 0 ? stats.wlr : 3;
            const winstreak = stats && !stats.isNicked && stats.winstreak !== void 0 ? stats.winstreak : 5;
            const threat = this.calculateThreatScore(fkdr, wlr, winstreak, stars);
            if (!teamsData[teamLetter]) {
              teamsData[teamLetter] = {
                totalFkdr: 0,
                totalStars: 0,
                totalWlr: 0,
                totalWinstreak: 0,
                totalThreat: 0,
                playerCount: 0,
                isMyTeam
              };
            }
            teamsData[teamLetter].totalFkdr += fkdr;
            teamsData[teamLetter].totalStars += stars;
            teamsData[teamLetter].totalWlr += wlr;
            teamsData[teamLetter].totalWinstreak += winstreak;
            teamsData[teamLetter].totalThreat += threat;
            teamsData[teamLetter].playerCount += 1;
          })
        );
        const myTeamSize = teamPlayerCounts[myTeamLetter] || 1;
        const isSolosMode = myTeamSize <= 1;
        return { teamsData, isSolosMode };
      }
      async displayRanking(teamsData, isSolosMode, rankingSent) {
        if (rankingSent) return;
        const useSeparateMessages = this.api.config.get(
          "teamRanking.separateMessages"
        );
        const displayMode = this.api.config.get("teamRanking.displayMode") || "total";
        const maxTeams = this.api.config.get("teamRanking.maxTeams") || 3;
        const showYourTeam = this.api.config.get("teamRanking.showYourTeam") || false;
        const allTeams = Object.entries(teamsData).map(([letter, data]) => ({
          letter,
          name: TEAM_MAP[letter]?.name || "Unknown",
          totalFkdr: data.totalFkdr,
          totalStars: data.totalStars,
          totalWlr: data.totalWlr,
          totalWinstreak: data.totalWinstreak,
          totalThreat: data.totalThreat,
          playerCount: data.playerCount,
          isMyTeam: data.isMyTeam || false
        }));
        const enemyTeams = allTeams.filter((team) => !team.isMyTeam).sort((a, b) => b.totalThreat - a.totalThreat);
        const myTeam = allTeams.find((team) => team.isMyTeam);
        if (enemyTeams.length === 0) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cUnable to calculate ranking (no enemy team found).`
          );
          return;
        }
        const teamsToShow = enemyTeams.slice(0, Math.min(maxTeams, enemyTeams.length));
        const rankingParts = teamsToShow.map((team, index) => {
          const teamColor = TEAM_MAP[team.letter]?.color || "\xA77";
          let statsDisplay;
          const count = Math.max(1, team.playerCount);
          if (displayMode === "avg") {
            const avgFkdr = (team.totalFkdr / count).toFixed(2);
            const avgStars = Math.round(team.totalStars / count);
            statsDisplay = `${avgStars}\u272B | ${avgFkdr} FKDR`;
          } else {
            const totalStars = Math.round(team.totalStars);
            statsDisplay = `${totalStars}\u272B | ${team.totalFkdr.toFixed(2)} FKDR`;
          }
          const teamInfo = `${index + 1}. ${teamColor}${team.name} \xA7f(${statsDisplay})`;
          return teamInfo;
        });
        if (showYourTeam && myTeam) {
          const teamColor = TEAM_MAP[myTeam.letter]?.color || "\xA77";
          let statsDisplay;
          const count = Math.max(1, myTeam.playerCount);
          if (displayMode === "avg") {
            const avgFkdr = (myTeam.totalFkdr / count).toFixed(2);
            const avgStars = Math.round(myTeam.totalStars / count);
            statsDisplay = `${avgStars}\u272B | ${avgFkdr} FKDR`;
          } else {
            const totalStars = Math.round(myTeam.totalStars);
            statsDisplay = `${totalStars}\u272B | ${myTeam.totalFkdr.toFixed(2)} FKDR`;
          }
          const yourTeamInfo = `\xA77[YOU] ${teamColor}${myTeam.name} \xA7f(${statsDisplay})`;
          rankingParts.push(yourTeamInfo);
        }
        if (useSeparateMessages) {
          let index = 0;
          for (const part of rankingParts) {
            setTimeout(() => {
              this._sendMessage(part);
            }, index * 350);
            index++;
          }
        } else {
          const targetMessage = rankingParts.shift();
          this._sendMessage(targetMessage);
          if (rankingParts.length > 0) {
            this.sendRankingMessages(rankingParts);
          }
        }
      }
      sendRankingMessages(rankingParts) {
        const messagesToSend = [];
        let currentMessage = "";
        const CHAT_LIMIT = 240;
        const SEPARATOR = " \xA76//\xA7f ";
        for (const part of rankingParts) {
          if (currentMessage === "") {
            currentMessage = part;
          } else if (currentMessage.length + SEPARATOR.length + part.length > CHAT_LIMIT) {
            messagesToSend.push(currentMessage);
            currentMessage = part;
          } else {
            currentMessage += SEPARATOR + part;
          }
        }
        if (currentMessage) {
          messagesToSend.push(currentMessage);
        }
        for (let i = 0; i < messagesToSend.length; i++) {
          const msg = messagesToSend[i];
          setTimeout(() => {
            this._sendMessage(msg);
          }, (i + 1) * 350);
        }
      }
      /**
       * Get the two neighboring teams based on team order
       * Order: Red, Blue, Green, Yellow, Aqua, White, Pink, Gray
       * Returns the teams on the left and right in the circular order
       * @param {string} myTeamLetter - The letter of your team (R, B, G, Y, A, W, P, S)
       * @returns {Array<string>} Array of two neighboring team letters [left, right]
       */
      getNeighboringTeams(myTeamLetter) {
        const myIndex = TEAM_ORDER.indexOf(myTeamLetter);
        if (myIndex === -1) return [];
        const teamCount = TEAM_ORDER.length;
        const leftIndex = (myIndex - 1 + teamCount) % teamCount;
        const rightIndex = (myIndex + 1) % teamCount;
        return [TEAM_ORDER[leftIndex], TEAM_ORDER[rightIndex]];
      }
      /**
       * Display stats of neighboring teams at game start
       * @param {Array<string>} playerNames - List of all player names from /who
       * @param {Object} teamsData - Team data collected from collectTeamsData
       */
      async displayFirstRushes(playerNames, teamsData) {
        if (!this.api.config.get("teamRanking.firstRushes")) {
          return;
        }
        const myTeamLetter = this.getMyTeamLetter();
        if (!myTeamLetter) {
          return;
        }
        const neighboringTeams = this.getNeighboringTeams(myTeamLetter);
        if (neighboringTeams.length === 0) {
          return;
        }
        const playersByTeam = {};
        for (const playerName of playerNames) {
          const team = this.api.getPlayerTeam(playerName);
          const teamLetter = this.getTeamLetter(team?.prefix);
          if (teamLetter && neighboringTeams.includes(teamLetter)) {
            if (!playersByTeam[teamLetter]) {
              playersByTeam[teamLetter] = [];
            }
            playersByTeam[teamLetter].push(playerName);
          }
        }
        const MESSAGE_DELAY = 1200;
        for (const teamLetter of neighboringTeams) {
          const players = playersByTeam[teamLetter];
          if (!players || players.length === 0) {
            continue;
          }
          const teamInfo = TEAM_MAP[teamLetter];
          const teamData = teamsData[teamLetter];
          if (!teamInfo || !teamData) {
            continue;
          }
          const allEnemyTeams = Object.entries(teamsData).filter(([letter, data]) => letter !== myTeamLetter).map(([letter, data]) => ({ letter, threat: data.totalThreat })).sort((a, b) => b.threat - a.threat);
          const ranking = allEnemyTeams.findIndex((t) => t.letter === teamLetter) + 1;
          const header = `${teamInfo.color}${teamInfo.name} ${ranking > 0 ? `\xA77(#${ranking})` : ""}\xA77:`;
          this._sendMessage(header);
          await new Promise((resolve) => setTimeout(resolve, MESSAGE_DELAY));
          for (const playerName of players) {
            const realName = this.bwu.resolvedNicks.get(playerName.toLowerCase()) || playerName;
            const stats = await this.apiService.getPlayerStats(realName);
            let ping = null;
            if (this.api.config.get("stats.showPing.enabled")) {
              const uuid = await this.apiService.getUuid(realName);
              if (uuid) {
                ping = await this.apiService.getPlayerPing(uuid);
              }
            }
            const message = this.bwu.statsFormatter.formatStats(
              "chat",
              playerName,
              stats,
              ping,
              { includePrefix: false }
            );
            this._sendMessage(`  ${message}`);
            await new Promise((resolve) => setTimeout(resolve, MESSAGE_DELAY));
          }
        }
        await new Promise((resolve) => setTimeout(resolve, MESSAGE_DELAY));
      }
    };
    module2.exports = TeamRanking;
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/features/TabManager.js
var require_TabManager = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/features/TabManager.js"(exports2, module2) {
    var TabManager = class {
      constructor(api, apiService, statsFormatter, bwuInstance) {
        this.api = api;
        this.apiService = apiService;
        this.statsFormatter = statsFormatter;
        this.bwu = bwuInstance;
        this.managedPlayers = /* @__PURE__ */ new Map();
        this.showingGameStats = false;
        this.tabAlternationInterval = null;
        this.cachedRegularStats = /* @__PURE__ */ new Map();
      }
      /**
       * Start alternating between regular stats and game stats in tab
       */
      startTabAlternation() {
        if (this.tabAlternationInterval) {
          return;
        }
        if (!this.api.config.get("inGameTracker.showInTab")) {
          return;
        }
        const delaySeconds = this.api.config.get("inGameTracker.tabDelay") || 5;
        const delayMs = delaySeconds * 1e3;
        this.api.debugLog(`[BWU TabManager] Starting tab alternation with ${delaySeconds}s delay`);
        this.tabAlternationInterval = setInterval(() => {
          this._toggleTabStats();
        }, delayMs);
      }
      /**
       * Stop tab alternation and restore regular stats
       */
      stopTabAlternation() {
        if (this.tabAlternationInterval) {
          clearInterval(this.tabAlternationInterval);
          this.tabAlternationInterval = null;
        }
        if (this.showingGameStats) {
          this.showingGameStats = false;
          this._restoreRegularStats();
        }
        this.cachedRegularStats.clear();
        this.api.debugLog(`[BWU TabManager] Stopped tab alternation`);
      }
      /**
       * Toggle between regular stats and game stats display
       */
      _toggleTabStats() {
        if (!this.bwu.inGameTracker.isTracking) {
          return;
        }
        this.showingGameStats = !this.showingGameStats;
        if (this.showingGameStats) {
          this._showGameStats();
        } else {
          this._restoreRegularStats();
        }
      }
      /**
       * Show game stats in tab for all managed players
       */
      _showGameStats() {
        for (const [playerName, data] of this.managedPlayers.entries()) {
          if (!data.uuid) continue;
          const gameStats = this.bwu.inGameTracker.getPlayerStats(playerName);
          if (!gameStats) continue;
          const gameStatsSuffix = this.statsFormatter.formatGameStatsForTab(gameStats);
          if (gameStatsSuffix) {
            this.api.setDisplayNameSuffix(data.uuid, gameStatsSuffix);
          }
        }
      }
      /**
       * Restore regular stats from cache
       */
      _restoreRegularStats() {
        for (const [playerName, data] of this.managedPlayers.entries()) {
          if (!data.uuid) continue;
          const cachedSuffix = this.cachedRegularStats.get(playerName);
          if (cachedSuffix) {
            this.api.setDisplayNameSuffix(data.uuid, cachedSuffix);
          }
        }
      }
      /**
       * Update game stats for a specific player (called when stats change)
       */
      updatePlayerGameStats(playerName) {
        if (!this.showingGameStats) return;
        if (!this.api.config.get("inGameTracker.showInTab")) return;
        const data = this.managedPlayers.get(playerName);
        if (!data?.uuid) return;
        const gameStats = this.bwu.inGameTracker.getPlayerStats(playerName);
        if (!gameStats) return;
        const gameStatsSuffix = this.statsFormatter.formatGameStatsForTab(gameStats);
        if (gameStatsSuffix) {
          this.api.setDisplayNameSuffix(data.uuid, gameStatsSuffix);
        }
      }
      clearManagedPlayers(type = "all") {
        for (const [name, data] of this.managedPlayers.entries()) {
          if (type === "all" || data.type === type) {
            if (data.uuid) {
              this.api.clearDisplayNameSuffix(data.uuid);
            }
            this.managedPlayers.delete(name);
            this.cachedRegularStats.delete(name);
          }
        }
      }
      async addPlayerStatsToTab(originalPlayerName, resolvedPlayerName) {
        try {
          let player = null;
          const me = this.api.getCurrentPlayer();
          const myRealName = me ? me.name : null;
          if (myRealName && resolvedPlayerName.toLowerCase() === myRealName.toLowerCase()) {
            player = me;
            const playerByNick = this.api.getPlayerByName(originalPlayerName);
            if (playerByNick) {
              player.uuid = playerByNick.uuid;
            }
          } else {
            player = this.api.getPlayerByName(originalPlayerName);
          }
          if (!player?.uuid) {
            return;
          }
          if (this.managedPlayers.has(originalPlayerName)) return;
          const finalNameForStats = resolvedPlayerName || originalPlayerName;
          const promises = [this.apiService.getPlayerStats(finalNameForStats)];
          if (this.api.config.get("stats.showPing")) {
            const pingPromise = (async () => {
              const realUuid = await this.apiService.getUuid(finalNameForStats);
              if (realUuid) {
                return this.apiService.getPlayerPing(realUuid);
              }
              return null;
            })();
            promises.push(pingPromise);
          } else {
            promises.push(Promise.resolve(null));
          }
          const [stats, ping] = await Promise.all(promises);
          const statsSuffix = this.statsFormatter.formatStats(
            "tab",
            finalNameForStats,
            stats,
            ping
          );
          this.cachedRegularStats.set(originalPlayerName, statsSuffix);
          if (!this.showingGameStats) {
            this.api.setDisplayNameSuffix(player.uuid, statsSuffix);
          } else {
            const gameStats = this.bwu.inGameTracker.getPlayerStats(originalPlayerName);
            if (gameStats) {
              const gameStatsSuffix = this.statsFormatter.formatGameStatsForTab(gameStats);
              this.api.setDisplayNameSuffix(player.uuid, gameStatsSuffix || statsSuffix);
            } else {
              this.api.setDisplayNameSuffix(player.uuid, statsSuffix);
            }
          }
          this.managedPlayers.set(originalPlayerName, {
            type: "auto-stats",
            uuid: player.uuid
          });
        } catch (error) {
          console.error(
            `[BWU] Failed to add stats to tab for ${originalPlayerName}: ${error.stack}`
          );
        }
      }
    };
    module2.exports = TabManager;
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/features/PartyFinder.js
var require_PartyFinder = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/features/PartyFinder.js"(exports2, module2) {
    var PartyFinder = class {
      constructor(api, apiService) {
        this.api = api;
        this.apiService = apiService;
        this.messageSuffixes = ["o/", "hello", "hi", "<3"];
        this.resetState();
      }
      resetState() {
        this.isActive = false;
        this.state = null;
        clearTimeout(this.messageLoopTimeout);
      }
      start(args) {
        if (this.isActive) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cParty finder is already active. Use /bwu find stop.`
          );
          return;
        }
        const [mode, playersToFind, fkdrThreshold, ...positions] = args;
        if (!["2", "3", "4"].includes(mode) || !["1", "2", "3"].includes(playersToFind) || Number.isNaN(Number.parseFloat(fkdrThreshold))) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cInvalid arguments. Usage: /bwu find (mode) <2|3|4> (people) <1|2|3> <fkdr> <role1> <role2>...`
          );
          return;
        }
        const playersToFindNum = Number.parseInt(playersToFind);
        const modeNum = Number.parseInt(mode);
        if (playersToFindNum >= modeNum) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cError: The number of players to find (${playersToFindNum})\xA7c must be less \xA7cthan the mode size (${modeNum})\xA7c.`
          );
          return;
        }
        const initialVacancies = [];
        for (let i = 0; i < playersToFindNum; i++) {
          initialVacancies.push(positions[i] || "any");
        }
        this.state = {
          mode: Number.parseInt(mode),
          playersToFind: playersToFindNum,
          fkdrThreshold: Number.parseFloat(fkdrThreshold),
          vacancies: initialVacancies,
          foundPlayers: [],
          myNick: null,
          currentSuffixIndex: -1,
          isProcessing: false
        };
        this.isActive = true;
        this.api.chat(`${this.api.getPrefix()} \xA7aStarting party finder...`);
        this.executeNextStep();
      }
      stop() {
        if (!this.isActive) {
          this.api.chat(`${this.api.getPrefix()} \xA7cParty finder is not active.`);
          return;
        }
        this.resetState();
        this.api.chat(`${this.api.getPrefix()} \xA7cParty finder stopped.`);
      }
      async executeNextStep() {
        if (!this.isActive) return;
        if (this.state.vacancies.length === 0) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7aFinished finding all players! Party is full.`
          );
          this.resetState();
          return;
        }
        const me = this.api.getCurrentPlayer();
        if (!me?.uuid) return this.stop();
        this.state.myNick = this.api.getPlayerInfo(me.uuid)?.name || me.name;
        if (this.state.foundPlayers.length === 0) {
          this.api.sendChatToServer("/bedwars");
          await this.sleep(1e3);
          this.api.sendChatToServer("/swaplobby 1");
          await this.sleep(3e3);
        }
        this.state.isProcessing = false;
        this.startMessageLoop();
      }
      startMessageLoop() {
        if (!this.isActive || this.state.isProcessing) return;
        this.state.currentSuffixIndex = (this.state.currentSuffixIndex + 1) % this.messageSuffixes.length;
        const suffix = this.messageSuffixes[this.state.currentSuffixIndex];
        const currentPartySize = this.state.mode - this.state.vacancies.length;
        const position = this.state.vacancies[0];
        const message = `/ac ${currentPartySize}/${this.state.mode} ${position} ${suffix}`;
        this.api.chat(
          `${this.api.getPrefix()} \xA7eLooking for player ${this.state.foundPlayers.length + 1}/${this.state.playersToFind} (Role: ${position}). Sending: ${message}`
        );
        this.api.sendChatToServer(message);
        const isLastSuffix = this.state.currentSuffixIndex === this.messageSuffixes.length - 1;
        const nextDelay = isLastSuffix ? 15e3 : 1e4;
        this.messageLoopTimeout = setTimeout(
          () => this.startMessageLoop(),
          nextDelay
        );
      }
      async handleChatMessage(cleanMessage) {
        if (!this.isActive || !this.state) return;
        if (this.state.foundPlayers.length > 0) {
          if (this._handlePartyLeave(cleanMessage)) {
            return;
          }
        }
        if (this.state.isProcessing && this.state.waitingForPlayer) {
          if (this._handleInviteResponse(cleanMessage)) {
            return;
          }
        }
        if (!this.state.isProcessing) {
          this._handleMention(cleanMessage);
        }
      }
      _handlePartyLeave(cleanMessage) {
        const leaveRegex = /^(\[.*?\]\s)?(\w{3,16}) has left the party\.$/i;
        const leaveMatch = cleanMessage.match(leaveRegex);
        if (leaveMatch) {
          const playerNameWhoLeft = leaveMatch[2];
          const playerIndex = this.state.foundPlayers.findIndex(
            (p) => p.name.toLowerCase() === playerNameWhoLeft.toLowerCase()
          );
          if (playerIndex > -1) {
            clearTimeout(this.messageLoopTimeout);
            const playerInfo = this.state.foundPlayers[playerIndex];
            this.api.chat(
              `${this.api.getPrefix()} \xA7c${playerInfo.name} left. Finding replacement for: ${playerInfo.position}...`
            );
            this.state.foundPlayers.splice(playerIndex, 1);
            this.state.vacancies.unshift(playerInfo.position);
            this.executeNextStep();
            return true;
          }
        }
        return false;
      }
      _handleInviteResponse(cleanMessage) {
        const waitingFor = this.state.waitingForPlayer;
        const joinRegex = new RegExp(
          `^(\\[.*?\\]\\s)?${waitingFor} joined the party\\.$`,
          "i"
        );
        const expireRegex = new RegExp(
          `^The party invite to .*${waitingFor} has expired.*$`,
          "i"
        );
        if (joinRegex.test(cleanMessage)) {
          this.api.chat(`${this.api.getPrefix()} \xA7a${waitingFor} joined!`);
          const filledPosition = this.state.vacancies.shift();
          this.state.foundPlayers.push({
            name: waitingFor,
            position: filledPosition
          });
          this.sleep(1500).then(() => this.executeNextStep());
          return true;
        } else if (expireRegex.test(cleanMessage)) {
          this.api.chat(
            `${this.api.getPrefix()} \xA7cInvite expired. Resuming search...`
          );
          this.sleep(1500).then(() => this.executeNextStep());
          return true;
        }
        return false;
      }
      async _handleMention(cleanMessage) {
        const chatRegex = /^(?:\[.*?\]\s*)*(\w{3,16})(?::| ») (.*)/;
        const match = cleanMessage.match(chatRegex);
        if (match) {
          const senderName = match[1];
          const messageContent = match[2];
          const alreadyFound = this.state.foundPlayers.some(
            (p) => p.name.toLowerCase() === senderName.toLowerCase()
          );
          if (messageContent.toLowerCase().includes(this.state.myNick.toLowerCase()) && !alreadyFound) {
            this.state.isProcessing = true;
            clearTimeout(this.messageLoopTimeout);
            this.api.chat(
              `${this.api.getPrefix()} \xA7aMention by ${senderName}. Checking stats...`
            );
            const stats = await this.apiService.getPlayerStats(senderName);
            if (stats && stats.fkdr >= this.state.fkdrThreshold) {
              this.state.waitingForPlayer = senderName;
              this.api.chat(
                `${this.api.getPrefix()} \xA7a${senderName} has ${stats.fkdr.toFixed(
                  2
                )} FKDR. Inviting...`
              );
              this.api.sendChatToServer(`/p invite ${senderName}`);
            } else {
              const reason = stats ? `FKDR too low (${stats.fkdr.toFixed(2)})` : "Stats not found";
              this.api.chat(
                `${this.api.getPrefix()} \xA7cSkipping ${senderName}: ${reason}.`
              );
              this.state.isProcessing = false;
              this.startMessageLoop();
            }
          }
        }
      }
      sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
      }
    };
    module2.exports = PartyFinder;
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/features/InGameTracker.js
var require_InGameTracker = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/features/InGameTracker.js"(exports2, module2) {
    var fs = require("fs");
    var path2 = require("path");
    var InGameTracker = class {
      constructor(api, apiService, bwuInstance) {
        this.api = api;
        this.apiService = apiService;
        this.bwuInstance = bwuInstance;
        this.isTracking = false;
        this.playerStats = /* @__PURE__ */ new Map();
        this.gamePlayers = /* @__PURE__ */ new Set();
        this.teamBeds = /* @__PURE__ */ new Map();
        this.chatLog = [];
        this.logFilePath = null;
        const P = "([a-zA-Z0-9_]+)";
        this.patterns = {
          // Bed destruction: "BED DESTRUCTION > [anything] by/to/after seeing PlayerName!"
          // Also handles possessive: "melted by PlayerName's holiday spirit!"
          // Also handles "had to raise the white flag to PlayerName!"
          bedDestroyed: /^BED DESTRUCTION > .+?(?:by|to|after seeing) ([a-zA-Z0-9_]+?)(?:'s .+)?!$/,
          // Final kill patterns - checked after environment deaths
          // Order: most specific first, generic last
          finalKill: [
            // "PlayerName was KillerName's final #2,850. FINAL KILL!"
            new RegExp(`^${P} was ${P}'s final #[\\d,]+\\. FINAL KILL!$`, "i"),
            // Environment final kills (no killer - victim only)
            new RegExp(`^${P} fell into the void\\. FINAL KILL!$`),
            // Mutual final kill: "Player1 fought to the edge with Player2. FINAL KILL!"
            new RegExp(`^${P} fought to the edge with ${P}\\. FINAL KILL!$`),
            // "died in close combat to Player. FINAL KILL!"
            new RegExp(`^${P} died in close combat to ${P}\\. FINAL KILL!$`),
            // "took the L to Player. FINAL KILL!"
            new RegExp(`^${P} took the L to ${P}\\. FINAL KILL!$`),
            // "slipped into void for Player. FINAL KILL!"
            new RegExp(`^${P} slipped into void for ${P}\\. FINAL KILL!$`),
            // "hit the hard-wood floor because of Player. FINAL KILL!"
            new RegExp(`^${P} hit the hard-wood floor because of ${P}\\. FINAL KILL!$`),
            // "was hit off by a love bomb from Player. FINAL KILL!"
            new RegExp(`^${P} was hit off by a love bomb from ${P}\\. FINAL KILL!$`),
            // "was distracted by a piglet from Player. FINAL KILL!"
            new RegExp(`^${P} was distracted by a piglet from ${P}\\. FINAL KILL!$`),
            // "was struck down by Player. FINAL KILL!"
            new RegExp(`^${P} was struck down by ${P}\\. FINAL KILL!$`),
            // "was too shy to meet Player. FINAL KILL!"
            new RegExp(`^${P} was too shy to meet ${P}\\. FINAL KILL!$`),
            // "howled into the void for Player. FINAL KILL!"
            new RegExp(`^${P} howled into the void for ${P}\\. FINAL KILL!$`),
            // "had a small brain moment while fighting Player. FINAL KILL!"
            new RegExp(`^${P} had a small brain moment while fighting ${P}\\. FINAL KILL!$`),
            // "was banished into the ether by Player's holiday spirit. FINAL KILL!"
            new RegExp(`^${P} was banished into the ether by ${P}'s .+\\. FINAL KILL!$`, "i"),
            // Generic "by Player. FINAL KILL!" - last resort
            new RegExp(`^${P} .+? by ${P}\\. FINAL KILL!$`, "i"),
            // Generic "to/for/from/against/with Player. FINAL KILL!" - last resort
            new RegExp(`^${P} .+?(?:to|for|from|against|with) ${P}\\. FINAL KILL!$`, "i")
          ],
          // Regular kill patterns - checked after environment deaths
          // Order: most specific first, generic last
          kill: [
            // Direct "was [verb] by Player." patterns
            new RegExp(`^${P} was killed by ${P}\\.$`),
            new RegExp(`^${P} was bested by ${P}\\.$`),
            new RegExp(`^${P} was crushed into moon dust by ${P}\\.$`),
            new RegExp(`^${P} was sent the wrong way by ${P}\\.$`),
            new RegExp(`^${P} was turned to dust by ${P}\\.$`),
            new RegExp(`^${P} was thrown down a pit by ${P}\\.$`),
            new RegExp(`^${P} was given the cold shoulder by ${P}\\.$`),
            new RegExp(`^${P} was glazed in BBQ sauce by ${P}\\.$`),
            new RegExp(`^${P} was struck down by ${P}\\.$`),
            new RegExp(`^${P} was knocked off a cliff by ${P}\\.$`),
            new RegExp(`^${P} was knocked into the void by ${P}\\.$`),
            // "was not spicy enough for Player."
            new RegExp(`^${P} was not spicy enough for ${P}\\.$`),
            // "was too shy to meet Player."
            new RegExp(`^${P} was too shy to meet ${P}\\.$`),
            // "was hit off by a love bomb from Player."
            new RegExp(`^${P} was hit off by a love bomb from ${P}\\.$`),
            // "was distracted by a piglet from Player."
            new RegExp(`^${P} was distracted by a piglet from ${P}\\.$`),
            // "was not able to block clutch against Player."
            new RegExp(`^${P} was not able to block clutch against ${P}\\.$`),
            // "was banished into the ether by Player's holiday spirit."
            new RegExp(`^${P} was banished into the ether by ${P}'s .+\\.$`),
            // "slipped in BBQ sauce off the edge spilled by Player."
            new RegExp(`^${P} slipped in BBQ sauce off the edge spilled by ${P}\\.$`),
            // "died in close combat to Player."
            new RegExp(`^${P} died in close combat to ${P}\\.$`),
            // "took the L to Player."
            new RegExp(`^${P} took the L to ${P}\\.$`),
            // "hit the hard-wood floor because of Player."
            new RegExp(`^${P} hit the hard-wood floor because of ${P}\\.$`),
            // "slipped into void for Player."
            new RegExp(`^${P} slipped into void for ${P}\\.$`),
            // "howled into the void for Player."
            new RegExp(`^${P} howled into the void for ${P}\\.$`),
            // "lost a drinking contest with Player."
            new RegExp(`^${P} lost a drinking contest with ${P}\\.$`),
            // "didn't distance themselves properly from Player."
            new RegExp(`^${P} didn't distance themselves properly from ${P}\\.$`),
            // "had a small brain moment while fighting Player."
            new RegExp(`^${P} had a small brain moment while fighting ${P}\\.$`),
            // Generic "by Player." - last resort
            new RegExp(`^${P} .+? by ${P}\\.$`),
            // Generic "to/for/from/against/with Player." - last resort
            new RegExp(`^${P} .+?(?:to|for|from|against|with) ${P}\\.$`)
          ],
          // Environment deaths (no killer involved)
          // Note: These MUST be checked BEFORE kill patterns to avoid false positives
          environmentDeath: [
            new RegExp(`^${P} fell into the void\\.$`),
            new RegExp(`^${P} died\\.$`),
            new RegExp(`^${P} disconnected\\.$`),
            new RegExp(`^${P} burned to death\\.$`),
            new RegExp(`^${P} forgot how many blocks they had left\\.$`),
            new RegExp(`^${P} was pushed into the void\\.$`),
            new RegExp(`^${P} fell off the world\\.$`),
            new RegExp(`^${P} had a small brain moment\\.$`)
          ],
          // Environment final kills (victim dies to environment with no killer, but it's a final kill)
          environmentFinalKill: [
            new RegExp(`^${P} fell into the void\\. FINAL KILL!$`),
            new RegExp(`^${P} died\\. FINAL KILL!$`),
            new RegExp(`^${P} disconnected\\. FINAL KILL!$`),
            new RegExp(`^${P} burned to death\\. FINAL KILL!$`)
          ],
          // Mutual death (both players die)
          mutualDeath: new RegExp(`^${P} fought to the edge with ${P}\\.$`),
          // Mutual final kill (both players die, it's a final kill)
          mutualFinalKill: new RegExp(`^${P} fought to the edge with ${P}\\. FINAL KILL!$`)
        };
      }
      /**
      * Start tracking when game begins
      * @param {Set<string>} playerNames - Set of player names in the game
      */
      startTracking(playerNames) {
        this.isTracking = true;
        this.gamePlayers = new Set(playerNames);
        this.playerStats.clear();
        this.teamBeds.clear();
        this.chatLog = [];
        for (const player of playerNames) {
          this.playerStats.set(player, {
            bedsBroken: 0,
            kills: 0,
            deaths: 0,
            finalKills: 0
          });
        }
        if (this.api.config.get("inGameTracker.saveGameLogs")) {
          const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-").slice(0, -5);
          const baseDir = process.pkg ? path2.dirname(process.execPath) : path2.join(__dirname, "..", "..", "..");
          const logsDir = path2.join(baseDir, "data", "tracker_logs");
          if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
          }
          this.logFilePath = path2.join(logsDir, `game_${timestamp}.log`);
          this.api.debugLog(`[BWU InGameTracker] Log file: ${this.logFilePath}`);
          this.writeToLog("=".repeat(80));
          this.writeToLog(`BEDWARS GAME TRACKER LOG - ${(/* @__PURE__ */ new Date()).toISOString()}`);
          this.writeToLog("=".repeat(80));
          this.writeToLog(`Players in game: ${Array.from(playerNames).join(", ")}`);
          this.writeToLog("=".repeat(80));
          this.writeToLog("");
        } else {
          this.logFilePath = null;
        }
        this.api.debugLog(`[BWU InGameTracker] Started tracking ${playerNames.size} players`);
        if (this.bwuInstance.tabManager) {
          this.bwuInstance.tabManager.startTabAlternation();
        }
      }
      /**
      * Stop tracking when game ends
      */
      stopTracking() {
        if (!this.isTracking) return;
        this.isTracking = false;
        if (this.bwuInstance.tabManager) {
          this.bwuInstance.tabManager.stopTabAlternation();
        }
        if (this.logFilePath) {
          this.writeToLog("");
          this.writeToLog("=".repeat(80));
          this.writeToLog("GAME ENDED - FINAL STATS");
          this.writeToLog("=".repeat(80));
          const allStats = this.getAllStats();
          allStats.sort((a, b) => {
            const scoreA = a.finalKills * 2 + a.bedsBroken * 3 + a.kills;
            const scoreB = b.finalKills * 2 + b.bedsBroken * 3 + b.kills;
            return scoreB - scoreA;
          });
          for (const player of allStats) {
            if (player.finalKills > 0 || player.kills > 0 || player.bedsBroken > 0 || player.deaths > 0) {
              this.writeToLog(`${player.name}: Beds=${player.bedsBroken}, FK=${player.finalKills}, K=${player.kills}, D=${player.deaths}`);
            }
          }
          this.writeToLog("=".repeat(80));
          this.api.chat(`${this.api.getPrefix()} \xA7aGame log saved to: ${path2.basename(this.logFilePath)}`);
        }
        this.api.debugLog(`[BWU InGameTracker] Stopped tracking`);
      }
      /**
       * Write a line to the log file
       */
      writeToLog(line) {
        if (!this.logFilePath) return;
        try {
          fs.appendFileSync(this.logFilePath, line + "\n", "utf8");
        } catch (e) {
          this.api.debugLog(`[BWU InGameTracker] Failed to write to log: ${e.message}`);
        }
      }
      /**
      * Process a chat message to detect game events
      * @param {string} cleanMessage - Clean chat message without color codes
      */
      processMessage(cleanMessage) {
        if (!this.isTracking) return;
        if (!this.api.config.get("inGameTracker.enabled")) return;
        const trimmed = cleanMessage.trim();
        if (!trimmed) return;
        this.writeToLog(trimmed);
        let detected = false;
        let detectionType = "";
        if (trimmed.startsWith("BED DESTRUCTION >")) {
          const breaker = this.findPlayerInMessage(trimmed);
          if (breaker) {
            this.handleBedDestruction("Unknown", breaker);
            detected = true;
            detectionType = `BED_BREAK DETECTED - Breaker: ${breaker}`;
          }
        }
        if (!detected && trimmed.endsWith("FINAL KILL!")) {
          const players = this.findAllPlayersInMessage(trimmed);
          if (players.length === 2) {
            const victim = players[0].name;
            const killer = players[1].name;
            this.handleFinalKill(victim, killer);
            detected = true;
            detectionType = `FINAL_KILL DETECTED - Victim: ${victim}, Killer: ${killer}`;
          } else if (players.length === 1) {
            const victim = players[0].name;
            this.handleEnvironmentDeath(victim);
            detected = true;
            detectionType = `ENV_FINAL_KILL DETECTED - Victim: ${victim} (no killer)`;
          }
        }
        if (!detected && trimmed.endsWith(".") && !trimmed.endsWith("FINAL KILL!")) {
          const players = this.findAllPlayersInMessage(trimmed);
          if (players.length === 2) {
            const victim = players[0].name;
            const killer = players[1].name;
            this.handleKill(victim, killer);
            detected = true;
            detectionType = `KILL DETECTED - Victim: ${victim}, Killer: ${killer}`;
          } else if (players.length === 1) {
            const deathIndicators = [
              "fell into the void",
              "died",
              "disconnected",
              "burned to death",
              "forgot how many blocks",
              "was pushed into the void",
              "fell off the world",
              "had a small brain moment"
            ];
            const isDeathMessage = deathIndicators.some((indicator) => trimmed.toLowerCase().includes(indicator));
            if (isDeathMessage) {
              const victim = players[0].name;
              this.handleEnvironmentDeath(victim);
              detected = true;
              detectionType = `DEATH DETECTED - Victim: ${victim}`;
            }
          }
        }
        if (detected) {
          this.writeToLog(`[${detectionType}]`);
        }
      }
      /**
       * Find the first player from gamePlayers that appears in the message
       * @param {string} message - The message to search
       * @returns {string|null} - Player name or null if not found
       */
      findPlayerInMessage(message) {
        for (const player of this.gamePlayers) {
          if (message.includes(player)) {
            return player;
          }
        }
        return null;
      }
      /**
       * Find ALL players from gamePlayers that appear in the message, in order of appearance
       * @param {string} message - The message to search
       * @returns {Array<{name: string, index: number}>} - Array of player info sorted by position in message
       */
      findAllPlayersInMessage(message) {
        const found = [];
        for (const player of this.gamePlayers) {
          const index = message.indexOf(player);
          if (index !== -1) {
            found.push({ name: player, index });
          }
        }
        found.sort((a, b) => a.index - b.index);
        return found;
      }
      /**
       * Handle bed destruction event
       */
      handleBedDestruction(teamName, breaker) {
        this.teamBeds.set(teamName, { bedAlive: false });
        if (this.gamePlayers.has(breaker)) {
          const stats = this.playerStats.get(breaker);
          if (stats) {
            stats.bedsBroken++;
            this._notifyTabUpdate(breaker);
          }
        }
        this.api.debugLog(`[BWU InGameTracker] ${breaker} destroyed ${teamName} bed`);
        if (this.api.config.get("inGameTracker.showNotifications") && this.api.config.get("inGameTracker.notifyBedBreaks")) {
          this.displayEvent("bed", breaker, teamName);
        }
      }
      /**
       * Handle final kill event
       */
      handleFinalKill(victim, killer) {
        if (this.gamePlayers.has(killer)) {
          const stats = this.playerStats.get(killer);
          if (stats) {
            stats.finalKills++;
            this._notifyTabUpdate(killer);
          }
        }
        if (this.gamePlayers.has(victim)) {
          const stats = this.playerStats.get(victim);
          if (stats) {
            stats.deaths++;
            this._notifyTabUpdate(victim);
          }
        }
        this.api.debugLog(`[BWU InGameTracker] ${killer} final killed ${victim}`);
        if (this.api.config.get("inGameTracker.showNotifications") && this.api.config.get("inGameTracker.notifyFinalKills")) {
          this.displayEvent("finalKill", killer, victim);
        }
      }
      /**
       * Handle regular kill event
       */
      handleKill(victim, killer) {
        if (this.gamePlayers.has(killer)) {
          const stats = this.playerStats.get(killer);
          if (stats) {
            stats.kills++;
            this._notifyTabUpdate(killer);
          }
        }
        if (this.gamePlayers.has(victim)) {
          const stats = this.playerStats.get(victim);
          if (stats) {
            stats.deaths++;
            this._notifyTabUpdate(victim);
          }
        }
        this.api.debugLog(`[BWU InGameTracker] ${killer} killed ${victim}`);
        if (this.api.config.get("inGameTracker.showNotifications") && this.api.config.get("inGameTracker.notifyKills")) {
          this.displayEvent("kill", killer, victim);
        }
      }
      /**
      * Handle environment death (void, fall damage, etc)
      */
      handleEnvironmentDeath(victim) {
        if (this.gamePlayers.has(victim)) {
          const stats = this.playerStats.get(victim);
          if (stats) {
            stats.deaths++;
            this._notifyTabUpdate(victim);
          }
        }
        this.api.debugLog(`[BWU InGameTracker] ${victim} died to environment`);
      }
      /**
       * Handle mutual death (both players die)
       */
      handleMutualDeath(player1, player2) {
        if (this.gamePlayers.has(player1)) {
          const stats = this.playerStats.get(player1);
          if (stats) {
            stats.deaths++;
            this._notifyTabUpdate(player1);
          }
        }
        if (this.gamePlayers.has(player2)) {
          const stats = this.playerStats.get(player2);
          if (stats) {
            stats.deaths++;
            this._notifyTabUpdate(player2);
          }
        }
        this.api.debugLog(`[BWU InGameTracker] ${player1} and ${player2} died in mutual combat`);
      }
      /**
       * Notify TabManager to update a player's game stats in tab
       */
      _notifyTabUpdate(playerName) {
        if (this.bwuInstance.tabManager) {
          this.bwuInstance.tabManager.updatePlayerGameStats(playerName);
        }
      }
      /**
       * Display event notification
       */
      displayEvent(type, player, target) {
        const stats = this.playerStats.get(player);
        if (!stats) return;
        let message = "";
        switch (type) {
          case "bed":
            message = `\xA7e${player} \xA77broke \xA7c${target} \xA77bed! \xA78(\xA7e${stats.bedsBroken} \xA77total\xA78)`;
            break;
          case "finalKill":
            message = `\xA7e${player} \xA77final killed \xA7c${target}\xA77! \xA78(\xA7e${stats.finalKills} \xA77FK total\xA78)`;
            break;
          case "kill":
            message = `\xA7e${player} \xA77killed \xA7c${target}\xA77! \xA78(\xA7e${stats.kills} \xA77kills total\xA78)`;
            break;
        }
        if (message) {
          this.api.chat(`${this.api.getPrefix()} ${message}`);
        }
      }
      /**
       * Get current stats for a player
       */
      getPlayerStats(playerName) {
        return this.playerStats.get(playerName);
      }
      /**
       * Get all tracked stats
       */
      getAllStats() {
        return Array.from(this.playerStats.entries()).map(([name, stats]) => ({
          name,
          ...stats
        }));
      }
      /**
       * Display current game stats summary
       */
      displayGameStats() {
        if (!this.isTracking) {
          this.api.chat(`${this.api.getPrefix()} \xA7cNo game in progress to track.`);
          return;
        }
        const allStats = this.getAllStats();
        allStats.sort((a, b) => {
          const scoreA = a.finalKills * 2 + a.bedsBroken * 3 + a.kills;
          const scoreB = b.finalKills * 2 + b.bedsBroken * 3 + b.kills;
          return scoreB - scoreA;
        });
        this.api.chat(`${this.api.getPrefix()} \xA76\xA7l\u2550\u2550\u2550 In-Game Stats \u2550\u2550\u2550`);
        const topPlayers = allStats.slice(0, 5);
        for (const player of topPlayers) {
          if (player.finalKills === 0 && player.kills === 0 && player.bedsBroken === 0 && player.deaths === 0) continue;
          const parts = [];
          if (player.bedsBroken > 0) parts.push(`\xA7c${player.bedsBroken} \xA77beds`);
          if (player.finalKills > 0) parts.push(`\xA7e${player.finalKills} \xA77FK`);
          if (player.kills > 0) parts.push(`\xA7a${player.kills} \xA77K`);
          if (player.deaths > 0) parts.push(`\xA78${player.deaths} \xA77D`);
          const statsText = parts.join(" \xA78| ");
          this.api.chat(`  \xA7b${player.name}\xA77: ${statsText}`);
        }
        if (topPlayers.length === 0 || topPlayers.every((p) => p.finalKills === 0 && p.kills === 0 && p.bedsBroken === 0 && p.deaths === 0)) {
          this.api.chat(`  \xA77No events tracked yet...`);
        }
      }
      /**
       * Display stats for a specific player
       */
      displayPlayerStats(playerName) {
        if (!this.isTracking) {
          this.api.chat(`${this.api.getPrefix()} \xA7cNo game in progress to track.`);
          return;
        }
        const stats = this.playerStats.get(playerName);
        if (!stats) {
          this.api.chat(`${this.api.getPrefix()} \xA7c${playerName} is not in this game.`);
          return;
        }
        this.api.chat(`${this.api.getPrefix()} \xA76Stats for \xA7b${playerName}\xA76:`);
        this.api.chat(`  \xA7cBeds Broken: \xA7e${stats.bedsBroken}`);
        this.api.chat(`  \xA7aKills: \xA7e${stats.kills}`);
        this.api.chat(`  \xA77Deaths: \xA7e${stats.deaths}`);
        this.api.chat(`  \xA76Final Kills: \xA7e${stats.finalKills}`);
        const kdr = stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(2) : stats.kills.toFixed(2);
        const fkdr = stats.deaths > 0 ? (stats.finalKills / stats.deaths).toFixed(2) : stats.finalKills.toFixed(2);
        this.api.chat(`  \xA7bK/D: \xA7e${kdr} \xA78| \xA7bFK/D: \xA7e${fkdr}`);
      }
    };
    module2.exports = InGameTracker;
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/core/CommandRegistry.js
var require_CommandRegistry = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/core/CommandRegistry.js"(exports2, module2) {
    var CommandRegistry = class {
      static register(api, commandHandler) {
        api.commands((registry) => {
          registry.command("find").description("Finds players for your party based on criteria.").argument("<mode>", { description: "Mode (2, 3, 4) or 'stop'" }).argument("[playersToFind]", {
            description: "Number of players to find",
            optional: true
          }).argument("[fkdrThreshold]", {
            description: "Minimum FKDR required",
            optional: true
          }).argument("positions", {
            description: "Optional positions",
            optional: true,
            type: "greedy"
          }).handler((ctx) => commandHandler.handleFindCommand(ctx));
          registry.command("ping").description("Shows your current ping to the server.").handler((ctx) => commandHandler.handlePingCommand(ctx));
          registry.command("stats").description("Shows the Bedwars statistics for a player.").argument("<nickname>", { description: "The player to check" }).handler((ctx) => commandHandler.handleStatsCommand(ctx));
          registry.command("setthreshold").description("Sets the FKDR threshold for auto-requeue.").argument("<threshold>", { description: "The FKDR value (e.g., 10.0)" }).handler((ctx) => commandHandler.handleSetThresholdCommand(ctx));
          registry.command("clearstats").description("Clears stats of players.").handler((ctx) => commandHandler.handleClearCommand(ctx));
          registry.command("setkey").description("Set your Hypixel API key").argument("<apikey>", { description: "Your Hypixel API key" }).handler((ctx) => commandHandler.handleSetKeyCommand(ctx));
          registry.command("setaurora").description("Set your Aurora API key").argument("<apikey>", { description: "Your Aurora API key" }).handler((ctx) => commandHandler.handleSetAuroraCommand(ctx));
          registry.command("setqdmsg").description("Sets a queue dodge message for a slot (1-5).").argument("<slot>", { description: "Slot number (1-5)" }).argument("message", {
            description: "The message to save",
            optional: true,
            type: "greedy"
          }).handler((ctx) => commandHandler.handleSetQdmsgCommand(ctx));
          registry.command("listqdmsg").description("Lists all saved queue dodge messages.").handler((ctx) => commandHandler.handleListQdmsgCommand(ctx));
          registry.command("qdmsg").description("Sends a saved queue dodge message manually.").argument("<slot>", { description: "Slot number (1-5)" }).handler((ctx) => commandHandler.handleQdmsgCommand(ctx));
          registry.command("setsniped").description("Sets a sniped message for a slot (1-5).").argument("<slot>", { description: "Slot number (1-5)" }).argument("message", {
            description: "The message to save",
            optional: true,
            type: "greedy"
          }).handler((ctx) => commandHandler.handleSetSnipedCommand(ctx));
          registry.command("listsniped").description("Lists all saved sniped messages.").handler((ctx) => commandHandler.handleListSnipedCommand(ctx));
          registry.command("sniped").description("Sends a saved sniped message.").argument("<slot>", { description: "Slot number (1-5)" }).argument("[channel]", {
            description: "Chat channel ('ac' for all chat, default is /shout)",
            optional: true
          }).handler((ctx) => commandHandler.handleSnipedCommand(ctx));
          registry.command("setmacro").description("Saves or updates a chat macro.").argument("<name>", { description: "The name used to call the macro." }).argument("content", {
            description: "The command or message to be saved.",
            type: "greedy"
          }).handler((ctx) => commandHandler.handleSetMacroCommand(ctx));
          registry.command("delmacro").description("Removes a macro.").argument("<name>", {
            description: "The name of the macro to be removed."
          }).handler((ctx) => commandHandler.handleDelMacroCommand(ctx));
          registry.command("macros").description("Lists all saved macros.").handler((ctx) => commandHandler.handleListMacrosCommand(ctx));
          registry.command("m").description("Executes a saved macro.").argument("<name>", {
            description: "The name of the macro to execute."
          }).handler((ctx) => commandHandler.handleRunMacroCommand(ctx));
          registry.command("mcnames").description("Shows the name history of a Minecraft player.").argument("<ign>", { description: "The player's username" }).handler((ctx) => commandHandler.handleMcnamesCommand(ctx));
          registry.command("setinparty").description("[DEBUG] Manually set the inParty status.").argument("<value>", { description: "true or false" }).handler((ctx) => commandHandler.handleSetInPartyCommand(ctx));
          registry.command("rerank").description("Forces team ranking and refreshes tab list stats.").handler((ctx) => commandHandler.handleRerankCommand(ctx));
          registry.command("allstats").description("Shows stats for all remaining players, or filter by team color.").argument("[color]", {
            description: "Optional team color (red, blue, green, yellow, aqua, white, pink, gray)",
            optional: true
          }).argument("[sendTo]", {
            description: "Where to send (private, team, party). Default: private",
            optional: true
          }).handler((ctx) => commandHandler.handleAllStatsCommand(ctx));
          registry.command("gamestats").description("Shows real-time in-game statistics for the current match.").handler((ctx) => commandHandler.handleGameStatsCommand(ctx));
          registry.command("playerstats").description("Shows in-game statistics for a specific player in the current match.").argument("<player>", { description: "The player's username" }).handler((ctx) => commandHandler.handlePlayerStatsCommand(ctx));
          registry.command("gametab").description("Toggle or configure in-game stats display in tab.").argument("[setting]", {
            description: "Setting to toggle: on/off, kills, deaths, fk, bb, or delay <5-10>",
            optional: true
          }).argument("[value]", {
            description: "Value for delay setting (5-10)",
            optional: true
          }).handler((ctx) => commandHandler.handleGameTabCommand(ctx));
        });
      }
    };
    module2.exports = CommandRegistry;
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/BedWarsUtilities.js
var require_BedWarsUtilities = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/BedWarsUtilities.js"(exports2, module2) {
    var CacheManager = require_CacheManager();
    var ApiService = require_ApiService();
    var StatsFormatter = require_StatsFormatter();
    var ChatHandler = require_ChatHandler();
    var CommandHandler = require_CommandHandler();
    var GameHandler = require_GameHandler();
    var TeamRanking = require_TeamRanking();
    var TabManager = require_TabManager();
    var PartyFinder = require_PartyFinder();
    var InGameTracker = require_InGameTracker();
    var CommandRegistry = require_CommandRegistry();
    var BedWarsUtilities2 = class {
      constructor(api) {
        this.api = api;
        this.cacheManager = new CacheManager(api);
        this.apiService = new ApiService(api, this.cacheManager);
        this.statsFormatter = new StatsFormatter(api);
        this.teamRanking = new TeamRanking(api, this.apiService, this);
        this.partyFinder = new PartyFinder(api, this.apiService);
        this.inGameTracker = new InGameTracker(api, this.apiService, this);
        this.tabManager = new TabManager(
          api,
          this.apiService,
          this.statsFormatter,
          this
        );
        this.chatHandler = new ChatHandler(
          api,
          this.apiService,
          this.statsFormatter,
          this.tabManager,
          this
        );
        this.commandHandler = new CommandHandler(
          api,
          this.apiService,
          this.tabManager,
          this.chatHandler,
          this.partyFinder,
          this
        );
        this.gameHandler = new GameHandler(api, this.chatHandler, this.tabManager);
        this.autoStatsMode = false;
        this.checkedPlayersInAutoMode = /* @__PURE__ */ new Set();
        this.lastCleanMessage = null;
        this.requeueTriggered = false;
        this.rankingSentThisMatch = false;
        this.resolvedNicks = /* @__PURE__ */ new Map();
        this.realNameToNickMap = /* @__PURE__ */ new Map();
        this.apiKeyCheckPerformed = false;
        this.lastGameMode = null;
        this._suppressNextLocraw = 0;
        this._lastLocrawAt = 0;
        this.lastQdmsg = null;
        this._bypassShoutInterception = false;
        this.inParty = null;
      }
      _getDenickerInstance() {
        try {
          return this.api.getPluginInstance("denicker");
        } catch (e) {
          console.warn(`[BWU] Failed to get denicker instance: ${e?.stack ?? e}`);
          return null;
        }
      }
      handleFirstPlayerJoin() {
        if (this.apiKeyCheckPerformed) {
          return;
        }
        this.apiKeyCheckPerformed = true;
        this._initialApiKeyCheck();
        setTimeout(() => this.runLocrawSilently(), 3e3);
      }
      registerHandlers() {
        this.api.on("player_join", this.handleFirstPlayerJoin.bind(this));
        this.api.on("chat", this.onChat.bind(this));
        this.api.on("respawn", this.onWorldChange.bind(this));
        this.api.on("denicker:nick_resolved", this.onNickResolved.bind(this));
        this.api.intercept(
          "packet:server:chat",
          this.onServerChatPacket.bind(this)
        );
        this.api.intercept(
          "packet:client:chat",
          this.onClientChatPacket.bind(this)
        );
        CommandRegistry.register(this.api, this.commandHandler);
      }
      extractJsonFromLine(line) {
        const clean = String(line).replaceAll(/§[0-9a-fk-or]/gi, "").trim();
        const start = clean.indexOf("{");
        const end = clean.lastIndexOf("}");
        if (start === -1 || end === -1 || end <= start) return null;
        return clean.slice(start, end + 1);
      }
      runLocrawSilently() {
        const now = Date.now();
        if (now - this._lastLocrawAt < 250) return;
        this._lastLocrawAt = now;
        this._suppressNextLocraw++;
        this.api.sendChatToServer("/locraw");
      }
      consumeLocraw(jsonText) {
        try {
          const data = JSON.parse(jsonText);
          const isLobby = typeof data.lobbyname === "string" && data.lobbyname.length > 0 || data.server === "lobby";
          if (!isLobby && typeof data.mode === "string" && typeof data.gametype === "string") {
            const gt = data.gametype.toUpperCase();
            if (gt === "BEDWARS") {
              this.lastGameMode = data.mode;
              this.api.debugLog(
                `[BWU] Last game mode updated to: ${this.lastGameMode}`
              );
            }
          } else if (isLobby) {
            setTimeout(() => this.runLocrawSilently(), 1e3);
          }
        } catch (e) {
          this.api.debugLog(`[BWU] Failed to parse locraw: ${e.message}`);
        }
      }
      onServerChatPacket(event) {
        try {
          if (this._suppressNextLocraw > 0) {
            let plainText = "";
            const messageData = JSON.parse(event.data.message);
            if (typeof messageData.text === "string") plainText += messageData.text;
            if (Array.isArray(messageData.extra)) {
              plainText += messageData.extra.map((e) => typeof e === "string" ? e : e?.text || "").join("");
            }
            const plain = plainText.replaceAll(/§[0-9a-fk-or]/gi, "");
            const json = this.extractJsonFromLine(plain);
            if (json?.includes('"server"')) {
              event.cancel();
              this._suppressNextLocraw--;
              this.consumeLocraw(json);
              return;
            }
          }
        } catch (e) {
          this.api.debugLog(`[BWU] Something went wrong: ${e.message}`);
        }
      }
      onClientChatPacket(event) {
        try {
          const message = event.data.message;
          if (message && (message.toLowerCase().startsWith("/shout ") || message.toLowerCase() === "/shout")) {
            if (this._bypassShoutInterception) {
              this.api.debugLog(`[BWU] Bypassing shout interception for: "${message}"`);
              this._bypassShoutInterception = false;
              return;
            }
            this.api.debugLog(`[BWU] Intercepting shout command: "${message}"`);
            event.cancel();
            this.api.debugLog(`[BWU] Event cancelled successfully`);
            const shoutMessage = message.length > 6 ? message.substring(7).trim() : "";
            if (shoutMessage.length === 0) {
              const now = Date.now();
              const timeSinceLastShout = now - this.commandHandler.lastShoutTime;
              const remainingCooldown = this.commandHandler.shoutCooldown - timeSinceLastShout;
              if (this.commandHandler.pendingShoutMessage) {
                const secondsLeft = Math.round(remainingCooldown / 1e3);
                this.api.chat(
                  `${this.api.getPrefix()} \xA7eQueued message: \xA7f"${this.commandHandler.pendingShoutMessage}"`
                );
                this.api.chat(
                  `${this.api.getPrefix()} \xA7eWill send in \xA7f${secondsLeft}s`
                );
              } else if (timeSinceLastShout >= this.commandHandler.shoutCooldown) {
                this.api.chat(
                  `${this.api.getPrefix()} \xA7aShout is ready! You can shout now.`
                );
              } else {
                const secondsLeft = Math.round(remainingCooldown / 1e3);
                this.api.chat(
                  `${this.api.getPrefix()} \xA7eShout cooldown: \xA7f${secondsLeft}s \xA7eremaining`
                );
              }
            } else if (shoutMessage.toLowerCase() === "cancel") {
              const wasCancelled = this.commandHandler.cancelPendingShout();
              if (wasCancelled) {
                this.api.chat(
                  `${this.api.getPrefix()} \xA7aQueued shout cancelled successfully!`
                );
              } else {
                this.commandHandler.sendShoutWithCooldown(shoutMessage);
              }
            } else {
              this.commandHandler.sendShoutWithCooldown(shoutMessage);
            }
          }
        } catch (e) {
          console.error(`[BWU] Error intercepting client chat: ${e.message}`);
          console.error(e.stack);
        }
      }
      onNickResolved({ nickName, realName }) {
        if (this.resolvedNicks.has(nickName.toLowerCase())) return;
        this.resolvedNicks.set(nickName.toLowerCase(), realName);
        this.realNameToNickMap.set(realName.toLowerCase(), nickName);
        if (this.tabManager.managedPlayers.has(nickName)) {
          this.tabManager.addPlayerStatsToTab(nickName, realName);
        }
      }
      async _initialApiKeyCheck() {
        setTimeout(async () => {
          const result = await this.apiService.testHypixelApiKey();
          const fadeIn = 10;
          const stay = 40;
          const fadeOut = 10;
          const totalDurationMs = (fadeIn + stay + fadeOut) * 50;
          if (result.isValid) {
            this.api.sendTitle(
              "\xA76BW Utilities",
              "\xA7aHypixel API key is functional!",
              fadeIn,
              stay,
              fadeOut
            );
          } else {
            this.api.sendTitle(
              "\xA76BW Utilities",
              "\xA7cHypixel API key is not functional! Please set a valid key",
              fadeIn,
              stay,
              fadeOut
            );
          }
          setTimeout(() => {
            this.api.sendTitle(" ", " ", 0, 0, 0);
          }, totalDurationMs + 50);
        }, 3e3);
      }
      async onChat(event) {
        try {
          const cleanMessage = event.message.replaceAll(/§[0-9a-fk-or]/g, "");
          this._handlePartyLeaveMessage(cleanMessage);
          this._handlePartyJoinMessage(cleanMessage);
          this.chatHandler.handleAutoMessage(cleanMessage);
          if (this.partyFinder.isActive) {
            this.partyFinder.handleChatMessage(cleanMessage);
          }
          this.inGameTracker.processMessage(cleanMessage);
          if (this.gameHandler.isBedwarsStartMessage(
            cleanMessage,
            this.lastCleanMessage
          )) {
            this.runLocrawSilently();
          }
          await this.gameHandler.handleGameStart(
            cleanMessage,
            this.lastCleanMessage
          );
          await this.gameHandler.handleGameEnd(cleanMessage, this.lastGameMode);
          this.lastCleanMessage = cleanMessage;
          const whoMatch = cleanMessage.match(/^ONLINE: (.*)$/);
          if (whoMatch) {
            if (this.autoStatsMode) {
              this.autoStatsMode = false;
              this.checkedPlayersInAutoMode.clear();
              this.api.chat(
                `${this.api.getPrefix()} \xA7cAutomatic stats mode DISABLED.`
              );
            }
            this.tabManager.clearManagedPlayers("all");
            const originalPlayerNames = whoMatch[1].split(", ").map((p) => p.trim()).filter(Boolean);
            const me = this.api.getCurrentPlayer();
            if (me?.uuid) {
              const myInfoFromServer = this.api.getPlayerInfo(me.uuid);
              const myNickName = myInfoFromServer ? myInfoFromServer.name : null;
              const myRealName = me.name;
              if (myNickName && myRealName && myNickName.toLowerCase() !== myRealName.toLowerCase()) {
                const isMyNickInWhoList = originalPlayerNames.some(
                  (name) => name.toLowerCase() === myNickName.toLowerCase()
                );
                if (isMyNickInWhoList) {
                  this.resolvedNicks.set(myNickName.toLowerCase(), myRealName);
                  this.realNameToNickMap.set(myRealName.toLowerCase(), myNickName);
                }
              }
            }
            const denicker = this._getDenickerInstance();
            const resolvedPlayerNames = originalPlayerNames.map((nickName) => {
              let realName = this.resolvedNicks.get(nickName.toLowerCase());
              if (!realName && denicker) {
                realName = denicker.getRealName(nickName);
              }
              const finalName = realName || nickName;
              if (nickName.toLowerCase() !== finalName.toLowerCase()) {
                this.realNameToNickMap.set(finalName.toLowerCase(), nickName);
              }
              return finalName;
            });
            await this.processPlayerData(originalPlayerNames, resolvedPlayerNames);
            return;
          }
          await this.chatHandler.handleChat(
            cleanMessage,
            this.autoStatsMode,
            this.checkedPlayersInAutoMode,
            (mode) => {
              this.autoStatsMode = mode;
            }
          );
        } catch (error) {
          console.error(`[BWU CRITICAL ON_CHAT]: ${error.stack}`);
        }
      }
      onWorldChange() {
        setTimeout(() => this.runLocrawSilently(), 250);
        this.tabManager.clearManagedPlayers("all");
        this.gameHandler.resetGameState();
        this.commandHandler.cancelPendingShout();
        this.inGameTracker.stopTracking();
        this.lastCleanMessage = null;
        this.requeueTriggered = false;
        this.rankingSentThisMatch = false;
        this.resolvedNicks.clear();
        this.realNameToNickMap.clear();
        if (this.autoStatsMode) {
          this.autoStatsMode = false;
          this.checkedPlayersInAutoMode.clear();
          this.api.chat(`${this.api.getPrefix()} \xA7cAutomatic stats mode DISABLED.`);
        }
      }
      async processPlayerData(originalPlayerNames, resolvedPlayerNames) {
        if (this.gameHandler.gameStarted && !this.rankingSentThisMatch) {
          await this.teamRanking.processAndDisplayRanking(
            originalPlayerNames,
            this.rankingSentThisMatch
          );
          this.rankingSentThisMatch = true;
          this.inGameTracker.startTracking(new Set(resolvedPlayerNames));
        }
        for (let i = 0; i < originalPlayerNames.length; i++) {
          const originalName = originalPlayerNames[i];
          const resolvedName = resolvedPlayerNames[i];
          await this.tabManager.addPlayerStatsToTab(originalName, resolvedName);
        }
      }
      _handlePartyJoinMessage(cleanMessage) {
        const trimmedMessage = cleanMessage.trim();
        const joinRegex = /^You have joined (.*)'s party!$/;
        const createRegex = /^You have invited (.*) to your party!?/;
        const memberJoinRegex = /^(.*) joined the party\.$/;
        if (joinRegex.test(trimmedMessage) || createRegex.test(trimmedMessage) || memberJoinRegex.test(trimmedMessage)) {
          if (this.inParty !== true) {
            this.api.debugLog(`[BWU] Party join/create detected. inParty = true`);
            this.inParty = true;
            this.api.sendChatToServer("/chat p");
          }
        }
      }
      _handlePartyLeaveMessage(cleanMessage) {
        const trimmedMessage = cleanMessage.trim();
        const partyLeaveTriggers = [
          "You left the party.",
          "The party was disbanded because all invites expired and the party was empty.",
          "The party was disbanded."
        ];
        if (partyLeaveTriggers.includes(trimmedMessage) || trimmedMessage.startsWith("You have been kicked from the party by") || trimmedMessage.startsWith("The party was disbanded because")) {
          if (this.inParty !== false) {
            this.api.debugLog(`[BWU] Party leave/disband/kick detected. inParty = false`);
            this.inParty = false;
            this.api.sendChatToServer("/chat a");
          }
        }
      }
    };
    module2.exports = BedWarsUtilities2;
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/config/configSchema.js
var require_configSchema = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/config/configSchema.js"(exports2, module2) {
    module2.exports = [
      {
        label: "API - Hypixel",
        description: "Set your Hypixel API key and cache duration. Use: /bwu setkey <key>",
        defaults: {
          main: {
            hypixelApiKey: "YOUR_HYPIXEL_API_KEY_HERE"
          },
          performance: {
            cacheTTL: 300
          }
        },
        settings: [
          {
            key: "main.hypixelApiKey",
            type: "text",
            description: "Hypixel API key. Get one at https://developer.hypixel.net/. Use: /bwu setkey <key>"
          },
          {
            key: "performance.cacheTTL",
            type: "cycle",
            description: "Cache duration for stats. Recommended: 300s or more.",
            values: [
              { text: "60s", value: 60 },
              { text: "120s", value: 120 },
              { text: "180s", value: 180 },
              { text: "240s", value: 240 },
              { text: "300s (Recommended)", value: 300 },
              { text: "360s", value: 360 },
              { text: "420s", value: 420 }
            ]
          }
        ]
      },
      {
        label: "API - Aurora (Ping)",
        description: "Set your Aurora API key and cache duration. Use: /bwu setaurora <key>",
        defaults: {
          main: {
            auroraApiKey: "YOUR_AURORA_API_KEY_HERE"
          },
          performance: {
            pingCacheTTL: 60
          }
        },
        settings: [
          {
            key: "main.auroraApiKey",
            type: "text",
            description: "Aurora API key for showing ping. Use: /bwu setaurora <key>"
          },
          {
            key: "performance.pingCacheTTL",
            type: "cycle",
            description: "Cache duration for ping. Recommended: 60s.",
            values: [
              { text: "30s", value: 30 },
              { text: "60s (Recommended)", value: 60 },
              { text: "90s", value: 90 },
              { text: "120s", value: 120 }
            ]
          }
        ]
      },
      {
        label: "Team Ranking",
        description: "Automatically ranks enemy teams by threat level (FKDR and Stars).",
        defaults: {
          teamRanking: {
            enabled: true,
            separateMessages: false,
            displayMode: "total",
            sendType: "party",
            maxTeams: 3,
            showYourTeam: false,
            firstRushes: true
          }
        },
        settings: [
          {
            key: "teamRanking.enabled",
            type: "toggle",
            text: ["OFF", "ON"],
            description: "Enable or disable automatic team ranking."
          },
          {
            key: "teamRanking.firstRushes",
            type: "toggle",
            text: ["OFF", "ON"],
            description: "Show stats of neighboring teams at game start to help plan first rushes."
          },
          {
            key: "teamRanking.displayMode",
            type: "cycle",
            description: "Display total or average stats in team ranking.",
            values: [
              { text: "Stat Mode: Total", value: "total" },
              { text: "Stat Mode: Average", value: "avg" }
            ]
          },
          {
            key: "teamRanking.separateMessages",
            type: "cycle",
            description: "Display each team's ranking in a separate chat message.",
            values: [
              { text: "Separate Msgs: ON", value: true },
              { text: "Separate Msgs: OFF", value: false }
            ]
          },
          {
            key: "teamRanking.sendType",
            type: "cycle",
            description: "Choose where to send team ranking messages.",
            values: [
              { text: "Send in Chat: Private", value: "private" },
              { text: "Send in Chat: Party", value: "party" },
              { text: "Send in Chat: Team", value: "team" }
            ]
          },
          {
            key: "teamRanking.maxTeams",
            type: "cycle",
            description: "Maximum number of top enemy teams to display in ranking.",
            values: [
              { text: "Max Teams: 1", value: 1 },
              { text: "Max Teams: 2", value: 2 },
              { text: "Max Teams: 3", value: 3 },
              { text: "Max Teams: 4", value: 4 },
              { text: "Max Teams: 5", value: 5 },
              { text: "Max Teams: 6", value: 6 },
              { text: "Max Teams: 7", value: 7 }
            ]
          },
          {
            key: "teamRanking.showYourTeam",
            type: "cycle",
            description: "Show your team in the ranking for reference (doesn't count toward max teams).",
            values: [
              { text: "Your Team: OFF", value: false },
              { text: "Your Team: ON", value: true }
            ]
          }
        ]
      },
      {
        label: "Auto Requeue (Game End)",
        description: "Automatically run /requeue after a game finishes.",
        defaults: {
          autoRequeueGameEnd: {
            enabled: true,
            delay: 1e3
          }
        },
        settings: [
          {
            type: "toggle",
            key: "autoRequeueGameEnd.enabled",
            text: ["OFF", "ON"],
            description: "Automatically executes /requeue when the game end message is detected."
          },
          {
            type: "cycle",
            key: "autoRequeueGameEnd.delay",
            description: "Delay before executing the command.",
            values: [
              { text: "0ms", value: 0 },
              { text: "500ms", value: 500 },
              { text: "1000ms", value: 1e3 },
              { text: "1500ms", value: 1500 },
              { text: "2000ms", value: 2e3 }
            ]
          }
        ]
      },
      {
        label: "Auto /who",
        description: "Automatically run /who at the start of the match (Bedwars only)",
        defaults: {
          autoWho: {
            enabled: true,
            delay: 0
          }
        },
        settings: [
          {
            type: "toggle",
            key: "autoWho.enabled",
            text: ["OFF", "ON"],
            description: "Automatically executes /who when starting a Bedwars match."
          },
          {
            type: "cycle",
            key: "autoWho.delay",
            description: "Delay before executing the command.",
            values: [
              { text: "0ms", value: 0 },
              { text: "500ms", value: 500 },
              { text: "1000ms", value: 1e3 }
            ]
          }
        ]
      },
      {
        label: "Automatic Stats & Requeue",
        description: "Automations for pre-game lobby analysis.",
        defaults: {
          autoStats: { enabled: true },
          mentionStats: { enabled: true },
          autoRequeue: {
            enabled: false,
            fkdrThreshold: 5
          }
        },
        settings: [
          {
            key: "autoStats.enabled",
            type: "cycle",
            description: "Show stats of players who chat in the pre-game lobby.",
            values: [
              { text: "Lobby Stats: ON", value: true },
              { text: "Lobby Stats: OFF", value: false }
            ]
          },
          {
            key: "mentionStats.enabled",
            type: "cycle",
            description: "Show stats of players who mention your nickname in chat.",
            values: [
              { text: "Mention Stats: ON", value: true },
              { text: "Mention Stats: OFF", value: false }
            ]
          },
          {
            key: "autoRequeue.enabled",
            type: "cycle",
            description: "Enable auto /requeue based on FKDR.",
            values: [
              { text: "Auto Requeue: ON", value: true },
              { text: "Auto Requeue: OFF", value: false }
            ]
          },
          {
            key: "autoRequeue.fkdrThreshold",
            type: "text",
            description: "The FKDR limit that will trigger a /requeue. Use: /bwu setthreshold <fkdr>"
          },
          {
            key: "autoStats.sendType",
            type: "cycle",
            description: "Choose where to send automatic stats messages.",
            values: [
              { text: "Send in Chat: Party", value: "party" },
              { text: "Send in Chat: Private", value: "private" }
            ]
          }
        ]
      },
      {
        label: "Queue Dodge Messages",
        description: "Sends a random message 10s before the game starts.",
        defaults: {
          autoQdmsg: {
            enabled: false,
            msg1: "",
            msg2: "",
            msg3: "",
            msg4: "",
            msg5: ""
          }
        },
        settings: [
          {
            key: "autoQdmsg.enabled",
            type: "toggle",
            text: ["OFF", "ON"],
            description: "Enable or disable automatically sending a message."
          },
          {
            key: "autoQdmsg.msg1",
            type: "text",
            description: "Message Slot 1. Use: /bwu setqdmsg 1 <message>"
          },
          {
            key: "autoQdmsg.msg2",
            type: "text",
            description: "Message Slot 2. Use: /bwu setqdmsg 2 <message>"
          },
          {
            key: "autoQdmsg.msg3",
            type: "text",
            description: "Message Slot 3. Use: /bwu setqdmsg 3 <message>"
          },
          {
            key: "autoQdmsg.msg4",
            type: "text",
            description: "Message Slot 4. Use: /bwu setqdmsg 4 <message>"
          },
          {
            key: "autoQdmsg.msg5",
            type: "text",
            description: "Message Slot 5. Use: /bwu setqdmsg 5 <message>"
          }
        ]
      },
      {
        label: "Sniped Messages",
        description: "Saves messages for the /bwu sniped command.",
        defaults: {
          snipedMsg: {
            msg1: "",
            msg2: "",
            msg3: "",
            msg4: "",
            msg5: ""
          }
        },
        settings: [
          {
            key: "snipedMsg.msg1",
            type: "text",
            description: "Message Slot 1. Use: /bwu setsniped 1 <message>"
          },
          {
            key: "snipedMsg.msg2",
            type: "text",
            description: "Message Slot 2. Use: /bwu setsniped 2 <message>"
          },
          {
            key: "snipedMsg.msg3",
            type: "text",
            description: "Message Slot 3. Use: /bwu setsniped 3 <message>"
          },
          {
            key: "snipedMsg.msg4",
            type: "text",
            description: "Message Slot 4. Use: /bwu setsniped 4 <message>"
          },
          {
            key: "snipedMsg.msg5",
            type: "text",
            description: "Message Slot 5. Use: /bwu setsniped 5 <message>"
          }
        ]
      },
      {
        label: "Stats - Level (Stars)",
        description: "Show the level (stars).",
        defaults: {
          stats: {
            showStars: {
              enabled: true,
              displayMode: "both",
              showPrefix: true,
              prefixColor: "\xA77"
            }
          }
        },
        settings: [
          {
            key: "stats.showStars.enabled",
            type: "toggle",
            text: ["OFF", "ON"],
            description: "Show the level (stars)."
          },
          {
            key: "stats.showStars.displayMode",
            type: "cycle",
            description: "Where to show stars.",
            values: [
              { text: "Chat", value: "chat" },
              { text: "Tab", value: "tab" },
              { text: "Both", value: "both" }
            ]
          }
        ]
      },
      {
        label: "Stats - FKDR",
        description: "Show the Final Kills / Deaths ratio.",
        defaults: {
          stats: {
            showFkdr: {
              enabled: true,
              displayMode: "both",
              showPrefix: true,
              prefixColor: "\xA77"
            }
          }
        },
        settings: [
          {
            key: "stats.showFkdr.enabled",
            type: "toggle",
            text: ["OFF", "ON"],
            description: "Show the Final Kills / Deaths ratio."
          },
          {
            key: "stats.showFkdr.displayMode",
            type: "cycle",
            description: "Where to show FKDR.",
            values: [
              { text: "Chat", value: "chat" },
              { text: "Tab", value: "tab" },
              { text: "Both", value: "both" }
            ]
          },
          {
            key: "stats.showFkdr.showPrefix",
            type: "cycle",
            description: "Show prefix in tab.",
            values: [
              { text: "Prefix ON", value: true },
              { text: "Prefix OFF", value: false }
            ]
          },
          {
            key: "stats.showFkdr.prefixColor",
            type: "cycle",
            description: "Prefix color in chat and tab.",
            values: [
              { text: "\xA70Black", value: "\xA70" },
              { text: "\xA71Dark Blue", value: "\xA71" },
              { text: "\xA72Dark Green", value: "\xA72" },
              { text: "\xA73Dark Aqua", value: "\xA73" },
              { text: "\xA74Dark Red", value: "\xA74" },
              { text: "\xA75Dark Purple", value: "\xA75" },
              { text: "\xA76Gold", value: "\xA76" },
              { text: "\xA77Gray", value: "\xA77" },
              { text: "\xA78Dark Gray", value: "\xA78" },
              { text: "\xA79Blue", value: "\xA79" },
              { text: "\xA7aGreen", value: "\xA7a" },
              { text: "\xA7bAqua", value: "\xA7b" },
              { text: "\xA7cRed", value: "\xA7c" },
              { text: "\xA7dLight Purple", value: "\xA7d" },
              { text: "\xA7eYellow", value: "\xA7e" },
              { text: "\xA7fWhite", value: "\xA7f" }
            ]
          }
        ]
      },
      {
        label: "Stats - Final Kills",
        description: "Show the total Final Kills.",
        defaults: {
          stats: {
            showFK: {
              enabled: true,
              displayMode: "both",
              showPrefix: true,
              prefixColor: "\xA77"
            }
          }
        },
        settings: [
          {
            key: "stats.showFK.enabled",
            type: "toggle",
            text: ["OFF", "ON"],
            description: "Show the total Final Kills."
          },
          {
            key: "stats.showFK.displayMode",
            type: "cycle",
            description: "Where to show Final Kills.",
            values: [
              { text: "Chat", value: "chat" },
              { text: "Tab", value: "tab" },
              { text: "Both", value: "both" }
            ]
          },
          {
            key: "stats.showFK.showPrefix",
            type: "cycle",
            description: "Show prefix in tab.",
            values: [
              { text: "Prefix ON", value: true },
              { text: "Prefix OFF", value: false }
            ]
          },
          {
            key: "stats.showFK.prefixColor",
            type: "cycle",
            description: "Prefix color in chat and tab.",
            values: [
              { text: "\xA70Black", value: "\xA70" },
              { text: "\xA71Dark Blue", value: "\xA71" },
              { text: "\xA72Dark Green", value: "\xA72" },
              { text: "\xA73Dark Aqua", value: "\xA73" },
              { text: "\xA74Dark Red", value: "\xA74" },
              { text: "\xA75Dark Purple", value: "\xA75" },
              { text: "\xA76Gold", value: "\xA76" },
              { text: "\xA77Gray", value: "\xA77" },
              { text: "\xA78Dark Gray", value: "\xA78" },
              { text: "\xA79Blue", value: "\xA79" },
              { text: "\xA7aGreen", value: "\xA7a" },
              { text: "\xA7bAqua", value: "\xA7b" },
              { text: "\xA7cRed", value: "\xA7c" },
              { text: "\xA7dLight Purple", value: "\xA7d" },
              { text: "\xA7eYellow", value: "\xA7e" },
              { text: "\xA7fWhite", value: "\xA7f" }
            ]
          }
        ]
      },
      {
        label: "Stats - Final Deaths",
        description: "Show the total Final Deaths.",
        defaults: {
          stats: {
            showFD: {
              enabled: true,
              displayMode: "both",
              showPrefix: true,
              prefixColor: "\xA77"
            }
          }
        },
        settings: [
          {
            key: "stats.showFD.enabled",
            type: "toggle",
            text: ["OFF", "ON"],
            description: "Show the total Final Deaths."
          },
          {
            key: "stats.showFD.displayMode",
            type: "cycle",
            description: "Where to show Final Deaths.",
            values: [
              { text: "Chat", value: "chat" },
              { text: "Tab", value: "tab" },
              { text: "Both", value: "both" }
            ]
          },
          {
            key: "stats.showFD.showPrefix",
            type: "cycle",
            description: "Show prefix in tab.",
            values: [
              { text: "Prefix ON", value: true },
              { text: "Prefix OFF", value: false }
            ]
          },
          {
            key: "stats.showFD.prefixColor",
            type: "cycle",
            description: "Prefix color in chat and tab.",
            values: [
              { text: "\xA70Black", value: "\xA70" },
              { text: "\xA71Dark Blue", value: "\xA71" },
              { text: "\xA72Dark Green", value: "\xA72" },
              { text: "\xA73Dark Aqua", value: "\xA73" },
              { text: "\xA74Dark Red", value: "\xA74" },
              { text: "\xA75Dark Purple", value: "\xA75" },
              { text: "\xA76Gold", value: "\xA76" },
              { text: "\xA77Gray", value: "\xA77" },
              { text: "\xA78Dark Gray", value: "\xA78" },
              { text: "\xA79Blue", value: "\xA79" },
              { text: "\xA7aGreen", value: "\xA7a" },
              { text: "\xA7bAqua", value: "\xA7b" },
              { text: "\xA7cRed", value: "\xA7c" },
              { text: "\xA7dLight Purple", value: "\xA7d" },
              { text: "\xA7eYellow", value: "\xA7e" },
              { text: "\xA7fWhite", value: "\xA7f" }
            ]
          }
        ]
      },
      {
        label: "Stats - WLR",
        description: "Show the Win / Loss ratio.",
        defaults: {
          stats: {
            showWlr: {
              enabled: true,
              displayMode: "chat",
              showPrefix: true,
              prefixColor: "\xA77"
            }
          }
        },
        settings: [
          {
            key: "stats.showWlr.enabled",
            type: "toggle",
            text: ["OFF", "ON"],
            description: "Show the Win / Loss ratio."
          },
          {
            key: "stats.showWlr.displayMode",
            type: "cycle",
            description: "Where to show WLR.",
            values: [
              { text: "Chat", value: "chat" },
              { text: "Tab", value: "tab" },
              { text: "Both", value: "both" }
            ]
          },
          {
            key: "stats.showWlr.showPrefix",
            type: "cycle",
            description: "Show prefix in tab.",
            values: [
              { text: "Prefix ON", value: true },
              { text: "Prefix OFF", value: false }
            ]
          },
          {
            key: "stats.showWlr.prefixColor",
            type: "cycle",
            description: "Prefix color in chat and tab.",
            values: [
              { text: "\xA70Black", value: "\xA70" },
              { text: "\xA71Dark Blue", value: "\xA71" },
              { text: "\xA72Dark Green", value: "\xA72" },
              { text: "\xA73Dark Aqua", value: "\xA73" },
              { text: "\xA74Dark Red", value: "\xA74" },
              { text: "\xA75Dark Purple", value: "\xA75" },
              { text: "\xA76Gold", value: "\xA76" },
              { text: "\xA77Gray", value: "\xA77" },
              { text: "\xA78Dark Gray", value: "\xA78" },
              { text: "\xA79Blue", value: "\xA79" },
              { text: "\xA7aGreen", value: "\xA7a" },
              { text: "\xA7bAqua", value: "\xA7b" },
              { text: "\xA7cRed", value: "\xA7c" },
              { text: "\xA7dLight Purple", value: "\xA7d" },
              { text: "\xA7eYellow", value: "\xA7e" },
              { text: "\xA7fWhite", value: "\xA7f" }
            ]
          }
        ]
      },
      {
        label: "Stats - Wins",
        description: "Show the total Wins.",
        defaults: {
          stats: {
            showWins: {
              enabled: true,
              displayMode: "chat",
              showPrefix: true,
              prefixColor: "\xA77"
            }
          }
        },
        settings: [
          {
            key: "stats.showWins.enabled",
            type: "toggle",
            text: ["OFF", "ON"],
            description: "Show the total Wins."
          },
          {
            key: "stats.showWins.displayMode",
            type: "cycle",
            description: "Where to show Wins.",
            values: [
              { text: "Chat", value: "chat" },
              { text: "Tab", value: "tab" },
              { text: "Both", value: "both" }
            ]
          },
          {
            key: "stats.showWins.showPrefix",
            type: "cycle",
            description: "Show prefix in tab.",
            values: [
              { text: "Prefix ON", value: true },
              { text: "Prefix OFF", value: false }
            ]
          },
          {
            key: "stats.showWins.prefixColor",
            type: "cycle",
            description: "Prefix color in chat and tab.",
            values: [
              { text: "\xA70Black", value: "\xA70" },
              { text: "\xA71Dark Blue", value: "\xA71" },
              { text: "\xA72Dark Green", value: "\xA72" },
              { text: "\xA73Dark Aqua", value: "\xA73" },
              { text: "\xA74Dark Red", value: "\xA74" },
              { text: "\xA75Dark Purple", value: "\xA75" },
              { text: "\xA76Gold", value: "\xA76" },
              { text: "\xA77Gray", value: "\xA77" },
              { text: "\xA78Dark Gray", value: "\xA78" },
              { text: "\xA79Blue", value: "\xA79" },
              { text: "\xA7aGreen", value: "\xA7a" },
              { text: "\xA7bAqua", value: "\xA7b" },
              { text: "\xA7cRed", value: "\xA7c" },
              { text: "\xA7dLight Purple", value: "\xA7d" },
              { text: "\xA7eYellow", value: "\xA7e" },
              { text: "\xA7fWhite", value: "\xA7f" }
            ]
          }
        ]
      },
      {
        label: "Stats - Losses",
        description: "Show the total Losses.",
        defaults: {
          stats: {
            showLosses: {
              enabled: true,
              displayMode: "chat",
              showPrefix: true,
              prefixColor: "\xA77"
            }
          }
        },
        settings: [
          {
            key: "stats.showLosses.enabled",
            type: "toggle",
            text: ["OFF", "ON"],
            description: "Show the total Losses."
          },
          {
            key: "stats.showLosses.displayMode",
            type: "cycle",
            description: "Where to show Losses.",
            values: [
              { text: "Chat", value: "chat" },
              { text: "Tab", value: "tab" },
              { text: "Both", value: "both" }
            ]
          },
          {
            key: "stats.showLosses.showPrefix",
            type: "cycle",
            description: "Show prefix in tab.",
            values: [
              { text: "Prefix ON", value: true },
              { text: "Prefix OFF", value: false }
            ]
          },
          {
            key: "stats.showLosses.prefixColor",
            type: "cycle",
            description: "Prefix color in chat and tab.",
            values: [
              { text: "\xA70Black", value: "\xA70" },
              { text: "\xA71Dark Blue", value: "\xA71" },
              { text: "\xA72Dark Green", value: "\xA72" },
              { text: "\xA73Dark Aqua", value: "\xA73" },
              { text: "\xA74Dark Red", value: "\xA74" },
              { text: "\xA75Dark Purple", value: "\xA75" },
              { text: "\xA76Gold", value: "\xA76" },
              { text: "\xA77Gray", value: "\xA77" },
              { text: "\xA78Dark Gray", value: "\xA78" },
              { text: "\xA79Blue", value: "\xA79" },
              { text: "\xA7aGreen", value: "\xA7a" },
              { text: "\xA7bAqua", value: "\xA7b" },
              { text: "\xA7cRed", value: "\xA7c" },
              { text: "\xA7dLight Purple", value: "\xA7d" },
              { text: "\xA7eYellow", value: "\xA7e" },
              { text: "\xA7fWhite", value: "\xA7f" }
            ]
          }
        ]
      },
      {
        label: "Stats - Winstreak",
        description: "Show the current Winstreak",
        defaults: {
          stats: {
            showWinstreak: {
              enabled: true,
              displayMode: "both",
              showPrefix: true,
              prefixColor: "\xA77"
            }
          }
        },
        settings: [
          {
            key: "stats.showWinstreak.enabled",
            type: "toggle",
            text: ["OFF", "ON"],
            description: "Show the current Winstreak"
          },
          {
            key: "stats.showWinstreak.displayMode",
            type: "cycle",
            description: "Where to show Winstreak.",
            values: [
              { text: "Chat", value: "chat" },
              { text: "Tab", value: "tab" },
              { text: "Both", value: "both" }
            ]
          },
          {
            key: "stats.showWinstreak.showPrefix",
            type: "cycle",
            description: "Show prefix in tab.",
            values: [
              { text: "Prefix ON", value: true },
              { text: "Prefix OFF", value: false }
            ]
          },
          {
            key: "stats.showWinstreak.prefixColor",
            type: "cycle",
            description: "Prefix color in chat and tab.",
            values: [
              { text: "\xA70Black", value: "\xA70" },
              { text: "\xA71Dark Blue", value: "\xA71" },
              { text: "\xA72Dark Green", value: "\xA72" },
              { text: "\xA73Dark Aqua", value: "\xA73" },
              { text: "\xA74Dark Red", value: "\xA74" },
              { text: "\xA75Dark Purple", value: "\xA75" },
              { text: "\xA76Gold", value: "\xA76" },
              { text: "\xA77Gray", value: "\xA77" },
              { text: "\xA78Dark Gray", value: "\xA78" },
              { text: "\xA79Blue", value: "\xA79" },
              { text: "\xA7aGreen", value: "\xA7a" },
              { text: "\xA7bAqua", value: "\xA7b" },
              { text: "\xA7cRed", value: "\xA7c" },
              { text: "\xA7dLight Purple", value: "\xA7d" },
              { text: "\xA7eYellow", value: "\xA7e" },
              { text: "\xA7fWhite", value: "\xA7f" }
            ]
          }
        ]
      },
      {
        label: "Stats - Beds Broken",
        description: "Show the total Beds Broken.",
        defaults: {
          stats: {
            showBeds: {
              enabled: true,
              displayMode: "both",
              showPrefix: true,
              prefixColor: "\xA77"
            }
          }
        },
        settings: [
          {
            key: "stats.showBeds.enabled",
            type: "toggle",
            text: ["OFF", "ON"],
            description: "Show the total Beds Broken."
          },
          {
            key: "stats.showBeds.displayMode",
            type: "cycle",
            description: "Where to show Beds Broken.",
            values: [
              { text: "Chat", value: "chat" },
              { text: "Tab", value: "tab" },
              { text: "Both", value: "both" }
            ]
          },
          {
            key: "stats.showBeds.showPrefix",
            type: "cycle",
            description: "Show prefix in tab.",
            values: [
              { text: "Prefix ON", value: true },
              { text: "Prefix OFF", value: false }
            ]
          },
          {
            key: "stats.showBeds.prefixColor",
            type: "cycle",
            description: "Prefix color in chat and tab.",
            values: [
              { text: "\xA70Black", value: "\xA70" },
              { text: "\xA71Dark Blue", value: "\xA71" },
              { text: "\xA72Dark Green", value: "\xA72" },
              { text: "\xA73Dark Aqua", value: "\xA73" },
              { text: "\xA74Dark Red", value: "\xA74" },
              { text: "\xA75Dark Purple", value: "\xA75" },
              { text: "\xA76Gold", value: "\xA76" },
              { text: "\xA77Gray", value: "\xA77" },
              { text: "\xA78Dark Gray", value: "\xA78" },
              { text: "\xA79Blue", value: "\xA79" },
              { text: "\xA7aGreen", value: "\xA7a" },
              { text: "\xA7bAqua", value: "\xA7b" },
              { text: "\xA7cRed", value: "\xA7c" },
              { text: "\xA7dLight Purple", value: "\xA7d" },
              { text: "\xA7eYellow", value: "\xA7e" },
              { text: "\xA7fWhite", value: "\xA7f" }
            ]
          }
        ]
      },
      {
        label: "Stats - Ping",
        description: "Show the player's ping (requires Aurora API).",
        defaults: {
          stats: {
            showPing: {
              enabled: true,
              displayMode: "both",
              showPrefix: true,
              prefixColor: "\xA77"
            }
          }
        },
        settings: [
          {
            key: "stats.showPing.enabled",
            type: "toggle",
            text: ["OFF", "ON"],
            description: "Show the player's ping."
          },
          {
            key: "stats.showPing.displayMode",
            type: "cycle",
            description: "Where to show Ping.",
            values: [
              { text: "Chat", value: "chat" },
              { text: "Tab", value: "tab" },
              { text: "Both", value: "both" }
            ]
          },
          {
            key: "stats.showPing.prefixColor",
            type: "cycle",
            description: "Prefix color in chat and tab.",
            values: [
              { text: "\xA70Black", value: "\xA70" },
              { text: "\xA71Dark Blue", value: "\xA71" },
              { text: "\xA72Dark Green", value: "\xA72" },
              { text: "\xA73Dark Aqua", value: "\xA73" },
              { text: "\xA74Dark Red", value: "\xA74" },
              { text: "\xA75Dark Purple", value: "\xA75" },
              { text: "\xA76Gold", value: "\xA76" },
              { text: "\xA77Gray", value: "\xA77" },
              { text: "\xA78Dark Gray", value: "\xA78" },
              { text: "\xA79Blue", value: "\xA79" },
              { text: "\xA7aGreen", value: "\xA7a" },
              { text: "\xA7bAqua", value: "\xA7b" },
              { text: "\xA7cRed", value: "\xA7c" },
              { text: "\xA7dLight Purple", value: "\xA7d" },
              { text: "\xA7eYellow", value: "\xA7e" },
              { text: "\xA7fWhite", value: "\xA7f" }
            ]
          }
        ]
      },
      {
        label: "Stats - Rank",
        description: "Show the player's rank (MVP+, MVP++, etc).",
        defaults: {
          stats: {
            showRank: {
              enabled: true,
              displayMode: "chat"
            }
          }
        },
        settings: [
          {
            key: "stats.showRank.enabled",
            type: "toggle",
            text: ["OFF", "ON"],
            description: "Show the player's rank."
          },
          {
            key: "stats.showRank.displayMode",
            type: "cycle",
            description: "Where to show Rank.",
            values: [
              { text: "Chat", value: "chat" },
              { text: "Tab", value: "tab" },
              { text: "Both", value: "both" }
            ]
          }
        ]
      },
      {
        label: "In-Game Tracker",
        description: "Track real-time events during BedWars matches (beds, kills, deaths, final kills).",
        defaults: {
          inGameTracker: {
            enabled: true,
            showNotifications: true,
            notifyKills: true,
            notifyDeaths: true,
            notifyFinalKills: true,
            notifyBedBreaks: true,
            saveGameLogs: true
          }
        },
        settings: [
          {
            key: "inGameTracker.enabled",
            type: "cycle",
            description: "Enable real-time tracking of in-game events.",
            values: [
              { text: "Tracking: OFF", value: false },
              { text: "Tracking: ON", value: true }
            ]
          },
          {
            key: "inGameTracker.showNotifications",
            type: "cycle",
            description: "Show chat notifications when tracked events occur.",
            values: [
              { text: "Notifications: OFF", value: false },
              { text: "Notifications: ON", value: true }
            ]
          },
          {
            key: "inGameTracker.notifyKills",
            type: "cycle",
            description: "Show notification when a player gets a kill.",
            values: [
              { text: "Notify Kills: OFF", value: false },
              { text: "Notify Kills: ON", value: true }
            ]
          },
          {
            key: "inGameTracker.notifyDeaths",
            type: "cycle",
            description: "Show notification when a player dies.",
            values: [
              { text: "Notify Deaths: OFF", value: false },
              { text: "Notify Deaths: ON", value: true }
            ]
          },
          {
            key: "inGameTracker.notifyFinalKills",
            type: "cycle",
            description: "Show notification when a player gets a final kill.",
            values: [
              { text: "Notify Final Kills: OFF", value: false },
              { text: "Notify Final Kills: ON", value: true }
            ]
          },
          {
            key: "inGameTracker.notifyBedBreaks",
            type: "cycle",
            description: "Show notification when a player breaks a bed.",
            values: [
              { text: "Notify Bed Breaks: OFF", value: false },
              { text: "Notify Bed Breaks: ON", value: true }
            ]
          },
          {
            key: "inGameTracker.saveGameLogs",
            type: "cycle",
            description: "Save game messages to log files for debugging/review.",
            values: [
              { text: "Save Logs: OFF", value: false },
              { text: "Save Logs: ON", value: true }
            ]
          }
        ]
      },
      {
        label: "In-Game Tracker - Tab Display",
        description: "Show real-time game stats in tab list. Alternates between regular stats and game stats.",
        defaults: {
          inGameTracker: {
            showInTab: false,
            tabDelay: 5,
            tabShowKills: true,
            tabShowDeaths: true,
            tabShowFinalKills: true,
            tabShowBedBreaks: true
          }
        },
        settings: [
          {
            key: "inGameTracker.showInTab",
            type: "cycle",
            description: "Show real-time game stats in tab. Alternates with regular stats.",
            values: [
              { text: "Show In Tab: OFF", value: false },
              { text: "Show In Tab: ON", value: true }
            ]
          },
          {
            key: "inGameTracker.tabDelay",
            type: "cycle",
            description: "Delay between alternating regular stats and game stats in tab.",
            values: [
              { text: "Delay: 5 seconds", value: 5 },
              { text: "Delay: 6 seconds", value: 6 },
              { text: "Delay: 7 seconds", value: 7 },
              { text: "Delay: 8 seconds", value: 8 },
              { text: "Delay: 9 seconds", value: 9 },
              { text: "Delay: 10 seconds", value: 10 }
            ]
          },
          {
            key: "inGameTracker.tabShowKills",
            type: "cycle",
            description: "Show kills in tab game stats.",
            values: [
              { text: "Show Kills: OFF", value: false },
              { text: "Show Kills: ON", value: true }
            ]
          },
          {
            key: "inGameTracker.tabShowDeaths",
            type: "cycle",
            description: "Show deaths in tab game stats.",
            values: [
              { text: "Show Deaths: OFF", value: false },
              { text: "Show Deaths: ON", value: true }
            ]
          },
          {
            key: "inGameTracker.tabShowFinalKills",
            type: "cycle",
            description: "Show final kills in tab game stats.",
            values: [
              { text: "Show Final Kills: OFF", value: false },
              { text: "Show Final Kills: ON", value: true }
            ]
          },
          {
            key: "inGameTracker.tabShowBedBreaks",
            type: "cycle",
            description: "Show bed breaks in tab game stats.",
            values: [
              { text: "Show Bed Breaks: OFF", value: false },
              { text: "Show Bed Breaks: ON", value: true }
            ]
          }
        ]
      }
    ];
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/updater/DependencyManager.js
var require_DependencyManager = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/updater/DependencyManager.js"(exports2, module2) {
    var { execSync } = require("node:child_process");
    var path2 = require("node:path");
    var fs = require("node:fs");
    var DependencyManager = class {
      constructor(dataDir, depsDir, api, log, logError, logDebug) {
        this.dataDir = dataDir;
        this.depsDir = depsDir;
        this.api = api;
        this.log = log;
        this.logError = logError;
        this.logDebug = logDebug;
        this.dependencyInstallMarker = path2.join(
          dataDir,
          ".bwu_dependency_install_state"
        );
      }
      isDependencyActuallyAvailable(dep) {
        try {
          const depPath = require.resolve(dep, { paths: [this.depsDir] });
          delete require.cache[depPath];
          require(depPath);
          this.logDebug(`Dependency '${dep}' is available and working.`);
          return { status: "available" };
        } catch (e) {
          this.logDebug(`Dependency '${dep}' verification failed: ${e.message}`);
          const possiblePaths = [
            path2.join(this.depsDir, dep),
            path2.join(this.depsDir, dep, "package.json"),
            path2.join(this.dataDir, "node_modules", dep),
            path2.join(this.dataDir, "node_modules", dep, "package.json")
          ];
          const physicallyExists = possiblePaths.some((p) => fs.existsSync(p));
          if (physicallyExists) {
            this.logDebug(
              `Dependency '${dep}' exists physically but require failed. May work after restart.`
            );
            return { status: "restart_needed" };
          }
          return { status: "missing" };
        }
      }
      getDependencyInstallState() {
        if (!fs.existsSync(this.dependencyInstallMarker)) {
          return null;
        }
        try {
          const state = JSON.parse(
            fs.readFileSync(this.dependencyInstallMarker, "utf8")
          );
          return state;
        } catch (e) {
          this.logDebug(`Error reading dependency install state: ${e.message}`);
          return null;
        }
      }
      saveDependencyInstallState(state) {
        try {
          fs.writeFileSync(
            this.dependencyInstallMarker,
            JSON.stringify(state, null, 2)
          );
        } catch (e) {
          this.logDebug(`Error saving dependency install state: ${e.message}`);
        }
      }
      clearDependencyInstallState() {
        try {
          if (fs.existsSync(this.dependencyInstallMarker)) {
            fs.unlinkSync(this.dependencyInstallMarker);
          }
        } catch (e) {
          this.logDebug(`Error clearing dependency install state: ${e.message}`);
        }
      }
      async ensureDependencies(requiredDependencies, scheduleProxyShutdown) {
        const deps = requiredDependencies || [];
        if (deps.length === 0) return;
        this.log(`Checking dependencies in ${this.dataDir}...`);
        if (!fs.existsSync(this.dataDir))
          fs.mkdirSync(this.dataDir, { recursive: true });
        const prev = this.getDependencyInstallState();
        if (await this.handlePreviousDependencyState(prev, deps)) return;
        const installResult = await this.checkAndInstallDependencies(deps);
        if (installResult.installedNew) {
          this.handlePostInstall(installResult, scheduleProxyShutdown);
        } else {
          this.clearDependencyInstallState();
        }
      }
      async handlePreviousDependencyState(prevState, deps) {
        if (!prevState?.restartNeeded) return false;
        this.log(
          "Verifying dependencies after restart from previous installation..."
        );
        const allWorking = deps.every(
          (dep) => this.isDependencyActuallyAvailable(dep).status === "available"
        );
        if (allWorking) {
          this.log("All dependencies are now working correctly after restart!");
          this.clearDependencyInstallState();
          return true;
        }
        this.log(
          "Some dependencies still not working after restart. Will attempt reinstallation..."
        );
        this.clearDependencyInstallState();
        return false;
      }
      async checkAndInstallDependencies(deps) {
        const installState = this.createInstallState();
        const { missingDeps, hasAnyMissing, installedNew, hadIssues } = this.checkDependenciesStatus(deps, installState);
        if (hasAnyMissing) {
          await this.installAndVerifyDependencies(deps, missingDeps, installState);
          return {
            installState,
            installedNew: true,
            hadIssues: installState.restartNeeded
          };
        }
        installState.restartNeeded = hadIssues;
        this.logInstallSummary(installedNew, hadIssues, installState);
        return { installState, installedNew, hadIssues };
      }
      createInstallState() {
        return {
          timestamp: Date.now(),
          dependencies: {},
          restartNeeded: false
        };
      }
      checkDependenciesStatus(deps, installState) {
        const missingDeps = [];
        let hasAnyMissing = false;
        let installedNew = false;
        let hadIssues = false;
        for (const dep of deps) {
          const status = this.isDependencyActuallyAvailable(dep);
          if (status.status === "available") {
            this.logDebug(`Dependency '${dep}' already available.`);
            installState.dependencies[dep] = "available";
          } else if (status.status === "restart_needed") {
            this.log(`Dependency '${dep}' is installed but requires restart.`);
            installState.dependencies[dep] = "restart_needed";
            installedNew = true;
            hadIssues = true;
          } else {
            this.log(`Dependency '${dep}' not found.`);
            missingDeps.push(dep);
            hasAnyMissing = true;
          }
        }
        return { missingDeps, hasAnyMissing, installedNew, hadIssues };
      }
      async installAndVerifyDependencies(deps, missingDeps, installState) {
        this.log(`Missing dependencies detected: ${missingDeps.join(", ")}`);
        this.log(`Installing all required dependencies: ${deps.join(", ")}`);
        const success = await this.installMultipleDependencies(deps);
        if (!success) {
          this.logError(`FAILED TO INSTALL dependencies after all retries.`);
          throw new Error(`Installation of dependencies failed completely.`);
        }
        await new Promise((resolve) => setTimeout(resolve, 1500));
        this.verifyInstalledDependencies(deps, installState);
      }
      verifyInstalledDependencies(deps, installState) {
        let hasIssues = false;
        for (const dep of deps) {
          const post = this.isDependencyActuallyAvailable(dep);
          if (post.status === "available") {
            this.log(`Dependency '${dep}' verified successfully.`);
            installState.dependencies[dep] = "installed_working";
          } else if (post.status === "restart_needed") {
            this.log(
              `Dependency '${dep}' installed but needs restart to be fully loaded.`
            );
            installState.dependencies[dep] = "installed_restart_needed";
            hasIssues = true;
          } else {
            this.log(
              `Dependency '${dep}' installation uncertain. Will verify after restart.`
            );
            installState.dependencies[dep] = "uncertain";
            hasIssues = true;
          }
        }
        installState.restartNeeded = hasIssues;
      }
      logInstallSummary(installedNew, hadIssues, installState) {
        this.logDebug(
          `Install summary: installedNew=${installedNew}, hadIssues=${hadIssues}`
        );
        this.logDebug(
          `Dependencies state: ${JSON.stringify(installState.dependencies)}`
        );
      }
      async installMultipleDependencies(deps, maxRetries = 3) {
        const depsString = deps.join(" ");
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            this.logDebug(
              `Installing dependencies - Attempt ${attempt}/${maxRetries}`
            );
            this.logDebug(`Dependencies to install: ${depsString}`);
            const strategies = [
              () => execSync(`npm install ${depsString} --no-save --prefer-offline`, {
                cwd: this.dataDir,
                stdio: this.api?.debug ? "inherit" : "pipe"
              }),
              () => execSync(
                `npm install ${depsString} --no-save --legacy-peer-deps --prefer-offline`,
                {
                  cwd: this.dataDir,
                  stdio: this.api?.debug ? "inherit" : "pipe"
                }
              ),
              () => execSync(
                `npm install ${depsString} --no-save --force --prefer-offline`,
                {
                  cwd: this.dataDir,
                  stdio: this.api?.debug ? "inherit" : "pipe"
                }
              )
            ];
            const strategy = strategies[Math.min(attempt - 1, strategies.length - 1)];
            strategy();
            this.logDebug(
              `Installation of dependencies succeeded on attempt ${attempt}`
            );
            return true;
          } catch (e) {
            this.logDebug(`Installation attempt ${attempt} failed: ${e.message}`);
            if (attempt === maxRetries) {
              this.logDebug(`All ${maxRetries} installation attempts failed`);
              this.logDebug(`Final error: ${e.message}`);
              this.logDebug(`Error stack: ${e.stack}`);
              return false;
            }
            await new Promise((resolve) => setTimeout(resolve, 1e3 * attempt));
          }
        }
        return false;
      }
      handlePostInstall({ installState, hadIssues }, scheduleProxyShutdown) {
        this.saveDependencyInstallState(installState);
        const installedDeps = Object.entries(installState.dependencies).filter(([_, status]) => status !== "available").map(([dep]) => dep);
        if (installedDeps.length > 0) {
          this.log(`Installed dependencies: ${installedDeps.join(", ")}`);
        }
        if (hadIssues) {
          this.log(
            "Dependencies installed. Some may need proxy restart to work properly."
          );
          this.log("Proxy will restart to load dependencies correctly.");
        } else {
          this.log("New dependencies installed and verified successfully.");
          this.log("Proxy will restart to ensure clean dependency loading.");
        }
        this.log(`Proxy will close in 5 seconds...`);
        scheduleProxyShutdown();
        throw new Error("Closing proxy to load dependencies.");
      }
    };
    module2.exports = { DependencyManager };
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/updater/UpdateManager.js
var require_UpdateManager = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/updater/UpdateManager.js"(exports2, module2) {
    var { spawn } = require("node:child_process");
    var crypto = require("node:crypto");
    var https = require("node:https");
    var path2 = require("node:path");
    var os = require("node:os");
    var fs = require("node:fs");
    var GITHUB_API_URL = "https://api.github.com/repos/Grillekkj/BedWars-Utilities-a-Plugin-For-StafishProxy/releases/latest";
    var UpdateManager = class {
      constructor(pluginsDir, depsDir, metadata, log, logError, logDebug, fileManager) {
        this.pluginsDir = pluginsDir;
        this.depsDir = depsDir;
        this.metadata = metadata;
        this.log = log;
        this.logError = logError;
        this.logDebug = logDebug;
        this.fileManager = fileManager;
      }
      getLatestRelease() {
        return new Promise((resolve, reject) => {
          const requestOptions = {
            hostname: "api.github.com",
            path: new URL(GITHUB_API_URL).pathname,
            method: "GET",
            headers: { "User-Agent": "Starfish-BWU-Updater" },
            timeout: 1e4
          };
          const req = https.request(requestOptions, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              https.get(
                res.headers.location,
                { headers: { "User-Agent": "Starfish-BWU-Updater" } },
                (res2) => {
                  this.handleGitHubResponse(res2, resolve, reject);
                }
              ).on("error", (e) => {
                this.logDebug(`Redirect request error: ${e.message}`);
                reject(e);
              });
            } else {
              this.handleGitHubResponse(res, resolve, reject);
            }
          });
          req.on("error", (e) => {
            this.logDebug(`Request error: ${e.message}`);
            reject(new Error(e.message || "Network error"));
          });
          req.on("timeout", () => {
            this.logDebug("Request timeout occurred");
            req.destroy();
            reject(new Error("GitHub connection timed out."));
          });
          req.end();
        });
      }
      handleGitHubResponse(res, resolve, reject) {
        if (res.statusCode !== 200) {
          const error = `GitHub API responded with status ${res.statusCode}`;
          this.logDebug(`GitHub API error: ${error}`);
          return reject(new Error(error));
        }
        let data = "";
        res.on("data", (chunk) => data += chunk);
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            this.logDebug(`Failed to parse GitHub response: ${e.message}`);
            reject(new Error("Failed to process GitHub response."));
          }
        });
      }
      isNewerVersion(localVersion, remoteVersion) {
        try {
          const local = localVersion.replace("v", "").split(".").map(Number);
          const remote = remoteVersion.replace("v", "").split(".").map(Number);
          for (let i = 0; i < Math.max(local.length, remote.length); i++) {
            const l = local[i] || 0;
            const r = remote[i] || 0;
            if (r > l) return true;
            if (r < l) return false;
          }
        } catch (e) {
          this.logDebug(`Version comparison error: ${e.message}`);
          this.logDebug(`Error stack: ${e.stack}`);
          this.logError(`Error comparing versions: ${e.message}`);
        }
        return false;
      }
      async unzipUpdate(zipPath, destDir) {
        const admZipPath = path2.join(this.depsDir, "adm-zip");
        let AdmZip;
        try {
          AdmZip = require(admZipPath);
        } catch (e) {
          this.logDebug(`Failed to load adm-zip from ${admZipPath}: ${e.message}`);
          this.logError(`Failed to load 'adm-zip' from: ${admZipPath}`);
          try {
            AdmZip = require("adm-zip");
          } catch (e2) {
            this.logDebug(`Fallback adm-zip require failed: ${e2.message}`);
            this.logDebug(`Error stack: ${e2.stack}`);
            this.logError(`Failed fallback require('adm-zip'). Module is missing.`);
            throw new Error(`Dependency 'adm-zip' not found. Update failed.`);
          }
        }
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(destDir, true);
        const files = fs.readdirSync(destDir);
        const folder = files.find(
          (file) => fs.statSync(path2.join(destDir, file)).isDirectory() && file.toLowerCase().startsWith("grillekkj-bedwars-utilities-a-plugin-for-stafishproxy")
        );
        if (!folder) {
          const srcDir = path2.join(destDir, "bw-utilities-src");
          if (fs.existsSync(srcDir)) {
            return destDir;
          }
          const error = "Could not find repository root folder or 'bw-utilities-src' folder in release zip.";
          this.logDebug(`Available files in extracted zip: ${files.join(", ")}`);
          throw new Error(error);
        }
        return path2.join(destDir, folder);
      }
      prepareUpdateFiles(extractedRoot) {
        const readmePath = path2.join(extractedRoot, "README.md");
        if (fs.existsSync(readmePath)) {
          fs.unlinkSync(readmePath);
        }
      }
      createExternalUpdater(extractedRoot, updateTempDir) {
        const updaterScriptPath = path2.join(
          os.tmpdir(),
          `bwu_external_updater_${crypto.randomBytes(4).toString("hex")}.js`
        );
        const oldCoreFile = path2.join(
          this.pluginsDir,
          this.metadata.currentFileName
        );
        const oldSrcDir = path2.join(this.pluginsDir, "bw-utilities-src");
        const failedUpdateMarker = this.fileManager.failedUpdateMarker;
        const scriptContent = `
const fs = require('fs');
const path = require('path');

const oldCoreFile = ${JSON.stringify(oldCoreFile)};
const oldSrcDir = ${JSON.stringify(oldSrcDir)};
const newContentDir = ${JSON.stringify(extractedRoot)};
const pluginsDir = ${JSON.stringify(this.pluginsDir)};
const updateTempDir = ${JSON.stringify(updateTempDir)}; 
const selfScript = ${JSON.stringify(updaterScriptPath)};
const failedUpdateMarker = ${JSON.stringify(failedUpdateMarker)};

console.log('[BWU Updater] Waiting 2 seconds for proxy to close...');

setTimeout(() => {
    let tempBackupDir = null;
    
    try {
        console.log('[BWU Updater] Creating temporary backup...');
        tempBackupDir = path.join(require('os').tmpdir(), \`bwu-temp-backup-\${Date.now()}\`);
        
        if (!fs.existsSync(tempBackupDir)) {
            fs.mkdirSync(tempBackupDir, { recursive: true });
        }
        
        if (fs.existsSync(oldCoreFile)) {
            fs.copyFileSync(oldCoreFile, path.join(tempBackupDir, path.basename(oldCoreFile)));
        }
        if (fs.existsSync(oldSrcDir)) {
            copyDirectory(oldSrcDir, path.join(tempBackupDir, "bw-utilities-src"));
        }

        console.log('[BWU Updater] Removing old files...');
        if (fs.existsSync(oldCoreFile)) fs.unlinkSync(oldCoreFile);
        if (fs.existsSync(oldSrcDir)) fs.rmSync(oldSrcDir, { recursive: true, force: true });

        console.log('[BWU Updater] Installing new files...');
        const newFiles = fs.readdirSync(newContentDir);
        for (const file of newFiles) {
            const oldPath = path.join(newContentDir, file);
            const newPath = path.join(pluginsDir, file);
            
            if (file.toLowerCase() === 'readme.md') continue;
            
            copyDirectory(oldPath, newPath);
        }

        console.log('[BWU Updater] Cleaning up temporary files...');
        fs.rmSync(updateTempDir, { recursive: true, force: true });

        console.log('[BWU Updater] Update completed successfully!');
        console.log('[BWU Updater] Please restart the proxy to load the new version.');
        
        if (fs.existsSync(failedUpdateMarker)) {
            fs.unlinkSync(failedUpdateMarker);
        }

    } catch (e) {
        console.error('[BWU Updater] UPDATE FAILED:', e.message);
        console.error('[BWU Updater] Error details:', e.stack);
        
        if (tempBackupDir && fs.existsSync(tempBackupDir)) {
            try {
                console.log('[BWU Updater] Attempting rollback...');
                
                if (fs.existsSync(oldCoreFile)) fs.unlinkSync(oldCoreFile);
                if (fs.existsSync(oldSrcDir)) fs.rmSync(oldSrcDir, { recursive: true, force: true });
                
                const backupFiles = fs.readdirSync(tempBackupDir);
                for (const file of backupFiles) {
                    const backupPath = path.join(tempBackupDir, file);
                    const restorePath = path.join(pluginsDir, file);
                    copyDirectory(backupPath, restorePath);
                }
                
                console.log('[BWU Updater] Rollback completed successfully.');
                console.log('[BWU Updater] Old version has been restored.');
                
            } catch (rollbackError) {
                console.error('[BWU Updater] ROLLBACK ALSO FAILED:', rollbackError.message);
                console.error('[BWU Updater] Manual intervention may be required.');
            }
        }
        
        try {
            fs.writeFileSync(failedUpdateMarker, Date.now().toString());
        } catch (markerError) {
            console.error('[BWU Updater] Could not create failure marker:', markerError.message);
        }
    } finally {
        if (tempBackupDir && fs.existsSync(tempBackupDir)) {
            try {
                fs.rmSync(tempBackupDir, { recursive: true, force: true });
            } catch (cleanupError) {
                console.error('[BWU Updater] Could not clean up temporary backup:', cleanupError.message);
            }
        }
        
        console.log('[BWU Updater] External updater will close in 5 seconds...');
        setTimeout(() => {
            try { fs.unlinkSync(selfScript); } catch(e) {}
            process.exit(0);
        }, 5000);
    }
}, 2000);

function copyDirectory(src, dest) {
    const stat = fs.statSync(src);
    
    if (stat.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        
        const files = fs.readdirSync(src);
        for (const file of files) {
            copyDirectory(path.join(src, file), path.join(dest, file));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}
`;
        fs.writeFileSync(updaterScriptPath, scriptContent);
        return updaterScriptPath;
      }
      launchUpdaterAndExit(scriptPath) {
        this.log("Proxy will close in 5 seconds to allow update installation...");
        setTimeout(() => {
          this.log("Starting external update process...");
          const child = spawn("node", [scriptPath], {
            detached: true,
            stdio: ["ignore", "ignore", "ignore"]
          });
          child.unref();
          setTimeout(() => {
            this.log("Closing proxy now...");
            process.exit(0);
          }, 2e3);
        }, 5e3);
      }
    };
    module2.exports = { UpdateManager };
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/updater/FileManager.js
var require_FileManager = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/updater/FileManager.js"(exports2, module2) {
    var https = require("node:https");
    var path2 = require("node:path");
    var fs = require("node:fs");
    var FileManager = class {
      constructor(dataDir, logDebug) {
        this.dataDir = dataDir;
        this.logDebug = logDebug;
        this.updateInProgressMarker = path2.join(dataDir, ".bwu_update_in_progress");
        this.lastUpdateCheckMarker = path2.join(dataDir, ".bwu_last_update_check");
        this.failedUpdateMarker = path2.join(dataDir, ".bwu_update_failed");
      }
      isUpdateInProgress() {
        if (!fs.existsSync(this.updateInProgressMarker)) {
          return false;
        }
        try {
          const startTime = Number.parseInt(
            fs.readFileSync(this.updateInProgressMarker, "utf8")
          );
          const currentTime = Date.now();
          const oneHour = 60 * 60 * 1e3;
          if (currentTime - startTime > oneHour) {
            this.clearUpdateInProgress();
            return false;
          }
          return true;
        } catch (e) {
          this.logDebug(`Error reading update in progress marker: ${e.message}`);
          return false;
        }
      }
      markUpdateInProgress() {
        try {
          fs.writeFileSync(this.updateInProgressMarker, Date.now().toString());
        } catch (e) {
          this.logDebug(`Error creating update in progress marker: ${e.message}`);
        }
      }
      clearUpdateInProgress() {
        try {
          if (fs.existsSync(this.updateInProgressMarker)) {
            fs.unlinkSync(this.updateInProgressMarker);
          }
        } catch (e) {
          this.logDebug(`Error clearing update in progress marker: ${e.message}`);
        }
      }
      hasRecentUpdateCheck() {
        if (!fs.existsSync(this.lastUpdateCheckMarker)) {
          return false;
        }
        try {
          const lastCheck = Number.parseInt(
            fs.readFileSync(this.lastUpdateCheckMarker, "utf8")
          );
          const currentTime = Date.now();
          const oneHour = 60 * 60 * 1e3;
          return currentTime - lastCheck < oneHour;
        } catch (e) {
          this.logDebug(`Error reading last update check marker: ${e.message}`);
          return false;
        }
      }
      markUpdateCheck() {
        try {
          fs.writeFileSync(this.lastUpdateCheckMarker, Date.now().toString());
        } catch (e) {
          this.logDebug(`Error creating update check marker: ${e.message}`);
        }
      }
      hasRecentUpdateFailure() {
        if (!fs.existsSync(this.failedUpdateMarker)) {
          return false;
        }
        try {
          const failureTime = Number.parseInt(
            fs.readFileSync(this.failedUpdateMarker, "utf8")
          );
          const currentTime = Date.now();
          const twentyFourHours = 24 * 60 * 60 * 1e3;
          return currentTime - failureTime < twentyFourHours;
        } catch (e) {
          this.logDebug(`Error reading failure marker: ${e.message}`);
          return false;
        }
      }
      markUpdateFailure() {
        try {
          fs.writeFileSync(this.failedUpdateMarker, Date.now().toString());
        } catch (e) {
          this.logDebug(`Error creating failure marker: ${e.message}`);
        }
      }
      clearUpdateFailureMarker() {
        try {
          if (fs.existsSync(this.failedUpdateMarker)) {
            fs.unlinkSync(this.failedUpdateMarker);
          }
        } catch (e) {
          this.logDebug(`Error clearing failure marker: ${e.message}`);
        }
      }
      downloadFile(url, dest) {
        return new Promise((resolve, reject) => {
          const file = fs.createWriteStream(dest);
          https.get(
            url,
            { headers: { "User-Agent": "Starfish-BWU-Updater" } },
            (response) => {
              if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                this.downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
              }
              if (response.statusCode !== 200) {
                const error = `Failed to download ${url}. Status: ${response.statusCode}`;
                this.logDebug(`Download error: ${error}`);
                return reject(new Error(error));
              }
              response.pipe(file);
              file.on("finish", () => file.close(resolve));
            }
          ).on("error", (e) => {
            this.logDebug(`Download request error: ${e.message}`);
            fs.unlink(dest, () => {
            });
            reject(e);
          });
        });
      }
    };
    module2.exports = { FileManager };
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/updater/updater.js
var require_updater = __commonJS({
  "../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-src/updater/updater.js"(exports2, module2) {
    var crypto = require("node:crypto");
    var path2 = require("node:path");
    var os = require("node:os");
    var fs = require("node:fs");
    var { DependencyManager } = require_DependencyManager();
    var { UpdateManager } = require_UpdateManager();
    var { FileManager } = require_FileManager();
    var Updater2 = class {
      constructor(api, metadata) {
        this.api = api;
        this.metadata = metadata;
        this.baseDir = process.pkg ? path2.dirname(process.execPath) : path2.join(__dirname, "..", "..", "..", "..");
        this.dataDir = path2.join(this.baseDir, "data");
        this.pluginsDir = path2.join(this.baseDir, "plugins");
        this.depsDir = path2.join(this.dataDir, "node_modules");
        this.executionId = crypto.randomBytes(4).toString("hex");
        this.log = (msg) => console.log(`[BWU Updater] ${msg}`);
        this.logError = (msg) => console.error(`[BWU Updater] ${msg}`);
        this.logDebug = (msg) => {
          if (this.api?.debug) {
            console.log(`[BWU Updater Debug] ${msg}`);
          }
        };
        this.fileManager = new FileManager(this.dataDir, this.logDebug);
        this.dependencyManager = new DependencyManager(
          this.dataDir,
          this.depsDir,
          this.api,
          this.log,
          this.logError,
          this.logDebug
        );
        this.updateManager = new UpdateManager(
          this.pluginsDir,
          this.depsDir,
          this.metadata,
          this.log,
          this.logError,
          this.logDebug,
          this.fileManager
        );
      }
      async checkForUpdates() {
        if (globalThis.bwuUpdaterExecutionId) {
          return;
        }
        globalThis.bwuUpdaterExecutionId = this.executionId;
        try {
          if (this.fileManager.isUpdateInProgress()) {
            this.log("Update already in progress.");
            return;
          }
          if (this.fileManager.hasRecentUpdateCheck()) {
            this.log("Update check already performed recently.");
            return;
          }
          if (this.fileManager.hasRecentUpdateFailure()) {
            this.log("Skipping update check - recent update failure detected.");
            this.log("Will retry update checks after 24 hours.");
            return;
          }
          await this.dependencyManager.ensureDependencies(
            this.metadata.requiredDependencies,
            () => this.scheduleProxyShutdown()
          );
          this.log(
            `Checking for updates... (Current Version: ${this.metadata.version})`
          );
          let release;
          try {
            release = await this.updateManager.getLatestRelease();
          } catch (e) {
            this.logDebug(`GitHub connection error: ${e.message}`);
            this.logDebug(`Error stack: ${e.stack}`);
            this.logError(`Failed to connect to GitHub: ${e.message}`);
            this.log(
              "Update check failed. Plugin will continue running with current version."
            );
            return;
          }
          const latestVersion = release.tag_name;
          if (!this.updateManager.isNewerVersion(this.metadata.version, latestVersion)) {
            this.log(`Plugin is up to date.`);
            this.fileManager.clearUpdateFailureMarker();
            this.fileManager.markUpdateCheck();
            return;
          }
          this.log(
            `New version ${latestVersion} found. Starting update process...`
          );
          this.fileManager.markUpdateInProgress();
          const uniqueId = crypto.randomBytes(8).toString("hex");
          const updateDir = path2.join(os.tmpdir(), `bwu-update-${uniqueId}`);
          const zipPath = path2.join(updateDir, "update.zip");
          if (fs.existsSync(updateDir)) {
            fs.rmSync(updateDir, { recursive: true, force: true });
          }
          fs.mkdirSync(updateDir, { recursive: true });
          this.log(`Downloading ${release.zipball_url}...`);
          await this.fileManager.downloadFile(release.zipball_url, zipPath);
          this.log(`Extracting files...`);
          const extractedRoot = await this.updateManager.unzipUpdate(
            zipPath,
            updateDir
          );
          fs.unlinkSync(zipPath);
          this.log(`Preparing update files...`);
          this.updateManager.prepareUpdateFiles(extractedRoot);
          const updaterScriptPath = this.updateManager.createExternalUpdater(
            extractedRoot,
            updateDir
          );
          this.log(`Update downloaded successfully. Starting external updater...`);
          this.fileManager.markUpdateCheck();
          this.fileManager.clearUpdateInProgress();
          this.updateManager.launchUpdaterAndExit(updaterScriptPath);
        } catch (e) {
          this.logDebug(`Update error: ${e.message}`);
          this.logDebug(`Error stack: ${e.stack}`);
          if (!e.message.includes("Closing proxy to load dependencies")) {
            this.logError(`Update failed: ${e.message}`);
            this.fileManager.markUpdateFailure();
            this.log("Plugin will continue running with current version.");
            this.log(`Proxy will close in 5 seconds...`);
            this.scheduleProxyShutdown();
          }
          this.fileManager.clearUpdateInProgress();
        }
      }
      scheduleProxyShutdown() {
        setTimeout(() => {
          this.log("Closing proxy now...");
          process.exit(0);
        }, 5e3);
      }
    };
    module2.exports = { Updater: Updater2 };
  }
});

// ../BedWars-Utilities-a-Plugin-For-StafishProxy-main/BedWars-Utilities-a-Plugin-For-StafishProxy-main/bw-utilities-core-2-0-0.js
var path = require("node:path");
require_patcher();
var BedWarsUtilities = require_BedWarsUtilities();
var configSchema = require_configSchema();
var { Updater } = require_updater();
var pluginFullMetadata = {
  name: "bwu",
  displayName: "BedWars Utilities",
  prefix: "\xA76BWU",
  version: "2.0.0",
  author: "Grille (silly_brazil)",
  description: "A versatile Bedwars plugin offering a variety of useful features to enhance gameplay.",
  dependencies: [{ name: "denicker", minVersion: "1.1.0" }],
  optionalDependencies: [{ name: "numdenicker", minVersion: "1.0.3" }],
  // Not a proxy thing, dependency from this own plugin (adm-zip to autoupdater and might add more later)
  requiredDependencies: ["adm-zip"]
};
module.exports = function BedWarsUtilitiesPlugin(api) {
  process.on("uncaughtException", (err, _origin) => {
    console.error(`[BWU FATAL] UNHANDLED ERROR: ${err.stack}`);
  });
  const metadataForAPI = {
    name: pluginFullMetadata.name,
    displayName: pluginFullMetadata.displayName,
    prefix: pluginFullMetadata.prefix,
    version: pluginFullMetadata.version,
    author: pluginFullMetadata.author,
    description: pluginFullMetadata.description,
    dependencies: pluginFullMetadata.dependencies,
    optionalDependencies: pluginFullMetadata.optionalDependencies
  };
  api.metadata(metadataForAPI);
  try {
    pluginFullMetadata.currentFileName = path.basename(__filename);
  } catch (e) {
    console.error(`[BWU Updater] Failed to start: ${e.message}`);
  }
  const bwu = new BedWarsUtilities(api);
  api.initializeConfig(configSchema);
  api.configSchema(configSchema);
  bwu.registerHandlers();
  return bwu;
};
