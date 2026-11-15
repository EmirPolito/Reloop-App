import { Ionicons } from "@expo/vector-icons";
import { useBottomSheetAwareHandlers } from "heroui-native";
import { useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  StyleSheet,
  View,
  type TextInputProps,
} from "react-native";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { useUsernameAvailability } from "@/features/perfil/hooks/useUsernameAvailability";
import {
  MAX_DESCRIPCION,
  MAX_NOMBRE,
  MAX_PILDORAS,
  type DatosPerfil,
} from "@/features/perfil/Perfiltemas";
import { MAX_USERNAME, normalizarUsername } from "@/features/perfil/username";
import {
  UsernameError,
  claimUsername,
} from "@/features/perfil/usernameRepository";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { Text, TextInput } from "@/features/shared/Text";
import { useImagePicker } from "@/hooks/useImagePicker";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import { BotonPaso } from "../components/BotonPaso";
import { BotonPalomita, ChipEtiqueta } from "../components/Piezas";
import { puedeFinalizar } from "../onboardingRules";
import { LETRA, coloresOnboarding } from "../temaOnboarding";

const LADO_AVATAR = 62;
/** Lo que se muestra mientras no hay descripción */
const SIN_DESCRIPCION = "Sin nada que decir";
const VERDE = "#12915F";

/** Avisos de foco para que el drawer suba con el teclado y vuelva al cerrarlo */
type Teclado = Pick<TextInputProps, "onFocus" | "onBlur">;

/**
 * Último paso: el perfil ya organizado. Avatar a la izquierda y, a su derecha, el nombre y
 * el @usuario (con su lápiz) centrados con el avatar, y la descripción debajo. Abajo una
 * card con el fondo, el avatar y las etiquetas.
 */
export function PasoPerfil({
  profile,
  isDark,
  onGuardar,
  onFinalizar,
  onAvatar,
  onEtiquetas,
}: {
  profile: DatosPerfil;
  isDark: boolean;
  /** Guarda cambios; si falla lanza (y ya avisó) */
  onGuardar: (cambios: Partial<DatosPerfil>) => Promise<void>;
  onFinalizar: () => Promise<void>;
  onAvatar: () => void;
  onEtiquetas: () => void;
}) {
  const c = coloresOnboarding(isDark);
  const teclado = useBottomSheetAwareHandlers();
  const { pickCoverImage, isPicking } = useImagePicker();
  const [guardandoFondo, setGuardandoFondo] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const listo = puedeFinalizar(profile.username);

  const cambiarFondo = async () => {
    if (guardandoFondo || isPicking) return;
    const cover = await pickCoverImage();
    if (!cover) return;
    setGuardandoFondo(true);
    try {
      await onGuardar({ cover });
    } catch {
      // Ya se avisó
    } finally {
      setGuardandoFondo(false);
    }
  };

  const finalizar = async () => {
    if (finalizando || !listo) return;
    setFinalizando(true);
    try {
      await onFinalizar();
    } catch {
      // Ya se avisó; se queda para reintentar
    } finally {
      setFinalizando(false);
    }
  };

  return (
    <View style={styles.paso}>
      {/* ── Avatar y, a su derecha, nombre y @usuario (centrados con el avatar) y la
          descripción debajo ── */}
      <View style={styles.cabecera}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cambiar avatar"
          onPress={onAvatar}
        >
          <UserAvatar
            photo={profile.photo}
            orb={profile.orb}
            name={profile.name}
            size={LADO_AVATAR}
          />
        </Pressable>
        <View style={styles.identidad}>
          <View style={styles.nombreYUsuario}>
            <NombreEnLinea
              nombre={profile.name}
              isDark={isDark}
              teclado={teclado}
              onGuardar={(name) => onGuardar({ name })}
            />
            <UsernameEnLinea
              username={profile.username}
              isDark={isDark}
              teclado={teclado}
            />
          </View>
          <DescripcionEnLinea
            descripcion={profile.description}
            isDark={isDark}
            teclado={teclado}
            onGuardar={(description) => onGuardar({ description })}
          />
        </View>
      </View>

      {/* ── Etiquetas ── */}
      {profile.pills.length > 0 ? (
        <View style={styles.etiquetas}>
          {profile.pills.map((etiqueta) => (
            <ChipEtiqueta
              key={etiqueta.id}
              etiqueta={etiqueta}
              isDark={isDark}
            />
          ))}
        </View>
      ) : null}

      {/* ── Opciones ── */}
      <View style={[styles.tarjeta, { backgroundColor: c.tarjeta }]}>
        <Opcion
          icono="image-outline"
          texto="Fondo de perfil"
          isDark={isDark}
          onPress={() => void cambiarFondo()}
          // Con el fondo ya elegido, una palomita en lugar de la flecha
          final={
            guardandoFondo ? (
              <ActivityIndicator size="small" color={c.suave} />
            ) : profile.cover ? (
              <Ionicons name="checkmark" size={20} color={VERDE} />
            ) : undefined
          }
        />
        <View style={[styles.divisor, { backgroundColor: c.divisor }]} />
        <Opcion
          icono="person-circle-outline"
          texto="Cambiar avatar"
          isDark={isDark}
          onPress={onAvatar}
        />
        <View style={[styles.divisor, { backgroundColor: c.divisor }]} />
        <Opcion
          icono="pricetag-outline"
          texto="Cambiar etiquetas"
          isDark={isDark}
          onPress={onEtiquetas}
          derecha={
            <Text style={[LETRA.regular, { fontSize: 13.5, color: c.suave }]}>
              {profile.pills.length}/{MAX_PILDORAS}
            </Text>
          }
        />
      </View>

      <View style={styles.final}>
        <BotonPaso
          texto={listo ? "Finalizar" : "Asignando tu usuario…"}
          isDark={isDark}
          cargando={finalizando}
          deshabilitado={!listo}
          onPress={() => void finalizar()}
        />
        <Text style={[LETRA.regular, styles.pie, { color: c.suave }]}>
          Puedes cambiar todo luego en Editar perfil
        </Text>
      </View>
    </View>
  );
}

/** Nombre con su lápiz; al tocarlo se escribe ahí mismo (sin fondo) */
function NombreEnLinea({
  nombre,
  isDark,
  teclado,
  onGuardar,
}: {
  nombre: string;
  isDark: boolean;
  teclado: Teclado;
  onGuardar: (nombre: string) => Promise<void>;
}) {
  const c = coloresOnboarding(isDark);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(nombre);
  const [guardando, setGuardando] = useState(false);
  const limpio = texto.trim();

  const terminar = async () => {
    if (!limpio || limpio === nombre) {
      setEditando(false);
      Keyboard.dismiss();
      return;
    }
    setGuardando(true);
    try {
      await onGuardar(limpio);
      setEditando(false);
      Keyboard.dismiss();
    } catch {
      // Ya se avisó; sigue editando
    } finally {
      setGuardando(false);
    }
  };

  if (!editando) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Editar nombre"
        onPress={() => {
          setTexto(nombre);
          setEditando(true);
        }}
        hitSlop={6}
        style={styles.lectura}
      >
        <Text
          numberOfLines={1}
          style={[
            LETRA.semibold,
            styles.nombre,
            styles.encoger,
            { color: c.texto },
          ]}
        >
          {nombre}
        </Text>
        <Ionicons name="pencil" size={14} color={c.suave} />
      </Pressable>
    );
  }

  return (
    <View style={styles.enLinea}>
      <TextInput
        {...teclado}
        autoFocus
        value={texto}
        onChangeText={setTexto}
        maxLength={MAX_NOMBRE}
        placeholder="Tu nombre"
        placeholderTextColor={c.suave}
        selectionColor={c.texto}
        cursorColor={c.texto}
        underlineColorAndroid="transparent"
        returnKeyType="done"
        onSubmitEditing={() => void terminar()}
        accessibilityLabel="Nombre"
        style={[
          LETRA.semibold,
          styles.nombre,
          styles.inputEnLinea,
          { color: c.texto },
        ]}
      />
      <BotonPalomita
        isDark={isDark}
        etiqueta="Guardar nombre"
        cargando={guardando}
        deshabilitado={!limpio}
        onPress={() => void terminar()}
      />
    </View>
  );
}

/**
 * @usuario con su lápiz; al tocarlo se escribe ahí mismo (sin fondo). Mientras se revisa si
 * está libre gira un indicador y, si lo está, a la derecha aparece "Disponible" con su
 * palomita. No hay que confirmarlo: se guarda al terminar (tecla de listo o tocar fuera).
 */
function UsernameEnLinea({
  username,
  isDark,
  teclado,
}: {
  username: string | null;
  isDark: boolean;
  teclado: Teclado;
}) {
  const c = coloresOnboarding(isDark);
  const { uid } = useSessionUser();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(username ?? "");
  const [guardando, setGuardando] = useState(false);
  const disponibilidad = useUsernameAvailability(texto, username, uid);
  const nuevo = normalizarUsername(texto);

  const cerrar = () => {
    setEditando(false);
    Keyboard.dismiss();
  };

  /** Al terminar de escribir: guarda si está libre; si no sirve, regresa al que tenía */
  const terminar = async () => {
    if (guardando) return;
    // Aún se está revisando: se sigue editando hasta saber si está libre
    if (disponibilidad.estado === "verificando") return;
    if (disponibilidad.estado !== "disponible") {
      setTexto(username ?? "");
      cerrar();
      return;
    }
    setGuardando(true);
    try {
      await claimUsername(uid, nuevo);
      cerrar();
    } catch (error) {
      if (error instanceof UsernameError) {
        showAlert("No se pudo cambiar tu usuario", error.message);
      } else {
        showErrorAlert("No se pudo cambiar tu usuario", error);
      }
    } finally {
      setGuardando(false);
    }
  };

  if (!editando) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Editar usuario"
        onPress={() => {
          setTexto(username ?? "");
          setEditando(true);
        }}
        hitSlop={6}
        style={styles.lectura}
      >
        <Text style={[LETRA.regular, styles.username, { color: c.suave }]}>
          {username ? `@${username}` : "Asignando tu usuario…"}
        </Text>
        <Ionicons name="pencil" size={14} color={c.suave} />
      </Pressable>
    );
  }

  // Solo los problemas van debajo (son textos largos); "Disponible" va a la derecha
  const aviso =
    disponibilidad.estado === "invalido"
      ? disponibilidad.mensaje
      : disponibilidad.estado === "ocupado"
        ? `@${nuevo} ya está en uso`
        : disponibilidad.estado === "error"
          ? "No se pudo revisar, intenta de nuevo"
          : null;

  return (
    <View>
      <View style={styles.usernameFila}>
        <Text style={[LETRA.regular, styles.username, { color: c.suave }]}>
          @
        </Text>
        <TextInput
          {...teclado}
          onBlur={(e) => {
            teclado.onBlur?.(e);
            void terminar();
          }}
          autoFocus
          value={texto}
          // Se muestra ya normalizado: así se ve exactamente lo que se guardará
          onChangeText={(v) => setTexto(normalizarUsername(v))}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          maxLength={MAX_USERNAME}
          placeholder="usuario"
          placeholderTextColor={c.suave}
          selectionColor={c.texto}
          cursorColor={c.texto}
          underlineColorAndroid="transparent"
          returnKeyType="done"
          onSubmitEditing={() => void terminar()}
          accessibilityLabel="Usuario"
          style={[
            LETRA.regular,
            styles.username,
            styles.inputUsername,
            { color: c.texto },
          ]}
        />
        {disponibilidad.estado === "verificando" || guardando ? (
          <ActivityIndicator
            size="small"
            color={c.suave}
            accessibilityLabel="Revisando si está disponible"
          />
        ) : disponibilidad.estado === "disponible" ? (
          <View
            accessible
            accessibilityLabel={`@${nuevo} está disponible`}
            style={styles.disponible}
          >
            <Text style={[LETRA.medium, styles.textoDisponible]}>
              Disponible
            </Text>
            <View style={styles.palomitaDisponible}>
              <Ionicons name="checkmark" size={11} color="#FFFFFF" />
            </View>
          </View>
        ) : null}
      </View>
      {aviso ? (
        <Text
          accessibilityLiveRegion="polite"
          style={[LETRA.regular, styles.aviso, { color: c.error }]}
        >
          {aviso}
        </Text>
      ) : null}
    </View>
  );
}

/**
 * Descripción debajo del @usuario, con su lápiz; al tocarlo se escribe ahí mismo (sin
 * fondo), así lo que se escribe se ve en su lugar. Mientras no hay, "Sin nada que decir".
 */
function DescripcionEnLinea({
  descripcion,
  isDark,
  teclado,
  onGuardar,
}: {
  descripcion: string;
  isDark: boolean;
  teclado: Teclado;
  onGuardar: (descripcion: string) => Promise<void>;
}) {
  const c = coloresOnboarding(isDark);
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(descripcion);
  const [guardando, setGuardando] = useState(false);

  const terminar = async () => {
    const limpio = texto.trim();
    if (limpio === descripcion.trim()) {
      setEditando(false);
      Keyboard.dismiss();
      return;
    }
    setGuardando(true);
    try {
      await onGuardar(limpio);
      setEditando(false);
      Keyboard.dismiss();
    } catch {
      // Ya se avisó; sigue editando
    } finally {
      setGuardando(false);
    }
  };

  if (!editando) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Editar descripción"
        onPress={() => {
          setTexto(descripcion);
          setEditando(true);
        }}
        hitSlop={6}
        style={[styles.lectura, styles.descripcionLectura]}
      >
        <Text
          numberOfLines={3}
          style={[
            LETRA.regular,
            styles.descripcion,
            styles.encoger,
            { color: descripcion ? c.texto : c.suave },
          ]}
        >
          {descripcion || SIN_DESCRIPCION}
        </Text>
        <Ionicons name="pencil" size={14} color={c.suave} />
      </Pressable>
    );
  }

  // Misma fila y mismo alto que al leerla: el texto no se mueve al pasar a editar
  return (
    <View style={[styles.lectura, styles.descripcionLectura, styles.ancho]}>
      <TextInput
        {...teclado}
        autoFocus
        value={texto}
        onChangeText={setTexto}
        maxLength={MAX_DESCRIPCION}
        multiline
        scrollEnabled={false}
        placeholder={SIN_DESCRIPCION}
        placeholderTextColor={c.suave}
        selectionColor={c.texto}
        cursorColor={c.texto}
        underlineColorAndroid="transparent"
        accessibilityLabel="Descripción"
        style={[
          LETRA.regular,
          styles.descripcion,
          styles.inputDescripcion,
          { color: c.texto },
        ]}
      />
      <BotonPalomita
        isDark={isDark}
        etiqueta="Guardar descripción"
        tamano={20}
        cargando={guardando}
        onPress={() => void terminar()}
      />
    </View>
  );
}

/**
 * Fila de la card de opciones: icono, texto, lo de la derecha y, al final, la flecha
 * (o lo que se pase en `final`, como la palomita del fondo).
 */
function Opcion({
  icono,
  texto,
  isDark,
  onPress,
  derecha,
  final,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  texto: string;
  isDark: boolean;
  onPress: () => void;
  derecha?: ReactNode;
  final?: ReactNode;
}) {
  const c = coloresOnboarding(isDark);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={texto}
      onPress={onPress}
      style={({ pressed }) => [styles.opcion, pressed && { opacity: 0.6 }]}
    >
      <Ionicons name={icono} size={21} color={c.icono} />
      <Text style={[LETRA.medium, styles.textoOpcion, { color: c.texto }]}>
        {texto}
      </Text>
      {derecha}
      {final ?? <Ionicons name="chevron-forward" size={18} color={c.suave} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  paso: { paddingHorizontal: 17, gap: 16 },
  cabecera: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  identidad: { flex: 1, minWidth: 0 },
  // Del alto del avatar: nombre y @usuario quedan centrados con él
  nombreYUsuario: { minHeight: LADO_AVATAR, justifyContent: "center", gap: 2 },
  nombre: { fontSize: 20, letterSpacing: -0.5 },
  username: { fontSize: 14.5 },
  descripcion: { fontSize: 14, lineHeight: 20 },
  descripcionLectura: { marginTop: 2, alignItems: "flex-start" },
  ancho: { alignSelf: "stretch" },
  // Sin márgenes ni relleno propios: ocupa exactamente lo mismo que el texto
  inputDescripcion: {
    flex: 1,
    minWidth: 0,
    margin: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlignVertical: "top",
    includeFontPadding: false,
  },
  lectura: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  encoger: { flexShrink: 1 },
  enLinea: { flexDirection: "row", alignItems: "center", gap: 6 },
  // El @ pegado al username
  usernameFila: { flexDirection: "row", alignItems: "center" },
  inputUsername: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginLeft: 1,
  },
  disponible: { flexDirection: "row", alignItems: "center", gap: 5 },
  textoDisponible: { fontSize: 12.5, color: VERDE },
  palomitaDisponible: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: VERDE,
    alignItems: "center",
    justifyContent: "center",
  },
  inputEnLinea: { flex: 1, minWidth: 0, paddingVertical: 0 },
  aviso: { fontSize: 12, marginTop: 2 },
  // Separadas de la descripción
  etiquetas: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  tarjeta: { borderRadius: 19, paddingVertical: 4, marginTop: 22 },
  opcion: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  textoOpcion: { flex: 1, fontSize: 14.5 },
  divisor: { height: StyleSheet.hairlineWidth, marginLeft: 49 },
  final: { gap: 10, marginTop: 12 },
  pie: { fontSize: 12, textAlign: "center" },
});
