import { useState } from "react";

import type { DatosPerfil } from "../temasPerfil";
import {
  SelectorAvatar,
  TITULOS_AVATAR,
  useFlujoAvatar,
} from "./SelectorAvatar";
import { ALTO_CONTENIDO_SHEET } from "./editarTema";
import { SheetEditar } from "./SheetEditar";

/**
 * Cambiar avatar: un carrusel con los avatares orbe, elegir una foto (Tomar / Elegir), la
 * cámara y el ajuste, en un solo drawer. El contenido es `SelectorAvatar`, el mismo que
 * usa el onboarding.
 */
export function SheetAvatar({
  visible,
  photo,
  orb,
  name,
  isDark,
  onClose,
  onGuardar,
}: {
  visible: boolean;
  photo: string | null;
  orb: number | null;
  name: string;
  isDark: boolean;
  onClose: () => void;
  /** Recibe la foto ya recortada o el orbe elegido; si lanza error, el drawer se queda abierto */
  onGuardar: (cambios: Pick<DatosPerfil, "photo" | "orb">) => Promise<void>;
}) {
  const flujo = useFlujoAvatar({ photo, orb, onGuardar, onListo: onClose });

  // Cada vez que se abre empieza desde el principio (ajuste de estado durante el render)
  const [abiertoAntes, setAbiertoAntes] = useState(visible);
  // Cuenta las aperturas: el carrusel se reinicia al abrir, nunca al cerrar (rehacerlo al
  // cerrar montaba todas sus imágenes justo mientras la card bajaba y trababa la salida)
  const [aperturas, setAperturas] = useState(0);
  if (visible !== abiertoAntes) {
    setAbiertoAntes(visible);
    if (visible) {
      flujo.reiniciar();
      setAperturas((n) => n + 1);
    }
  }

  return (
    <SheetEditar
      visible={visible}
      titulo={TITULOS_AVATAR[flujo.paso]}
      isDark={isDark}
      onClose={onClose}
      onBack={flujo.volver}
      permitirArrastrarContenido={flujo.paso !== "ajustar"}
    >
      <SelectorAvatar
        flujo={flujo}
        photo={photo}
        name={name}
        isDark={isDark}
        // Al reabrir el drawer el carrusel vuelve al avatar guardado
        claveCarrusel={String(aperturas)}
        // Mismo tamaño que el drawer del fondo, con o sin el botón negro
        altoMinimo={ALTO_CONTENIDO_SHEET}
        bajarOpciones={11}
      />
    </SheetEditar>
  );
}
