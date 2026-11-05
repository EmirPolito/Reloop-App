# ADR-0002: Rutas de archivos con Expo Router y datos compartidos en Firestore con fotos en Cloudinary

**Estado:** Aceptada. Reemplaza la decisión 7 del [ADR-0001](0001-arquitectura-de-estado-y-navegacion.md) (pila de navegación propia) y su restricción de datos solo en memoria.
**Fecha:** 2026-10-28
**Decisores:** Equipo de desarrollo de ReLoop

## Contexto

Después del ADR-0001 quedaban cuatro problemas de fondo:

- La navegación era una pila propia dentro de una única ruta de Expo Router. `AGENTS.md` pide rutas de archivos, y la pila propia no daba enlaces profundos, rutas tipadas ni el comportamiento de "atrás" del sistema. El ADR-0001 dejó la migración pendiente de aprobación porque cambiaba las transiciones. La aprobación llegó.
- Los datos vivían solo en memoria. Las publicaciones, los chats y el perfil se perdían al cerrar la app, y no se compartían entre personas: cada cuenta veía únicamente lo que ella misma creaba y unas publicaciones de ejemplo. Una app de intercambio entre personas no puede funcionar así.
- Las fotos eran direcciones locales del teléfono. Nadie más podía verlas.
- Había defectos visibles: la tarjeta del producto en el chat quedaba bajo el encabezado, no existía el enlace a "Recuperar contraseña", no había forma de activar el modo oscuro, el botón de Google tenía dos rojos distintos y el inicio de sesión tenía textos en inglés. También había dependencias y archivos sin uso, y `Drawereditarperfil.tsx` seguía con 1.307 líneas.

El equipo decidió conectar Firebase para el registro y los datos, y usar Cloudinary para las imágenes. Se mantuvo la restricción de no cambiar el aspecto de la interfaz salvo para corregir lo que estaba mal.

Con Firebase real conectado y probado en un teléfono aparecieron tres problemas más:

- Cualquier correo, incluso uno ajeno o mal escrito, entraba directo: no se verificaba que la persona fuera dueña de la dirección.
- Las fotos hechas con la cámara, de varios megabytes, fallaban con "No se pudo subir la imagen" en redes móviles lentas, sin decir por qué.
- Las pantallas se veían dispares: tres fondos distintos (degradado, gris plano y un corte blanco), tipografías que cambiaban de peso entre plataformas, títulos con tamaños distintos y pantallas de acceso con estilos propios. El equipo pidió repararlo por completo, así que la restricción de conservar el aspecto se levantó para esto.

## Decisión

### 1. Navegación con rutas de archivos

```
src/app/
├─ _layout.tsx             fuentes, tema, sesión; Stack.Protected según haya sesión
├─ (auth)/                 login, register, recovery (sin sesión) y verify (con sesión sin verificar)
└─ (app)/                  solo con sesión verificada; monta los proveedores de sesión con key = uid
   ├─ (tabs)/              index, favorites, create, chats, profile (barra animada propia)
   ├─ product/[id]
   ├─ chat/[id]
   └─ user/[id]            el id es un uid, no un nombre
```

- `Stack.Protected` decide qué grupo existe según el estado de la sesión (`loading`, `unauthenticated`, `unverified` o `authenticated`): sin sesión verificada no se puede llegar a `(app)`, ni por enlace.
- Las pestañas usan `Tabs` de `expo-router/js-tabs` con un `tabBar` que dibuja la barra animada existente. Las transiciones se mantienen: sin animación entre pestañas y un fundido en la pila.
- `useAppNavigation` expone acciones de negocio (`navigate`, `openProduct`, `openThread`, `openUserProfile`, `back`). Las pantallas no conocen las rutas.
- Un componente `TabScene` oculta las pestañas inactivas en la web, donde React Navigation las deja dibujadas.

### 2. Datos en Firestore, en tiempo real

```
SessionUserProvider        uid y nombre de la sesión
└─ ProfileProvider         perfil propio (suscripción a usuarios/{uid})
   └─ MarketplaceProvider  publicaciones recientes, favoritos, calificaciones y reportes propios, filtros
      └─ ChatProvider      chats de la persona
         └─ DraftsProvider textos a medio escribir
```

Todos leen con el uid de `SessionUserProvider`, así que su orden ya no importa. El árbol completo se monta bajo `key={uid}`: al cerrar sesión se desmonta y se cierran todas las suscripciones.

Capas, de abajo hacia arriba:

1. **Repositorios** (`productRepository`, `chatRepository`, `profileRepository`): el único código que habla con Firestore. Cada operación está en una función con nombre de negocio (`rateProduct`, `openChat`, `sendMessage`, `saveProfileData`).
2. **Mapeadores** (`productMappers`, `chatMappers`, `profileMappers`): convierten documentos en los tipos de la app. No importan Firebase ni React Native, así que se prueban en Node.
3. **Hooks de datos** (`useMarketplaceData`, `useProductComments`, `useThreadMessages`, `useProductsByIds`, `useUserProducts`, `usePublicProfile`): suscriben, entregan estado de carga y se dan de baja al desmontarse. Las respuestas se guardan junto con el id al que pertenecen, de modo que si cambia el id nunca se muestra el dato anterior.
4. **Casos de uso** (`usePublishProduct`, `useOpenChat`, `useReportProduct`, `saveOwnProfile`): orquestan entre dominios y suben las fotos antes de guardar.
5. **Pantallas**: leen hooks y muestran carga, error y vacío.

Modelo de datos (detalle y permisos en la [guía](../configuracion-firebase-cloudinary.md)):

- `usuarios/{uid}` con subcolecciones `favoritos` y `calificaciones`.
- `productos/{id}` con subcolección `comentarios`. El promedio vive en el producto como `ratingTotal` y `ratingCount`.
- `reportes/{uid}_{productId}`.
- `chats/{uidA}_{uidB}` (uid ordenados) con subcolección `mensajes`. Hay un chat por pareja de personas; el producto es solo el contexto de la conversación (`productId`, `introducedProducts`).

Reglas que se siguen:

1. **Las reglas de seguridad son el contrato.** `firestore.rules` valida forma, dueño y límites de cada escritura. La calificación compara con `getAfter` que el promedio cambie exactamente por la nota de quien califica. Las reglas se prueban con el SDK real contra los emuladores (130 casos). Toda regla exige sesión con correo verificado (`request.auth.token.email_verified == true`), no solo sesión.
2. **Sin índices compuestos.** Todas las consultas son de un solo campo y el orden se hace en la app.
3. **El perfil no guarda el correo.** Las fichas las lee cualquier persona con sesión; cualquiera puede crear una cuenta verificada, así que un correo en la ficha se podría recoger de todas las personas. Las fichas antiguas que lo tenían se corrigen al iniciar sesión. Para poder ver de qué correo es cada perfil en la consola de Firebase, el correo se copia a `cuentas/{uid}` (mismo id que el perfil): solo su dueña lo lee y las reglas exigen que coincida con el correo de su sesión. `ensureAccountEmail` lo escribe al entrar y solo si falta o cambió.
4. **Lecturas acotadas.** El inicio escucha las 200 publicaciones más recientes. Lo más antiguo que se necesite (un favorito viejo, un chat de hace meses) se pide por id.
5. **Escrituras que no deben perderse ni duplicarse** usan transacciones o lotes: abrir un chat con su primer mensaje, calificar, enviar un mensaje y actualizar el resumen del chat.
6. **Firestore usa long-polling forzado** (`experimentalForceLongPolling`). Con la detección automática, la primera conexión esperaba unos 10 s antes de cambiar de transporte: con Firebase real el registro tardaba 15 s en un navegador. Forzado tarda unos 4 s. Es una medición en una sola máquina y red; el costo es algo más de latencia por actualización, que para esta app no se nota.

### 3. Fotos en Cloudinary

- La app sube cada foto con una subida sin firma (`file` y `upload_preset`) y guarda en Firestore solo la URL `https`.
- Se sube al pulsar Publicar, Enviar o Guardar, no al elegir la foto, para no dejar archivos huérfanos si se cancela.
- La app pide las fotos ya redimensionadas con la URL (`f_auto,q_auto,c_limit,w_N`, con el ancho redondeado a múltiplos de 100 para limitar las variantes).
- La protección del preset está en su configuración: formatos permitidos, carpeta, sin elegir nombre de archivo y reducción de tamaño al subir.
- Antes de subir, `shrinkImage` (con `expo-image-manipulator`) reduce la foto a 1600 px por lado como máximo y la guarda como JPEG al 75 %. Si no puede, sube la original. En la web no se reduce.
- En Android e iOS el archivo se envía como `File` de `expo-file-system`, no como `{ uri, name, type }`: desde que Expo instala su propio `fetch` global, ese objeto de React Native se rechaza con "Unsupported FormDataPart implementation". En la web se envía un `Blob`.
- La subida se reintenta hasta 3 veces con espera creciente si falla por red, por tiempo agotado (60 s) o por un error 5xx. Un rechazo de Cloudinary (preset, formato) no se reintenta. El aviso al usuario incluye el motivo entre paréntesis para poder diagnosticarlo sin abrir una consola.

### 4. Correcciones de producto incluidas

Tarjeta del producto del chat visible (queda justo bajo el encabezado y se puede tocar), enlace a "Recuperar contraseña" en el inicio de sesión, interruptor de modo oscuro en el perfil con variantes oscuras en las pantallas, un solo rojo de Google y textos en español, `Drawereditarperfil.tsx` dividido en 11 archivos (el mayor tiene 353 líneas), y eliminación de dependencias, scripts y recursos sin uso.

### 5. Verificación del correo

- Al registrarse, `registrarUsuario` crea la cuenta, guarda el nombre y llama a `sendEmailVerification`. Si el envío falla, el registro no se cancela: la persona puede pedir otro desde la pantalla de verificación.
- `AuthProvider` expone `status` con cuatro valores. Una cuenta con `emailVerified == false` queda `unverified` y solo ve la ruta `(auth)/verify`. Esa pantalla comprueba cada 5 s y al volver a primer plano (`user.reload()`, y si ya está verificado, `getIdToken(true)` para que el token lleve el dato nuevo), permite reenviar con 30 s de espera y cerrar sesión para corregir el correo.
- La ficha de perfil se crea al entrar ya verificada (`ProfileProvider` solo se monta con sesión verificada), no al registrarse.
- Las reglas repiten la comprobación. La pantalla sola no protege nada: quien llame a Firestore con una cuenta sin verificar sería rechazado por `signedIn()`.

### 6. Diseño unificado

- Un solo componente `Text` y un solo `TextInput` (`features/shared/Text.tsx`) eligen la familia Poppins según el peso. Así el texto pesa igual en Android, iOS y la web, sin doble negrita ni relleno de fuente distinto.
- Un solo degradado para toda la app, dibujado por `AppFrame`. Las pestañas, el chat y los perfiles quedan transparentes sobre él, sin franjas ni fondos planos propios. El perfil conserva el degradado de su color elegido en el encabezado.
- Títulos: 24 px en negrita para las pestañas, 16 px para las pantallas con botón de volver o de cerrar. El botón de cerrar de "Nueva publicación" tiene un espacio igual a la derecha para centrar el título.
- Las pantallas de acceso (inicio de sesión, registro, recuperar contraseña y verificar) usan `AuthCarouselLayout`, los mismos campos (`EmailField`, `PasswordField`) y `AuthButton`.
- La campana y la lupa salen de `AppIcon` en todas las pantallas. El encabezado del chat ocupa todo el ancho: volver a la izquierda, contacto al centro, menú a la derecha. El color activo del menú lateral es el azul de marca.
- Se quitaron 93 estilos sin uso de `shared/styles.ts` (de 728 a 523 líneas) y una imagen de fondo sin uso.

## Opciones consideradas

### Datos

#### Opción A: Cloud Firestore con suscripciones en tiempo real y reglas de seguridad (elegida)

| Dimensión | Evaluación |
|-----------|------------|
| Complejidad | Media: repositorios, reglas y pruebas |
| Costo | Plan gratuito suficiente para empezar; se paga por lecturas, escrituras y almacenamiento al crecer |
| Escalabilidad | Buena sin servidor propio |
| Familiaridad del equipo | Alta: Firebase ya se usa para la autenticación |

**Ventajas:** una sola plataforma con la autenticación, tiempo real incluido, caché y reintentos sin conexión, y sin servidor que mantener.
**Desventajas:** parte de la lógica de negocio vive en las reglas y en el cliente; las consultas son limitadas, lo que obliga a duplicar algunos datos; el costo crece con las lecturas.

#### Opción B: Servidor propio (API y base de datos relacional)

| Dimensión | Evaluación |
|-----------|------------|
| Complejidad | Alta: diseñar, alojar, asegurar y operar un servidor |
| Costo | Fijo desde el inicio |
| Escalabilidad | Buena, a cambio de trabajo propio |
| Familiaridad del equipo | Baja |

**Ventajas:** control total, consultas y agregaciones libres.
**Desventajas:** el tiempo real para los chats exige piezas extra, y todo el trabajo de operación recae en el equipo.

#### Opción C: Realtime Database de Firebase

No se evaluó a fondo. Su modelo de árbol y sus consultas más limitadas la hacen menos adecuada para publicaciones, perfiles y chats con reglas por documento.

#### Opción D: Mantener los datos en memoria

Descartada: no cumple el objetivo de una app funcional entre personas.

### Fotos

#### Opción A: Cloudinary con preset sin firma (elegida por el equipo)

| Dimensión | Evaluación |
|-----------|------------|
| Complejidad | Baja: una petición desde la app |
| Costo | Plan gratuito para empezar |
| Escalabilidad | Buena: CDN y transformaciones por URL |
| Familiaridad del equipo | Media |

**Ventajas:** sin servidor, fotos optimizadas por URL, entrega por CDN.
**Desventajas:** el nombre del preset va dentro de la app y cualquiera puede usarlo para subir archivos dentro de los límites del preset. Una subida sin firma tampoco puede borrar archivos, así que las fotos reemplazadas se quedan en Cloudinary.

#### Opción B: Cloudinary con subidas firmadas

Cada subida la firma una función en servidor (por ejemplo, Cloud Functions, que exige el plan de pago de Firebase). Es más segura y permite borrar archivos, pero requiere construir y mantener ese servidor. Queda como mejora cuando haya usuarios reales.

#### Opción C: Firebase Storage

Misma plataforma que el resto de los datos. No se evaluó a fondo porque el equipo eligió Cloudinary.

## Análisis de compromisos

- **Preset sin firma frente a subidas firmadas.** La primera se puede usar hoy sin servidor, a cambio de una exposición controlada por las restricciones del preset. La segunda elimina esa exposición, pero obliga a tener backend. Para empezar se acepta la primera con las restricciones documentadas, y se revisa antes de abrir la app al público.
- **Datos duplicados frente a consultar de más.** El nombre del vendedor se guarda en cada publicación y los nombres de ambas personas en cada chat. Así una tarjeta o la lista de chats se dibuja con una sola lectura. El precio es propagar los cambios de nombre. Hoy lo hace el teléfono al guardar el perfil (primero actualiza publicaciones y chats, después guarda la ficha, y es repetible sin efectos duplicados). Si se corta a medias, el perfil no queda guardado y se reintenta. Una función en servidor lo haría sin depender del teléfono.
- **Promedio dentro del producto frente a calcularlo al leer.** Guardar `ratingTotal` y `ratingCount` hace barata la lectura y deja la actualización en una transacción que las reglas verifican. Calcularlo al leer exigiría leer todas las notas.
- **Exigir correo verificado frente a dejar entrar al registrarse.** Verificar evita cuentas con correos ajenos o mal escritos y deja una dirección válida para recuperar la contraseña. El costo es un paso más al registrarse y depender de que el correo de Firebase llegue (puede caer en spam, y Firebase limita los envíos). Se mitiga con reenvío, detección automática y el aviso de revisar spam. Exigirlo también en las reglas cuesta una condición más por regla y obliga a renovar el token al verificar.
- **Reducir la foto en el teléfono frente a confiar solo en el preset.** El preset reduce al recibir, pero la foto original tiene que viajar entera por la red móvil, y ahí fallaba. Reducir antes baja una foto de cámara de varios megabytes a unos cientos de kilobytes (estimación por tamaño, no una medición en un teléfono). El costo es un módulo nativo más (`expo-image-manipulator`), que exige compilar un APK nuevo.
- **Un chat por pareja frente a un chat por producto.** Coincide con el comportamiento previo de la interfaz (un chat por vendedor) y evita conversaciones duplicadas. El producto es contexto, y cada producto nuevo agrega un mensaje de interés una sola vez.

## Consecuencias

**Lo que mejora**
- Las publicaciones, los favoritos, las calificaciones, los comentarios, los reportes, los chats y los perfiles persisten y se comparten en tiempo real. El indicador de mensajes sin leer en la barra refleja datos reales.
- La navegación cumple `AGENTS.md`: rutas de archivos, enlaces profundos, rutas tipadas y botón atrás correcto.
- Las fotos son visibles para todas las personas y se descargan optimizadas.
- Solo entran a la app las cuentas con correo verificado, y las reglas lo hacen cumplir aunque se salten la pantalla.
- Las fotos pesan mucho menos al subir, se reintentan ante fallos de red y, si fallan, el aviso dice el motivo.
- Todas las pantallas comparten fondo, tipografía, títulos, iconos y botones, y están diseñadas para verse igual en Android, iOS y la web (verificado solo en la web).
- Hay pruebas: 41 de lógica pura y 130 de reglas de seguridad (`npm test`). Typecheck, lint, `expo-doctor` y las exportaciones web y Android pasan sin errores. El recorrido completo con dos personas sobre los emuladores (72 comprobaciones, incluida la verificación del correo) también pasa.
- El mayor archivo de pantalla ya no es el editor de perfil: pasó de 1.307 a 353 líneas. El código fuente tiene 162 archivos y 11.807 líneas.

**Lo que se complica**
- La app necesita un proyecto de Firebase y un preset de Cloudinary configurados para funcionar. La [guía](../configuracion-firebase-cloudinary.md) lo explica paso a paso, y los emuladores permiten desarrollar sin proyecto real.
- Cualquier cambio de datos toca tres sitios que deben mantenerse de acuerdo: el repositorio, las reglas y las pruebas de reglas.
- Hay un costo variable por lecturas y escrituras. Los listeners abiertos leen lo que cambia, y el inicio carga hasta 200 documentos al abrirse.
- Quien no verifica su correo no puede usar la app. Las cuentas anteriores sin verificar ven la pantalla de verificación al abrir. Las reglas nuevas hay que volver a publicarlas en la consola de Firebase: mientras sigan las anteriores, la comprobación solo existe en la pantalla.
- La app necesita un APK nuevo, porque `expo-image-manipulator` es un módulo nativo.

**Para revisar más adelante**
- Paginación del inicio y de los chats largos (hoy: 200 publicaciones y 300 mensajes por chat).
- Subidas firmadas y una función en servidor que propague nombres, borre fotos reemplazadas y modere reportes (hoy los reportes solo se guardan; se revisan desde la consola).
- Firebase App Check para frenar clientes que no sean la app.
- Borrar y editar publicaciones; notificaciones push; cambio de correo y de contraseña; términos y privacidad; acceso con Google y Apple (hoy muestran "próximamente").
- Dividir `shared/styles.ts` (523 líneas) por pantalla.
- Probar en dispositivos reales: selector de galería, permisos, modales nativos, la subida de fotos con datos móviles y el aspecto de las pantallas. Todo se verificó con la web y los emuladores, no con un teléfono.

## Acciones

1. [x] Migrar a rutas de archivos de Expo Router conservando la barra animada y las transiciones.
2. [x] Corregir la tarjeta del producto en el chat, añadir "Recuperar contraseña" al inicio de sesión, el modo oscuro, el rojo de Google y los textos en español.
3. [x] Eliminar dependencias, scripts y recursos sin uso (`lucide-react-native`, `expo-glass-effect`, `@expo/ui`, `expo-device`, `expo-web-browser`, `reset-project`) y dividir el editor de perfil.
4. [x] Pasar los datos a Firestore con repositorios, mapeadores y hooks, y escribir `firestore.rules`.
5. [x] Subir las fotos a Cloudinary (publicaciones, chats y perfil).
6. [x] Probar las reglas (130 casos), la lógica pura (41) y los recorridos completos con dos personas sobre los emuladores.
7. [x] Documentar la conexión en `docs/configuracion-firebase-cloudinary.md`.
8. [x] Crear el proyecto de Firebase y el preset de Cloudinary reales y completar `.env`.
9. [x] Verificación del correo (pantalla, reenvío, regla `email_verified`), reducción y reintentos de las fotos, y unificación del diseño.
10. [ ] Volver a publicar `firestore.rules` en la consola de Firebase (versión con `email_verified`).
11. [ ] Generar un APK nuevo (`npm run build:apk`) y probar en un teléfono: verificación del correo, subida de fotos con datos móviles, galería, permisos, modales, teclado y aspecto.
12. [ ] Decidir los puntos de "Para revisar más adelante".
