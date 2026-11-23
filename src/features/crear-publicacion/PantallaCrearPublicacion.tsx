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
  type ProductDraft,
} from "./draftRules";
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

  async function handlePickPhoto() {
    const uri = await pickSquareImage();
    if (uri) updateDraft({ photo: uri });
  }

  async function handleTakePhoto() {
    const uri = await takeSquarePhoto();
    if (uri) updateDraft({ photo: uri });
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
                {draft.photo ? "1" : "0"}/1
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                draft.photo ? "Cambiar foto del producto" : "Elegir foto"
              }
              disabled={isPicking}
              onPress={handlePickPhoto}
              style={[
                styles.createPhotoFrame,
                draft.photo && styles.createPhotoFrameFilled,
              ]}
            >
              {draft.photo ? (
                <>
                  <Image
                    source={{ uri: draft.photo }}
                    contentFit="cover"
                    style={styles.createPhotoFrameImage}
                  />
                  <View style={styles.createPhotoEdit}>
                    <AppIcon name="photo" size={17} color="#FFFFFF" />
                  </View>
                </>
              ) : (
                <>
                  <AppIcon
                    name="photo"
                    size={30}
                    color={isDark ? "#A9A5B7" : "#667085"}
                  />
                  <Text style={styles.createPhotoPlaceholder}>
                    {isPicking ? "Abriendo galería..." : "Elegir de la galería"}
                  </Text>
                </>
              )}
            </Pressable>

            {Platform.OS !== "web" && (
              <Pressable
                accessibilityRole="button"
                disabled={isPicking}
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
              La foto ayuda a mostrar el estado de lo que publicas.
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

            <View style={styles.createBottomRow}>
              {categoryPriceMode(draft.category) !== "none" ? (
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
