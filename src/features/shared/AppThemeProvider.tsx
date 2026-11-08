import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { COLORES_PERFIL, type ColorPerfil } from "@/features/perfil/Perfiltemas";
import { useRequiredContext } from "@/hooks/useRequiredContext";
import { createStyles, type AppStyles } from "./styles";

const THEME_STORAGE_KEY = "reloop.theme";
const COLOR_STORAGE_KEY = "reloop.theme_color";

function isColorPerfil(value: unknown): value is ColorPerfil {
  return (
    typeof value === "string" && COLORES_PERFIL.includes(value as ColorPerfil)
  );
}

interface AppThemeValue {
  isDark: boolean;
  /** Cambia el tema y recuerda la elección para la próxima vez que se abra la app. */
  setIsDark: (isDark: boolean) => void;
  /** Color del degradado de las pantallas elegido por el usuario */
  themeColor: ColorPerfil;
  /** Cambia el color del tema y lo persiste localmente */
  setThemeColor: (color: ColorPerfil) => void;
  /** Hojas de estilo compartidas, ya resueltas para el tema actual. */
  styles: AppStyles;
}

const AppThemeContext = createContext<AppThemeValue | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [isDark, setIsDarkState] = useState(false);
  const [themeColor, setThemeColorState] = useState<ColorPerfil>("azul");

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (active && stored === "dark") setIsDarkState(true);
      })
      .catch(() => {});
    AsyncStorage.getItem(COLOR_STORAGE_KEY)
      .then((stored) => {
        if (active && stored && isColorPerfil(stored)) {
          setThemeColorState(stored);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const setIsDark = useCallback((next: boolean) => {
    setIsDarkState(next);
    AsyncStorage.setItem(THEME_STORAGE_KEY, next ? "dark" : "light").catch(
      () => {},
    );
  }, []);

  const setThemeColor = useCallback((next: ColorPerfil) => {
    setThemeColorState(next);
    AsyncStorage.setItem(COLOR_STORAGE_KEY, next).catch(() => {});
  }, []);

  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const value = useMemo(
    () => ({ isDark, setIsDark, themeColor, setThemeColor, styles }),
    [isDark, setIsDark, themeColor, setThemeColor, styles],
  );

  return (
    <AppThemeContext.Provider value={value}>
      {children}
    </AppThemeContext.Provider>
  );
}

export function useAppTheme(): AppThemeValue {
  return useRequiredContext(AppThemeContext, "AppThemeProvider");
}
