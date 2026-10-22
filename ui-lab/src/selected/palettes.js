import directions from '../../design/step-04/directions.json';

export const paletteOptions = {
  'warm-light': {
    label: 'Warm light',
    colors: directions[0].colors,
    description: 'Current oat paper, forest ink and peach. Keeps Direction A as the light reference.',
  },
  'forest-dark': {
    label: 'Deep forest',
    description: 'Green-black canvas and lifted forest surfaces; soft sage controls and peach details.',
    colors: {
      canvas: '#17241D', surface: '#223229', ink: '#F2EEE5', muted: '#C0C8BF',
      primary: '#96B89C', soft: '#304237', accent: '#EDB494', line: '#46564B',
      pressed: '#AEC9B0', disabled: '#38443C', disabledInk: '#C4C9C4', error: '#FF8E83',
    },
  },
  'blackout': {
    label: 'Black-out',
    description: 'Near-black canvas and charcoal surfaces, with sage and peach accents.',
    colors: {
      canvas: '#080A09', surface: '#141715', ink: '#F4F2EC', muted: '#B8BDB9',
      primary: '#A6C9AD', soft: '#202722', accent: '#EAB395', line: '#343A36',
      pressed: '#B8D3BE', disabled: '#303632', disabledInk: '#B6BCB7', error: '#FF938B',
    },
  },
};
