# Overlay API (Lirify Injectable)

La API de Overlay funciona en conjunto con **Lirify Injectable** (un mod C++ opcional del cliente). Permite a tus plugins de servidor/proxy dibujar interfaces gráficas (texto, barras, cajas) directamente encima de la ventana de Minecraft.

Para interactuar, usas el objeto `api.overlay`.

### `api.overlay.registerWidget(widget)`
Registra un nuevo elemento en la pantalla.
- **widget** (`Object`): Configuración del elemento gráfico.
  - `id` (String): Identificador único de este widget.
  - `type` (String): `text`, `rect`, `image`, etc.
  - `x`, `y` (Number): Coordenadas en la pantalla (normalmente 0.0 a 1.0, o pixeles absolutos dependiendo de Lirify Injectable).
  - `color` (Number/Hex): Color de renderizado.
  - `text` (String): (Si es texto).
  - `scale` (Number): Tamaño.

**Ejemplo:**
```javascript
api.overlay.registerWidget({
    id: 'contador_kills',
    type: 'text',
    x: 0.8, y: 0.1,
    text: 'Kills: 0',
    color: 0xFFFFFF,
    scale: 1.5
});
```

### `api.overlay.updateWidget(id, updates)`
Actualiza en tiempo real las propiedades de un widget existente.
- **id** (String): El ID que usaste al registrarlo.
- **updates** (`Object`): Solo los campos que quieres cambiar.

**Ejemplo:**
```javascript
api.overlay.updateWidget('contador_kills', {
    text: 'Kills: 5',
    color: 0xFF0000 // Cambia a rojo
});
```

### `api.overlay.removeWidget(id)`
Elimina el widget de la pantalla del jugador.

### `api.overlay.clearAll()`
Elimina TODOS los widgets creados por tu plugin en la pantalla. (Se llama automáticamente cuando deshabilitas tu plugin).
