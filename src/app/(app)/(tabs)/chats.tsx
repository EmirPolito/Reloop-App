import { TabScene } from "@/components/TabScene";
import { ChatsScreen } from "@/features/chats/ChatsScreen";

export default function ChatsRoute() {
  return (
    <TabScene efecto="modulo">
      <ChatsScreen />
    </TabScene>
  );
}
