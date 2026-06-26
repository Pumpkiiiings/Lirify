# Lirify Plugin API

¡Bienvenido a la documentación oficial de la API de plugins de Lirify! 

Lirify permite la creación de plugins modulares en JavaScript que pueden interactuar con el mundo de Minecraft, modificar paquetes de red en tiempo real, dibujar interfaces en pantalla y automatizar tareas.

## Estructura de un Plugin

Todos los plugins en Lirify son módulos de Node.js que exportan una función principal. Esta función recibe el objeto `api`, que es el punto de entrada para todas las funcionalidades.

### Ejemplo Básico

```javascript
module.exports = (api) => {
    // 1. Definir los metadatos del plugin (Obligatorio)
    api.metadata({
        name: 'mi-primer-plugin',
        displayName: 'Mi Primer Plugin',
        version: '1.0.0',
        author: 'Tu Nombre'
    });

    // 2. Ejecutar lógica cuando el jugador entra al mundo
    api.onWorldChange(() => {
        api.log('¡Mundo cargado!');
        api.chat('§aPlugin iniciado correctamente.');
    });

    // 3. Registrar un comando personalizado
    api.commands((command) => {
        if (command.name === 'saludar') {
            api.chat('§b¡Hola desde mi plugin!');
        }
    });
};
```

## Categorías de la API

La API es extensa y está dividida en las siguientes categorías. Puedes explorar cada una en la carpeta `api/`:

- [Core y Configuración](api/core.md) - Metadatos, configuración, logs y comandos.
- [Sistema de Eventos](api/events.md) - Escuchar eventos, interceptar paquetes de red y bucles de ticks.
- [Comunicación](api/communication.md) - Enviar mensajes al chat, sonidos, partículas y títulos.
- [Jugadores y Nombres](api/players.md) - Obtener datos de jugadores, distancias y modificar sus nombres (Nicknames/Prefixes).
- [Mundo y Bloques](api/world.md) - Leer el estado del mundo (bloques, chunks, tiempo) y enviar paquetes de mundo.
- [Entidades](api/entities.md) - Spawnear y manipular entidades (NPCs, items tirados, hologramas).
- [Inventarios y GUI](api/inventory.md) - Crear y manejar cofres, items y ventanas personalizadas.
- [Hypixel Utils](api/hypixel.md) - Utilidades específicas para Hypixel (Ping, Parties, Roles).
- [Overlay y HUD](api/overlay.md) - Dibujar texto y widgets en la pantalla del juego usando Lirify Injectable.
