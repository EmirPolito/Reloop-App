import { useBottomSheetAwareHandlers } from "heroui-native";
import { useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

import {
  PERFIL_ICONS,
  renderPerfilIcon,
  type IconPerfilKey,
} from "@/features/perfil/iconosPerfil";
import {
  COLORES_PERFIL,
  MAX_PILDORAS,
  type PildoraPerfilData,
} from "@/features/perfil/temasPerfil";
import { TextInput } from "@/features/shared/Text";
import { BotonPaso } from "./components/BotonPaso";
import {
  BotonPalomita,
  BotonSecundario,
  ChipEtiqueta,
} from "./components/Piezas";
import { LETRA, coloresOnboarding } from "./temaOnboarding";

/** Largo máximo de una etiqueta */
const MAX_TEXTO_ETIQUETA = 18;

/** Etiquetas de ejemplo para quien todavía no tiene ninguna */
export const ETIQUETAS_EJEMPLO: PildoraPerfilData[] = [
  { id: "ejemplo-vendedor", text: "Vendedor", color: "azul", icon: "bag" },
  { id: "ejemplo-comprador", text: "Comprador", color: "naranja", icon: "buy" },
];

/** Iconos que se pueden poner a una etiqueta nueva (los mismos que muestra el perfil) */
const ICONOS = Object.keys(PERFIL_ICONS) as IconPerfilKey[];
/** Icono puesto de entrada, para que se note que se puede elegir uno */
const ICONO_INICIAL = ICONOS[0];

const nuevoId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Paso de etiquetas: un campo redondo para escribir (la palomita aparece al escribir), los
 * iconos para elegir el de la etiqueta nueva y las etiquetas debajo, con una × para
 * quitarlas. Máximo `MAX_PILDORAS`. Al escribir, el drawer sube con el teclado y al
 * confirmar la etiqueta vuelve a su alto. Abajo, Saltar (sin guardar) y Confirmar.
 */
export function PasoEtiquetas({
  inicial,
  isDark,
  onContinuar,
  onSaltar,
}: {
  inicial: PildoraPerfilData[];
  isDark: boolean;
  /** Guarda las etiquetas; si falla lanza (y ya avisó) */
  onContinuar: (etiquetas: PildoraPerfilData[]) => Promise<void>;
  /** Sigue sin guardar cambios */
  onSaltar: () => void;
}) {
  const c = coloresOnboarding(isDark);
  const teclado = useBottomSheetAwareHandlers();
  const [etiquetas, setEtiquetas] = useState(inicial);
  const [texto, setTexto] = useState("");
  const [icono, setIcono] = useState<IconPerfilKey | undefined>(ICONO_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const llenas = etiquetas.length >= MAX_PILDORAS;
  const limpio = texto.trim();

  const agregar = () => {
    if (!limpio || llenas) return;
    // Sin repetidas (sin importar mayúsculas)
    if (etiquetas.some((e) => e.text.toLowerCase() === limpio.toLowerCase())) {
      setTexto("");
      return;
    }
    setEtiquetas((actuales) => [
      ...actuales,
      {
        id: nuevoId(),
        text: limpio,
        color: COLORES_PERFIL[actuales.length % COLORES_PERFIL.length],
        icon: icono,
      },
    ]);
    setTexto("");
    setIcono(ICONO_INICIAL);
    // Al confirmar baja el teclado y el drawer vuelve a su alto
    Keyboard.dismiss();
  };

  const continuar = async () => {
    if (guardando) return;
    setGuardando(true);
    try {
      await onContinuar(etiquetas);
    } catch {
      // Ya se avisó; se queda para reintentar
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={styles.paso}>
      <View style={styles.centro}>
        {/* Campo redondo: el icono elegido a la izquierda y la palomita al escribir */}
        <View style={[styles.campo, { backgroundColor: c.campo }]}>
          {icono ? renderPerfilIcon(icono, 17, c.icono) : null}
          <TextInput
            {...teclado}
            value={texto}
            onChangeText={setTexto}
            editable={!llenas}
            maxLength={MAX_TEXTO_ETIQUETA}
            placeholder={
              llenas
                ? `Ya tienes ${MAX_PILDORAS} etiquetas`
                : `Escribe una etiqueta (máximo ${MAX_PILDORAS})`
            }
            placeholderTextColor={c.campoPlaceholder}
            selectionColor={c.campoTexto}
            cursorColor={c.campoTexto}
            underlineColorAndroid="transparent"
            returnKeyType="done"
            onSubmitEditing={agregar}
            accessibilityLabel="Nueva etiqueta"
            style={[LETRA.regular, styles.input, { color: c.campoTexto }]}
          />
          {limpio && !llenas ? (
            <BotonPalomita
              isDark={isDark}
              etiqueta="Agregar etiqueta"
              onPress={agregar}
            />
          ) : null}
        </View>

        {/* Iconos para la etiqueta nueva: tocar otra vez el elegido lo quita */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          // Sin crecer: un ScrollView ocupa todo el espacio libre y separaba el campo de las etiquetas
          style={styles.carruselIconos}
          contentContainerStyle={styles.iconos}
        >
          {ICONOS.map((clave) => {
            const elegido = icono === clave;
            return (
              <Pressable
                key={clave}
                accessibilityRole="button"
                accessibilityLabel={`Icono ${clave}`}
                accessibilityState={{ selected: elegido, disabled: llenas }}
                disabled={llenas}
                onPress={() => setIcono(elegido ? undefined : clave)}
                style={({ pressed }) => [
                  styles.icono,
                  elegido && { backgroundColor: c.iconoElegido },
                  (pressed || llenas) && { opacity: 0.5 },
                ]}
              >
                {renderPerfilIcon(clave, 24, c.icono)}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.etiquetas}>
          {etiquetas.map((etiqueta) => (
            <Animated.View
              key={etiqueta.id}
              entering={FadeIn.duration(160)}
              exiting={FadeOut.duration(120)}
              layout={LinearTransition.duration(180)}
            >
              <ChipEtiqueta
                etiqueta={etiqueta}
                isDark={isDark}
                tamano="editable"
                onQuitar={() =>
                  setEtiquetas((actuales) =>
                    actuales.filter((e) => e.id !== etiqueta.id),
                  )
                }
              />
            </Animated.View>
          ))}
        </View>
      </View>

      <View style={styles.botones}>
        <View style={styles.boton}>
          <BotonSecundario texto="Saltar" isDark={isDark} onPress={onSaltar} />
        </View>
        <View style={styles.boton}>
          <BotonPaso
            texto="Confirmar"
            isDark={isDark}
            cargando={guardando}
            onPress={() => void continuar()}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  paso: { flex: 1, paddingHorizontal: 17, gap: 14 },
  // El contenido, centrado entre el título y los botones
  centro: { flex: 1, justifyContent: "center", gap: 14 },
  campo: {
    height: 52,
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    paddingRight: 8,
    gap: 8,
  },
  input: { flex: 1, minWidth: 0, fontSize: 15, paddingVertical: 0 },
  carruselIconos: { flexGrow: 0 },
  iconos: { gap: 12, paddingHorizontal: 2 },
  icono: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  etiquetas: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 4 },
  botones: { flexDirection: "row", gap: 10 },
  boton: { flex: 1 },
});
