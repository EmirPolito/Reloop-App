# Favoritos

Las publicaciones y los vendedores que guardaste. La ruta que lo muestra es `src/app/(app)/(tabs)/favorites.tsx`.

## Dónde está cada cosa

Los archivos numerados siguen el orden de la pantalla, de arriba hacia abajo.

| Archivo                       | Qué tiene                                                                                                               |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `PantallaFavoritos.tsx`       | El archivo que junta todo: filtros, búsqueda, selección para quitar y qué se muestra. **Empieza por aquí.**             |
| `1-cabecera.tsx`              | El encabezado flotante: volver (o cancelar la selección), el título, el bote, el buscador y las píldoras por categoría. |
| `2-lista.tsx`                 | La lista: primero las tarjetas de vendedor y luego las publicaciones de dos en dos, con su mensaje cuando no hay nada.  |
| `TarjetaVendedorFavorita.tsx` | Una tarjeta de vendedor guardada, con sus publicaciones de ahora. Si ya no tiene ninguna, no se dibuja.                 |
| `CapaSeleccion.tsx`           | La capa que cubre una tarjeta en el modo selección y la marca de rojo claro.                                            |
| `vendedoresFavoritos.ts`      | Los vendedores guardados en Firestore (`useVendedoresFavoritos`).                                                       |
| `components/`                 | `IconoCorazonVacio`, el icono de la lista vacía.                                                                        |

## Cómo funciona

- **Búsqueda.** Busca por nombre de la publicación. Con "@" al inicio busca por quien vende: su usuario o su nombre.
- **Filtros.** Con una categoría solo se ven sus publicaciones; las tarjetas de vendedor solo aparecen con "Todas".
- **Quitar.** En modo selección se quitan varios a la vez, con un solo aviso. Los primeros vuelan al bote y el resto solo se quita. En la selección, las tarjetas de vendedor llevan el prefijo `v:` para no confundirse con una publicación.
- **Carga.** Muestra las mismas tarjetas de carga del inicio (el `Skeleton` de HeroUI).

## Cambios comunes

- **Textos de la lista vacía:** `vacio` en `PantallaFavoritos.tsx`.
- **Espacio entre tarjetas:** `SEPARACION` en `2-lista.tsx`.
- **Cuántas tarjetas vuelan al bote:** `MAX_ANIMADOS` en `PantallaFavoritos.tsx`.
