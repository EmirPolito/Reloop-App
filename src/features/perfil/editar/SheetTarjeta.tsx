import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, View, useWindowDimensions } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { Product } from "@/features/marketplace/types";
import { Text, TextInput } from "@/features/shared/Text";
import {
  NOTA_POR_DEFECTO,
  TarjetaVendedor,
} from "../components/TarjetaVendedor";
import {
  COLORES_DESTACADO,
  MAX_DESTACADO,
  MAX_NOTA,
  type ColorDestacado,
  type DatosPerfil,
  type DisenoTarjeta,
} from "../temasPerfil";
import { INTER, coloresEditar } from "./editarTema";
import { BotonGuardar } from "./BotonGuardar";
import { HOST_SESION, SheetEditar } from "./SheetEditar";
import { PALETA } from "../drawer/temaDrawer";

/** Orden de los colores al tocar el círculo de un campo (`null` = el del texto de la tarjeta) */
const CICLO_COLORES: (ColorDestacado | null)[] = [
  null,
  "amarillo",
  "rojo",
  "verde",
];
function siguienteColor(actual: ColorDestacado | null) {
  return CICLO_COLORES[
    (CICLO_COLORES.indexOf(actual) + 1) % CICLO_COLORES.length
  ];
}

/** Palomita que se lee sobre el color de un círculo (oscura sobre amarillo y blanco) */
function colorPalomita(relleno: string) {
  return relleno === "#FFFFFF" || relleno === COLORES_DESTACADO.amarillo.fondo
    ? "#101010"
    : "#FFFFFF";
}

/**
 * Lo que se guarda: sin color de fondo, color del texto ni imagen (la tarjeta sigue el tema;
 * los que hubiera de antes se borran) y sin textos vacíos
 */
function normalizar(diseno: DisenoTarjeta): DisenoTarjeta {
  return {
    ...diseno,
    fondo: null,
    texto: null,
    imagen: null,
    destacado: diseno.destacado?.trim() || null,
    nota: diseno.nota?.trim() || null,
  };
}

/**
 * Drawer del diseño de la tarjeta de publicaciones: la franja de abajo (la píldora y el
 * mensaje, cada uno con un círculo dentro del campo que cambia su color), la vista previa con
 * la tarjeta real y el botón de guardar. Todo va en un scroll para que nunca se salga del drawer.
 */
export function SheetTarjeta({
  visible,
  diseno,
  items,
  perfil,
  ownerId,
  isDark,
  onClose,
  onGuardar,
}: {
  visible: boolean;
  diseno: DisenoTarjeta;
  /** Publicaciones y perfil de la persona, para la vista previa con la tarjeta real */
  items: Product[];
  perfil: DatosPerfil;
  ownerId: string;
  isDark: boolean;
  onClose: () => void;
  /** Guarda el diseño; si falla lanza (y ya avisó) */
  onGuardar: (diseno: DisenoTarjeta) => Promise<void>;
}) {
  const c = coloresEditar(isDark);
  const insets = useSafeAreaInsets();
  const { height: altoVentana } = useWindowDimensions();
  const [borrador, setBorrador] = useState(diseno);
  const [guardando, setGuardando] = useState(false);

  // Al abrir, el borrador vuelve a lo guardado (ajuste de estado durante el render)
  const [abiertoAntes, setAbiertoAntes] = useState(visible);
  if (visible !== abiertoAntes) {
    setAbiertoAntes(visible);
    if (visible) setBorrador(diseno);
  }

  const vista = normalizar(borrador);
  const fondoCampo = PALETA[isDark ? "oscuro" : "claro"].campo;

  const guardar = async () => {
    if (guardando) return;
    setGuardando(true);
    try {
      await onGuardar(normalizar(borrador));
      onClose();
    } catch {
      // Ya se avisó; se queda abierto para reintentar
    } finally {
      setGuardando(false);
    }
  };

  /**
   * Círculo dentro de un campo, a la izquierda: sin borde, con el color elegido y una palomita;
   * al tocarlo pasa al siguiente color
   */
  const circulo = (
    valor: ColorDestacado | null,
    etiqueta: string,
    onCambio: (valor: ColorDestacado | null) => void,
  ) => {
    // Automático: el color del texto de la franja (sigue el tema)
    const relleno = valor
      ? COLORES_DESTACADO[valor].fondo
      : isDark
        ? "#FFFFFF"
        : "#101010";
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Cambiar el color de ${etiqueta}`}
        accessibilityValue={{
          text: valor ? COLORES_DESTACADO[valor].nombre : "Automático",
        }}
        hitSlop={8}
        onPress={() => onCambio(siguienteColor(valor))}
        style={[styles.circulo, { backgroundColor: relleno }]}
      >
        <Ionicons name="checkmark" size={16} color={colorPalomita(relleno)} />
      </Pressable>
    );
  };

  return (
    <SheetEditar
      visible={visible}
      titulo="Diseño de la tarjeta"
      isDark={isDark}
      onClose={onClose}
      // El contenido se desplaza: solo la línea de arriba arrastra el drawer
      permitirArrastrarContenido={false}
      // La vista previa es la tarjeta real: necesita la sesión, el tema y los favoritos
      hostName={HOST_SESION}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // El alto que deja el drawer (ventana menos zona segura, encabezado y márgenes)
        style={{ maxHeight: altoVentana - insets.top - insets.bottom - 130 }}
        contentContainerStyle={styles.cuerpo}
      >
        <Text style={[INTER.medium, styles.etiqueta, { color: c.suave }]}>
          Inferior (puedes cambiar el color)
        </Text>
        <View style={[styles.campo, { backgroundColor: fondoCampo }]}>
          {circulo(borrador.colorDestacado, "la píldora", (valor) =>
            setBorrador((b) => ({ ...b, colorDestacado: valor })),
          )}
          <TextInput
            value={borrador.destacado ?? ""}
            onChangeText={(t) => setBorrador((b) => ({ ...b, destacado: t }))}
            maxLength={MAX_DESTACADO}
            placeholder="Texto resaltado (ej. Nuevo)"
            placeholderTextColor={c.suave}
            selectionColor={c.texto}
            accessibilityLabel="Texto resaltado de la franja"
            style={[INTER.medium, styles.input, { color: c.texto }]}
          />
        </View>
        <View style={[styles.campo, { backgroundColor: fondoCampo }]}>
          {circulo(borrador.colorNota, "el mensaje", (valor) =>
            setBorrador((b) => ({ ...b, colorNota: valor })),
          )}
          <TextInput
            value={borrador.nota ?? ""}
            onChangeText={(t) => setBorrador((b) => ({ ...b, nota: t }))}
            maxLength={MAX_NOTA}
            placeholder={NOTA_POR_DEFECTO}
            placeholderTextColor={c.suave}
            selectionColor={c.texto}
            accessibilityLabel="Mensaje de la franja"
            style={[INTER.medium, styles.input, { color: c.texto }]}
          />
        </View>

        <Text
          style={[
            INTER.medium,
            styles.etiqueta,
            styles.separada,
            { color: c.suave },
          ]}
        >
          Vista previa
        </Text>
        {/* La tarjeta real con el diseño del borrador; solo para ver, no se toca */}
        <View pointerEvents="none">
          <TarjetaVendedor
            items={items}
            profile={{ ...perfil, tarjeta: vista }}
            ownerId={ownerId}
            isOwn
            isDark={isDark}
            onOpen={() => {}}
            onPersonalizar={() => {}}
          />
        </View>

        <BotonGuardar
          texto="Guardar diseño"
          isDark={isDark}
          guardando={guardando}
          atenuarAlGuardar
          onPress={() => void guardar()}
          style={styles.principal}
        />
      </ScrollView>
    </SheetEditar>
  );
}

const styles = StyleSheet.create({
  // Contenido del drawer
  cuerpo: { paddingHorizontal: 17, gap: 10, paddingTop: 4 },
  // Título de cada grupo
  etiqueta: { fontSize: 13, marginTop: 2 },
  // La vista previa, más separada de los campos
  separada: { marginTop: 22 },
  // Campo de texto con el círculo de color dentro, a la izquierda
  campo: {
    height: 46,
    borderRadius: 30,
    paddingLeft: 10,
    paddingRight: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: { flex: 1, minWidth: 0, fontSize: 14.5, paddingVertical: 0 },
  circulo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  opcionTexto: { fontSize: 14.5 },
  // Botón de guardar
  principal: { marginTop: 10 },
});
