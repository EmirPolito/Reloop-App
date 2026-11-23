import { TabScene } from "@/components/TabScene";
import { PantallaChats } from "@/features/chats/PantallaChats";

export default function ChatsRoute() {
  return (
    <TabScene efecto="modulo">
      <PantallaChats />
    </TabScene>
  );
}
