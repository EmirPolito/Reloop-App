import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { PressableSuave } from "@/components/PressableSuave";
import { OrbAvatar } from "@/components/ui/OrbAvatar";
import { BackArrowIcon } from "@/features/chats/components/ThreadIcons";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { useImagePicker } from "@/hooks/useImagePicker";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { showErrorAlert } from "@/utils/alerts";
import { getInitials } from "@/utils/text";
import { BrilloAvatar } from "../components/BrilloAvatar";
import { PerfilPortada } from "../components/PerfilPortada";
import { fondoPerfil } from "../perfilEstilos";
import { IconoFlecha } from "../Perfiliconos";
import {
  DESCRIPCION_POR_DEFECTO,
  MAX_DESCRIPCION,
  MAX_NOMBRE,
  MAX_PILDORAS,
  type DatosPerfil,
} from "../Perfiltemas";
import { PildoraPerfil } from "../Pildoraperfil";
import { useProfile } from "../ProfileProvider";
import { CampoDescripcion } from "./CampoDescripcion";
import { CampoEnLinea } from "./CampoEnLinea";
import { CampoUsername } from "./CampoUsername";
import {
  DURACION_EDITAR,
  EASE_EDITAR,
  INTER,
  coloresEditar,
} from "./editarTema";
import { SheetAvatar } from "./SheetAvatar";
import { SheetEtiquetas } from "./SheetEtiquetas";

const LADO_AVATAR = 120;
const ALTO_FONDO = 300;
/** Lo que tarda en cerrarse un drawer */
const CIERRE_DRAWER_MS = 450;

/** Editar perfil: avatar, nombre y descripción editables ahí mismo, y opciones abajo */
export function PantallaEditarPerfil() {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { back } = useAppNavigation();
  const { profile, saveProfile } = useProfile();
  const c = coloresEditar(isDark);
  const fondo = fondoPerfil(isDark);

  const [sheet, setSheet] = useState<"avatar" | "etiquetas" | null>(null);
  const { pickCoverImage, isPicking } = useImagePicker();
  const [guardandoFondo, setGuardandoFondo] = useState(false);

  // Si se abre un drawer mientras el anterior aún termina de cerrarse, su animación de cierre
  // lo vuelve a cerrar (por eso a veces "no entraba"). Se espera a que termine.
  const cerradoEn = useRef(0);
  const abrir = (cual: "avatar" | "etiquetas") => {
    const espera = CIERRE_DRAWER_MS - (Date.now() - cerradoEn.current);
    if (espera > 0) setTimeout(() => setSheet(cual), espera);
    else setSheet(cual);
  };
  const cerrarSheet = () => {
    cerradoEn.current = Date.now();
    setSheet(null);
  };

  /** Cada cambio se guarda al confirmarlo; si falla se avisa y se relanza el error */
  const guardar = async (cambios: Partial<DatosPerfil>) => {
    try {
      await saveProfile({ ...profile, ...cambios });
    } catch (error) {
      showErrorAlert("No se pudieron guardar los cambios", error);
      throw error;
    }
  };

  /** Elegir, cambiar o quitar el fondo de perfil (`null` lo quita) */
  const cambiarFondo = async (quitar = false) => {
    if (guardandoFondo || isPicking) return;
    const cover = quitar ? null : await pickCoverImage();
    if (!quitar && !cover) return;
    setGuardandoFondo(true);
    try {
      await guardar({ cover });
    } catch {
      // guardar ya mostró el aviso
    } finally {
      setGuardandoFondo(false);
    }
  };

  const textoNombre = {
    ...INTER.semibold,
    fontSize: 22,
    letterSpacing: -0.6,
    color: c.texto,
  };
  const textoDescripcion = {
    ...INTER.regular,
    fontSize: 13.5,
    lineHeight: 19,
    color: c.texto,
  };

  return (
    <View style={{ flex: 1, backgroundColor: fondo }}>
      {/* Fondo superior: degradado opaco de gris a blanco que se funde con la pantalla */}
      <View
        pointerEvents="none"
        style={[styles.fondo, { height: ALTO_FONDO + insets.top }]}
      >
        {/* Con portada, la imagen elegida; sin ella, el degradado gris de siempre */}
        {profile.cover ? (
          <PerfilPortada cover={profile.cover} isDark={isDark} />
        ) : (
          <LinearGradient
            colors={
              isDark
                ? ["#2A3446", "#1A2130", fondo]
                : ["#dbdbdbff", "#E2E3E7", fondo]
            }
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Volver al perfil: mismo botón que en la conversación para volver a los chats */}
        <View style={styles.barra}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Volver al perfil"
            onPress={back}
            scaleTo={0.92}
            style={[
              styles.botonVolver,
              { backgroundColor: c.boton, borderColor: c.bordeBoton },
            ]}
          >
            <View style={{ transform: [{ translateX: -1.5 }] }}>
              <BackArrowIcon size={26} color={c.texto} />
            </View>
          </PressableScale>
        </View>

        {/* Avatar */}
        <Animated.View entering={FadeIn.duration(260)} style={styles.centro}>
          <PressableSuave
            accessibilityRole="button"
            accessibilityLabel="Cambiar foto de perfil"
            onPress={() => abrir("avatar")}
          >
            <View style={[styles.avatar, { backgroundColor: c.avatarFondo }]}>
              {profile.photo ? (
                <>
                  <Image
                    source={{
                      uri:
                        optimizedImageUrl(profile.photo, 400) ?? profile.photo,
                    }}
                    contentFit="cover"
                    transition={200}
                    style={StyleSheet.absoluteFill}
                  />
                  <BrilloAvatar id="editar-avatar" />
                </>
              ) : profile.orb !== null ? (
                <OrbAvatar
                  orb={profile.orb}
                  name={profile.name}
                  size={LADO_AVATAR}
                />
              ) : (
                <Text style={[INTER.medium, { fontSize: 38, color: c.texto }]}>
                  {getInitials(profile.name)}
                </Text>
              )}
            </View>
          </PressableSuave>
        </Animated.View>

        {/* Nombre, etiquetas y descripción */}
        <Animated.View
          entering={FadeInDown.duration(DURACION_EDITAR + 80)
            .delay(60)
            .easing(EASE_EDITAR)}
          style={[
            styles.centro,
            { gap: 12, marginTop: 16, paddingHorizontal: 20 },
          ]}
        >
          <CampoEnLinea
            value={profile.name}
            placeholder="Tu nombre"
            maxLength={MAX_NOMBRE}
            requerido
            textStyle={textoNombre}
            iconColor={c.suave}
            accessibilityLabel="nombre"
            onSave={(name) => guardar({ name })}
          />

          <CampoUsername username={profile.username} isDark={isDark} />

          {profile.pills.length > 0 ? (
            <View style={styles.pildoras}>
              {profile.pills.map((pill) => (
                <PildoraPerfil
                  key={pill.id}
                  text={pill.text}
                  color={pill.color}
                  icon={pill.icon}
                  isDark={isDark}
                />
              ))}
            </View>
          ) : null}

          <CampoDescripcion
            value={profile.description}
            placeholder={DESCRIPCION_POR_DEFECTO}
            maxLength={MAX_DESCRIPCION}
            textStyle={textoDescripcion}
            borde={isDark ? "#334155" : "#DEDEE3"}
            placeholderColor={c.suave}
            onSave={(description) => guardar({ description })}
          />
        </Animated.View>

        {/* Opciones */}
        <Animated.View
          entering={FadeInDown.duration(DURACION_EDITAR + 80)
            .delay(120)
            .easing(EASE_EDITAR)}
          style={[styles.tarjeta, { backgroundColor: c.tarjeta }]}
        >
          <Fila
            icono="person-circle-outline"
            texto="Foto de perfil"
            isDark={isDark}
            onPress={() => abrir("avatar")}
          />
          <View style={[styles.divisor, { backgroundColor: c.divisor }]} />
          <Fila
            icono="image-outline"
            texto="Fondo de perfil"
            isDark={isDark}
            onPress={() => void cambiarFondo()}
            derecha={
              guardandoFondo ? (
                <ActivityIndicator size="small" color={c.suave} />
              ) : profile.cover ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Quitar fondo de perfil"
                  hitSlop={10}
                  onPress={() => void cambiarFondo(true)}
                >
                  <Text
                    style={[INTER.medium, { fontSize: 13.5, color: "#FF3B30" }]}
                  >
                    Quitar
                  </Text>
                </Pressable>
              ) : null
            }
          />
          <View style={[styles.divisor, { backgroundColor: c.divisor }]} />
          <Fila
            icono="pricetag-outline"
            texto="Etiquetas"
            isDark={isDark}
            onPress={() => abrir("etiquetas")}
            derecha={
              <Text style={[INTER.regular, { fontSize: 13.5, color: c.suave }]}>
                {profile.pills.length}/{MAX_PILDORAS}
              </Text>
            }
          />
        </Animated.View>
      </ScrollView>

      <SheetAvatar
        visible={sheet === "avatar"}
        photo={profile.photo}
        orb={profile.orb}
        name={profile.name}
        isDark={isDark}
        onClose={cerrarSheet}
        onGuardar={guardar}
      />
      <SheetEtiquetas
        visible={sheet === "etiquetas"}
        pills={profile.pills}
        isDark={isDark}
        onClose={cerrarSheet}
        onGuardar={(pills) =>
          guardar({
            pills: pills
              .map((x) => ({ ...x, text: x.text.trim() }))
              .filter((x) => x.text.length > 0),
          })
        }
      />
    </View>
  );
}

/** Fila de la tarjeta de opciones: icono, texto y flecha */
function Fila({
  icono,
  texto,
  isDark,
  onPress,
  derecha,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  texto: string;
  isDark: boolean;
  onPress: () => void;
  derecha?: ReactNode;
}) {
  const c = coloresEditar(isDark);
  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={texto}
      onPress={onPress}
      style={styles.fila}
    >
      <Ionicons name={icono} size={21} color={c.icono} />
      <Text style={[INTER.medium, { flex: 1, fontSize: 14.5, color: c.texto }]}>
        {texto}
      </Text>
      {derecha}
      <IconoFlecha size={20} color={c.suave} />
    </PressableSuave>
  );
}

const styles = StyleSheet.create({
  fondo: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  barra: { paddingHorizontal: 16, height: 52, justifyContent: "center" },
  botonVolver: {
    width: 45,
    height: 45,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  centro: { alignItems: "center" },
  avatar: {
    width: LADO_AVATAR,
    height: LADO_AVATAR,
    borderRadius: LADO_AVATAR / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  pildoras: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  tarjeta: {
    marginHorizontal: 16,
    marginTop: 30,
    borderRadius: 19,
    paddingVertical: 4,
    elevation: 0.4,
  },
  fila: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  divisor: { height: StyleSheet.hairlineWidth, marginLeft: 49 },
});
