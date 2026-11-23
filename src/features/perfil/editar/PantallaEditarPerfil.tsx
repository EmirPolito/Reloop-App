import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { conSalida } from "@/components/salidaModulo";
import { estiloTarjetaCristal } from "@/components/ui/cristalSuave";
import { ENTRADA_MODULO } from "@/constants/motion";
import { BackArrowIcon } from "@/features/chats/components/IconosConversacion";
import { useNavegacion } from "@/features/navigation/useNavegacion";
import { useIsPremium } from "@/features/premium/hooks/useMembership";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { showErrorAlert } from "@/utils/alerts";
import { FilaAjuste, ListaAjustes } from "../components/FilaAjuste";
import { coloresTarjeta, fondoPerfil } from "../estilos";
import {
  IconoCaritaLinea,
  IconoFlecha,
  IconoImagenLinea,
} from "../iconosPerfil";
import {
  MAX_DESCRIPCION,
  MAX_NOMBRE,
  MAX_PILDORAS,
  type DatosPerfil,
  type PildoraPerfilData,
} from "../temasPerfil";
import { useProfile } from "../ProveedorPerfil";
import { SheetAvatar } from "./SheetAvatar";
import { SheetEtiquetas } from "./SheetEtiquetas";
import { SheetFondo } from "./SheetFondo";
import { SheetDescripcion, SheetNombre, SheetUsername } from "./SheetsTexto";
import { VistaPreviaPerfil } from "./VistaPreviaPerfil";

/** Entrada de la pantalla: fundido con un desplazamiento corto, como las demás */
const ENTRADA = FadeInDown.duration(ENTRADA_MODULO.timing.duration + 90)
  .easing(ENTRADA_MODULO.timing.easing)
  .withInitialValues({
    transform: [{ translateY: ENTRADA_MODULO.desplazamiento * 2 }],
  });

/** Lo que tarda en cerrarse un drawer */
const CIERRE_DRAWER_MS = 450;
/** Lo que se espera a que un drawer recién montado esté listo */
const MONTAJE_DRAWER_MS = 80;

type Sheet =
  "fondo" | "avatar" | "etiquetas" | "nombre" | "username" | "descripcion";

/** Cambios en curso que la vista previa muestra antes de guardarlos */
interface Borrador {
  name?: string;
  username?: string;
  description?: string;
  pills?: PildoraPerfilData[];
}

/**
 * Editar perfil: arriba, una vista previa en tiempo real del perfil; debajo, una tarjeta
 * con las opciones (fondo, foto o avatar, etiquetas, nombre, username y descripción) que
 * se editan en drawers.
 */
export function PantallaEditarPerfil() {
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { back } = useNavegacion();
  const { profile, saveProfile } = useProfile();
  const { uid } = useSessionUser();
  const premium = useIsPremium(uid);
  const fondo = fondoPerfil(isDark);
  const { textoFila, flecha } = coloresTarjeta(isDark);
  // Las opciones sin fondo propio: el estilo de cristal es solo de la tarjeta
  const rowBg = "transparent";
  const mutedColor = isDark ? "#8b8b8bff" : "#9CA3AF";
  const colorIcono = isDark ? "#FFFFFF" : "#101010";

  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [borrador, setBorrador] = useState<Borrador>({});
  // Cada drawer se monta la primera vez que se abre (6 drawers a la vez hacían lenta la pantalla)
  const [montados, setMontados] = useState<ReadonlySet<Sheet>>(new Set());

  // Si se abre un drawer mientras el anterior aún termina de cerrarse, su animación de cierre
  // lo vuelve a cerrar (por eso a veces "no entraba"). Se espera a que termine.
  const cerradoEn = useRef(0);
  const abrir = (cual: Sheet) => {
    // Un drawer recién montado necesita un instante antes de abrirse: si nace ya abierto
    // no hace su animación de entrada y nunca aparece
    const nuevo = !montados.has(cual);
    if (nuevo) setMontados((m) => new Set(m).add(cual));
    const espera = Math.max(
      CIERRE_DRAWER_MS - (Date.now() - cerradoEn.current),
      nuevo ? MONTAJE_DRAWER_MS : 0,
    );
    if (espera > 0) setTimeout(() => setSheet(cual), espera);
    else setSheet(cual);
  };
  const cerrarSheet = () => {
    cerradoEn.current = Date.now();
    setSheet(null);
  };
  /** Cierra y, si no se guardó, la vista previa vuelve a lo que había */
  const cerrarCampo = (campo: keyof Borrador, guardado: boolean) => {
    // Sin nada que deshacer no se cambia: así la vista previa no se vuelve a dibujar al cerrar
    if (!guardado) {
      setBorrador((b) =>
        b[campo] === undefined ? b : { ...b, [campo]: undefined },
      );
    }
    cerrarSheet();
  };

  const verBorrador = useCallback(
    <K extends keyof Borrador>(campo: K, valor: Borrador[K]) =>
      setBorrador((b) => ({ ...b, [campo]: valor })),
    [],
  );
  const verPills = useCallback(
    (pills: PildoraPerfilData[]) => verBorrador("pills", pills),
    [verBorrador],
  );

  /** Cada cambio se guarda al confirmarlo; si falla se avisa y se relanza el error */
  const guardar = async (cambios: Partial<DatosPerfil>) => {
    try {
      await saveProfile({ ...profile, ...cambios });
    } catch (error) {
      showErrorAlert("No se pudieron guardar los cambios", error);
      throw error;
    }
  };

  const vista: DatosPerfil = useMemo(
    () => ({
      ...profile,
      name: borrador.name?.trim() || profile.name,
      username: borrador.username || profile.username,
      description: borrador.description ?? profile.description,
      pills: borrador.pills ?? profile.pills,
    }),
    [profile, borrador],
  );

  const derecha = (texto?: string) => (
    <View style={styles.derecha}>
      {texto ? (
        <Text numberOfLines={1} style={[styles.valor, { color: mutedColor }]}>
          {texto}
        </Text>
      ) : null}
      <IconoFlecha size={22} color={flecha} />
    </View>
  );
  // Caja de 24 px: el icono no se corta por la derecha dentro del hueco de la fila
  const icono = (nombre: keyof typeof Ionicons.glyphMap): ReactNode => (
    <View style={styles.cajaIcono}>
      <Ionicons name={nombre} size={22} color={colorIcono} />
    </View>
  );
  const iconoSvg = (nodo: ReactNode): ReactNode => (
    <View style={styles.cajaIcono}>{nodo}</View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: fondo }}>
      <Animated.View entering={ENTRADA} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <VistaPreviaPerfil
            profile={vista}
            isDark={isDark}
            premium={premium}
          />

          <View style={styles.contenedor}>
            {/* Con el estilo de la tarjeta de los chats */}
            <View style={[styles.tarjeta, estiloTarjetaCristal(isDark)]}>
              <ListaAjustes isDark={isDark}>
                <FilaAjuste
                  bg={rowBg}
                  icon={iconoSvg(
                    <IconoImagenLinea size={24} color={colorIcono} />,
                  )}
                  label="Fondo de perfil"
                  textColor={textoFila}
                  onPress={() => abrir("fondo")}
                  right={derecha()}
                />
                <FilaAjuste
                  bg={rowBg}
                  icon={iconoSvg(
                    <IconoCaritaLinea size={24} color={colorIcono} />,
                  )}
                  label="Foto o avatar de perfil"
                  textColor={textoFila}
                  onPress={() => abrir("avatar")}
                  right={derecha()}
                />
                <FilaAjuste
                  bg={rowBg}
                  icon={icono("pricetag-outline")}
                  label="Etiquetas"
                  textColor={textoFila}
                  onPress={() => abrir("etiquetas")}
                  right={derecha(`${profile.pills.length}/${MAX_PILDORAS}`)}
                />
                <FilaAjuste
                  bg={rowBg}
                  icon={icono("text-outline")}
                  label="Nombre"
                  textColor={textoFila}
                  onPress={() => abrir("nombre")}
                  right={derecha(profile.name)}
                />
                <FilaAjuste
                  bg={rowBg}
                  icon={icono("at-outline")}
                  label="Username"
                  textColor={textoFila}
                  onPress={() => abrir("username")}
                  right={derecha(
                    profile.username ? `@${profile.username}` : "",
                  )}
                />
                <FilaAjuste
                  bg={rowBg}
                  icon={icono("document-text-outline")}
                  label="Descripción"
                  textColor={textoFila}
                  onPress={() => abrir("descripcion")}
                  right={derecha()}
                />
              </ListaAjustes>
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Volver al perfil, arriba a la izquierda sobre la portada */}
      <Animated.View
        entering={FadeIn.duration(220)}
        pointerEvents="box-none"
        style={[styles.barra, { top: insets.top + 2 }]}
      >
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Volver al perfil"
          onPress={() => conSalida(back)}
          scaleTo={0.92}
          hitSlop={6}
          style={styles.botonVolver}
        >
          <View style={{ transform: [{ translateX: -1 }] }}>
            <BackArrowIcon size={27} color="#FFFFFF" />
          </View>
        </PressableScale>
      </Animated.View>

      {montados.has("fondo") ? (
        <SheetFondo
          visible={sheet === "fondo"}
          cover={profile.cover}
          isDark={isDark}
          onClose={cerrarSheet}
          onGuardar={(cover) => guardar({ cover })}
        />
      ) : null}
      {montados.has("avatar") ? (
        <SheetAvatar
          visible={sheet === "avatar"}
          photo={profile.photo}
          orb={profile.orb}
          name={profile.name}
          isDark={isDark}
          onClose={cerrarSheet}
          onGuardar={guardar}
        />
      ) : null}
      {montados.has("etiquetas") ? (
        <SheetEtiquetas
          visible={sheet === "etiquetas"}
          pills={profile.pills}
          isDark={isDark}
          onClose={(guardado) => cerrarCampo("pills", guardado)}
          onBorrador={verPills}
          onGuardar={(pills) =>
            guardar({
              pills: pills
                .map((x) => ({ ...x, text: x.text.trim() }))
                .filter((x) => x.text.length > 0),
            })
          }
        />
      ) : null}
      {montados.has("nombre") ? (
        <SheetNombre
          visible={sheet === "nombre"}
          valor={profile.name}
          isDark={isDark}
          maxLength={MAX_NOMBRE}
          onTexto={(v) => verBorrador("name", v)}
          onClose={(guardado) => cerrarCampo("name", guardado)}
          onGuardar={(name) => guardar({ name })}
        />
      ) : null}
      {montados.has("username") ? (
        <SheetUsername
          visible={sheet === "username"}
          uid={uid}
          username={profile.username}
          isDark={isDark}
          onTexto={(v) => verBorrador("username", v)}
          onClose={(guardado) => cerrarCampo("username", guardado)}
        />
      ) : null}
      {montados.has("descripcion") ? (
        <SheetDescripcion
          visible={sheet === "descripcion"}
          valor={profile.description}
          isDark={isDark}
          maxLength={MAX_DESCRIPCION}
          onTexto={(v) => verBorrador("description", v)}
          onClose={(guardado) => cerrarCampo("description", guardado)}
          onGuardar={(description) => guardar({ description })}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: { position: "absolute", left: 15 },
  botonVolver: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  cajaIcono: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  contenedor: { paddingHorizontal: 16 },
  // Misma tarjeta que General en el perfil
  // Igual que las tarjetas del perfil: poco relleno arriba y abajo, y la línea de borde a borde
  tarjeta: {
    borderRadius: 21,
    paddingVertical: 2,
    paddingHorizontal: 0,
    marginTop: 30,
    gap: 10,
  },
  derecha: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  valor: { fontFamily: "Inter_400Regular", fontSize: 13.5, maxWidth: 130 },
});
