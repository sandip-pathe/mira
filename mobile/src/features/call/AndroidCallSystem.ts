import { AppState, DeviceEventEmitter, NativeModules, PermissionsAndroid, Platform } from 'react-native';
import type CallKeep from 'react-native-callkeep';
import type { AudioRoute, EventListener } from 'react-native-callkeep';

let setup: Promise<boolean> | undefined;
type Callbacks = {
  end: () => void; fail: (message: string) => void; mute: (value: boolean) => void;
  hold: (value: boolean) => void; routes: (routes: AudioRoute[]) => void;
};

export class AndroidCallSystem {
  private keep?: typeof CallKeep;
  private listeners: EventListener[] = [];
  private closed = false;
  private cancelStart?: () => void;
  private lateStartListener?: EventListener;
  private lateStartTimer?: ReturnType<typeof setTimeout>;

  constructor(private uuid: string, private callbacks: Callbacks) {}

  async start() {
    if (Platform.OS !== 'android') throw new Error('Calling is available in the Android app.');
    // Lazy native import keeps Expo Go and web previews usable.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const keep = (require('react-native-callkeep') as typeof import('react-native-callkeep')).default;
    this.keep = keep;
    const microphone = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
    if (microphone !== PermissionsAndroid.RESULTS.GRANTED) throw new Error('Allow microphone access to call Mira.');
    if (this.closed) return;
    if (Number(Platform.Version) >= 33) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    }
    if (this.closed) return;
    if (Number(Platform.Version) >= 31) {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
    }
    if (this.closed) return;
    setup ??= keep.setup({
      ios: { appName: 'Mira' },
      android: {
        selfManaged: true, alertTitle: 'Call Mira', alertDescription: 'Allow Mira to manage this call.',
        cancelButton: 'Cancel', okButton: 'Continue', additionalPermissions: [],
        endCallsWhenReactNativeStops: true,
        foregroundService: { channelId: 'mira.calls', channelName: 'Mira calls',
          notificationTitle: 'Calling Mira', notificationIcon: 'ic_launcher', foregroundServiceType: 132 },
      },
    }).catch(error => { setup = undefined; throw error; });
    await setup;
    if (this.closed) return;
    if (!NativeModules.MiraCallNotification?.setRinging) throw new Error('Install the updated Android build to use calling.');
    await NativeModules.MiraCallNotification.prepare();
    if (this.closed) return;
    keep.setAvailable(true); keep.setReachable(); keep.canMakeMultipleCalls(false);
    const matches = (uuid: string) => uuid.toLowerCase() === this.uuid.toLowerCase();
    // Telecom can finish creating an outgoing connection after Cancel was tapped.
    this.lateStartListener = keep.addEventListener('didReceiveStartCallAction', event => {
      if (!event.callUUID || !matches(event.callUUID)) return;
      if (this.closed) keep.endCall(this.uuid);
      this.lateStartListener?.remove(); this.lateStartListener = undefined;
      clearTimeout(this.lateStartTimer);
    });
    this.listeners.push(
      keep.addEventListener('endCall', e => { if (matches(e.callUUID)) this.callbacks.end(); }),
      keep.addEventListener('startCallFailed', e => { if (matches(e.callUUID)) this.callbacks.fail('Android could not start the call.'); }),
      keep.addEventListener('didPerformSetMutedCallAction', e => { if (matches(e.callUUID)) this.callbacks.mute(e.muted); }),
      keep.addEventListener('didToggleHoldCallAction', e => { if (matches(e.callUUID)) this.callbacks.hold(e.hold); }),
      keep.addEventListener('didChangeAudioRoute', () => { void this.refreshRoutes(); }),
      keep.addEventListener('onHasActiveCall', () => this.callbacks.fail('Call ended because another phone call needs audio.')),
      keep.addEventListener('didResetProvider', () => this.callbacks.end()),
    );
    await new Promise<void>((resolve, reject) => {
      const finish = (error?: Error) => {
        clearTimeout(timer); this.cancelStart = undefined;
        if (error) reject(error); else resolve();
      };
      const timer = setTimeout(() => finish(new Error('Android call setup timed out.')), 15000);
      this.cancelStart = () => finish();
      this.listeners.push(DeviceEventEmitter.addListener('MiraCallFocus', (active: boolean) => {
        if (this.closed) return;
        if (!active) this.callbacks.fail('Call ended because another phone call needs audio.');
        else { this.status('Connecting…'); void this.refreshRoutes(); finish(); }
      }));
      this.listeners.push(keep.addEventListener('didActivateAudioSession', () => {
        if (this.closed) return;
        this.callbacks.hold(false);
        this.status('Connecting…');
        void this.refreshRoutes();
        if (Number(Platform.Version) < 28) finish();
      }));
      this.listeners.push(keep.addEventListener('didDeactivateAudioSession', () => this.callbacks.hold(true)));
      if (AppState.currentState !== 'active') { finish(new Error('Return to Mira to start the call.')); return; }
      keep.startCall(this.uuid, 'Mira', 'Mira', 'generic', false);
    });
  }

  connected() { if (!this.closed) this.keep?.setCurrentCallActive(this.uuid); }
  ringing(value: boolean) {
    if (!this.closed) NativeModules.MiraCallNotification?.setRinging?.(this.uuid, value);
  }
  proximityScreenOff(enabled: boolean, waitForFar = false) {
    if (!this.closed) NativeModules.MiraCallNotification?.setProximityScreenOff?.(this.uuid, enabled, waitForFar);
  }
  mute(value: boolean) { if (!this.closed) this.keep?.setMutedCall(this.uuid, value); }
  status(value: string) {
    if (!this.closed) void NativeModules.MiraCallNotification?.show(this.uuid, value)
      .catch(() => this.callbacks.fail('Android could not keep this call active.'));
  }
  async refreshRoutes() {
    try {
      const routes = await this.keep?.getAudioRoutes();
      if (!this.closed && routes) this.callbacks.routes(routes);
    } catch { /* A connection may still be initializing. */ }
  }
  async route(name: string) {
    if (this.closed) return;
    await this.keep?.setAudioRoute(this.uuid, name);
    await this.refreshRoutes();
  }
  stop() {
    if (this.closed) return;
    NativeModules.MiraCallNotification?.setRinging?.(this.uuid, false);
    NativeModules.MiraCallNotification?.setProximityScreenOff?.(this.uuid, false, true);
    this.closed = true; this.cancelStart?.();
    this.listeners.forEach(listener => listener.remove()); this.listeners = [];
    this.keep?.endCall(this.uuid);
    if (this.lateStartListener) {
      this.lateStartTimer = setTimeout(() => {
        this.keep?.endCall(this.uuid);
        this.lateStartListener?.remove(); this.lateStartListener = undefined;
      }, 30000);
    }
  }
}
