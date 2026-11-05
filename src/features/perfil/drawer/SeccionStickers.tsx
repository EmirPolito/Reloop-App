import { Image } from "expo-image";
import { memo, useMemo } from "react";
import { Pressable } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, { LinearTransition, ZoomIn } from "react-native-reanimated";
import { Text } from "@/features/shared/Text";
import { STICKERS_PERFIL } from "../perfilStickers";
import { MAX_STICKERS } from "../Perfiltemas";
import { TIPO, PALETA, EASE, type Modo } from "./drawerTheme";
import { styles } from "./drawerStyles";
import { Tarjeta } from "./Tarjeta";

/* ========================================================================== */
/*  Sección: stickers                                                         */
/*  Al elegir uno NO se toca el scroll: solo ese sticker se desplaza a la     */
/*  izquierda (layout transition) y sigues eligiendo desde donde estabas.     */
/* ========================================================================== */

export const SeccionStickers = memo(function SeccionStickers({
  selected,
  modo,
  onToggle,
}: {
  selected: string[];
  modo: Modo;
  onToggle: (id: string) => void;
}) {
  const p = PALETA[modo];
  const lleno = selected.length >= MAX_STICKERS;

  /* Elegidos primero (en orden de elección); luego el resto */
  const ordenados = useMemo(() => {
    const elegidos = selected.flatMap((id) =>
      STICKERS_PERFIL.filter((s) => s.id === id),
    );
    const resto = STICKERS_PERFIL.filter((s) => !selected.includes(s.id));
    return [...elegidos, ...resto];
  }, [selected]);

  return (
    <Tarjeta
      modo={modo}
      title="Stickers"
      description="Se colocarán alrededor de tu foto de perfil."
      counter={`${selected.length}/${MAX_STICKERS}`}
    >
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={styles.hScroll}
        contentContainerStyle={styles.stickersContent}
      >
        {ordenados.map((sticker) => {
          const index = selected.indexOf(sticker.id);
          const activo = index >= 0;
          const bloqueado = !activo && lleno;
          return (
            <Animated.View
              key={sticker.id}
              layout={LinearTransition.duration(220).easing(EASE)}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: activo, disabled: bloqueado }}
                accessibilityLabel={`Sticker ${sticker.id.replace("sticker-", "")}`}
                disabled={bloqueado}
                onPress={() => onToggle(sticker.id)}
                style={[
                  styles.stickerCell,
                  {
                    backgroundColor: activo ? p.celdaActiva : p.interna,
                    opacity: bloqueado ? 0.35 : 1,
                  },
                ]}
              >
                <Image
                  source={sticker.source}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                  style={styles.stickerImage}
                />
                {activo ? (
                  <Animated.View
                    entering={ZoomIn.duration(160)}
                    style={[
                      styles.stickerBadge,
                      { backgroundColor: p.activo, borderColor: p.tarjeta },
                    ]}
                  >
                    <Text
                      style={{
                        color: p.sobreActivo,
                        fontSize: TIPO.insignia,
                        fontWeight: "700",
                      }}
                    >
                      {index + 1}
                    </Text>
                  </Animated.View>
                ) : null}
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>
    </Tarjeta>
  );
});
