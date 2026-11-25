import { Path, Svg, Text as SvgText } from "react-native-svg";

/** Amarillo de moneda */
export const COLOR_EFECTIVO = "#FFC21A";
/** Rosa rojizo */
export const COLOR_TRANSFERENCIA = "#F2466B";

/** Efectivo: la insignia dentada, amarilla como moneda, con un $ blanco en medio */
export function MonedaIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.8021 12.1366C19.9301 10.7166 18.9671 8.38964 19.2861 6.06264L19.3761 5.40964L18.7221 5.49964C16.4021 5.81964 14.0681 4.85464 12.6481 2.98264L12.2501 2.45764L11.8511 2.98264C10.4311 4.85464 8.0981 5.82064 5.7771 5.49964L5.1241 5.40964L5.2141 6.06264C5.5331 8.38964 4.5691 10.7166 2.6981 12.1366L2.1731 12.5346L2.6981 12.9336C4.5691 14.3526 5.5331 16.6796 5.2141 19.0076L5.1241 19.6606L5.7771 19.5706C8.0971 19.2526 10.4311 20.2146 11.8511 22.0866L12.2501 22.6116L12.6481 22.0866C14.0681 20.2146 16.4031 19.2536 18.7221 19.5706L19.3761 19.6606L19.2861 19.0076C18.9671 16.6796 19.9301 14.3526 21.8021 12.9336L22.3271 12.5346L21.8021 12.1366Z"
        fill={COLOR_EFECTIVO}
      />
      <SvgText
        x="12.25"
        y="16.4"
        fill="#FFFFFF"
        fontSize="11"
        fontWeight="700"
        textAnchor="middle"
      >
        $
      </SvgText>
    </Svg>
  );
}

/** Transferencia: la tarjeta bancaria, en rosa rojizo */
export function TarjetaPagoIcon({ size = 24 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 25 25" fill="none">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M14.352 16.2306H19.327V14.7306H14.352V16.2306ZM10.126 16.2306H12.374V14.7306H10.126V16.2306ZM2.5 19.6686H22V10.6716H2.5V19.6686Z"
        fill={COLOR_TRANSFERENCIA}
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2.5 9.17164H22V4.60864H2.5V9.17164Z"
        fill={COLOR_TRANSFERENCIA}
      />
    </Svg>
  );
}
