const allowedMusicHosts = new Set([
  'open.spotify.com',
  'music.youtube.com',
  'music.apple.com',
  'soundcloud.com',
  'www.soundcloud.com',
]);

export type ValidatedMusicLink = { url: string; domain: string };

export function validateMusicLink(value: string): ValidatedMusicLink | undefined {
  try {
    const url = new URL(value.trim());
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      url.pathname === '/' ||
      !allowedMusicHosts.has(url.hostname.toLowerCase())
    ) return undefined;
    return { url: url.href, domain: url.hostname.toLowerCase() };
  } catch {
    return undefined;
  }
}
