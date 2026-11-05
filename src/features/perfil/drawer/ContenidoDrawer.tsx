import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { BottomSheet, Button, Spinner } from "heroui-native";
import { useCallback, useEffect, useRef, useState, type ComponentRef } from "react";
import { Keyboard, Platform, TextInput, View, useWindowDimensions, type KeyboardEvent } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/features/shared/Text";
import { useImagePicker } from "@/hooks/useImagePicker";
import { userMessageFor } from "@/utils/errors";
import { COLORES_PERFIL, MAX_DESCRIPCION, MAX_NOMBRE, MAX_PILDORAS, MAX_STICKERS, TEMAS, type ColorPerfil, type DatosPerfil } from "../Perfiltemas";
import { PELIGRO, TIPO, PALETA, DURACION, MARGEN_TECLADO, nuevoId, type Modo } from "./drawerTheme";
import { styles } from "./drawerStyles";
import { AsegurarVisibleCtx } from "./InputSheet";
import { Aparece } from "./Aparece";
import { CampoTexto } from "./CampoTexto";
import { SeccionFoto } from "./SeccionFoto";
import { SeccionEtiquetas } from "./SeccionEtiquetas";
import { SeccionStickers } from "./SeccionStickers";

export interface DrawerEditarPerfilProps {
  visible: boolean;
  /** Datos actuales; el borrador parte de aquí cada vez que se abre */
  initialData: DatosPerfil;
  isDark: boolean;
  onClose: () => void;
  /** Si lanza error, el drawer se queda abierto y muestra un mensaje */
  onSave: (data: DatosPerfil) => void | Promise<void>;
}

export function ContenidoDrawer({
  visible,
  initialData,
  isDark,
  onClose,
  onSave,
}: DrawerEditarPerfilProps) {
  const insets = useSafeAreaInsets();
  const { height: altoVentana } = useWindowDimensions();
  const { isPicking: picking, pickSquareImage } = useImagePicker();
  const [draft, setDraft] = useState<DatosPerfil>(initialData);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const estabaAbierto = useRef(false);

  /* ---- Teclado: altura -> padding inferior del scroll ---- */
  const [tecladoAlto, setTecladoAlto] = useState(0);
  const tecladoRef = useRef(0);
  const scrollRef = useRef<ComponentRef<typeof BottomSheetScrollView>>(null);
  const scrollY = useRef(0);
  const inputActivo = useRef<TextInput | null>(null);

  const modo: Modo = isDark ? "oscuro" : "claro";
  const p = PALETA[modo];
  const tema = TEMAS[draft.color] ?? TEMAS.azul;

  /* El borrador se reinicia solo en el instante de abrir */
  useEffect(() => {
    if (visible && !estabaAbierto.current) {
      setDraft(initialData);
      setError("");
      setSaving(false);
    }
    estabaAbierto.current = visible;
  }, [visible, initialData]);

  /* Desplaza el scroll lo justo para que el input quede sobre el teclado */
  const asegurarVisible = useCallback(
    (input: TextInput) => {
      inputActivo.current = input;
      setTimeout(
        () => {
          if (tecladoRef.current <= 0) return;
          input.measureInWindow((_x, y, _w, h) => {
            const limite = altoVentana - tecladoRef.current - MARGEN_TECLADO;
            const fondo = y + h;
            if (fondo > limite) {
              scrollRef.current?.scrollTo?.({
                y: scrollY.current + (fondo - limite),
                animated: true,
              });
            }
          });
        },
        Platform.OS === "ios" ? 60 : 140,
      );
    },
    [altoVentana],
  );

  useEffect(() => {
    const evShow =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const evHide =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const sShow = Keyboard.addListener(evShow, (e: KeyboardEvent) => {
      tecladoRef.current = e.endCoordinates.height;
      setTecladoAlto(e.endCoordinates.height);
    });
    const sHide = Keyboard.addListener(evHide, () => {
      tecladoRef.current = 0;
      setTecladoAlto(0);
      inputActivo.current = null;
    });
    return () => {
      sShow.remove();
      sHide.remove();
    };
  }, []);

  /* Cuando el teclado ya apareció (y el padding ya se aplicó), reubica el input */
  useEffect(() => {
    if (tecladoAlto > 0 && inputActivo.current) {
      asegurarVisible(inputActivo.current);
    }
  }, [tecladoAlto, asegurarVisible]);

  const update = useCallback(
    (patch: Partial<DatosPerfil>) =>
      setDraft((curr) => ({ ...curr, ...patch })),
    [],
  );

  const cerrar = useCallback(() => {
    Keyboard.dismiss();
    onClose();
  }, [onClose]);

  /* Handlers estables: las secciones memoizadas no se re-renderizan de más */
  const onName = useCallback(
    (name: string) => {
      setError("");
      update({ name });
    },
    [update],
  );
  const onDescription = useCallback(
    (description: string) => update({ description }),
    [update],
  );
  const onRemovePhoto = useCallback(() => update({ photo: null }), [update]);

  const pickPhoto = useCallback(async () => {
    Keyboard.dismiss();
    const uri = await pickSquareImage();
    if (uri) update({ photo: uri });
  }, [pickSquareImage, update]);

  const addPill = useCallback((text: string, icon?: string) => {
    setDraft((curr) => {
      if (curr.pills.length >= MAX_PILDORAS) return curr;
      const color = COLORES_PERFIL[curr.pills.length % COLORES_PERFIL.length];
      return {
        ...curr,
        pills: [...curr.pills, { id: nuevoId(), text, color, icon }],
      };
    });
  }, []);
  const colorPill = useCallback((id: string, color: ColorPerfil) => {
    setDraft((curr) => ({
      ...curr,
      pills: curr.pills.map((x) => (x.id === id ? { ...x, color } : x)),
    }));
  }, []);
  const iconPill = useCallback((id: string, icon?: string) => {
    setDraft((curr) => ({
      ...curr,
      pills: curr.pills.map((x) => (x.id === id ? { ...x, icon } : x)),
    }));
  }, []);
  const removePill = useCallback((id: string) => {
    setDraft((curr) => ({
      ...curr,
      pills: curr.pills.filter((x) => x.id !== id),
    }));
  }, []);

  const toggleSticker = useCallback((id: string) => {
    setDraft((curr) => {
      if (curr.stickers.includes(id)) {
        return { ...curr, stickers: curr.stickers.filter((s) => s !== id) };
      }
      if (curr.stickers.length >= MAX_STICKERS) return curr;
      return { ...curr, stickers: [...curr.stickers, id] };
    });
  }, []);

  const handleSave = async () => {
    if (saving) return;
    Keyboard.dismiss();
    const name = draft.name.trim();
    if (!name) {
      setError("Escribe un nombre para tu perfil.");
      return;
    }
    const data: DatosPerfil = {
      ...draft,
      name,
      description: draft.description.trim(),
      pills: draft.pills
        .map((x) => ({ ...x, text: x.text.trim() }))
        .filter((x) => x.text.length > 0),
    };
    setSaving(true);
    setError("");
    try {
      await onSave(data);
      cerrar();
    } catch (e) {
      setError(
        userMessageFor(e, "No se pudieron guardar los cambios. Intenta de nuevo."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AsegurarVisibleCtx.Provider value={asegurarVisible}>
      <View style={styles.flex}>
        {/* Encabezado: título + botón cerrar de HeroUI (cierra vía onOpenChange) */}
        <View style={styles.header}>
          <BottomSheet.Title
            style={{
              fontSize: TIPO.titulo,
              fontWeight: "600",
              letterSpacing: -0.2,
              color: p.texto,
              textAlign: "center",
            }}
          >
            Editar perfil
          </BottomSheet.Title>
          <BottomSheet.Close
            accessibilityLabel="Cerrar"
            iconProps={{ size: 16, color: p.cerrarIcono }}
            style={[styles.close, { backgroundColor: p.cerrarFondo }]}
          />
        </View>

        <BottomSheetScrollView
          ref={scrollRef}
          style={styles.flex}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          onScrollEndDrag={(e) => {
            scrollY.current = e.nativeEvent.contentOffset.y;
          }}
          onMomentumScrollEnd={(e) => {
            scrollY.current = e.nativeEvent.contentOffset.y;
          }}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Math.max(insets.bottom, 16) + tecladoAlto },
          ]}
        >
          <Aparece index={0}>
            <SeccionFoto
              photo={draft.photo}
              picking={picking}
              placeholderBg={tema.pillBg}
              accent={tema.accent}
              modo={modo}
              onPick={pickPhoto}
              onRemove={onRemovePhoto}
            />
          </Aparece>

          <Aparece index={1}>
            <View style={styles.inputsGroup}>
              <CampoTexto
                placeholder="Nombre"
                accessibilityLabel="Nombre de perfil"
                value={draft.name}
                maxLength={MAX_NOMBRE}
                autoCapitalize="words"
                modo={modo}
                onChangeText={onName}
              />
              <CampoTexto
                placeholder="Descripción"
                accessibilityLabel="Descripción del perfil"
                value={draft.description}
                maxLength={MAX_DESCRIPCION}
                multiline
                modo={modo}
                onChangeText={onDescription}
              />
            </View>
          </Aparece>

          <Aparece index={2}>
            <SeccionEtiquetas
              pills={draft.pills}
              modo={modo}
              onAdd={addPill}
              onColor={colorPill}
              onIcon={iconPill}
              onRemove={removePill}
            />
          </Aparece>

          <Aparece index={3} deslizar>
            <SeccionStickers
              selected={draft.stickers}
              modo={modo}
              onToggle={toggleSticker}
            />
          </Aparece>

          <Aparece index={4} deslizar>
            <View>
              {error ? (
                <Animated.View
                  entering={FadeIn.duration(DURACION)}
                  exiting={FadeOut.duration(DURACION)}
                >
                  <Text
                    accessibilityLiveRegion="polite"
                    style={{
                      textAlign: "center",
                      marginBottom: 10,
                      fontSize: TIPO.error,
                      color: PELIGRO,
                    }}
                  >
                    {error}
                  </Text>
                </Animated.View>
              ) : null}

              <View style={styles.actions}>
                <Button
                  variant="secondary"
                  onPress={cerrar}
                  style={[styles.button, { backgroundColor: p.cancelarFondo }]}
                >
                  <Button.Label
                    style={{
                      color: p.texto,
                      fontSize: TIPO.boton,
                      fontWeight: "600",
                    }}
                  >
                    Cancelar
                  </Button.Label>
                </Button>
                {/* Sin isDisabled: el color no cambia, solo aparece el spinner */}
                <Button
                  variant="primary"
                  onPress={() => void handleSave()}
                  style={[styles.button, { backgroundColor: p.activo }]}
                >
                  {saving ? (
                    <Spinner size="sm" color={p.sobreActivo} />
                  ) : (
                    <Button.Label
                      style={{
                        color: p.sobreActivo,
                        fontSize: TIPO.boton,
                        fontWeight: "600",
                      }}
                    >
                      Guardar
                    </Button.Label>
                  )}
                </Button>
              </View>
            </View>
          </Aparece>
        </BottomSheetScrollView>
      </View>
    </AsegurarVisibleCtx.Provider>
  );
}
