# ADR-0001: Arquitectura de estado y navegación de ReLoop

**Estado:** Aceptada, con dos partes reemplazadas por el [ADR-0002](0002-rutas-de-archivos-y-datos-en-firestore.md): la pila de navegación propia (regla 7 y opción B) y la restricción de datos solo en memoria.
**Fecha:** 2026-10-28
**Decisores:** Equipo de desarrollo de ReLoop

> **Actualización (2026-10-28).** Este ADR se escribió antes de migrar a Expo Router y de conectar Firestore. Se conserva como registro de por qué el estado se separó por dominio, que sigue vigente. Lo que cambió: la navegación ya no es una pila propia sino rutas de archivos (opción C, aprobada), y los datos ya no viven en memoria sino en Firestore. El árbol actual de proveedores, el modelo de datos y los pendientes que aquí aparecían están en el ADR-0002.

## Contexto

Al auditar el proyecto (Expo SDK 57, React Native 0.86, React 19.2 con React Compiler activo) se encontró esto:

- `MarketplaceApp.tsx` tenía 1.316 líneas y mezclaba estado (autenticación, productos, favoritos, chats, perfil, borradores, tema, navegación), reglas de negocio y pantallas completas. Pasaba a sus hijos listas de hasta 16 props.
- Existía una segunda implementación completa y sin uso (`AppContext.tsx`, `HomeScreen`, `DetailScreen`). Solo se instanciaba como "respaldo" dentro de las pantallas de acceso, que llamaban a `useAppContext()` dentro de `try/catch` para saber si había contexto. Eso rompe las reglas de los hooks y obligaba a React Compiler a omitir esos componentes.
- Había código copiado: cuatro tarjetas de producto, seis estados vacíos, tres encabezados con botón "Volver", dos pantallas de acceso y registro casi idénticas (1.622 líneas entre las dos) y lógica de galería repetida en cuatro sitios.
- La navegación era un `useState` de pantalla sin historial. Producía errores reales: la pestaña resaltada no coincidía con la pantalla al volver de un chat, volver desde un producto abierto desde un chat llevaba al inicio, y el botón "atrás" de Android cerraba la app desde cualquier pantalla.
- El estado no se reiniciaba al cerrar sesión: otra cuenta veía los favoritos y chats de la anterior.
- Había errores sueltos: gesto de deslizar del carrusel con valores obsoletos, animaciones que no se detenían al desmontar, borrador de comentario compartido entre productos, recuperación de contraseña que mostraba "correo enviado" sin enviar nada, `package-lock.json` desincronizado (`npm ci` fallaba), 2 errores de TypeScript y 12 de ESLint (reglas de React Compiler).

Restricciones: la interfaz no puede cambiar de aspecto, no hay dispositivo para probar durante el trabajo y los datos de mercado viven solo en memoria (únicamente la autenticación usa Firebase).

## Decisión

Se separa el estado por dominio con proveedores de contexto, reducers puros y hooks de casos de uso. La navegación pasa a una pila propia dentro de la única ruta de Expo Router.

```
AppThemeProvider
└─ AuthProvider                       sesión de Firebase
   └─ (por sesión, key = uid)
      NavigationProvider              pila de pantallas
      └─ MarketplaceProvider          productos, favoritos, calificaciones, comentarios, reportes, filtros
         └─ ChatProvider              conversaciones
            └─ ProfileProvider        perfil propio
               └─ ProductDraftProvider
                  └─ DraftsProvider   textos a medio escribir (por clave)
```

Reglas que se siguen:

1. **Lógica pura aparte.** Reducers y reglas (`marketplaceReducer`, `chatReducer`, `navigationReducer`, `draftRules`, `rules`) son archivos `.ts` sin React Native. No generan ids ni fechas: llegan en la acción desde el manejador del evento.
2. **Estado y acciones en contextos separados** cuando muchos componentes solo disparan acciones. Las acciones son estables y no provocan renders.
3. **Los hooks orquestan entre dominios** (`usePublishProduct`, `useOpenChat`, `useReportProduct`). Un dominio no importa la UI de otro.
4. **La sesión es desechable.** Todo el estado de mercado se monta bajo `key={uid}`: al cerrar sesión se descarta y nada se filtra a la siguiente cuenta.
5. **Una pantalla, un componente.** Las pantallas leen sus hooks y componen piezas de `components/ui` y de su carpeta `components/`. Las piezas compartidas (`ProductCard`, `Avatar`, `EmptyState`, `BackHeader`, botones, `PerfilCabecera`, `AuthCarouselLayout`) existen una sola vez.
6. **Diferencias visuales como datos.** Lo que distingue a acceso de registro está en `authVariants.ts`, no en código duplicado.
7. **Navegación.** *(Reemplazada por el ADR-0002.)* `NavigationProvider` mantenía una pila (`navigate` reinicia en una pestaña, `push` apila, `back` desapila; desde un chat se volvía siempre a Chats, como antes). `ScreenRouter` convertía cada ruta en su pantalla con un `switch` exhaustivo. Hoy esto lo hace Expo Router con archivos en `src/app`.

## Opciones consideradas

### Opción A: Dejar `MarketplaceApp` y corregir errores sueltos

| Dimensión | Evaluación |
|-----------|------------|
| Complejidad | Baja ahora, alta con cada cambio nuevo |
| Costo | Mínimo hoy |
| Escalabilidad | Mala: todo cambio toca el mismo archivo |
| Familiaridad del equipo | Alta |

**Ventajas:** riesgo cero a corto plazo.
**Desventajas:** la duplicación y los errores de navegación seguirían; React Compiler seguiría omitiendo componentes.

### Opción B: Contextos por dominio, reducers puros y pila de navegación propia (elegida)

| Dimensión | Evaluación |
|-----------|------------|
| Complejidad | Media |
| Costo | Medio (refactor único) |
| Escalabilidad | Buena: cada dominio crece en su carpeta |
| Familiaridad del equipo | Alta: solo React (contexto, reducer, hooks) |

**Ventajas:** sin dependencias nuevas, probable con funciones puras, mantiene la interfaz idéntica y deja el camino a Expo Router.
**Desventajas:** varios archivos pequeños en lugar de uno grande.

### Opción C: Migrar a rutas de Expo Router (`Tabs` + `Stack` + `Stack.Protected`)

| Dimensión | Evaluación |
|-----------|------------|
| Complejidad | Alta |
| Costo | Alto: reescribe transiciones, barra y ciclo de vida de las pantallas |
| Escalabilidad | La mejor a largo plazo (enlaces profundos, rutas tipadas) |
| Familiaridad del equipo | Media |

**Ventajas:** es lo que pide `AGENTS.md`; gestos y botón atrás nativos.
**Desventajas:** cambia las transiciones (hoy son instantáneas) y el comportamiento de la barra animada, lo que contradice la restricción de no tocar la interfaz. No se puede validar sin dispositivo.

### Opción D: Almacén externo (Zustand, Redux Toolkit)

| Dimensión | Evaluación |
|-----------|------------|
| Complejidad | Media |
| Costo | Medio, más una dependencia |
| Escalabilidad | Buena |
| Familiaridad del equipo | Media |

**Ventajas:** selectores finos sin dividir contextos.
**Desventajas:** una dependencia más para un estado que cabe en contexto y reducers; `AGENTS.md` pide preferir módulos de Expo y evitar librerías de terceros innecesarias.

## Análisis de compromisos

B frente a C: C es el destino natural, pero hoy cambiaría el aspecto de la navegación y no se puede comprobar. B deja la interfaz intacta y aísla la navegación detrás de `useNavigationActions` (`navigate`, `push`, `back`, `openProduct`, `openThread`, `openUserProfile`), que tiene la misma forma que una API de router. Pasar a C después es mecánico: cada caso de `ScreenRouter` se vuelve un archivo en `src/app/` y `NavigationProvider` se reemplaza por el router.

B frente a D: se prefiere no sumar una dependencia hasta que haya un problema medido de rendimiento. Separar estado y acciones ya evita renders innecesarios.

## Consecuencias

**Lo que mejora**
- Cada pantalla y cada regla tiene un lugar propio; `MarketplaceApp.tsx` pasa de 1.316 a 130 líneas.
- Menos código: el origen baja de 13.236 a 10.653 líneas (−20 %) y se reparte en más archivos pequeños (63 → 113). Se eliminan los duplicados y la plantilla de Expo sin uso.
- Se corrigen los errores de navegación, el reinicio por sesión, el carrusel y el envío real de recuperación de contraseña.
- Typecheck y lint quedan sin errores (antes: 2 y 12), y React Compiler puede optimizar todos los componentes.

**Lo que se complica**
- Hay más archivos y, entonces, había que respetar el orden de proveedores (`ProfileProvider` dentro de `MarketplaceProvider`). Ya no: todos leen el uid de `SessionUserProvider` (ADR-0002).
- Los textos en borrador, la sesión y la navegación son estado global: usarlos exige estar bajo su proveedor (los hooks fallan con un mensaje claro si no).

**Para revisar más adelante**
- ~~Migrar a Expo Router (opción C) cuando se acepte revisar transiciones y barra.~~ Hecho en el ADR-0002.
- ~~Persistir datos (productos, chats, perfil) detrás de repositorios en lugar de memoria.~~ Hecho en el ADR-0002 (Firestore).
- ~~Agregar pruebas unitarias a los reducers.~~ Hecho: `npm run test:domain` prueba la lógica pura con `tsx` y el ejecutor de pruebas de Node, sin `jest-expo`.
- ~~Dividir `Drawereditarperfil.tsx` (1.307 líneas).~~ Hecho en el ADR-0002 (11 archivos). Sigue pendiente partir `shared/styles.ts` por pantalla.
- Pendientes de producto: ~~enlace a "Recuperar contraseña" desde el inicio de sesión~~ y ~~interruptor de tema oscuro~~ están hechos (ADR-0002). Siguen pendientes el cambio de correo y de contraseña y los términos y la privacidad (hoy muestran "próximamente").

## Acciones

1. [x] Separar estado por dominio (tema, sesión, navegación, mercado, chats, perfil, borradores).
2. [x] Extraer componentes duplicados a `components/ui` y a las carpetas de cada feature.
3. [x] Unificar acceso y registro en `AuthCarouselLayout` + `authVariants`.
4. [x] Eliminar código sin uso (plantilla de Expo, `AppContext`, alias y archivos puente).
5. [x] Sincronizar `package-lock.json`, declarar tipos de CSS y dejar `tsc` y `expo lint` sin errores.
6. [x] Verificar con comparación visual de la versión anterior contra la nueva y con pruebas de comportamiento.
7. [x] Migrar a rutas de Expo Router (opción C). Hecho y descrito en el ADR-0002.
8. [x] Decidir el destino de los pendientes de producto: los dos primeros se hicieron (ADR-0002); el resto queda en "Para revisar más adelante" de ese ADR.
