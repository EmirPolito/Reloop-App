# Reseñas

Las estrellas reales de venta y comida: el vendedor pide la calificación en el chat, quien compró la escribe y sale en la publicación.

## Dónde se ve

- **Chat, vendedor**: en la conversación de una publicación suya de venta o comida, el botón largo "Pedir calificación" (`BotonPedirCalificacion`), anclado arriba del input. Al pedirla sale un aviso de "Calificación pedida"; su mensaje no se ve en su conversación. Se apaga cuando ya la pidió o ya lo calificaron.
- **Chat, comprador**: la solicitud (`SolicitudChat`) con las estrellas para elegir, el texto y "Enviar reseña". Ya enviada, la solicitud se va del chat: la reseña solo se ve en la publicación.
- **Publicación**: "Reseñas" con el promedio y una reseña a la vez, con flechas (`TarjetaResenas`). Junto al título, el promedio con su estrella.
- **Perfil**: "Valoración" es el promedio de todas las reseñas de sus publicaciones (`averageRatingLabel` en `marketplace/rules.ts`).

## Dónde está cada cosa

| Archivo                                 | Qué tiene                                                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `formatoResena.ts`                      | Tipos, la palabra de cada estrella, qué falta para mandar y cómo se lee la solicitud del chat. Pruebas en `tests/domain.test.ts`. |
| `repositorioResenas.ts`                 | Las reseñas en vivo (`useResenas`), si ya se pidió o se escribió (`useEstadoResena`) y `enviarResena`.                            |
| `components/Estrellas.tsx`              | Estrellas de 1 a 5: para elegir (con la palabra al lado y un salto en ola) o solo para mostrar, con medias estrellas.             |
| `components/TarjetaResenas.tsx`         | La sección de reseñas de la publicación.                                                                                          |
| `components/SolicitudChat.tsx`          | El mensaje de la solicitud en el chat.                                                                                            |
| `components/BotonPedirCalificacion.tsx` | El botón del vendedor.                                                                                                            |

## Cómo funciona

- **Pedirla**: el mensaje (`calificacion`) y `productos/{id}/solicitudes/{compradorId}` se guardan en el mismo lote. Solo el dueño de la publicación puede. El resumen del chat (`lastMessage`) guarda también el mensaje de antes (`previo`): en la lista de chats del vendedor sigue ese, no la solicitud.
- **Escribirla**: la reseña (`productos/{id}/resenas/{uid}`) y la suma a `resenasTotal`/`resenasCount` de la publicación van en un solo lote. Las reglas exigen la solicitud y que la suma cuadre. Una por persona; no se edita.
- **Desde cero**: las publicaciones empiezan sin estrellas. El 5.0 inicial de antes y el "Califica el producto" ya no se usan.
