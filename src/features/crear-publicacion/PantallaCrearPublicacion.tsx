import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { CATEGORIES } from "@/features/marketplace/data";
import { categoryPriceMode } from "@/features/marketplace/rules";
import { useNavegacion } from "@/features/navigation/useNavegacion";
import { AppIcon } from "@/features/shared/AppIcon";
import { CATEGORY_IMAGES } from "@/features/shared/constants";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { FuenteTexto, Text, TextInput } from "@/features/shared/Text";
import { useImagePicker } from "@/hooks/useImagePicker";
import {
  EMPTY_DRAFT,
  FORM_CATEGORY_LABELS,
  LARGO_UBICACION,
  MAX_FOTOS,
  MAX_OPCIONES,
  nuevaOpcion,
  opcionVacia,
  usesOptions,
  type DraftOption,
  type ProductDraft,
} from "./draftRules";
import { FotosPublicacion, type OrigenFoto } from "./FotosPublicacion";
import { ProductosPublicacion } from "./ProductosPublicacion";
import { usePublishProduct } from "./hooks/usePublishProduct";

const CATEGORY_DESCRIPTIONS = {
  venta: "Vende algo que ya no usas",
  cambio: "Cámbialo por algo que necesites",
  donacion: "Regálalo a alguien de la comunidad",
  mascota: "Encuentra un hogar para una mascota",
  comida: "Vende o comparte comida",
} as const;

export function PantallaCrearPublicacion() {
  const { styles, isDark } = useAppTheme();
  const { navigate } = useNavegacion();
  const { isPicking, pickSquareImage, takeSquarePhoto } = useImagePicker();
  const { publish, publishing } = usePublishProduct();
  const [draft, setDraft] = useState<ProductDraft>(EMPTY_DRAFT);
  const [step, setStep] = useState<"category" | "details">("category");
  // Productos: un acordeón cerrado al principio
  const [productosAbiertos, setProductosAbiertos] = useState(false);

  const placeholderColor = isDark ? "#B3AEC0" : "#828690";

  function updateDraft(patch: Partial<ProductDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  const conProductos = usesOptions(draft.category);
  // Solo cuentan los productos que ya tienen algo escrito (el de ejemplo vacío no)
  const conOpciones =
    conProductos && draft.options.some((opcion) => !opcionVacia(opcion));

  /** Abre o cierra los productos; al abrirlos por primera vez ya hay uno listo para llenar */
  function alternarProductos() {
    if (!productosAbiertos && draft.options.length === 0) {
      updateDraft({ options: [nuevaOpcion()] });
    }
    setProductosAbiertos((abierto) => !abierto);
  }

  /** Pone la foto en ese cuadro: si ya tenía, la cambia; si no, la agrega al final */
  async function elegirFoto(indice: number, origen: OrigenFoto) {
    const uri =
      origen === "camara" ? await takeSquarePhoto() : await pickSquareImage();
    if (!uri) return;
    setDraft((current) => {
      const photos =
        indice < current.photos.length
          ? current.photos.map((foto, i) => (i === indice ? uri : foto))
          : [...current.photos, uri];
      return { ...current, photos: photos.slice(0, MAX_FOTOS) };
    });
  }

  function cambiarOpcion(key: string, cambio: Partial<DraftOption>) {
    setDraft((current) => ({
      ...current,
      options: current.options.map((o) =>
        o.key === key ? { ...o, ...cambio } : o,
      ),
    }));
  }

  async function elegirFotoOpcion(key: string) {
    const uri = await pickSquareImage();
    if (uri) cambiarOpcion(key, { photo: uri });
  }

  async function handlePublish() {
    if (publishing) return;
    if (await publish(draft)) {
      setDraft(EMPTY_DRAFT);
      setStep("category");
      setProductosAbiertos(false);
    }
  }

  return (
    // Todo el módulo de crear con Inter (en lugar de Poppins)
    <FuenteTexto.Provider value="inter">
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.createContent}
        >
          <View style={styles.createHeader}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={step === "category" ? "Cerrar" : "Volver"}
              onPress={() =>
                step === "category" ? navigate("home") : setStep("category")
              }
              style={styles.closeButton}
            >
              <AppIcon
                name={step === "category" ? "close" : "back"}
                size={19}
                color={isDark ? "#FFFFFF" : "#23242C"}
              />
            </Pressable>

            <View style={styles.createStepHeading}>
              {step === "category" ? (
                <Text style={styles.createStepSubtitle}>Paso 1 de 2</Text>
              ) : (
                <>
                  <Text style={styles.createTitle}>Fotos y datos</Text>
                  <Text style={styles.createStepSubtitle}>Paso 2 de 2</Text>
                </>
              )}
            </View>
            <View style={styles.closeButtonSpacer} />
          </View>

          {step === "category" ? (
            <>
              <Text style={styles.createStepTitle}>¿Qué quieres publicar?</Text>
              <Text style={styles.createStepDescription}>
                Elige el tipo de publicación. En el siguiente paso agregas las
                fotos y los datos.
              </Text>

              <View style={styles.createOptions}>
                {CATEGORIES.map((item) => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${FORM_CATEGORY_LABELS[item.id]}. ${CATEGORY_DESCRIPTIONS[item.id]}`}
                    onPress={() => {
                      updateDraft({ category: item.id });
                      setStep("details");
                    }}
                    style={({ pressed }) => [
                      styles.createOption,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.createOptionIcon}>
                      <Image
                        source={CATEGORY_IMAGES[item.id]}
                        contentFit="contain"
                        style={styles.createOptionImage}
                      />
                    </View>
                    <View style={styles.createOptionCopy}>
                      <Text style={styles.createOptionTitle}>
                        {FORM_CATEGORY_LABELS[item.id]}
                      </Text>
                      <Text style={styles.createOptionDescription}>
                        {CATEGORY_DESCRIPTIONS[item.id]}
                      </Text>
                    </View>
                    <AppIcon
                      name="chevronRight"
                      size={19}
                      color={isDark ? "#A9A5B7" : "#586170"}
                    />
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <>
              <View style={styles.createSectionRow}>
                <Text style={styles.createSectionLabel}>Fotos</Text>
                <Text style={styles.createPhotoCount}>
                  {draft.photos.length}/{MAX_FOTOS}
                </Text>
              </View>

              <FotosPublicacion
                fotos={draft.photos}
                ocupado={isPicking}
                onElegir={(indice, origen) => void elegirFoto(indice, origen)}
                onQuitar={(indice) =>
                  updateDraft({
                    photos: draft.photos.filter((_, i) => i !== indice),
                  })
                }
              />

              <Text style={[styles.createPhotoHint, estilosLocales.ayudaFotos]}>
                Toca un cuadro para agregar una foto de tu galería o tomarla con
                la cámara. La grande es la principal; las chicas son opcionales.
              </Text>

              <Text style={[styles.createFieldLabel, estilosLocales.etiqueta]}>
                Nombre
              </Text>
              <TextInput
                accessibilityLabel="Nombre de la publicación"
                value={draft.name}
                onChangeText={(name) => updateDraft({ name })}
                placeholder="Ej. Calculadora científica"
                placeholderTextColor={placeholderColor}
                maxLength={40}
                style={styles.input}
              />

              <Text style={[styles.createFieldLabel, estilosLocales.etiqueta]}>
                Descripción
              </Text>
              <TextInput
                accessibilityLabel="Descripción"
                value={draft.description}
                onChangeText={(description) => updateDraft({ description })}
                placeholder="Cuenta cómo está, cuánto se ha usado y otros detalles"
                placeholderTextColor={placeholderColor}
                multiline
                style={[styles.input, styles.descriptionInput]}
              />

              <Text style={[styles.createFieldLabel, estilosLocales.etiqueta]}>
                Lugar de entrega (opcional)
              </Text>
              <TextInput
                accessibilityLabel="Lugar de entrega, opcional"
                value={draft.ubicacion}
                onChangeText={(ubicacion) => updateDraft({ ubicacion })}
                placeholder="Ej. Edificio B"
                placeholderTextColor={placeholderColor}
                maxLength={LARGO_UBICACION}
                style={styles.input}
              />

              <View style={[styles.createBottomRow, estilosLocales.filaAbajo]}>
                {/* Con productos, cada uno lleva su precio */}
                {categoryPriceMode(draft.category) !== "none" &&
                !conOpciones ? (
                  <View style={styles.createPriceColumn}>
                    <Text
                      style={[styles.createFieldLabel, estilosLocales.etiqueta]}
                    >
                      Precio
                    </Text>
                    <TextInput
                      accessibilityLabel="Precio"
                      value={draft.priceText}
                      onChangeText={(priceText) => updateDraft({ priceText })}
                      placeholder="$0.00"
                      placeholderTextColor={placeholderColor}
                      keyboardType="decimal-pad"
                      style={[styles.input, styles.createPriceInput]}
                    />
                  </View>
                ) : null}
                {/* Con productos, cada uno lleva cuántos hay */}
                {conOpciones ? null : (
                  <View style={styles.createPriceColumn}>
                    <Text
                      style={[styles.createFieldLabel, estilosLocales.etiqueta]}
                    >
                      Cantidad
                    </Text>
                    <TextInput
                      accessibilityLabel="Cantidad disponible"
                      value={draft.quantityText}
                      onChangeText={(quantityText) =>
                        updateDraft({
                          quantityText: quantityText.replace(/[^0-9]/g, ""),
                        })
                      }
                      placeholder="1"
                      placeholderTextColor={placeholderColor}
                      keyboardType="number-pad"
                      maxLength={4}
                      style={[styles.input, styles.createPriceInput]}
                    />
                  </View>
                )}
                <View style={styles.createCommunityColumn}>
                  <Text
                    style={[styles.createFieldLabel, estilosLocales.etiqueta]}
                  >
                    Comunidad
                  </Text>
                  <View style={styles.createCommunity}>
                    <Text style={styles.createCommunityText}>UTSV</Text>
                  </View>
                </View>
              </View>

              {/* Lo último del formulario: los productos, en un acordeón */}
              {conProductos ? (
                <View style={estilosLocales.productos}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: productosAbiertos }}
                    accessibilityLabel="Productos, opcional"
                    onPress={alternarProductos}
                    style={estilosLocales.encabezado}
                  >
                    <View style={estilosLocales.textos}>
                      <Text style={styles.createSectionLabel}>
                        Productos (opcional)
                      </Text>
                      <Text style={styles.createPhotoCount}>
                        {productosAbiertos
                          ? `${draft.options.length} de ${MAX_OPCIONES}`
                          : "¿Tienes varias opciones? Agrega sabores, tamaños…"}
                      </Text>
                    </View>
                    <Ionicons
                      name={productosAbiertos ? "chevron-up" : "chevron-down"}
                      size={20}
                      color={isDark ? "#A9A5B7" : "#586170"}
                    />
                  </Pressable>
                  {productosAbiertos ? (
                    <Animated.View
                      entering={FadeIn.duration(180)}
                      style={estilosLocales.contenido}
                    >
                      <Text style={styles.createPhotoHint}>
                        Cada producto lleva su foto, su precio y cuántas piezas
                        tienes. Si no agregas ninguno, se pide la publicación
                        completa.
                      </Text>
                      <ProductosPublicacion
                        opciones={draft.options}
                        ocupado={isPicking}
                        onCambiar={cambiarOpcion}
                        onElegirFoto={(key) => void elegirFotoOpcion(key)}
                        onQuitar={(key) =>
                          updateDraft({
                            options: draft.options.filter((o) => o.key !== key),
                          })
                        }
                        onAgregar={() =>
                          updateDraft({
                            options: [...draft.options, nuevaOpcion()],
                          })
                        }
                      />
                    </Animated.View>
                  ) : null}
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                disabled={publishing}
                onPress={handlePublish}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.pressed,
                  publishing && styles.disabledButton,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {publishing ? "Publicando..." : "Publicar"}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </FuenteTexto.Provider>
  );
}

const estilosLocales = StyleSheet.create({
  // Más aire entre una sección y otra
  etiqueta: { marginTop: 10 },
  ayudaFotos: { marginTop: 12, marginBottom: 8 },
  filaAbajo: { marginBottom: 0 },
  // Productos: una sección más (sin caja), alineada con las de arriba y separada de Publicar
  productos: { marginTop: 22, marginBottom: 28 },
  encabezado: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  textos: { flex: 1, gap: 2 },
  contenido: { marginTop: 4 },
});
