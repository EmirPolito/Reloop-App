import { Path, Svg } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

export function BackArrowIcon({ size = 24, color = "#000000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        opacity="0.4"
        d="M7.74943 11.9999C7.74943 8.73377 13.9892 4.87878 15.2402 4.14001C15.4799 3.99792 15.7543 3.96765 16.0033 4.03308C16.2489 4.09753 16.4701 4.25525 16.6093 4.49109C16.8925 4.96375 16.7323 5.57898 16.2582 5.85974C13.6332 7.41296 9.74943 10.4379 9.74943 11.9999L7.74943 11.9999Z"
        fill={color}
      />
      <Path
        d="M9.75037 12C9.75037 12 9.75037 11.9999 9.75037 12C9.75037 13.56 13.6344 16.585 16.2594 18.14C16.7334 18.42 16.8934 19.033 16.6104 19.509C16.3294 19.984 15.7164 20.142 15.2414 19.86C13.9904 19.121 7.75037 15.266 7.75037 12C7.75037 11.9999 7.75037 12 7.75037 12L9.75037 12Z"
        fill={color}
      />
    </Svg>
  );
}

export function SendIcon({ size = 24, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        opacity="0.4"
        d="M11.7258 4.24988L11.7258 19.2499"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.70124 10.3002C5.70124 10.3002 8.96224 4.25017 11.7242 4.25017C14.4882 4.25017 17.7502 10.3002 17.7502 10.3002"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CloseXIcon({ size = 20, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
