import Svg, { Ellipse, G, Path } from "react-native-svg";

import { useAppTheme } from "@/features/shared/AppThemeProvider";

/** Lupa grande del estado "sin resultados". */
export function BulkSearchIcon({ size = 24 }: { size?: number }) {
  const { isDark } = useAppTheme();
  const fillColor = isDark ? "#c3c3c3ff" : "#0000001f";
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke="none" strokeWidth="1.5" fill="none" fillRule="evenodd">
        <G
          transform="translate(2.000000, 2.000000)"
          fill={fillColor}
          fillRule="nonzero"
        >
          <Ellipse
            cx="8.59921927"
            cy="8.65324385"
            rx="8.59921927"
            ry="8.65324385"
          />
          <Path
            d="M18.674623,19.9552573 C18.3405833,19.9444414 18.0229443,19.8069986 17.7853553,19.5704698 L15.7489321,17.1901566 C15.3123366,16.7908936 15.2766365,16.1123232 15.668898,15.6689038 L15.668898,15.6689038 C15.8525005,15.4831065 16.1021409,15.3786387 16.3625268,15.3786387 C16.6229128,15.3786387 16.8725531,15.4831065 17.0561557,15.6689038 L19.6172468,17.7181208 C19.9861582,18.0957076 20.0999999,18.656254 19.9078887,19.1492153 C19.7157774,19.6421767 19.2536179,19.9754211 18.7279791,20 L18.674623,19.9552573 Z"
            opacity="0.4"
          />
        </G>
      </G>
    </Svg>
  );
}

/** Sobre grande del estado "sin mensajes". */
export function BulkMessageIcon({ size = 24 }: { size?: number }) {
  const { isDark } = useAppTheme();
  const fillColor = isDark ? "#c3c3c3ff" : "#0000001f";
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G stroke="none" strokeWidth="1.5" fill="none" fillRule="evenodd">
        <G
          transform="translate(1.999900, 2.999600)"
          fill={fillColor}
          fillRule="nonzero"
        >
          <Path
            d="M20,12.9406 C20,15.7306 17.76,17.9906 14.97,18.0006 L14.96,18.0006 L5.05,18.0006 C2.27,18.0006 0,15.7506 0,12.9606 L0,12.9506 C0,12.9506 0.006,8.5246 0.014,6.2986 C0.015,5.8806 0.495,5.6466 0.822,5.9066 C3.198,7.7916 7.447,11.2286 7.5,11.2736 C8.21,11.8426 9.11,12.1636 10.03,12.1636 C10.95,12.1636 11.85,11.8426 12.56,11.2626 C12.613,11.2276 16.767,7.8936 19.179,5.9776 C19.507,5.7166 19.989,5.9506 19.99,6.3676 C20,8.5766 20,12.9406 20,12.9406"
            opacity="0.4"
          />
          <Path d="M19.4761,2.674 C18.6101,1.042 16.9061,3.55271368e-15 15.0301,3.55271368e-15 L5.0501,3.55271368e-15 C3.1741,3.55271368e-15 1.4701,1.042 0.6041,2.674 C0.4101,3.039 0.5021,3.494 0.8251,3.752 L8.2501,9.691 C8.7701,10.111 9.4001,10.32 10.0301,10.32 C10.0341,10.32 10.0371,10.32 10.0401,10.32 C10.0431,10.32 10.0471,10.32 10.0501,10.32 C10.6801,10.32 11.3101,10.111 11.8301,9.691 L19.2551,3.752 C19.5781,3.494 19.6701,3.039 19.4761,2.674" />
        </G>
      </G>
    </Svg>
  );
}
