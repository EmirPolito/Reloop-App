import { useLocalSearchParams } from "expo-router";

import { TabScene } from "@/components/TabScene";
import { DetailScreen } from "@/features/marketplace/DetailScreen";

export default function ProductRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <TabScene efecto="modulo">
      <DetailScreen productId={id} />
    </TabScene>
  );
}
