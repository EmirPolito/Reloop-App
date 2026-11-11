import { useState } from "react";
import { StyleSheet, type TextStyle } from "react-native";

import { TextInput } from "@/features/shared/Text";

/**
 * Descripción en un cuadro tipo input, centrada. Se guarda al salir del campo
 * ("listo" del teclado o tocar fuera) si cambió; si falla, vuelve al valor anterior.
 */
export function CampoDescripcion({
  value,
  placeholder,
  maxLength,
  textStyle,
  borde,
  placeholderColor,
  onSave,
}: {
  value: string;
  placeholder: string;
  maxLength: number;
  textStyle: TextStyle;
  /** Color del borde fino del cuadro (sin fondo) */
  borde: string;
  placeholderColor: string;
  onSave: (value: string) => Promise<void>;
}) {
  const [texto, setTexto] = useState(value);
  const [enfocado, setEnfocado] = useState(false);

  // Si el perfil cambia desde fuera y no se está escribiendo, el cuadro lo refleja
  const [valorAntes, setValorAntes] = useState(value);
  if (value !== valorAntes) {
    setValorAntes(value);
    if (!enfocado) setTexto(value);
  }

  const terminar = () => {
    setEnfocado(false);
    const limpio = texto.trim();
    setTexto(limpio);
    if (limpio === value.trim()) return;
    onSave(limpio).catch(() => setTexto(value));
  };

  return (
    <TextInput
      value={texto}
      onChangeText={setTexto}
      onFocus={() => setEnfocado(true)}
      onBlur={terminar}
      multiline
      submitBehavior="blurAndSubmit"
      returnKeyType="done"
      maxLength={maxLength}
      placeholder={placeholder}
      placeholderTextColor={placeholderColor}
      selectionColor={textStyle.color as string}
      cursorColor={textStyle.color as string}
      underlineColorAndroid="transparent"
      accessibilityLabel="Descripción del perfil"
      style={[styles.cuadro, textStyle, { borderColor: borde }]}
    />
  );
}

const styles = StyleSheet.create({
  cuadro: {
    alignSelf: "stretch",
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    textAlign: "center",
    textAlignVertical: "center",
  },
});
