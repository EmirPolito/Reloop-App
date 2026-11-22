import { useDissolve } from "dissolve-ui";
import {
  useCallback,
  useEffect,
  useRef,
  type ComponentRef,
  type ReactNode,
  type RefObject,
} from "react";
import { Dimensions, View } from "react-native";

type VistaRef = ComponentRef<typeof View>;

/** Cómo una lista hace volar un elemento hacia el botón de eliminar y lo devuelve si falla */
export interface Disolvedor {
  disolver: (destino: RefObject<VistaRef | null>) => Promise<void>;
  restaurar: () => void;
  /** Si el elemento se ve ahora en la pantalla (los de fuera no se animan) */
  enPantalla: () => Promise<boolean>;
}

/** Entre un elemento y el siguiente, cuánto se espera para que vuelen en cascada (ms) */
const CASCADA_MS = 70;
/** Solo los primeros se escalonan: los demás salen junto con el último */
const CASCADA_MAX = 6;

/**
 * Eliminar con el efecto Stream (dissolve-ui) en una lista: los elementos que están a la vista
 * se vuelven granos que vuelan hacia el botón de eliminar (`destinoRef`) y, al terminar, se
 * eliminan de verdad. Cada elemento se registra con `registrar` (ver `Disolvible`).
 */
export function useEliminarConEfecto() {
  const destinoRef = useRef<VistaRef>(null);
  const disolvedores = useRef(new Map<string, Disolvedor>());

  const registrar = useCallback((id: string, disolvedor: Disolvedor | null) => {
    if (disolvedor) disolvedores.current.set(id, disolvedor);
    else disolvedores.current.delete(id);
  }, []);

  /** Si `eliminar` falla, los elementos ocultos vuelven a verse y el error se relanza */
  const eliminarConEfecto = useCallback(
    async (
      ids: string[],
      eliminar: () => Promise<void>,
      /** Cuántos animar como mucho: con muchos a la vez el efecto se traba (los demás solo se quitan) */
      maxAnimados = Infinity,
    ) => {
      const registrados = ids.flatMap(
        (id) => disolvedores.current.get(id) ?? [],
      );
      // Solo vuelan los que se ven: animar los que están fuera de la pantalla traba el efecto
      const visibles = await Promise.all(
        registrados.map((item) => item.enPantalla()),
      );
      const aLaVista = registrados
        .filter((_, i) => visibles[i])
        .slice(0, maxAnimados);
      try {
        await Promise.all(
          aLaVista.map((item, i) =>
            new Promise<void>((listo) =>
              setTimeout(listo, Math.min(i, CASCADA_MAX) * CASCADA_MS),
            )
              .then(() => item.disolver(destinoRef))
              // El efecto es solo visual (en la web, por ejemplo, no puede capturar el elemento):
              // si falla, el elemento vuelve a verse y la eliminación sigue
              .catch(() => item.restaurar()),
          ),
        );
        await eliminar();
      } catch (error) {
        aLaVista.forEach((item) => item.restaurar());
        throw error;
      }
    },
    [],
  );

  return { destinoRef, registrar, eliminarConEfecto };
}

/**
 * Envuelve un elemento de la lista para poder disolverlo: guarda su vista y se oculta mientras
 * sus granos vuelan. `sombra` agrega relleno (con margen negativo, sin mover nada) para que la
 * captura incluya la sombra del elemento: si no, al ocultarlo la sombra desaparece de golpe.
 */
export function Disolvible({
  id,
  registrar,
  sombra = 0,
  margenInferior = 0,
  children,
}: {
  id: string;
  registrar?: (id: string, disolvedor: Disolvedor | null) => void;
  sombra?: number;
  margenInferior?: number;
  children: ReactNode;
}) {
  const { ref, dissolving, dissolve, reset } = useDissolve();

  useEffect(() => {
    if (!registrar) return;
    registrar(id, {
      disolver: (destino) =>
        dissolve({ preset: "stream", grain: 3.5, duration: 1500, to: destino }),
      restaurar: reset,
      enPantalla: () =>
        new Promise((listo) => {
          const vista = (ref as unknown as RefObject<VistaRef | null>).current;
          if (!vista) return listo(false);
          vista.measureInWindow((_x, y, _ancho, alto) =>
            listo(y + alto > 0 && y < Dimensions.get("window").height),
          );
        }),
    });
    return () => registrar(id, null);
  }, [registrar, id, dissolve, reset, ref]);

  return (
    <View
      // Los tipos de dissolve-ui declaran el ref con View como tipo, no como componente
      ref={ref as unknown as RefObject<VistaRef>}
      collapsable={false}
      pointerEvents="box-none"
      style={{
        padding: sombra,
        margin: -sombra,
        marginBottom: margenInferior - sombra,
        opacity: dissolving ? 0 : 1,
      }}
    >
      {children}
    </View>
  );
}
