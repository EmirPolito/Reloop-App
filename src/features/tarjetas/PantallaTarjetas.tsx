import * as Haptics from "expo-haptics";
import { useCallback, useRef, useState, type ComponentRef } from "react";
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
  type TextInputProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PressableScale } from "@/components/PressableScale";
import { conSalida } from "@/components/salidaModulo";
import { BotonBarra, LADO_BOTON_BARRA } from "@/components/ui/BotonBarra";
import {
  CabeceraFlotante,
  useScrollCabecera,
} from "@/components/ui/CabeceraFlotante";
import { useAvisos } from "@/features/avisos/AvisosProvider";
import { BackArrowIcon } from "@/features/chats/components/IconosConversacion";
import { useNavegacion } from "@/features/navigation/useNavegacion";
import { useSessionUser } from "@/features/session/SessionUserProvider";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text, TextInput } from "@/features/shared/Text";
import { showAlert, showErrorAlert } from "@/utils/alerts";
import { ALZADO, Billetera, type TarjetaVista } from "./components/Billetera";
import { TarjetaBancaria } from "./components/TarjetaBancaria";
import {
  COLORES_TARJETA,
  DIGITOS_CLAVE,
  faltanteTarjeta,
  formatearBeneficiario,
  formatearClave,
  formatearInstitucion,
  MAX_TARJETAS,
  soloDigitos,
  type ColorTarjeta,
  type ColorVista,
  type Tarjeta,
} from "./formatoTarjeta";
import {
  actualizarTarjeta,
  eliminarTarjeta,
  guardarTarjeta,
  useTarjetas,
} from "./repositorioTarjetas";

const NUEVA = "nueva";
/** Aire a los lados del contenido */
const MARGEN = 24;
/** La billetera, un poco más chica que su tamaño de diseño */
const ESCALA_MAX = 0.88;
/** Cuánto se mete la tarjeta alzada en el encabezado (debajo del título, sin tocarlo) */
const ARRIBA = 18;

/** Lo que se escribe en el formulario (la clave, con espacios) */
type Datos = Omit<Tarjeta, "id" | "color"> & { color: ColorVista };
/** La nueva empieza en gris: el diseño se elige abajo */
const VACIA: Datos = {
  institucion: "",
  clave: "",
  beneficiario: "",
  color: "gris",
};

function datosDe(tarjeta: Tarjeta): Datos {
  return {
    institucion: tarjeta.institucion,
    clave: formatearClave(tarjeta.clave),
    beneficiario: tarjeta.beneficiario,
    color: tarjeta.color,
  };
}

function igual(a: Datos, b: Datos): boolean {
  return (
    a.institucion === b.institucion &&
    soloDigitos(a.clave) === soloDigitos(b.clave) &&
    a.beneficiario === b.beneficiario &&
    a.color === b.color
  );
}
/** Separación entre las vistas previas del selector de color */
const HUECO_COLORES = 8;
const NOMBRES_COLOR: Record<ColorTarjeta, string> = {
  rojo: "Rojo",
  amarillo: "Amarillo",
  azul: "Azul",
  negro: "Negro",
  morado: "Morado",
};

function Campo({ etiqueta, ...props }: TextInputProps & { etiqueta: string }) {
  const { isDark } = useAppTheme();
  const texto = isDark ? "#F1F5F9" : "#101010";
  return (
    <View style={{ gap: 6 }}>
      <Text
        style={[styles.etiqueta, { color: isDark ? "#C4C7CC" : "#6B6B70" }]}
      >
        {etiqueta}
      </Text>
      <TextInput
        {...props}
        accessibilityLabel={etiqueta}
        autoCorrect={false}
        spellCheck={false}
        placeholderTextColor={isDark ? "#7C7F86" : "#B0B0B5"}
        selectionColor={texto}
        cursorColor={texto}
        underlineColorAndroid="transparent"
        style={[
          styles.input,
          { color: texto, backgroundColor: isDark ? "#1F2026" : "#FFFFFF" },
        ]}
      />
    </View>
  );
}

/**
 * Tarjetas para recibir transferencias: el encabezado flotante (volver, título y cuántas hay),
 * la billetera y, debajo, los campos que llenan la tarjeta nueva en tiempo real. Tocar la
 * billetera pasa a la tarjeta de atrás; el ojo alza la de enfrente y muestra sus datos.
 */
export function PantallaTarjetas() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { isDark, styles: tema } = useAppTheme();
  const { uid } = useSessionUser();
  const { mostrar } = useAvisos();
  const { back } = useNavegacion();
  const volver = useCallback(() => conSalida(back), [back]);
  const tarjetas = useTarjetas();
  const { desplazado, alHacerScroll } = useScrollCabecera();
  const [altoCabecera, setAltoCabecera] = useState(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const [borrador, setBorrador] = useState<Datos>(VACIA);
  /** Lo que se edita de una tarjeta guardada (se carga al pasarla al frente) */
  const [edicion, setEdicion] = useState<(Datos & { id: string }) | null>(null);
  const [abierta, setAbierta] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [elegida, setElegida] = useState<string>(NUEVA);

  const hayLugar = tarjetas.length < MAX_TARJETAS;
  const ids = hayLugar
    ? [NUEVA, ...tarjetas.map((t) => t.id)]
    : tarjetas.map((t) => t.id);
  // Si la elegida ya no está (se borró, o se llenaron las cinco), la primera que haya
  const indice = Math.max(ids.indexOf(elegida), 0);
  const idFrente = ids[indice];
  const esNueva = idFrente === NUEVA;
  const guardada = tarjetas.find((t) => t.id === idFrente);
  // Los campos: el borrador de la nueva, o lo que se edita de la guardada de enfrente
  const datos: Datos = esNueva
    ? borrador
    : edicion?.id === idFrente
      ? edicion
      : guardada
        ? datosDe(guardada)
        : VACIA;
  const cambiar = (cambio: Partial<Datos>) => {
    if (esNueva) setBorrador((actual) => ({ ...actual, ...cambio }));
    else if (guardada) setEdicion({ ...datos, ...cambio, id: guardada.id });
  };

  // Todas como se ven ahora (la de enfrente, con lo que se va escribiendo)
  const vista = (id: string): TarjetaVista => {
    // La de enfrente con lo que se va escribiendo; la nueva, con su borrador aunque vaya atrás
    const fuente =
      id === idFrente ? datos : id === NUEVA ? borrador : undefined;
    if (fuente) return { ...fuente, id, clave: soloDigitos(fuente.clave) };
    return tarjetas.find((t) => t.id === id) ?? { ...VACIA, id };
  };
  // La elegida enfrente y las demás detrás, en el orden en que siguen
  const ordenadas = [...ids.slice(indice), ...ids.slice(0, indice)].map(vista);

  const faltante =
    faltanteTarjeta(datos) ??
    (datos.color === "gris" ? "Elige un diseño para la tarjeta." : null);
  const sinCambios =
    !esNueva && guardada !== undefined && igual(datos, datosDe(guardada));
  const escala = Math.min(ESCALA_MAX, (width - MARGEN * 2) / 300);
  const anchoColor = Math.floor(
    (width - MARGEN * 2 - HUECO_COLORES * (COLORES_TARJETA.length - 1)) /
      COLORES_TARJETA.length,
  );
  const tinta = isDark ? "#F1F5F9" : "#101010";

  function pasarALaDeAtras() {
    if (ids.length < 2) return;
    Haptics.selectionAsync().catch(() => undefined);
    const siguiente = ids[(indice + 1) % ids.length];
    const tarjeta = tarjetas.find((t) => t.id === siguiente);
    setEdicion(tarjeta ? { ...datosDe(tarjeta), id: tarjeta.id } : null);
    setElegida(siguiente);
  }

  function alternarAbierta() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
    // Si se abre estando más abajo, sube para ver bien la tarjeta
    if (!abierta && desplazado.get() > 0) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
    setAbierta((valor) => !valor);
  }

  async function guardar() {
    if (faltante || guardando || sinCambios || datos.color === "gris") return;
    const limpios = {
      institucion: datos.institucion.trim(),
      clave: soloDigitos(datos.clave),
      beneficiario: datos.beneficiario.trim(),
      color: datos.color,
    };
    setGuardando(true);
    try {
      if (esNueva) {
        const id = await guardarTarjeta(uid, limpios);
        setBorrador(VACIA);
        setEdicion({ ...datosDe({ ...limpios, id }), id });
        setElegida(id);
      } else if (guardada) {
        await actualizarTarjeta(uid, guardada.id, limpios);
      }
      mostrar({
        tipo: "exito",
        titulo: esNueva ? "Tarjeta guardada" : "Cambios guardados",
        descripcion: "Ya puedes mandarla desde la billetera del chat.",
      });
    } catch (error) {
      showErrorAlert("No se pudo guardar la tarjeta", error);
    }
    setGuardando(false);
  }

  /** Sin pantalla de confirmación: se quita en el momento y avisa arriba */
  function eliminar() {
    if (!guardada) return;
    const { id } = guardada;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => undefined,
    );
    setAbierta(false);
    eliminarTarjeta(uid, id).then(
      () =>
        mostrar({
          tipo: "eliminada",
          titulo: "Tarjeta eliminada",
          descripcion: "Se quitó de tu billetera.",
        }),
      (error) => showErrorAlert("No se pudo eliminar la tarjeta", error),
    );
  }

  return (
    <View style={tema.fill}>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        onScroll={alHacerScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingTop: altoCabecera,
          paddingHorizontal: MARGEN,
          paddingBottom: insets.bottom + 30,
        }}
      >
        {/* Al alzarse, la tarjeta queda justo debajo del título (sin tocarlo) */}
        <View
          style={[styles.billetera, { marginTop: ALZADO * escala - ARRIBA }]}
        >
          <View>
            <Billetera
              tarjetas={ordenadas}
              escala={escala}
              abierta={abierta}
              onAlternarAbierta={alternarAbierta}
              onTocar={pasarALaDeAtras}
              etiquetaTocar="Pasar a la tarjeta de atrás"
              onEliminar={guardada ? eliminar : undefined}
            />
          </View>
        </View>

        <View style={styles.formulario}>
          <Campo
            etiqueta="Institución financiera"
            value={datos.institucion}
            onChangeText={(texto) =>
              cambiar({ institucion: formatearInstitucion(texto) })
            }
            placeholder="BBVA, BANORTE, NU..."
            autoCapitalize="characters"
          />
          <Campo
            etiqueta={`Clave (CLABE de ${DIGITOS_CLAVE} dígitos)`}
            value={datos.clave}
            onChangeText={(texto) => cambiar({ clave: formatearClave(texto) })}
            placeholder="0000 0000 0000 0000 00"
            keyboardType="number-pad"
            maxLength={22}
          />
          <Campo
            etiqueta="Beneficiario"
            value={datos.beneficiario}
            onChangeText={(texto) =>
              cambiar({ beneficiario: formatearBeneficiario(texto) })
            }
            placeholder="NOMBRE COMPLETO"
            autoCapitalize="characters"
          />

          <View style={{ gap: 8 }}>
            <Text
              style={[
                styles.etiqueta,
                { color: isDark ? "#C4C7CC" : "#6B6B70" },
              ]}
            >
              Diseño
            </Text>
            <View style={styles.colores}>
              {COLORES_TARJETA.map((opcion) => (
                <PressableScale
                  key={opcion}
                  accessibilityRole="radio"
                  accessibilityLabel={NOMBRES_COLOR[opcion]}
                  accessibilityState={{ selected: opcion === datos.color }}
                  onPress={() => cambiar({ color: opcion })}
                  scaleTo={0.94}
                  // La elegida se ve completa; las demás, atenuadas (sin elegir, todas igual)
                  style={{
                    opacity:
                      datos.color === "gris" || opcion === datos.color
                        ? 1
                        : 0.38,
                  }}
                >
                  <TarjetaBancaria
                    color={opcion}
                    ancho={anchoColor}
                    soloDiseno
                  />
                </PressableScale>
              ))}
            </View>
          </View>

          {!hayLugar && esNueva === false ? (
            <Text style={styles.nota}>
              Llegaste al máximo de {MAX_TARJETAS} tarjetas.
            </Text>
          ) : null}

          <PressableScale
            accessibilityRole="button"
            accessibilityState={{
              disabled: Boolean(faltante) || guardando || sinCambios,
            }}
            disabled={guardando || sinCambios}
            onPress={() => {
              if (faltante) showAlert("Falta un dato", faltante);
              else void guardar();
            }}
            scaleTo={0.97}
            style={[
              styles.guardar,
              {
                backgroundColor: isDark ? "#F1F5F9" : "#101010",
                opacity: faltante || guardando || sinCambios ? 0.45 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.textoGuardar,
                { color: isDark ? "#101010" : "#FFFFFF" },
              ]}
            >
              {guardando
                ? "Guardando…"
                : esNueva
                  ? "Guardar tarjeta"
                  : "Guardar cambios"}
            </Text>
          </PressableScale>
        </View>
      </ScrollView>

      {/* Como en el inicio: flota sobre el contenido y, al hacer scroll, lo nubla detrás */}
      <CabeceraFlotante
        paddingTop={insets.top + 8}
        desplazado={desplazado}
        onAlto={setAltoCabecera}
      >
        <View style={styles.cabecera}>
          <BotonBarra etiqueta="Volver" onPress={volver}>
            <View style={{ transform: [{ translateX: -1.5 }] }}>
              <BackArrowIcon size={28} color={tinta} />
            </View>
          </BotonBarra>
          <Text
            accessibilityRole="header"
            pointerEvents="none"
            style={[styles.textoTitulo, { color: tinta }]}
          >
            {esNueva ? "Nueva tarjeta" : "Tarjetas"}
          </Text>
          {/* Del ancho del botón de volver, para que el título quede centrado */}
          <Text
            accessibilityLabel={`${tarjetas.length} de ${MAX_TARJETAS} tarjetas`}
            style={[styles.contador, { color: isDark ? "#C4C7CC" : "#6B6B70" }]}
          >
            {tarjetas.length}/{MAX_TARJETAS}
          </Text>
        </View>
      </CabeceraFlotante>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingBottom: 4,
  },
  textoTitulo: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "600",
  },
  contador: {
    width: LADO_BOTON_BARRA,
    textAlign: "right",
    fontSize: 15.5,
    fontFamily: "Inter_400Regular",
  },
  billetera: { alignItems: "center" },
  formulario: { gap: 16, marginTop: 18 },
  etiqueta: { fontSize: 13, fontWeight: "500" },
  input: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    letterSpacing: 0.4,
  },
  nota: { fontSize: 11.5, color: "#8A8A8F", textAlign: "center" },
  colores: { flexDirection: "row", gap: HUECO_COLORES },
  guardar: {
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  textoGuardar: { fontSize: 15.5, fontWeight: "600", top: 1 },
});
