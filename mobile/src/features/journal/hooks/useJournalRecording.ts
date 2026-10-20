import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { File } from 'expo-file-system';

// Failed deletions are retried during this process.
const pendingCleanup = new Set<string>();

function removeRecording(path?: string): boolean {
  if (!path) return true;
  try {
    const file = new File(path);
    if (file.exists) file.delete();
    if (file.exists) throw new Error('Recording still exists.');
    pendingCleanup.delete(path);
    return true;
  } catch {
    pendingCleanup.add(path);
    return false;
  }
}

type Options = {
  visible: boolean;
  setStatus: (text: string) => void;
};

export function useJournalRecording(options: Options) {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: 'document' });
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uri, setUri] = useState<string>();
  const callbacks = useRef(options);
  const active = useRef(true);
  const capturing = useRef(false);
  const operating = useRef(false);
  const working = useRef<Promise<void> | undefined>(undefined);
  const retained = useRef<string | undefined>(undefined);
  const stopping = useRef<Promise<string | undefined> | undefined>(undefined);
  const generation = useRef(0);
  useLayoutEffect(() => {
    callbacks.current = options;
  });

  const stopCapture = useCallback((): Promise<string | undefined> => {
    if (stopping.current) return stopping.current;
    if (!capturing.current) return Promise.resolve(retained.current);
    capturing.current = false;
    const job = (async () => {
      try {
        await recorder.stop();
        const path = recorder.uri ?? undefined;
        retained.current = path;
        if (active.current) setUri(path);
        else removeRecording(path);
        return path;
      } catch (error) {
        // A failed native stop must not leave the UI claiming capture has ended.
        capturing.current = recorder.isRecording;
        throw error;
      } finally {
        if (active.current) setRecording(capturing.current);
        await setAudioModeAsync({ allowsRecording: false });
      }
    })();
    stopping.current = job;
    void job
      .finally(() => {
        stopping.current = undefined;
      })
      .catch(() => {});
    return job;
  }, [recorder]);

  const interrupt = useCallback(() => {
    generation.current += 1;
    if (!capturing.current && !stopping.current) return;
    void stopCapture()
      .then(() => {
        if (active.current)
          callbacks.current.setStatus('Recording stopped. Save or discard the voice note.');
      })
      .catch(() => {
        if (active.current)
          callbacks.current.setStatus('Recording interrupted. Try stopping it again.');
      });
  }, [stopCapture]);

  useEffect(() => {
    if (!options.visible) interrupt();
  }, [options.visible, interrupt]);

  useEffect(() => {
    active.current = true;
    pendingCleanup.forEach((path) => removeRecording(path));
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') interrupt();
    });
    return () => {
      active.current = false;
      generation.current += 1;
      subscription.remove();
      if (capturing.current || stopping.current) void stopCapture().catch(() => {});
    };
  }, [interrupt, stopCapture]);

  async function operate(work: () => Promise<void>) {
    if (operating.current || stopping.current) return;
    operating.current = true;
    setBusy(true);
    const job = (async () => {
      try {
        await work();
      } catch (error) {
        if (active.current)
          callbacks.current.setStatus(
            error instanceof Error ? error.message : 'Recording failed. Try again.',
          );
      } finally {
        operating.current = false;
        if (active.current) setBusy(false);
      }
    })();
    working.current = job;
    await job;
    if (working.current === job) working.current = undefined;
  }

  function start() {
    return operate(async () => {
      if (retained.current || capturing.current) return;
      const attempt = generation.current;
      const canStart = () =>
        active.current &&
        callbacks.current.visible &&
        AppState.currentState === 'active' &&
        attempt === generation.current;
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted)
        throw new Error('Microphone permission denied. You can still write.');
      if (!canStart()) return;
      try {
        await setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
          allowsBackgroundRecording: false,
        });
        await recorder.prepareToRecordAsync();
        if (!canStart()) {
          await recorder.stop();
          removeRecording(recorder.uri ?? undefined);
          return;
        }
        recorder.record();
        capturing.current = true;
        setRecording(true);
        callbacks.current.setStatus('Recording your short synthetic note…');
      } finally {
        if (!capturing.current) await setAudioModeAsync({ allowsRecording: false });
      }
    });
  }

  function stop() {
    return operate(async () => {
      const path = await stopCapture();
      if (!path) throw new Error('No recording available. Try again.');
      callbacks.current.setStatus('Voice note ready. Save it or discard it.');
    });
  }

  function discard() {
    if (operating.current || capturing.current || stopping.current) return false;
    if (!removeRecording(retained.current)) {
      callbacks.current.setStatus('The recording could not be deleted. Try Discard again.');
      return false;
    }
    retained.current = undefined;
    setUri(undefined);
    return true;
  }

  function keep() {
    const path = retained.current;
    retained.current = undefined;
    setUri(undefined);
    return path;
  }

  async function discardPending() {
    generation.current += 1;
    await working.current;
    if (capturing.current || stopping.current) await stopCapture();
    return discard();
  }

  return { recording, busy, uri, start, stop, discard, keep, discardPending };
}
