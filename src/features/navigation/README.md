# Navegación

Las rutas de la app, la forma de moverse entre pantallas y la barra de navegación única.

## Dónde está cada cosa

| Archivo               | Qué tiene                                                                                                                                                         |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useNavegacion.ts`    | Navegar con nombres de negocio (`openProduct`, `openUserProfile`, `openNotifications`...). Las pantallas no conocen las rutas: si una cambia, solo se edita aquí. |
| `rutas.ts`            | Las pestañas (`Tab`), la ruta de cada una y qué muestra la barra en cada ruta (`estadoBarraParaRuta`).                                                            |
| `BarraNavegacion.tsx` | La barra de toda la app. Vive fuera de la pila de pantallas, lee la ruta actual y monta el nav de `src/components/navbar`.                                        |
| `opcionesPila.ts`     | Las opciones de la pila de pantallas: sin encabezado, fundido corto y fondo transparente.                                                                         |

## Cómo funciona

- **Una sola barra.** No se duplica al abrir notificaciones o el perfil de otra persona, y su píldora se desliza de forma continua entre pestañas.
- **Dónde se ve.** Aparece en las pestañas, en notificaciones y en el perfil de otras personas. En el resto (publicación, conversación, editar perfil) se oculta con un fundido.
- **Sin dobles toques.** Dos toques seguidos al mismo destino no abren dos veces la misma pantalla. Los toques a destinos distintos sí pasan.

## Cambios comunes

- **Nueva pantalla:** agrega su función en `useNavegacion.ts`.
- **Mostrar u ocultar la barra en una ruta:** `estadoBarraParaRuta` en `rutas.ts`.
- **Duración del cambio de pantalla:** `animationDuration` en `opcionesPila.ts`.
