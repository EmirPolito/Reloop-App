import type { StyleProp, ViewStyle } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

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
