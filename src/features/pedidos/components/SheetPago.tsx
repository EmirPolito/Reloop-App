import { Ionicons } from "@expo/vector-icons";
import { useBottomSheetInternal } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useBottomSheetAwareHandlers } from "heroui-native";
import { useState, type ReactNode } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";

import { PressableScale } from "@/components/PressableScale";
import { EASE_OUT_CUBIC } from "@/constants/motion";
import {
  ALTO_ENCABEZADO,
  FONDO_CARD,
  HOST_SESION,
  RADIO_CARD,
  SheetEditar,
} from "@/features/perfil/editar/SheetEditar";
import { INTER } from "@/features/perfil/editar/editarTema";
import { Text, TextInput } from "@/features/shared/Text";
import { AZUL_PEDIR, coloresPedido } from "../colores";
import {
  LARGO_NOTA,
  METODOS_PAGO,
  formatearDinero,
  nombreMetodo,
  type MetodoPago,
} from "../formatoPedido";
import { MonedaIcon, TarjetaPagoIcon } from "./IconosPago";
import { OlaEnviado } from "./OlaEnviado";

const DESCRIPCION_METODO: Record<MetodoPago, string> = {
  efectivo: "Pagas al recibir tu pedido",
  transferencia: "Te mandan su tarjeta por el chat",
};
const ICONO_METODO: Record<MetodoPago, ReactNode> = {
  efectivo: <MonedaIcon size={31} />,
  transferencia: <TarjetaPagoIcon size={26} />,
};

/**
- Drawer para terminar el pedido: cómo se paga (efectivo o transferencia), la descripción
- (obligatoria) y "Enviar", que lo manda al chat con el vendedor. Ya enviado, una ola arcoíris
- nace del botón y deja ver "Pedido enviado"; al terminar llama a `onEnviado`.
 */
export function SheetPago({
  visible,
  isDark,
  total,
  enviando,
  onClose,
  onEnviar,
  onEnviado,
  onCerrado,
}: {
  visible: boolean;
  isDark: boolean;
  total: number;
  enviando: boolean;
  onClose: () => void;
  /** Manda el pedido; `true` si se mandó (entonces corre la ola) */
  onEnviar: (metodo: MetodoPago, nota: string) => Promise<boolean>;
  /** Cuando termina la ola */
  onEnviado: () => void;
  /** Cuando el drawer terminó de bajar */
  onCerrado: () => void;
}) {
  // Mientras se manda y corre la ola no se puede cerrar: siempre termina llevando al chat
  const [enviado, setEnviado] = useState(false);
  // Cada vez que se abre, el contenido se monta de nuevo (empieza sin elegir). Se queda
  // montado mientras baja: si se quitara, el drawer se encogería a medio cierre y se atoraba
  const [vez, setVez] = useState(0);
  const [abierto, setAbierto] = useState(visible);
  if (visible !== abierto) {
    setAbierto(visible);
    if (visible) {
      setVez(vez + 1);
      setEnviado(false);
    }
  }

  return (
    <SheetEditar
      visible={visible}
      titulo="Método de pago"
      isDark={isDark}
      onClose={onClose}
      onCerrado={onCerrado}
      bloqueado={enviando || enviado}
      hostName={HOST_SESION}
    >
      <Contenido
        key={vez}
        isDark={isDark}
        total={total}
        enviando={enviando}
        enviado={enviado}
        onEnviar={async (metodo, nota) => {
          if (!(await onEnviar(metodo, nota))) return;
          // La ola sale cuando ya bajó el teclado y el drawer volvió a su lugar
          await tecladoOculto();
          setEnviado(true);
        }}
        onEnviado={onEnviado}
      />
    </SheetEditar>
  );
}

/** Espera a que el teclado termine de bajar (y el drawer de acomodarse) */
function tecladoOculto(): Promise<void> {
  return new Promise((listo) => {
    if (!Keyboard.isVisible()) return listo();
    const sub = Keyboard.addListener("keyboardDidHide", () => {
      sub.remove();
      setTimeout(listo, ACOMODO);
    });
  });
}

/** Lo que tarda el drawer en volver a su lugar después del teclado */
const ACOMODO = 150;

function Contenido({
  isDark,
  total,
  enviando,
  enviado,
  onEnviar,
  onEnviado,
}: {
  isDark: boolean;
  total: number;
  enviando: boolean;
  enviado: boolean;
  onEnviar: (metodo: MetodoPago, nota: string) => Promise<void>;
  onEnviado: () => void;
}) {
  const c = coloresPedido(isDark);
  const manejadores = useBottomSheetAwareHandlers();
  // En la web no hay teclado en pantalla, y al perder el foco esos manejadores fallan
  // (usan `findNodeHandle`, que no existe en la web)
  const teclado = Platform.OS === "web" ? {} : manejadores;
  const [metodo, setMetodo] = useState<MetodoPago | null>(null);
  const [nota, setNota] = useState("");
  const listo =
    metodo !== null && nota.trim().length > 0 && !enviando && !enviado;
  // Para la ola: el tamaño del contenido y el centro de "Enviar" (ambos con el margen incluido)
  const [caja, setCaja] = useState({ ancho: 0, alto: 0 });
  const [boton, setBoton] = useState({ x: 0, y: 0 });
  // La ola cubre toda la card: sube sobre el encabezado y la línea de arrastre
  const { animatedLayoutState } = useBottomSheetInternal();
  const [arriba, setArriba] = useState(ALTO_ENCABEZADO);

  return (
    // Tocar la parte blanca quita el teclado (las opciones y el botón atienden su propio toque)
    <Pressable
      accessible={false}
      onPress={Keyboard.dismiss}
      style={styles.contenido}
      onLayout={(e) => {
        setCaja({
          ancho: e.nativeEvent.layout.width,
          alto: e.nativeEvent.layout.height,
        });
        setArriba(ALTO_ENCABEZADO + animatedLayoutState.get().handleHeight);
      }}
    >
      <View style={styles.seccion}>
        <Text style={[INTER.medium, styles.etiqueta, { color: c.suave }]}>
          Total: {formatearDinero(total)}
        </Text>
        {/* Cada opción por separado; la elegida solo se nota por la palomita */}
        <View style={styles.opciones}>
          {METODOS_PAGO.map((opcion) => {
            const elegido = metodo === opcion;
            return (
              <PressableScale
                key={opcion}
                accessibilityRole="radio"
                accessibilityState={{ checked: elegido }}
                accessibilityLabel={`${nombreMetodo(opcion)}. ${DESCRIPCION_METODO[opcion]}`}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => undefined);
                  // Si se estaba escribiendo la descripción, se quita el teclado
                  Keyboard.dismiss();
                  setMetodo(opcion);
                }}
                scaleTo={0.98}
                style={[styles.opcion, { backgroundColor: c.neutro }]}
              >
                <View style={styles.icono}>{ICONO_METODO[opcion]}</View>
                <View style={styles.opcionTexto}>
                  <Text
                    style={[
                      INTER.semibold,
                      styles.opcionTitulo,
                      { color: c.texto },
                    ]}
                  >
                    {nombreMetodo(opcion)}
                  </Text>
                  <Text
                    style={[
                      INTER.regular,
                      styles.opcionNota,
                      { color: c.suave },
                    ]}
                  >
                    {DESCRIPCION_METODO[opcion]}
                  </Text>
                </View>
                <View
                  style={[
                    styles.radio,
                    { borderColor: elegido ? AZUL_PEDIR : c.linea },
                  ]}
                >
                  {elegido ? (
                    <Animated.View
                      entering={PALOMITA}
                      style={styles.radioLleno}
                    >
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                    </Animated.View>
                  ) : null}
                </View>
              </PressableScale>
            );
          })}
        </View>
      </View>

      <View style={[styles.seccion, styles.conAire]}>
        <Text style={[INTER.medium, styles.etiqueta, { color: c.suave }]}>
          Descripción
        </Text>
        <TextInput
          {...teclado}
          accessibilityLabel="Descripción del pedido"
          value={nota}
          onChangeText={setNota}
          placeholder="Hola, voy a querer unas gomitas en el edificio B, planta baja."
          placeholderTextColor={c.suave}
          multiline
          maxLength={LARGO_NOTA}
          textAlignVertical="top"
          style={[
            INTER.regular,
            styles.nota,
            { color: c.texto, backgroundColor: c.neutro },
          ]}
        />
      </View>

      <PressableScale
        accessibilityRole="button"
        accessibilityState={{ disabled: !listo }}
        disabled={!listo}
        onPress={() => {
          if (!metodo) return;
          Keyboard.dismiss();
          void onEnviar(metodo, nota.trim());
        }}
        onLayout={(e) => {
          const { x, y, width, height } = e.nativeEvent.layout;
          setBoton({ x: x + width / 2, y: y + height / 2 });
        }}
        scaleTo={0.97}
        style={[styles.enviar, { opacity: listo ? 1 : 0.45 }]}
      >
        <Text style={[INTER.semibold, styles.enviarTexto]}>
          {enviando ? "Enviando…" : "Enviar"}
        </Text>
      </PressableScale>

      {enviado ? (
        // Toda la card, de borde a borde y con sus esquinas redondeadas
        <View style={[styles.ola, { top: -arriba }]}>
          <OlaEnviado
            ancho={caja.ancho}
            alto={arriba + caja.alto + ESPACIO_ABAJO}
            origen={{ x: boton.x, y: boton.y + arriba }}
            fondo={FONDO_CARD[isDark ? 1 : 0]}
            isDark={isDark}
            onFin={onEnviado}
          />
        </View>
      ) : null}
    </Pressable>
  );
}

/** El espacio que deja el drawer bajo el contenido */
const ESPACIO_ABAJO = 14;

const PALOMITA = ZoomIn.duration(180).easing(EASE_OUT_CUBIC);
const LADO_RADIO = 18;

const styles = StyleSheet.create({
  /*Expancion de cotenido */
  contenido: { paddingHorizontal: 21, gap: 18 },
  ola: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -ESPACIO_ABAJO,
    overflow: "hidden",
    borderRadius: RADIO_CARD,
  },
  // El texto queda pegado a lo que describe
  seccion: { gap: 6 },
  // La descripción, un poco más abajo de las opciones
  conAire: { marginTop: 10 },
  etiqueta: { fontSize: 15 },
  opciones: { gap: 10 },
  opcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 20,
  },
  icono: { width: 32, alignItems: "center" },
  opcionTexto: { flex: 1, gap: 2 },
  opcionTitulo: { fontSize: 15 },
  opcionNota: { fontSize: 12.5 },
  radio: {
    width: LADO_RADIO,
    height: LADO_RADIO,
    borderRadius: LADO_RADIO / 2,
    borderWidth: 1.5,
    overflow: "hidden",
  },

  radioLleno: {
    position: "absolute",
    top: -1.5,
    left: -1.5,
    width: LADO_RADIO,
    height: LADO_RADIO,
    borderRadius: LADO_RADIO / 2,
    backgroundColor: AZUL_PEDIR,
    alignItems: "center",
    justifyContent: "center",
  },
  nota: {
    minHeight: 110,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 14.5,
  },
  enviar: {
    height: 52,
    borderRadius: 26,
    backgroundColor: AZUL_PEDIR,
    alignItems: "center",
    justifyContent: "center",
  },
  enviarTexto: { color: "#FFFFFF", fontSize: 15.5 },
});
