import { TabScene } from "@/components/TabScene";
import { PantallaFavoritos } from "@/features/favoritos";

export default function FavoritesRoute() {
  return (
    <TabScene efecto="modulo">
      <PantallaFavoritos />
    </TabScene>
  );
}
