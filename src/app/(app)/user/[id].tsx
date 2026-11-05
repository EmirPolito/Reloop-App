import { useLocalSearchParams } from "expo-router";

import { PantallaPerfilPublico } from "@/features/perfil";

export default function UserRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PantallaPerfilPublico userId={id} />;
}
