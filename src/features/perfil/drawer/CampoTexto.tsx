import { memo, useState } from "react";
import { View } from "react-native";
import { Text } from "@/features/shared/Text";
import { TIPO, PALETA, type Modo } from "./drawerTheme";
import { styles } from "./drawerStyles";
import { InputSheet } from "./InputSheet";

interface CampoTextoProps {
  placeholder: string;
  accessibilityLabel: string;
  value: string;
  maxLength: number;
  multiline?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  modo: Modo;
  onChangeText: (text: string) => void;
}

export const CampoTexto = memo(function CampoTexto({
  placeholder,
  accessibilityLabel,
  value,
  maxLength,
  multiline = false,
  autoCapitalize,
  modo,
  onChangeText,
}: CampoTextoProps) {
  const p = PALETA[modo];
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.campo, { backgroundColor: p.campo }]}>
      {focused || value.length > 0 ? (
        <View
          pointerEvents="none"
          style={multiline ? styles.contadorMulti : styles.contadorUna}
        >
          <Text style={{ fontSize: TIPO.contador, color: p.suave }}>
            {value.length}/{maxLength}
          </Text>
        </View>
      ) : null}

      <InputSheet
        accessibilityLabel={accessibilityLabel}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxLength={maxLength}
        multiline={multiline}
        scrollEnabled={false}
        autoCapitalize={autoCapitalize}
        placeholder={placeholder}
        placeholderTextColor={p.suave}
        selectionColor={p.cursor}
        cursorColor={p.cursor}
        underlineColorAndroid="transparent"
        style={[
          multiline ? styles.inputMulti : styles.inputUna,
          { color: p.texto, fontSize: TIPO.input },
        ]}
      />
    </View>
  );
});
