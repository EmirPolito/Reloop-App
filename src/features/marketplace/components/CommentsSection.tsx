import { Pressable, View } from "react-native";

import { AppIcon } from "@/features/shared/AppIcon";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { Text, TextInput } from "@/features/shared/Text";
import type { ProductComment } from "../types";

/** Lista de comentarios de una publicación con su caja para escribir uno nuevo. */
export function CommentsSection({
  comments,
  draft,
  onChangeDraft,
  onSubmit,
}: {
  comments: ProductComment[];
  draft: string;
  onChangeDraft: (text: string) => void;
  onSubmit: () => void;
}) {
  const { styles, isDark } = useAppTheme();
  return (
    <View style={styles.commentsSection}>
      <Text style={styles.commentsTitle}>Comentarios ({comments.length})</Text>
      {comments.length === 0 ? (
        <Text style={styles.commentEmpty}>
          Todavía no hay comentarios. ¡Sé la primera persona!
        </Text>
      ) : (
        comments.map((comment) => (
          <View key={comment.id} style={styles.commentRow}>
            <Text style={styles.commentAuthor}>{comment.author}</Text>
            <Text style={styles.commentBody}>{comment.text}</Text>
          </View>
        ))
      )}
      <View style={styles.commentComposer}>
        <TextInput
          accessibilityLabel="Escribe un comentario"
          value={draft}
          onChangeText={onChangeDraft}
          placeholder="Escribe un comentario..."
          placeholderTextColor={isDark ? "#B3AEC0" : "#828690"}
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={onSubmit}
          style={styles.commentInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Publicar comentario"
          onPress={onSubmit}
          style={styles.commentSend}
        >
          <AppIcon name="send" size={17} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}
