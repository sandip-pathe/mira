import React from 'react';
import { Pressable, Switch, Text, TextInput, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, useTheme } from '../../../../components/ui';
import type { MoveChoice } from './preferences';
import type { MoveSceneExperience } from './useMoveSceneExperience';
import { styles } from './moveSceneStyles';

const options: { id: MoveChoice; title: string; detail: string }[] = [
  { id: 'walk', title: 'A short walk', detail: 'Only if walking feels comfortable.' },
  { id: 'move_here', title: 'Gentle movement here', detail: 'Seated movement is welcome; stop if anything feels uncomfortable.' },
  { id: 'change_spot', title: 'Change to another spot', detail: 'A small change of view can be enough.' },
  { id: 'custom', title: 'My own break', detail: 'Choose an idea that suits you.' },
  { id: 'stay', title: 'Stay right here', detail: 'No movement is needed.' },
];

function PreferenceToggle({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  const { colors, typography } = useTheme();
  return <View style={styles.preference}>
    <Text style={[typography.recentTitle, { color: colors.ink, flex: 1 }]}>{label}</Text>
    <Switch accessibilityLabel={label} value={value} onValueChange={onChange}
      trackColor={{ false: colors.disabled, true: colors.primary }} thumbColor={colors.surface} />
  </View>;
}

export function MoveSceneChoices({ experience: x }: { experience: MoveSceneExperience }) {
  const { colors, typography } = useTheme();
  return <>
    <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>What feels accessible right now?</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel="Choose your break">
      {options.map((option) => {
        const selected = x.choice === option.id;
        return <Pressable key={option.id} accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={() => x.choose(option.id)}
          style={({ pressed }) => [styles.choice, { borderColor: colors.line, opacity: pressed ? 0.65 : 1 }]}>
          <View style={styles.choiceText}>
            <Text style={[typography.activityTitle, { color: colors.ink }]}>{option.title}</Text>
            <Text style={[typography.support, { color: colors.muted }]}>{option.detail}</Text>
          </View>
          <MaterialDesignIcons name={selected ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={selected ? colors.primary : colors.muted} />
        </Pressable>;
      })}
    </View>
    {x.choice === 'custom' && <TextInput accessibilityLabel="Describe your break" multiline maxLength={120} value={x.customText}
      onChangeText={x.setCustomText} placeholder="What would suit you? (optional)" placeholderTextColor={colors.muted}
      cursorColor={colors.primary} selectionColor={colors.primary}
      style={[typography.body, styles.input, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line }]} />}
    <PreferenceToggle label="Remember this choice on this device" value={x.preferences.rememberChoice} onChange={(v) => x.togglePreference('rememberChoice', v)} />
    {!!x.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{x.status}</Text>}
    <ActionButton label="Continue" disabled={!x.choice} onPress={x.confirmChoice} />
    <ActionButton label="Skip this activity" variant="quiet" onPress={x.skip} />
  </>;
}

export function MoveScenePreparation({ experience: x }: { experience: MoveSceneExperience }) {
  const { colors, typography } = useTheme();
  return <>
    <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>{x.title}</Text>
    <Text style={[typography.body, { color: colors.ink }]}>{x.choice === 'walk' ? 'Choose a nearby route or place that feels comfortable. You can turn back anytime.' : x.choice === 'move_here' ? 'Try a gentle movement, seated or standing. Nothing needs to be stretched or pushed.' : x.choice === 'change_spot' ? 'Move to a spot that feels comfortable, or simply turn toward a different view.' : x.choice === 'stay' ? 'No movement is needed. Take a pause right where you are.' : x.customText.trim() || 'Take your break in the way you chose.'}</Text>
    <PreferenceToggle label="Show elapsed time when I return" value={x.preferences.showElapsed} onChange={(v) => x.togglePreference('showElapsed', v)} />
    <PreferenceToggle label="Play a soft start and return cue" value={x.preferences.audioCue} onChange={(v) => x.togglePreference('audioCue', v)} />
    <Text style={[typography.support, { color: colors.muted }]}>Audio cues are short and play from this device. The break itself has no timer or reminders.</Text>
    {!!x.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{x.status}</Text>}
    <ActionButton label={x.choice === 'stay' ? 'Take a pause here' : 'Start my break'} onPress={x.startBreak} />
    <ActionButton label="Choose something else" variant="secondary" onPress={() => x.moveTo('choose')} />
  </>;
}
