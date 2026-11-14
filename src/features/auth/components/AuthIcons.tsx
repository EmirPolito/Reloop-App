import type { StyleProp, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";

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

export function LockIcon({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <Svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#9CA3AF"
      strokeWidth="1.8"
      style={style}
    >
      <Path d="M17 11V7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7V11C5.89543 11 5 11.8954 5 13V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V13C19 11.8954 18.1046 11 17 11ZM9 7C9 5.34315 10.3431 4 12 4C13.6569 4 15 5.34315 15 7V11H9V7Z" />
    </Svg>
  );
}
