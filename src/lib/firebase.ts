import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import * as FirebaseAuth from "firebase/auth";
import { connectFirestoreEmulator, initializeFirestore } from "firebase/firestore";
import { Platform } from "react-native";

// Con los emuladores de Firebase no hace falta un proyecto real: se completan datos de relleno.
// (Expo solo sustituye las variables escritas literalmente como `process.env.EXPO_PUBLIC_*`.)
const emulatorHost = process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST;
// Con emuladores se ignoran las claves reales: así nunca se mezcla un proyecto real con los datos locales.
const demo = (value: string | undefined, fallback: string) =>
  emulatorHost ? fallback : value;

const firebaseConfig = {
  apiKey: demo(process.env.EXPO_PUBLIC_FIREBASE_API_KEY, "demo-api-key"),
  authDomain: demo(
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    "demo-reloop.firebaseapp.com",
  ),
  projectId: demo(process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID, "demo-reloop"),
  storageBucket: demo(
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    "demo-reloop.appspot.com",
  ),
  messagingSenderId: demo(
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    "000000000000",
  ),
  appId: demo(
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    "1:000000000000:web:demo",
  ),
};

const missingKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingKeys.length > 0) {
  throw new Error(
    `Falta la configuración de Firebase (${missingKeys.join(", ")}). ` +
      "Copia .env.example a .env, completa los valores y reinicia con `npx expo start -c`.",
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function isAlreadyInitialized(error: unknown): boolean {
  return (error as { code?: string } | null)?.code === "auth/already-initialized";
}

function createAuth(): FirebaseAuth.Auth {
  if (Platform.OS === "web") return FirebaseAuth.getAuth(app);
  try {
    // getReactNativePersistence no aparece en los tipos públicos, por eso el cast
    const { getReactNativePersistence } = FirebaseAuth as any;
    return FirebaseAuth.initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    // Con Fast Refresh Auth ya puede estar inicializado; cualquier otro fallo sí se propaga
    if (isAlreadyInitialized(error)) return FirebaseAuth.getAuth(app);
    throw error;
  }
}

export const auth = createAuth();
// Los correos de Firebase (verificación y recuperación de contraseña) salen en español
auth.languageCode = "es";
// Long-polling forzado: con la detección automática, la primera conexión esperaba unos 10 s antes de
// cambiar de transporte (el registro tardaba 15 s con Firebase real; así tarda unos 4 s).
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });

// Los emuladores solo se conectan una vez, aunque Fast Refresh vuelva a evaluar este módulo
const globalFlags = globalThis as { __reloopEmulatorsConnected?: boolean };
if (emulatorHost && !globalFlags.__reloopEmulatorsConnected) {
  globalFlags.__reloopEmulatorsConnected = true;
  FirebaseAuth.connectAuthEmulator(auth, `http://${emulatorHost}:9099`, {
    disableWarnings: true,
  });
  // Mismo puerto que `emulators.firestore.port` en firebase.json
  connectFirestoreEmulator(db, emulatorHost, 8085);
}
