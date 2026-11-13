import AsyncStorage from "@react-native-async-storage/async-storage";

import { pasoDesdeIndice } from "./onboardingRules";

/**
 * Paso del onboarding en el que va cada cuenta, en este dispositivo: si cierra la app a la
 * mitad, vuelve ahí. Lo ya elegido no se pierde porque cada paso se guarda en Firebase al
 * confirmarlo; esto solo recuerda dónde iba.
 */
const clave = (uid: string) => `reloop:onboarding:paso:${uid}`;

export async function leerPaso(uid: string): Promise<number> {
  try {
    return pasoDesdeIndice(await AsyncStorage.getItem(clave(uid)));
  } catch {
    return 0;
  }
}

export function guardarPaso(uid: string, paso: number): void {
  AsyncStorage.setItem(clave(uid), String(paso)).catch((error) =>
    console.warn("No se pudo recordar el paso del onboarding.", error),
  );
}

export function borrarPaso(uid: string): void {
  AsyncStorage.removeItem(clave(uid)).catch(() => {});
}
