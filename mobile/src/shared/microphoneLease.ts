let holder: { owner: object } | undefined;

/** Reserve before requesting native capture, including while permission is pending. */
export function claimMicrophone(owner: object) {
  if (holder) throw new Error('Microphone is in use. End the other voice session first.');
  const lease = { owner };
  holder = lease;
  return () => { if (holder === lease) holder = undefined; };
}
