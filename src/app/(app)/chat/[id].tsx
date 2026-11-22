import { useLocalSearchParams } from "expo-router";

import { TabScene } from "@/components/TabScene";
import { ThreadScreen } from "@/features/chats/ThreadScreen";

export default function ChatRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    // Entra y sale con la transición corta de módulo, como el buscador de chats
    <TabScene efecto="moduloRapido">
      <ThreadScreen chatId={id} />
    </TabScene>
  );
}
