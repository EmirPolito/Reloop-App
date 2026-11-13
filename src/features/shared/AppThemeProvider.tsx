import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import { useRequiredContext } from "@/hooks/useRequiredContext";
import { createStyles, type AppStyles } from "./styles";

const THEME_STORAGE_KEY = "reloop.theme";

interface AppThemeValue {
  isDark: boolean;
  /** Cambia el tema y recuerda la elección para la próxima vez que se abra la app. */
  setIsDark: (isDark: boolean) => void;
  /** Hojas de estilo compartidas, ya resueltas para el tema actual. */
  styles: AppStyles;
}

/**
 * Exportado para volver a proveer el tema dentro de un portal (los drawers de HeroUI se
 * dibujan fuera de este proveedor). En lo demás se usa `useAppTheme`.
 */
export const AppThemeContext = createContext<AppThemeValue | null>(null);

export function AppThemeProvider({ children }: PropsWithChildren) {
  const [isDark, setIsDarkState] = useState(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((stored) => {
        if (active && stored === "dark") setIsDarkState(true);
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

  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const value = useMemo(
    () => ({ isDark, setIsDark, styles }),
    [isDark, setIsDark, styles],
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
