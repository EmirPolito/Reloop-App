/**
 * Salida animada del módulo en pantalla (favoritos, chats, notificaciones, perfil). El módulo
 * enfocado registra cómo salir; quien navega fuera de él (su botón de volver o la barra de
 * navegación) llama a `conSalida`, que primero anima la salida y luego navega. Si el módulo
 * en pantalla no tiene salida propia, navega de inmediato.
 */
type Salida = (despues: () => void, rapida: boolean) => void;

let salidaActual: Salida | null = null;
/** Si la siguiente entrada de módulo debe ser la corta (después de una salida corta) */
let siguienteRapida = false;

/** Dice si la entrada que empieza debe ser la corta, y lo olvida */
export function tomarEntradaRapida(): boolean {
  const rapida = siguienteRapida;
  siguienteRapida = false;
  return rapida;
}

/** Registra la salida del módulo enfocado; devuelve cómo quitarla al perder el foco */
export function registrarSalida(salida: Salida): () => void {
  salidaActual = salida;
  return () => {
    if (salidaActual === salida) salidaActual = null;
  };
}

/**
 * Anima la salida del módulo en pantalla (si tiene) y después ejecuta `accion`. Con `rapida`,
 * la salida es la corta (ver `TRANSICION_MODULO_RAPIDA`), y la entrada del que sigue también.
 */
export function conSalida(accion: () => void, rapida = false): void {
  // Tras una salida corta, el módulo que entra también usa la entrada corta
  siguienteRapida = rapida;
  if (salidaActual) salidaActual(accion, rapida);
  else accion();
}
