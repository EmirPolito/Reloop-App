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
  type ReactNode,
} from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { Easing, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import { PressableScale } from "@/components/PressableScale";
import { NavigationIcon } from "@/components/iconos";
import {
  CON_DESENFOQUE,
  fondoCristalVisto,
} from "@/features/busqueda/components/PildoraCristal";
import type { Tab } from "@/features/navigation/routes";
import {
  IconoChatLinea,
  IconoFavoritoLinea,
  IconoInicioLinea,
  IconoPerfil,
  IconoPerfilLinea,
} from "@/features/perfil/Perfiliconos";
import type { IconName } from "@/features/shared/constants";
import {
  ALTO_CAPSULA,
  MenuCrear,
  createStyles,
  type NavegacionProps,
} from "./Navegacion";

// Sus tipos son de una versión anterior de React (componente de clase): mismo componente, tipado
const MaskedView =
  MaskedViewOriginal as unknown as ComponentType<MaskedViewProps>;

/** Azul de los detalles: el icono activo y el botón de crear (brillante, en dos tonos) */
const AZUL = "#1A7DDE";
const AZUL_TONOS: [string, string] = ["#3AA8F5", "#1468D6"];

/** Lado de cada círculo y separación entre ellos */
const LADO = 56;
const SEPARACION = 10;
const TAMANO_ICONO = 23;
const MARGEN_LADOS = 16;
/** La neblina de abajo: sube por encima de los círculos y se desvanece hacia arriba */
const SOBRE_CIRCULOS = 44;
/** Intensidad del desenfoque donde es más fuerte (abajo, en la orilla de la pantalla) */
const INTENSIDAD_DESENFOQUE = 22;
/** El velo: muy blanco abajo y apenas baja hasta donde empiezan los círculos */
const OPACIDAD_ABAJO = 0.98;
const OPACIDAD_CIRCULOS = 0.9;
const CAPAS_VELO = 18;

const MENU_ABRIR = { duration: 180, easing: Easing.bezier(0.22, 1, 0.36, 1) };
const MENU_CERRAR = { duration: 110, easing: Easing.out(Easing.cubic) };

interface Pestana {
  id: Tab;
  label: string;
  icon: IconName;
  /** Icono de línea para cuando no está activa */
  Linea: typeof IconoInicioLinea;
}

const PESTANAS: Record<Exclude<Tab, "create">, Pestana> = {
  home: { id: "home", label: "Inicio", icon: "home", Linea: IconoInicioLinea },
  favorites: {
    id: "favorites",
    label: "Favoritos",
    icon: "favorite",
    Linea: IconoFavoritoLinea,
  },
  chats: { id: "chats", label: "Chats", icon: "chat", Linea: IconoChatLinea },
  profile: {
    id: "profile",
    label: "Perfil",
    icon: "person",
    Linea: IconoPerfilLinea,
  },
};

/**
 * Velo del color de fondo al revés que el del inicio: nada arriba, se va haciendo blanco hacia
 * abajo y desde los círculos (`inicio`, fracción del alto) queda casi sólido hasta la orilla.
 * Curva que arranca y termina despacio: sin escalones ni final recto.
 */
function veloAlReves(rgb: string, inicio: number) {
  const colores: string[] = [];
  const posiciones: number[] = [];
  const curva = (t: number) => t * t * (3 - 2 * t);
  for (let i = 0; i <= CAPAS_VELO; i++) {
    const t = i / CAPAS_VELO;
    colores.push(`rgba(${rgb},${(OPACIDAD_CIRCULOS * curva(t)).toFixed(3)})`);
    posiciones.push(inicio * t);
  }
  for (let i = 1; i <= CAPAS_VELO; i++) {
    const t = i / CAPAS_VELO;
    const opacidad =
      OPACIDAD_CIRCULOS + (OPACIDAD_ABAJO - OPACIDAD_CIRCULOS) * curva(t);
    colores.push(`rgba(${rgb},${opacidad.toFixed(3)})`);
    posiciones.push(inicio + (1 - inicio) * t);
  }
  return {
    colores: colores as unknown as readonly [string, string, ...string[]],
    posiciones: posiciones as unknown as readonly [number, number, ...number[]],
  };
}

/** Un círculo de cristal blanco (el de los buscadores) con su sombra */
function Circulo({
  isDark,
  children,
}: {
  isDark: boolean;
  children: ReactNode;
}) {
  return (
    <View style={styles.circuloSombra}>
      <View
        style={[styles.circulo, { backgroundColor: fondoCristalVisto(isDark) }]}
      >
        {CON_DESENFOQUE ? (
          <BlurView
            intensity={30}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ) : null}
        {children}
      </View>
    </View>
  );
}

/** Una pestaña en su círculo: el icono relleno y azul si está activa, de línea si no */
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
  return (
    <PressableScale
      accessibilityRole="tab"
      accessibilityState={{ selected: activa }}
      accessibilityLabel={pestana.label}
      onPress={() => onPress(pestana.id)}
      scaleTo={0.92}
    >
      <Circulo isDark={isDark}>
        <View style={styles.icono}>
          {!activa ? (
            <Linea size={TAMANO_ICONO} color={isDark ? "#E4E4E7" : "#101010"} />
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
      </Circulo>
    </PressableScale>
  );
});

/**
 * Barra de navegación de círculos sueltos, sin tarjeta: a la izquierda Inicio, Favoritos, el
 * botón azul de crear y Chats, y a la derecha Perfil, cada uno en su círculo de cristal con
 * sombra. Detrás, la neblina del inicio pero al revés: abajo muy blanca (con el contenido
 * borroso detrás) y hacia arriba más clara hasta desaparecer un poco encima de los círculos.
 * Las barras anteriores siguen en `NavegacionFlotante.tsx`, `NavegacionDock.tsx` y
 * `Navegacion.tsx`.
 */
function NavegacionCirculosBase({
  activeTab,
  onNavigate,
  isDark = false,
  hasUnreadChats = false,
}: NavegacionProps) {
  const insets = useSafeAreaInsets();
  const abajo = Platform.OS === "web" ? 16 : Math.max(insets.bottom - 6, 10);
  const altoNeblina = abajo + LADO + SOBRE_CIRCULOS;
  const estilosMenu = useMemo(() => createStyles(isDark), [isDark]);
  const velo = useMemo(
    () =>
      veloAlReves(
        isDark ? "22,22,22" : "252,252,252",
        SOBRE_CIRCULOS / altoNeblina,
      ),
    [isDark, altoNeblina],
  );

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

  const pestana = (id: Exclude<Tab, "create">) => (
    <BotonPestana
      key={id}
      pestana={PESTANAS[id]}
      activa={activeTab === id}
      conPunto={id === "chats" && hasUnreadChats}
      isDark={isDark}
      onPress={irAPestana}
    />
  );

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {/* Neblina de abajo: el contenido se ve borroso y se cubre de blanco hacia la orilla */}
      <View
        pointerEvents="none"
        style={[styles.neblina, { height: altoNeblina }]}
      >
        {CON_DESENFOQUE ? (
          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={
              <LinearGradient
                colors={["rgba(0,0,0,0)", "#000000", "#000000"]}
                locations={[0, SOBRE_CIRCULOS / altoNeblina, 1]}
                style={StyleSheet.absoluteFill}
              />
            }
          >
            <BlurView
              intensity={INTENSIDAD_DESENFOQUE}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          </MaskedView>
        ) : null}
        <LinearGradient
          colors={velo.colores}
          locations={velo.posiciones}
          style={StyleSheet.absoluteFill}
        />
      </View>

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
        // El menú se coloca a `bottom + ALTO_CAPSULA + 10`: queda sobre los círculos
        bottom={abajo + LADO - ALTO_CAPSULA}
        onAnuncio={cerrarMenu}
        onPublicacion={crearPublicacion}
        styles={estilosMenu}
      />

      <View
        accessibilityRole="tablist"
        pointerEvents="box-none"
        style={[styles.fila, { bottom: abajo }]}
      >
        <View pointerEvents="box-none" style={styles.grupo}>
          {pestana("home")}
          {pestana("favorites")}
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
              style={styles.circulo}
            >
              {/* Reflejo: la mitad de arriba un poco más clara, como pieza pulida */}
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0)"]}
                style={styles.reflejo}
              />
              <NavigationIcon name="add" size={28} color="#FFFFFF" />
            </LinearGradient>
          </PressableScale>
          {pestana("chats")}
        </View>
        {pestana("profile")}
      </View>
    </View>
  );
}

export const NavegacionCirculos = memo(NavegacionCirculosBase);

const styles = StyleSheet.create({
  // De la orilla de abajo hasta un poco encima de los círculos
  neblina: { position: "absolute", left: 0, right: 0, bottom: 0 },
  fila: {
    position: "absolute",
    left: MARGEN_LADOS,
    right: MARGEN_LADOS,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  grupo: { flexDirection: "row", alignItems: "center", gap: SEPARACION },
  circuloSombra: {
    borderRadius: LADO / 2,
    boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
  },
  circulo: {
    width: LADO,
    height: LADO,
    borderRadius: LADO / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  icono: {
    width: TAMANO_ICONO,
    height: TAMANO_ICONO,
    alignItems: "center",
    justifyContent: "center",
  },
  // Punto de chats sin leer
  punto: {
    position: "absolute",
    top: -1,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3366",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  crearSombra: {
    borderRadius: LADO / 2,
    boxShadow: "0 6px 16px rgba(20, 104, 214, 0.35)",
  },
  reflejo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: LADO / 2,
  },
});
