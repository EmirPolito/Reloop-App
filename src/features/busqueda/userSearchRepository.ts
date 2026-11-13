import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

import type { DatosPerfil } from "@/features/perfil/Perfiltemas";
import { mapProfile } from "@/features/perfil/profileMappers";
import { db } from "@/lib/firebase";

const USERS = "usuarios";
const LIMITE = 12;
/** Último carácter de Unicode de uso privado: cierra el rango de una búsqueda por prefijo */
const FIN_PREFIJO = "";

/** Una persona en los resultados: solo lo que muestra la fila, todo público */
export type UsuarioEncontrado = Pick<
  DatosPerfil,
  "name" | "username" | "photo" | "orb"
> & { uid: string };

function aUsuario(snapshot: QueryDocumentSnapshot): UsuarioEncontrado {
  const { name, username, photo, orb } = mapProfile(snapshot.data(), "Usuario");
  return { uid: snapshot.id, name, username, photo, orb };
}

function porPrefijo(campo: string, termino: string) {
  return query(
    collection(db, USERS),
    where(campo, ">=", termino),
    where(campo, "<=", termino + FIN_PREFIJO),
    orderBy(campo),
    limit(LIMITE),
  );
}

/**
 * Personas cuyo @username (o, en segundo lugar, cuyo nombre) empieza con `termino`, ya
 * normalizado. Con `termino` vacío (solo "@") devuelve las cuentas más recientes como
 * sugerencia. Las fichas de `usuarios` son públicas para quien tiene sesión y no guardan
 * datos privados (el correo vive en `cuentas`, que solo lee su dueña).
 */
export async function searchUsers(termino: string): Promise<UsuarioEncontrado[]> {
  if (!termino) {
    const recientes = await getDocs(
      query(collection(db, USERS), orderBy("creadoEn", "desc"), limit(LIMITE)),
    );
    return recientes.docs.map(aUsuario);
  }

  const [porUsername, porNombre] = await Promise.all([
    getDocs(porPrefijo("usernameNormalized", termino)),
    getDocs(porPrefijo("nombreNormalizado", termino)),
  ]);
  // Primero los que coinciden por username; sin repetir a quien coincide por ambos
  const vistos = new Set<string>();
  return [...porUsername.docs, ...porNombre.docs]
    .filter((snapshot) => {
      if (vistos.has(snapshot.id)) return false;
      vistos.add(snapshot.id);
      return true;
    })
    .slice(0, LIMITE)
    .map(aUsuario);
}
