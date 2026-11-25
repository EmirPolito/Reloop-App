import { Circle, Path, Rect, Svg } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function OjoIcon({ size = 20, color = "#5B5B5B" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 12C4.4 7.9 7.9 5.5 12 5.5C16.1 5.5 19.6 7.9 21.5 12C19.6 16.1 16.1 18.5 12 18.5C7.9 18.5 4.4 16.1 2.5 12Z"
        stroke={color}
        strokeWidth={1.7}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.7} />
    </Svg>
  );
}

export function OjoTachadoIcon({ size = 20, color = "#5B5B5B" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.9 5.8C10.6 5.6 11.3 5.5 12 5.5C16.1 5.5 19.6 7.9 21.5 12C20.9 13.3 20.1 14.4 19.2 15.4M6.6 7.4C4.9 8.5 3.5 10.1 2.5 12C4.4 16.1 7.9 18.5 12 18.5C13.8 18.5 15.4 18 16.9 17.2"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9.9 9.9C9.3 10.4 9 11.2 9 12C9 13.7 10.3 15 12 15C12.8 15 13.6 14.7 14.1 14.1"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
      <Path
        d="M3.5 3.5L20.5 20.5"
        stroke={color}
        strokeWidth={1.7}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CopiarIcon({ size = 16, color = "#101010" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={8.5}
        y={8.5}
        width={12}
        height={12}
        rx={3}
        stroke={color}
        strokeWidth={1.8}
      />
      <Path
        d="M15.5 5.5C15.2 4.3 14.2 3.5 13 3.5H6.5C5 3.5 3.5 5 3.5 6.5V13C3.5 14.2 4.3 15.2 5.5 15.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MasIcon({ size = 16, color = "#101010" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5V19M5 12H19"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
