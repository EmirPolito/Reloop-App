import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useRef, useState, type ComponentRef } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeInUp, FadeOut } from "react-native-reanimated";

import {
  useMarketplaceActions,
  useMarketplaceState,
} from "@/features/marketplace/MarketplaceProvider";
import {
  UNIVERSIDADES,
  universidadPorId,
} from "@/features/marketplace/universidades";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";

/** Igual al del botón de notificaciones */
const LADO_BOTON = 45;
const ANCHO_MENU = 292;
const SEPARACION = 8;
const MARGEN_PANTALLA = 16;

interface Posicion {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Botón de universidad del inicio: un círculo con su logo (o sus siglas de 3 letras si no hay
 * logo), del tamaño del de notificaciones. Al tocarlo se despliega un menú que
 * se despliega debajo con las universidades. Elegir una cambia las publicaciones del inicio a
 * las de esa universidad. Las universidades son de ejemplo por ahora.
 */
export function SelectorUniversidad() {
  const { isDark } = useAppTheme();
  const { universidad } = useMarketplaceState();
  const { setUniversidad } = useMarketplaceActions();
  const { width: anchoVentana } = useWindowDimensions();
  const boton = useRef<ComponentRef<typeof Pressable>>(null);
  const [posicion, setPosicion] = useState<Posicion | null>(null);
  const actual = universidadPorId(universidad);

  const abrir = () =>
    boton.current?.measureInWindow((x, y, width, height) =>
      setPosicion({ x, y, width, height }),
    );
  const cerrar = () => setPosicion(null);

  const colorTexto = isDark ? "#F1F5F9" : "#101010";
  const colorSuave = isDark ? "#94A3B8" : "#7A7D88";

  // El menú se centra bajo el botón sin salirse de la pantalla
  const izquierda = posicion
    ? Math.min(
        Math.max(
          posicion.x + posicion.width / 2 - ANCHO_MENU / 2,
          MARGEN_PANTALLA,
        ),
        anchoVentana - ANCHO_MENU - MARGEN_PANTALLA,
      )
    : 0;

  return (
    <>
      <Pressable
        ref={boton}
        collapsable={false}
        accessibilityRole="button"
        accessibilityLabel={`Universidad: ${actual.sigla}. Cambiar`}
        accessibilityState={{ expanded: posicion !== null }}
        onPress={abrir}
        // Mismo círculo que el de la campana: mismo tamaño, fondo y borde
        style={[
          estilos.boton,
          {
            backgroundColor: isDark ? "#ffffff1f" : "#ffffff6d",
            borderColor: isDark ? "#ffffff2e" : "#ffffff5b",
          },
        ]}
      >
        {actual.logo ? (
          <Image
            source={actual.logo}
            contentFit="contain"
            style={estilos.logo}
          />
        ) : (
          <Text style={[estilos.sigla, { color: colorTexto }]}>
            {actual.sigla.slice(0, 3)}
          </Text>
        )}
      </Pressable>

      <Modal
        visible={posicion !== null}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={cerrar}
      >
        <Pressable
          accessibilityLabel="Cerrar menú de universidades"
          onPress={cerrar}
          style={StyleSheet.absoluteFill}
        >
          {posicion ? (
            <Animated.View
              entering={FadeInUp.duration(180)}
              exiting={FadeOut.duration(120)}
              style={[
                estilos.menu,
                {
                  top: posicion.y + posicion.height + SEPARACION,
                  left: izquierda,
                  backgroundColor: isDark
                    ? "rgba(28,32,43,0.94)"
                    : Platform.OS === "android"
                      ? "rgba(255,255,255,0.97)"
                      : "rgba(255,255,255,0.78)",
                },
              ]}
            >
              {Platform.OS !== "android" ? (
                <BlurView
                  intensity={30}
                  tint={isDark ? "dark" : "light"}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
              {/* Un toque dentro del menú no lo cierra */}
              <Pressable accessible={false}>
                <Text style={[estilos.titulo, { color: colorSuave }]}>
                  Cambiar de universidad
                </Text>
                {UNIVERSIDADES.map((u) => {
                  const elegida = u.id === universidad;
                  return (
                    <Pressable
                      key={u.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: elegida }}
                      onPress={() => {
                        setUniversidad(u.id);
                        cerrar();
                      }}
                      style={({ pressed }) => [
                        estilos.fila,
                        elegida && {
                          backgroundColor: isDark
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(16,16,16,0.06)",
                        },
                        pressed && { opacity: 0.6 },
                      ]}
                    >
                      <View
                        style={[
                          estilos.iniciales,
                          {
                            backgroundColor: elegida
                              ? "#1c77ff"
                              : isDark
                                ? "rgba(255,255,255,0.12)"
                                : "#EDEDF0",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            estilos.inicialesTexto,
                            { color: elegida ? "#FFFFFF" : colorTexto },
                          ]}
                        >
                          {u.sigla.slice(0, 3)}
                        </Text>
                      </View>
                      <View style={estilos.textos}>
                        <Text
                          numberOfLines={1}
                          style={[estilos.nombre, { color: colorTexto }]}
                        >
                          {u.sigla}
                        </Text>
                        <Text
                          numberOfLines={1}
                          style={[estilos.descripcion, { color: colorSuave }]}
                        >
                          {u.nombre}
                        </Text>
                      </View>
                      {elegida ? (
                        <Ionicons name="checkmark" size={18} color="#1c77ff" />
                      ) : null}
                    </Pressable>
                  );
                })}
              </Pressable>
            </Animated.View>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}

const estilos = StyleSheet.create({
  // Círculo del tamaño del botón de notificaciones, solo con el logo (o las 3 letras)
  boton: {
    width: LADO_BOTON,
    height: LADO_BOTON,
    borderRadius: LADO_BOTON / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 26, height: 26 },
  sigla: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  menu: {
    position: "absolute",
    width: ANCHO_MENU,
    borderRadius: 24,
    padding: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  titulo: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 8,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  iniciales: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  inicialesTexto: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  textos: { flex: 1, minWidth: 0 },
  nombre: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  descripcion: { fontFamily: "Inter_400Regular", fontSize: 12 },
});
