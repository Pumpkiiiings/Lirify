# Eventos e Interceptores

El sistema de eventos te permite reaccionar a cosas que ocurren en el proxy, o interceptar y modificar paquetes de red en tiempo real.

## Escuchar Eventos (Solo Lectura)

### `api.on(eventName, handler)`
Ejecuta tu código cuando sucede un evento. No puedes cancelar el evento con este método (para eso usa intercept).
- **eventName**: Nombre del evento (ej: `player_join`, `player_leave`, `world_change`).
- **handler**: Función que se ejecuta con los datos del evento.

**Ejemplo:**
```javascript
api.on('player_join', (player) => {
    api.log(`El jugador ${player.username} ha entrado al proxy.`);
});
```

### `api.onWorldChange(handler)`
Atajo para escuchar el evento `world_change` (cuando el jugador cambia de servidor o dimensión).

### `api.everyTick(handler)`
Ejecuta la función 20 veces por segundo (sincronizado con los ticks de Minecraft). Ideal para timers, cooldowns o física.

---

## Interceptar Paquetes (Modificar/Cancelar)

Los interceptores te permiten leer paquetes de red y **cancelarlos** o **modificarlos** antes de que lleguen a su destino.

### `api.intercept(packetName, handler)`
Intercepta un paquete específico. 
- Puedes usar nombres abreviados como `chat`, `position`, etc.
- El handler recibe dos parámetros: `(packet, meta)`.
- Si el handler retorna `false`, **el paquete se cancela** y no se envía.

**Ejemplo (Cancelar un paquete):**
```javascript
api.intercept('packet:server:chat', (packet, meta) => {
    if (packet.message.includes('malapalabra')) {
        api.chat('§cEsa palabra está prohibida.');
        return false; // El servidor no recibirá el mensaje
    }
});
```

### `api.interceptPackets(options, handler)`
Intercepta varios paquetes a la vez. (Compatibilidad con la API de Starfish).
- **options**: `{ direction: 'client_to_server' | 'server_to_client', packets: ['chat', 'position'] }`
- **handler**: Igual que `api.intercept`.
