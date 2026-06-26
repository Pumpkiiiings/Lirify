# Core y Configuración

Estos métodos te permiten definir la identidad de tu plugin, manejar su configuración, registrar comandos y hacer logs en la consola.

## Metadatos

### `api.metadata(meta)`
Define la información principal del plugin. Debe llamarse al inicio.
- **meta** (`Object`):
  - `name` (String): Nombre interno del plugin (sin espacios).
  - `displayName` (String): Nombre para mostrar.
  - `version` (String): Versión de tu plugin.
  - `author` (String): Creador del plugin.
  - `prefix` (String): Prefijo usado en el chat para los logs.
  - `dependencies` (Array): Nombres internos de plugins requeridos.

## Configuración

Lirify incluye un sistema de configuración automático. Se guardará un archivo JSON en `Lirify/config/plugins/tu-plugin.config.json`.

### `api.configSchema(schema)`
Define qué opciones configurables tiene tu plugin.
- **schema** (`Object`): Objeto con las propiedades, valores por defecto y tipos.

**Ejemplo:**
```javascript
api.configSchema({
    activarAutoClicker: { type: 'boolean', default: false, description: 'Activa o desactiva la función.' },
    limiteVelocidad: { type: 'number', default: 10, description: 'Velocidad máxima.' }
});
```

### `api.config.get(key)`
Obtiene el valor de una configuración.
- Retorna el valor actual según el schema.

### `api.config.set(key, value)`
Cambia el valor de una configuración en memoria. No se guarda automáticamente.

### `api.saveCurrentConfig()`
Guarda la configuración actual en el disco duro (el archivo `.json` de tu plugin).

## Logs y Comandos

### `api.log(...args)`
Imprime un mensaje en la consola del proxy. Automáticamente incluye el prefijo del plugin.

### `api.debugLog(...args)`
Imprime un mensaje en la consola solo si el plugin tiene activado el modo de depuración (`debug: true` en su config).

### `api.commands(callback)`
Registra comandos de chat que empiezan con `/tuplugin`.
- **callback(command)**: Función que recibe el objeto `command` (`name`, `args`).

**Ejemplo:**
```javascript
api.commands((command) => {
    if (command.name === 'ayuda') {
        api.chat('§aEstos son mis comandos...');
    }
});
```

## Utilidades del Proxy

### `api.kick(message)`
Desconecta al jugador del proxy con el motivo indicado.

### `api.sendKeepAlive(id)`
Envía un paquete KeepAlive al cliente (usado internamente o para engañar al ping).

### `api.sendCustomPayload(channel, data)`
Envía un CustomPayload (Plugin Message) al cliente de Minecraft.

### `api.getLirifyAPIVersion()`
Devuelve la versión actual de la API de Lirify (ej: `1.0.0`).

### `api.getPluginInstance(targetName)`
Permite obtener la instancia exportada por otro plugin (si lo tienes como dependencia).
