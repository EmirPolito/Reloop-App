import { Skeleton } from "heroui-native";
import { useMemo, useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import type { FeedStatus } from "@/features/marketplace/hooks/useMarketplaceData";
import { MIN_PARA_TARJETA } from "@/features/marketplace/sellerGroups";
import type { Product } from "@/features/marketplace/types";
import { useDuenosPremium } from "@/features/premium/hooks/useMembership";
import { showErrorAlert } from "@/utils/alerts";
import { FilaPestanas, type Pestana } from "./components/FilaPestanas";
import { ListaPublicaciones } from "./components/ListaPublicaciones";
import { TarjetaVendedor } from "./components/TarjetaVendedor";
import { SheetTarjeta } from "./editar/SheetTarjeta";
import { IconoAnuncios, IconoPublicaciones } from "./iconosPerfil";
import { useProfile } from "./ProveedorPerfil";
import type { DatosPerfil, DisenoTarjeta } from "./temasPerfil";

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
  perfil,
  status,
  isOwn,
  isDark,
  onOpen,
  style,
}: {
  publicaciones: Product[];
  /** Perfil de quien publica: su nombre, avatar y el diseño de la tarjeta */
  perfil: DatosPerfil;
  anuncios: Product[];
  status: FeedStatus;
  isOwn: boolean;
  isDark: boolean;
  onOpen: (productId: string) => void;
  /** Avisa de dónde empieza la sección (px dentro del scroll) cada vez que se mide */
  style?: StyleProp<ViewStyle>;
}) {
  const [activa, setActiva] = useState<Pestana>("publicaciones");
  const { profile: propio, saveProfile } = useProfile();
  const [disenando, setDisenando] = useState(false);
  const guardarDiseno = async (tarjeta: DisenoTarjeta) => {
    try {
      await saveProfile({ ...propio, tarjeta });
    } catch (error) {
      showErrorAlert("No se pudo guardar el diseño", error);
      throw error;
    }
  };
  const colorIconoVacio = isDark ? "#475569" : "#e4e4e4ff";
  // La tarjeta grande solo es para quien tiene insignia (Premium)
  const dueno = publicaciones[0]?.ownerId;
  const duenos = useMemo(() => (dueno ? [dueno] : []), [dueno]);
  const conInsignia = useDuenosPremium(duenos).has(dueno ?? "");

  /** Contenido de una pestaña: abanico, carga o estado vacío */
  const contenido = (pestana: Pestana) => {
    const items = pestana === "publicaciones" ? publicaciones : anuncios;
    const vacio = VACIO[pestana][isOwn ? "propio" : "ajeno"];
    if (items.length) {
      return (
        <View style={styles.abanico}>
          {/* Con insignia y 3 o más, arriba la tarjeta grande; debajo siempre las publicaciones una por
              una (en el perfil propio, con republicar, editar y eliminar) */}
          {pestana === "publicaciones" &&
          conInsignia &&
          items.length >= MIN_PARA_TARJETA ? (
            <View style={styles.tarjetaGrande}>
              <TarjetaVendedor
                items={items}
                profile={perfil}
                ownerId={items[0].ownerId}
                isOwn={isOwn}
                isDark={isDark}
                onOpen={onOpen}
                onPersonalizar={() => setDisenando(true)}
                enPerfil
              />
            </View>
          ) : null}
          <ListaPublicaciones items={items} isOwn={isOwn} onOpen={onOpen} />
        </View>
      );
    }
    if (status === "loading") return <EsqueletoPublicaciones />;
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

      {isOwn ? (
        <SheetTarjeta
          visible={disenando}
          diseno={propio.tarjeta}
          items={publicaciones}
          perfil={perfil}
          ownerId={publicaciones[0]?.ownerId ?? ""}
          isDark={isDark}
          onClose={() => setDisenando(false)}
          onGuardar={guardarDiseno}
        />
      ) : null}
    </View>
  );
}

/** Mientras cargan: tarjetas de carga (el `Skeleton` de HeroUI) de dos en dos */
function EsqueletoPublicaciones() {
  return (
    <View
      accessibilityLabel="Cargando publicaciones"
      accessibilityRole="progressbar"
      style={styles.esqueleto}
    >
      {[0, 1].map((fila) => (
        <View key={fila} style={styles.esqueletoFila}>
          {[0, 1].map((i) => (
            <View key={i} style={styles.esqueletoTarjeta}>
              <Skeleton
                className="w-full rounded-3xl"
                style={styles.esqueletoFoto}
              />
              <Skeleton className="h-2.5 w-3/4 rounded-md" />
              <Skeleton className="h-2.5 w-2/5 rounded-md" />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  esqueleto: { marginTop: 14, gap: 18 },
  esqueletoFila: { flexDirection: "row", gap: 14 },
  esqueletoTarjeta: { flex: 1, gap: 8 },
  esqueletoFoto: { aspectRatio: 1 },
  /** Separación entre las pestañas y la lista de publicaciones */
  abanico: { marginTop: 14 },
  /** Separación entre la tarjeta grande y las publicaciones de abajo */
  tarjetaGrande: { marginBottom: 22 },
  /** Pestaña inactiva: fuera del flujo (no ocupa alto) e invisible, pero montada */
  oculta: { position: "absolute", top: 0, left: 0, right: 0, opacity: 0 },
});
