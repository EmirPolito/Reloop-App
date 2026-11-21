import { useLocalSearchParams } from "expo-router";

import { TabScene } from "@/components/TabScene";
import { PantallaPerfilPublico } from "@/features/perfil";

export default function UserRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <TabScene efecto="modulo">
      <PantallaPerfilPublico userId={id} />
    </TabScene>
  );
}
