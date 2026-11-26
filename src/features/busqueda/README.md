# Búsqueda

El módulo que se abre al tocar la lupa del inicio. La ruta que lo muestra es `src/app/(app)/buscar.tsx`.

## Dónde está cada cosa

Los archivos numerados siguen el orden de la pantalla: la cabecera arriba y, debajo, una de tres vistas.

| Archivo                  | Qué tiene                                                                                                                                |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `PantallaBusqueda.tsx`   | El archivo que junta todo: el texto, la categoría, la entrada y salida del módulo, y cuál vista se muestra. **Empieza por aquí.**        |
| `1-cabecera.tsx`         | Lo fijo de arriba: volver, el buscador con frases animadas, las píldoras de categorías (con resultados) y la neblina borrosa.         |
| `2-sin-texto.tsx`        | Sin texto: las búsquedas recientes (se quitan con efecto de polvo y las de abajo suben suave) y las ideas de qué buscar.                 |
| `3-resultados.tsx`       | Con texto o categoría: las publicaciones que coinciden, de dos en dos.                                                                   |
| `4-personas.tsx`         | Con "@" al inicio: las personas que coinciden.                                                                                           |
| `estilos.ts`             | Los estilos del módulo y sus colores según el tema (`useColoresBusqueda`).                                                               |
| `frasesBusqueda.ts`      | Los textos: frases que rotan e ideas.                                                                                                    |
| `modoBusqueda.ts`        | Si el texto busca publicaciones o personas ("@"). Lógica pura, con pruebas en `tests/domain.test.ts`.                                    |
| `repositorioPersonas.ts` | La consulta a Firestore para buscar personas por nombre o @usuario.                                                                      |
| `hooks/`                 | `useBusquedasRecientes`, que guarda las recientes en el teléfono, y `useBuscarPersonas`, la búsqueda de personas con su estado de carga. |
| `components/`            | Piezas que también usan otros módulos.                                                                                                   |

Piezas de `components/`:

- **`PildoraCristal`:** el cristal de los buscadores, las píldoras y los botones redondos de toda la app.
- **`PildoraOpcion`:** las píldoras de opciones.
- **`Neblina` y `NeblinaDesenfocada`:** las neblinas de las cabeceras.
- **`PlaceholderRotativo`:** las frases que rotan en el buscador.
- **`ResultadosUsuarios`:** la lista de personas, con las mismas filas de seguidores y seguidos (`FilaSeguidor` y su esqueleto).

## Cómo funciona

- **Tres vistas.** Según el texto se muestra una de ellas: sin texto, resultados o personas. Cambiar de una a otra usa la misma transición de entrada y salida de los módulos.
- **Escribir no se traba.** La lista se filtra con un valor diferido (`useDeferredValue`), así el teclado responde aunque haya muchas publicaciones.
  - Los botones leen el texto actual con una referencia, así no se crean de nuevo en cada letra.
  - Las filas de resultados están memorizadas: solo se redibujan las que cambian.
- **Entrada y salida.** El módulo entra cada vez que recibe el foco y sale animado antes de navegar a una publicación o un perfil (`registrarSalida` y `conSalida`).
  - El teclado sube después de la entrada, y solo la primera vez.
- **Recientes.** Se guardan al abrir un resultado o al buscar. Al quitar una, el acomodo suave solo se activa mientras se quita, para que al entrar todo aparezca en su lugar.

## Cambios comunes

- **Frases o ideas:** `frasesBusqueda.ts`.
- **Duración del polvo o del acomodo de recientes:** `DURACION_POLVO` y `DURACION_ACOMODO` en `2-sin-texto.tsx`.
- **Neblina de la cabecera:** `TRAMO_NEBLINA` y los cálculos de `altoNeblina` en `1-cabecera.tsx`. El efecto en sí está en `components/NeblinaDesenfocada.tsx`.
