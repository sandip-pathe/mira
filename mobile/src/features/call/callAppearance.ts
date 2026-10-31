export const callColors = {
  canvas: '#241D19', surface: '#342923', raised: '#46362D', line: '#685044',
  ink: '#FFF2E5', muted: '#CDB6A5', accent: '#E9BE91', portrait: '#493A2D',
  halo: '#BD8D5B', red: '#BF413E', redPressed: '#A93432', scrim: '#120D0BCC',
};

export function audioRouteLabel(name = 'Phone') {
  return name === 'Phone' ? 'Earpiece' : name === 'Speaker' ? 'Speaker' : name;
}
