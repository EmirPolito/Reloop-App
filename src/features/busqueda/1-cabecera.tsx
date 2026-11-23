import { memo, type ComponentRef, type RefObject } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { MARGEN_FIJO } from "@/features/home/1-cabecera";
import { IconoBusqueda } from "@/features/home/components/IconosTarjeta";
import { CATEGORIES } from "@/features/marketplace/data";
import type { CategoryId } from "@/features/marketplace/types";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { TextInput } from "@/features/shared/Text";
import { NeblinaDesenfocada } from "./components/NeblinaDesenfocada";
import { GROSOR_LUPA, PildoraCristal } from "./components/PildoraCristal";
import { FilaPildoras, PildoraOpcion } from "./components/PildoraOpcion";
import { PlaceholderRotativo } from "./components/PlaceholderRotativo";
import { estilos, type ColoresBusqueda } from "./estilos";
import {
  ETIQUETA_BUSQUEDA,
  PISTA_BUSQUEDA,
  SUGERENCIAS_BUSQUEDA,
} from "./frasesBusqueda";

/** Scroll en el que la neblina termina de aparecer */
const TRAMO_NEBLINA = 24;

/**
 * Cabecera flotante del módulo: volver, la píldora del buscador (con las frases animadas
 * mientras está vacía) y debajo píldoras: sugerencias sin texto, categorías con resultados
 * (sin píldoras al buscar personas). Detrás, la neblina borrosa del inicio, que aparece cuando
 * hay contenido pasando por detrás.
 */
export const CabeceraBusqueda = memo(function CabeceraBusqueda({
  texto,
  onCambiarTexto,
  onEnviar,
  entradaRef,
  colores,
  buscaUsuarios,
  conResultados,
  categoria,
  onAlternarCategoria,
  onElegirSugerencia,
  onVolver,
  altoCabecera,
  onMedir,
  desplazado,
}: {
  texto: string;
  onCambiarTexto: (texto: string) => void;
  onEnviar: () => void;
  entradaRef: RefObject<ComponentRef<typeof TextInput> | null>;
  colores: ColoresBusqueda;
  buscaUsuarios: boolean;
  conResultados: boolean;
  categoria: CategoryId | null;
  onAlternarCategoria: (id: CategoryId) => void;
  onElegirSugerencia: (texto: string) => void;
  onVolver: () => void;
  altoCabecera: number;
  onMedir: (event: LayoutChangeEvent) => void;
  /** Scroll de la vista de abajo: la neblina aparece al empezar a desplazarse */
  desplazado: SharedValue<number>;
}) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();

  // Muy blanca hasta las píldoras (fila de 8 + 40 + 8 bajo el buscador), se desvanece a lo
  // largo de ellas y termina en su borde de abajo; sin píldoras, justo debajo del buscador
  const altoNeblina = altoCabecera + (buscaUsuarios ? 16 : 0);
  const finBuscador = altoCabecera - (buscaUsuarios ? 0 : 56);
  const estiloNeblina = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(desplazado.get() / TRAMO_NEBLINA, 0), 1),
  }));

  return (
    <View pointerEvents="box-none" style={estilos.cabecera} onLayout={onMedir}>
      <Animated.View
        pointerEvents="none"
        style={[
          estilos.neblina,
          { bottom: -(altoNeblina - altoCabecera) },
          estiloNeblina,
        ]}
      >
        {altoCabecera > 0 ? (
          <NeblinaDesenfocada
            alto={altoNeblina}
            inicioVelo={buscaUsuarios ? finBuscador - 14 : finBuscador}
            inicioDesenfoque={
              buscaUsuarios ? finBuscador - 6 : (finBuscador + altoNeblina) / 2
            }
          />
        ) : null}
      </Animated.View>

      <View
        style={[estilos.filaBuscador, { paddingTop: insets.top + MARGEN_FIJO }]}
      >
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Volver"
          scaleTo={0.96}
          onPress={onVolver}
        >
          <PildoraCristal contentStyle={estilos.circulo}>
            <AppIcon name="back" size={22} color={colores.texto} />
          </PildoraCristal>
        </PressableScale>
        <PildoraCristal style={estilos.pildora}>
          <IconoBusqueda
            size={22}
            color={isDark ? "#E3DEED" : "#4A4D57"}
            grosorExtra={GROSOR_LUPA}
          />
          {/* Mientras está vacío, frases animadas (el placeholder nativo no se puede animar) */}
          <View style={estilos.cajaEntrada}>
            <PlaceholderRotativo
              activo={!texto}
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 15,
                color: isDark ? "#B3AEC0" : "#828690",
              }}
            />
            <TextInput
              ref={entradaRef}
              accessibilityLabel={ETIQUETA_BUSQUEDA}
              accessibilityHint={PISTA_BUSQUEDA}
              value={texto}
              onChangeText={onCambiarTexto}
              onSubmitEditing={onEnviar}
              autoCapitalize="none"
              autoCorrect={!buscaUsuarios}
              returnKeyType="search"
              style={[estilos.entrada, { color: colores.texto }]}
            />
          </View>
          {texto ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Borrar texto"
              hitSlop={10}
              onPress={() => onCambiarTexto("")}
              style={[
                estilos.limpiar,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.18)"
                    : "rgba(0,0,0,0.12)",
                },
              ]}
            >
              <AppIcon name="close" size={11} color={colores.texto} />
            </PressableScale>
          ) : null}
        </PildoraCristal>
      </View>

      {buscaUsuarios ? null : (
        <FilaPildoras>
          {conResultados
            ? CATEGORIES.map((category) => (
                <PildoraOpcion
                  key={category.id}
                  valor={category.id}
                  etiqueta={category.label}
                  seleccionado={categoria === category.id}
                  isDark={isDark}
                  onPress={onAlternarCategoria}
                  sutil
                />
              ))
            : SUGERENCIAS_BUSQUEDA.map((sugerencia) => (
                <PildoraOpcion
                  key={sugerencia}
                  valor={sugerencia}
                  etiqueta={sugerencia}
                  seleccionado={false}
                  isDark={isDark}
                  onPress={onElegirSugerencia}
                />
              ))}
        </FilaPildoras>
      )}
    </View>
  );
});
