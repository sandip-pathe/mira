import React from 'react';
import { DEFAULT_THEME_ID, themes, type Theme, type ThemeId } from './themeTokens';
import { fallbackTypography, typography, type Typography } from './typography';
import { loadThemePreference } from '../../shared/storage/themePreference';

type ThemeContextValue = Theme & {
  typography: Typography;
  fontsLoaded: boolean;
  themeReady: boolean;
  setThemeId: (id: ThemeId) => void;
};

const ThemeContext = React.createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({
  children,
  fontsLoaded,
  initialThemeId = DEFAULT_THEME_ID,
}: {
  children: React.ReactNode;
  fontsLoaded: boolean;
  initialThemeId?: ThemeId;
}) {
  const [themeId, setThemeId] = React.useState<ThemeId>(initialThemeId);
  const [themeReady, setThemeReady] = React.useState(false);
  React.useEffect(() => {
    let active = true;
    void loadThemePreference().then((savedThemeId) => {
      if (active) setThemeId(savedThemeId);
    }).catch(() => {
      // Keep Mira usable when local storage is unavailable; the picker reports save failures.
    }).finally(() => {
      if (active) setThemeReady(true);
    });
    return () => { active = false; };
  }, []);
  const value = React.useMemo(
    () => ({
      ...themes[themeId],
      typography: fontsLoaded ? typography : fallbackTypography,
      fontsLoaded,
      themeReady,
      setThemeId,
    }),
    [themeId, fontsLoaded, themeReady],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const theme = React.useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside ThemeProvider.');
  return theme;
}
