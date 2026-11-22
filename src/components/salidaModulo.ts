/**
 * Salida animada del módulo en pantalla (favoritos, chats, notificaciones, perfil). El módulo
 * enfocado registra cómo salir; quien navega fuera de él (su botón de volver o la barra de
 * navegación) llama a `conSalida`, que primero anima la salida y luego navega. Si el módulo
 * en pantalla no tiene salida propia, navega de inmediato.
 */
type Salida = (despues: () => void) => void;

let salidaActual: Salida | null = null;

/** Registra la salida del módulo enfocado; devuelve cómo quitarla al perder el foco */
export function registrarSalida(salida: Salida): () => void {
  salidaActual = salida;
  return () => {
    if (salidaActual === salida) salidaActual = null;
  };
}

/** Anima la salida del módulo en pantalla (si tiene) y después ejecuta `accion` */
export function conSalida(accion: () => void): void {
  if (salidaActual) salidaActual(accion);
  else accion();
}
