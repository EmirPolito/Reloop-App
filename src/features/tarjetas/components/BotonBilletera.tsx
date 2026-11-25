import { PressableScale } from "@/components/PressableScale";
import { useTarjetas } from "../repositorioTarjetas";
import { Billetera } from "./Billetera";

/** La billetera pequeña mide 300 × esto de ancho */
const ESCALA = 0.2;
/** Ancho de la billetera pequeña del encabezado */
export const ANCHO_BOTON_BILLETERA = 300 * ESCALA;

/**
 * La billetera pequeña del encabezado del chat. Con dos o tres tarjetas se ven apiladas, para
 * que se note que hay más. Al tocarla se abre la lista para elegir cuál mandar.
 */
export function BotonBilletera({ onPress }: { onPress: () => void }) {
  const tarjetas = useTarjetas();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel="Mandar una tarjeta para transferir"
      onPress={onPress}
      scaleTo={0.92}
      hitSlop={6}
    >
      <Billetera escala={ESCALA} tarjetas={tarjetas} />
    </PressableScale>
  );
}
