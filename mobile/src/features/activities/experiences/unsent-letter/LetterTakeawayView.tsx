import React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import type { LetterTakeaway, UnsentLetterExperience } from './useUnsentLetterExperience';
import { styles } from './letterStyles';

export function LetterTakeawayView({ experience, onTalkTransfer }: {
  experience: UnsentLetterExperience; onTalkTransfer: (runId: string, text: string) => boolean;
}) {
  const { colors, typography } = useTheme();
  const [choice, setChoice] = React.useState<keyof LetterTakeaway>(() => experience.takeaway?.talk_line.trim() ? 'talk_line' : 'need_or_boundary');
  const [visible] = React.useState(() => ({
    need_or_boundary: !!experience.takeaway?.need_or_boundary.trim(), talk_line: !!experience.takeaway?.talk_line.trim(),
  }));
  const { takeaway, saving } = experience;
  if (!takeaway) return null;

  function update(field: keyof LetterTakeaway, value: string) {
    experience.setTakeaway((current) => current ? { ...current, [field]: value } : current);
  }
  function openTalk() {
    const text = takeaway?.[choice].trim();
    if (!text) return;
    const source = experience.letter?.id ?? experience.clientRunId;
    try {
      if (!onTalkTransfer(`${source}:letter-takeaway`, text)) experience.setStatus('Your selected takeaway is still here. Talk could not be opened.');
    } catch { experience.setStatus('Your selected takeaway is still here. Talk could not be opened.'); }
  }

  return <View style={[styles.takeaway, { borderTopColor: colors.line }]}>
    <Eyebrow>AN OPTIONAL TAKEAWAY</Eyebrow>
    <Text style={[typography.support, { color: colors.muted }]}>These are suggestions based only on this letter. Edit them, keep the letter as it is, or leave this section. Mira does not know what the recipient thinks.</Text>
    {(['need_or_boundary', 'talk_line'] as const).filter((field) => visible[field]).map((field) => (
      <View key={field} style={{ gap: 8 }}>
        <Text style={[typography.activityTitle, { color: colors.ink }]}>{field === 'need_or_boundary' ? 'A possible need or boundary' : 'A possible sentence for Talk'}</Text>
        <TextInput accessibilityLabel={field === 'need_or_boundary' ? 'Edit possible need or boundary' : 'Edit possible sentence for Talk'}
          multiline value={takeaway[field]} editable={!saving} onChangeText={(value) => update(field, value)}
          cursorColor={colors.primary} selectionColor={colors.primary}
          style={[typography.body, styles.takeawayField, { color: colors.ink, backgroundColor: colors.surface, borderColor: choice === field ? colors.primary : colors.line }]} />
        <Pressable accessibilityRole="radio" accessibilityState={{ checked: choice === field, disabled: saving }} disabled={saving}
          onPress={() => setChoice(field)} style={styles.quietRow}>
          <MaterialDesignIcons name={choice === field ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={colors.primary} />
          <Text style={[typography.support, styles.rowText, { color: colors.ink }]}>{field === 'need_or_boundary' ? 'Use this takeaway in Talk' : 'Use this sentence in Talk'}</Text>
        </Pressable>
      </View>
    ))}
    <ActionButton label="Talk about the selected takeaway" onPress={openTalk} disabled={!takeaway[choice].trim() || saving} />
  </View>;
}
