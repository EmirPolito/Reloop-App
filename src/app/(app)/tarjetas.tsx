import { TabScene } from "@/components/TabScene";
import { PantallaTarjetas } from "@/features/tarjetas/PantallaTarjetas";

export default function TarjetasRoute() {
  return (
    <TabScene efecto="modulo">
      <PantallaTarjetas />
    </TabScene>
  );
}
