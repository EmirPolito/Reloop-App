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

/** Lee el grosor desde clases de Tailwind (font-bold, font-[700], etc.). */
function weightFromClassName(
  className?: string,
): TextStyle["fontWeight"] | undefined {
  if (!className) return undefined;
  // Ignora variantes (dark:, active:...) tomando solo la parte final de cada clase
  const tokens = className.split(/\s+/).map((t) => t.split(":").pop() ?? "");
  let found: TextStyle["fontWeight"] | undefined;
  for (const token of tokens) {
    switch (token) {
      case "font-extrabold":
      case "font-black":
        found = "800";
        break;
      case "font-bold":
        found = "700";
        break;
      case "font-semibold":
        found = "600";
        break;
      case "font-medium":
        found = "500";
        break;
      case "font-normal":
      case "font-light":
      case "font-thin":
        found = "400";
        break;
      default: {
        const arbitrary = token.match(/^font-\[(\d{3})\]$/);
        if (arbitrary) found = arbitrary[1] as TextStyle["fontWeight"];
      }
    }
  }
  return found;
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

function resolveWeight(style: TextProps["style"], className?: string) {
  return (
    StyleSheet.flatten(style)?.fontWeight ?? weightFromClassName(className)
  );
}

/** Text con fuente Poppins automática según fontWeight o clase font-*. Es el único Text que debe usarse en la app. */
export function Text({ style, ...props }: TextProps & { className?: string }) {
  const weight = resolveWeight(style, props.className);
  return (
    <NativeText
      {...props}
      style={[
        { fontFamily: poppinsFor(weight) },
        style,
        SAME_ON_EVERY_PLATFORM,
      ]}
    />
  );
}

/** TextInput con fuente Poppins automática. Es el único TextInput que debe usarse en la app. */
export function TextInput({
  style,
  ...props
}: TextInputProps & { className?: string }) {
  const weight = resolveWeight(style, props.className);
  return (
    <NativeTextInput
      {...props}
      style={[
        { fontFamily: poppinsFor(weight) },
        style,
        SAME_ON_EVERY_PLATFORM,
      ]}
    />
  );
}
