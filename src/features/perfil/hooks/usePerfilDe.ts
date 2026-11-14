import { crearSuscripcionCompartida } from "@/lib/sharedSubscription";
import type { DatosPerfil } from "../Perfiltemas";
import { subscribeProfile } from "../profileRepository";

/**
 * Perfil actual de `uid` (foto, avatar orbe, nombre, @username) compartido por toda la
 * app: una sola suscripción por persona, aunque su avatar aparezca en muchas tarjetas.
 * `undefined` mientras llega; `null` si no tiene ficha.
 */
export const usePerfilDe = crearSuscripcionCompartida<DatosPerfil | null>(
  "un perfil",
  (uid, alDato, alError) => subscribeProfile(uid, alDato, alError),
);
