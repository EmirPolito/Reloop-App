# Nav de abajo

La barra de navegación de la app: una cápsula de cristal con las pestañas y, a su derecha, el botón de crear con su menú. La monta `BarraNavegacion` (en `src/features/navigation`), que le pasa la pestaña activa según la ruta.

## Dónde está cada cosa

Los archivos numerados siguen el orden de la barra, de izquierda a derecha y luego el menú.

| Archivo                 | Qué tiene                                                                                                                        |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `Navegacion.tsx`        | El archivo que junta todo: la píldora, los gestos de la cápsula, abrir y cerrar el menú y a dónde navegar. **Empieza por aquí.** |
| `1-pestanas.tsx`        | Las pestañas (`PESTANAS`) y el botón de cada una, con su icono de línea y su icono relleno.                                      |
| `2-crear.tsx`           | El botón redondo de crear.                                                                                                       |
| `3-menu-crear.tsx`      | El menú que sale sobre el botón de crear: crear anuncio o publicación.                                                           |
| `SuperficieCristal.tsx` | El fondo de cristal (tinte y desenfoque) de la cápsula, el botón y el menú.                                                      |
| `estilos.ts`            | Medidas, curvas de animación y estilos según el tema.                                                                            |

`NavegacionDock.tsx`, `NavegacionFlotante.tsx` y `NavegacionCirculos.tsx` son diseños alternativos que no se usan. Toman de aquí el menú de crear y sus estilos.

## Cómo funciona

- **La píldora.** Marca la pestaña activa y se desliza entre huecos con una curva larga, sin rebote. Mientras se mueve se estira un poco.
- **Gestos.** La cápsula recibe los toques, no cada botón: calcula qué hueco se tocó. La píldora también se arrastra con el dedo; al soltarla queda en el hueco más cercano y navega ahí.
- **Navegar.** La pestaña tocada se marca al instante y la pantalla cambia 45 ms después, para que la animación arranque sin tirones. Un toque nuevo cancela el anterior que aún no se hacía.
- **Crear.** Con el menú abierto, la píldora se oculta y el botón de crear queda marcado. Tocar fuera o el botón de atrás de Android lo cierra.

## Cambios comunes

- **Agregar o quitar una pestaña:** `PESTANAS` e `ICONOS_LINEA` en `1-pestanas.tsx`.
- **Tamaño de la barra o de los iconos:** `ALTO_CAPSULA`, `TAMANO_ICONO` y `TAMANO_ICONO_CREAR` en `estilos.ts`.
- **Velocidad de la píldora o del menú:** `TIMING_PILDORA`, `MENU_ABRIR` y `MENU_CERRAR` en `estilos.ts`.
- **Opciones del menú de crear:** `opciones` en `3-menu-crear.tsx`.
