import { TabScene } from "@/components/TabScene";
import { BuscarChatsScreen } from "@/features/chats/BuscarChatsScreen";

export default function BuscarChatsRoute() {
  return (
    <TabScene efecto="modulo">
      <BuscarChatsScreen />
    </TabScene>
  );
}
