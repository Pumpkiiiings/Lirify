# Jugadores y Nombres

Esta categoría te permite buscar jugadores y modificar cómo se ven sus nombres en la pantalla (como su prefijo en la tablist o su tag).

## Obtener Jugadores

### `api.players`
(Getter) Retorna una lista (Array) de todos los jugadores actualmente trackeados por el proxy (los que están renderizados/visibles).

### `api.getPlayer(uuid)`
Obtiene la información de un jugador mediante su UUID.

### `api.getPlayerByName(username)`
Obtiene la información de un jugador mediante su nombre de usuario.

### `api.getCurrentPlayer()`
Obtiene al jugador local (tú).

### `api.getPlayersWithinDistance(radius, origin)`
Devuelve los jugadores en un radio específico.
- **radius** (Number): Distancia máxima en bloques.
- **origin** (Opcional): Si no se pone, se usa tu posición actual.

### `api.calculateDistance(player1, player2)`
Calcula la distancia (euclidiana) entre dos jugadores.

---

## Modificar Nombres y Tags (Display Names)

El módulo de Display Names (solo disponible en Lirify) te permite poner prefijos y sufijos en la Tablist o encima de las cabezas de los jugadores de forma limpia.

### `api.setDisplayNamePrefix(uuid, prefix)`
Establece o sobrescribe el prefijo de un jugador (ej: `§c[Hacker] `).
### `api.appendDisplayNamePrefix(uuid, prefix)`
Añade un texto al final del prefijo existente.
### `api.prependDisplayNamePrefix(uuid, prefix)`
Añade un texto al principio del prefijo existente.

### `api.setDisplayNameSuffix(uuid, suffix)`
Establece o sobrescribe el sufijo de un jugador.
### `api.appendDisplayNameSuffix(uuid, suffix)`
### `api.prependDisplayNameSuffix(uuid, suffix)`

### `api.clearDisplayNamePrefix(uuid)`
### `api.clearDisplayNameSuffix(uuid)`
### `api.clearAllDisplayNames()`
Limpia todas las modificaciones de nombres hechas por **este plugin** específico. Se llama automáticamente cuando apagas el plugin.
