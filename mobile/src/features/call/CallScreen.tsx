import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../components/ui';
import { useTalkMotion } from '../talk/hooks/useTalkMotion';
import { callController, isCallLive, useMiraCall } from './callController';
import { CallPortrait } from './CallPortrait';
import { audioRouteLabel, callColors as c } from './callAppearance';
import { useCallDuration } from './useCallDuration';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];
const routeIcon = (name?: string): IconName => name === 'Bluetooth' ? 'bluetooth-audio'
  : name === 'Headset' ? 'headphones' : name === 'Speaker' ? 'volume-high' : 'cellphone-sound';

function RoundControl({ icon, label, onPress, selected = false, disabled = false }: {
  icon: IconName; label: string; onPress: () => void; selected?: boolean; disabled?: boolean;
}) {
  const { typography } = useTheme();
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
    accessibilityLabel={label} accessibilityState={{ disabled, selected }}
    style={({ pressed }) => [styles.control, disabled && styles.disabled, pressed && styles.pressed]}>
    <View style={[styles.controlDisc, selected && styles.selectedDisc]}>
      <MaterialDesignIcons name={icon} size={27} color={selected ? c.canvas : c.ink} />
    </View>
    <Text style={[typography.support, styles.controlLabel]}>{label}</Text>
  </Pressable>;
}

export default function CallScreen() {
  const call = useMiraCall();
  const { typography } = useTheme();
  const { width, height, fontScale } = useWindowDimensions();
  const [showRoutes, setShowRoutes] = React.useState(false);
  const duration = useCallDuration(call.connectedAt, call.endedAt);
  const live = isCallLive(call.state);
  const compact = height < 720 || fontScale > 1.3;
  const portraitSize = Math.max(120, Math.min(compact ? 176 : 248, width - 112));
  const motionAllowed = useTalkMotion(live && !call.held);
  const selectedRoute = call.routes.find(route => route.selected)?.name;
  const pending = live && !call.connectedAt;
  const status = call.held ? 'Call paused' : {
    connecting: 'Connecting…', ringing: 'Calling Mira…', connected: 'Connected',
    reconnecting: 'Reconnecting…', ended: call.connectedAt ? 'Call ended' : 'Ready to call', failed: 'Couldn’t connect',
  }[call.state];
  const detail = call.held ? 'Another audio session needs your phone.'
    : call.state === 'reconnecting' ? 'Trying to restore your connection.'
    : call.state === 'connected' ? call.muted ? 'Your microphone is muted' : 'You can speak naturally'
    : call.state === 'failed' ? call.connectedAt ? 'Your earlier Talk conversation is still here.' : 'You can retry or continue with Talk.' : '';
  const minimize = () => { if (router.canGoBack()) router.back(); else router.replace('/'); };
  const continueWithTalk = () => {
    callController.continueWithTalk();
    router.dismissTo('/');
  };

  return <SafeAreaView style={styles.page}>
    <StatusBar style="light" />
    <View style={styles.header}>
      <Pressable onPress={minimize} accessibilityRole="button" accessibilityLabel={live ? 'Minimize call' : 'Return to Talk'}
        style={({ pressed }) => [styles.headerButton, pressed && styles.pressed]}>
        <MaterialDesignIcons name={live ? 'chevron-down' : 'arrow-left'} size={27} color={c.ink} />
      </Pressable>
      <Text style={[typography.eyebrow, styles.eyebrow]}>CALL MIRA</Text>
      <View style={styles.headerSpacer} />
    </View>
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, compact && styles.compactContent]}
      showsVerticalScrollIndicator={false}>
      <View style={[styles.hero, compact && styles.compactHero]}>
        <CallPortrait size={portraitSize} motionAllowed={motionAllowed} connected={call.state === 'connected' && !call.held} />
        <Text accessibilityRole="header" style={[typography.talkWelcome, styles.name]}>Mira</Text>
        <View accessibilityLiveRegion="polite" style={styles.statusRow}>
          {live && <View style={[styles.statusDot, call.state === 'connected' && !call.held && styles.connectedDot]} />}
          <Text style={[typography.body, styles.status]}>{status}</Text>
        </View>
        {!!call.connectedAt && <Text accessibilityLabel={`${live ? 'Call duration' : 'Call lasted'} ${duration}`}
          style={[typography.body, styles.duration]}>{duration}</Text>}
        <Text style={[typography.support, styles.detail]}>{detail || ' '}</Text>
        {!!call.error && <View style={styles.errorPanel}>
          <Text accessibilityLiveRegion="polite" style={[typography.support, styles.error]}>{call.error}</Text>
        </View>}
      </View>

      <View style={styles.footer}>
        {live && <View style={styles.controls}>
          <RoundControl icon={call.muted ? 'microphone-off' : 'microphone-outline'} label={call.muted ? 'Unmute' : 'Mute'}
            selected={call.muted} onPress={callController.mute} />
          <RoundControl icon={routeIcon(selectedRoute)} label={selectedRoute ? audioRouteLabel(selectedRoute) : 'Audio'}
            onPress={() => setShowRoutes(true)} disabled={!call.routes.length} />
          <RoundControl icon="arrow-collapse-down" label="Minimize" onPress={minimize} />
        </View>}
        <Pressable accessibilityRole="button" accessibilityLabel={live ? pending ? 'Cancel call' : 'End call' : 'Call Mira again'}
          onPress={() => { setShowRoutes(false); if (live) callController.end(); else void callController.start(); }}
          style={({ pressed }) => [styles.primaryButton, !live && styles.retryButton, pressed && styles.pressed]}>
          <MaterialDesignIcons name={live ? 'phone-hangup' : 'phone-outline'} size={29} color={live ? c.ink : c.canvas} />
          <Text style={[typography.body, styles.primaryLabel, !live && styles.retryLabel]}>
            {live ? pending ? 'Cancel call' : 'End call' : call.state === 'failed' ? 'Retry call' : call.endedAt ? 'Call again' : 'Call Mira'}
          </Text>
        </Pressable>
        {!live && <Pressable onPress={continueWithTalk} accessibilityRole="button" style={({ pressed }) => [styles.returnButton, pressed && styles.pressed]}>
          <Text style={[typography.body, styles.returnLabel]}>{call.state === 'failed' ? 'Continue with Talk' : 'Return to Talk'}</Text>
        </Pressable>}
      </View>
    </ScrollView>

    <Modal visible={showRoutes && live} transparent animationType={motionAllowed ? 'fade' : 'none'} onRequestClose={() => setShowRoutes(false)}>
      <SafeAreaView edges={['bottom', 'left', 'right']} style={styles.routeOverlay}>
        <ScrollView accessibilityViewIsModal style={styles.routeSheet} contentContainerStyle={styles.routeSheetContent}>
          <Text accessibilityRole="header" style={[typography.sheetTitle, styles.routeHeading]}>Call audio</Text>
          <Text style={[typography.support, styles.routeHelp]}>Choose where you hear Mira.</Text>
          {call.routes.map(route => <Pressable key={route.name} accessibilityRole="button"
            accessibilityLabel={audioRouteLabel(route.name)} accessibilityState={{ selected: !!route.selected }}
            onPress={() => { setShowRoutes(false); void callController.route(route.name); }}
            style={({ pressed }) => [styles.routeOption, route.selected && styles.routeSelected, pressed && styles.pressed]}>
            <MaterialDesignIcons name={routeIcon(route.name)} size={24} color={c.ink} />
            <Text style={[typography.body, styles.routeName]}>{audioRouteLabel(route.name)}</Text>
            {route.selected && <MaterialDesignIcons name="check" size={22} color={c.accent} />}
          </Pressable>)}
          <Pressable accessibilityRole="button" onPress={() => setShowRoutes(false)} style={styles.returnButton}>
            <Text style={[typography.body, styles.returnLabel]}>Done</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: c.canvas },
  header: { paddingHorizontal: 24, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: c.surface },
  headerSpacer: { width: 48 },
  eyebrow: { color: c.muted, letterSpacing: 2.5 },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 20, paddingBottom: 24, gap: 28 },
  compactContent: { paddingTop: 8, gap: 16 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  compactHero: { gap: 6 },
  name: { color: c.ink, fontSize: 44, lineHeight: 54, letterSpacing: -1.5, marginTop: 12 },
  statusRow: { flexDirection: 'row', gap: 8, alignItems: 'center', minHeight: 26 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.accent },
  connectedDot: { backgroundColor: '#B8C895' },
  status: { color: c.ink, textAlign: 'center' },
  duration: { color: c.accent, fontSize: 20, letterSpacing: 2, fontVariant: ['tabular-nums'] },
  detail: { color: c.muted, textAlign: 'center', maxWidth: 300 },
  errorPanel: { backgroundColor: c.surface, borderRadius: 16, padding: 14, marginTop: 8, alignSelf: 'stretch' },
  error: { color: c.ink, textAlign: 'center' },
  footer: { gap: 20, width: '100%', maxWidth: 420, alignSelf: 'center' },
  controls: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  control: { flex: 1, alignItems: 'center', gap: 10, minHeight: 96 },
  controlDisc: { width: 64, height: 64, borderRadius: 32, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, justifyContent: 'center', alignItems: 'center' },
  selectedDisc: { backgroundColor: c.ink, borderColor: c.ink },
  controlLabel: { color: c.ink, textAlign: 'center' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.7 },
  primaryButton: { minHeight: 64, borderRadius: 32, backgroundColor: c.red, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 16 },
  primaryLabel: { color: c.ink },
  retryButton: { backgroundColor: c.accent },
  retryLabel: { color: c.canvas },
  returnButton: { minHeight: 48, justifyContent: 'center', alignItems: 'center', padding: 12 },
  returnLabel: { color: c.muted },
  routeOverlay: { flex: 1, justifyContent: 'flex-end', padding: 16, backgroundColor: c.scrim },
  routeSheet: { backgroundColor: c.surface, borderRadius: 28, maxHeight: '85%', flexGrow: 0 },
  routeSheetContent: { padding: 24, gap: 12 },
  routeHeading: { color: c.ink },
  routeHelp: { color: c.muted, marginBottom: 8 },
  routeOption: { minHeight: 60, flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, gap: 16 },
  routeSelected: { backgroundColor: c.raised },
  routeName: { color: c.ink, flex: 1 },
});
