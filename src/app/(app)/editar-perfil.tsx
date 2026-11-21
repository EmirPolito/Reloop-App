import { TabScene } from "@/components/TabScene";
import { PantallaEditarPerfil } from "@/features/perfil";

export default function EditarPerfilRoute() {
  return (
    <TabScene efecto="modulo">
      <PantallaEditarPerfil />
    </TabScene>
  );
}
