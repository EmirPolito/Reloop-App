import { useDissolve } from "dissolve-ui";
import {
  useState,
  type ComponentRef,
  type ReactNode,
  type RefObject,
} from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { PressableSuave } from "@/components/PressableSuave";
import { conSalida } from "@/components/salidaModulo";
import { BotonBarra } from "@/components/ui/BotonBarra";
import { BuscadorBlanco } from "@/components/ui/BuscadorBlanco";
import { IllustratedEmptyState } from "@/components/ui/IllustratedEmptyState";
import { EASE_OUT } from "@/constants/motion";
import { GROSOR_LUPA } from "@/features/busqueda/components/PildoraCristal";
import { useBusquedasRecientes } from "@/features/busqueda/hooks/useBusquedasRecientes";
import { useUserSearch } from "@/features/busqueda/hooks/useUserSearch";
import { IconoBusqueda } from "@/features/home/components/IconosTarjeta";
import { AvatarVendedor } from "@/features/marketplace/components/AvatarVendedor";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { usePerfilDe } from "@/features/perfil/hooks/usePerfilDe";
import { IconoPerfil } from "@/features/perfil/Perfiliconos";
import { conArroba, normalizarNombre } from "@/features/perfil/username";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";
import { BulkSearchIcon } from "./components/ChatIcons";
import { BackArrowIcon } from "./components/ThreadIcons";
import { useOpenChat } from "./hooks/useOpenChat";

const LADO_AVATAR = 44;
/** Las recientes que quedan se acomodan suave cuando una se va */
const ACOMODO = LinearTransition.duration(240).easing(EASE_OUT);
/** Las recientes guardan textos buscados ("t:texto") y personas abiertas (su uid) */
const PREFIJO_TEXTO = "t:";

/**
 * Buscar a alguien para escribirle: volver, el título y el buscador (por nombre o @usuario).
 * Lo que se busca se queda en "Búsquedas recientes" (al pulsar Buscar en el teclado o al
 * volver con algo escrito), igual que las personas cuyo chat se abre desde aquí. Solo se
 * quitan con su X, que las vuelve polvo como las recientes del inicio. Las filas van sueltas
 * sobre el fondo, sin tarjeta.
 */
export function BuscarChatsScreen() {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const { uid: yo } = useSessionUser();
  const { back } = useAppNavigation();
  const openChat = useOpenChat();
  const [busqueda, setBusqueda] = useState("");
  const { recientes, agregar, quitar } = useBusquedasRecientes("chats");

  // Con o sin "@" se busca igual: por usuario y por nombre
  const termino = normalizarNombre(busqueda.trim().replace(/^@/, ""));
  const escribiendo = termino !== "";
  // Sin texto no se consulta: al entrar no hay trabajo de más durante la animación
  const resultado = useUserSearch(termino, escribiendo);

  const encontrados =
    resultado.estado === "listo"
      ? resultado.usuarios.filter((u) => u.uid !== yo).map((u) => u.uid)
      : [];

  const guardarTexto = () => {
    if (busqueda.trim()) agregar(PREFIJO_TEXTO + busqueda.trim());
  };

  const escribir = (uid: string, nombre: string) => {
    guardarTexto();
    agregar(uid);
    void openChat({ id: uid, name: nombre });
  };

  const salir = () => {
    guardarTexto();
    // Salida corta, y Chats vuelve a entrar con la entrada corta
    conSalida(back, true);
  };

  const texto = isDark ? "#F1F5F9" : "#101010";
  const gris = isDark ? "#94A3B8" : "#828690";

  return (
    <View style={[styles.pantalla, { paddingTop: insets.top + 8 }]}>
      <View style={styles.barra}>
        <BotonBarra etiqueta="Volver" onPress={salir}>
          <View style={{ transform: [{ translateX: -1.5 }] }}>
            <BackArrowIcon size={28} color={texto} />
          </View>
        </BotonBarra>
        <Text
          accessibilityRole="header"
          pointerEvents="none"
          style={[styles.titulo, { color: texto }]}
        >
          Buscar
        </Text>
      </View>

      <BuscadorBlanco
        value={busqueda}
        onChangeText={setBusqueda}
        onSubmitEditing={guardarTexto}
        placeholder="Busca a alguna persona"
        accessibilityLabel="Buscar a quién escribirle"
        autoFocus
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingTop: 20,
          paddingBottom: insets.bottom + 40,
        }}
      >
        {!escribiendo ? (
          recientes.length > 0 ? (
            <>
              <Text style={[styles.seccion, { color: texto }]}>
                Búsquedas recientes
              </Text>
              {recientes.map((reciente) => (
                <FilaConPolvo key={reciente} onQuitar={() => quitar(reciente)}>
                  {(quitarConPolvo) =>
                    reciente.startsWith(PREFIJO_TEXTO) ? (
                      <FilaTexto
                        texto={reciente.slice(PREFIJO_TEXTO.length)}
                        colorTexto={texto}
                        gris={gris}
                        isDark={isDark}
                        onPress={setBusqueda}
                        onQuitar={quitarConPolvo}
                      />
                    ) : (
                      <FilaPersona
                        uid={reciente}
                        texto={texto}
                        gris={gris}
                        onPress={escribir}
                        onQuitar={quitarConPolvo}
                      />
                    )
                  }
                </FilaConPolvo>
              ))}
            </>
          ) : (
            // Sin nada escrito ni recientes: una recomendación de qué hacer aquí
            <IllustratedEmptyState
              // El icono de usuario de la barra de navegación (Perfil), en el gris de los estados vacíos
              icon={
                <IconoPerfil
                  size={80}
                  color={isDark ? "#c3c3c3" : "#0000001f"}
                />
              }
              title="Encuentra a quién escribirle"
              message="Busca por nombre o @usuario para empezar una conversación."
              style={styles.vacio}
            />
          )
        ) : encontrados.length > 0 ? (
          encontrados.map((uid) => (
            <FilaPersona
              key={uid}
              uid={uid}
              texto={texto}
              gris={gris}
              onPress={escribir}
            />
          ))
        ) : resultado.estado === "cargando" ? (
          <ActivityIndicator color={gris} style={styles.cargando} />
        ) : (
          <IllustratedEmptyState
            icon={<BulkSearchIcon size={80} />}
            title={
              resultado.estado === "error"
                ? "No pudimos buscar personas"
                : "Sin resultados"
            }
            message={
              resultado.estado === "error"
                ? "Revisa tu conexión e inténtalo de nuevo."
                : "Prueba con otro nombre o @usuario."
            }
            style={styles.vacio}
          />
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Una búsqueda reciente que se puede quitar: al pedirlo se vuelve polvo (efecto Dust de
 * dissolve-ui) y, cuando termina, se quita de verdad y las demás suben suave.
 */
function FilaConPolvo({
  onQuitar,
  children,
}: {
  onQuitar: () => void;
  children: (quitarConPolvo: () => void) => ReactNode;
}) {
  const { ref, dissolving, dissolve } = useDissolve();
  const [quitando, setQuitando] = useState(false);

  const quitarConPolvo = async () => {
    if (quitando) return;
    setQuitando(true);
    try {
      await dissolve({ preset: "dust", grain: 3, duration: 1500 });
    } catch {
      // El efecto es solo visual (en la web no puede capturar la fila): se quita igual
    }
    onQuitar();
  };

  return (
    <Animated.View layout={ACOMODO}>
      <View
        // Los tipos de dissolve-ui declaran el ref con View como tipo, no como componente
        ref={ref as unknown as RefObject<ComponentRef<typeof View>>}
        collapsable={false}
        style={{ opacity: dissolving ? 0 : 1 }}
      >
        {children(() => void quitarConPolvo())}
      </View>
    </Animated.View>
  );
}

/** X de una reciente: círculo gris con la X blanca, igual que en la búsqueda del inicio */
function BotonQuitar({
  etiqueta,
  gris,
  onPress,
}: {
  etiqueta: string;
  gris: string;
  onPress: () => void;
}) {
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      hitSlop={12}
      onPress={onPress}
      scaleTo={0.9}
      style={[styles.quitar, { backgroundColor: gris }]}
    >
      <AppIcon name="close" size={9} color="#FFFFFF" />
    </PressableScale>
  );
}

/** Un texto buscado: lupa y el texto; tocarlo lo vuelve a buscar */
function FilaTexto({
  texto,
  colorTexto,
  gris,
  isDark,
  onPress,
  onQuitar,
}: {
  texto: string;
  colorTexto: string;
  gris: string;
  isDark: boolean;
  onPress: (texto: string) => void;
  onQuitar: () => void;
}) {
  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={`Buscar ${texto}`}
      onPress={() => onPress(texto)}
      style={styles.fila}
    >
      <View
        style={[
          styles.lupa,
          { backgroundColor: isDark ? "#1E293B" : "#EFEFF2" },
        ]}
      >
        <IconoBusqueda size={20} color={colorTexto} grosorExtra={GROSOR_LUPA} />
      </View>
      <Text
        numberOfLines={1}
        style={[styles.nombre, styles.textoReciente, { color: colorTexto }]}
      >
        {texto}
      </Text>
      <BotonQuitar
        etiqueta={`Quitar ${texto} de recientes`}
        gris={gris}
        onPress={onQuitar}
      />
    </PressableSuave>
  );
}

/** Una persona: avatar (con insignia), nombre y @usuario; en recientes, con su X */
function FilaPersona({
  uid,
  texto,
  gris,
  onPress,
  onQuitar,
}: {
  uid: string;
  texto: string;
  gris: string;
  onPress: (uid: string, nombre: string) => void;
  onQuitar?: () => void;
}) {
  const perfil = usePerfilDe(uid);
  const nombre = perfil?.name ?? "";
  const arroba = perfil?.username ? conArroba(perfil.username) : null;

  return (
    <PressableSuave
      accessibilityRole="button"
      accessibilityLabel={`Escribir a ${nombre}`}
      onPress={() => onPress(uid, nombre)}
      style={styles.fila}
    >
      <AvatarVendedor
        ownerId={uid}
        fallbackName={nombre}
        size={LADO_AVATAR}
        ajusteInsignia={{ escala: 0.45, right: 0, bottom: -5 }}
      />
      <View style={styles.textos}>
        <Text numberOfLines={1} style={[styles.nombre, { color: texto }]}>
          {nombre}
        </Text>
        {arroba ? (
          <Text numberOfLines={1} style={[styles.usuario, { color: gris }]}>
            {arroba}
          </Text>
        ) : null}
      </View>
      {onQuitar ? (
        <BotonQuitar
          etiqueta={`Quitar a ${nombre} de recientes`}
          gris={gris}
          onPress={onQuitar}
        />
      ) : null}
    </PressableSuave>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  barra: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  titulo: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 20,
  },
  seccion: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    marginLeft: 6,
    marginBottom: 8,
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  lupa: {
    width: LADO_AVATAR,
    height: LADO_AVATAR,
    borderRadius: LADO_AVATAR / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  textos: { flex: 1, minWidth: 0, gap: 1 },
  nombre: { fontFamily: "Inter_600SemiBold", fontSize: 14.5 },
  textoReciente: { flex: 1 },
  usuario: { fontFamily: "Inter_400Regular", fontSize: 13 },
  quitar: {
    width: 20,
    height: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.6,
  },
  cargando: { paddingTop: 40 },
  vacio: { paddingTop: 80 },
});
