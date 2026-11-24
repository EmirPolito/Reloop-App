import { crearSuscripcionCompartida } from "@/lib/sharedSubscription";
import type { DatosPerfil } from "../temasPerfil";
import { subscribeProfile } from "../repositorioPerfil";

/**
 * Perfil actual de `uid` (foto, avatar orbe, nombre, @username) compartido por toda la
 * app: una sola suscripción por persona, aunque su avatar aparezca en muchas tarjetas.
 * `undefined` mientras llega; `null` si no tiene ficha.
 */
export const usePerfilDe = crearSuscripcionCompartida<DatosPerfil | null>(
  "un perfil",
  (uid, alDato, alError) => subscribeProfile(uid, alDato, alError),
);

/**
 * Los perfiles de varias personas a la vez (todas las de una lista), con las mismas
 * suscripciones compartidas. Hook propio: llamar `usePerfilDe.varias(...)` dentro de un
 * componente hacía que React Compiler dejara de optimizarlo.
 */
export const usePerfilesDe = usePerfilDe.varias;
