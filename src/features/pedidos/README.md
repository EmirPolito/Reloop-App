# Pedidos

Pedir en las publicaciones de venta y comida: elegir productos y cantidades, ver el resumen, elegir cómo se paga y mandar el pedido al chat con el vendedor.

## Dónde se ve

- **Publicación** (`marketplace/DetailScreen.tsx`): la lista de productos, el resumen ("Total") y el botón "Siguiente".
- **Drawer de pago**: se abre con "Siguiente". Lleva efectivo o transferencia, la descripción (obligatoria) y "Enviar".
- **Chat**: el pedido llega como tarjeta (`PedidoChat`), con la foto de la publicación en un cuadrito; al tocarla se abre la publicación. Si es por transferencia, al vendedor le recuerda mandar su tarjeta desde la billetera.

## Dónde está cada cosa

| Archivo                         | Qué tiene                                                                                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `formatoPedido.ts`              | Tipos, totales, formato de dinero, qué falta para mandar y cómo se lee de Firestore. Pruebas en `tests/domain.test.ts`.                                        |
| `useMandarPedido.ts`            | Abre o crea el chat ligado a la publicación (sin el mensaje de interés), manda el pedido y lleva a la conversación.                                            |
| `colores.ts`                    | El azul de pedir (`#11A8FF`) y los colores de la publicación, el pedido y las reseñas en claro y oscuro.                                                       |
| `components/ListaProductos.tsx` | Cada producto, sin tarjeta ni borde: foto, nombre con X, descripción corta, precio y cantidad (− y +).                                                         |
| `components/ResumenPedido.tsx`  | "Total" con su flecha; abierto, el desglose.                                                                                                                   |
| `components/SheetPago.tsx`      | El drawer "Método de pago": opciones separadas con su círculo (palomita al elegir) y la descripción. Usa el `SheetEditar` de perfil, en la capa `HOST_SESION`. |
| `components/IconosPago.tsx`     | Efectivo (insignia amarilla con $ blanco) y transferencia (tarjeta en rosa rojizo).                                                                            |
| `components/PedidoChat.tsx`     | La tarjeta del pedido en el chat.                                                                                                                              |

## Cómo funciona

- **Sin productos aparte**, la publicación misma es lo único que se pide, hasta las unidades disponibles. Con productos, hasta `MAX_POR_ITEM` de cada uno.
- **El pedido** se guarda en el mensaje (`pedido`: productos, total, método y descripción). Las reglas revisan su forma.
- Quien publica no ve los controles para pedir en su propia publicación.
