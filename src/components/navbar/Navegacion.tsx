import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnRN } from "react-native-worklets";

import type { Tab } from "@/features/navigation/rutas";
import { useLatestRef } from "@/hooks/useLatestRef";
import {
  BotonPestana,
  PESTANAS,
  TOTAL_PESTANAS,
  ULTIMA_PESTANA,
} from "./1-pestanas";
import { BotonCrear } from "./2-crear";
import { MenuCrear } from "./3-menu-crear";
import {
  APARECER,
  CURVA_SEDOSA,
  MARGEN_CAPSULA,
  MENU_ABRIR,
  MENU_CERRAR,
  TIMING_PILDORA,
  crearEstilos,
} from "./estilos";
import { SuperficieCristal } from "./SuperficieCristal";

export interface NavegacionProps {
  activeTab: Tab | null;
  onNavigate: (tab: Tab) => void;
  isDark?: boolean;
  hasUnreadChats?: boolean;
  onOpenNotifications?: () => void;
  notificacionesActivas?: boolean;
  unreadNotifications?: number;
}

/** Espera antes de cambiar de pantalla: la píldora arranca su animación sin tirones */
const RETRASO_NAVEGAR = 45;

/**
 * El nav de abajo (ver `README.md`): la cápsula de cristal con las pestañas y una píldora que
 * marca la activa, y a su derecha el botón de crear con su menú. La píldora se puede arrastrar
 * entre pestañas; al soltarla, navega a la pestaña donde quedó.
 */
function NavegacionBase({
  activeTab,
  onNavigate,
  isDark = false,
  hasUnreadChats = false,
}: NavegacionProps) {
  const styles = useMemo(() => crearEstilos(isDark), [isDark]);
  const insets = useSafeAreaInsets();
  const bottomInset =
    Platform.OS === "web" ? 16 : Math.max(insets.bottom - 12, 8);

  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  // La pestaña tocada se marca antes de que la ruta cambie; se olvida al llegar
  const [pendingTab, setPendingTab] = useState<Tab | null>(null);
  const menu = useSharedValue(0);

  const [tabPrevia, setTabPrevia] = useState(activeTab);
  if (tabPrevia !== activeTab) {
    setTabPrevia(activeTab);
    setPendingTab(null);
  }

  const tabEfectivo = pendingTab ?? activeTab;
  const indiceTab = PESTANAS.findIndex((tab) => tab.id === tabEfectivo);
  const crearActivo = menuAbierto || tabEfectivo === "create";
  // -1: ninguna pestaña de la cápsula (la píldora se oculta)
  const huecoActivo = crearActivo ? -1 : indiceTab;

  const huecoAnterior = useRef(huecoActivo);
  // La navegación pedida: se hace un momento después (ver `navegarDesacoplado`)
  const [salto, setSalto] = useState<{ tab: Tab } | null>(null);
  const navegarRef = useLatestRef(onNavigate);

  // La píldora: dónde está, a dónde va, si se ve y si se está arrastrando
  const posicion = useSharedValue(Math.max(huecoActivo, 0));
  const destino = useSharedValue(Math.max(huecoActivo, 0));
  const indicadorVisible = useSharedValue(huecoActivo >= 0 ? 1 : 0);
  const arrastrando = useSharedValue(0);
  const inicioArrastre = useSharedValue(0);
  const anchoHueco = useSharedValue(0);
  const [anchoPildora, setAnchoPildora] = useState(0);
  const presionado = useSharedValue(-1);

  /** Mueve la píldora de forma continua y sedosa hacia el objetivo */
  const moverSuave = useCallback(
    (objetivo: number, desdeVisible: boolean) => {
      cancelAnimation(posicion);
      destino.set(objetivo);

      if (!desdeVisible) {
        posicion.set(objetivo);
      } else {
        posicion.set(withTiming(objetivo, TIMING_PILDORA));
      }
      indicadorVisible.set(withTiming(1, APARECER));
    },
    [posicion, destino, indicadorVisible],
  );

  useEffect(() => {
    if (huecoActivo >= 0) {
      if (huecoAnterior.current !== huecoActivo) {
        moverSuave(huecoActivo, huecoAnterior.current >= 0);
      }
    } else {
      indicadorVisible.set(withTiming(0, APARECER));
    }
    huecoAnterior.current = huecoActivo;
  }, [huecoActivo, moverSuave, indicadorVisible]);

  const abrirMenu = useCallback(() => {
    setPendingTab(null);
    setMenuAbierto(true);
    setMenuVisible(true);
    cancelAnimation(menu);
    menu.set(withTiming(1, MENU_ABRIR));
  }, [menu]);

  const cerrarMenu = useCallback(() => {
    setMenuAbierto(false);
    cancelAnimation(menu);
    menu.set(
      withTiming(0, MENU_CERRAR, (finished) => {
        if (finished) {
          scheduleOnRN(setMenuVisible, false);
        }
      }),
    );
  }, [menu]);

  // En Android, el botón de atrás cierra el menú
  useEffect(() => {
    if (!menuVisible) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      cerrarMenu();
      return true;
    });
    return () => sub.remove();
  }, [menuVisible, cerrarMenu]);

  const medirCapsula = useCallback(
    (e: LayoutChangeEvent) => {
      const nuevoAncho =
        (e.nativeEvent.layout.width - MARGEN_CAPSULA * 2) / TOTAL_PESTANAS;
      if (nuevoAncho > 0 && nuevoAncho !== anchoHueco.get()) {
        anchoHueco.set(nuevoAncho);
        setAnchoPildora(nuevoAncho);
      }
    },
    [anchoHueco],
  );

  /**
   * Desacopla ligeramente el cambio de pantalla para que la animación nativa arranque
   * completamente libre de tirones antes de montar la nueva ruta.
   */
  const navegarDesacoplado = useCallback(
    (tabId: Tab) => setSalto({ tab: tabId }),
    [],
  );
  // Un salto nuevo cancela el anterior que aún no se hacía (igual al desmontar)
  useEffect(() => {
    if (!salto) return;
    const temporizador = setTimeout(
      () => navegarRef.current(salto.tab),
      RETRASO_NAVEGAR,
    );
    return () => clearTimeout(temporizador);
  }, [salto, navegarRef]);

  const crearPublicacion = useCallback(() => {
    setPendingTab("create");
    cerrarMenu();
    navegarDesacoplado("create");
  }, [cerrarMenu, navegarDesacoplado]);

  /** Tocar una pestaña (o soltar la píldora en ella): cierra el menú y navega si es otra */
  const irAPestana = useCallback(
    (tabId: Tab) => {
      if (menuAbierto) cerrarMenu();
      if (tabId !== activeTab) {
        setPendingTab(tabId);
        navegarDesacoplado(tabId);
      } else {
        setPendingTab(null);
      }
    },
    [activeTab, cerrarMenu, menuAbierto, navegarDesacoplado],
  );
  const irAHueco = useCallback(
    (hueco: number) => {
      const tab = PESTANAS[hueco];
      if (tab) irAPestana(tab.id);
    },
    [irAPestana],
  );

  const alternarMenu = useCallback(() => {
    if (menuAbierto) {
      cerrarMenu();
    } else {
      abrirMenu();
    }
  }, [abrirMenu, cerrarMenu, menuAbierto]);

  /** Arrastrar la píldora: la sigue con resistencia en los bordes y al soltar elige un hueco */
  const arrastre = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-12, 12])
        .onStart((e) => {
          const ancho = anchoHueco.get();
          if (ancho <= 0) return;

          cancelAnimation(posicion);
          arrastrando.set(
            withTiming(1, { duration: 130, easing: CURVA_SEDOSA }),
          );

          // Sin píldora visible (en crear): aparece bajo el dedo
          if (indicadorVisible.get() < 0.5) {
            const indiceToque = Math.min(
              Math.max(Math.floor((e.x - MARGEN_CAPSULA) / ancho), 0),
              ULTIMA_PESTANA,
            );
            posicion.set(indiceToque);
            destino.set(indiceToque);
            indicadorVisible.set(withTiming(1, APARECER));
          }

          inicioArrastre.set(posicion.get());
        })
        .onUpdate((e) => {
          const ancho = anchoHueco.get();
          if (ancho <= 0) return;

          const crudo = inicioArrastre.get() + e.translationX / ancho;
          let conResistencia = crudo;
          if (crudo < 0) {
            conResistencia = crudo * 0.22;
          } else if (crudo > ULTIMA_PESTANA) {
            conResistencia = ULTIMA_PESTANA + (crudo - ULTIMA_PESTANA) * 0.22;
          }

          posicion.set(conResistencia);
          destino.set(conResistencia);
        })
        .onEnd((e) => {
          const ancho = anchoHueco.get();
          if (ancho <= 0) return;

          // Un poco de impulso: un arrastre rápido avanza al siguiente hueco
          const impulso = Math.max(Math.min(e.velocityX * 0.0001, 0.35), -0.35);
          const objetivo = Math.min(
            Math.max(Math.round(posicion.get() + impulso), 0),
            ULTIMA_PESTANA,
          );

          destino.set(objetivo);
          posicion.set(withTiming(objetivo, TIMING_PILDORA));
          arrastrando.set(
            withTiming(0, { duration: 160, easing: CURVA_SEDOSA }),
          );

          scheduleOnRN(irAHueco, objetivo);
        })
        .onFinalize(() => {
          arrastrando.set(
            withTiming(0, { duration: 160, easing: CURVA_SEDOSA }),
          );
        }),
    [
      anchoHueco,
      arrastrando,
      destino,
      irAHueco,
      indicadorVisible,
      inicioArrastre,
      posicion,
    ],
  );

  /** Toques y arrastre de la cápsula: el toque marca el hueco presionado y navega al soltar */
  const gestoCapsula = useMemo(() => {
    const huecoEn = (x: number) => {
      "worklet";
      const ancho = anchoHueco.get();
      if (ancho <= 0) return -1;
      return Math.min(
        Math.max(Math.floor((x - MARGEN_CAPSULA) / ancho), 0),
        ULTIMA_PESTANA,
      );
    };
    const toque = Gesture.Tap()
      .maxDistance(12)
      .onBegin((e) => {
        presionado.set(huecoEn(e.x));
      })
      .onEnd((e, exito) => {
        const hueco = huecoEn(e.x);
        if (exito && hueco >= 0) scheduleOnRN(irAHueco, hueco);
      })
      .onFinalize(() => {
        presionado.set(-1);
      });
    return Gesture.Race(arrastre, toque);
  }, [arrastre, anchoHueco, presionado, irAHueco]);

  /**
   * Deformación líquida automática y orgánica: se estira suavemente según la distancia
   * instantánea al destino y vuelve a 1.0 de forma continua, sin saltos.
   */
  const indicadorStyle = useAnimatedStyle(() => {
    const ancho = anchoHueco.get();
    const lift = arrastrando.get();
    const distancia = Math.min(Math.abs(destino.get() - posicion.get()), 1.5);
    const estirarFluido = distancia * 0.09;

    return {
      opacity: ancho > 0 ? indicadorVisible.get() : 0,
      transform: [
        { translateX: posicion.get() * ancho },
        { scaleX: 1 + 0.04 * lift + estirarFluido },
        { scaleY: 1 + 0.03 * lift - estirarFluido * 0.35 },
      ],
    };
  });

  return (
    <View pointerEvents="box-none" style={styles.contenedorPantalla}>
      {/* Con el menú abierto, tocar fuera lo cierra */}
      {menuVisible && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar menú"
          onPress={cerrarMenu}
          style={StyleSheet.absoluteFill}
        />
      )}

      <MenuCrear
        visible={menuVisible}
        menu={menu}
        isDark={isDark}
        bottom={bottomInset}
        onAnuncio={cerrarMenu}
        onPublicacion={crearPublicacion}
        styles={styles}
      />

      <View style={[styles.navigationRow, { bottom: bottomInset }]}>
        <GestureDetector gesture={gestoCapsula}>
          <View style={[styles.sombra, styles.capsulaSombra]}>
            <View
              accessibilityRole="tablist"
              onLayout={medirCapsula}
              style={styles.capsula}
            >
              <SuperficieCristal isDark={isDark} styles={styles} />

              <Animated.View
                pointerEvents="none"
                style={[
                  styles.indicador,
                  { width: anchoPildora },
                  indicadorStyle,
                ]}
              />

              {PESTANAS.map((tab, indice) => (
                <BotonPestana
                  key={tab.id}
                  tab={tab}
                  indice={indice}
                  selected={!menuAbierto && tabEfectivo === tab.id}
                  posicion={posicion}
                  indicadorVisible={indicadorVisible}
                  showBadge={tab.id === "chats" && hasUnreadChats}
                  isDark={isDark}
                  onPress={irAPestana}
                  presionado={presionado}
                  styles={styles}
                />
              ))}
            </View>
          </View>
        </GestureDetector>

        <BotonCrear
          selected={crearActivo}
          onPress={alternarMenu}
          isDark={isDark}
          styles={styles}
        />
      </View>
    </View>
  );
}

export const Navegacion = memo(NavegacionBase);

export default Navegacion;
