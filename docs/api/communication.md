# Comunicación

Estos métodos te permiten enviarle mensajes, títulos y sonidos al jugador local de forma visual. **Todo lo que envíes usando estos métodos solo lo verá el jugador que usa el proxy**, no los demás jugadores del servidor.

## Mensajes y Chat

### `api.chat(message)`
Envía un mensaje al chat del jugador local.
- **message** (String): El texto del mensaje. Soporta códigos de color (ej: `§aTexto verde`).

### `api.chatInteractive(message)`
Igual que `api.chat`, pero con soporte para hover (texto al pasar el ratón) o clics. Formato interno de JSON chat de Minecraft.

### `api.sendChatToServer(message)`
Envía un mensaje *hacia el servidor*, como si el jugador lo hubiera escrito. Este mensaje **sí lo verán los demás** o ejecutará un comando en el servidor.

### `api.sendActionBar(message)`
Envía un texto arriba de la barra de acceso rápido del jugador.

### `api.sendTitle({ title, subtitle, fadeIn, stay, fadeOut })`
Envía un título gigante en el centro de la pantalla.
- Tiempos medidos en ticks (1 segundo = 20 ticks).

**Ejemplo:**
```javascript
api.sendTitle({
    title: '§c¡PELIGRO!',
    subtitle: '§eEnemigo detectado',
    fadeIn: 10, stay: 40, fadeOut: 10
});
```

---

## Efectos

### `api.sound(soundName, volume, pitch, x, y, z)`
Reproduce un sonido para el jugador local.
- **soundName** (String): Nombre del sonido (ej: `random.orb`, `random.anvil_land`).
- **volume** (Number): Volumen (por defecto 1.0).
- **pitch** (Number): Tono (por defecto 1.0).
- Coordenadas (opcionales): Dónde se reproduce (x, y, z). Si no se ponen, suena donde esté el jugador.

### `api.sendParticle(particleData)`
Genera partículas visibles para el jugador local.
- **particleData**: Objeto con nombre, posiciones, offset y cantidad.
