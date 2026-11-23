# Notificaciones

Los avisos de lo que otras personas hacen contigo: seguirte, escribirte, guardar o comentar tus publicaciones. Incluye la pantalla con la lista y los banners que aparecen arriba cuando llega una nueva.

La ruta que lo muestra es `src/app/(app)/notificaciones.tsx`. Los banners se montan en `src/app/(app)/_layout.tsx`.

## Dónde está cada cosa

### Pantalla

Los archivos numerados siguen el orden de la pantalla, de arriba hacia abajo.

| Archivo                      | Qué tiene                                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `PantallaNotificaciones.tsx` | El archivo que junta todo: filtros, búsqueda, selección para eliminar y qué se muestra. **Empieza por aquí.**            |
| `1-cabecera.tsx`             | El encabezado flotante: volver (o cancelar la selección), el título, más opciones, el buscador y las píldoras de filtro. |
| `2-lista.tsx`                | La lista agrupada por antigüedad, con tarjetas que se deslizan para eliminarlas, y su esqueleto de carga.                |

Las piezas de `components/`:

- **`FilaNotificacion`:** una notificación en la lista.
- **`AvatarNotificacion`:** el avatar con el icono del tipo de aviso.
- **`BannerNotificacion`:** el banner que baja desde arriba.
- **`ContenedorBanners`:** decide cuándo mostrar un banner: no en la pantalla de notificaciones ni durante la intro.

### Datos y reglas

| Archivo                        | Qué tiene                                                                                                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `ProveedorNotificaciones.tsx`  | Las notificaciones en vivo y sus acciones: marcar como leídas y eliminar (`useNotifications`, `useNotificationActions`).        |
| `repositorioNotificaciones.ts` | Las lecturas y escrituras en Firestore.                                                                                         |
| `mapeoNotificaciones.ts`       | Convierte los documentos de Firestore en notificaciones y al revés.                                                             |
| `reglasNotificaciones.ts`      | Títulos, mensajes, a dónde lleva cada una, grupos por antigüedad y formato de la hora. Tiene pruebas en `tests/domain.test.ts`. |
| `tipos.ts`                     | Los tipos de notificación.                                                                                                      |
| `hooks/`                       | `useNotificar` (avisa a otra persona, sin fallar nunca hacia quien llama) y `useAbrirNotificacion` (la marca leída y navega).   |

## Cómo funciona

- **Filtros y búsqueda.** Filtra por no leídas o por la categoría de la publicación. Con "@" al inicio busca por la persona: su usuario o su nombre.
- **Lista ligera.** El filtrado y los grupos se recalculan solo cuando cambia algo que los afecta. Las funciones que dibujan las filas no se crean de nuevo en cada dibujo.
- **Eliminar.** Al deslizar una tarjeta se elimina una; si falla, vuelve a su lugar. En modo selección se eliminan varias: vuelan al bote y luego se borran.
- **Carga.** Muestra tarjetas de carga con el `Skeleton` de HeroUI.

## Cambios comunes

- **Textos de cada tipo de aviso:** `notificationTitle` y `notificationMessage` en `reglasNotificaciones.ts`.
- **Textos de la lista vacía:** `vacio` en `PantallaNotificaciones.tsx`.
- **Opciones del menú (marcar como leídas, seleccionar):** `MenuOpciones` en `PantallaNotificaciones.tsx`.
