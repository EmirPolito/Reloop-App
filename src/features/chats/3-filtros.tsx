import { FiltrosPildoras } from "@/components/ui/FiltrosPildoras";

/**
 * Píldoras de filtro de chats: las mismas que notificaciones y favoritos, dentro de un marco
 * redondo del ancho de la tarjeta de chats.
 */
export function PildorasSegmentadas<T extends string>({
  opciones,
  activo,
  onCambiar,
}: {
  opciones: { id: T; texto: string }[];
  activo: T;
  onCambiar: (id: T) => void;
}) {
  return (
    <FiltrosPildoras
      opciones={opciones}
      activo={activo}
      onCambiar={onCambiar}
      enMarco
    />
  );
}
