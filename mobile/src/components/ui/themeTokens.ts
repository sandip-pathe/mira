export type ThemeId = 'warm-light' | 'forest-dark' | 'blackout';

type Palette = {
  canvas: string;
  surface: string;
  ink: string;
  muted: string;
  primary: string;
  soft: string;
  accent: string;
  line: string;
  pressed: string;
  disabled: string;
  disabledInk: string;
  error: string;
};

export const DEFAULT_THEME_ID: ThemeId = 'warm-light';

// Copied from the accepted handoff; the app does not import Lab/doc source.
const palettes = {
  'warm-light': {
    canvas: '#F7F1E7',
    surface: '#FFF9F1',
    ink: '#263C31',
    muted: '#5B675E',
    primary: '#315A45',
    soft: '#E5E8DB',
    accent: '#DEA68D',
    line: '#D7D4C5',
    pressed: '#234332',
    disabled: '#D8D7CF',
    disabledInk: '#60635C',
    error: '#A13C32',
  },
  'forest-dark': {
    canvas: '#17241D',
    surface: '#223229',
    ink: '#F2EEE5',
    muted: '#C0C8BF',
    primary: '#96B89C',
    soft: '#304237',
    accent: '#EDB494',
    line: '#46564B',
    pressed: '#AEC9B0',
    disabled: '#38443C',
    disabledInk: '#C4C9C4',
    error: '#FF8E83',
  },
  blackout: {
    canvas: '#080A09',
    surface: '#141715',
    ink: '#F4F2EC',
    muted: '#B8BDB9',
    primary: '#A6C9AD',
    soft: '#202722',
    accent: '#EAB395',
    line: '#343A36',
    pressed: '#B8D3BE',
    disabled: '#303632',
    disabledInk: '#B6BCB7',
    error: '#FF938B',
  },
} as const satisfies Record<ThemeId, Palette>;

export type ThemeColors = Readonly<Palette & { onPrimary: string }>;

export type Theme = Readonly<{
  id: ThemeId;
  label: string;
  isDark: boolean;
  colors: ThemeColors;
  wordmark: string;
  paper: Readonly<{ background: string; ink: string; muted: string; primary: string }>;
  art: Readonly<{ primary: string; accent: string; ground: string; paper: string }>;
}>;

function createTheme(id: ThemeId, label: string): Theme {
  const palette = palettes[id];
  return {
    id,
    label,
    isDark: id !== 'warm-light',
    colors: { ...palette, onPrimary: palette.surface },
    wordmark: id === 'warm-light' ? palettes['warm-light'].primary : palette.primary,
    // Document paper is independent of the app's dark chrome.
    paper: {
      background: palettes['warm-light'].canvas,
      ink: '#111111',
      muted: palettes['warm-light'].muted,
      primary: palettes['warm-light'].primary,
    },
    art: {
      primary: palette.primary,
      accent: palette.accent,
      ground: palette.soft,
      paper: palettes['warm-light'].surface,
    },
  };
}

export const themes: Readonly<Record<ThemeId, Theme>> = {
  'warm-light': createTheme('warm-light', 'Warm light'),
  'forest-dark': createTheme('forest-dark', 'Deep forest'),
  blackout: createTheme('blackout', 'Black-out'),
};
