import { Image } from "expo-image";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";

import { CATEGORIES, categoryFor } from "@/features/marketplace/data";
import { categoryPriceMode } from "@/features/marketplace/rules";
import { useNavegacion } from "@/features/navigation/useNavegacion";
import { AppIcon } from "@/features/shared/AppIcon";
import { CATEGORY_IMAGES } from "@/features/shared/constants";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text, TextInput } from "@/features/shared/Text";
import { useImagePicker } from "@/hooks/useImagePicker";
import {
  EMPTY_DRAFT,
  FORM_CATEGORY_LABELS,
  MAX_FOTOS,
  MAX_OPCIONES,
  usesOptions,
  type DraftOption,
  type ProductDraft,
} from "./draftRules";
import { FotosPublicacion } from "./FotosPublicacion";
import { ProductosPublicacion } from "./ProductosPublicacion";
import { usePublishProduct } from "./hooks/usePublishProduct";

const CATEGORY_DESCRIPTIONS = {
  venta: "Ponle precio a lo que ya no usas",
  cambio: "Intercámbialo por algo que sí necesitas",
  donacion: "Regálalo a alguien de tu comunidad",
  mascota: "Busca un hogar para una mascota",
  comida: "Comparte o vende platillos y alimentos",
} as const;

export function PantallaCrearPublicacion() {
  const { styles, isDark } = useAppTheme();
  const { navigate } = useNavegacion();
  const { isPicking, pickSquareImage, takeSquarePhoto } = useImagePicker();
  const { publish, publishing } = usePublishProduct();
  const [draft, setDraft] = useState<ProductDraft>(EMPTY_DRAFT);
  const [step, setStep] = useState<"category" | "details">("category");

  const placeholderColor = isDark ? "#B3AEC0" : "#828690";
  const category = categoryFor(draft.category);

  function updateDraft(patch: Partial<ProductDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  const fotosLlenas = draft.photos.length >= MAX_FOTOS;
  const conProductos = usesOptions(draft.category);

  async function handlePickPhoto() {
    const uri = await pickSquareImage();
    if (uri)
      setDraft((current) => ({
        ...current,
        photos: [...current.photos, uri].slice(0, MAX_FOTOS),
      }));
  }

  async function handleTakePhoto() {
    const uri = await takeSquarePhoto();
    if (uri)
      setDraft((current) => ({
        ...current,
        photos: [...current.photos, uri].slice(0, MAX_FOTOS),
      }));
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
    }
  }

  return (
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
                <Text style={styles.createTitle}>Fotos y detalles</Text>
                <Text style={styles.createStepSubtitle}>Paso 2 de 2</Text>
              </>
            )}
          </View>
          <View style={styles.closeButtonSpacer} />
        </View>

        {step === "category" ? (
          <>
            <Text style={styles.createStepTitle}>¿Qué quieres hacer?</Text>
            <Text style={styles.createStepDescription}>
              Elige una opción y después agrega los detalles.
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Cambiar categoría, actual: ${category.label}`}
              onPress={() => setStep("category")}
              style={styles.createCategoryBar}
            >
              <Text style={styles.createCategoryCaption}>Publicarás para</Text>
              <View style={styles.createCategoryChip}>
                <Text style={styles.createCategoryChipText}>
                  {FORM_CATEGORY_LABELS[category.id]}
                </Text>
              </View>
              <Text style={styles.createCategoryChange}>Cambiar</Text>
            </Pressable>

            <View style={styles.createSectionRow}>
              <Text style={styles.createSectionLabel}>Fotos</Text>
              <Text style={styles.createPhotoCount}>
                {draft.photos.length}/{MAX_FOTOS}
              </Text>
            </View>

            <FotosPublicacion
              fotos={draft.photos}
              ocupado={isPicking}
              onAgregar={() => void handlePickPhoto()}
              onQuitar={(indice) =>
                updateDraft({
                  photos: draft.photos.filter((_, i) => i !== indice),
                })
              }
            />

            {Platform.OS !== "web" && (
              <Pressable
                accessibilityRole="button"
                disabled={isPicking || fotosLlenas}
                onPress={handleTakePhoto}
                style={({ pressed }) => [
                  styles.createCameraAction,
                  pressed && styles.pressed,
                  isPicking && styles.disabledButton,
                ]}
              >
                <AppIcon
                  name="photo"
                  size={18}
                  color={isDark ? "#F5F4FA" : "#23242C"}
                />
                <Text style={styles.createCameraActionText}>
                  {isPicking ? "Abriendo cámara..." : "Tomar foto"}
                </Text>
              </Pressable>
            )}

            <Text style={styles.createPhotoHint}>
              Hasta {MAX_FOTOS} fotos: la principal es la grande y las demás
              salen abajo de ella.
            </Text>

            <Text style={styles.createFieldLabel}>Nombre del producto</Text>
            <TextInput
              accessibilityLabel="Nombre del producto"
              value={draft.name}
              onChangeText={(name) => updateDraft({ name })}
              placeholder="Ej. Calculadora científica"
              placeholderTextColor={placeholderColor}
              maxLength={40}
              style={styles.input}
            />

            <Text style={styles.createFieldLabel}>Descripción</Text>
            <TextInput
              accessibilityLabel="Descripción"
              value={draft.description}
              onChangeText={(description) => updateDraft({ description })}
              placeholder="Cuéntanos el estado, el uso y cualquier detalle útil"
              placeholderTextColor={placeholderColor}
              multiline
              style={[styles.input, styles.descriptionInput]}
            />

            {conProductos ? (
              <>
                <View style={styles.createSectionRow}>
                  <Text style={styles.createSectionLabel}>Productos</Text>
                  <Text style={styles.createPhotoCount}>
                    {draft.options.length}/{MAX_OPCIONES}
                  </Text>
                </View>
                <Text style={styles.createPhotoHint}>
                  Si vendes varios (p. ej., sabores), agrega cada uno con su
                  foto y precio. Sin productos, se pide la publicación tal cual.
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
                      options: [
                        ...draft.options,
                        {
                          key: `o${Date.now().toString(36)}`,
                          name: "",
                          description: "",
                          priceText: "",
                          photo: null,
                        },
                      ],
                    })
                  }
                />
              </>
            ) : null}

            <View style={styles.createBottomRow}>
              {/* Con productos, cada uno lleva su precio */}
              {categoryPriceMode(draft.category) !== "none" &&
              !(conProductos && draft.options.length > 0) ? (
                <View style={styles.createPriceColumn}>
                  <Text style={styles.createFieldLabel}>Precio</Text>
                  <TextInput
                    accessibilityLabel="Precio"
                    value={draft.priceText}
                    onChangeText={(priceText) => updateDraft({ priceText })}
                    placeholder="$ 0.00"
                    placeholderTextColor={placeholderColor}
                    keyboardType="decimal-pad"
                    style={[styles.input, styles.createPriceInput]}
                  />
                </View>
              ) : null}
              <View style={styles.createPriceColumn}>
                <Text style={styles.createFieldLabel}>Disponibles</Text>
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
              <View style={styles.createCommunityColumn}>
                <Text style={styles.createFieldLabel}>Comunidad</Text>
                <View style={styles.createCommunity}>
                  <Text style={styles.createCommunityText}>UTSV</Text>
                </View>
              </View>
            </View>

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

            <Text style={styles.formFootnote}>
              Agrega un nombre para publicar.
            </Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
