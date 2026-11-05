# ReLoop

ReLoop es una aplicación móvil de reutilización para la comunidad UTSV. Las personas publican cosas para vender, intercambiar, donar, dar en adopción o comida casera, y se escriben por chat. Está creada con Expo, React Native y Expo Router. Los datos viven en Firebase (Authentication y Firestore) y las fotos en Cloudinary.

## Puesta en marcha

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Conecta Firebase y Cloudinary. La guía [docs/configuracion-firebase-cloudinary.md](docs/configuracion-firebase-cloudinary.md) explica paso a paso cómo crear el proyecto, activar el registro con correo (con verificación del correo), publicar las reglas de seguridad (hay que volver a publicarlas cuando cambian), crear el preset de Cloudinary y llenar el archivo `.env` (se parte de `.env.example`).

3. Arranca el servidor de desarrollo:

   ```bash
   npx expo start
   ```

   Para la versión web: `npx expo start --web`.

Si todavía no tienes un proyecto de Firebase, puedes desarrollar contra los emuladores locales (Authentication y Firestore, con las mismas reglas): `npm run emulators` y la variable `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` del `.env`. Los detalles están en la guía.

## Scripts

| Comando | Qué hace |
|---------|----------|
| `npm start`, `npm run android`, `npm run ios`, `npm run web` | Servidor de desarrollo de Expo. |
| `npm run lint` | ESLint con las reglas de Expo y de React Compiler. |
| `npm run typecheck` | TypeScript de la app y de las pruebas. |
| `npm run build:apk` | Genera el APK para Android en EAS (perfil `preview`; ver la guía). |
| `npm run emulators` | Emuladores de Firebase (necesita Java 21 o superior). |
| `npm run test:domain` | Pruebas de la lógica pura: filtros, reglas de categorías, borrador, mapeo de documentos. |
| `npm run test:rules` | Pruebas de las reglas de Firestore contra los emuladores (necesita Java). |
| `npm test` | Las dos pruebas anteriores. |

Antes de entregar cambios corre `npm run typecheck`, `npm run lint` y `npm test`. Si cambias `firestore.rules`, publícalas de nuevo (la guía explica cómo).

## Qué hace la app

- **Cuenta.** Registro, inicio de sesión y recuperación de contraseña con Firebase Authentication. El acceso con Google y Apple aún no está disponible.
- **Inicio.** Búsqueda, categorías, y las publicaciones de la comunidad en tiempo real.
- **Publicaciones.** Se crean con foto, nombre, descripción, categoría y precio. Cada una admite comentarios, reportes, favoritos y una calificación de una a cinco estrellas (en ventas y comidas, y no de quien publica).
- **Chats.** Una conversación por pareja de personas, con mensajes y fotos en tiempo real, aviso de mensajes sin leer, búsqueda y acceso a la publicación de la que se habla. Las llamadas y videollamadas aún no están disponibles.
- **Perfil.** Foto, nombre, descripción, etiquetas, stickers y color, guardados en la nube. Cualquier persona puede ver el perfil público de otra. Incluye el modo oscuro.
- Cambiar correo, cambiar contraseña, términos y privacidad muestran "próximamente".
- La interfaz usa la tipografía Poppins.

## Estructura

```
src/
├─ app/                  rutas de Expo Router: (auth) sin sesión, (app) con sesión (pestañas, product, chat, user)
├─ components/           piezas reutilizables (barra de navegación, ui/)
├─ constants/            medidas y animaciones comunes
├─ features/
│  ├─ auth/              sesión de Firebase, acceso, registro y recuperación
│  ├─ chats/             lista de chats, conversación, repositorio y mapeadores
│  ├─ crear-publicacion/ formulario y reglas del borrador
│  ├─ favoritos/
│  ├─ home/              inicio (buscador, categorías y cuadrícula)
│  ├─ intro/             video de introducción
│  ├─ marketplace/       publicaciones: tipos, reglas, filtros, repositorio, mapeadores, hooks y detalle
│  ├─ navigation/        acciones de navegación, barra de pestañas y opciones de la pila
│  ├─ perfil/            perfil propio y público, repositorio y editor (drawer/)
│  ├─ session/           uid de la sesión y proveedores que dependen de ella
│  └─ shared/            tema, estilos, iconos y borradores de texto
├─ hooks/                hooks genéricos (galería, contexto, ancho de tarjetas)
├─ lib/                  Firebase, Cloudinary y utilidades de Firestore e imágenes
└─ utils/                funciones puras (validación, precios, fechas, avisos)
tests/                   pruebas de lógica pura y de reglas de seguridad
tools/                   base de tsconfig para que el editor no marque falsos errores en paquetes de Expo (ver su README)
firestore.rules          reglas de seguridad de Firestore
firebase.json            configuración de los emuladores y de las reglas
eas.json                 perfiles de compilación de EAS (APK de prueba y AAB para Google Play)
```

Cada dominio sigue el mismo esquema: un repositorio (el único código que habla con Firestore), mapeadores puros que convierten documentos en tipos de la app, hooks que suscriben en tiempo real, y pantallas que solo leen hooks.

## Decisiones de arquitectura

- [ADR-0001](docs/adr/0001-arquitectura-de-estado-y-navegacion.md): estado por dominio con proveedores, reducers puros y hooks.
- [ADR-0002](docs/adr/0002-rutas-de-archivos-y-datos-en-firestore.md): rutas de archivos con Expo Router, datos en Firestore y fotos en Cloudinary.
