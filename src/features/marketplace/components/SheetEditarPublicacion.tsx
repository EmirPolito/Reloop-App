import { Image } from "expo-image";
import { useBottomSheetAwareHandlers } from "heroui-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  useAvisos,
  type AvisosActions,
} from "@/features/avisos/AvisosProvider";
import {
  FORM_CATEGORY_LABELS,
  validateDraft,
  type ProductDraft,
} from "@/features/crear-publicacion/draftRules";
import { BotonPaso } from "@/features/onboarding/components/BotonPaso";
import { SheetEditar } from "@/features/perfil/editar/SheetEditar";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text, TextInput } from "@/features/shared/Text";
import { useImagePicker } from "@/hooks/useImagePicker";
import { uploadImage } from "@/lib/cloudinary";
import { describeFirestoreError } from "@/lib/firestoreValues";
import { CATEGORIES } from "../data";
import { updateProduct } from "../productRepository";
import { categoryPriceMode } from "../rules";
import type { Product } from "../types";

/**
 * Drawer para editar una publicación propia, con los mismos campos que al crearla: foto,
 * nombre, descripción, categoría y precio (el precio solo si la categoría lo lleva).
 * Guarda con un botón y avisa arriba cuando se actualizó.
 */
export function SheetEditarPublicacion({
  producto,
  onClose,
}: {
  /** La publicación por editar; `null` con el drawer cerrado */
  producto: Product | null;
  onClose: () => void;
}) {
  const { isDark } = useAppTheme();
  // El drawer se dibuja en un portal, fuera de los proveedores de la app: el tema y los
  // avisos se leen aquí, donde sí están, y se le pasan al formulario
  const { mostrar } = useAvisos();
  return (
    <SheetEditar
      visible={producto !== null}
      titulo="Editar publicación"
      isDark={isDark}
      onClose={onClose}
    >
      {/* Se monta de nuevo con cada publicación: los campos parten de lo guardado */}
      {producto ? (
        <Formulario
          key={producto.id}
          producto={producto}
          isDark={isDark}
          mostrar={mostrar}
          onClose={onClose}
        />
      ) : null}
    </SheetEditar>
  );
}

/** El borrador de edición parte de lo que tiene la publicación */
function borradorDe(producto: Product): ProductDraft {
  return {
    name: producto.name,
    description:
      producto.description === "Sin descripción" ? "" : producto.description,
    priceText: producto.price > 0 ? String(producto.price) : "",
    quantityText: String(producto.availableQuantity),
    category: producto.category,
    photos: producto.images,
    options: [],
    ubicacion: producto.ubicacion ?? "",
  };
}

function Formulario({
  producto,
  isDark,
  mostrar,
  onClose,
}: {
  producto: Product;
  isDark: boolean;
  mostrar: AvisosActions["mostrar"];
  onClose: () => void;
}) {
  const teclado = useBottomSheetAwareHandlers();
  const { isPicking, pickSquareImage } = useImagePicker();
  const [inicial] = useState(() => borradorDe(producto));
  const [borrador, setBorrador] = useState(inicial);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (cambios: Partial<ProductDraft>) =>
    setBorrador((actual) => ({ ...actual, ...cambios }));

  const hayCambios =
    borrador.name.trim() !== inicial.name ||
    borrador.description.trim() !== inicial.description ||
    borrador.priceText.trim() !== inicial.priceText ||
    borrador.quantityText.trim() !== inicial.quantityText ||
    borrador.category !== inicial.category ||
    borrador.photos[0] !== inicial.photos[0];

  const elegirFoto = async () => {
    const uri = await pickSquareImage();
    // Cambia la foto grande; las demás se quedan
    if (uri) cambiar({ photos: [uri, ...borrador.photos.slice(1)] });
  };

  const guardar = async () => {
    if (guardando) return;
    // Las mismas comprobaciones que al publicar
    const resultado = validateDraft(borrador);
    if (!resultado.valid) {
      mostrar({
        tipo: "error",
        titulo: resultado.title,
        descripcion: resultado.message,
      });
      return;
    }
    setGuardando(true);
    try {
      // Una foto nueva (de la galería) se sube; la que ya estaba subida se deja como está
      const principal = borrador.photos[0];
      const imageUrl = principal ? await uploadImage(principal) : null;
      const nombre = borrador.name.trim();
      await updateProduct(producto.id, {
        name: nombre,
        description: borrador.description.trim() || "Sin descripción",
        category: borrador.category,
        price: resultado.price,
        availableQuantity: resultado.availableQuantity,
        imageUrl,
        imagenes: imageUrl
          ? [imageUrl, ...producto.images.slice(1)]
          : producto.images.slice(1),
      });
      onClose();
      mostrar({
        tipo: "exito",
        titulo: "Publicación actualizada",
        descripcion: `"${nombre}" se guardó correctamente.`,
      });
    } catch (error) {
      mostrar({
        tipo: "error",
        titulo: "No se pudo guardar",
        descripcion: describeFirestoreError(error),
      });
    } finally {
      setGuardando(false);
    }
  };

  const colorTexto = isDark ? "#F1F5F9" : "#101010";
  const colorSuave = isDark ? "#C4C7CC" : "#8A8A8F";
  const campo = {
    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F1F1F3",
    color: colorTexto,
  };

  return (
    <View style={estilos.formulario}>
      {/* Foto: tocar la cambia */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cambiar la foto del producto"
        onPress={() => void elegirFoto()}
        style={[
          estilos.foto,
          { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#F1F1F3" },
        ]}
      >
        {borrador.photos[0] ? (
          <Image
            source={{ uri: borrador.photos[0] }}
            contentFit="cover"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <>
            <AppIcon name="photo" size={24} color="#725CFF" />
            <Text style={[estilos.textoFoto, { color: colorSuave }]}>
              {isPicking ? "Abriendo galería..." : "Agregar foto del producto"}
            </Text>
          </>
        )}
      </Pressable>

      <TextInput
        {...teclado}
        accessibilityLabel="Nombre del producto"
        value={borrador.name}
        onChangeText={(name) => cambiar({ name })}
        placeholder="Nombre del producto"
        placeholderTextColor={colorSuave}
        maxLength={40}
        style={[estilos.entrada, campo]}
      />

      <TextInput
        {...teclado}
        accessibilityLabel="Descripción"
        value={borrador.description}
        onChangeText={(description) => cambiar({ description })}
        placeholder="Descripción"
        placeholderTextColor={colorSuave}
        maxLength={500}
        multiline
        style={[estilos.entrada, estilos.descripcion, campo]}
      />

      <View style={estilos.categorias}>
        {CATEGORIES.map(({ id }) => {
          const elegida = borrador.category === id;
          return (
            <Pressable
              key={id}
              accessibilityRole="button"
              accessibilityState={{ selected: elegida }}
              onPress={() => cambiar({ category: id })}
              style={[
                estilos.categoria,
                {
                  backgroundColor: elegida
                    ? isDark
                      ? "#F1F5F9"
                      : "#101010"
                    : isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#F1F1F3",
                },
              ]}
            >
              <Text
                style={[
                  estilos.textoCategoria,
                  {
                    color: elegida
                      ? isDark
                        ? "#101010"
                        : "#FFFFFF"
                      : colorTexto,
                  },
                ]}
              >
                {FORM_CATEGORY_LABELS[id]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {categoryPriceMode(borrador.category) !== "none" ? (
        <TextInput
          {...teclado}
          accessibilityLabel="Precio"
          value={borrador.priceText}
          onChangeText={(priceText) => cambiar({ priceText })}
          placeholder="Precio"
          placeholderTextColor={colorSuave}
          keyboardType="decimal-pad"
          style={[estilos.entrada, campo]}
        />
      ) : null}
      <TextInput
        {...teclado}
        accessibilityLabel="Cantidad disponible"
        value={borrador.quantityText}
        onChangeText={(quantityText) =>
          cambiar({
            quantityText: quantityText.replace(/[^0-9]/g, ""),
          })
        }
        placeholder="Cantidad disponible"
        placeholderTextColor={colorSuave}
        keyboardType="number-pad"
        maxLength={4}
        style={[estilos.entrada, campo]}
      />

      <BotonPaso
        texto="Guardar cambios"
        isDark={isDark}
        cargando={guardando}
        deshabilitado={!hayCambios}
        onPress={() => void guardar()}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  formulario: { paddingHorizontal: 17, gap: 12 },
  foto: {
    height: 104,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  textoFoto: { fontFamily: "Inter_500Medium", fontSize: 13 },
  entrada: {
    minHeight: 50,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  },
  descripcion: { minHeight: 84, textAlignVertical: "top" },
  categorias: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoria: {
    height: 36,
    paddingHorizontal: 15,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  textoCategoria: { fontFamily: "Inter_500Medium", fontSize: 13.5 },
});
