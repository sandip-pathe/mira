import React from 'react';
import { Keyboard, Pressable, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { NoticeNameArtwork } from '../../art/NoticeNameArtwork';
import { feelingWords } from './noticeNameData';
import { FeelingDefinitionSheet, feelingDescriptions } from './FeelingDefinitionSheet';
import { NoticeNameChip } from './NoticeNameChip';
import type { NoticeNameExperience } from './useNoticeNameExperience';
import { styles } from './noticeNameStyles';

export function FeelingSelection({ experience, onBack }: { experience: NoticeNameExperience; onBack: () => void }) {
  const { colors, typography } = useTheme();
  const [definition, setDefinition] = React.useState('');
  useFocusEffect(React.useCallback(() => () => setDefinition(''), []));
  return <>
    <Eyebrow>NOTICE & NAME</Eyebrow>
    <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Find a word that fits.</Text>
    <NoticeNameArtwork selectedCount={experience.feelings.length} />
    <Text style={[typography.groupHeading, { color: colors.ink }]}>What comes closest to this moment?</Text>
    <Text style={[typography.support, { color: colors.muted }]}>Choose one or more words. You can add your own, or leave it uncertain.</Text>
    {!!experience.feelings.length && <View style={styles.group}>
      <Text style={[typography.activityTitle, { color: colors.ink }]}>Words you chose</Text>
      <View style={styles.chips}>{experience.feelings.map((word) => <NoticeNameChip key={word} label={word} selected removable onPress={() => experience.toggleFeeling(word)} />)}</View>
    </View>}
    <View>{feelingWords.map((group) => {
      const selected = experience.feelings.includes(group.label);
      const expanded = experience.expandedFeeling === group.label;
      return <View key={group.label} style={[styles.feelingGroup, { borderBottomColor: colors.line }]}>
        <View style={styles.feelingRow}>
          <Pressable accessibilityRole="button" accessibilityState={{ selected, expanded }}
            accessibilityHint="Select this word and show nearby shades. Remove chosen words from the list above."
            onPress={() => {
              experience.setExpandedFeeling(expanded ? undefined : group.label);
              if (!selected) experience.toggleFeeling(group.label);
            }} style={({ pressed }) => [styles.feelingButton, { opacity: pressed ? 0.65 : 1 }]}>
            <MaterialDesignIcons name={selected ? 'check-circle' : 'circle-outline'} size={22} color={selected ? colors.primary : colors.muted} />
            <Text style={[typography.body, styles.feelingLabel, { color: selected ? colors.primary : colors.ink }]}>{group.label}</Text>
            <MaterialDesignIcons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={colors.muted} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={`About ${group.label}`}
            onPress={() => { Keyboard.dismiss(); setDefinition(group.label); }} style={styles.iconButton}>
            <MaterialDesignIcons name="information-outline" size={22} color={colors.primary} />
          </Pressable>
        </View>
        {expanded && <View style={styles.shades}>
          <Text style={[typography.support, { color: colors.muted }]}>{feelingDescriptions[group.label]}</Text>
          <Text style={[typography.activityTitle, { color: colors.ink }]}>Nearby shades</Text>
          <View style={styles.chips}>{group.shades.map((shade) => <NoticeNameChip key={shade} label={shade}
            selected={experience.feelings.includes(shade)} onPress={() => experience.toggleFeeling(shade)} />)}</View>
        </View>}
      </View>;
    })}</View>
    <Text style={[typography.activityTitle, { color: colors.ink }]}>My own words (English, Hinglish, or mixed)</Text>
    <TextInput accessibilityLabel="Add your own feeling word" value={experience.customWord} maxLength={60}
      onChangeText={experience.setCustomWord} onSubmitEditing={experience.addCustomWord} placeholder="Type a word or phrase"
      placeholderTextColor={colors.muted} cursorColor={colors.primary} selectionColor={colors.primary}
      style={[typography.body, styles.input, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.line }]} />
    <ActionButton label="Add my words" variant="secondary" disabled={!experience.customWord.trim()} onPress={experience.addCustomWord} />
    <ActionButton label="Continue" disabled={!experience.feelings.length} onPress={() => experience.setStage('body')} />
    <ActionButton label="Return" variant="quiet" onPress={onBack} />
    <FeelingDefinitionSheet word={definition} onClose={() => setDefinition('')} />
  </>;
}
