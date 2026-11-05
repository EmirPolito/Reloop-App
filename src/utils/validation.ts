export const MIN_PASSWORD_LENGTH = 6;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email.trim());
}

/** Devuelve el mensaje de error para el usuario, o `null` si los datos son válidos. */
export function validateCredentials(
  email: string,
  password: string,
): string | null {
  if (!isValidEmail(email)) return "Escribe un correo electrónico válido.";
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }
  return null;
}
