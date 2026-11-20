import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";

import { PressableSuave } from "@/components/PressableSuave";
import { Text } from "@/features/shared/Text";
import { useImagePicker } from "@/hooks/useImagePicker";
import {
  coloresTarjetaVendedor,
  FondoImagenTarjeta,
  primerNombre,
} from "../components/TarjetaVendedor";
import {
  FONDOS_TARJETA,
  type DisenoTarjeta,
  type TextoTarjeta,
} from "../Perfiltemas";
import { INTER, coloresEditar } from "./editarTema";
import { SheetEditar } from "./SheetEditar";

/**
 * Drawer del diseño de la tarjeta de publicaciones: color de fondo, color del texto (para que
 * se lea sobre fondos oscuros o con imagen) y una imagen de fondo opcional. Arriba, una
 * muestra de cómo queda.
 */
export function SheetTarjeta({
  visible,
  diseno,
  nombre,
  isDark,
  onClose,
  onGuardar,
}: {
  visible: boolean;
  diseno: DisenoTarjeta;
  /** Nombre de la persona, para la muestra ("Post de ...") */
  nombre: string;
  isDark: boolean;
  onClose: () => void;
  /** Guarda el diseño; si falla lanza (y ya avisó) */
  onGuardar: (diseno: DisenoTarjeta) => Promise<void>;
}) {
  const c = coloresEditar(isDark);
  const { pickCoverImage, isPicking } = useImagePicker();
  const [borrador, setBorrador] = useState(diseno);
  const [guardando, setGuardando] = useState(false);

  // Al abrir, el borrador vuelve a lo guardado (ajuste de estado durante el render)
  const [abiertoAntes, setAbiertoAntes] = useState(visible);
  if (visible !== abiertoAntes) {
    setAbiertoAntes(visible);
    if (visible) setBorrador(diseno);
  }

  const colores = coloresTarjetaVendedor(borrador, isDark);
  const textoActual: TextoTarjeta =
    borrador.texto ??
    FONDOS_TARJETA.find((f) => f.color === borrador.fondo)?.texto ??
    (colores.principal === "#FFFFFF" ? "claro" : "oscuro");

  const elegirColor = (color: string, texto: TextoTarjeta) =>
    // Al cambiar el fondo, el texto pasa al que mejor se lee sobre él
    setBorrador((b) => ({ ...b, fondo: color, texto }));

  const elegirImagen = async () => {
    if (isPicking) return;
    const uri = await pickCoverImage();
    if (uri) setBorrador((b) => ({ ...b, imagen: uri }));
  };

  const guardar = async () => {
    if (guardando) return;
    setGuardando(true);
    try {
      await onGuardar(borrador);
      onClose();
    } catch {
      // Ya se avisó; se queda abierto para reintentar
    } finally {
      setGuardando(false);
    }
  };

  return (
    <SheetEditar
      visible={visible}
      titulo="Diseño de la tarjeta"
      isDark={isDark}
      onClose={onClose}
    >
      <View style={styles.cuerpo}>
        {/* Muestra */}
        <View style={[styles.muestra, { backgroundColor: colores.fondo }]}>
          {borrador.imagen ? (
            <FondoImagenTarjeta uri={borrador.imagen} color={colores.fondo} />
          ) : null}
          <Text style={[styles.muestraTexto, { color: colores.principal }]}>
            Post de {primerNombre(nombre)}
          </Text>
        </View>

        <Text style={[INTER.medium, styles.etiqueta, { color: c.suave }]}>
          Fondo
        </Text>
        <View style={styles.colores}>
          {FONDOS_TARJETA.map((f) => {
            const elegido = borrador.fondo === f.color;
            return (
              <Pressable
                key={f.color}
                accessibilityRole="button"
                accessibilityLabel={`Fondo ${f.nombre}`}
                accessibilityState={{ selected: elegido }}
                onPress={() => elegirColor(f.color, f.texto)}
                style={[
                  styles.color,
                  { backgroundColor: f.color, borderColor: c.divisor },
                  elegido && { borderColor: c.texto, borderWidth: 2.5 },
                ]}
              />
            );
          })}
        </View>

        <Text style={[INTER.medium, styles.etiqueta, { color: c.suave }]}>
          Color del texto
        </Text>
        <View style={styles.fila}>
          {(["oscuro", "claro"] as const).map((valor) => {
            const elegido = textoActual === valor;
            return (
              <PressableSuave
                key={valor}
                accessibilityRole="button"
                accessibilityLabel={`Texto ${valor}`}
                accessibilityState={{ selected: elegido }}
                onPress={() => setBorrador((b) => ({ ...b, texto: valor }))}
                style={[
                  styles.opcion,
                  { backgroundColor: isDark ? "#17233A" : "#F2F2F2" },
                  elegido && { borderColor: c.texto, borderWidth: 2 },
                ]}
              >
                <Text
                  style={[INTER.medium, { fontSize: 14.5, color: c.texto }]}
                >
                  {valor === "oscuro" ? "Oscuro" : "Claro"}
                </Text>
              </PressableSuave>
            );
          })}
        </View>

        <Text style={[INTER.medium, styles.etiqueta, { color: c.suave }]}>
          Imagen de fondo (opcional)
        </Text>
        <View style={styles.fila}>
          <PressableSuave
            accessibilityRole="button"
            accessibilityLabel="Elegir imagen de fondo"
            disabled={isPicking || guardando}
            onPress={() => void elegirImagen()}
            style={[
              styles.opcion,
              { backgroundColor: isDark ? "#17233A" : "#F2F2F2" },
            ]}
          >
            <Ionicons name="images-outline" size={20} color={c.texto} />
            <Text style={[INTER.medium, { fontSize: 14.5, color: c.texto }]}>
              Elegir
            </Text>
          </PressableSuave>
          {borrador.imagen ? (
            <PressableSuave
              accessibilityRole="button"
              accessibilityLabel="Quitar imagen de fondo"
              disabled={guardando}
              onPress={() => setBorrador((b) => ({ ...b, imagen: null }))}
              style={[
                styles.opcion,
                { backgroundColor: isDark ? "#17233A" : "#F2F2F2" },
              ]}
            >
              <Ionicons name="trash-outline" size={20} color={c.texto} />
              <Text style={[INTER.medium, { fontSize: 14.5, color: c.texto }]}>
                Quitar
              </Text>
            </PressableSuave>
          ) : null}
        </View>

        <PressableSuave
          accessibilityRole="button"
          accessibilityLabel="Guardar diseño"
          disabled={guardando}
          onPress={() => void guardar()}
          style={[
            styles.principal,
            { backgroundColor: c.texto },
            guardando && { opacity: 0.6 },
          ]}
        >
          {guardando ? (
            <ActivityIndicator color={isDark ? "#101010" : "#FFFFFF"} />
          ) : (
            <Text
              style={[
                INTER.medium,
                { fontSize: 14.5, color: isDark ? "#101010" : "#FFFFFF" },
              ]}
            >
              Guardar diseño
            </Text>
          )}
        </PressableSuave>
      </View>
    </SheetEditar>
  );
}

const styles = StyleSheet.create({
  // Contenido del drawer
  cuerpo: { paddingHorizontal: 17, gap: 10, paddingTop: 4 },
  // Muestra del diseño
  muestra: {
    height: 70,
    borderRadius: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  muestraTexto: { fontFamily: "Inter_600SemiBold", fontSize: 18 },
  // Título de cada grupo
  etiqueta: { fontSize: 13, marginTop: 4 },
  // Círculos de color
  colores: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  color: { width: 40, height: 40, borderRadius: 20, borderWidth: 1 },
  // Botones de dos en fila
  fila: { flexDirection: "row", gap: 12 },
  opcion: {
    flex: 1,
    height: 46,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  // Botón de guardar
  principal: {
    height: 50,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
});
