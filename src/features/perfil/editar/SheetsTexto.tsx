import { Ionicons } from "@expo/vector-icons";
import { useBottomSheetAwareHandlers } from "heroui-native";
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  View,
} from "react-native";

import { Text, TextInput } from "@/features/shared/Text";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import { useUsernameDisponible } from "../hooks/useUsernameDisponible";
import { MAX_USERNAME, normalizarUsername } from "../nombreUsuario";
import { UsernameError, claimUsername } from "../repositorioUsername";
import { ALTO_CONTENIDO_SHEET, INTER, coloresEditar } from "./editarTema";
import { BotonGuardar } from "./BotonGuardar";
import { SheetEditar } from "./SheetEditar";

const VERDE = "#4CD694";
const ROJO = "#FF7A7A";
const LADO_ESTADO = 34;

/** El texto de un drawer parte del valor guardado cada vez que se abre (ajuste durante el render) */
function useTextoDeSheet(visible: boolean, inicial: string) {
  const [texto, setTexto] = useState(inicial);
  const [abiertoAntes, setAbiertoAntes] = useState(visible);
  if (visible !== abiertoAntes) {
    setAbiertoAntes(visible);
    if (visible) setTexto(inicial);
  }
  return [texto, setTexto] as const;
}

/* -------------------------------------------------------------------------- */
/*  Contenido común: campo grande con línea (o cuadro) y botón de guardar      */
/* -------------------------------------------------------------------------- */

function CampoSheet({
  isDark,
  texto,
  onTexto,
  placeholder,
  maxLength,
  multiline = false,
  prefijo,
  estado,
  aviso,
  textoBoton,
  listo,
  guardando,
  onGuardar,
  teclado,
}: {
  isDark: boolean;
  texto: string;
  onTexto: (valor: string) => void;
  placeholder: string;
  maxLength: number;
  multiline?: boolean;
  prefijo?: string;
  estado?: ReactNode;
  aviso?: string | null;
  textoBoton: string;
  listo: boolean;
  guardando: boolean;
  onGuardar: () => void;
  teclado: ReturnType<typeof useBottomSheetAwareHandlers>;
}) {
  const c = coloresEditar(isDark);
  const inactivo = !listo || guardando;
  const colorCampo = isDark ? "#17233A" : "#F2F2F2";

  return (
    // Tocar fuera del campo baja el teclado
    <Pressable
      accessible={false}
      onPress={Keyboard.dismiss}
      style={styles.paso}
    >
      <View style={styles.centro}>
        <View
          style={
            multiline
              ? [styles.cuadro, { backgroundColor: colorCampo }]
              : undefined
          }
        >
          <View style={styles.fila}>
            {prefijo ? (
              <Text
                style={[INTER.semibold, styles.prefijo, { color: c.suave }]}
              >
                {prefijo}
              </Text>
            ) : null}
            <TextInput
              {...teclado}
              value={texto}
              onChangeText={onTexto}
              autoCapitalize={prefijo ? "none" : "sentences"}
              autoCorrect={!prefijo}
              spellCheck={!prefijo}
              maxLength={maxLength}
              multiline={multiline}
              submitBehavior="blurAndSubmit"
              returnKeyType="done"
              placeholder={placeholder}
              placeholderTextColor={c.suave}
              selectionColor={c.texto}
              cursorColor={c.texto}
              underlineColorAndroid="transparent"
              onSubmitEditing={onGuardar}
              accessibilityLabel={placeholder}
              style={[
                multiline ? INTER.regular : INTER.semibold,
                multiline ? styles.inputCuadro : styles.input,
                { color: c.texto },
              ]}
            />
            {estado}
          </View>
          {multiline ? null : (
            <View style={[styles.linea, { backgroundColor: c.divisor }]} />
          )}
        </View>

        {aviso ? (
          <Text
            accessibilityLiveRegion="polite"
            style={[INTER.regular, styles.aviso, { color: "#FF3B30" }]}
          >
            {aviso}
          </Text>
        ) : null}
      </View>

      <BotonGuardar
        texto={textoBoton}
        isDark={isDark}
        guardando={guardando}
        disabled={inactivo}
        onPress={onGuardar}
      />
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/*  Nombre y descripción                                                      */
/* -------------------------------------------------------------------------- */

interface PropsSheetTexto {
  visible: boolean;
  valor: string;
  isDark: boolean;
  /** Cada cambio del texto, para la vista previa en vivo */
  onTexto: (valor: string) => void;
  /** `guardado` es true si se confirmó el cambio */
  onClose: (guardado: boolean) => void;
  /** Guarda el texto; si falla lanza (y ya avisó) */
  onGuardar: (valor: string) => Promise<void>;
}

function ContenidoTextoSimple({
  visible,
  valor,
  isDark,
  onTexto,
  onClose,
  onGuardar,
  placeholder,
  maxLength,
  multiline,
  requerido,
}: PropsSheetTexto & {
  placeholder: string;
  maxLength: number;
  multiline: boolean;
  requerido: boolean;
}) {
  const teclado = useBottomSheetAwareHandlers();
  const [texto, setTexto] = useTextoDeSheet(visible, valor);
  const [guardando, setGuardando] = useState(false);
  const limpio = texto.trim();
  const listo = (!requerido || limpio.length > 0) && limpio !== valor.trim();

  const guardar = async () => {
    if (!listo || guardando) return;
    setGuardando(true);
    try {
      Keyboard.dismiss();
      await onGuardar(limpio);
      onClose(true);
    } catch {
      // Ya se avisó; se queda para reintentar
    } finally {
      setGuardando(false);
    }
  };

  return (
    <CampoSheet
      isDark={isDark}
      texto={texto}
      onTexto={(v) => {
        setTexto(v);
        onTexto(v);
      }}
      placeholder={placeholder}
      maxLength={maxLength}
      multiline={multiline}
      textoBoton="Guardar"
      listo={listo}
      guardando={guardando}
      onGuardar={() => void guardar()}
      teclado={teclado}
    />
  );
}

export function SheetNombre(props: PropsSheetTexto & { maxLength: number }) {
  return (
    <SheetEditar
      visible={props.visible}
      titulo="Nombre"
      isDark={props.isDark}
      onClose={() => props.onClose(false)}
    >
      <ContenidoTextoSimple
        {...props}
        placeholder="Tu nombre"
        multiline={false}
        requerido
      />
    </SheetEditar>
  );
}

export function SheetDescripcion(
  props: PropsSheetTexto & { maxLength: number },
) {
  return (
    <SheetEditar
      visible={props.visible}
      titulo="Descripción"
      isDark={props.isDark}
      onClose={() => props.onClose(false)}
    >
      <ContenidoTextoSimple
        {...props}
        placeholder="Nada que decir"
        multiline
        requerido={false}
      />
    </SheetEditar>
  );
}

/* -------------------------------------------------------------------------- */
/*  Username                                                                  */
/* -------------------------------------------------------------------------- */

function ContenidoUsername({
  visible,
  uid,
  username,
  isDark,
  onTexto,
  onClose,
}: {
  visible: boolean;
  uid: string;
  username: string | null;
  isDark: boolean;
  onTexto: (valor: string) => void;
  onClose: (guardado: boolean) => void;
}) {
  const c = coloresEditar(isDark);
  const teclado = useBottomSheetAwareHandlers();
  const [texto, setTexto] = useTextoDeSheet(visible, username ?? "");
  const [guardando, setGuardando] = useState(false);
  const disponibilidad = useUsernameDisponible(texto, username, uid);
  const nuevo = normalizarUsername(texto);
  const listo = disponibilidad.estado === "disponible";

  const aviso =
    disponibilidad.estado === "invalido"
      ? disponibilidad.mensaje
      : disponibilidad.estado === "ocupado"
        ? `@${nuevo} ya está en uso`
        : disponibilidad.estado === "error"
          ? "No se pudo revisar, intenta de nuevo"
          : null;

  const guardar = () => {
    if (!listo || guardando) return;
    Keyboard.dismiss();
    showAlert(
      `¿Cambiar tu usuario a @${nuevo}?`,
      username
        ? `@${username} quedará libre y otra persona podrá usarlo.`
        : undefined,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cambiar",
          onPress: () => {
            setGuardando(true);
            claimUsername(uid, nuevo)
              .then(() => onClose(true))
              .catch((error) => {
                if (error instanceof UsernameError) {
                  showAlert("No se pudo cambiar tu usuario", error.message);
                } else {
                  showErrorAlert("No se pudo cambiar tu usuario", error);
                }
              })
              .finally(() => setGuardando(false));
          },
        },
      ],
    );
  };

  const estado =
    disponibilidad.estado === "verificando" ? (
      <View style={styles.estado}>
        <ActivityIndicator size="small" color={c.suave} />
      </View>
    ) : disponibilidad.estado === "disponible" ? (
      <View style={[styles.estado, styles.circulo, { backgroundColor: VERDE }]}>
        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
      </View>
    ) : disponibilidad.estado === "sinCambios" ? (
      <View style={styles.estado} />
    ) : (
      <View style={[styles.estado, styles.circulo, { backgroundColor: ROJO }]}>
        <Ionicons name="close" size={20} color="#FFFFFF" />
      </View>
    );

  return (
    <CampoSheet
      isDark={isDark}
      texto={texto}
      // Se muestra ya normalizado: así se ve exactamente lo que se guardará
      onTexto={(v) => {
        const normalizado = normalizarUsername(v);
        setTexto(normalizado);
        onTexto(normalizado);
      }}
      placeholder="usuario"
      maxLength={MAX_USERNAME}
      prefijo="@"
      estado={estado}
      aviso={aviso}
      textoBoton={listo ? "Guardar" : "Elige un usuario disponible"}
      listo={listo}
      guardando={guardando}
      onGuardar={guardar}
      teclado={teclado}
    />
  );
}

export function SheetUsername({
  visible,
  uid,
  username,
  isDark,
  onTexto,
  onClose,
}: {
  visible: boolean;
  /** Llega por prop: el drawer vive fuera de los proveedores de sesión */
  uid: string;
  username: string | null;
  isDark: boolean;
  onTexto: (valor: string) => void;
  onClose: (guardado: boolean) => void;
}) {
  return (
    <SheetEditar
      visible={visible}
      titulo="Username"
      isDark={isDark}
      onClose={() => onClose(false)}
    >
      <ContenidoUsername
        visible={visible}
        uid={uid}
        username={username}
        isDark={isDark}
        onTexto={onTexto}
        onClose={onClose}
      />
    </SheetEditar>
  );
}

const styles = StyleSheet.create({
  // Mismo alto que los demás drawers (avatar y fondo)
  paso: {
    paddingHorizontal: 17,
    paddingTop: 4,
    gap: 26,
    minHeight: ALTO_CONTENIDO_SHEET,
    justifyContent: "space-between",
  },
  centro: { gap: 14, flex: 1, justifyContent: "center" },
  fila: { flexDirection: "row", alignItems: "center", gap: 8 },
  prefijo: { fontSize: 26, lineHeight: 34 },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 26,
    lineHeight: 34,
    letterSpacing: -0.5,
    paddingVertical: 0,
    textAlign: "center",
  },
  linea: { height: 1.5, marginTop: 6 },
  // Descripción: cuadro con el texto, separado un poco por arriba y por abajo
  cuadro: { borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14 },
  inputCuadro: {
    flex: 1,
    minWidth: 0,
    minHeight: 96,
    fontSize: 15,
    lineHeight: 21,
    paddingVertical: 0,
    textAlign: "center",
    textAlignVertical: "center",
  },
  estado: {
    width: LADO_ESTADO,
    height: LADO_ESTADO,
    alignItems: "center",
    justifyContent: "center",
  },
  circulo: { borderRadius: LADO_ESTADO / 2 },
  aviso: { fontSize: 12.5, textAlign: "center" },
});
