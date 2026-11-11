import { Ionicons } from "@expo/vector-icons";
import { memo, useState } from "react";
import { Keyboard, Pressable, StyleSheet, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutUp, ZoomIn } from "react-native-reanimated";
import { PressableSuave } from "@/components/PressableSuave";
import { IconoCheck, IconoMas, renderPerfilIcon } from "../Perfiliconos";
import { PildoraPerfil } from "../Pildoraperfil";
import { COLORES_PERFIL, MAX_PILDORAS, MAX_TEXTO_PILDORA, TEMAS, type ColorPerfil, type DatosPerfil } from "../Perfiltemas";
import { PELIGRO, TIPO, PALETA, ICONOS_ELEGIBLES, TINTE_ICONO, DURACION, EASE, LAYOUT, conAlfa, type Modo } from "./drawerTheme";
import { InputSheet } from "./InputSheet";

/* ========================================================================== */
/*  Editor de etiquetas                                                       */
/*   - Escribir: los iconos eligen el icono de la etiqueta NUEVA.             */
/*   - Tocar una etiqueta: la selecciona; los iconos editan ESA etiqueta y    */
/*     aparece su panel con colores, papelera y palomita.                     */
/* ========================================================================== */

export const SeccionEtiquetas = memo(function SeccionEtiquetas({
  pills,
  modo,
  onAdd,
  onColor,
  onIcon,
  onRemove,
}: {
  pills: DatosPerfil["pills"];
  modo: Modo;
  onAdd: (text: string, icon?: string) => void;
  onColor: (id: string, color: ColorPerfil) => void;
  onIcon: (id: string, icon?: string) => void;
  onRemove: (id: string) => void;
}) {
  const p = PALETA[modo];
  const [texto, setTexto] = useState("");
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [iconoNuevo, setIconoNuevo] = useState<string | undefined>();
  const [enfocado, setEnfocado] = useState(false);

  const lleno = pills.length >= MAX_PILDORAS;
  const puedeAgregar = !lleno && texto.trim().length > 0;
  const activa = pills.find((x) => x.id === seleccion) ?? null;

  const colorNueva = COLORES_PERFIL[pills.length % COLORES_PERFIL.length];
  const tinte = activa
    ? TEMAS[activa.color].accent
    : (TEMAS[colorNueva]?.accent ?? p.suave);
  const iconoActual = activa ? activa.icon : iconoNuevo;

  const agregar = () => {
    if (!puedeAgregar) return;
    const llenara = pills.length + 1 >= MAX_PILDORAS;
    onAdd(texto.trim(), iconoNuevo);
    setTexto("");
    setIconoNuevo(undefined);
    setSeleccion(null);
    /* Al llegar al máximo, el teclado baja una vez que la etiqueta nueva
       terminó de entrar (evita saltos de pantalla). */
    if (llenara) setTimeout(() => Keyboard.dismiss(), 350);
  };

  return (
    <Animated.View layout={LAYOUT} style={styles.wrap}>
      {/* Campo con el botón de agregar dentro; el icono elegido se ve a la izquierda */}
      <View style={[styles.campo, { backgroundColor: p.campo }]}>
        {iconoNuevo ? (
          <Animated.View key={iconoNuevo} entering={ZoomIn.duration(160)} exiting={FadeOut.duration(100)}>
            {renderPerfilIcon(iconoNuevo, 18, tinte)}
          </Animated.View>
        ) : null}
        <InputSheet
          accessibilityLabel="Nueva etiqueta"
          value={texto}
          onChangeText={(t) => {
            if (!lleno) setTexto(t);
          }}
          onFocus={() => {
            setEnfocado(true);
            setSeleccion(null); // al escribir, los iconos aplican a la nueva
          }}
          onBlur={() => setEnfocado(false)}
          onSubmitEditing={agregar}
          blurOnSubmit={false}
          returnKeyType="done"
          editable={!lleno || enfocado}
          maxLength={MAX_TEXTO_PILDORA}
          placeholder={lleno ? "Máximo alcanzado" : "Nueva etiqueta"}
          placeholderTextColor={p.suave}
          selectionColor={p.cursor}
          cursorColor={p.cursor}
          underlineColorAndroid="transparent"
          style={[styles.input, { color: p.texto, fontSize: TIPO.input }]}
        />
        <PressableSuave
          accessibilityRole="button"
          accessibilityLabel="Agregar etiqueta"
          accessibilityState={{ disabled: !puedeAgregar }}
          onPress={agregar}
          disabled={!puedeAgregar}
          style={[styles.agregar, { backgroundColor: puedeAgregar ? p.activo : "transparent" }]}
        >
          <Animated.View key={puedeAgregar ? "ok" : "mas"} entering={ZoomIn.duration(140)}>
            {puedeAgregar ? (
              <Ionicons name="checkmark" size={18} color={p.sobreActivo} />
            ) : (
              <IconoMas size={15} color={p.suave} />
            )}
          </Animated.View>
        </PressableSuave>
      </View>

      {/* Iconos: sin cuadros; solo el elegido lleva un círculo suave */}
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.iconos}
      >
        {ICONOS_ELEGIBLES.map((key) => {
          const sel = iconoActual === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={`Icono ${key}`}
              onPress={() => {
                const nuevo = sel ? undefined : key; // tocar de nuevo lo quita
                if (activa) onIcon(activa.id, nuevo);
                else setIconoNuevo(nuevo);
              }}
              style={[styles.icono, sel && { backgroundColor: conAlfa(tinte, TINTE_ICONO) }]}
            >
              {renderPerfilIcon(key, 19, sel ? tinte : p.suave)}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Etiquetas creadas */}
      {pills.length > 0 ? (
        <Animated.View entering={FadeIn.duration(DURACION)} layout={LAYOUT} style={styles.pildoras}>
          {pills.map((pill) => (
            <Animated.View
              key={pill.id}
              entering={FadeInDown.duration(DURACION).easing(EASE)}
              exiting={FadeOutUp.duration(140)}
              layout={LAYOUT}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: seleccion === pill.id }}
                accessibilityLabel={`Etiqueta ${pill.text}`}
                onPress={() => setSeleccion((curr) => (curr === pill.id ? null : pill.id))}
                style={{ opacity: seleccion && seleccion !== pill.id ? 0.45 : 1 }}
              >
                <PildoraPerfil
                  text={pill.text}
                  color={pill.color}
                  icon={pill.icon}
                  isDark={modo === "oscuro"}
                />
              </Pressable>
            </Animated.View>
          ))}
        </Animated.View>
      ) : null}

      {/* Panel de la etiqueta seleccionada */}
      {activa ? (
        <Animated.View
          entering={FadeInDown.duration(220).easing(EASE)}
          exiting={FadeOutUp.duration(160)}
          style={[styles.panel, { backgroundColor: p.campo }]}
        >
          <View style={styles.paleta}>
            {COLORES_PERFIL.map((color) => {
              const selected = activa.color === color;
              return (
                <Pressable
                  key={color}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Etiqueta color ${TEMAS[color].label}`}
                  onPress={() => onColor(activa.id, color)}
                  hitSlop={6}
                  style={[styles.punto, { backgroundColor: TEMAS[color].accent }]}
                >
                  {selected ? <IconoCheck size={13} /> : null}
                </Pressable>
              );
            })}
          </View>
          <View style={styles.acciones}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quitar etiqueta"
              onPress={() => {
                onRemove(activa.id);
                setSeleccion(null);
              }}
              style={[styles.botonPanel, { backgroundColor: conAlfa(PELIGRO, 0.15) }]}
            >
              <Ionicons name="trash-outline" size={17} color={PELIGRO} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Listo"
              onPress={() => setSeleccion(null)}
              style={[styles.botonPanel, { backgroundColor: p.activo }]}
            >
              <Ionicons name="checkmark" size={18} color={p.sobreActivo} />
            </Pressable>
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  campo: {
    height: 50,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 18,
    paddingRight: 7,
    gap: 10,
  },
  input: {
    flex: 1,
    height: "100%",
    padding: 0,
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  agregar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  iconos: { gap: 4, paddingHorizontal: 4 },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  pildoras: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 4 },
  panel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  paleta: { flexDirection: "row", flexWrap: "wrap", gap: 8, flex: 1 },
  punto: {
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  acciones: { flexDirection: "row", gap: 8, marginLeft: 10 },
  botonPanel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
