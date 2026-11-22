import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
} from "react";
import {
  Keyboard,
  Platform,
  ScrollView,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Animated, {
  FadeIn,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { conSalida } from "@/components/salidaModulo";
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
import {
  HUECO_SOBRE_TECLADO,
  MessageComposer,
} from "./components/MessageComposer";
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
  const activeChat = chats.find((chat) => chat.id === chatId) ?? null;
  const { messages, status: messagesStatus } = useThreadMessages(
    chatId,
    activeChat?.deletedAt,
  );
  // Solo se animan los mensajes enviados después de abrir el chat. Antes se contaban los que
  // había en la primera tanda: Firestore entrega primero los del teléfono y luego los del
  // servidor, y los de esa segunda tanda entraban animados como si fueran nuevos
  const [abiertoEn] = useState(() => Date.now());
  // La lista se muestra cuando ya quedó en el último mensaje: si no, se veía arriba y brincaba
  const [enPosicion, setEnPosicion] = useState(false);
  // Se muestra en cuanto cargan los mensajes, dos cuadros después (ya acomodada y en el último).
  // No basta con esperar a que cambie el tamaño del contenido: en una conversación corta el
  // contenedor mide siempre lo mismo que la pantalla y en iPhone ese aviso no volvía a llegar,
  // así que la lista se quedaba invisible
  useEffect(() => {
    if (enPosicion || messagesStatus === "loading") return;
    let segundo = 0;
    const primero = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
      segundo = requestAnimationFrame(() => setEnPosicion(true));
    });
    return () => {
      cancelAnimationFrame(primero);
      cancelAnimationFrame(segundo);
    };
  }, [enPosicion, messagesStatus]);
  const { back, openProduct, openUserProfile } = useAppNavigation();
  const { pickImages } = useImagePicker();
  const [messageDraft, setMessageDraft] = useDraft(`message:${chatId}`);
  // Sale con la animación de módulo y luego regresa
  const volver = useCallback(() => conSalida(back), [back]);

  const [showMenu, setShowMenu] = useState(false);
  const [selectedImages, setSelectedImages] = useState<string[]>(NO_IMAGES);
  const [sending, setSending] = useState(false);
  const [viewer, setViewer] = useState({ images: NO_IMAGES, initialIndex: 0 });
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  // Con el teclado la lista sube con una transformación (que corre en el hilo de UI y no
  // obliga a recalcular el tamaño de todos los mensajes en cada cuadro, como hacía el margen).
  // Solo sube lo que hace falta: una conversación corta no se mueve ni se esconde.
  const keyboard = useAnimatedKeyboard();
  const alturaLista = useSharedValue(0);
  const alturaContenido = useSharedValue(0);
  // La lista sube lo mismo que el input (lo que el teclado rebasa la zona segura de abajo, más
  // su hueco), no el alto completo del teclado: si no, el último mensaje subía de más
  const bottomInset = insets.bottom;

  // Con el teclado abierto la lista sube, pero no se encoge: lo de arriba queda debajo del
  // encabezado y la lista creía que ya lo mostraba todo, así que no se podía desplazar para
  // verlo (se pegaba y regresaba). Mientras el teclado está abierto se agrega ese mismo tramo
  // al scroll, arriba, para poder llegar a los primeros mensajes
  const [tecladoFinal, setTecladoFinal] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === "ios";
    const abre = Keyboard.addListener(
      ios ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setTecladoFinal(e.endCoordinates.height),
    );
    const cierra = Keyboard.addListener(
      ios ? "keyboardWillHide" : "keyboardDidHide",
      () => setTecladoFinal(0),
    );
    return () => {
      abre.remove();
      cierra.remove();
    };
  }, []);
  const extraArriba =
    tecladoFinal > 0
      ? Math.max(tecladoFinal - bottomInset, 0) + HUECO_SOBRE_TECLADO
      : 0;
  const listStyle = useAnimatedStyle(() => {
    const teclado = keyboard.height.get();
    const levantar =
      Math.max(teclado - bottomInset, 0) +
      Math.min(teclado / 40, 1) * HUECO_SOBRE_TECLADO;
    const visible = alturaLista.get();
    const ocupado = Math.min(alturaContenido.get(), visible);
    const subir = Math.min(
      levantar,
      Math.max(0, ocupado - (visible - levantar)),
    );
    return { transform: [{ translateY: -subir }] };
  });

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
        <BackHeader title="Chat" onBack={volver} />
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
    <View style={styles.fill}>
      {/* 1. Los mensajes van PRIMERO y sin marginTop:
          ocupan toda la pantalla y pasan por detrás del header */}
      <Animated.ScrollView
        ref={scrollRef}
        style={[{ flex: 1, opacity: enPosicion ? 1 : 0 }, listStyle]}
        contentContainerStyle={[
          styles.threadMessages,
          {
            // En Android no hay contentInset: el tramo extra va como relleno
            paddingTop:
              fixedTop +
              THREAD_CONTENT_GAP +
              (Platform.OS === "ios" ? 0 : extraArriba),
            paddingHorizontal: 17,
            paddingBottom:
              Math.max(insets.bottom, 16) +
              (selectedImages.length > 0 ? 140 : 50) +
              // Aire entre el último mensaje y el input
              22,
          },
        ]}
        scrollIndicatorInsets={{ top: fixedTop }}
        // En iOS el tramo extra se agrega sin mover los mensajes (no cambia el contenido)
        contentInset={Platform.OS === "ios" ? { top: extraArriba } : undefined}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onLayout={(e: LayoutChangeEvent) =>
          alturaLista.set(e.nativeEvent.layout.height)
        }
        onContentSizeChange={(_, alto) => {
          alturaContenido.set(alto);
          scrollRef.current?.scrollToEnd({ animated: false });
        }}
      >
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            contactId={activeChat.otherId}
            contactName={activeChat.name}
            // El avatar sale en el primer mensaje de cada racha de la otra persona
            showAvatar={
              message.from === "them" && messages[index - 1]?.from !== "them"
            }
            isNew={message.time >= abiertoEn}
            onOpenImages={openImageViewer}
          />
        ))}
      </Animated.ScrollView>

      {/* 2. Tarjeta del producto, encima de la lista y debajo del header */}
      {relatedProduct ? (
        <ThreadProductContext
          product={relatedProduct}
          onPress={() => openProduct(relatedProduct.id)}
        />
      ) : null}

      {/* 3. El header va DESPUÉS de la lista, así queda por encima */}
      <ThreadHeader
        contactId={activeChat.otherId}
        contactName={activeChat.name}
        onBack={volver}
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
    </View>
  );
}
