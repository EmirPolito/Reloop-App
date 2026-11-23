import { useLocalSearchParams } from "expo-router";

import { TabScene } from "@/components/TabScene";
import { PantallaConversacion } from "@/features/chats/PantallaConversacion";

export default function ChatRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <TabScene efecto="modulo">
      <PantallaConversacion chatId={id} />
    </TabScene>
  );
}
