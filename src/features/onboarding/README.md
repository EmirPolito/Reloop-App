# Onboarding

La configuración inicial de una cuenta nueva: un drawer que no se puede cerrar hasta terminar, con cuatro pasos. Aparece la primera vez que la persona entra ya con el correo verificado (su ficha trae `onboardingPendiente`). Se monta en `src/app/(app)/_layout.tsx`.

## Dónde está cada cosa

Los archivos numerados siguen el orden de los pasos.

| Archivo                 | Qué tiene                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `SheetBienvenida.tsx`   | Decide cuándo se muestra, retoma el paso guardado, guarda cada cambio y al terminar lleva a la persona a su perfil.           |
| `DrawerOnboarding.tsx`  | El archivo que junta los pasos: título, flecha de volver y hacia dónde se desliza cada página. **Empieza por aquí.**          |
| `1-avatar.tsx`          | Paso 1: el avatar, con el mismo selector de Editar perfil.                                                                    |
| `2-fondo.tsx`           | Paso 2: el fondo de la portada, en un carrusel.                                                                               |
| `3-etiquetas.tsx`       | Paso 3: las etiquetas del perfil (se puede saltar).                                                                           |
| `4-usuario.tsx`         | Paso 4: el @usuario asignado, que se puede cambiar. Aquí se termina.                                                          |
| `components/`           | `HojaOnboarding` (la card con el título y el indicador de pasos), `BotonPaso`, `CarruselFondos` y `Piezas` (botones y chips). |
| `reglasOnboarding.ts`   | Los pasos, sus nombres y títulos, y las reglas para retomar y terminar. Tiene pruebas en `tests/domain.test.ts`.              |
| `progresoOnboarding.ts` | Recuerda en este dispositivo en qué paso iba cada cuenta.                                                                     |
| `temaOnboarding.ts`     | Tipografía, colores y medidas propios del onboarding.                                                                         |

## Cómo funciona

- **Una sola card.** Cada paso entra deslizándose desde la derecha, como pasar una hoja, y sale hacia la derecha al volver. La card mide al menos lo que el paso del avatar, así no cambia de tamaño entre pasos.
- **En qué paso va.** Bajo el título, el indicador de pasos (`src/components/ui/Pasos.tsx`) muestra los cuatro pasos numerados. Los hechos llevan palomita, el actual un halo y los que faltan quedan apagados. La línea entre dos pasos se llena al avanzar.
- **No se cierra.** No tiene la píldora de arrastre de arriba ni se cierra arrastrando o tocando fuera.
- **Retomar.** Cada paso se guarda en Firebase al confirmarlo. Si la persona cierra la app a la mitad, vuelve al paso donde iba.

## Cambios comunes

- **Agregar o quitar un paso:** `PASOS_ONBOARDING`, `NOMBRES_PASOS` y `TITULOS_ONBOARDING` en `reglasOnboarding.ts`, y su página en `DrawerOnboarding.tsx`.
- **Colores del onboarding:** `coloresOnboarding` en `temaOnboarding.ts`.
- **Colores o tamaño del indicador de pasos:** `coloresPasos` y `LADO` en `src/components/ui/Pasos.tsx`.
