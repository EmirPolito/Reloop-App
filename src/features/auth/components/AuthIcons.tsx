import type { StyleProp, ViewStyle } from "react-native";
import Svg, { Circle, G, Line, Path } from "react-native-svg";

export function MailIcon({
  stroke,
  strokeWidth,
  style,
}: {
  stroke: string;
  strokeWidth: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      style={style}
    >
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <Path d="M22 6l-10 7L2 6" />
    </Svg>
  );
}

export function LockIcon({
  style,
  color = "#9CA3AF",
}: {
  style?: StyleProp<ViewStyle>;
  color?: string;
}) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      style={style}
    >
      <Path d="M17 11V7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7V11C5.89543 11 5 11.8954 5 13V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V13C19 11.8954 18.1046 11 17 11ZM9 7C9 5.34315 10.3431 4 12 4C13.6569 4 15 5.34315 15 7V11H9V7Z" />
    </Svg>
  );
}

/** Cara (línea) para el campo de nombre. */
export function FaceIcon({ color = "#9CA3AF" }: { color?: string }) {
  return (
    <Svg
      width={23}
      height={23}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="square"
    >
      <Path d="M12.25 21.3887C7.141 21.3887 3 17.2477 3 12.1387C3 7.02967 7.141 2.88867 12.25 2.88867C17.359 2.88867 21.5 7.02967 21.5 12.1387C21.5 15.7087 19.477 18.8067 16.515 20.3487" />
      <Path d="M11.6865 8.41553L9.77148 14.9085L9.95248 15.2105H13.5445" />
      <Path d="M16.6366 11.3125H16.6466" />
      <Path d="M7.18348 11.3125H7.19348" />
    </Svg>
  );
}

/** Sobre (línea) para el campo de correo. */
export function MessageIcon({ color = "#9CA3AF" }: { color?: string }) {
  return (
    <Svg
      width={21}
      height={21}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <G transform="translate(2 3)">
        <Path d="M15.9026143,5.8511436 L11.4593272,9.46418164 C10.6198313,10.1301843 9.4387043,10.1301843 8.59920842,9.46418164 L4.11842516,5.8511436" />
        <Path d="M14.9088637,17.9999789 C17.9502135,18.0083748 20,15.5095497 20,12.4383622 L20,5.57001263 C20,2.49882508 17.9502135,0 14.9088637,0 L5.09113634,0 C2.04978648,0 0,2.49882508 0,5.57001263 L0,12.4383622 C0,15.5095497 2.04978648,18.0083748 5.09113634,17.9999789 L14.9088637,17.9999789 Z" />
      </G>
    </Svg>
  );
}

/** Candado (línea) para el campo de contraseña. */
export function LockFilledIcon({ color = "#9CA3AF" }: { color?: string }) {
  return (
    <Svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <G transform="translate(3.5 2)">
        <Path d="M12.9234,7.4478 L12.9234,5.3008 C12.9234,2.7878 10.8854,0.749755462 8.3724,0.749755462 C5.8594,0.7388 3.8134,2.7668 3.8024,5.2808 L3.8024,5.3008 L3.8024,7.4478" />
        <Path d="M12.1832,19.2496 L4.5422,19.2496 C2.4482,19.2496 0.7502,17.5526 0.7502,15.4576 L0.7502,11.1686 C0.7502,9.0736 2.4482,7.3766 4.5422,7.3766 L12.1832,7.3766 C14.2772,7.3766 15.9752,9.0736 15.9752,11.1686 L15.9752,15.4576 C15.9752,17.5526 14.2772,19.2496 12.1832,19.2496 Z" />
        <Line x1={8.3629} y1={12.2027} x2={8.3629} y2={14.4237} />
      </G>
    </Svg>
  );
}

/** Ojo para mostrar u ocultar la contraseña; tachado mientras está visible. */
export function EyeIcon({
  off = false,
  color = "#6B7280",
}: {
  off?: boolean;
  color?: string;
}) {
  return (
    <Svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {off ? (
        <>
          <Path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
          <Path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
          <Path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
          <Path d="m2 2 20 20" />
        </>
      ) : (
        <>
          <Path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
          <Circle cx={12} cy={12} r={3} />
        </>
      )}
    </Svg>
  );
}

/** Flecha "→" de trazo, para botones de avanzar. */
export function ArrowIcon({
  size = 18,
  color = "#0A0A0C",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="M4 12h16" />
      <Path d="m13 5 7 7-7 7" />
    </Svg>
  );
}
