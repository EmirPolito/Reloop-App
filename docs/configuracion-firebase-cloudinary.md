# Cómo conectar ReLoop con Firebase y Cloudinary

Esta guía lleva la app de "no tengo nada configurado" a "funciona con datos reales". Se hace una sola vez. Al terminar, el registro de cuentas, las publicaciones, los favoritos, las calificaciones, los comentarios, los reportes, los chats y los perfiles se guardan en Firebase, y todas las fotos se guardan en Cloudinary.

## Qué hace cada servicio

| Servicio | Para qué lo usa ReLoop |
|----------|------------------------|
| Firebase Authentication | Registro, inicio de sesión, verificación del correo y recuperación de contraseña con correo y contraseña. |
| Cloud Firestore | Todos los datos: perfiles, publicaciones, favoritos, calificaciones, comentarios, reportes y chats. Se sincroniza en tiempo real entre las personas. |
| Cloudinary | Las fotos de publicaciones, chats y perfiles. En Firestore solo se guarda la dirección (URL) de cada foto. |

La app necesita estos datos de configuración, que se escriben en un archivo `.env`:

| Variable | De dónde sale |
|----------|---------------|
| `EXPO_PUBLIC_FIREBASE_API_KEY`, `..._AUTH_DOMAIN`, `..._PROJECT_ID`, `..._STORAGE_BUCKET`, `..._MESSAGING_SENDER_ID`, `..._APP_ID` | Consola de Firebase, objeto `firebaseConfig` de tu app web (paso 1.4). |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | Panel de Cloudinary, campo "Cloud name" (paso 2.1). |
| `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Nombre del "upload preset" sin firma que creas en Cloudinary (paso 2.2). |

Todo lo que empieza con `EXPO_PUBLIC_` queda dentro de la app compilada y cualquiera puede leerlo. Por eso aquí nunca van claves secretas. Las claves de Firebase para apps web no son secretas: lo que protege los datos son las reglas de seguridad (paso 1.5).

## Antes de empezar

- Una cuenta de Google (para Firebase) y una cuenta de Cloudinary. Ambos tienen plan gratuito suficiente para empezar.
- Node.js y las dependencias del proyecto instaladas con `npm install`.

## Parte 1. Firebase

### 1.1 Crear el proyecto

1. Entra a la [consola de Firebase](https://console.firebase.google.com) y pulsa "Agregar proyecto".
2. Ponle un nombre (por ejemplo `reloop`). Google Analytics no es necesario.

### 1.2 Activar el registro con correo y contraseña

1. En el menú, abre **Compilación > Authentication** y pulsa "Comenzar".
2. En la pestaña **Sign-in method** elige **Correo electrónico/contraseña** y actívalo (deja desactivado el "vínculo de correo").
3. Si más adelante publicas la versión web en un dominio propio, agrégalo en **Authentication > Configuración > Dominios autorizados**. `localhost` ya viene incluido.

Con esto ya funcionan el registro, el inicio de sesión y la recuperación de contraseña. Si ves el error `auth/operation-not-allowed` al registrarte, este paso no se hizo.

**Verificación del correo.** Al crear la cuenta, la app pide a Firebase que envíe un correo con un enlace. Mientras la persona no abra ese enlace, la app solo le muestra la pantalla "Verifica tu correo" (con los botones "Ya verifiqué mi correo", "Reenviar correo" y "Cerrar sesión") y las reglas de Firestore le niegan todo. Cuando abre el enlace, la app lo detecta sola (revisa cada 5 segundos y al volver a primer plano) y entra. No hay que activar nada más en Firebase: el envío viene incluido. El correo sale de una dirección de Firebase (`noreply@TU_PROJECT_ID.firebaseapp.com`) y a veces cae en spam. Las cuentas que se crearon antes de este cambio y no están verificadas verán esa pantalla la próxima vez que abran la app.

### 1.3 Crear la base de datos

1. Abre **Compilación > Firestore Database** y pulsa "Crear base de datos".
2. Elige la ubicación más cercana a tus usuarios. No se puede cambiar después.
3. Si te pide elegir edición, usa la **Standard**.
4. Elige **modo de producción**. Las reglas del paso 1.5 reemplazan las que trae por defecto.

### 1.4 Registrar la app web y copiar su configuración

1. En **Configuración del proyecto** (el engranaje) baja a "Tus apps" y pulsa el icono web `</>`.
2. Ponle un nombre (por ejemplo `reloop-app`). No actives Firebase Hosting.
3. Copia los valores de `firebaseConfig`. Los usarás en el paso 3.

ReLoop usa el SDK de JavaScript de Firebase, así que no necesitas archivos `google-services.json` ni `GoogleService-Info.plist`.

### 1.5 Publicar las reglas de seguridad

Las reglas están en [firestore.rules](../firestore.rules). Son lo que impide que una persona lea los chats de otra, edite publicaciones ajenas o falsee calificaciones. Mientras no las publiques, la base de datos de producción rechaza todo.

Con la terminal (desde la carpeta del proyecto):

```bash
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules --project TU_PROJECT_ID
```

`TU_PROJECT_ID` es el valor de `EXPO_PUBLIC_FIREBASE_PROJECT_ID`. Si prefieres no usar la terminal: abre **Firestore Database > Reglas**, pega el contenido de `firestore.rules` y pulsa "Publicar".

Vuelve a publicar las reglas cada vez que cambie `firestore.rules`. La última versión exige que la cuenta tenga el correo verificado (`request.auth.token.email_verified == true`). Si sigues con las reglas anteriores, la app funciona pero cualquier persona con una cuenta sin verificar podría leer y escribir datos llamando a Firestore directamente, sin pasar por la pantalla de verificación.

### 1.6 Correos de verificación y de recuperación (opcional)

En **Authentication > Plantillas** puedes cambiar el texto y el remitente del correo de verificación y del de recuperación de contraseña. La app los pide en español. Si los correos no llegan, revisa primero la carpeta de spam y que el correo esté bien escrito; Firebase limita cuántos correos envía por día y por dirección.

## Parte 2. Cloudinary

### 2.1 Cuenta y Cloud name

1. Crea una cuenta en [cloudinary.com](https://cloudinary.com).
2. En el panel principal copia tu **Cloud name**. Es el valor de `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME`.

### 2.2 Crear un upload preset sin firma

La app sube las fotos directamente desde el teléfono, sin servidor propio. Para eso Cloudinary necesita un "upload preset" de tipo sin firma.

1. Abre **Settings > Upload > Upload presets** y pulsa "Add upload preset".
2. Elige el modo de firma **Unsigned**.
3. Pon un nombre, por ejemplo `reloop_unsigned`. Es el valor de `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
4. Aplica estas restricciones, que son tu protección principal:
   - **Asset folder** (carpeta de destino; en cuentas con el modo clásico de carpetas se llama **Folder**): `reloop`.
   - **Allowed formats**: `jpg,png,webp,heic`.
   - **Disallow public ID** (`disallow_public_id`): activado. Quien sube no puede elegir el nombre del archivo ni sobrescribir otros.
   - **Incoming transformation** (transformación de entrada): `c_limit,w_1600`. Reduce cada foto a un máximo de 1600 px al subirla, así no se guardan originales enormes.
5. Guarda el preset.

La app pide a Cloudinary las fotos ya redimensionadas y comprimidas (`f_auto,q_auto,c_limit,w_...` en la URL), así que las tarjetas cargan rápido. Si en **Settings > Security** activaste las transformaciones estrictas ("strict transformations"), esas direcciones se bloquean: desactívalas o permite esa transformación.

### 2.3 Qué tan seguro es esto

Un preset sin firma se puede usar desde cualquier cliente que conozca su nombre, y el nombre va dentro de la app. Cloudinary lo dice así en su documentación: hay que tratar el nombre del preset como sensible. Por eso las restricciones del paso 2.2 son importantes. Además:

- El plan de Cloudinary define el tamaño máximo por archivo. Los presets no tienen un límite de tamaño propio. Antes de subir, la app reduce cada foto a un máximo de 1600 px por lado y la comprime a JPEG con calidad 75 % (con `expo-image-manipulator`), así una foto de cámara de varios megabytes pesa unos cientos de kilobytes y sube bien con datos móviles. Si no se puede reducir, sube la original.
- La subida se intenta hasta 3 veces si falla por red, por tiempo agotado (60 segundos) o por un error 5xx de Cloudinary. Los errores de configuración (preset mal escrito, formato no permitido) no se reintentan y se muestran con el motivo entre paréntesis.
- Si sospechas abuso, crea otro preset con otro nombre, actualiza el `.env`, publica una versión nueva de la app y borra el preset anterior y los archivos no deseados desde Cloudinary.
- Para una versión pública con muchos usuarios, conviene pasar a subidas firmadas: una función en servidor (por ejemplo una Cloud Function) firma cada subida. Está anotado como mejora futura en el ADR-0002.
- Cuando alguien cambia su foto de perfil, la foto anterior queda en Cloudinary: una subida sin firma no puede borrar archivos. Se limpia desde el panel de Cloudinary.

## Parte 3. Variables de entorno

1. Copia `.env.example` a `.env` (en la raíz, junto a `package.json`):

   ```bash
   cp .env.example .env
   ```

   En Windows con PowerShell: `Copy-Item .env.example .env`.
2. Completa los valores de los pasos 1.4, 2.1 y 2.2. No dejes comillas ni espacios.
3. Arranca la app con la caché limpia. Expo sustituye las variables al empaquetar y puede reutilizar valores viejos si no limpias la caché, así que usa `-c` siempre que cambies `.env`:

   ```bash
   npx expo start -c
   ```

Si falta algún dato de Firebase, la app se detiene al abrir con un mensaje que lista las variables que faltan. Si falta Cloudinary, la app funciona, pero al subir una foto avisa "Falta configurar Cloudinary". Publicar sin foto sigue funcionando.

### Compilaciones con EAS (APK)

El proyecto ya está vinculado a EAS (`@jamingarciadev/ReLoop`) y [eas.json](../eas.json) define dos perfiles:

| Perfil | Resultado | Para qué |
|--------|-----------|----------|
| `preview` | Archivo **APK** que se instala directo en un teléfono Android | Probar la app y repartirla a otras personas |
| `production` | Paquete **AAB** (con el número de versión subiendo solo) | Subir a Google Play |

El paquete de Android es `com.jamingarciadev.reloop`, en `app.json`. Es la identidad de la app en el teléfono: si algún día la publicas en Google Play, ese nombre ya no se puede cambiar, así que decídelo antes.

Para generar el APK, desde la carpeta del proyecto:

```bash
npm run build:apk
```

Es lo mismo que `npx eas-cli@latest build --platform android --profile preview`. EAS exige que la carpeta sea un repositorio git, y por eso se hizo `git init` (no hace falta ningún commit). EAS sube los archivos que git no ignora, así que `.env` y `node_modules` no viajan. En la **primera** compilación, EAS pregunta si genera una clave de firma (keystore) para Android: contesta que sí. EAS la guarda en sus servidores y reutiliza la misma en las siguientes. Haz esa primera compilación en tu terminal y no en modo no interactivo. Al terminar, EAS muestra un enlace y un código QR para descargar el APK.

Las variables de entorno (Firebase y Cloudinary) están guardadas en EAS, en los entornos `preview` y `production`: el `.env` local no viaja a la compilación. Si cambias algún valor, súbelo de nuevo, por ejemplo:

```bash
npx eas-cli@latest env:set --name EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET --value NUEVO_VALOR --environment preview --environment production --visibility sensitive
```

La visibilidad `plaintext` sirve para valores públicos (la configuración de Firebase) y `sensitive` oculta el valor en los registros de compilación (el nombre del preset de Cloudinary). `secret` no sirve aquí: lo que va dentro de la app no puede ser secreto. No subas a EAS la variable `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST`: haría que el APK busque emuladores que no existen en el teléfono.

`expo-image-manipulator` (la reducción de fotos antes de subirlas) es un módulo nativo: un APK compilado antes de agregarlo no lo trae, y por eso hay que generar un APK nuevo con `npm run build:apk` para que funcione. Con una compilación vieja la subida sigue funcionando, pero manda la foto sin reducir.

El ícono, el ícono adaptable de Android (con su versión monocromática para los íconos temáticos), la pantalla de inicio y el favicon salen de la imagen del logo de ReLoop con las figuras 3D, en `assets/images/`. Para cambiarlos, reemplaza esos archivos (`icon.png` y `splash-icon.png` de 1024×1024, el primer plano `android-icon-foreground.png` con el contenido importante dentro del 66 % central) y genera otro APK: los íconos no se actualizan por internet.

## Parte 4. Probar sin tocar un proyecto real (emuladores)

Los emuladores de Firebase simulan Authentication y Firestore en tu computadora, con las mismas reglas de `firestore.rules`. Sirven para desarrollar sin gastar cuota ni ensuciar datos reales. Cloudinary no tiene emulador: para probar fotos usa tu cuenta real.

1. Instala Java 21 o superior (los emuladores lo necesitan).
2. En una terminal, desde la carpeta del proyecto: `npm run emulators`. Déjala abierta.
3. En `.env` activa la variable de los emuladores. Mientras esté puesta, la app ignora las claves de Firebase reales y usa solo los emuladores, así que no hay riesgo de mezclar datos:

   | Dónde corre la app | Valor de `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` |
   |--------------------|-----------------------------------------------|
   | Web o simulador de iOS | `127.0.0.1` |
   | Emulador de Android | `10.0.2.2` |
   | Teléfono físico | La IP de tu computadora en la red (y en `firebase.json` agrega `"host": "0.0.0.0"` dentro de `auth` y `firestore`) |

4. Reinicia Expo con `npx expo start -c`.

Los datos del emulador se borran al apagarlo. Quita la variable del `.env` para volver al proyecto real.

El emulador no envía correos. Para simular que alguien abre el enlace de verificación, abre `http://127.0.0.1:9099/emulator/v1/projects/demo-reloop/oobCodes` en el navegador: ahí aparece cada código con su enlace (`oobLink`). Abre ese enlace y la app entra sola en unos segundos.

## Parte 5. Cómo comprobar que todo funciona

Hazlo con dos cuentas, por ejemplo en dos dispositivos o un dispositivo y el navegador.

1. Registra la cuenta A con "Crear cuenta". La app muestra "Verifica tu correo" y llega un correo de Firebase. Abre el enlace del correo: la app entra sola. En Firebase, **Authentication > Users** debe mostrarla y **Firestore > usuarios** debe tener su ficha (sin correo) y **Firestore > cuentas** un documento con el mismo id y su correo. Ambos se crean al entrar por primera vez ya verificada. Las cuentas que ya existían reciben su documento en `cuentas` la próxima vez que abren la app con la versión nueva.
2. Con A, publica algo con foto. En **Firestore > productos** aparece el documento con `imageUrl` apuntando a `res.cloudinary.com`, y la foto está en la carpeta `reloop` de Cloudinary.
3. Registra la cuenta B. Debe ver la publicación de A sin recargar.
4. B califica, comenta y marca favorito. A ve el promedio y el comentario al instante. A no puede calificar su propia publicación.
5. B pulsa "Comprar": se abre un chat con el mensaje de interés. B envía un texto y una foto. En A aparece el punto de mensajes sin leer en "Chats". Al abrir el chat, A lo marca como leído y responde; B ve la respuesta al instante.
6. A edita su perfil (nombre, foto, color, descripción, stickers). Cierra la app y vuelve a abrirla: todo sigue ahí. B ve el nombre nuevo en las publicaciones y en el chat.
7. A cierra sesión y vuelve a entrar: sus datos siguen. Una cuenta C nueva no ve los favoritos ni los chats de A y B.

## Cómo se guardan los datos

| Colección | Contenido | Quién lee | Quién escribe |
|-----------|-----------|-----------|---------------|
| `usuarios/{uid}` | Perfil: nombre, foto, descripción, color, etiquetas, stickers. Sin correo. | Cualquier persona con sesión | Solo su dueña |
| `cuentas/{uid}` | El correo de la cuenta. Tiene el mismo id que su perfil en `usuarios`, así se ve en la consola de qué correo es cada perfil. | Solo su dueña | Solo su dueña, y solo con el correo de su propia sesión |
| `usuarios/{uid}/favoritos/{productId}` | Favoritos | Solo su dueña | Solo su dueña |
| `usuarios/{uid}/calificaciones/{productId}` | La nota que esa persona dio | Solo su dueña | Solo su dueña |
| `productos/{id}` | Publicación y su promedio (`ratingTotal`, `ratingCount`) | Cualquier persona con sesión | Crea su dueña. Solo su dueña cambia el nombre de vendedor. Las demás personas solo cambian el promedio al calificar. |
| `productos/{id}/comentarios/{id}` | Comentarios | Cualquier persona con sesión | Cualquier persona, como autora. No se editan ni se borran. |
| `reportes/{uid}_{productId}` | Reportes de publicaciones | Solo quien reportó | Quien reporta |
| `chats/{uidA}_{uidB}` | Una conversación por pareja, con nombres, último mensaje y marcas de lectura | Las dos personas | Las dos personas |
| `chats/{id}/mensajes/{id}` | Mensajes con texto y direcciones de fotos | Las dos personas | Quien envía. No se editan ni se borran. |

Notas:

- No hay índices compuestos que crear: todas las consultas son de un solo campo y el orden se hace en la app.
- El promedio de calificaciones se actualiza en una transacción junto con la nota de cada persona, y las reglas comprueban que ambos cambios cuadren. Nadie puede inflar un promedio.
- Los reportes solo se guardan. Se revisan desde la consola de Firebase, en la colección `reportes`.

## Límites conocidos

- El inicio carga las 200 publicaciones más recientes. Los favoritos, los chats y los perfiles de publicaciones más antiguas se piden por separado y siguen funcionando.
- Al cambiar de nombre, la app actualiza las publicaciones y los chats propios desde el teléfono. Si falla a medias (por ejemplo, sin internet), el perfil no se guarda y basta con volver a guardar.
- No hay borrar ni editar publicaciones, comentarios ni mensajes, ni notificaciones push. Cambiar correo, cambiar contraseña, los términos, la privacidad y el acceso con Google o Apple muestran "próximamente".
- La app está pensada para teléfonos. En la versión web funciona, con esta salvedad: los avisos usan los cuadros de diálogo del navegador.

## Problemas frecuentes

| Síntoma | Causa y solución |
|---------|------------------|
| Al abrir: "Falta la configuración de Firebase (...)" | Falta el `.env` o alguna variable. Revisa el paso 3 y recarga. |
| `auth/operation-not-allowed` al registrarse | No se activó "Correo electrónico/contraseña" (paso 1.2). |
| `auth/invalid-api-key` o `auth/configuration-not-found` | Valor incorrecto de `EXPO_PUBLIC_FIREBASE_API_KEY` o proyecto sin Authentication activado. |
| Cualquier operación falla con `permission-denied` | Las reglas no están publicadas, o están desactualizadas (paso 1.5). También ocurre si la cuenta no ha verificado su correo. |
| No llega el correo de verificación | Revisa spam y que el correo esté bien escrito, y usa "Reenviar correo" (espera 30 segundos entre envíos). Si sigue sin llegar, mira **Authentication > Plantillas** y los límites de envío de Firebase. |
| "Todavía no aparece como verificado" tras abrir el enlace | El enlace caduca y solo sirve una vez. Pide uno nuevo con "Reenviar correo" y ábrelo con la sesión correcta. |
| "No se pudo subir la imagen. Revisa tu conexión. (Unsupported FormDataPart implementation)" | En Android e iOS el `fetch` de Expo no acepta el objeto `{ uri, name, type }` en el formulario. La app ya envía la foto como `File` de `expo-file-system`; si lo ves, ese APK es anterior a la corrección y hay que generar otro. |
| "No se pudo subir la imagen. Revisa tu conexión. (...)" | El texto entre paréntesis es el motivo real. Si lo da Cloudinary, es su mensaje (por ejemplo `Upload preset not found`: el nombre del preset está mal; un formato no permitido: revisa **Allowed formats**). Si Cloudinary no da mensaje, dice "Cloudinary respondió con el código N". Si es un fallo de red, es el texto del sistema (por ejemplo `Network request failed`) y la app ya lo intentó 3 veces. |
| "Falta configurar Cloudinary" al subir una foto | Faltan `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` o `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET`. |
| Cloudinary responde "Upload preset not found" o "must be whitelisted for unsigned uploads" | El nombre del preset está mal escrito o el preset no es de tipo **Unsigned** (paso 2.2). |
| Las fotos suben pero no se ven | Revisa que no estén activadas las transformaciones estrictas de Cloudinary (paso 2.2). |
| Con emuladores en Android no conecta | Usa `10.0.2.2` como host. En teléfono físico, la IP de tu computadora y `"host": "0.0.0.0"` en `firebase.json`. |
| `npm run emulators` falla al iniciar | Falta Java 21 o superior, o los puertos 8080 o 9099 están ocupados. |

## Pruebas automáticas

```bash
npm run test:domain   # lógica pura: filtros, reglas de categorías, borrador, mapeo de documentos
npm run test:rules    # reglas de Firestore contra los emuladores (necesita Java)
npm test              # las dos
```

`test:rules` comprueba, con el SDK real, que las escrituras que hace la app están permitidas y que los intentos de abuso (leer chats ajenos, falsear calificaciones, editar publicaciones de otra persona, guardar el correo en el perfil, usar Firestore con una cuenta sin correo verificado, entre otros) se rechazan. Vuelve a correrlo cada vez que cambies `firestore.rules`.
