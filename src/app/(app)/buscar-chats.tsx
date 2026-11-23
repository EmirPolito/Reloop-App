import { TabScene } from "@/components/TabScene";
import { PantallaBuscarChats } from "@/features/chats/PantallaBuscarChats";

export default function BuscarChatsRoute() {
  return (
    <TabScene efecto="modulo">
      <PantallaBuscarChats />
    </TabScene>
  );
}
