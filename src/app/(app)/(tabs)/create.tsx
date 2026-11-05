import { TabScene } from "@/components/TabScene";
import { PantallaCrearPublicacion } from "@/features/crear-publicacion";

export default function CreateRoute() {
  return (
    <TabScene>
      <PantallaCrearPublicacion />
    </TabScene>
  );
}
