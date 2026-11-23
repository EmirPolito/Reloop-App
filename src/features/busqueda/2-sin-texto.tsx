import { useDissolve } from "dissolve-ui";
import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type RefObject,
} from "react";
import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  FadeOut,
  LinearTransition,
  type useAnimatedScrollHandler,
} from "react-native-reanimated";

import { TRANSICION_MODULO } from "@/constants/motion";
import { IconoBusqueda } from "@/features/home/components/IconosTarjeta";
import { AppIcon } from "@/features/shared/AppIcon";
import { Text } from "@/features/shared/Text";
import { GROSOR_LUPA } from "./components/PildoraCristal";
import { estilos, type ColoresBusqueda } from "./estilos";
import { IDEAS_BUSQUEDA } from "./frasesBusqueda";

/** Las recientes que quedan se acomodan suave cuando una se va */
const DURACION_ACOMODO = 420;
const ACOMODO = LinearTransition.duration(DURACION_ACOMODO).easing(
  TRANSICION_MODULO.entrada.easing,
);
/** El título de recientes se desvanece cuando se va la última */
const SALIDA_RECIENTES = FadeOut.duration(240);
/** Duración del polvo al quitar una búsqueda reciente */
const DURACION_POLVO = 1500;

/**
 * Vista del módulo sin texto: las búsquedas recientes y debajo ideas de qué buscar. Al quitar
 * una reciente se vuelve polvo y, cuando termina, las de abajo suben suave. El acomodo solo se
 * activa al quitar una: al entrar, todo aparece en su lugar sin deslizarse.
 */
export const VistaSinTexto = memo(function VistaSinTexto({
  recientes,
  colores,
  contenido,
  alHacerScroll,
  onElegirReciente,
  onElegirIdea,
  onQuitarReciente,
}: {
  recientes: string[];
  colores: ColoresBusqueda;
  contenido: StyleProp<ViewStyle>;
  alHacerScroll: ReturnType<typeof useAnimatedScrollHandler>;
  onElegirReciente: (texto: string) => void;
  onElegirIdea: (texto: string) => void;
  onQuitarReciente: (texto: string) => void;
}) {
  const [acomodando, setAcomodando] = useState(false);
  const finAcomodo = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (finAcomodo.current) clearTimeout(finAcomodo.current);
    },
    [],
  );
  const empezarQuitar = useCallback(() => {
    if (finAcomodo.current) clearTimeout(finAcomodo.current);
    setAcomodando(true);
  }, []);
  const terminarQuitar = useCallback(
    (reciente: string) => {
      onQuitarReciente(reciente);
      finAcomodo.current = setTimeout(
        () => setAcomodando(false),
        DURACION_ACOMODO + 100,
      );
    },
    [onQuitarReciente],
  );

  return (
    <Animated.ScrollView
      style={estilos.lista}
      contentContainerStyle={contenido}
      onScroll={alHacerScroll}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      {recientes.length > 0 ? (
        <Animated.View
          exiting={acomodando ? SALIDA_RECIENTES : undefined}
          layout={acomodando ? ACOMODO : undefined}
        >
          <Text style={[estilos.tituloSeccion, { color: colores.suave }]}>
            Búsquedas recientes
          </Text>
          {recientes.map((reciente) => (
            <FilaReciente
              key={reciente}
              texto={reciente}
              colores={colores}
              onElegir={onElegirReciente}
              acomodar={acomodando}
              onEmpezarQuitar={empezarQuitar}
              onQuitar={terminarQuitar}
            />
          ))}
        </Animated.View>
      ) : null}
      {/* Sube suave junto con las recientes cuando se quita una */}
      <Animated.View
        layout={acomodando ? ACOMODO : undefined}
        style={recientes.length > 0 ? estilos.seccionSiguiente : null}
      >
        <Text style={[estilos.tituloSeccion, { color: colores.suave }]}>
          Ideas para buscar
        </Text>
        {IDEAS_BUSQUEDA.map((idea) => (
          <FilaIdea
            key={idea.titulo}
            busqueda={idea.busqueda}
            titulo={idea.titulo}
            detalle={idea.detalle}
            colores={colores}
            onElegir={onElegirIdea}
          />
        ))}
      </Animated.View>
    </Animated.ScrollView>
  );
});

/** Idea de búsqueda con una línea de descripción; tocarla la escribe en el buscador */
const FilaIdea = memo(function FilaIdea({
  busqueda,
  titulo,
  detalle,
  colores,
  onElegir,
}: {
  busqueda: string;
  titulo: string;
  detalle: string;
  colores: ColoresBusqueda;
  onElegir: (texto: string) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${titulo}. ${detalle}`}
      onPress={() => onElegir(busqueda)}
      style={estilos.filaReciente}
    >
      <View style={[estilos.recienteIcono, { backgroundColor: colores.caja }]}>
        <IconoBusqueda
          size={20}
          color={colores.texto}
          grosorExtra={GROSOR_LUPA}
        />
      </View>
      <View style={estilos.ideaTextos}>
        <Text
          numberOfLines={1}
          style={[estilos.ideaTitulo, { color: colores.texto }]}
        >
          {titulo}
        </Text>
        <Text
          numberOfLines={1}
          style={[estilos.ideaDetalle, { color: colores.suave }]}
        >
          {detalle}
        </Text>
      </View>
      <AppIcon name="chevronRight" size={14} color={colores.suave} />
    </Pressable>
  );
});

/**
 * Búsqueda reciente. Al quitarla se vuelve polvo que el viento se lleva (efecto Dust de
 * dissolve-ui); cuando el polvo termina se quita de verdad y las demás suben suave. La fila
 * sigue oculta hasta que se quita, así no parpadea.
 */
const FilaReciente = memo(function FilaReciente({
  texto,
  colores,
  onElegir,
  acomodar,
  onEmpezarQuitar,
  onQuitar,
}: {
  texto: string;
  colores: ColoresBusqueda;
  onElegir: (texto: string) => void;
  /** Solo mientras se quita una: las filas se acomodan suave */
  acomodar: boolean;
  onEmpezarQuitar: () => void;
  onQuitar: (texto: string) => void;
}) {
  const { ref, dissolving, dissolve } = useDissolve();
  const [quitando, setQuitando] = useState(false);

  const quitarConPolvo = async () => {
    if (quitando) return;
    setQuitando(true);
    onEmpezarQuitar();
    try {
      const inicio = Date.now();
      await dissolve({ preset: "dust", grain: 3, duration: DURACION_POLVO });
      // dissolve() resuelve al 60 % del efecto; las demás suben hasta que el polvo termina.
      // Si resolvió de inmediato (movimiento reducido o sin captura) no hay polvo que esperar
      const transcurrido = Date.now() - inicio;
      if (transcurrido >= DURACION_POLVO * 0.5) {
        await new Promise((r) => setTimeout(r, DURACION_POLVO - transcurrido));
      }
    } catch {
      // El efecto es solo visual (en la web no puede capturar la fila): se quita igual
    }
    onQuitar(texto);
  };

  return (
    <Animated.View layout={acomodar ? ACOMODO : undefined}>
      <View
        // Los tipos de dissolve-ui declaran el ref con View como tipo, no como componente
        ref={ref as unknown as RefObject<ComponentRef<typeof View>>}
        collapsable={false}
        style={[estilos.filaReciente, { opacity: dissolving ? 0 : 1 }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Buscar ${texto}`}
          onPress={() => onElegir(texto)}
          style={estilos.recienteTexto}
        >
          <View
            style={[estilos.recienteIcono, { backgroundColor: colores.caja }]}
          >
            <IconoBusqueda
              size={20}
              color={colores.texto}
              grosorExtra={GROSOR_LUPA}
            />
          </View>
          <Text
            numberOfLines={1}
            style={[estilos.reciente, { color: colores.texto }]}
          >
            {texto}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Quitar ${texto} de las recientes`}
          hitSlop={12}
          onPress={quitarConPolvo}
          style={[estilos.quitar, { backgroundColor: colores.suave }]}
        >
          <AppIcon name="close" size={9} color="#FFFFFF" />
        </Pressable>
      </View>
    </Animated.View>
  );
});
