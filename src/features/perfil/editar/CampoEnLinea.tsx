import { useState } from "react";
import { Keyboard, Pressable, View, type TextStyle } from "react-native";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { Text, TextInput } from "@/features/shared/Text";
import { IconoEditar } from "../Perfiliconos";

/**
 * Texto que se edita ahí mismo: el lápiz convierte el texto en un campo con el mismo
 * estilo (sin caja ni borde). Al terminar (palomita, "listo" del teclado o tocar fuera)
 * se guarda; si queda vacío y `requerido`, vuelve al valor anterior.
 */
export function CampoEnLinea({
  value,
  placeholder,
  maxLength,
  multiline = false,
  requerido = false,
  textStyle,
  iconColor,
  accessibilityLabel,
  onSave,
}: {
  value: string;
  placeholder: string;
  maxLength: number;
  multiline?: boolean;
  requerido?: boolean;
  textStyle: TextStyle;
  iconColor: string;
  accessibilityLabel: string;
  /** Si falla (promesa rechazada), vuelve a mostrarse el valor anterior */
  onSave: (value: string) => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(value);

  const empezar = () => {
    setTexto(mostrado);
    setEditando(true);
  };

  // Lo recién guardado se muestra hasta que el perfil lo refleje (evita que regrese el texto viejo)
  const [guardado, setGuardado] = useState<string | null>(null);
  const [valorAntes, setValorAntes] = useState(value);
  if (value !== valorAntes) {
    setValorAntes(value);
    setGuardado(null);
  }
  const mostrado = guardado ?? value;

  // Se llama al perder el foco: palomita, "listo" del teclado o tocar fuera
  const terminar = () => {
    setEditando(false);
    const limpio = texto.trim();
    if (requerido && !limpio) return;
    if (limpio === mostrado.trim()) return;
    setGuardado(limpio);
    onSave(limpio).catch(() => setGuardado(null));
  };

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      {editando ? (
        <TextInput
          autoFocus
          value={texto}
          onChangeText={setTexto}
          onBlur={terminar}
          submitBehavior="blurAndSubmit"
          returnKeyType="done"
          maxLength={maxLength}
          multiline={multiline}
          placeholder={placeholder}
          placeholderTextColor={iconColor}
          selectionColor={textStyle.color as string}
          cursorColor={textStyle.color as string}
          underlineColorAndroid="transparent"
          accessibilityLabel={accessibilityLabel}
          style={[
            textStyle,
            { padding: 0, margin: 0, flexShrink: 1, textAlignVertical: "center" },
          ]}
        />
      ) : (
        <Animated.View entering={FadeIn.duration(160)} style={{ flexShrink: 1 }}>
          <Text style={textStyle} onPress={empezar}>
            {mostrado.trim() || placeholder}
          </Text>
        </Animated.View>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={editando ? "Listo" : `Editar ${accessibilityLabel}`}
        hitSlop={10}
        onPress={editando ? () => Keyboard.dismiss() : empezar}
      >
        <Animated.View key={editando ? "ok" : "lapiz"} entering={ZoomIn.duration(160)}>
          {editando ? (
            <Ionicons name="checkmark" size={18} color={textStyle.color as string} />
          ) : (
            <IconoEditar size={16} color={iconColor} />
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}
