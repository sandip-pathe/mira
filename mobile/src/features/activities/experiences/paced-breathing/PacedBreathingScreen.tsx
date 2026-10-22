import React from 'react';
import { AccessibilityInfo, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { ActivityFrame } from '../../runtime/ActivityFrame';
import type { ActivityExperienceProps } from '../../runtime/contracts';
import { BreathingOrb } from '../../art/BreathingOrb';
import { ActivityPreferencePrompt } from '../../components/ActivityPreferencePrompt';
import { usePacedBreathingExperience } from './usePacedBreathingExperience';
import { BreathingSettings } from './BreathingSettings';
import { useBreathingCues } from './useBreathingCues';
import { styles } from './pacedBreathingStyles';

export function PacedBreathingScreen({ onBack, origin }: ActivityExperienceProps) {
  const { colors, typography } = useTheme();
  const experience = usePacedBreathingExperience(origin);
  useBreathingCues(experience);
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const scroll = React.useRef<ScrollView>(null);
  React.useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => { if (mounted) setReduceMotion(enabled); }).catch(() => undefined);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; sub.remove(); };
  }, []);
  React.useEffect(() => { scroll.current?.scrollTo({ y: 0, animated: false }); }, [experience.phase]);
  const settings = <BreathingSettings experience={experience} reduceMotion={reduceMotion} touchCueSupported={Platform.OS === 'android'} />;
  const settingsButton = <Pressable accessibilityRole="button" accessibilityLabel="Breathing settings"
    accessibilityState={{ expanded: experience.settingsOpen }} hitSlop={8}
    onPress={() => experience.setSettingsOpen((open) => !open)}
    style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.65 : 1 }]}>
    <MaterialDesignIcons name="tune-variant" size={22} color={colors.primary} />
  </Pressable>;
  const header = (label: string) => <View style={styles.sectionHeader}><Eyebrow>{label}</Eyebrow>{settingsButton}</View>;
  const phaseLabel = experience.pace === 'own_pace'
    ? (experience.manualPhase === 'in' ? 'Breathe in, if that feels comfortable' : 'Breathe out, if that feels comfortable')
    : experience.pace === 'double_inhale' && experience.segmentIndex === 1 ? 'Take a small, easy breath in'
      : experience.currentSegment?.phase === 'in' ? 'Breathe in gently' : 'Let the breath out';
  const orbPhase = experience.phase === 'active'
    ? (experience.pace === 'own_pace' ? experience.manualPhase : experience.currentSegment?.phase ?? 'still')
    : 'still';
  return <ActivityFrame><ScrollView ref={scroll} contentContainerStyle={styles.content}>
    {experience.phase === 'loading' && <View style={styles.spacer}><Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>Opening breathing…</Text></View>}
    {experience.phase === 'ready' && <>
      {header('FOLLOW A GUIDE')}
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Paced breathing</Text>
      <BreathingOrb phase="still" reduceMotion={reduceMotion} />
      <Text style={[typography.groupHeading, { color: colors.ink }]}>{experience.pace === 'equal' ? 'Even rhythm' : experience.pace === 'longer_exhale' ? 'Longer exhale' : experience.pace === 'double_inhale' ? 'Two easy inhales' : 'My own pace'}</Text>
      <Text style={[typography.support, { color: colors.muted }]}>{experience.pace === 'equal' ? 'Breathe in for 4, out for 4.' : experience.pace === 'longer_exhale' ? 'Breathe in for 4, out for 6.' : experience.pace === 'double_inhale' ? 'A small second inhale, then a longer exhale.' : 'No timer or counted breathing.'} You can change the rhythm or follow your own pace.</Text>
      {experience.settingsOpen && settings}
      {!!experience.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{experience.status}</Text>}
      <View style={styles.spacer} />
      <ActionButton label="Begin" onPress={experience.start} />
      <ActionButton label="Back" variant="quiet" onPress={onBack} />
    </>}
    {(experience.phase === 'active' || experience.phase === 'paused') && <>
      {header(experience.pace === 'own_pace' ? 'YOUR OWN PACE' : `BREATH ${Math.min(experience.cyclesDone + 1, experience.pace === 'double_inhale' ? 4 : 5)} OF ${experience.pace === 'double_inhale' ? 4 : 5}`)}
      <View style={styles.spacer} />
      <BreathingOrb phase={orbPhase} durationMs={experience.activeDuration}
        running={experience.phase === 'active' && !reduceMotion} reduceMotion={reduceMotion} size={260} />
      <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={[typography.groupHeading, styles.centered, { color: colors.ink }]}>
        {experience.phase === 'paused' ? 'Paused' : phaseLabel}
      </Text>
      <Text style={[typography.support, styles.centered, { color: colors.muted }]}>
        {experience.phase === 'paused' ? 'Resume when you are ready.' : experience.pace === 'own_pace' ? 'Nothing to count. There is no right pace.' : `${Math.max(1, Math.ceil(experience.remainingMs / 1000))} seconds · ${experience.pace === 'equal' ? 'Even rhythm' : experience.pace === 'longer_exhale' ? 'Longer exhale' : 'Two easy inhales'}`}
      </Text>
      {experience.settingsOpen && settings}
      {experience.pendingPace && <View style={{ gap: 8 }}>
        <Text style={[typography.support, { color: colors.muted }]}>A different rhythm is ready. It will begin from a fresh inhale.</Text>
        <ActionButton label="Transition rhythm" onPress={experience.transitionPace} />
      </View>}
      {!!experience.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{experience.status}</Text>}
      {experience.pace === 'own_pace' && experience.phase === 'active' && <ActionButton label="Shift the visual" variant="secondary" onPress={experience.toggleManualPhase} />}
      <View style={styles.actions}>
        <ActionButton label={experience.phase === 'paused' ? 'Resume' : 'Pause'} onPress={experience.phase === 'paused' ? experience.resume : experience.pause} style={styles.action} />
        <ActionButton label="Finish" variant="quiet" onPress={experience.finish} style={styles.action} />
      </View>
      <ActionButton label="Leave breathing" variant="quiet" onPress={onBack} />
      <Text style={[typography.support, styles.centered, { color: colors.muted }]}>Stop or pause whenever you like. Let your breath stay comfortable.</Text>
    </>}
    {experience.phase === 'round_complete' && <>
      {header('ROUND COMPLETE')}
      <BreathingOrb phase="still" reduceMotion={reduceMotion} />
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Take a moment.</Text>
      <Text style={[typography.support, { color: colors.muted }]}>You completed {experience.cyclesDone} breaths. Continue, change rhythm, or finish here.</Text>
      <ActionButton label="Rhythm and cues" variant="secondary" onPress={() => experience.setSettingsOpen((open) => !open)} />
      {experience.settingsOpen && settings}
      {!!experience.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{experience.status}</Text>}
      <ActionButton label="Another round" onPress={experience.beginAnotherRound} />
      <ActionButton label="Finish" variant="quiet" onPress={experience.finish} />
    </>}
    {experience.phase === 'done' && <>
      <Eyebrow>BREATHING COMPLETE</Eyebrow>
      <BreathingOrb phase="still" reduceMotion={reduceMotion} />
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>You made space for a pause.</Text>
      <Text style={[typography.support, { color: colors.muted }]}>Your breathing session was not saved.</Text>
      <ActivityPreferencePrompt run={experience.run} title="Paced Breathing" />
      <ActionButton label="Return to where you started" onPress={onBack} />
    </>}
  </ScrollView></ActivityFrame>;
}
