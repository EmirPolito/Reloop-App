import { useState } from "react";

import type { DatosPerfil } from "../temasPerfil";
import { indiceDeAvatar } from "./CarruselAvatares";
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
  // La foto, el orbe y el nombre se toman al abrir: al guardar cambian justo cuando la card
  // baja, y el carrusel se volvía a dibujar (y cargaba la foto nueva) en plena salida
  const [datos, setDatos] = useState({ photo, orb, name });
  const flujo = useFlujoAvatar({
    photo: datos.photo,
    orb: datos.orb,
    onGuardar,
    onListo: onClose,
  });

  // Cada vez que se abre empieza desde el principio (ajuste de estado durante el render)
  const [abiertoAntes, setAbiertoAntes] = useState(visible);
  // Cuenta las aperturas: el carrusel vuelve al inicio al abrir, nunca al cerrar
  const [aperturas, setAperturas] = useState(0);
  if (visible !== abiertoAntes) {
    setAbiertoAntes(visible);
    if (visible) {
      setDatos({ photo, orb, name });
      flujo.reiniciar(indiceDeAvatar(photo, orb));
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
        photo={datos.photo}
        name={datos.name}
        isDark={isDark}
        // Se monta de nuevo solo si cambió lo guardado; al reabrir solo vuelve al inicio
        claveCarrusel={`${flujo.guardado}-${datos.photo ?? ""}`}
        reinicioCarrusel={aperturas}
        // Mismo tamaño que el drawer del fondo, con o sin el botón negro
        altoMinimo={ALTO_CONTENIDO_SHEET}
        bajarOpciones={11}
      />
    </SheetEditar>
  );
}
