import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from '../../../components/ui';

type IconName = React.ComponentProps<typeof MaterialDesignIcons>['name'];
export const activityIcons = {
  brain_dump: 'thought-bubble-outline',
  unsent_letter: 'email-outline',
  name_a_feeling: 'emoticon-outline',
  one_small_step: 'stairs',
  reach_out: 'message-outline',
  short_movement: 'walk',
  one_song_break: 'music-note-outline',
  grounding: 'leaf',
  paced_breathing: 'weather-windy',
  journal: 'notebook-outline',
} as const satisfies Record<string, IconName>;

export function ActivityLibraryRow({ title, summary, icon, preferred = false, onPress }: {
  title: string;
  summary: string;
  icon: IconName;
  preferred?: boolean;
  onPress: () => void;
}) {
  const { colors, typography } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${summary}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, {
        minHeight: preferred ? 68 : 80,
        borderBottomWidth: preferred ? 0 : StyleSheet.hairlineWidth,
        borderBottomColor: colors.line,
        backgroundColor: pressed ? colors.soft : 'transparent',
        opacity: pressed ? 0.7 : 1,
      }]}
    >
      {!preferred && <MaterialDesignIcons name={icon} size={24} color={colors.primary} style={styles.icon} />}
      <View style={styles.words}>
        <Text style={[typography.activityTitle, { color: colors.ink }]}>{title}</Text>
        <Text style={[typography.activitySummary, { color: colors.muted }]}>{summary}</Text>
      </View>
      <MaterialDesignIcons name="arrow-top-right" size={19} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  icon: { width: 28, textAlign: 'center' },
  words: { flex: 1, gap: 4 },
});
