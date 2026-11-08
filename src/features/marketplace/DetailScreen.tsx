import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Avatar } from "@/components/ui/Avatar";
import { BackHeader } from "@/components/ui/BackHeader";
import { PrimaryButton, SecondaryButton } from "@/components/ui/Buttons";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useOpenChat } from "@/features/chats/hooks/useOpenChat";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { PRODUCT_COLORS, PRODUCT_ICONS } from "@/features/shared/constants";
import { useDraft } from "@/features/shared/DraftsProvider";
import { Text } from "@/features/shared/Text";
import { optimizedImageUrl } from "@/lib/imageUrl";
import { showErrorAlert } from "@/utils/alerts";
import { CommentsSection } from "./components/CommentsSection";
import { DetailStat } from "./components/DetailStat";
import { RatingBlock } from "./components/RatingBlock";
import { categoryFor } from "./data";
import { useProduct } from "./hooks/useProductsByIds";
import { useProductComments } from "./hooks/useProductComments";
import { useReportProduct } from "./hooks/useReportProduct";
import { useToggleFavorite } from "./hooks/useToggleFavorite";
import { useMarketplaceActions, useMarketplaceState } from "./MarketplaceProvider";
import { allowsProductRating, formatProductPrice } from "./rules";

/** Ancho al que se pide la foto grande a Cloudinary. */
const DETAIL_IMAGE_WIDTH = 1000;

export function DetailScreen({ productId }: { productId: string }) {
  const insets = useSafeAreaInsets();
  const { styles, isDark } = useAppTheme();
  const { favorites, ratings, reported } = useMarketplaceState();
  const { rateProduct } = useMarketplaceActions();
  const toggleFavorite = useToggleFavorite();
  const { back, openUserProfile } = useAppNavigation();
  const openChat = useOpenChat();
  const reportProduct = useReportProduct();
  const { product, loading } = useProduct(productId);
  const { comments, addComment } = useProductComments(productId);
  const [commentDraft, setCommentDraft] = useDraft(`comment:${productId}`);

  if (!product) {
    return (
      <View style={styles.fill}>
        <BackHeader title="Publicación" onBack={back} />
        {loading ? (
          <LoadingState />
        ) : (
          <EmptyState
            title="No encontramos este producto"
            message="Vuelve al inicio y revisa otras publicaciones."
            icon="search"
          />
        )}
      </View>
    );
  }

  const category = categoryFor(product.category);
  const favorite = favorites.includes(product.id);
  // Quien publica no califica su propia publicación
  const canRate = allowsProductRating(product.category) && !product.isMine;
  const userRating = ratings[product.id] ?? 0;
  const isReported = reported.includes(product.id);
  const price = formatProductPrice(product);
  const imageUri = optimizedImageUrl(product.imageUri, DETAIL_IMAGE_WIDTH);
  const seller = { id: product.ownerId, name: product.seller };

  function submitComment() {
    const text = commentDraft.trim();
    if (!text) return;
    setCommentDraft("");
    addComment(text).catch((error) => {
      setCommentDraft(text);
      showErrorAlert("No se pudo publicar el comentario", error);
    });
  }

  function submitRating(rating: number) {
    rateProduct(productId, rating).catch((error) =>
      showErrorAlert("No se pudo guardar tu calificación", error),
    );
  }

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={[
        styles.detailContent,
        { paddingBottom: Math.max(insets.bottom + 24, 28) },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.detailHero}>
        <LinearGradient
          colors={PRODUCT_COLORS[product.category]}
          style={styles.detailImage}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              contentFit="cover"
              cachePolicy="memory-disk"
              transition={0}
              style={styles.detailImageItem}
            />
          ) : (
            <AppIcon
              name={PRODUCT_ICONS[product.category]}
              size={58}
              color="#FFFFFF"
            />
          )}
        </LinearGradient>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={back}
          style={[styles.detailBack, { top: insets.top + 10 }]}
        >
          <AppIcon
            name="back"
            size={21}
            color={isDark ? "#FFFFFF" : "#23242C"}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            favorite ? "Quitar de favoritos" : "Agregar a favoritos"
          }
          onPress={() => toggleFavorite(product.id)}
          style={[styles.detailFav, { top: insets.top + 10 }]}
        >
          <AppIcon
            name="favorite"
            size={20}
            color={favorite ? "#FF386B" : "#747780"}
          />
        </Pressable>
      </View>
      <View style={styles.detailCard}>
        <View style={styles.sellerRow}>
          <Avatar name={product.seller} />
          <View style={styles.sellerInfo}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Ver perfil de ${product.seller}`}
              onPress={() => openUserProfile(product.ownerId)}
            >
              <Text style={styles.sellerName}>{product.seller}</Text>
            </Pressable>
            <Text style={styles.sellerCaption}>
              {product.isMine ? "Tu publicación" : "Emprendimiento estudiantil"}
            </Text>
          </View>
        </View>
        <Text style={styles.detailName}>{product.name}</Text>
        {price ? <Text style={styles.priceBig}>{price}</Text> : null}
        <Text style={styles.detailDescription}>{product.description}</Text>
        <View style={styles.statsRow}>
          {allowsProductRating(product.category) ? (
            <DetailStat
              value={(product.rating ?? 0).toFixed(1)}
              label="Calificación de producto"
            />
          ) : null}
          <DetailStat value={product.distance} label="Distancia" />
          <DetailStat value={category.label} label="Categoría" />
        </View>
        {canRate ? (
          <RatingBlock rating={userRating} onRate={submitRating} />
        ) : null}
        <View style={styles.detailActions}>
          <SecondaryButton
            icon="chat"
            label="Chat"
            onPress={() => openChat(seller)}
          />
          <PrimaryButton
            label={product.category === "donacion" ? "Solicitar" : "Comprar"}
            onPress={() => openChat(seller, product)}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reportar publicación"
          disabled={isReported}
          onPress={() => reportProduct(product)}
          style={[styles.reportButton, isReported && styles.disabledButton]}
        >
          <AppIcon name="flag" size={16} color="#D14343" />
          <Text style={styles.reportButtonText}>
            {isReported ? "Publicación reportada" : "Reportar publicación"}
          </Text>
        </Pressable>
        <CommentsSection
          comments={comments}
          draft={commentDraft}
          onChangeDraft={setCommentDraft}
          onSubmit={submitComment}
        />
      </View>
    </ScrollView>
  );
}
