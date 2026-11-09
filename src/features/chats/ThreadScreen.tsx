import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackHeader } from "@/components/ui/BackHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/LoadingState";
import { useProduct } from "@/features/marketplace/hooks/useProductsByIds";
import { useAppNavigation } from "@/features/navigation/useAppNavigation";
import { useAppTheme } from "@/features/shared/AppThemeProvider";
import { useDraft } from "@/features/shared/DraftsProvider";
import { useImagePicker } from "@/hooks/useImagePicker";
import { useLatestRef } from "@/hooks/useLatestRef";
import { showErrorAlert } from "@/utils/alerts";
import { useChatActions, useChats } from "./ChatProvider";
import { ImageViewerModal } from "./components/ImageViewerModal";
import { MessageBubble } from "./components/MessageBubble";
import { MessageComposer } from "./components/MessageComposer";
import { ThreadHeader } from "./components/ThreadHeader";
import { ThreadMenu } from "./components/ThreadMenu";
import { ThreadProductContext } from "./components/ThreadProductContext";
import { useThreadMessages } from "./hooks/useThreadMessages";
import {
  THREAD_CONTENT_GAP,
  threadFixedHeight,
  useThreadHeaderHeight,
} from "./threadLayout";

const NO_IMAGES: string[] = [];

export function ThreadScreen({ chatId }: { chatId: string }) {
  const insets = useSafeAreaInsets();
  const headerHeight = useThreadHeaderHeight();
  const { styles } = useAppTheme();
  const { chats, status: chatsStatus } = useChats();
  const { sendMessage, markRead } = useChatActions();
  const {
    messages,
    initialCount,
    status: messagesStatus,
  } = useThreadMessages(chatId);
  const { back, openProduct, openUserProfile } = useAppNavigation();
  const { pickImages } = useImagePicker();
  const [messageDraft, setMessageDraft] = useDraft(`message:${chatId}`);

  const [showMenu, setShowMenu] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>(NO_IMAGES);
  const [sending, setSending] = useState(false);
  const [viewer, setViewer] = useState({ images: NO_IMAGES, initialIndex: 0 });
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

  const activeChat = chats.find((chat) => chat.id === chatId) ?? null;
  const { product: relatedProduct } = useProduct(activeChat?.productId);
  const unread = activeChat?.unread ?? false;

  // Abrir el chat (o recibir un mensaje con el chat abierto) lo marca como leído
  useEffect(() => {
    if (!unread) return;
    markRead(chatId).catch((error) =>
      console.warn("No se pudo marcar el chat como leído.", error),
    );
  }, [unread, chatId, markRead]);

  async function handleSend() {
    const text = messageDraft.trim();
    if ((!text && selectedImages.length === 0) || sending) return;
    const images = selectedImages;
    // Un texto se ve al instante (Firestore lo muestra antes de confirmarlo); las fotos hay que subirlas antes
    const uploading = images.length > 0;
    if (!uploading) setMessageDraft("");
    setSending(uploading);
    try {
      await sendMessage(chatId, { text, images });
      if (uploading) {
        setMessageDraft("");
        setSelectedImages(NO_IMAGES);
      }
    } catch (error) {
      if (!uploading) setMessageDraft(text);
      showErrorAlert("No se pudo enviar el mensaje", error);
    } finally {
      setSending(false);
    }
  }

  // Handler estable para el botón de enviar (siempre llama a la última versión)
  const handleSendRef = useLatestRef(handleSend);
  const onSendPress = useCallback(() => {
    void handleSendRef.current();
  }, [handleSendRef]);

  const openImageViewer = useCallback(
    (images: string[], initialIndex: number) =>
      setViewer({ images, initialIndex }),
    [],
  );
  const closeImageViewer = useCallback(
    () => setViewer({ images: NO_IMAGES, initialIndex: 0 }),
    [],
  );

  async function handlePickImages() {
    const uris = await pickImages();
    if (uris.length > 0) setSelectedImages((current) => [...current, ...uris]);
  }

  const removeSelectedImage = (indexToRemove: number) =>
    setSelectedImages((current) =>
      current.filter((_, index) => index !== indexToRemove),
    );

  if (!activeChat) {
    // Un chat recién creado tarda un instante en llegar: solo es "no encontrado" si algo falló
    const notFound = chatsStatus === "error" || messagesStatus === "error";
    return (
      <View style={styles.fill}>
        <BackHeader title="Chat" onBack={back} />
        {notFound ? (
          <Animated.View entering={FadeIn.duration(250)}>
            <EmptyState
              title="No encontramos la conversación"
              message="Vuelve a tus chats."
              icon="chat"
            />
          </Animated.View>
        ) : (
          <LoadingState />
        )}
      </View>
    );
  }

  const fixedTop = threadFixedHeight(headerHeight, Boolean(relatedProduct));

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* 1. Los mensajes van PRIMERO y sin marginTop:
          ocupan toda la pantalla y pasan por detrás del header */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.threadMessages,
          {
            paddingTop: fixedTop + THREAD_CONTENT_GAP,
            paddingHorizontal: 17,
            paddingBottom:
              Math.max(insets.bottom, 16) +
              (selectedImages.length > 0 ? 140 : 50) +
              5,
          },
        ]}
        scrollIndicatorInsets={{ top: fixedTop }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          scrollRef.current?.scrollToEnd({ animated: false })
        }
      >
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            isNew={index >= initialCount}
            onOpenImages={openImageViewer}
          />
        ))}
      </ScrollView>

      {/* 2. Tarjeta del producto, encima de la lista y debajo del header */}
      {relatedProduct ? (
        <ThreadProductContext
          product={relatedProduct}
          onPress={() => openProduct(relatedProduct.id)}
        />
      ) : null}

      {/* 3. El header va DESPUÉS de la lista, así queda por encima */}
      <ThreadHeader
        contactName={activeChat.name}
        onBack={back}
        onOpenProfile={() => openUserProfile(activeChat.otherId)}
        onOpenMenu={() => setShowMenu(true)}
      />

      <ThreadMenu visible={showMenu} onClose={() => setShowMenu(false)} />

      <ImageViewerModal
        images={viewer.images}
        initialIndex={viewer.initialIndex}
        onClose={closeImageViewer}
      />

      <MessageComposer
        draft={messageDraft}
        onChangeDraft={setMessageDraft}
        onSubmit={onSendPress}
        onSendPress={onSendPress}
        sending={sending}
        images={selectedImages}
        onPickImages={handlePickImages}
        onRemoveImage={removeSelectedImage}
        onOpenImage={openImageViewer}
      />
    </KeyboardAvoidingView>
  );
}
