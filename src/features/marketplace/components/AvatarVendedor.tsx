import { UserAvatar } from "@/components/ui/UserAvatar";
import { usePerfilDe } from "@/features/perfil/hooks/usePerfilDe";
import { useIsPremium } from "@/features/premium/hooks/useMembership";

/**
 * Avatar actual de quien vende: lee su perfil en vivo (la publicación no guarda su foto, y
 * el nombre que trae es solo una copia de cuando publicó).
 */
export function AvatarVendedor({
  ownerId,
  fallbackName,
  size,
}: {
  ownerId: string;
  /** Nombre de la publicación, mientras llega el del perfil */
  fallbackName: string;
  size: number;
}) {
  const perfil = usePerfilDe(ownerId);
  const premium = useIsPremium(ownerId);
  return (
    <UserAvatar
      photo={perfil?.photo ?? null}
      orb={perfil?.orb ?? null}
      name={perfil?.name ?? fallbackName}
      size={size}
      premium={premium}
    />
  );
}
