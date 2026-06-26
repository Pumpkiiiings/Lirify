# Utilidades para Hypixel

Lirify incluye funciones integradas que facilitan la extracción de datos de Hypixel leyendo automáticamente los paquetes y mensajes de chat en segundo plano.

> [!NOTE]
> **Riesgo general:** La mayoría de métodos aquí leen de caché y tienen **Nulo (0%) riesgo**. Sin embargo, las versiones "Async" ejecutan comandos reales.

## Información de Party

El proxy mantiene un tracking interno de tu party leyendo los mensajes "Party >".

### `api.getPartyInfo()`
Retorna la información conocida de tu party de forma **síncrona** (inmediata, usando datos de la caché).
- **Retorno:** Objeto con `{ leader: String, members: Array<String> }` o `null` si no estás en party.

### `api.getPartyInfoAsync()`
> [!WARNING]
> **Riesgo Medio:** Ejecuta el comando `/party list` en el servidor de forma oculta. Llamarlo muy rápido repetidas veces puede provocar que Hypixel te muttee por hacer spam de comandos o te desconecte. Úsalo con moderación.
Usa promesas. Ejecuta un comando `/party list` de forma oculta en el servidor y espera a leer la respuesta para garantizar que los datos estén 100% actualizados.
- **Retorno:** `Promise<{ leader, members }>`

### `api.isInParty()`
Devuelve `true` si actualmente estás en una party (según la caché).

## Roles y Rangos

### `api.getPlayerRole(username)`
Intenta deducir el rango de un jugador basándose en su nombre en la tablist o en el chat (ej: `[MVP+]`, `[ADMIN]`).
- **Retorno:** String con el rango.

## Latencia (Ping)

### `api.getPing(username)`
Obtiene el ping (ms) del jugador directamente de los paquetes de la tablist que envía el servidor.
- **Retorno:** Número (milisegundos) o `null` si no se conoce.

### `api.getPingAsync(username)`
Devuelve una promesa que se resuelve con el ping exacto.
