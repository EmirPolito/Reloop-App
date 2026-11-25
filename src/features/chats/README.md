# Chats

La lista de chats, la conversación y la búsqueda de personas para escribirles.

Las rutas que lo muestran:

- **Lista:** `src/app/(app)/(tabs)/chats.tsx`.
- **Conversación:** `src/app/(app)/chat/[id].tsx`.
- **Búsqueda:** `src/app/(app)/buscar-chats.tsx`.

## Dónde está cada cosa

### Lista de chats

Los archivos numerados siguen el orden de la pantalla, de arriba hacia abajo.

| Archivo             | Qué tiene                                                                                                                                    |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `PantallaChats.tsx` | El archivo que junta todo: filtros, selección para eliminar y qué se muestra. **Empieza por aquí.**                                          |
| `1-barra.tsx`       | Volver (o cancelar la selección), el título, buscar y eliminar. En modo selección, el bote es el destino al que vuelan los chats eliminados. |
| `2-seguidos.tsx`    | El carrusel de las personas que sigues, para escribirles rápido.                                                                             |
| `3-filtros.tsx`     | Las píldoras Todos, Sin leer y Publicaciones.                                                                                                |
| `4-lista.tsx`       | La tarjeta con los chats, que se deslizan a la izquierda para eliminarlos, y su esqueleto de carga.                                          |

### Conversación y búsqueda

| Archivo                    | Qué tiene                                                                                                                                  |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `PantallaConversacion.tsx` | Una conversación: los mensajes, la tarjeta de la publicación, la cabecera, el visor de fotos y la caja para escribir. Sube con el teclado. |
| `PantallaBuscarChats.tsx`  | Buscar personas para escribirles, con las búsquedas recientes.                                                                             |
| `components/`              | Las piezas de la conversación y la fila de la lista.                                                                                       |

Las piezas de `components/`:

- **`BurbujaMensaje`:** cada mensaje, con su texto y sus fotos. Un mensaje con tarjeta se dibuja con `TarjetaChat` (sin burbuja).
- **`CajaMensaje` y `BotonEnviar`:** la caja para escribir y el botón de enviar.
- **`CabeceraConversacion`:** la cabecera con volver, el avatar y el nombre, y la billetera de tarjetas (de `src/features/tarjetas`) a la derecha.
- **`ProductoConversacion`:** la tarjeta de la publicación de la que parte el chat.
- **`VisorImagenes`:** el visor de fotos a pantalla completa.
- **`FilaChat`:** un chat en la lista.
- **`IconosChats` e `IconosConversacion`:** los iconos.

### Datos y reglas

| Archivo                  | Qué tiene                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProveedorChats.tsx`     | Los chats en vivo y sus acciones: enviar, mandar una tarjeta, marcar como leído y eliminar (`useChats`, `useChatActions`).                                    |
| `repositorioChats.ts`    | Las lecturas y escrituras en Firestore.                                                                                                                       |
| `mapeoChats.ts`          | Convierte los documentos de Firestore en chats y mensajes. Tiene pruebas en `tests/domain.test.ts`.                                                           |
| `filtrosChats.ts`        | Filtra chats por texto.                                                                                                                                       |
| `medidasConversacion.ts` | Altos de la cabecera y de la tarjeta de la conversación.                                                                                                      |
| `hooks/`                 | `useMensajesConversacion` (los mensajes en vivo), `useMensajesSinLeer` (cuántos sin leer tiene cada chat) y `useAbrirChat` (abre o crea el chat con alguien). |

## Cómo funciona

- **Lista ligera.** Cada fila encuentra la categoría de su publicación en un mapa por id, sin recorrer todas las publicaciones. La función que dibuja las filas y las opciones de los filtros no se crean de nuevo en cada dibujo.
- **Eliminar.** Al deslizar un chat se elimina uno. En modo selección se eliminan varios: los primeros vuelan al bote y el resto solo se quita. Se borran solo para ti.
- **Conversación.** La lista se muestra hasta que queda en el último mensaje, para que no brinque.
  - Con el teclado sube con una transformación en el hilo de UI.
  - Solo se animan los mensajes que llegan después de abrirla.
- **Carga.** La lista, la conversación y la búsqueda muestran esqueletos con el `Skeleton` de HeroUI mientras cargan.

## Cambios comunes

- **Filtros de la lista:** `opciones` y `visibleChats` en `PantallaChats.tsx`.
- **Esquinas de la tarjeta o espacio sobre el nav:** `RADIO_TARJETA` en `4-lista.tsx` y `ESPACIO_ABAJO` en `PantallaChats.tsx`.
- **Altos de la conversación:** `medidasConversacion.ts`.
