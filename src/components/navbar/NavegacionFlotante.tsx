import MaskedViewOriginal, {
  type MaskedViewProps,
} from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";

import { PressableScale } from "@/components/PressableScale";
import { NavigationIcon } from "@/components/iconos";
import type { Tab } from "@/features/navigation/rutas";
import {
  IconoChatLinea,
  IconoFavoritoLinea,
  IconoInicioLinea,
  IconoPerfil,
  IconoPerfilLinea,
} from "@/features/perfil/iconosPerfil";
import type { IconName } from "@/features/shared/constants";
import { MenuCrear } from "./3-menu-crear";
import { ALTO_CAPSULA, crearEstilos } from "./estilos";
import type { NavegacionProps } from "./Navegacion";

// Sus tipos son de una versión anterior de React (componente de clase): mismo componente, tipado
const MaskedView =
  MaskedViewOriginal as unknown as ComponentType<MaskedViewProps>;

/**
 * Tinte del vidrio: el del encabezado de la conversación en chats (`CabeceraConversacion`), más
 * blanco en claro
 */
function tinteVidrio(isDark: boolean) {
  return Platform.OS === "ios"
    ? isDark
      ? "#16161666"
      : "#ffffffff"
    : isDark
      ? "#161616cc"
      : "#f6f6f6ae";
}

const AZUL = "#00a5f8ff";
const AZUL_TONOS: [string, string] = ["#00aafe", "#00aafe"];

/** Dimensiones compactas para mantenerla bien abajo */
const ALTO_BARRA = 54;
const CURVA_ALTO = 14;
const LADO_PESTANA = 44;
const TAMANO_ICONO = 21;
const LADO_CREAR = 58;

const MENU_ABRIR = { duration: 180, easing: Easing.bezier(0.22, 1, 0.36, 1) };
const MENU_CERRAR = { duration: 110, easing: Easing.out(Easing.cubic) };

interface Pestana {
  id: Tab;
  label: string;
  icon: IconName;
  Linea: typeof IconoInicioLinea;
}

const IZQUIERDA: Pestana[] = [
  { id: "home", label: "Inicio", icon: "home", Linea: IconoInicioLinea },
  {
    id: "favorites",
    label: "Favoritos",
    icon: "favorite",
    Linea: IconoFavoritoLinea,
  },
];

const DERECHA: Pestana[] = [
  { id: "chats", label: "Chats", icon: "chat", Linea: IconoChatLinea },
  { id: "profile", label: "Perfil", icon: "person", Linea: IconoPerfilLinea },
];

const BotonPestana = memo(function BotonPestana({
  pestana,
  activa,
  conPunto,
  isDark,
  onPress,
}: {
  pestana: Pestana;
  activa: boolean;
  conPunto: boolean;
  isDark: boolean;
  onPress: (tab: Tab) => void;
}) {
  const { Linea } = pestana;
  const colorInactivo = isDark ? "#E4E4E7" : "#2D2A26";

  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityState={{ selected: activa }}
      accessibilityLabel={pestana.label}
      onPress={() => onPress(pestana.id)}
      scaleTo={0.92}
      hitSlop={4}
      style={styles.pestana}
    >
      <View style={styles.icono}>
        {!activa ? (
          <Linea size={TAMANO_ICONO} color={colorInactivo} />
        ) : pestana.id === "profile" ? (
          <IconoPerfil size={TAMANO_ICONO} color={AZUL} />
        ) : (
          <NavigationIcon
            name={pestana.icon}
            selected
            size={TAMANO_ICONO}
            color={AZUL}
          />
        )}
        {conPunto ? <View style={styles.punto} /> : null}
      </View>
    </PressableScale>
  );
});

/**
 * Fondo con laterales circulares amplios (tipo arco envolvente) y una onda al centro, sin
 * borde. Su color y efecto son los del encabezado de la conversación en chats: un tinte suave
 * con un desenfoque fuerte detrás (en Android, sin blur, el tinte más fuerte), recortados con
 * la forma del SVG.
 */
function FondoCurvo({
  ancho,
  altoTotal,
  isDark,
}: {
  ancho: number;
  altoTotal: number;
  isDark: boolean;
}) {
  const cx = ancho / 2;
  const yBaseTop = CURVA_ALTO;
  const altoDisponible = altoTotal - yBaseTop;

  // Radio amplio limitado al alto disponible para formar laterales bien circulares y envolventes
  const rEsquina = Math.min(38, altoDisponible * 0.68);
  const anchoJoroba = 58;

  const d = [
    // Empieza en el borde izquierdo con caída circular amplia
    `M 0 ${yBaseTop + rEsquina}`,
    `C 0 ${yBaseTop + rEsquina * 0.35}, ${rEsquina * 0.35} ${yBaseTop}, ${rEsquina} ${yBaseTop}`,
    `L ${cx - anchoJoroba} ${yBaseTop}`,
    // Onda central suave
    `C ${cx - anchoJoroba * 0.48} ${yBaseTop}, ${cx - anchoJoroba * 0.36} 0, ${cx} 0`,
    `C ${cx + anchoJoroba * 0.36} 0, ${cx + anchoJoroba * 0.48} ${yBaseTop}, ${cx + anchoJoroba} ${yBaseTop}`,
    `L ${ancho - rEsquina} ${yBaseTop}`,
    // Esquina derecha con la misma curva circular amplia
    `C ${ancho - rEsquina * 0.35} ${yBaseTop}, ${ancho} ${yBaseTop + rEsquina * 0.35}, ${ancho} ${yBaseTop + rEsquina}`,
    `L ${ancho} ${altoTotal}`,
    `L 0 ${altoTotal}`,
    "Z",
  ].join(" ");

  return (
    <MaskedView
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      maskElement={
        <Svg width={ancho} height={altoTotal}>
          <Path d={d} fill="#000000" />
        </Svg>
      }
    >
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: tinteVidrio(isDark) },
        ]}
      />
      {Platform.OS === "ios" ? (
        <BlurView
          intensity={isDark ? 40 : 70}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </MaskedView>
  );
}

function NavegacionAncladaBase({
  activeTab,
  onNavigate,
  isDark = false,
  hasUnreadChats = false,
}: NavegacionProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const bottomInset =
    Platform.OS === "ios" ? Math.max(insets.bottom - 12, 4) : 4;
  const altoTotal = ALTO_BARRA + CURVA_ALTO + bottomInset;
  const estilosMenu = useMemo(() => crearEstilos(isDark), [isDark]);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menu = useSharedValue(0);

  const abrirMenu = useCallback(() => {
    setMenuAbierto(true);
    setMenuVisible(true);
    menu.set(withTiming(1, MENU_ABRIR));
  }, [menu]);

  const cerrarMenu = useCallback(() => {
    setMenuAbierto(false);
    menu.set(
      withTiming(0, MENU_CERRAR, (finished) => {
        if (finished) scheduleOnRN(setMenuVisible, false);
      }),
    );
  }, [menu]);

  useEffect(() => {
    if (!menuVisible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      cerrarMenu();
      return true;
    });
    return () => sub.remove();
  }, [menuVisible, cerrarMenu]);

  const irAPestana = useCallback(
    (tab: Tab) => {
      if (menuAbierto) cerrarMenu();
      if (tab !== activeTab) onNavigate(tab);
    },
    [activeTab, cerrarMenu, menuAbierto, onNavigate],
  );

  const crearPublicacion = useCallback(() => {
    cerrarMenu();
    requestAnimationFrame(() => onNavigate("create"));
  }, [cerrarMenu, onNavigate]);

  const pestana = (p: Pestana) => (
    <BotonPestana
      key={p.id}
      pestana={p}
      activa={activeTab === p.id}
      conPunto={p.id === "chats" && hasUnreadChats}
      isDark={isDark}
      onPress={irAPestana}
    />
  );

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {menuVisible ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar menú"
          onPress={cerrarMenu}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      <MenuCrear
        visible={menuVisible}
        menu={menu}
        isDark={isDark}
        bottom={altoTotal - ALTO_CAPSULA + 8}
        onAnuncio={cerrarMenu}
        onPublicacion={crearPublicacion}
        styles={estilosMenu}
      />

      <View
        pointerEvents="box-none"
        style={[
          styles.contenedor,
          {
            height: altoTotal,
            paddingBottom: bottomInset,
          },
        ]}
      >
        <FondoCurvo ancho={width} altoTotal={altoTotal} isDark={isDark} />

        <View
          accessibilityRole="tablist"
          pointerEvents="box-none"
          style={styles.fila}
        >
          {IZQUIERDA.map(pestana)}

          <PressableScale
            accessibilityRole="button"
            accessibilityState={{
              selected: menuAbierto || activeTab === "create",
            }}
            accessibilityLabel="Publicar producto"
            onPress={menuAbierto ? cerrarMenu : abrirMenu}
            scaleTo={0.92}
            style={styles.crearSombra}
          >
            <LinearGradient
              colors={AZUL_TONOS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.crear}
            >
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0)"]}
                style={styles.reflejoCrear}
              />
              <NavigationIcon name="add" size={26} color="#FFFFFF" />
            </LinearGradient>
          </PressableScale>

          {DERECHA.map(pestana)}
        </View>
      </View>
    </View>
  );
}

export const NavegacionFlotante = memo(NavegacionAncladaBase);

const styles = StyleSheet.create({
  contenedor: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  fila: {
    flex: 1,
    marginTop: CURVA_ALTO,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 14,
  },
  pestana: {
    width: LADO_PESTANA,
    height: LADO_PESTANA,
    borderRadius: LADO_PESTANA / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  icono: {
    width: TAMANO_ICONO,
    height: TAMANO_ICONO,
    alignItems: "center",
    justifyContent: "center",
  },
  punto: {
    position: "absolute",
    top: -1,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3366",
    borderWidth: 1.5,
    borderColor: "#FFFDF9",
  },
  crearSombra: {
    marginTop: -CURVA_ALTO - 2,
    borderRadius: LADO_CREAR / 2,
    boxShadow: "0 4px 12px rgba(20, 104, 214, 0.28)",
  },
  crear: {
    width: LADO_CREAR,
    height: LADO_CREAR,
    borderRadius: LADO_CREAR / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  reflejoCrear: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: LADO_CREAR / 2,
  },
});
