import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { PressableSuave } from "@/components/PressableSuave";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ProductFan } from "@/features/marketplace/components/productAbanico";
import type { FeedStatus } from "@/features/marketplace/hooks/useMarketplaceData";
import type { Product } from "@/features/marketplace/types";
import { Text } from "@/features/shared/Text";
import { IconoAnuncios, IconoPublicaciones } from "../Perfiliconos";
import { coloresTarjeta } from "../perfilEstilos";

/** Todavía no existe el tipo de publicación "anuncio": mientras tanto la pestaña queda vacía */
export const SIN_ANUNCIOS: Product[] = [];

type Pestana = "publicaciones" | "anuncios";

const PESTANAS: { id: Pestana; label: string }[] = [
  { id: "publicaciones", label: "Publicaciones" },
  { id: "anuncios", label: "Anuncios" },
];

/**
 * Rayita: ease-out fuerte y corto. Arranca rápido (responde al toque al instante) y frena
 * suave al llegar. withTiming se puede interrumpir: si tocas otra pestaña a medio camino,
 * cambia de rumbo desde donde va.
 */
const MOVIMIENTO = { duration: 220, easing: Easing.bezier(0.23, 1, 0.32, 1) };

/** Textos de los estados vacíos según la pestaña y si el perfil es propio o ajeno */
const VACIO: Record<
  Pestana,
  Record<"propio" | "ajeno", { title: string; message: string }>
> = {
  publicaciones: {
    propio: {
      title: "Aún no tienes publicaciones",
      message: "Lo que publiques aparecerá aquí automáticamente.",
    },
    ajeno: {
      title: "Aún no hay publicaciones",
      message: "Las publicaciones de esta persona aparecerán aquí.",
    },
  },
  anuncios: {
    propio: {
      title: "Aún no tienes anuncios",
      message: "Los anuncios que publiques aparecerán aquí automáticamente.",
    },
    ajeno: {
      title: "Aún no hay anuncios",
      message: "Los anuncios de esta persona aparecerán aquí.",
    },
  },
};

/** Pestañas Publicaciones / Anuncios del perfil, con su contenido o su estado vacío. */
export function PublicacionesPerfil({
  publicaciones,
  anuncios,
  status,
  isOwn,
  isDark,
  onOpen,
}: {
  publicaciones: Product[];
  anuncios: Product[];
  status: FeedStatus;
  isOwn: boolean;
  isDark: boolean;
  onOpen: (productId: string) => void;
}) {
  const [activa, setActiva] = useState<Pestana>("publicaciones");
  const [ancho, setAncho] = useState(0);
  const { texto, divisor } = coloresTarjeta(isDark);
  // Pestaña no seleccionada: gris visible sobre el fondo (no blanco, o desaparece)
  const inactivo = isDark ? "#64748B" : "#AEAEB2";

  const indice = PESTANAS.findIndex((p) => p.id === activa);
  const columna = ancho / PESTANAS.length;
  // La línea cubre toda la columna de borde a borde
  const destino = indice * columna;

  // La primera vez se coloca directo; después se desliza al cambiar de pestaña
  const x = useSharedValue<number | null>(null);
  useEffect(() => {
    if (ancho <= 0) return;
    x.set(x.get() === null ? destino : withTiming(destino, MOVIMIENTO));
  }, [ancho, destino, x]);

  const estiloIndicador = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value ?? 0 }],
  }));

  const colorIconoVacio = isDark ? "#475569" : "#e4e4e4ff";

  /** Contenido de una pestaña: abanico, carga o estado vacío */
  const contenido = (pestana: Pestana) => {
    const items = pestana === "publicaciones" ? publicaciones : anuncios;
    const vacio = VACIO[pestana][isOwn ? "propio" : "ajeno"];
    if (items.length) {
      return (
        <View style={styles.abanico}>
          <ProductFan items={items} onOpen={onOpen} />
        </View>
      );
    }
    if (status === "loading") return <LoadingState />;
    return (
      <IllustratedEmptyState
        icon={
          pestana === "publicaciones" ? (
            <IconoPublicaciones size={80} color={colorIconoVacio} />
          ) : (
            <IconoAnuncios size={80} color={colorIconoVacio} />
          )
        }
        title={vacio.title}
        message={vacio.message}
        style={{ paddingTop: 60, paddingBottom: 80 }}
      />
    );
  };

  return (
    <View>
      <View
        accessibilityRole="tablist"
        style={styles.fila}
        onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      >
        {PESTANAS.map((p) => {
          const seleccionada = p.id === activa;
          const color = seleccionada ? texto : inactivo;
          return (
            <PressableSuave
              key={p.id}
              accessibilityRole="tab"
              accessibilityLabel={p.label}
              accessibilityState={{ selected: seleccionada }}
              onPress={() => setActiva(p.id)}
              style={styles.pestana}
            >
              {p.id === "publicaciones" ? (
                <IconoPublicaciones size={22} color={color} />
              ) : (
                <IconoAnuncios size={20} color={color} />
              )}
              <Text style={[styles.etiqueta, { color }]}>{p.label}</Text>
            </PressableSuave>
          );
        })}

        {ancho > 0 ? (
          <Animated.View
            style={[
              styles.indicador,
              { backgroundColor: texto, width: columna },
              estiloIndicador,
            ]}
          />
        ) : null}
      </View>
      <View style={[styles.divisor, { backgroundColor: divisor }]} />

      {/* Las dos pestañas quedan montadas y la inactiva solo se vuelve invisible. */}
      <View>
        {PESTANAS.map((p) => {
          const visible = p.id === activa;
          return (
            <View
              key={p.id}
              pointerEvents={visible ? "auto" : "none"}
              accessibilityElementsHidden={!visible}
              importantForAccessibility={
                visible ? "auto" : "no-hide-descendants"
              }
              style={visible ? undefined : styles.oculta}
            >
              {contenido(p.id)}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: "row",
    width: "100%",
  },
  pestana: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  indicador: {
    position: "absolute",
    left: 0,
    bottom: 0,
    height: 2,
    borderRadius: 2,
  },
  /** Separación entre las pestañas y las imágenes de las publicaciones */
  abanico: { marginTop: 30 },
  etiqueta: { fontFamily: "Inter_600SemiBold", fontSize: 14, top: 1 },
  divisor: { height: StyleSheet.hairlineWidth },
  /** Pestaña inactiva: fuera del flujo (no ocupa alto) e invisible, pero montada */
  oculta: { position: "absolute", top: 0, left: 0, right: 0, opacity: 0 },
});
