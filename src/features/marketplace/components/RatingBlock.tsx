import { Pressable, View } from "react-native";

import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text } from "@/features/shared/Text";

const STARS = [1, 2, 3, 4, 5];

/** Selector de una a cinco estrellas para calificar un producto. */
export function RatingBlock({
  rating,
  onRate,
}: {
  /** Calificación del usuario; 0 si aún no califica. */
  rating: number;
  onRate: (rating: number) => void;
}) {
  const { styles } = useAppTheme();
  return (
    <View style={styles.ratingBlock}>
      <Text style={styles.ratingPrompt}>Califica el producto</Text>
      <View style={styles.ratingStars}>
        {STARS.map((star) => (
          <Pressable
            key={star}
            accessibilityRole="button"
            accessibilityLabel={`Calificar producto con ${star} ${star === 1 ? "estrella" : "estrellas"}`}
            accessibilityState={{ selected: rating === star }}
            onPress={() => onRate(star)}
            style={styles.ratingStar}
          >
            <AppIcon
              name={rating >= star ? "starFilled" : "star"}
              size={23}
              color={rating >= star ? "#F4A623" : "#B5B8BF"}
            />
          </Pressable>
        ))}
        <Text style={styles.ratingCaption}>
          {rating ? `Tu calificación: ${rating}/5` : "Elige de 1 a 5"}
        </Text>
      </View>
    </View>
  );
}
