import { useCallback, useState } from "react";

/**
 * Modo de selección de una lista (para eliminar elementos): se activa con el botón o con un
 * toque largo, y guarda cuáles están marcados.
 */
export function useSeleccion() {
  const [activo, setActivo] = useState(false);
  const [marcados, setMarcados] = useState<ReadonlySet<string>>(new Set());

  const iniciar = useCallback((id?: string) => {
    setActivo(true);
    setMarcados(id ? new Set([id]) : new Set());
  }, []);

  /** Empieza a seleccionar con todos los de la lista ya marcados */
  const iniciarTodos = useCallback((ids: string[]) => {
    setActivo(true);
    setMarcados(new Set(ids));
  }, []);

  const salir = useCallback(() => {
    setActivo(false);
    setMarcados(new Set());
  }, []);

  const alternar = useCallback((id: string) => {
    setMarcados((actuales) => {
      const nuevos = new Set(actuales);
      if (nuevos.has(id)) nuevos.delete(id);
      else nuevos.add(id);
      return nuevos;
    });
  }, []);

  /** Marca todos los de la lista o, si ya lo estaban, los desmarca */
  const alternarTodos = useCallback((ids: string[]) => {
    setMarcados((actuales) =>
      ids.length > 0 && ids.every((id) => actuales.has(id))
        ? new Set()
        : new Set(ids),
    );
  }, []);

  return { activo, marcados, iniciar, iniciarTodos, salir, alternar, alternarTodos };
}
