import { useLocalSearchParams } from "expo-router";

import { TabScene } from "@/components/TabScene";
import { ThreadScreen } from "@/features/chats/ThreadScreen";

export default function ChatRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <TabScene efecto="modulo">
      <ThreadScreen chatId={id} />
    </TabScene>
  );
}
