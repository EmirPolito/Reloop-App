import { createContext, useContext, useRef } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { FUENTE_INPUT } from "./drawerTheme";

/** Los inputs avisan al contenido cuál quedó enfocado para hacerlo visible */
export const AsegurarVisibleCtx = createContext<(input: TextInput) => void>(() => {});

/** TextInput que, al enfocarse, pide al contenido que lo deje visible
 *  por encima del teclado. */
export function InputSheet({ style, onFocus, ...props }: TextInputProps) {
  const ref = useRef<TextInput>(null);
  const asegurarVisible = useContext(AsegurarVisibleCtx);
  return (
    <TextInput
      {...props}
      ref={ref}
      onFocus={(e) => {
        if (ref.current) asegurarVisible(ref.current);
        onFocus?.(e);
      }}
      style={[FUENTE_INPUT, style]}
    />
  );
}
