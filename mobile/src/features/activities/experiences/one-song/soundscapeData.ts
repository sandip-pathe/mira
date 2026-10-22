export type SoundscapeId = 'rain' | 'canopy' | 'shore';

export const soundscapes: { id: SoundscapeId; title: string; description: string; source: number; color: string; prompt: string }[] = [
  { id: 'rain', title: 'Rain at the window', description: 'A steady, soft rain wash with occasional rounded droplets.', source: require('../../../../../assets/audio/soundscape-rain.wav'), color: '#DCE7E2', prompt: 'Listen to the rain for as long as it feels right.' },
  { id: 'canopy', title: 'Under a leafy canopy', description: 'A low breeze through leaves with a few distant bird notes.', source: require('../../../../../assets/audio/soundscape-canopy.wav'), color: '#E4EBD8', prompt: 'Let the leaf sounds play while you rest or look around.' },
  { id: 'shore', title: 'A quiet shoreline', description: 'Slow, low swells with a light foamy edge.', source: require('../../../../../assets/audio/soundscape-shore.wav'), color: '#DDE9E8', prompt: 'Follow the quiet rise and fall for a little while.' },
];
