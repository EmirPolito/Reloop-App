import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import Svg, { G, Path } from "react-native-svg";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  StyleSheet,
  View,
} from "react-native";

import { PressableScale } from "@/components/PressableScale";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { MAX_FOTOS } from "./draftRules";

export type OrigenFoto = "galeria" | "camara";

/** Cámara rellena (Iconly Bold "Camera") */
function IconoCamara({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G transform="translate(2 3)">
        <Path
          fill={color}
          d="M12.35,0 C13.32,0.00998890122 14.11,0.509433962 14.57,1.40843507 C14.68875,1.64567148 14.854375,1.99216149 15.0278125,2.35767333 L15.2371875,2.79964319 L15.2371875,2.79964319 L15.34,3.01664817 L15.44,3.236404 C15.48,3.3063263 15.55,3.35627081 15.64,3.35627081 C18.04,3.35627081 20,5.31409545 20,7.71143174 L20,7.71143174 L20,13.6448391 C20,16.0421754 18.04,18 15.64,18 L15.64,18 L4.36,18 C1.95,18 0,16.0421754 0,13.6448391 L0,13.6448391 L0,7.71143174 C0,5.31409545 1.95,3.35627081 4.36,3.35627081 C4.44,3.35627081 4.52,3.31631521 4.55,3.236404 L4.55,3.236404 L4.61,3.11653718 C4.89,2.52719201 5.23,1.80799112 5.43,1.40843507 C5.89,0.509433962 6.67,0.00998890122 7.64,0 L7.64,0 Z M10,6.40288568 C8.95,6.40288568 7.96,6.81243063 7.21,7.56159822 C6.47,8.31076582 6.06,9.28967814 6.07,10.3285239 C6.07,11.3773585 6.48,12.3562708 7.22,13.1054384 C7.97,13.8446171 8.95,14.254162 10,14.254162 C11.08,14.254162 12.06,13.8146504 12.77,13.1054384 C13.48,12.3962264 13.92,11.4173141 13.93,10.3285239 C13.93,9.28967814 13.52,8.30077691 12.78,7.55160932 C12.04,6.81243063 11.05,6.40288568 10,6.40288568 Z M10,7.90122087 C10.65,7.90122087 11.26,8.1509434 11.72,8.61043285 C12.18,9.06992231 12.43,9.67924528 12.43,10.3285239 C12.42,11.6670366 11.34,12.7558269 10,12.7558269 C9.35,12.7558269 8.74,12.5061043 8.28,12.0466149 C7.82,11.5871254 7.57,10.9778024 7.57,10.3285239 L7.57,10.3285239 L7.57,10.318535 C7.56,9.68923418 7.81,9.07991121 8.27,8.62042175 C8.74,8.1509434 9.35,7.90122087 10,7.90122087 Z M15.61,6.16315205 C15.11,6.16315205 14.71,6.572697 14.71,7.07214206 C14.71,7.57158713 15.11,7.97114317 15.61,7.97114317 C16.11,7.97114317 16.52,7.57158713 16.52,7.07214206 C16.52,6.572697 16.11,6.16315205 15.61,6.16315205 Z"
        />
      </G>
    </Svg>
  );
}

/** Cuadros chicos que se ven aunque estén vacíos; los demás se agregan con "+" */
const CHICAS_VISIBLES = 2;
/**
 * Lo que dura en cerrarse la hoja de opciones. La galería se abre después: si se abría
 * mientras la hoja todavía se cerraba, iOS la ignoraba y había que tocar dos veces
 */
const CIERRE_HOJA_MS = 400;

/**
 * Pregunta de dónde sacar la foto: galería o cámara (en iOS con la hoja nativa). En la web no
 * hay cámara: abre la galería directo.
 */
function preguntarOrigen(
  titulo: string,
  alElegir: (origen: OrigenFoto) => void,
) {
  if (Platform.OS === "web") {
    alElegir("galeria");
    return;
  }
  const onElegir = (origen: OrigenFoto) =>
    setTimeout(() => alElegir(origen), CIERRE_HOJA_MS);
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        title: titulo,
        options: ["Elegir de la galería", "Tomar foto", "Cancelar"],
        cancelButtonIndex: 2,
      },
      (indice) => {
        if (indice === 0) onElegir("galeria");
        if (indice === 1) onElegir("camara");
      },
    );
    return;
  }
  Alert.alert(titulo, undefined, [
    { text: "Cancelar", style: "cancel" },
    { text: "Tomar foto", onPress: () => onElegir("camara") },
    { text: "Elegir de la galería", onPress: () => onElegir("galeria") },
  ]);
}

/**
 * Las fotos de la publicación, como se verán al publicarla: la principal en grande y, abajo y
 * encima de ella, los cuadros chicos opcionales (igual que en la información de la
 * publicación): se ven 2 y, al lado, un "+" para agregar otra (hasta 4 chicas). Tocar
 * cualquier cuadro pregunta si la foto sale de la galería o de la cámara (en uno con foto, la
 * cambia); cada foto se quita con su X. Los chicos se activan cuando ya hay foto principal.
 */
export function FotosPublicacion({
  fotos,
  ocupado,
  onElegir,
  onQuitar,
}: {
  fotos: readonly string[];
  ocupado: boolean;
  /** `indice` es el cuadro tocado: uno vacío agrega la foto al final, uno lleno la cambia */
  onElegir: (indice: number, origen: OrigenFoto) => void;
  onQuitar: (indice: number) => void;
}) {
  const { isDark } = useAppTheme();
  // Gris un poco más oscuro que el formulario: sobre él se ve el borde blanco punteado
  const fondo = isDark ? "rgba(255,255,255,0.06)" : "#E6E7EB";
  const icono = isDark ? "#A9A5B7" : "#667085";
  // Suave, pero que se distinga sobre el fondo gris
  const camaraSuave = isDark ? "rgba(255,255,255,0.28)" : "#B6BAC4";
  // Borde blanco punteado de los cuadros vacíos
  const filo = isDark ? "rgba(255,255,255,0.35)" : "#FFFFFF";

  const cuadro = (i: number) => {
    const foto = fotos[i];
    const principal = i === 0;
    // Uno vacío agrega al final; los chicos esperan a que haya foto principal
    const indice = foto ? i : fotos.length;
    const activo =
      !ocupado && (foto !== undefined || principal || fotos.length > 0);
    const tocar = () =>
      preguntarOrigen(
        foto ? "Cambiar foto" : principal ? "Foto principal" : "Agregar foto",
        (origen) => onElegir(indice, origen),
      );

    return (
      <PressableScale
        key={principal ? "principal" : `chica-${i}`}
        accessibilityRole="button"
        accessibilityLabel={
          foto
            ? `Cambiar la foto ${i + 1}`
            : principal
              ? "Agregar la foto principal"
              : "Agregar una foto (opcional)"
        }
        accessibilityState={{ disabled: !activo }}
        disabled={!activo}
        onPress={tocar}
        scaleTo={principal ? 0.98 : 0.94}
        style={[
          principal ? styles.grande : styles.chica,
          // Vacíos: el mismo fondo en la grande y en las chicas, con borde blanco punteado
          // para que se note que ahí van fotos. Las chicas con foto llevan filo blanco
          foto
            ? principal
              ? null
              : styles.chicaConFoto
            : [styles.vacio, { backgroundColor: fondo, borderColor: filo }],
          !principal && !activo && !foto ? styles.apagado : null,
        ]}
      >
        {foto ? (
          <>
            <Image
              source={{ uri: foto }}
              contentFit="cover"
              style={StyleSheet.absoluteFill}
            />
            {principal ? (
              <View style={styles.etiqueta}>
                <Text style={styles.etiquetaTexto}>Principal</Text>
              </View>
            ) : null}
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={`Quitar la foto ${i + 1}`}
              onPress={() => onQuitar(i)}
              scaleTo={0.88}
              hitSlop={6}
              style={[styles.quitar, principal && styles.quitarGrande]}
            >
              <Ionicons
                name="close"
                size={principal ? 17 : 14}
                color="#FFFFFF"
              />
            </PressableScale>
          </>
        ) : principal ? (
          <View style={styles.vacioGrande}>
            {/* Suave: un gris claro que no compite con el resto */}
            <IconoCamara size={40} color={camaraSuave} />
            <Text style={[styles.vacioTexto, { color: icono }]}>
              Agrega la foto principal
            </Text>
            <Text style={[styles.vacioAyuda, { color: icono }]}>
              Es la que se ve primero
            </Text>
          </View>
        ) : (
          <Ionicons name="add" size={24} color={icono} />
        )}
      </PressableScale>
    );
  };

  // Las chicas con foto y, si faltan, vacías hasta llegar a 2; luego el "+" si caben más
  const chicasConFoto = Math.max(0, fotos.length - 1);
  const cuadrosChicos = Math.max(CHICAS_VISIBLES, chicasConFoto);
  const conMas = chicasConFoto < MAX_FOTOS - 1;
  const masActivo = !ocupado && fotos.length > 0;

  return (
    <View>
      {cuadro(0)}
      {/* Encima de la grande, abajo y al centro */}
      <View pointerEvents="box-none" style={styles.fila}>
        {Array.from({ length: cuadrosChicos }, (_, i) => cuadro(i + 1))}
        {conMas ? (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Agregar otra foto (opcional)"
            accessibilityState={{ disabled: !masActivo }}
            disabled={!masActivo}
            onPress={() =>
              preguntarOrigen("Agregar foto", (origen) =>
                onElegir(fotos.length, origen),
              )
            }
            scaleTo={0.9}
            style={[styles.mas, { opacity: masActivo ? 1 : 0.55 }]}
          >
            <Ionicons name="add" size={26} color="#FFFFFF" />
          </PressableScale>
        ) : null}
      </View>
    </View>
  );
}

/** Lado de cada cuadro chico (en la publicación miden 70; aquí un poco menos de ancho) */
const LADO_CHICA = 64;

const styles = StyleSheet.create({
  // Cuadrada, como se ve en la publicación
  grande: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 28,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  fila: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 14,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  chica: {
    width: LADO_CHICA,
    height: LADO_CHICA,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  chicaConFoto: { borderWidth: 2, borderColor: "#FFFFFF" },
  // Cuadro vacío: borde blanco punteado ("con espacios")
  vacio: { borderWidth: 2, borderStyle: "dashed" },
  apagado: { opacity: 0.55 },
  // El "+": un botón redondo, distinto de los cuadros, para agregar otra foto
  mas: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  vacioGrande: { alignItems: "center", gap: 4 },
  vacioTexto: { fontSize: 14.5, fontWeight: "600", marginTop: 4 },
  vacioAyuda: { fontSize: 12.5 },
  etiqueta: {
    position: "absolute",
    left: 12,
    top: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 9,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  etiquetaTexto: { color: "#FFFFFF", fontSize: 11.5, fontWeight: "600" },
  quitar: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  quitarGrande: { top: 12, right: 12, width: 30, height: 30, borderRadius: 15 },
});
