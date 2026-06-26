# Entidades

Te permite generar entidades falsas (NPCs, armaduras, items tirados) y moverlas o editarlas. 

Todas las entidades "falsas" (client-side) deben tener un Entity ID. Es recomendable usar IDs altos (ej: `1000000+`) para evitar que choquen con las entidades reales del servidor.

## Spawnear Entidades

### `api.spawnPlayer(entityId, uuid, x, y, z, yaw, pitch, currentItem)`
Aparece un "clon" de un jugador (un NPC). Necesita un UUID válido; el cliente pedirá la skin automáticamente a Mojang.

### `api.spawnLiving(entityId, type, x, y, z, yaw, pitch, headPitch, velocity)`
Aparece un mob (zombie, esqueleto, cerdo, etc.). El `type` es la ID numérica del mob en Minecraft 1.8.

### `api.spawnObject(entityId, type, x, y, z, pitch, yaw, data)`
Aparece un objeto (minecart, barco, flecha). El `type` es la ID numérica del objeto.

### `api.spawnExperienceOrb(entityId, x, y, z, count)`
Aparece una orbe de experiencia.

---

## Manipular Entidades

### `api.teleportEntity(entityId, x, y, z, yaw, pitch, onGround)`
Teletransporta instantáneamente cualquier entidad a una coordenada.

### `api.moveEntity(entityId, dx, dy, dz, onGround)`
Mueve una entidad suavemente usando posiciones relativas.

### `api.setEntityLook(entityId, yaw, pitch, onGround)`
### `api.setEntityLookAndMove(entityId, dx, dy, dz, yaw, pitch, onGround)`
### `api.setEntityHeadRotation(entityId, headYaw)`

### `api.setEntityVelocity(entityId, velocityX, velocityY, velocityZ)`
Empuja o lanza una entidad (como cuando le pegan a alguien).

### `api.setEntityEquipment(entityId, slot, item)`
Le pone armadura o un ítem en la mano a un jugador o mob.
- **slot**: 0 = Mano, 1 = Botas, 2 = Pantalones, 3 = Pechera, 4 = Casco.

### `api.setEntityMetadata(entityId, metadata)`
Muy potente. Cambia el estado de una entidad (ej: que un NPC esté agachado, prendido en fuego, o tenga un holograma/texto encima flotando).

### `api.animateEntity(entityId, animationId)`
Fuerza una animación (ej: mover el brazo, efecto de daño/crítico, cama).

### `api.addEntityEffect(...)` / `api.removeEntityEffect(...)`
Pone partículas de pociones alrededor de la entidad.

### `api.attachEntity(entityId, vehicleId, leash)`
Monta a la entidad encima de un vehículo (o de otro jugador).
