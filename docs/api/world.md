# Mundo y Bloques

Este módulo te permite inspeccionar el estado actual del mundo (bloques cargados en memoria) y enviar paquetes falsos para modificar visualmente el mundo para el jugador local.

## Leer el Estado del Mundo

Lirify incluye un sistema (`api.world`) que hace tracking de todos los chunks y bloques alrededor del jugador. Todo esto se obtiene **de forma sincrónica** (sin promesas) desde la memoria local.

### `api.world.getBlock(x, y, z)`
Obtiene la información de un bloque en las coordenadas dadas.
- Retorna un objeto con la ID del bloque y su meta/data. Retorna nulo si el chunk no está cargado.

### `api.world.hasChunk(chunkX, chunkZ)`
Verifica si un chunk está actualmente cargado en la memoria del proxy.

### `api.world.getLoadedChunks()`
Devuelve una lista con todos los chunks cargados.

### `api.world.getTime()`
Devuelve la hora actual del mundo (ticks de Minecraft).

### `api.world.getWeather()`
Devuelve el clima actual (lluvia, truenos, etc.).

### `api.world.getDimension()`
Devuelve la dimensión (0 = Overworld, -1 = Nether, 1 = End).

### `api.world.getWorldInfo()`
Devuelve información combinada (spawn, gamemode, hardcore, etc.).

---

## Modificar el Mundo (Visual)

Estos métodos envían paquetes que cambian el mundo **solo para el cliente**. El servidor no se dará cuenta.

### `api.sendBlockChange(position, blockId, blockMeta)`
Cambia un bloque visualmente.
- **position**: `{x, y, z}`

### `api.sendMultiBlockChange(chunkX, chunkZ, records)`
Cambia varios bloques de golpe dentro del mismo chunk para mayor rendimiento.

### `api.sendExplosion(x, y, z, radius, records, playerMotion)`
Simula una explosión visual con partículas y ruido.

### `api.sendTimeUpdate(age, time)`
Cambia la hora del día. (ej: hacer que siempre sea de día para ti).

### `api.sendWorldEvent(effectId, position, data, disableRelativeVolume)`
Envía eventos del mundo como sonidos de abrir puertas, romper bloques, etc.

### `api.sendGameStateChange(reason, value)`
Cambia el estado del juego (ej: forzar que empiece a llover, cambiar modo de juego visual).

---

## Scoreboard y Equipos

### `api.getTeams()`
Obtiene la lista de todos los equipos del Scoreboard.

### `api.getPlayerTeam(playerName)`
Busca a qué equipo pertenece un jugador. Útil para saber el color de un jugador en BedWars, por ejemplo.

*(Existen también métodos como `sendScoreboardObjective`, `sendScoreboardScore`, y `sendScoreboardTeam` para crear tu propio scoreboard visual).*
