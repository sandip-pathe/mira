export const feelingWords = [
  { label: 'Worried', shades: ['Uneasy', 'Tense', 'On edge'] },
  { label: 'Disappointed', shades: ['Let down', 'Deflated', 'Discouraged'] },
  { label: 'Angry', shades: ['Frustrated', 'Irritated', 'Resentful'] },
  { label: 'Lonely', shades: ['Left out', 'Disconnected', 'Unseen'] },
  { label: 'Overwhelmed', shades: ['Flooded', 'Stretched thin', 'Frazzled'] },
  { label: 'Numb', shades: ['Flat', 'Drained', 'Shut down'] },
  { label: 'Okay', shades: ['Settled', 'Calm', 'Manageable'] },
  { label: 'Excited', shades: ['Hopeful', 'Eager', 'Energized'] },
  { label: 'Mixed', shades: ['Torn', 'Conflicted', 'Bittersweet'] },
  { label: 'Not sure', shades: ['Hard to name', 'Still sorting it out'] },
] as const;

export const bodyLocations = ['Head', 'Chest', 'Stomach', 'Shoulders', 'Hands', 'Jaw', 'Back', 'Somewhere else'] as const;

export function wordingFor(feelings: string[], body: string[]) {
  const feelingLine = feelings.length ? `Right now, I feel ${feelings.join(', ').toLowerCase()}.` : 'Right now, I feel…';
  if (!body.length) return feelingLine;
  return `${feelingLine} I notice it in my ${body.map((part) => part.toLowerCase()).join(' and ')}.`;
}
