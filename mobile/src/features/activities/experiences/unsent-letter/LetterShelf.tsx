import React from 'react';
import { Pressable, Text, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, useTheme } from '../../../../components/ui';
import type { SavedLetter } from '../../../../shared/letters';
import { styles } from './letterStyles';

export function LetterShelf({ letters, expanded = false, onOpen, onDelete }: {
  letters: SavedLetter[]; expanded?: boolean; onOpen: (letter: SavedLetter) => void; onDelete?: (letter: SavedLetter) => void;
}) {
  const { colors, typography } = useTheme();
  return <>
    {(expanded ? letters : letters.slice(0, 3)).map((letter) => <View key={letter.id} style={[styles.letterRow, { borderBottomColor: colors.line }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Read ${letter.title}`} onPress={() => onOpen(letter)}
        style={({ pressed }) => [styles.savedOpen, { opacity: pressed ? 0.65 : 1 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Text style={[typography.activityTitle, { flex: 1, color: colors.ink }]}>{letter.title}</Text>
          <MaterialDesignIcons name="arrow-top-right" size={19} color={colors.muted} />
        </View>
        {expanded && !!letter.recipient && <Text style={[typography.support, { color: colors.muted }]}>To {letter.recipient}</Text>}
        <Text style={[typography.body, { color: colors.muted }]} numberOfLines={expanded ? 3 : 1}>{letter.body}</Text>
        <Text style={[typography.support, { color: colors.muted }]}>Edited {new Date(letter.updatedAt).toLocaleDateString()}</Text>
      </Pressable>
      {expanded && <View style={styles.savedActions}>
        <ActionButton label="Read" onPress={() => onOpen(letter)} style={styles.savedAction} />
        {!!onDelete && <ActionButton label="Delete" variant="quiet" onPress={() => onDelete(letter)} style={styles.savedAction} />}
      </View>}
    </View>)}
  </>;
}
