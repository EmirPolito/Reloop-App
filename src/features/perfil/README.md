# Perfil

El perfil propio (pestaña **Perfil**), el perfil de otra persona, editar perfil y la lista de seguidores.

Las rutas que lo muestran:

- **Perfil propio:** `src/app/(app)/(tabs)/profile.tsx`.
- **Perfil público:** `src/app/(app)/user/[id].tsx`.
- **Editar perfil:** `src/app/(app)/editar-perfil.tsx`.
- **Seguidores:** `src/app/(app)/seguidores/[id].tsx`.

## Dónde está cada cosa

Las dos pantallas usan la misma vista, `VistaPerfil.tsx`. Los archivos numerados siguen el orden de esa vista, de arriba hacia abajo.

| Archivo                     | Qué tiene                                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PantallaPerfil.tsx`        | El perfil propio: tus datos, el lápiz para editar, Premium y los ajustes al final.                                                                                        |
| `PantallaPerfilPublico.tsx` | El perfil de otra persona: Mensaje, Seguir y reportar.                                                                                                                    |
| `VistaPerfil.tsx`           | El archivo que junta todo: el scroll y las animaciones que lo siguen. **Empieza por aquí.**                                                                               |
| `1-portada.tsx`             | La portada (imagen o degradado), que se estira al jalar hacia abajo.                                                                                                      |
| `2-barra-superior.tsx`      | Lo fijo de arriba: el header en que se convierte la portada, el título pequeño y los botones.                                                                             |
| `3-informacion.tsx`         | Avatar, píldoras, nombre, @usuario, descripción, estadísticas y acciones.                                                                                                 |
| `4-publicaciones.tsx`       | Las pestañas Publicaciones y Anuncios: la tarjeta grande (con insignia y 3 o más) y debajo las publicaciones de dos en dos.                                               |
| `5-ajustes.tsx`             | Los ajustes al final del perfil propio: correo, contraseña, notificaciones, modo oscuro, legal, universidad y cerrar sesión.                                              |
| `components/`               | Piezas de esas partes, como `TarjetaVendedor` (la tarjeta grande, que también usa el inicio), `ListaPublicaciones`, `FilaAjuste`, `TogglesAnimados` y `SheetUniversidad`. |
| `editar/`                   | Editar perfil y sus drawers: foto, avatar, fondo, textos, etiquetas y diseño de la tarjeta.                                                                               |
| `seguidores/`               | La lista de seguidores y seguidos.                                                                                                                                        |
| `hooks/`                    | Datos en vivo de un perfil.                                                                                                                                               |
| `drawer/`                   | Colores de los drawers.                                                                                                                                                   |

Los hooks:

- **`usePerfilDe`:** el perfil de otra persona, compartido en toda la app.
- **`usePerfilPublico`:** el perfil público completo.
- **`useSeguidores`:** contadores y seguir.
- **`useSigoA` y `useSiguiendo`:** si sigues a alguien.
- **`useUsernameDisponible`:** si un @usuario está libre.

### Editar perfil y sus drawers (`editar/`)

| Archivo                                                                                                  | Qué tiene                                                                                                            |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `PantallaEditarPerfil.tsx`                                                                               | La pantalla de editar: la vista previa arriba y las filas que abren cada drawer. **Empieza por aquí.**               |
| `SheetEditar.tsx`                                                                                        | El drawer base de todos: línea, título, X y flecha de volver. Se ajusta al alto del contenido. Define `HOST_SESION`. |
| `BotonGuardar.tsx`                                                                                       | El botón principal de los drawers (Guardar, Usar este fondo...), con su ruedita mientras guarda.                     |
| `SheetAvatar.tsx`, `SelectorAvatar.tsx`, `CarruselAvatares.tsx`, `CamaraCircular.tsx`, `AjustarFoto.tsx` | La foto: elegir avatar o foto, tomarla con la cámara y recortarla en círculo.                                        |
| `SheetFondo.tsx`, `CarruselFondos.tsx`                                                                   | El fondo de la portada.                                                                                              |
| `SheetsTexto.tsx`                                                                                        | Nombre, descripción y @usuario (con la revisión de si está libre).                                                   |
| `SheetEtiquetas.tsx`                                                                                     | Las etiquetas del perfil.                                                                                            |
| `SheetTarjeta.tsx`                                                                                       | El diseño de la tarjeta grande: mensaje de abajo, píldora y sus colores, con vista previa real.                      |
| `VistaPreviaPerfil.tsx`                                                                                  | La vista previa del perfil que se va editando.                                                                       |
| `editarTema.ts`                                                                                          | Tipografía, colores y medidas de editar perfil. Los colores de los drawers están en `drawer/temaDrawer.ts`.          |

- **Dónde se dibujan.** Los drawers que usan datos de la sesión se dibujan en `HOST_SESION`, una capa dentro de los providers de la sesión. La capa de HeroUI está fuera de ellos.
- **Guardar.** Mientras guardan, el botón muestra una ruedita y no se puede volver a tocar.

### Datos y reglas

| Archivo                                                                                              | Qué tiene                                                                                                    |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `ProveedorPerfil.tsx`                                                                                | El perfil propio en vivo y cómo guardarlo (`useProfile`).                                                    |
| `temasPerfil.ts`                                                                                     | Tipos y opciones del perfil: colores, píldoras, el diseño de la tarjeta grande y sus límites.                |
| `mapeoPerfil.ts`                                                                                     | Convierte el documento de Firestore en datos del perfil y al revés. Tiene pruebas en `tests/domain.test.ts`. |
| `nombreUsuario.ts`                                                                                   | Reglas del @usuario: normalizar, validar y sugerir. Tiene pruebas.                                           |
| `repositorioPerfil.ts`, `repositorioSeguidores.ts`, `repositorioUsername.ts`, `repositorioCuenta.ts` | Las lecturas y escrituras en Firestore.                                                                      |
| `guardarPerfilPropio.ts`                                                                             | Guarda el perfil propio, subiendo antes la foto si es nueva.                                                 |
| `estilos.ts`                                                                                         | Colores y medidas compartidas del perfil.                                                                    |
| `iconosPerfil.tsx`                                                                                   | Los iconos de línea que usa toda la app.                                                                     |

## Cómo funciona

- **Todo sigue al dedo.** El scroll mueve en el hilo de UI la portada que colapsa en header, el avatar que se encoge, y el título y el desenfoque que entran.
  - Cada animación usa un valor recortado a su rango, así que fuera de él no manda nada.
- **Portada sin temblor.** El estiramiento al jalar hacia abajo va con el driver nativo de Animated, conectado al scroll del lado nativo. Así llega en el mismo cuadro y no tiembla en Expo Go.
- **Pausa al moverse.** Mientras algo se mueve, las animaciones decorativas se pausan (`PausaBrilloContext`): el brillo de las insignias, también durante el rebote de arriba.
- **Carga.** Mientras cargan, las publicaciones y la lista de seguidores muestran esqueletos con el `Skeleton` de HeroUI.

## Cambios comunes

- **Alto de la portada o del header:** `ALTO_PORTADA` en `1-portada.tsx` y `ALTO_HEADER` en `2-barra-superior.tsx`.
- **Tamaño del avatar o cuánto sobresale:** `LADO_AVATAR` en `estilos.ts`, y `SOLAPE_AVATAR` y `BORDE_AVATAR` en `3-informacion.tsx`.
- **Cuándo entra el título pequeño:** `ENTRADA_TITULO` y `ADELANTO_HEADER` en `VistaPerfil.tsx`.
- **Opciones de los ajustes:** `5-ajustes.tsx`.
