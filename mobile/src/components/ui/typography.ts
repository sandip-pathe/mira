import type { TextStyle } from 'react-native';

export const fontSources = {
  'NunitoSans-Regular': require('../../../assets/fonts/NunitoSans-Regular.ttf'),
  'NunitoSans-Medium': require('../../../assets/fonts/NunitoSans-Medium.ttf'),
  'NunitoSans-SemiBold': require('../../../assets/fonts/NunitoSans-SemiBold.ttf'),
  'NunitoSans-Bold': require('../../../assets/fonts/NunitoSans-Bold.ttf'),
};

export const fontFamilies = {
  400: 'NunitoSans-Regular',
  500: 'NunitoSans-Medium',
  600: 'NunitoSans-SemiBold',
  700: 'NunitoSans-Bold',
} as const;

type FontWeight = keyof typeof fontFamilies;

// Unscaled selected Lab sizes, including its existing compact/state variants.
const roles = {
  screenTitle: { fontSize: 30, lineHeight: 35.1, weight: 600, letterSpacing: -0.8 },
  talkWelcome: { fontSize: 30, lineHeight: 35.4, weight: 600, letterSpacing: -0.7 },
  talkReady: { fontSize: 28, lineHeight: 33.04, weight: 600 },
  talkOfferHeading: { fontSize: 22, lineHeight: 25.96, weight: 600 },
  talkKeyboardHeading: { fontSize: 24, lineHeight: 28.32, weight: 600 },
  talkHelper: { fontSize: 16, lineHeight: 23.2, weight: 400 },
  body: { fontSize: 16, lineHeight: 24, weight: 400 },
  support: { fontSize: 14, lineHeight: 20.3, weight: 400 },
  button: { fontSize: 14, lineHeight: 16.8, weight: 600 },
  talkSideLabel: { fontSize: 12, lineHeight: 14.4, weight: 600 },
  holdLabel: { fontSize: 14, weight: 600 },
  tabInactive: { fontSize: 12, weight: 500 },
  tabActive: { fontSize: 12, weight: 700 },
  activitiesIntro: { fontSize: 25, lineHeight: 30, weight: 600, letterSpacing: -0.5 },
  groupHeading: { fontSize: 20, lineHeight: 25, weight: 600, letterSpacing: -0.3 },
  activityTitle: { fontSize: 17, lineHeight: 22.1, weight: 600 },
  activitySummary: { fontSize: 14, lineHeight: 19.6, weight: 400 },
  journalInvitation: { fontSize: 26, lineHeight: 31.2, weight: 600, letterSpacing: -0.5 },
  journalPrompt: { fontSize: 17, lineHeight: 23.8, weight: 600 },
  journalWriting: { fontSize: 17, lineHeight: 28.05, weight: 400 },
  journalHomeTitle: { fontSize: 28, lineHeight: 33.6, weight: 600, letterSpacing: -0.6 },
  sheetTitle: { fontSize: 22, lineHeight: 27.5, weight: 700 },
  sheetSection: { fontSize: 17, weight: 700 },
  recentTitle: { fontSize: 16, weight: 600 },
  recentMeta: { fontSize: 14, weight: 400 },
  // Preserve existing compact shared-label sizes during the foundation transfer.
  eyebrow: { fontSize: 12, lineHeight: 16, weight: 700, letterSpacing: 1.2 },
  status: { fontSize: 13, lineHeight: 18, weight: 600 },
} as const satisfies Record<string, TextStyle & { weight: FontWeight }>;

export type Typography = Record<keyof typeof roles, TextStyle>;

function createTypography(fontsLoaded: boolean): Typography {
  return Object.fromEntries(
    Object.entries(roles).map(([name, { weight, ...style }]) => [
      name,
      {
        ...style,
        // Each loaded alias is already the desired weight; avoid synthetic bold.
        ...(fontsLoaded
          ? { fontFamily: fontFamilies[weight], fontWeight: 'normal' }
          : { fontWeight: String(weight) }),
      },
    ]),
  ) as Typography;
}

export const typography = createTypography(true);
export const fallbackTypography = createTypography(false);
