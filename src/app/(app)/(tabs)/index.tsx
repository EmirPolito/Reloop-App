import { TabScene } from "@/components/TabScene";
import { HomeScreen } from "@/features/home/HomeScreen";

export default function HomeRoute() {
  return (
    <TabScene>
      <HomeScreen />
    </TabScene>
  );
}
