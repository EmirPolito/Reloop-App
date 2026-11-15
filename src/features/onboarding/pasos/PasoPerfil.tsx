import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { useUsernameAvailability } from "@/features/perfil/hooks/useUsernameAvailability";
import {
  DESCRIPCION_POR_DEFECTO,
  MAX_DESCRIPCION,
  MAX_NOMBRE,
  MAX_PILDORAS,
  type DatosPerfil,
} from "@/features/perfil/Perfiltemas";
import {
  MAX_USERNAME,
  MENSAJE_INVALIDO,
  normalizarUsername,
  validarUsername,
} from "@/features/perfil/username";
import {
  UsernameError,
  claimUsername,
} from "@/features/perfil/usernameRepository";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { Text, TextInput } from "@/features/shared/Text";
import { useImagePicker } from "@/hooks/useImagePicker";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import { BotonPaso } from "../components/BotonPaso";
import { BotonPalomita, ChipEtiqueta } from "../components/Piezas";
import { puedeFinalizar } from "../onboardingRules";
import { LETRA, coloresOnboarding } from "../temaOnboarding";

const LADO_AVATAR = 62;

type UsernameLocal = { valor: string; onCambiar: (username: string) => void };

/**
 * Último paso: el perfil ya organizado. Avatar a la izquierda y, a su derecha, el nombre y
 * el @usuario (cada uno con su lápiz); debajo la descripción y las etiquetas. Abajo una
 * card con el fondo de perfil (con su miniatura), el avatar y las etiquetas.
 */
export function PasoPerfil({
  profile,
  isDark,
  onGuardar,
  onFinalizar,
  onAvatar,
  onEtiquetas,
  usernameLocal,
}: {
  profile: DatosPerfil;
  isDark: boolean;
  /** Guarda cambios; si falla lanza (y ya avisó) */
  onGuardar: (cambios: Partial<DatosPerfil>) => Promise<void>;
  onFinalizar: () => Promise<void>;
  onAvatar: () => void;
  onEtiquetas: () => void;
  /** Registro: el @usuario se escribe aquí sin consultar si está libre */
  usernameLocal?: UsernameLocal;
}) {
  const c = coloresOnboarding(isDark);
  const { pickCoverImage, isPicking } = useImagePicker();
  const [guardandoFondo, setGuardandoFondo] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [editandoDescripcion, setEditandoDescripcion] = useState(false);
  const listo = usernameLocal
    ? validarUsername(usernameLocal.valor) === null
    : puedeFinalizar(profile.username);

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
          {/* Nombre y @usuario en un bloque del alto del avatar: quedan centrados con él */}
          <View style={styles.nombreYUsuario}>
            <CampoEditable
              valor={profile.name}
              placeholder="Tu nombre"
              maxLength={MAX_NOMBRE}
              isDark={isDark}
              estiloTexto={[LETRA.semibold, styles.nombre, { color: c.texto }]}
              etiqueta="nombre"
              validar={(v) => (v.trim() ? null : "Escribe tu nombre")}
              onGuardar={(name) => onGuardar({ name: name.trim() })}
            />
            {usernameLocal ? (
              <UsernameEnRegistro local={usernameLocal} isDark={isDark} />
            ) : (
              <UsernameEnApp username={profile.username} isDark={isDark} />
            )}
          </View>
          {/* Descripción debajo del @usuario (se cambia desde la opción de abajo) */}
          {profile.description ? (
            <Text
              numberOfLines={3}
              style={[
                LETRA.regular,
                styles.descripcion,
                styles.descripcionCabecera,
                { color: c.texto },
              ]}
            >
              {profile.description}
            </Text>
          ) : null}
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
          derecha={
            guardandoFondo ? (
              <ActivityIndicator size="small" color={c.suave} />
            ) : profile.cover ? (
              <MiniFondo cover={profile.cover} />
            ) : undefined
          }
          // Con fondo elegido, su miniatura va en lugar de la flecha
          sinFlecha={guardandoFondo || profile.cover !== null}
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
          icono="document-text-outline"
          texto="Cambiar descripción"
          isDark={isDark}
          onPress={() => setEditandoDescripcion((actual) => !actual)}
        />
        {/* Al tocar la opción, el campo para escribirla aparece debajo */}
        {editandoDescripcion ? (
          <Animated.View
            entering={FadeIn.duration(160)}
            style={styles.editorOpcion}
          >
            <CampoEditable
              valor={profile.description}
              placeholder={DESCRIPCION_POR_DEFECTO}
              maxLength={MAX_DESCRIPCION}
              multiline
              editandoInicial
              fondoCampo={c.hoja}
              isDark={isDark}
              estiloTexto={[
                LETRA.regular,
                styles.descripcion,
                { color: c.texto },
              ]}
              etiqueta="descripción"
              onGuardar={(description) =>
                onGuardar({ description: description.trim() })
              }
              onTerminar={() => setEditandoDescripcion(false)}
            />
          </Animated.View>
        ) : null}
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
          texto={listo || usernameLocal ? "Finalizar" : "Asignando tu usuario…"}
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

/**
 * Texto con un lápiz a la derecha; al tocarlo se vuelve un campo negro y la palomita
 * aparece cuando hay un cambio válido.
 */
function CampoEditable({
  valor,
  placeholder,
  maxLength,
  multiline = false,
  isDark,
  estiloTexto,
  etiqueta,
  validar,
  onGuardar,
  editandoInicial = false,
  onTerminar,
  fondoCampo,
}: {
  valor: string;
  placeholder: string;
  maxLength: number;
  multiline?: boolean;
  isDark: boolean;
  estiloTexto: object;
  etiqueta: string;
  validar?: (valor: string) => string | null;
  onGuardar: (valor: string) => Promise<void>;
  /** Abre ya en modo edición (lo abre otra opción, sin lápiz) */
  editandoInicial?: boolean;
  /** Al guardar o salir sin cambios */
  onTerminar?: () => void;
  /** Fondo del campo al editar (dentro de la card va en blanco para distinguirse) */
  fondoCampo?: string;
}) {
  const c = coloresOnboarding(isDark);
  const [editando, setEditandoInterno] = useState(editandoInicial);
  const setEditando = (valor: boolean) => {
    setEditandoInterno(valor);
    if (!valor) onTerminar?.();
  };
  const [texto, setTexto] = useState(valor);
  const [guardando, setGuardando] = useState(false);
  const error = validar?.(texto) ?? null;
  const cambio = texto.trim() !== valor.trim();

  const guardar = async () => {
    if (!cambio || error) {
      setEditando(false);
      return;
    }
    setGuardando(true);
    try {
      await onGuardar(texto);
      setEditando(false);
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
        accessibilityLabel={`Editar ${etiqueta}`}
        onPress={() => {
          setTexto(valor);
          setEditando(true);
        }}
        hitSlop={6}
        style={styles.lectura}
      >
        <Text
          numberOfLines={multiline ? 3 : 1}
          style={[estiloTexto, !valor && { color: c.suave }, styles.flexible]}
        >
          {valor || placeholder}
        </Text>
        <Ionicons
          name="pencil"
          size={14}
          color={c.suave}
          style={styles.lapiz}
        />
      </Pressable>
    );
  }

  return (
    <View style={styles.editando}>
      <View
        style={[
          styles.campo,
          multiline && styles.campoMultilinea,
          { backgroundColor: fondoCampo ?? c.campo },
        ]}
      >
        <TextInput
          autoFocus
          value={texto}
          onChangeText={setTexto}
          maxLength={maxLength}
          multiline={multiline}
          placeholder={placeholder}
          placeholderTextColor={c.campoPlaceholder}
          selectionColor={c.campoTexto}
          cursorColor={c.campoTexto}
          underlineColorAndroid="transparent"
          returnKeyType="done"
          blurOnSubmit
          onSubmitEditing={() => void guardar()}
          accessibilityLabel={etiqueta}
          style={[
            LETRA.regular,
            styles.input,
            multiline && styles.inputMultilinea,
            { color: c.campoTexto },
          ]}
        />
        {cambio && !error ? (
          <BotonPalomita
            isDark={isDark}
            etiqueta={`Guardar ${etiqueta}`}
            cargando={guardando}
            onPress={() => void guardar()}
          />
        ) : null}
      </View>
      {error ? (
        <Text style={[LETRA.regular, styles.error, { color: c.error }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** @usuario en el registro: solo se valida el formato (aún no se puede ver si está libre) */
function UsernameEnRegistro({
  local,
  isDark,
}: {
  local: UsernameLocal;
  isDark: boolean;
}) {
  return (
    <CampoEditable
      valor={local.valor ? `@${local.valor}` : ""}
      placeholder="@usuario"
      maxLength={MAX_USERNAME + 1}
      isDark={isDark}
      estiloTexto={[
        LETRA.regular,
        styles.username,
        { color: coloresOnboarding(isDark).suave },
      ]}
      etiqueta="usuario"
      validar={(v) => {
        const m = validarUsername(normalizarUsername(v));
        return m ? MENSAJE_INVALIDO[m] : null;
      }}
      onGuardar={async (v) => local.onCambiar(normalizarUsername(v))}
    />
  );
}

/** @usuario dentro de la app: consulta en vivo si está libre y lo reserva al confirmar */
function UsernameEnApp({
  username,
  isDark,
}: {
  username: string | null;
  isDark: boolean;
}) {
  const c = coloresOnboarding(isDark);
  const { uid } = useSessionUser();
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(username ?? "");
  const [guardando, setGuardando] = useState(false);
  const disponibilidad = useUsernameAvailability(texto, username, uid);
  const nuevo = normalizarUsername(texto);

  const guardar = async () => {
    if (disponibilidad.estado !== "disponible") return;
    setGuardando(true);
    try {
      await claimUsername(uid, nuevo);
      setEditando(false);
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
        <Ionicons
          name="pencil"
          size={14}
          color={c.suave}
          style={styles.lapiz}
        />
      </Pressable>
    );
  }

  const aviso =
    disponibilidad.estado === "invalido"
      ? disponibilidad.mensaje
      : disponibilidad.estado === "ocupado"
        ? `@${nuevo} ya está en uso`
        : disponibilidad.estado === "error"
          ? "No se pudo revisar, intenta de nuevo"
          : null;

  return (
    <View style={styles.editando}>
      <View style={[styles.campo, { backgroundColor: c.campo }]}>
        <Text
          style={[LETRA.regular, { fontSize: 15, color: c.campoPlaceholder }]}
        >
          @
        </Text>
        <TextInput
          autoFocus
          value={texto}
          onChangeText={(v) => setTexto(normalizarUsername(v))}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          maxLength={MAX_USERNAME}
          placeholder="usuario"
          placeholderTextColor={c.campoPlaceholder}
          selectionColor={c.campoTexto}
          cursorColor={c.campoTexto}
          underlineColorAndroid="transparent"
          returnKeyType="done"
          onSubmitEditing={() => void guardar()}
          accessibilityLabel="Usuario"
          style={[LETRA.regular, styles.input, { color: c.campoTexto }]}
        />
        {disponibilidad.estado === "verificando" ? (
          <ActivityIndicator size="small" color={c.campoPlaceholder} />
        ) : disponibilidad.estado === "disponible" ? (
          <BotonPalomita
            isDark={isDark}
            etiqueta="Guardar usuario"
            cargando={guardando}
            onPress={() => void guardar()}
          />
        ) : disponibilidad.estado === "sinCambios" ? (
          <BotonPalomita
            isDark={isDark}
            etiqueta="Listo"
            onPress={() => setEditando(false)}
          />
        ) : null}
      </View>
      {aviso ? (
        <Text style={[LETRA.regular, styles.error, { color: c.error }]}>
          {aviso}
        </Text>
      ) : null}
    </View>
  );
}

/** Fila de la card de opciones: icono, texto, lo de la derecha y flecha */
function Opcion({
  icono,
  texto,
  isDark,
  onPress,
  derecha,
  sinFlecha = false,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  texto: string;
  isDark: boolean;
  onPress: () => void;
  derecha?: ReactNode;
  sinFlecha?: boolean;
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
      <View style={styles.textoOpcion}>
        <Text style={[LETRA.medium, { fontSize: 14.5, color: c.texto }]}>
          {texto}
        </Text>
      </View>
      {derecha}
      {sinFlecha ? null : (
        <Ionicons name="chevron-forward" size={18} color={c.suave} />
      )}
    </Pressable>
  );
}

/** Miniatura del fondo elegido, a la derecha de su opción */
function MiniFondo({ cover }: { cover: string }) {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.miniFondo}>
      <Image
        source={{ uri: optimizedImageUrl(cover, 200) ?? cover }}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  paso: { paddingHorizontal: 17, gap: 16 },
  cabecera: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  identidad: { flex: 1, minWidth: 0 },
  nombreYUsuario: { minHeight: LADO_AVATAR, justifyContent: "center", gap: 2 },
  nombre: { fontSize: 20, letterSpacing: -0.5 },
  username: { fontSize: 14.5 },
  descripcion: { fontSize: 14, lineHeight: 20 },
  lectura: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  flexible: { flexShrink: 1 },
  lapiz: { marginTop: 1 },
  editando: { gap: 4 },
  campo: {
    minHeight: 48,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 14,
    paddingRight: 7,
    gap: 6,
  },
  campoMultilinea: { alignItems: "flex-end", paddingVertical: 7 },
  input: { flex: 1, minWidth: 0, fontSize: 15, paddingVertical: 0 },
  inputMultilinea: {
    minHeight: 40,
    maxHeight: 96,
    textAlignVertical: "top",
    paddingTop: 4,
  },
  error: { fontSize: 12, marginLeft: 4 },
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
  textoOpcion: { flex: 1, minWidth: 0, gap: 1 },
  descripcionCabecera: { marginTop: 2 },
  editorOpcion: { paddingHorizontal: 12, paddingBottom: 10 },
  divisor: { height: StyleSheet.hairlineWidth, marginLeft: 49 },
  miniFondo: { width: 52, height: 34, borderRadius: 10, overflow: "hidden" },
  final: { gap: 10, marginTop: 12 },
  pie: { fontSize: 12, textAlign: "center" },
});
