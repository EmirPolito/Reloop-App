import { Ionicons } from "@expo/vector-icons";
import { memo, useState } from "react";
import { Keyboard, Pressable, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, { FadeIn, FadeInDown, FadeOut, FadeOutUp, ZoomIn } from "react-native-reanimated";
import { PressableSuave } from "@/components/PressableSuave";
import { IconoCheck, IconoMas, renderPerfilIcon } from "../Perfiliconos";
import { PildoraPerfil } from "../Pildoraperfil";
import { COLORES_PERFIL, MAX_PILDORAS, MAX_TEXTO_PILDORA, TEMAS, type ColorPerfil, type DatosPerfil } from "../Perfiltemas";
import { PELIGRO, MEDIDAS, TIPO, PALETA, ICONOS_ELEGIBLES, ICONOS_EN_FILA, TINTE_ICONO, DURACION, EASE, LAYOUT, conAlfa, type Modo } from "./drawerTheme";
import { styles } from "./drawerStyles";
import { InputSheet } from "./InputSheet";
import { Tarjeta } from "./Tarjeta";

/* ========================================================================== */
/*  Sección: etiquetas                                                        */
/*   - Escribir: los iconos eligen el icono de la etiqueta NUEVA.             */
/*   - Tocar un chip: lo selecciona; los iconos editan ESE chip y aparece     */
/*     su panel con colores, papelera y palomita.                             */
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

  const celdasIconos = ICONOS_ELEGIBLES.map((key) => {
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
        style={[
          styles.iconCell,
          ICONOS_EN_FILA ? styles.flex : { width: MEDIDAS.celdaIcono },
          { backgroundColor: sel ? conAlfa(tinte, TINTE_ICONO) : p.interna },
        ]}
      >
        {renderPerfilIcon(key, 18, sel ? tinte : p.suave)}
      </Pressable>
    );
  });

  return (
    <Tarjeta
      modo={modo}
      title="Etiquetas"
      description="Puedes escribir frases cortas que te describan."
      counter={`${pills.length}/${MAX_PILDORAS}`}
      animarAlto
    >
      {/* Entrada: el icono elegido se ve a la izquierda como vista previa */}
      <View style={styles.tagInputRow}>
        <View style={[styles.tagField, { backgroundColor: p.interna }]}>
          {iconoNuevo ? (
            <Animated.View
              key={iconoNuevo}
              entering={ZoomIn.duration(160)}
              exiting={FadeOut.duration(100)}
            >
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
            placeholder={lleno ? "Máximo alcanzado" : "Ej. Vendedora"}
            placeholderTextColor={p.suave}
            selectionColor={p.cursor}
            cursorColor={p.cursor}
            underlineColorAndroid="transparent"
            style={[styles.tagInput, { color: p.texto, fontSize: TIPO.input }]}
          />
        </View>
        <PressableSuave
          accessibilityRole="button"
          accessibilityLabel="Agregar etiqueta"
          accessibilityState={{ disabled: !puedeAgregar }}
          onPress={agregar}
          disabled={!puedeAgregar}
          style={[
            styles.tagAdd,
            { backgroundColor: puedeAgregar ? p.activo : p.inactivo },
          ]}
        >
          <Animated.View
            key={puedeAgregar ? "ok" : "mas"}
            entering={ZoomIn.duration(140)}
          >
            {puedeAgregar ? (
              <Ionicons name="checkmark" size={20} color={p.sobreActivo} />
            ) : (
              <IconoMas size={16} color={p.suave} />
            )}
          </Animated.View>
        </PressableSuave>
      </View>

      {/* Iconos */}
      {ICONOS_EN_FILA ? (
        <View style={[styles.iconRow, { marginTop: 14 }]}>{celdasIconos}</View>
      ) : (
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          style={[styles.hScroll, { marginTop: 14 }]}
          contentContainerStyle={styles.hContent}
        >
          {celdasIconos}
        </ScrollView>
      )}

      {/* Etiquetas creadas: una fila con scroll lateral */}
      {pills.length > 0 ? (
        <Animated.View
          entering={FadeIn.duration(DURACION)}
          layout={LAYOUT}
          style={[styles.hScroll, { marginTop: 14 }]}
        >
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.hContent}
          >
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
                  onPress={() =>
                    setSeleccion((curr) => (curr === pill.id ? null : pill.id))
                  }
                  style={{
                    opacity: seleccion && seleccion !== pill.id ? 0.45 : 1,
                  }}
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
          </ScrollView>
        </Animated.View>
      ) : null}

      {/* Panel de la etiqueta seleccionada */}
      {activa ? (
        <Animated.View
          entering={FadeInDown.duration(220).easing(EASE)}
          exiting={FadeOutUp.duration(160)}
          style={[styles.tagPanel, { backgroundColor: p.interna }]}
        >
          <View style={styles.tagPalette}>
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
                  style={[
                    styles.tagPaletteDot,
                    { backgroundColor: TEMAS[color].accent },
                  ]}
                >
                  {selected ? <IconoCheck size={13} /> : null}
                </Pressable>
              );
            })}
          </View>
          <View style={styles.tagAcciones}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quitar etiqueta"
              onPress={() => {
                onRemove(activa.id);
                setSeleccion(null);
              }}
              style={[
                styles.tagBoton,
                { backgroundColor: conAlfa(PELIGRO, 0.15) },
              ]}
            >
              <Ionicons name="trash-outline" size={17} color={PELIGRO} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Listo"
              onPress={() => setSeleccion(null)}
              style={[styles.tagBoton, { backgroundColor: p.activo }]}
            >
              <Ionicons name="checkmark" size={18} color={p.sobreActivo} />
            </Pressable>
          </View>
        </Animated.View>
      ) : null}
    </Tarjeta>
  );
});
