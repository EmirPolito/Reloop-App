# Tarjetas

La billetera de tarjetas para mandar en el chat a qué tarjeta transferir.

Dónde se ve:

- **Billetera del chat:** arriba a la derecha de la conversación (`CabeceraConversacion`). Al tocarla se abre la lista para elegir cuál mandar.
- **Pantalla Tarjetas:** `src/app/(app)/tarjetas.tsx`, desde "+ Nueva" de esa lista.
- **Mensaje:** `BurbujaMensaje` dibuja con `TarjetaChat` los mensajes que traen tarjeta.

## Dónde está cada cosa

| Archivo                           | Qué tiene                                                                                                                                                  |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PantallaTarjetas.tsx`            | El encabezado flotante (volver, título y cuántas hay), la billetera y los campos y diseños de la tarjeta nueva. **Empieza aquí.**                          |
| `formatoTarjeta.ts`               | Tipos, colores, formato de los campos mientras se escriben y qué se copia. Lógica pura con pruebas en `tests/domain.test.ts`.                              |
| `repositorioTarjetas.ts`          | `useTarjetas` (en vivo, una suscripción compartida), guardar y eliminar.                                                                                   |
| `components/TarjetaBancaria.tsx`  | La cara de la tarjeta: arriba la institución, en medio y grande la clave, abajo el beneficiario. Sin textos, es la vista previa del diseño.                |
| `components/Billetera.tsx`        | La funda (blanca en claro, negra en oscuro): a la izquierda el ojo y el beneficiario; a la derecha la institución y la clave. Pila en pirámide de hasta 3. |
| `components/BotonBilletera.tsx`   | La billetera pequeña del encabezado del chat.                                                                                                              |
| `components/SelectorTarjetas.tsx` | La lista para elegir cuál mandar, con "+ Nueva" al final (corto sin tarjetas, del ancho de ellas si hay).                                                  |
| `components/TarjetaChat.tsx`      | El mensaje: solo la tarjeta y "Copiar datos", con su aviso.                                                                                                |

## Cómo funciona

- **Datos:** institución, clave (la CLABE, 18 dígitos) y beneficiario. No hay vencimiento ni CVV.
- **Diseños:** rojo, amarillo (con texto oscuro), azul, negro y morado. La tarjeta nueva se ve gris hasta elegir uno, y no se guarda sin diseño. En el selector, los no elegidos se atenúan.
- **Billetera en la pantalla de tarjetas:** tocarla pasa la de enfrente atrás (no hay carrusel) y el mismo formulario se llena con sus datos para editarla ("Guardar cambios"). El ojo alza la tarjeta y muestra la clave completa. La basura roja, a la derecha a la altura del beneficiario, la borra sin confirmación.
- **Transición:** las tarjetas se quedan montadas y cambian de lugar con un resorte sin rebote (no se vuelven a crear, por eso no parpadean). La de enfrente se hunde en la funda y sale por detrás; las de atrás son opacas y solo se oscurecen. Un recorte en la orilla de abajo de la funda evita que se asomen al hundirse.
- **"Copiar datos"** copia el beneficiario, la institución y la CLABE sin espacios, para pegarla en el banco.
- Las tarjetas viven en `usuarios/{uid}/tarjetas`, que solo su dueña lee y escribe. Las reglas solo aceptan institución, clave, beneficiario y color, también en los mensajes.

## Cambios comunes

- **Colores:** `COLORES_TARJETA` en `formatoTarjeta.ts`, `DEGRADADOS` en `TarjetaBancaria.tsx` y `validCardColor` en `firestore.rules`.
- **Cuántas tarjetas:** `MAX_TARJETAS` en `formatoTarjeta.ts`.
- **Tamaño de la billetera del chat:** `ESCALA` en `BotonBilletera.tsx`.
