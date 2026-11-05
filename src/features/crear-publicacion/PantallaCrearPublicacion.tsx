import { Image } from "expo-image";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native";

import { CATEGORIES } from "@/features/marketplace/data";
import { categoryPriceMode } from "@/features/marketplace/rules";
import type { CategoryId } from "@/features/marketplace/types";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text, TextInput } from "@/features/shared/Text";
import { useImagePicker } from "@/hooks/useImagePicker";
import { EMPTY_DRAFT, type ProductDraft } from "./draftRules";
import { usePublishProduct } from "./hooks/usePublishProduct";

/** Texto corto de cada categoría en el selector del formulario. */
const FORM_CATEGORY_LABELS: Record<CategoryId, string> = {
  venta: "Vender",
  cambio: "Cambiar",
  donacion: "Donar",
  mascota: "Adopción",
  comida: "Comida",
};

export function PantallaCrearPublicacion() {
  const { styles, isDark } = useAppTheme();
  const { navigate } = useAppNavigation();
  const { isPicking, pickSquareImage } = useImagePicker();
  const { publish, publishing } = usePublishProduct();
  // La pestaña sigue montada al navegar, así que el borrador se conserva sin proveedor aparte
  const [draft, setDraft] = useState<ProductDraft>(EMPTY_DRAFT);

  const placeholderColor = isDark ? "#B3AEC0" : "#828690";

  function updateDraft(patch: Partial<ProductDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function handlePickPhoto() {
    const uri = await pickSquareImage();
    if (uri) updateDraft({ photo: uri });
  }

  async function handlePublish() {
    if (publishing) return;
    if (await publish(draft)) setDraft(EMPTY_DRAFT);
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
            accessibilityLabel="Cerrar"
            onPress={() => navigate("home")}
            style={styles.closeButton}
          >
            <AppIcon
              name="close"
              size={19}
              color={isDark ? "#FFFFFF" : "#23242C"}
            />
          </Pressable>
          <Text style={styles.createTitle}>Nueva publicación</Text>
          <View style={styles.closeButtonSpacer} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handlePickPhoto}
          style={[
            styles.photoPicker,
            draft.photo && styles.photoPickerFilled,
          ]}
        >
          {draft.photo ? (
            <Image
              source={{ uri: draft.photo }}
              contentFit="cover"
              style={styles.photoPickerImage}
            />
          ) : (
            <>
              <AppIcon name="photo" size={27} color="#725CFF" />
              <Text style={styles.photoText}>
                {isPicking
                  ? "Abriendo galería..."
                  : "Agregar fotos del producto"}
              </Text>
            </>
          )}
        </Pressable>

        <TextInput
          accessibilityLabel="Nombre del producto"
          value={draft.name}
          onChangeText={(name) => updateDraft({ name })}
          placeholder="Nombre del producto"
          placeholderTextColor={placeholderColor}
          maxLength={40}
          style={styles.input}
        />

        <TextInput
          accessibilityLabel="Descripción"
          value={draft.description}
          onChangeText={(description) => updateDraft({ description })}
          placeholder="Descripción"
          placeholderTextColor={placeholderColor}
          multiline
          style={[styles.input, styles.descriptionInput]}
        />

        <View style={styles.formCategories}>
          {CATEGORIES.map(({ id }) => {
            const selected = draft.category === id;
            return (
              <Pressable
                key={id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => updateDraft({ category: id })}
                style={[
                  styles.formCategory,
                  selected && styles.formCategorySelected,
                ]}
              >
                <Text
                  style={[
                    styles.formCategoryText,
                    selected && styles.formCategoryTextSelected,
                  ]}
                >
                  {FORM_CATEGORY_LABELS[id]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {categoryPriceMode(draft.category) !== "none" && (
          <TextInput
            accessibilityLabel="Precio"
            value={draft.priceText}
            onChangeText={(priceText) => updateDraft({ priceText })}
            placeholder="Precio"
            placeholderTextColor={placeholderColor}
            keyboardType="decimal-pad"
            style={[styles.input, styles.priceInput]}
          />
        )}

        <View style={styles.communityField}>
          <AppIcon name="location" size={18} color="#0785FF" />
          <Text style={styles.communityFieldText}>Comunidad: UTSV</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={handlePublish}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryButtonText}>
            {publishing ? "Publicando..." : "Publicar"}
          </Text>
        </Pressable>

        <Text style={styles.formFootnote}>
          Las publicaciones con fotos claras destacan más.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
