import { useLocalSearchParams } from "expo-router";

import { ThreadScreen } from "@/features/chats/ThreadScreen";

export default function ChatRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ThreadScreen chatId={id} />;
}
