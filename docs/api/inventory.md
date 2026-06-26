# Inventarios y GUI

Permite abrir menús personalizados, cambiar ítems y crear interfaces engañando al cliente.

## Ventanas

### `api.openWindow(windowId, windowType, windowTitle, slots, entityId)`
Abre un menú en la pantalla del jugador (como un cofre, horno, mesa de crafteo).
- **windowId**: Un número que identifica a tu ventana.
- **windowType**: String (ej: `minecraft:chest`, `minecraft:hopper`).
- **windowTitle**: String con color (ej: `{"text": "Mi Menú"}`).

Para facilitar esto, hay atajos:
- `api.createChest(windowId, title, slots)`
- `api.createHopper(windowId, title)`
- `api.createDispenser(windowId, title)`

### `api.closeWindow(windowId)`
Obliga al cliente a cerrar la ventana.

---

## Modificar Ítems

### `api.setSlot(windowId, slot, item)`
Cambia un ítem específico en un inventario.
- **windowId**: 0 es tu inventario personal.
- **item**: Objeto JSON representando el ítem (`{blockId, itemCount, itemDamage, nbtData}`).

### `api.setWindowItems(windowId, items)`
Rellena toda la ventana de golpe enviando un array de ítems.

### `api.clearWindow(windowId)`
Vacía todos los ítems de un menú.

### `api.fillWindow(windowId, item)`
Llena todos los espacios de un menú con el mismo ítem. (Útil para fondos de cristal tintado).

### `api.setHeldItemSlot(slot)`
Cambia el ítem que el jugador tiene seleccionado en la hotbar (0 a 8).

---

## Acciones (Engañar al cliente)

### `api.sendTransaction(windowId, action, accepted)`
Fuerza la confirmación o cancelación de un click en el inventario.

### `api.enchantItem(windowId, enchantmentPosition)`
Simula una acción en la mesa de encantamientos.
