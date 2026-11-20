import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

import { PressableScale } from "@/components/PressableScale";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import { ENTRADA_MODULO } from "@/constants/motion";
import { BackArrowIcon } from "@/features/chats/components/ThreadIcons";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { showComingSoonAlert } from "@/utils/alerts";
import { useIsPremium } from "./hooks/useMembership";

const ENTRADA = FadeInDown.duration(ENTRADA_MODULO.timing.duration)
  .easing(ENTRADA_MODULO.timing.easing)
  .withInitialValues({
    transform: [{ translateY: ENTRADA_MODULO.desplazamiento }],
  });

const AZUL = "#0785FF";
const GRADIENTE_AZUL: [string, string] = ["#2075fd", "#00aafe"];
const AMARILLO_PALOMITA = "#ffd93e";

type PlanId = "anuncio" | "premium";

const PLANES: Record<
  PlanId,
  {
    nombre: string;
    precio: string;
    unidad: string;
    titulo: string;
    puntos: string[];
    accionSecundaria: string;
    accion: string;
  }
> = {
  anuncio: {
    nombre: "Anuncio",
    precio: "$10",
    unidad: "MXN/anuncio",
    titulo: "Anuncio individual",
    puntos: [
      "1 anuncio en el carrusel de ReLoop",
      "24 horas de exposición",
      "Disponible para cualquier usuario",
    ],
    accionSecundaria: "Ver cómo funcionan los anuncios",
    accion: "Comprar anuncio",
  },
  premium: {
    nombre: "Premium",
    precio: "$69.99",
    unidad: "MXN/mes",
    titulo: "Reloop premium",
    puntos: [
      "Insignia de verificación en tus avatares.",
      "Insignia de verificación junto a tu nombre.",
      "Tus publicaciones de primero en el feed.",
      "5 banners de anuncios durante el mes.",
      "24 horas disponibles por cada anuncio.",
    ],
    accionSecundaria: "Ver ejemplos de los beneficios",
    accion: "Obtener Premium",
  },
};

function IconoPalomita({
  size = 19,
  color = AMARILLO_PALOMITA,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        fill={color}
        d="M12.7193 15.8427L12.5043 16.2237H11.6643L11.4113 15.8877C11.3963 15.8647 9.9093 13.6427 7.9873 12.4267L7.3523 12.0267L8.1543 10.7587L8.7873 11.1587C10.1723 12.0337 11.3223 13.3117 12.0003 14.1647C13.0653 12.5597 15.5593 9.21667 19.3843 6.50567C17.5973 4.24367 14.8363 2.78467 11.7373 2.78467C6.3613 2.78467 1.9873 7.15867 1.9873 12.5347C1.9873 17.9107 6.3613 22.2847 11.7373 22.2847C17.1133 22.2847 21.4873 17.9107 21.4873 12.5347C21.4873 10.7977 21.0253 9.16967 20.2263 7.75567C15.3933 11.2017 12.7483 15.7917 12.7193 15.8427Z"
      />
    </Svg>
  );
}

/** Icono de anuncios: monocromático (blanco en oscuro, oscuro en claro) */
function IconoAnuncio({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="2 2 20 20">
      <Path
        fill={color}
        d="M16.6694,2.0004 C20.0704,2.0004 21.9904,3.9294 22.0004,7.3304 L22.0004,16.6704 C22.0004,20.0704 20.0704,22.0004 16.6694,22.0004 L7.3304,22.0004 C3.9294,22.0004 2.0004,20.0704 2.0004,16.6704 L2.0004,7.3304 C2.0004,3.9294 3.9294,2.0004 7.3304,2.0004 Z M12.5004,6.1304 C12.2194,5.9604 11.8794,5.9604 11.6104,6.1304 C11.3394,6.2994 11.1904,6.6104 11.2194,6.9204 L11.2194,17.1104 C11.2704,17.5404 11.6294,17.8604 12.0494,17.8604 C12.4804,17.8604 12.8394,17.5404 12.8794,17.1104 L12.8794,6.9204 C12.9194,6.6104 12.7704,6.2994 12.5004,6.1304 Z M7.8304,9.4104 C7.5604,9.2404 7.2194,9.2404 6.9504,9.4104 C6.6794,9.5804 6.5304,9.8894 6.5604,10.2004 L6.5604,17.1104 C6.5994,17.5404 6.9594,17.8604 7.3894,17.8604 C7.8204,17.8604 8.1794,17.5404 8.2194,17.1104 L8.2194,10.2004 C8.2504,9.8894 8.0994,9.5804 7.8304,9.4104 Z M17.0894,13.0404 C16.8204,12.8704 16.4804,12.8704 16.2004,13.0404 C15.9294,13.2104 15.7804,13.5094 15.8204,13.8304 L15.8204,17.1104 C15.8604,17.5404 16.2194,17.8604 16.6504,17.8604 C17.0704,17.8604 17.4294,17.5404 17.4804,17.1104 L17.4804,13.8304 C17.5094,13.5094 17.3604,13.2104 17.0894,13.0404 Z"
      />
    </Svg>
  );
}

/**
- ReLoop Premium y anuncios: pantalla sin scroll con contenido posicionado arriba,
- botón neutro, enlaces legales y opciones de suscripción fijas al pie.
 */
export function PantallaPremium() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { back } = useAppNavigation();
  const { uid } = useSessionUser();
  const premiumActivo = useIsPremium(uid);
  const [elegido, setElegido] = useState<PlanId>("premium");
  const plan = PLANES[elegido];

  const texto = isDark ? "#F1F5F9" : "#101010";
  const suave = isDark ? "#94A3B8" : "#6B6B6B";
  const superficie = isDark ? "#ffffff12" : "#ffffffb7";
  const borde = isDark ? "#ffffff2e" : "#D7DCE4";
  const boton = {
    backgroundColor: isDark ? "#ffffff1a" : "#ffffffb7",
    borderColor: "transparent",
  };
  /** Botón neutro debajo de los puntos: neutral-200 en claro y gris oscuro en oscuro */
  const botonNeutroFondo = isDark ? "#262626" : "#E5E5E5";
  const botonNeutroTexto = isDark ? "#FFFFFF" : "#171717";

  /** Colores sobrios para Anuncio individual */
  const colorAnuncio = isDark ? "#FFFFFF" : "#171717";
  const textoBotonAnuncio = isDark ? "#101010" : "#FFFFFF";
  const colorPalomita =
    elegido === "anuncio" ? colorAnuncio : AMARILLO_PALOMITA;

  const yaEsPremium = elegido === "premium" && premiumActivo;
  const mostrarRestaurar = elegido === "premium" && !premiumActivo;
  const paddingInferior =
    insets.bottom > 0
      ? Math.max(insets.bottom - (mostrarRestaurar ? 6 : 10), 6)
      : 10;

  return (
    <View style={styles.pantalla}>
      <Animated.View
        entering={ENTRADA}
        style={[
          styles.contenido,
          {
            paddingTop: insets.top + 4,
            paddingBottom: paddingInferior,
          },
        ]}
      >
        {/* Bloque superior */}
        <View style={styles.zonaSuperior}>
          <View style={styles.encabezado}>
            {/* Parte superior con altura fija para mantener fijos el botón y enlaces legales */}
            <Animated.View
              key={elegido}
              entering={FadeIn.duration(160)}
              style={styles.encabezadoArriba}
            >
              <View style={styles.icono}>
                {elegido === "premium" ? (
                  <PremiumBadge size={164} />
                ) : (
                  <IconoAnuncio size={104} color={colorAnuncio} />
                )}
              </View>
              <Text
                accessibilityRole="header"
                style={[styles.titulo, { color: texto }]}
              >
                {plan.titulo}
              </Text>
              <View style={styles.puntos}>
                {plan.puntos.map((punto) => (
                  <View key={punto} style={styles.punto}>
                    <View style={styles.puntoIcono}>
                      <IconoPalomita color={colorPalomita} />
                    </View>
                    <Text style={[styles.puntoTexto, { color: texto }]}>
                      {punto}
                    </Text>
                  </View>
                ))}
              </View>
            </Animated.View>

            {/* Botón neutro y enlaces legales: posición vertical fija */}
            <View style={styles.encabezadoAbajo}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={plan.accionSecundaria}
                onPress={() => showComingSoonAlert(plan.accionSecundaria)}
                scaleTo={0.97}
                style={[
                  styles.botonNeutro,
                  { backgroundColor: botonNeutroFondo },
                ]}
              >
                <Text
                  style={[styles.botonNeutroTexto, { color: botonNeutroTexto }]}
                >
                  {plan.accionSecundaria}
                </Text>
              </PressableScale>
              <View style={styles.legales}>
                <Text
                  onPress={() => showComingSoonAlert("Política de privacidad")}
                  style={styles.legalLink}
                >
                  Política de privacidad
                </Text>
                <Text
                  onPress={() => showComingSoonAlert("Términos y condiciones")}
                  style={styles.legalLink}
                >
                  Términos y condiciones
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bloque inferior pegado al pie: espacio lateral de 15 */}
        <View style={styles.zonaInferior}>
          <View style={styles.opciones}>
            {(Object.keys(PLANES) as PlanId[]).map((id) => {
              const opcion = PLANES[id];
              const activa = id === elegido;
              const esPremiumCard = id === "premium";

              const fondoTarjeta = activa
                ? esPremiumCard
                  ? isDark
                    ? "#0785ff26"
                    : "#0785ff14"
                  : isDark
                    ? "#ffffff1c"
                    : "#0000000d"
                : superficie;

              const bordeTarjeta = activa
                ? esPremiumCard
                  ? AZUL
                  : colorAnuncio
                : borde;

              return (
                <PressableScale
                  key={id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: activa }}
                  accessibilityLabel={`${opcion.nombre}, ${opcion.precio} ${opcion.unidad}`}
                  onPress={() => setElegido(id)}
                  scaleTo={0.97}
                  style={[
                    styles.opcion,
                    {
                      backgroundColor: fondoTarjeta,
                      borderColor: bordeTarjeta,
                    },
                  ]}
                >
                  {esPremiumCard ? (
                    <View style={styles.etiqueta}>
                      <Text style={styles.etiquetaTexto}>MEJOR VALOR</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.opcionNombre, { color: texto }]}>
                    {opcion.nombre}
                  </Text>
                  <Text style={[styles.opcionPrecio, { color: texto }]}>
                    {opcion.precio}
                    <Text style={[styles.opcionUnidad, { color: suave }]}>
                      {` ${opcion.unidad}`}
                    </Text>
                  </Text>
                </PressableScale>
              );
            })}
          </View>

          <View style={styles.botones}>
            {yaEsPremium ? (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Reactivar membresía"
                onPress={() => showComingSoonAlert("Reactivar membresía")}
                scaleTo={0.97}
                style={[
                  styles.cta,
                  styles.ctaSecundario,
                  { borderColor: AZUL },
                ]}
              >
                <Text style={[styles.ctaTexto, { color: AZUL }]}>
                  Reactivar membresía
                </Text>
              </PressableScale>
            ) : elegido === "premium" ? (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={plan.accion}
                onPress={() => showComingSoonAlert(plan.accion)}
                scaleTo={0.97}
                style={styles.cta}
              >
                <LinearGradient
                  colors={GRADIENTE_AZUL}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
                <Text style={styles.ctaTexto}>{plan.accion}</Text>
              </PressableScale>
            ) : (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel={plan.accion}
                onPress={() => showComingSoonAlert(plan.accion)}
                scaleTo={0.97}
                style={[styles.cta, { backgroundColor: colorAnuncio }]}
              >
                <Text style={[styles.ctaTexto, { color: textoBotonAnuncio }]}>
                  {plan.accion}
                </Text>
              </PressableScale>
            )}
          </View>

          {mostrarRestaurar ? (
            <Text
              onPress={() => showComingSoonAlert("Restaurar compra")}
              style={[styles.restaurar, { color: suave }]}
            >
              ¿Ya lo tienes?{" "}
              <Text style={[styles.restaurar, { color: AZUL }]}>
                Restaurar compra
              </Text>
            </Text>
          ) : null}
        </View>
      </Animated.View>

      {/* Barra flotante sin fondo */}
      <View style={[styles.barra, { top: insets.top + 8 }]}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={back}
          scaleTo={0.92}
          style={[styles.botonBarra, boton]}
        >
          <View style={{ transform: [{ translateX: -1.5 }] }}>
            <BackArrowIcon size={26} color={texto} />
          </View>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Pantalla completa sin scroll
  pantalla: { flex: 1 },
  // Barra flotante con el botón de volver
  barra: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 52,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  // Botón redondo de volver
  botonBarra: {
    width: 45,
    height: 45,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  // Contenedor principal repartido en toda la pantalla
  contenido: {
    flex: 1,
    justifyContent: "space-between",
  },
  // Área superior alineada hacia arriba
  zonaSuperior: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 62,
  },
  // Encabezado del plan
  encabezado: {
    width: "100%",
    alignItems: "center",
  },
  // Contenido de arriba con altura fija para que el botón neutro no salte entre planes
  encabezadoArriba: {
    width: "100%",
    height: 365,
    alignItems: "center",
    paddingHorizontal: 15,
  },
  // Contenido inferior del bloque superior con margen lateral de 15
  encabezadoAbajo: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 15,
  },
  // Icono grande de arriba
  icono: {
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  // Título del plan
  titulo: {
    marginTop: -5,
    textAlign: "center",
    fontFamily: "Inter_500Medium",
    fontSize: 29,
    lineHeight: 34,
    letterSpacing: -0.4,
  },
  // Lista de palomitas centrada
  puntos: {
    marginTop: 14,
    gap: 8.5,
    alignSelf: "center",
    maxWidth: "92%",
  },
  // Una palomita con su texto
  punto: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  puntoIcono: { flexShrink: 0, marginTop: 1 },
  puntoTexto: {
    flexShrink: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 19,
  },
  // Botón neutro largo debajo de las palomitas
  botonNeutro: {
    marginTop: 17,
    width: "100%",
    height: 54,
    borderRadius: 9999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  botonNeutroTexto: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  // Enlaces legales debajo del botón neutro
  legales: {
    marginTop: 13.5,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 20,
  },
  legalLink: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: AZUL,
  },
  // Área inferior anclada abajo sin espacio sobrante al pie (margen lateral de 15)
  zonaInferior: {
    paddingHorizontal: 15,
    justifyContent: "flex-end",
    gap: 11,
  },
  // Fila de las dos tarjetas (anuncio y Premium)
  opciones: {
    flexDirection: "row",
    gap: 10,
  },
  // Tarjeta de cada opción
  opcion: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 8,
  },
  // Pastilla "MEJOR VALOR" sobre la tarjeta de Premium
  etiqueta: {
    position: "absolute",
    top: -10,
    left: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    shadowColor: "#263B62",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  etiquetaTexto: {
    fontFamily: "Inter_700Bold",
    fontSize: 9,
    letterSpacing: 0.4,
    color: AZUL,
  },
  opcionNombre: { fontFamily: "Inter_500Medium", fontSize: 14 },
  opcionPrecio: { fontFamily: "Inter_700Bold", fontSize: 19 },
  opcionUnidad: { fontFamily: "Inter_400Regular", fontSize: 11.5 },
  // Columna de botones
  botones: { gap: 10 },
  // Botón principal
  cta: {
    height: 58,
    borderRadius: 9999,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaSecundario: { borderWidth: 1.5 },
  ctaTexto: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#FFFFFF" },
  // Enlace "¿Ya lo tienes? Restaurar compra"
  restaurar: {
    marginTop: -2,
    marginBottom: 2,
    textAlign: "center",
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
});
