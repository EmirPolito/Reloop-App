import { Redirect } from "expo-router";

/**
 * La bienvenida ya no forma parte del flujo: tras la animación de entrada se va al inicio
 * (con sesión) o al inicio de sesión (sin ella). La ruta se conserva solo para que una URL
 * vieja o guardada (`/bienvenida`) no deje a nadie aquí. Con sesión, este grupo `(auth)`
 * ni siquiera se muestra: el layout raíz manda al inicio.
 */
export default function BienvenidaRoute() {
  return <Redirect href="/login" />;
}
