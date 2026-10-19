type PromptGroup = { title: string; prompts: string[] };
export type ColorPair = { dark: string; light: string };

export const PROMPT_GROUPS: PromptGroup[] = [
  {
    title: 'Check in',
    prompts: [
      'How was your day?',
      'What is taking up the most space in your mind right now?',
      'What would feel helpful to write about?',
    ],
  },
  {
    title: 'Notice',
    prompts: [
      'What is one moment from today you want to remember?',
      'What has felt easier than you expected?',
      'What is something small you appreciate today?',
    ],
  },
  {
    title: 'Reflect',
    prompts: [
      'What has been on your mind lately?',
      'What do you wish someone understood right now?',
      'What is one thing you want to make room for this week?',
    ],
  },
];

export const COLOR_PAIRS: ColorPair[] = [
  { dark: '#1E1E1E', light: '#F5F5F5' },
  { dark: '#222831', light: '#EEEEEE' },
  { dark: '#0B3D91', light: '#AEC6FF' },
  { dark: '#0E4D45', light: '#A8E6CF' },
  { dark: '#172E15', light: '#C7E59F' },
  { dark: '#102542', light: '#B3D9FF' },
  { dark: '#394867', light: '#D6E4FF' },
  { dark: '#3A2A5E', light: '#D9C2FF' },
  { dark: '#4B0082', light: '#E6CCFF' },
  { dark: '#5D3FD3', light: '#E0C2FF' },
  { dark: '#6A0DAD', light: '#E5B8FF' },
  { dark: '#301934', light: '#E8D1FF' },
  { dark: '#7D0633', light: '#F5A3B3' },
  { dark: '#8B0000', light: '#FF7F7F' },
  { dark: '#A52A2A', light: '#FFAD87' },
  { dark: '#5E2129', light: '#E8A5A1' },
  { dark: '#943B54', light: '#F0B6C2' },
  { dark: '#B8860B', light: '#FFD700' },
  { dark: '#A97142', light: '#EEC39A' },
  { dark: '#C67C48', light: '#F2C099' },
  { dark: '#8B4513', light: '#E0A87E' },
  { dark: '#D4A017', light: '#F8D24E' },
  { dark: '#556B2F', light: '#B5D99C' },
  { dark: '#3B5323', light: '#A7D89C' },
  { dark: '#2C3531', light: '#C4D7C6' },
  { dark: '#422A4C', light: '#E4C3E6' },
  { dark: '#264E36', light: '#B7E1CD' },
  { dark: '#191919', light: '#EAEAEA' },
  { dark: '#242424', light: '#F0F0F0' },
  { dark: '#485053', light: '#C0C8CA' },
];

