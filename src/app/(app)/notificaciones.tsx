import { TabScene } from "@/components/TabScene";
import { PantallaNotificaciones } from "@/features/notificaciones/PantallaNotificaciones";

export default function NotificacionesRoute() {
  return (
    <TabScene efecto="modulo">
      <PantallaNotificaciones />
    </TabScene>
  );
}
