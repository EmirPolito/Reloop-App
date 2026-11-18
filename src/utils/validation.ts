export const MIN_PASSWORD_LENGTH = 6;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/** Valida correo y contraseña por separado, con mensajes cortos que caben dentro de cada campo. */
export function validarPorCampo(
  email: string,
  password: string,
): {
  emailError: string;
  passwordError: string;
} {
  const correo = email.trim();
  const emailError = !correo
    ? "Ingresa tu correo"
    : !isValidEmail(correo)
      ? "Correo no válido"
      : "";
  const passwordError = !password
    ? "Ingresa tu contraseña"
    : password.length < MIN_PASSWORD_LENGTH
      ? `Mínimo ${MIN_PASSWORD_LENGTH} caracteres`
      : "";
  return { emailError, passwordError };
}
