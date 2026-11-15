import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";

import {
  PERFIL_ICONS,
  renderPerfilIcon,
  type IconPerfilKey,
} from "@/features/perfil/Perfiliconos";
import {
  COLORES_PERFIL,
  MAX_PILDORAS,
  type PildoraPerfilData,
} from "@/features/perfil/Perfiltemas";
import { Text, TextInput } from "@/features/shared/Text";
import { BotonPaso } from "../components/BotonPaso";
import { BotonPalomita, ChipEtiqueta } from "../components/Piezas";
import { LETRA, coloresOnboarding } from "../temaOnboarding";

/** Largo máximo de una etiqueta */
const MAX_TEXTO_ETIQUETA = 18;

/** Etiquetas de ejemplo para quien todavía no tiene ninguna */
export const ETIQUETAS_EJEMPLO: PildoraPerfilData[] = [
  { id: "ejemplo-vendedor", text: "Vendedor", color: "azul", icon: "bag" },
  { id: "ejemplo-comprador", text: "Comprador", color: "naranja", icon: "buy" },
];

/** Iconos que se pueden poner a una etiqueta nueva (los mismos que muestra el perfil) */
const ICONOS = Object.keys(PERFIL_ICONS) as IconPerfilKey[];

const nuevoId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Paso de etiquetas: un campo redondo para escribir (la palomita aparece al escribir), los
 * iconos para elegir el de la etiqueta nueva y las etiquetas debajo, con una × para
 * quitarlas. Máximo `MAX_PILDORAS`. Se guardan al continuar.
 */
export function PasoEtiquetas({
  inicial,
  isDark,
  onContinuar,
}: {
  inicial: PildoraPerfilData[];
  isDark: boolean;
  /** Guarda las etiquetas; si falla lanza (y ya avisó) */
  onContinuar: (etiquetas: PildoraPerfilData[]) => Promise<void>;
}) {
  const c = coloresOnboarding(isDark);
  const [etiquetas, setEtiquetas] = useState(inicial);
  const [texto, setTexto] = useState("");
  const [icono, setIcono] = useState<IconPerfilKey | undefined>();
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
    setIcono(undefined);
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
      <View style={styles.encabezado}>
        <Text
          accessibilityRole="header"
          style={[LETRA.bold, styles.titulo, { color: c.texto }]}
        >
          ¿Qué te describe?
        </Text>
        <Text style={[LETRA.regular, styles.subtitulo, { color: c.suave }]}>
          Hasta {MAX_PILDORAS} etiquetas · {etiquetas.length}/{MAX_PILDORAS}
        </Text>
      </View>

      {/* Campo redondo: el icono elegido a la izquierda y la palomita al escribir */}
      <View style={[styles.campo, { backgroundColor: c.campo }]}>
        {icono ? renderPerfilIcon(icono, 17, c.icono) : null}
        <TextInput
          value={texto}
          onChangeText={setTexto}
          editable={!llenas}
          maxLength={MAX_TEXTO_ETIQUETA}
          placeholder={
            llenas ? "Ya tienes 4 etiquetas" : "Escribe una etiqueta"
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
              {renderPerfilIcon(clave, 19, c.icono)}
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

      <View style={styles.espacio} />

      <BotonPaso
        texto="Continuar"
        isDark={isDark}
        cargando={guardando}
        onPress={() => void continuar()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  paso: { flex: 1, paddingHorizontal: 17, gap: 16 },
  encabezado: { alignItems: "center", gap: 4 },
  titulo: {
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.4,
    textAlign: "center",
  },
  subtitulo: { fontSize: 12.5 },
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
  iconos: { gap: 6, paddingHorizontal: 2 },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  etiquetas: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  espacio: { flex: 1 },
});
