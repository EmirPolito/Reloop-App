import { useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { ProductFan } from "@/features/marketplace/components/productAbanico";
import type { FeedStatus } from "@/features/marketplace/hooks/useMarketplaceData";
import type { Product } from "@/features/marketplace/types";
import { IconoAnuncios, IconoPublicaciones } from "../Perfiliconos";
import { FilaPestanas, type Pestana } from "./FilaPestanas";

/** Todavía no existe el tipo de publicación "anuncio": mientras tanto la pestaña queda vacía */
export const SIN_ANUNCIOS: Product[] = [];

const PESTANAS: Pestana[] = ["publicaciones", "anuncios"];

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

/**
 * Pestañas Publicaciones / Anuncios del perfil, con su contenido o su estado vacío. Las
 * pestañas están en su lugar, entre la información y el contenido: se mueven con el scroll.
 */
export function PublicacionesPerfil({
  publicaciones,
  anuncios,
  status,
  isOwn,
  isDark,
  onOpen,
  style,
}: {
  publicaciones: Product[];
  anuncios: Product[];
  status: FeedStatus;
  isOwn: boolean;
  isDark: boolean;
  onOpen: (productId: string) => void;
  /** Avisa de dónde empieza la sección (px dentro del scroll) cada vez que se mide */
  style?: StyleProp<ViewStyle>;
}) {
  const [activa, setActiva] = useState<Pestana>("publicaciones");
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
    <View style={style}>
      <FilaPestanas activa={activa} onCambiar={setActiva} isDark={isDark} />

      {/* Las dos pestañas quedan montadas y la inactiva solo se vuelve invisible. */}
      <View>
        {PESTANAS.map((pestana) => {
          const visible = pestana === activa;
          return (
            <View
              key={pestana}
              pointerEvents={visible ? "auto" : "none"}
              accessibilityElementsHidden={!visible}
              importantForAccessibility={
                visible ? "auto" : "no-hide-descendants"
              }
              style={visible ? undefined : styles.oculta}
            >
              {contenido(pestana)}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Separación entre las pestañas y las imágenes de las publicaciones */
  abanico: { marginTop: 30 },
  /** Pestaña inactiva: fuera del flujo (no ocupa alto) e invisible, pero montada */
  oculta: { position: "absolute", top: 0, left: 0, right: 0, opacity: 0 },
});
