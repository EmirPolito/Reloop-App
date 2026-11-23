import { Ionicons } from "@expo/vector-icons";
import { useBottomSheetAwareHandlers } from "heroui-native";
import { useEffect, useState } from "react";
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

import { Text, TextInput } from "@/features/shared/Text";
import {
  PERFIL_ICONS,
  renderPerfilIcon,
  type IconPerfilKey,
} from "../iconosPerfil";
import {
  COLORES_PERFIL,
  MAX_PILDORAS,
  TEMAS,
  type PildoraPerfilData,
} from "../temasPerfil";
import { ALTO_CONTENIDO_SHEET, INTER, coloresEditar } from "./editarTema";
import { BotonGuardar } from "./BotonGuardar";
import { SheetEditar } from "./SheetEditar";

/** Largo máximo de una etiqueta */
const MAX_TEXTO_ETIQUETA = 18;
const ICONOS = Object.keys(PERFIL_ICONS) as IconPerfilKey[];
const ICONO_INICIAL = ICONOS[0];

const nuevoId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Drawer de etiquetas: campo redondo para escribir, iconos para elegir el de la etiqueta
 * nueva y las etiquetas debajo con una × para quitarlas. Se editan como borrador (que la
 * vista previa va mostrando) y se guardan con un solo botón.
 */
export function SheetEtiquetas({
  visible,
  pills,
  isDark,
  onClose,
  onBorrador,
  onGuardar,
}: {
  visible: boolean;
  pills: PildoraPerfilData[];
  isDark: boolean;
  /** `guardado` es true si se confirmó el cambio */
  onClose: (guardado: boolean) => void;
  /** Etiquetas en curso, para la vista previa en vivo */
  onBorrador: (pills: PildoraPerfilData[]) => void;
  onGuardar: (pills: PildoraPerfilData[]) => Promise<void>;
}) {
  return (
    <SheetEditar
      visible={visible}
      titulo="Etiquetas"
      isDark={isDark}
      onClose={() => onClose(false)}
    >
      <Contenido
        visible={visible}
        pills={pills}
        isDark={isDark}
        onClose={onClose}
        onBorrador={onBorrador}
        onGuardar={onGuardar}
      />
    </SheetEditar>
  );
}

function Contenido({
  visible,
  pills,
  isDark,
  onClose,
  onBorrador,
  onGuardar,
}: {
  visible: boolean;
  pills: PildoraPerfilData[];
  isDark: boolean;
  onClose: (guardado: boolean) => void;
  onBorrador: (pills: PildoraPerfilData[]) => void;
  onGuardar: (pills: PildoraPerfilData[]) => Promise<void>;
}) {
  const c = coloresEditar(isDark);
  const teclado = useBottomSheetAwareHandlers();
  const [etiquetas, setEtiquetas] = useState(pills);
  const [texto, setTexto] = useState("");
  const [icono, setIcono] = useState<IconPerfilKey | undefined>(ICONO_INICIAL);
  const [guardando, setGuardando] = useState(false);
  const llenas = etiquetas.length >= MAX_PILDORAS;
  const limpio = texto.trim();
  const colorCampo = isDark ? "#17233A" : "#F2F2F2";

  // Al abrir, el borrador parte de las etiquetas guardadas
  const [abiertoAntes, setAbiertoAntes] = useState(visible);
  if (visible !== abiertoAntes) {
    setAbiertoAntes(visible);
    if (visible) {
      setEtiquetas(pills);
      setTexto("");
      setIcono(ICONO_INICIAL);
    }
  }

  // La vista previa sigue el borrador mientras el drawer está abierto
  useEffect(() => {
    if (visible) onBorrador(etiquetas);
  }, [visible, etiquetas, onBorrador]);

  const agregar = () => {
    if (!limpio || llenas) return;
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
    Keyboard.dismiss();
  };

  const guardar = async () => {
    if (guardando) return;
    setGuardando(true);
    try {
      await onGuardar(etiquetas);
      onClose(true);
    } catch {
      // Ya se avisó; el drawer se queda abierto para reintentar
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={styles.paso}>
      <View style={[styles.campo, { backgroundColor: colorCampo }]}>
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
          placeholderTextColor="#8E8E93"
          selectionColor={c.texto}
          cursorColor={c.texto}
          underlineColorAndroid="transparent"
          returnKeyType="done"
          onSubmitEditing={agregar}
          accessibilityLabel="Nueva etiqueta"
          style={[INTER.regular, styles.input, { color: c.texto }]}
        />
        {limpio && !llenas ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Agregar etiqueta"
            hitSlop={6}
            onPress={agregar}
            style={[styles.palomita, { backgroundColor: c.texto }]}
          >
            <Ionicons
              name="checkmark"
              size={19}
              color={isDark ? "#101010" : "#FFFFFF"}
            />
          </Pressable>
        ) : null}
      </View>

      {/* Iconos para la etiqueta nueva: tocar otra vez el elegido lo quita */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
                elegido && { backgroundColor: isDark ? "#334155" : "#E2E2E7" },
                (pressed || llenas) && { opacity: 0.5 },
              ]}
            >
              {renderPerfilIcon(clave, 24, c.icono)}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.etiquetas}>
        {etiquetas.map((etiqueta) => {
          const tema = TEMAS[etiqueta.color] ?? TEMAS.azul;
          return (
            <Animated.View
              key={etiqueta.id}
              entering={FadeIn.duration(160)}
              exiting={FadeOut.duration(120)}
              layout={LinearTransition.duration(180)}
              style={[
                styles.chip,
                {
                  backgroundColor: isDark ? "#ffffff17" : tema.pillBg,
                  borderColor: tema.pillBorder,
                },
              ]}
            >
              {etiqueta.icon
                ? renderPerfilIcon(etiqueta.icon, 15, c.icono)
                : null}
              <Text style={[INTER.medium, { fontSize: 13, color: c.texto }]}>
                {etiqueta.text}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar ${etiqueta.text}`}
                hitSlop={8}
                onPress={() =>
                  setEtiquetas((actuales) =>
                    actuales.filter((e) => e.id !== etiqueta.id),
                  )
                }
              >
                <Ionicons name="close" size={14} color={c.suave} />
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <BotonGuardar
        texto="Guardar"
        etiqueta="Guardar etiquetas"
        isDark={isDark}
        guardando={guardando}
        onPress={() => void guardar()}
        style={styles.boton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  paso: { paddingHorizontal: 17, gap: 14, minHeight: ALTO_CONTENIDO_SHEET },
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
  palomita: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
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
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 15,
    borderWidth: 1,
  },
  // Siempre al fondo del drawer
  boton: { marginTop: "auto" },
});
