import React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, useTheme } from '../../../../components/ui';
import type { BreathingRhythm } from './preferences';
import type { PacedBreathingExperience } from './usePacedBreathingExperience';
import { styles } from './pacedBreathingStyles';

const rhythms: { id: BreathingRhythm; title: string; description: string }[] = [
  { id: 'equal', title: 'Even rhythm', description: 'Breathe in for 4, out for 4' },
  { id: 'longer_exhale', title: 'Longer exhale', description: 'Breathe in for 4, out for 6' },
  { id: 'double_inhale', title: 'Two easy inhales', description: 'A small second inhale, then a longer exhale' },
  { id: 'own_pace', title: 'My own pace', description: 'No timer or counted breathing' },
];

export function BreathingSettings({ experience: x, reduceMotion, touchCueSupported }: { experience: PacedBreathingExperience; reduceMotion: boolean; touchCueSupported: boolean }) {
  const { colors, typography } = useTheme();
  return <View style={styles.settings}>
    <Text style={[typography.activityTitle, styles.settingLabel, { color: colors.ink }]}>Choose a rhythm</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel="Breathing rhythm" style={styles.choices}>
      {rhythms.map((item) => {
        const selected = x.pendingPace ? x.pendingPace === item.id : x.pace === item.id;
        return <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ checked: selected }}
          onPress={() => x.selectPace(item.id)} style={({ pressed }) => [styles.choice, { borderColor: colors.line, opacity: pressed ? 0.65 : 1 }]}>
          <View style={styles.choiceText}>
            <Text style={[typography.activityTitle, { color: selected ? colors.primary : colors.ink }]}>{item.title}</Text>
            <Text style={[typography.support, { color: colors.muted }]}>{item.description}</Text>
          </View>
          <MaterialDesignIcons name={selected ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={selected ? colors.primary : colors.muted} />
        </Pressable>;
      })}
    </View>
    <ActionButton label="Use this rhythm as my default" variant="quiet" onPress={() => void x.saveDefault()} />
    <Text style={[typography.activityTitle, styles.settingLabel, { color: colors.ink }]}>Optional cues</Text>
    <CueSwitch label="Touch cue" hint={touchCueSupported ? 'A light vibration at each breath change.' : 'Touch cues are available on Android.'}
      value={x.settings.touchCue} disabled={!touchCueSupported} onChange={(value) => void x.toggleCue('touchCue', value)} />
    <CueSwitch label="Soft audio cue" hint="A quiet tone at each breath change. Audio cues start only when enabled."
      value={x.settings.audioCue} onChange={(value) => void x.toggleCue('audioCue', value)} />
    {reduceMotion && <Text style={[typography.support, { color: colors.muted }]}>Reduced motion is on; the breathing illustration stays still.</Text>}
  </View>;
}

function CueSwitch({ label, hint, value, disabled, onChange }: { label: string; hint: string; value: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  const { colors, typography } = useTheme();
  return <View style={styles.cue}>
    <View style={styles.cueText}>
      <Text style={[typography.recentTitle, { color: colors.ink }]}>{label}</Text>
      <Text style={[typography.support, { color: colors.muted }]}>{hint}</Text>
    </View>
    <Switch accessibilityLabel={label} value={value} disabled={disabled} onValueChange={onChange}
      trackColor={{ false: colors.disabled, true: colors.primary }} thumbColor={colors.surface} />
  </View>;
}
