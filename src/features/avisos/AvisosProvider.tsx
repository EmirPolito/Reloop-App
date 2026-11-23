import { Ionicons } from "@expo/vector-icons";
import {
  createContext,
  type ComponentProps,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { StyleSheet, View } from "react-native";

import { BannerNotificacion } from "@/features/notificaciones/components/BannerNotificacion";
import { useRequiredContext } from "@/hooks/useRequiredContext";

type TipoAviso = "exito" | "error" | "eliminada" | "favorito" | "sinFavorito";

interface Aviso {
  /** Cambia con cada aviso: cada uno monta su propio banner */
  id: number;
  tipo: TipoAviso;
  titulo: string;
  descripcion: string;
}

export interface AvisosActions {
  /** Muestra un aviso arriba, con el diseño de las notificaciones */
  mostrar: (aviso: Omit<Aviso, "id">) => void;
}

const AvisoContext = createContext<Aviso | null | undefined>(undefined);
const AvisosActionsContext = createContext<
  (AvisosActions & { quitar: () => void }) | null
>(null);

/**
 * Avisos de la app que salen arriba (por ejemplo "Publicación republicada"), con el mismo
 * banner de las notificaciones. Muestra uno a la vez: un aviso nuevo reemplaza al anterior.
 */
export function AvisosProvider({ children }: PropsWithChildren) {
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const mostrar = useCallback(
    (nuevo: Omit<Aviso, "id">) => setAviso({ ...nuevo, id: Date.now() }),
    [],
  );
  const quitar = useCallback(() => setAviso(null), []);
  const acciones = useMemo(() => ({ mostrar, quitar }), [mostrar, quitar]);

  return (
    <AvisosActionsContext.Provider value={acciones}>
      <AvisoContext.Provider value={aviso}>{children}</AvisoContext.Provider>
    </AvisosActionsContext.Provider>
  );
}

export function useAvisos(): AvisosActions {
  return useRequiredContext(AvisosActionsContext, "AvisosProvider");
}

/** Color fuerte del círculo de cada tipo de aviso (el icono va en blanco) */
const COLORES: Record<TipoAviso, string> = {
  exito: "#10B981",
  error: "#FF3D63",
  // Al eliminar algo: rojo
  eliminada: "#F20000",
  favorito: "#F2143C",
  sinFavorito: "#64748B",
};

/** Icono (en blanco) del círculo de cada tipo de aviso */
const ICONOS: Record<TipoAviso, ComponentProps<typeof Ionicons>["name"]> = {
  exito: "checkmark",
  error: "close",
  eliminada: "trash",
  favorito: "heart",
  sinFavorito: "heart-dislike",
};

/** Dibuja el aviso actual arriba de todo. Va en el layout de la app, junto a los banners. */
export function AvisoHost() {
  // `null` es "sin aviso"; `undefined`, que falta el proveedor
  const aviso = useContext(AvisoContext);
  if (aviso === undefined) {
    throw new Error("AvisoHost debe usarse dentro de <AvisosProvider>.");
  }
  const acciones = useRequiredContext(AvisosActionsContext, "AvisosProvider");
  if (!aviso) return null;

  const fondo = COLORES[aviso.tipo];
  return (
    <BannerNotificacion
      key={aviso.id}
      contenido={{
        titulo: aviso.titulo,
        descripcion: aviso.descripcion,
        leading: (
          <View style={[estilos.circulo, { backgroundColor: fondo }]}>
            <Ionicons
              name={ICONOS[aviso.tipo]}
              size={28}
              color="#FFFFFF"
            />
          </View>
        ),
        // El círculo de color de la izquierda ya lleva su icono: no se repite a la derecha
        icono: null,
        pista: "Toca para cerrar",
      }}
      // Tocarlo solo lo cierra: no hay a dónde llevar
      onOpen={() => {}}
      onDismiss={acciones.quitar}
    />
  );
}

const estilos = StyleSheet.create({
  circulo: {
    width: 47,
    height: 47,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
