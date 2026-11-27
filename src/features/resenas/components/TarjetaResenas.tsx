import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { PressableScale } from "@/components/PressableScale";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { EASE_OUT_CUBIC } from "@/constants/motion";
import { IconoEstrellaDetalle } from "@/features/marketplace/components/IconosDetalle";
import { coloresPedido } from "@/features/pedidos/colores";
import { INTER } from "@/features/perfil/editar/editarTema";
import { usePerfilDe } from "@/features/perfil/hooks/usePerfilDe";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import type { Resena } from "../formatoResena";

const ENTRADA = FadeIn.duration(260).easing(EASE_OUT_CUBIC);
const AMARILLO = "#FFB800";
const FONDO_RESENA_CLARO = "#F5F5F5"; // neutral-100
/** Avatares que se ven en el resumen; si hay más, el siguiente dice "+N" */
const MAX_AVATARES = 4;
const LADO_AVATAR = 34;

/** Cinco estrellas con el icono de la app: amarillas las que alcanza, grises las demás */
function EstrellasIcono({
  valor,
  tamano,
  apagada,
}: {
  valor: number;
  tamano: number;
  apagada: string;
}) {
  const llenas = Math.round(valor);
  return (
    <View
      accessibilityLabel={`${valor.toFixed(1)} de 5 estrellas`}
      style={styles.estrellasFila}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <IconoEstrellaDetalle
          key={n}
          size={tamano}
          color={n <= llenas ? AMARILLO : apagada}
        />
      ))}
    </View>
  );
}

/** Avatar real de quien escribió la reseña, con un filo del color de la tarjeta */
function AvatarResena({
  uid,
  nombre,
  filo,
  primero,
}: {
  uid: string;
  nombre: string;
  filo: string;
  primero: boolean;
}) {
  const perfil = usePerfilDe(uid);
  return (
    <View
      style={[
        styles.avatar,
        { borderColor: filo, marginLeft: primero ? 0 : -10 },
      ]}
    >
      <UserAvatar
        photo={perfil?.photo ?? null}
        orb={perfil?.orb ?? null}
        name={perfil?.name ?? nombre}
        size={LADO_AVATAR}
      />
    </View>
  );
}

/**
- Resumen de las reseñas: estrellas y promedio; debajo, cuántas reseñas hay; a la derecha, los
- avatares de quienes calificaron (hasta 4) y, si hay más, un círculo con "+N".
 */
function ResumenResenas({
  resenas,
  promedio,
  total,
}: {
  resenas: readonly Resena[];
  promedio: number;
  total: number;
}) {
  const { isDark } = useAppTheme();
  const c = coloresPedido(isDark);
  const visibles = resenas.slice(0, MAX_AVATARES);
  const restantes = total - visibles.length;
  return (
    <View
      accessibilityLabel={`${promedio.toFixed(1)} de 5 estrellas, ${total} ${total === 1 ? "reseña" : "reseñas"}`}
      // Primera card blanca con borde
      style={[
        styles.resumen,
        { backgroundColor: c.tarjeta, borderColor: c.borde },
      ]}
    >
      <View style={styles.resumenTextos}>
        <View style={styles.filaPromedio}>
          <EstrellasIcono
            valor={promedio}
            tamano={17}
            apagada={isDark ? "#4A4A4A" : "#D4D4D4"}
          />
          <Text style={[INTER.semibold, styles.promedio, { color: c.texto }]}>
            {promedio.toFixed(1)}
          </Text>
        </View>
        <View style={styles.filaCantidad}>
          <Text style={[INTER.regular, styles.cantidad, { color: c.suave }]}>
            {total} {total === 1 ? "reseña" : "reseñas"}
          </Text>
          <Ionicons name="chevron-forward" size={13} color={c.suave} />
        </View>
      </View>
      <View style={styles.avatares}>
        {/* Sin reseñas: tres lugares en gris, donde saldrán quienes califiquen */}
        {visibles.length === 0
          ? [0, 1, 2].map((i) => (
              <View
                key={`muestra-${i}`}
                style={[
                  styles.avatar,
                  {
                    borderColor: c.tarjeta,
                    backgroundColor: isDark ? "#3A3A3A" : "#DADADA",
                    marginLeft: i === 0 ? 0 : -10,
                  },
                ]}
              >
                <Ionicons
                  name="person"
                  size={16}
                  color={isDark ? "#5A5A5A" : "#F2F2F2"}
                />
              </View>
            ))
          : null}
        {visibles.map((resena, i) => (
          <AvatarResena
            key={resena.autorId}
            uid={resena.autorId}
            nombre={resena.autor}
            filo={c.tarjeta}
            primero={i === 0}
          />
        ))}
        {restantes > 0 ? (
          <View
            style={[
              styles.avatar,
              styles.mas,
              {
                borderColor: c.tarjeta,
                backgroundColor: isDark ? "#3A3A3A" : "#171717",
              },
            ]}
          >
            <Text style={[INTER.semibold, styles.masTexto]}>+{restantes}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function BotonFlecha({
  direccion,
  onPress,
}: {
  direccion: "anterior" | "siguiente";
  onPress: () => void;
}) {
  const { isDark } = useAppTheme();
  const c = coloresPedido(isDark);
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={
        direccion === "anterior" ? "Reseña anterior" : "Reseña siguiente"
      }
      onPress={onPress}
      scaleTo={0.9}
      style={[
        styles.flecha,
        { backgroundColor: c.tarjeta, borderColor: c.borde },
      ]}
    >
      <Ionicons
        name={direccion === "anterior" ? "chevron-back" : "chevron-forward"}
        size={16}
        color={c.texto}
      />
    </PressableScale>
  );
}

/**
- Las reseñas de una publicación de venta o comida. Arriba, el resumen (estrellas, promedio,
- cuántas hay y los avatares reales de quienes calificaron); debajo, una reseña a la vez
- (estrellas, nombre y lo que escribió) con flechas para pasar a la anterior o la siguiente.
 */
export function TarjetaResenas({
  resenas,
  promedio,
  total: totalGuardado,
}: {
  resenas: readonly Resena[];
  /** Promedio de la publicación (puede venir antes que las reseñas) */
  promedio?: number;
  /** Cuántas reseñas tiene la publicación (puede venir antes que las reseñas) */
  total?: number;
}) {
  const { isDark } = useAppTheme();
  const c = coloresPedido(isDark);
  const fondoResena = isDark ? c.neutro : FONDO_RESENA_CLARO;
  const [indice, setIndice] = useState(0);
  const cargadas = resenas.length;
  const total = Math.max(totalGuardado ?? 0, cargadas);
  const actual = resenas[Math.min(indice, cargadas - 1)];

  return (
    <View style={styles.seccion}>
      {/* Siempre con el mismo diseño: sin reseñas, en 0 y con lugares de muestra */}
      <ResumenResenas
        resenas={resenas}
        promedio={total > 0 ? (promedio ?? 0) : 0}
        total={total}
      />

      {/* Segunda card: neutral-100 y sin borde */}
      <View style={[styles.tarjeta, { backgroundColor: fondoResena }]}>
        {actual ? (
          <>
            <Animated.View
              key={actual.autorId}
              entering={ENTRADA}
              style={styles.cuerpo}
            >
              <EstrellasIcono
                valor={actual.estrellas}
                tamano={24}
                apagada={isDark ? "#4A4A4A" : "#D4D4D4"}
              />
              <Text style={[INTER.semibold, styles.autor, { color: c.texto }]}>
                {actual.autor}
              </Text>
              <Text style={[INTER.regular, styles.cita, { color: c.suave }]}>
                “{actual.texto}”
              </Text>
            </Animated.View>
            {cargadas > 1 ? (
              <View style={styles.flechas}>
                <BotonFlecha
                  direccion="anterior"
                  onPress={() =>
                    setIndice((i) => (i - 1 + cargadas) % cargadas)
                  }
                />
                <BotonFlecha
                  direccion="siguiente"
                  onPress={() => setIndice((i) => (i + 1) % cargadas)}
                />
              </View>
            ) : null}
          </>
        ) : (
          // Sin reseñas: el mismo diseño de una reseña, en gris, con lo que dirá cuando
          // alguien califique
          <View
            accessibilityLabel="Aún no hay reseñas. Aquí aparecerán cuando alguien compre y califique."
            style={styles.cuerpo}
          >
            <View style={styles.estrellasApagadas}>
              {[1, 2, 3, 4, 5].map((n) => (
                <IconoEstrellaDetalle
                  key={n}
                  size={26}
                  color={isDark ? "#4A4A4A" : "#D4D4D4"}
                />
              ))}
            </View>
            <Text style={[INTER.semibold, styles.autor, { color: c.suave }]}>
              Aún no hay reseñas
            </Text>
            <Text style={[INTER.regular, styles.cita, { color: c.suave }]}>
              “Cuando alguien compre y califique esta publicación, aquí verás
              sus estrellas, su nombre y lo que opina.”
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  seccion: { gap: 12 },
  // Resumen: textos a la izquierda, avatares a la derecha
  resumen: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  estrellasFila: { flexDirection: "row", gap: 3 },
  resumenTextos: { gap: 6, flexShrink: 1 },
  filaPromedio: { flexDirection: "row", alignItems: "center", gap: 8 },
  promedio: { fontSize: 14 },
  filaCantidad: { flexDirection: "row", alignItems: "center", gap: 2 },
  cantidad: { fontSize: 13 },
  avatares: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: LADO_AVATAR + 4,
    height: LADO_AVATAR + 4,
    borderRadius: (LADO_AVATAR + 4) / 2,
    borderWidth: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  mas: { marginLeft: -10 },
  masTexto: { color: "#FFFFFF", fontSize: 11.5 },
  tarjeta: { borderRadius: 18, padding: 20, gap: 18 },
  cuerpo: { gap: 10 },
  autor: { fontSize: 15.5 },
  cita: { fontSize: 14, lineHeight: 22, fontStyle: "italic" },
  flechas: { flexDirection: "row", gap: 10 },
  flecha: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  estrellasApagadas: { flexDirection: "row", gap: 4 },
});
