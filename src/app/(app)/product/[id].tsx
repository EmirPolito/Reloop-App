import { useLocalSearchParams } from "expo-router";

import { DetailScreen } from "@/features/marketplace/DetailScreen";

export default function ProductRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DetailScreen productId={id} />;
}
