import {
  Text as NativeText,
  TextInput as NativeTextInput,
  StyleSheet,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from "react-native";

/** Archivo de la fuente Poppins que corresponde a un grosor. */
function poppinsFor(weight: TextStyle["fontWeight"]): string {
  switch (weight) {
    case "800":
    case "900":
      return "Poppins_800ExtraBold";
    case "700":
    case "bold":
      return "Poppins_700Bold";
    case "600":
      return "Poppins_600SemiBold";
    case "500":
      return "Poppins_500Medium";
    default:
      return "Poppins_400Regular";
  }
}

/**
 * Cada grosor de Poppins es un archivo distinto, así que el grosor ya va en la fuente. Si
 * además se dejara `fontWeight`, Android volvería a "engordarla" y el texto se vería distinto
 * que en iOS y en web. `includeFontPadding: false` quita el espacio extra arriba y abajo que
 * Android añade a cada texto: así se centra igual en botones, campos y encabezados.
 */
const SAME_ON_EVERY_PLATFORM = {
  fontWeight: "normal",
  includeFontPadding: false,
} as const;

/** Text con fuente Poppins automática según fontWeight. Es el único Text que debe usarse en la app. */
export function Text({ style, ...props }: TextProps) {
  const weight = StyleSheet.flatten(style)?.fontWeight;
  return (
    <NativeText
      {...props}
      style={[{ fontFamily: poppinsFor(weight) }, style, SAME_ON_EVERY_PLATFORM]}
    />
  );
}

/** TextInput con fuente Poppins automática. Es el único TextInput que debe usarse en la app. */
export function TextInput({ style, ...props }: TextInputProps) {
  const weight = StyleSheet.flatten(style)?.fontWeight;
  return (
    <NativeTextInput
      {...props}
      style={[{ fontFamily: poppinsFor(weight) }, style, SAME_ON_EVERY_PLATFORM]}
    />
  );
}
