import { useLocalSearchParams } from "expo-router";

import { TabScene } from "@/components/TabScene";
import { PantallaSeguidores } from "@/features/perfil/seguidores/PantallaSeguidores";

export default function SeguidoresRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <TabScene efecto="modulo">
      <PantallaSeguidores userId={id} />
    </TabScene>
  );
}
