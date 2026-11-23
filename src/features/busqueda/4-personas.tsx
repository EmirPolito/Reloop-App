import { memo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, {
  type useAnimatedScrollHandler,
} from "react-native-reanimated";

import { ResultadosUsuarios } from "./components/ResultadosUsuarios";
import { estilos } from "./estilos";

/** Al escribir "@": personas que coinciden (o las sugeridas con solo "@") */
export const VistaPersonas = memo(function VistaPersonas({
  termino,
  isDark,
  contenido,
  alHacerScroll,
  onOpenUser,
}: {
  /** Ya normalizado, sin "@" */
  termino: string;
  isDark: boolean;
  contenido: StyleProp<ViewStyle>;
  alHacerScroll: ReturnType<typeof useAnimatedScrollHandler>;
  onOpenUser: (uid: string) => void;
}) {
  return (
    <Animated.ScrollView
      style={estilos.lista}
      contentContainerStyle={contenido}
      onScroll={alHacerScroll}
      scrollEventThrottle={16}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <ResultadosUsuarios
        termino={termino}
        isDark={isDark}
        onOpenUser={onOpenUser}
      />
    </Animated.ScrollView>
  );
});
