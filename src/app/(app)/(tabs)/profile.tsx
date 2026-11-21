import { TabScene } from "@/components/TabScene";
import { PantallaPerfil } from "@/features/perfil";

export default function ProfileRoute() {
  return (
    <TabScene efecto="modulo">
      <PantallaPerfil />
    </TabScene>
  );
}
