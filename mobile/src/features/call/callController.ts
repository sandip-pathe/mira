import { AppState } from 'react-native';
import { randomUUID } from 'expo-crypto';
import { useSyncExternalStore } from 'react';
import type { AudioRoute } from 'react-native-callkeep';
import { BolnaCall, type CallState } from './BolnaCall';
import { AndroidCallSystem } from './AndroidCallSystem';
import { onContextRevoked } from '../../shared/demoEvents';
import { clearCallConversation } from './callContext';
import { clearCallTalkReturn, stageCallTalkReturn } from './callTalkReturn';

export type CallSnapshot = {
  state: CallState; error: string; muted: boolean; held: boolean;
  connectedAt?: number; endedAt?: number; routes: AudioRoute[];
};
export const isCallLive = (state: CallState) => !['ended', 'failed'].includes(state);

class CallController {
  private snapshot: CallSnapshot = { state: 'ended', error: '', muted: false, held: false, routes: [] };
  private listeners = new Set<() => void>();
  private call?: BolnaCall;
  private system?: AndroidCallSystem;
  private attempt = 0;
  private unsubscribeContext?: () => void;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  getSnapshot = () => this.snapshot;
  private update(value: Partial<CallSnapshot>) {
    this.snapshot = { ...this.snapshot, ...value };
    this.listeners.forEach(listener => listener());
  }

  async start() {
    if (isCallLive(this.snapshot.state)) return;
    if (AppState.currentState !== 'active') return;
    clearCallTalkReturn();
    const attempt = ++this.attempt;
    const current = () => this.attempt === attempt;
    this.update({ state: 'connecting', error: '', muted: false, held: false,
      connectedAt: undefined, endedAt: undefined, routes: [] });
    const call = new BolnaCall((state, error) => {
      if (!current()) return;
      if (state === 'ended' || state === 'failed') { this.finish(state, error); return; }
      this.update({ state, error: error ?? '',
        ...(state === 'connected' && !this.snapshot.connectedAt ? { connectedAt: Date.now() } : {}) });
      if (state === 'connected') this.system?.connected();
      this.system?.ringing((state === 'connecting' || state === 'ringing') && !this.snapshot.held);
      this.system?.status(state === 'reconnecting' ? 'Reconnecting…' : state === 'connected' ? 'Call in progress' : 'Calling Mira…');
    });
    this.call = call;
    const system = new AndroidCallSystem(randomUUID(), {
      end: () => { if (current()) this.end(); },
      fail: error => { if (current()) this.finish('failed', error); },
      mute: muted => { if (current()) { call.mute(muted); this.update({ muted }); } },
      hold: held => {
        if (current()) {
          call.hold(held); this.update({ held });
          system.ringing((this.snapshot.state === 'connecting' || this.snapshot.state === 'ringing') && !held);
          const selectedRoute = this.snapshot.routes.find(route => route.selected)?.name;
          system.proximityScreenOff(!held && (!selectedRoute || selectedRoute === 'Phone'));
        }
      },
      routes: routes => { if (current()) this.update({ routes }); },
    });
    this.system = system;
    this.unsubscribeContext = onContextRevoked(() => {
      if (current()) this.finish('failed', 'Shared context changed. Retry call to use your current choices.');
    });
    try {
      call.reserveMicrophone();
      await system.start();
      if (current()) {
        try { await system.route('Phone'); } catch { /* Keep Telecom's earpiece default if it declines the route update. */ }
        const selectedRoute = this.snapshot.routes.find(route => route.selected)?.name;
        system.proximityScreenOff(!selectedRoute || selectedRoute === 'Phone');
        await call.start();
      }
    } catch (error) {
      if (current()) this.finish('failed', error instanceof Error ? error.message : 'Call could not start.');
    }
  }

  private finish(state: 'ended' | 'failed', error = '') {
    ++this.attempt;
    this.unsubscribeContext?.(); this.unsubscribeContext = undefined;
    this.call?.stop(false); this.call = undefined;
    this.system?.stop(); this.system = undefined;
    this.update({ state, error, held: false, endedAt: Date.now(), routes: [] });
  }
  end = () => this.finish('ended');
  continueWithTalk = () => { this.end(); stageCallTalkReturn(); };
  getAudioLevel = async () => this.call?.getAudioLevel() ?? 0;
  reset = () => {
    this.end();
    clearCallConversation(); clearCallTalkReturn();
    this.update({ connectedAt: undefined, endedAt: undefined, error: '', muted: false });
  };
  mute = () => {
    if (!isCallLive(this.snapshot.state)) return;
    const muted = !this.snapshot.muted;
    this.call?.mute(muted); this.system?.mute(muted); this.update({ muted });
  };
  route = async (name: string) => {
    try {
      await this.system?.route(name);
      const selectedRoute = this.snapshot.routes.find(route => route.selected)?.name ?? name;
      this.system?.proximityScreenOff(selectedRoute === 'Phone');
    }
    catch { this.update({ error: 'Audio route could not change. Try again.' }); }
  };
}

export const callController = new CallController();
export function useMiraCall() {
  return useSyncExternalStore(callController.subscribe, callController.getSnapshot, callController.getSnapshot);
}
