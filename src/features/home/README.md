# Inicio (home)

La primera pestaña de la app: la cabecera fija arriba y, debajo, una sola lista con el banner, las categorías y las publicaciones.

La ruta que la muestra es `src/app/(app)/(tabs)/index.tsx`.

## Dónde está cada cosa

Los archivos numerados siguen el orden en que aparecen en la pantalla, de arriba hacia abajo.

| Archivo              | Qué tiene                                                                                                                                                   |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PantallaInicio.tsx` | El archivo que junta todo: lee las publicaciones, arma la lista y conecta el scroll con la cabecera. **Empieza por aquí.**                                  |
| `1-cabecera.tsx`     | Lo fijo de arriba: logo, búsqueda y campana; las píldoras de categorías (apagadas con `PILDORAS_ACTIVAS`) y la neblina borrosa que aparece al hacer scroll. |
| `2-banner.tsx`       | El carrusel de anuncios con avance automático y sus puntos.                                                                                                 |
| `3-categorias.tsx`   | Las cinco categorías en píldoras (imágenes de `assets/images/categorias`) que se deslizan de lado. Tocar una filtra la lista.                               |
| `4-titulo.tsx`       | "Todas las publicaciones" (o "Filtrada por…") y cuántas hay.                                                                                                |
| `5-filas.tsx`        | Las filas de la lista: publicaciones de dos en dos, la tarjeta grande del vendedor, y los avisos de vacío y de error.                                       |
| `6-esqueleto.tsx`    | Las tarjetas de carga (el `Skeleton` de HeroUI) mientras llegan las publicaciones.                                                                          |
| `filasInicio.ts`     | Qué filas lleva la lista y en qué orden, según las publicaciones y su estado. Lógica pura, con pruebas en `tests/domain.test.ts`.                           |
| `estilos.ts`         | Los estilos del inicio que dependen del tema (`useEstilosInicio`).                                                                                          |
| `components/`        | Piezas que también usan otros módulos: `TarjetaPublicacion` (búsqueda, favoritos y perfil) e `IconosTarjeta`.                                               |

## Cómo funciona

- **Una sola lista.** El banner, las categorías, el título y las publicaciones son filas de la misma `FlatList`. Solo se dibujan las que están cerca de la pantalla.
- **Tarjeta grande.** Quien tiene insignia (Premium) y 3 o más publicaciones a la vista sale en una tarjeta grande (`seller`). Las demás publicaciones van sueltas de dos en dos (`products`). Ver `agruparPorVendedor` en `marketplace/sellerGroups.ts`.
- **Filas memorizadas.** Cada fila solo se vuelve a dibujar si cambian sus publicaciones o su estado de favorito. Por eso cambiar de categoría o marcar un favorito no redibuja toda la pantalla.
- **Al cambiar de categoría.** Las publicaciones salen (se desvanecen y bajan un poco), se aplica el filtro y el contenido nuevo sube suave a su lugar (`elegirCategoria` en `PantallaInicio.tsx` y `ConTransicionFiltro` en `5-filas.tsx`).
- **Scroll en el hilo de UI.** La neblina de la cabecera y las píldoras siguen al scroll sin pasar por React.
  - Mientras algo se mueve, las animaciones decorativas se pausan (`PausaBrilloContext`): el avance del banner y el brillo de las insignias.

## Cambios comunes

- **Volver a mostrar las píldoras del header:** `PILDORAS_ACTIVAS = true` en `1-cabecera.tsx`.
- **Ajustar la neblina de arriba:** constantes `OPACIDAD_ARRIBA`, `OPACIDAD_PILDORAS`, `INTENSIDAD_DESENFOQUE` y `BAJO_SIN_PILDORAS` en `1-cabecera.tsx`.
- **Tamaño de las categorías:** `ANCHO_PILDORA`, `ALTO_PILDORA` y `SEPARACION` en `3-categorias.tsx`.
- **Separación entre la cabecera y el banner:** `ESPACIO_BAJO_CABECERA` en `PantallaInicio.tsx`.
- **Separación del título de las publicaciones:** `encabezadoSeccion.marginTop` en `estilos.ts`.
