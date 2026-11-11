import { createContext, useContext } from "react";
import { TextInput, type BlurEvent, type FocusEvent, type TextInputProps } from "react-native";
import { FUENTE_INPUT } from "./drawerTheme";

/** Avisos de foco para un BottomSheet que debe subir con el teclado (opcional) */
export const TecladoSheetCtx = createContext<{
  onFocus?: (e: FocusEvent) => void;
  onBlur?: (e: BlurEvent) => void;
}>({});

/** TextInput que avisa al BottomSheet al enfocarse, para que suba con el teclado */
export function InputSheet({ style, onFocus, onBlur, ...props }: TextInputProps) {
  const teclado = useContext(TecladoSheetCtx);
  return (
    <TextInput
      {...props}
      onFocus={(e) => {
        teclado.onFocus?.(e);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        teclado.onBlur?.(e);
        onBlur?.(e);
      }}
      style={[FUENTE_INPUT, style]}
    />
  );
}
