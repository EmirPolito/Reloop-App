import { BottomSheet } from "heroui-native";
import { memo, useCallback } from "react";
import { SNAP_POINTS, PALETA } from "./drawerTheme";
import { ContenidoDrawer, type DrawerEditarPerfilProps } from "./ContenidoDrawer";

/* ========================================================================== */
/*  Drawer (contenedor)                                                       */
/*  El sheet NO maneja el teclado: queda fijo al 92%. El teclado lo resuelve  */
/*  ContenidoDrawer (padding inferior + scroll al input enfocado).            */
/* ========================================================================== */

export const DrawerEditarPerfil = memo(function DrawerEditarPerfil({
  visible,
  onClose,
  ...rest
}: DrawerEditarPerfilProps) {
  /* onOpenChange se dispara en TODOS los cierres: swipe, overlay, X, código */
  const onOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  return (
    <BottomSheet isOpen={visible} onOpenChange={onOpenChange}>
      <BottomSheet.Portal>
        <BottomSheet.Overlay />
        <BottomSheet.Content
          snapPoints={SNAP_POINTS}
          enableDynamicSizing={false}
          enableOverDrag={false}
          enablePanDownToClose
          enableBlurKeyboardOnGesture
          android_keyboardInputMode="adjustPan"
          contentContainerClassName="h-full px-0 pt-0 pb-0"
          backgroundClassName={PALETA[rest.isDark ? "oscuro" : "claro"].sheet}
        >
          <ContenidoDrawer visible={visible} onClose={onClose} {...rest} />
        </BottomSheet.Content>
      </BottomSheet.Portal>
    </BottomSheet>
  );
});
