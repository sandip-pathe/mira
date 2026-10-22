import React from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { ActionButton, useTheme } from '../../../components/ui';
import { COLOR_PAIRS, PROMPT_GROUPS, type ColorPair } from './journalConstants';
import { styles } from './journalStyles';

export function PromptPicker({ visible, selectedPrompt, onClose, onSelect }: {
  visible: boolean; selectedPrompt: string; onClose: () => void; onSelect: (prompt: string) => void;
}) {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = React.useState(PROMPT_GROUPS[0]);
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable accessible={false} style={styles.scrim} onPress={onClose}>
      <Pressable accessible={false} accessibilityViewIsModal style={[styles.promptSheet, { backgroundColor: colors.surface, paddingBottom: Math.max(18, insets.bottom) }]}
        onPress={(event) => event.stopPropagation()}>
        <View style={styles.sheetHeader}>
          <Text accessibilityRole="header" style={[typography.sheetTitle, styles.sheetTitle, { color: colors.ink }]}>Pick a prompt</Text>
          <Pressable accessibilityRole="button" onPress={onClose} accessibilityLabel="Close prompts" style={styles.close}>
            <MaterialDesignIcons name="close" size={24} color={colors.ink} />
          </Pressable>
        </View>
        <View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>
            {PROMPT_GROUPS.map((group) => {
              const selected = group.title === category.title;
              return <Pressable key={group.title} accessibilityRole="tab" accessibilityState={{ selected }}
                onPress={() => setCategory(group)} style={[styles.categoryTab, { backgroundColor: selected ? colors.primary : colors.soft }]}>
                <Text style={[typography.button, { color: selected ? colors.onPrimary : colors.ink }]}>{group.title}</Text>
              </Pressable>;
            })}
          </ScrollView>
        </View>
        <ScrollView contentContainerStyle={styles.promptList}>
          <Text accessibilityRole="header" style={[typography.groupHeading, { color: colors.ink }]}>{category.title}</Text>
          {category.prompts.map((prompt) => <Pressable key={prompt} accessibilityRole="button"
            accessibilityState={{ selected: prompt === selectedPrompt }} onPress={() => onSelect(prompt)}
            style={({ pressed }) => [styles.promptOption, { borderBottomColor: colors.line, opacity: pressed ? 0.65 : 1 }]}>
            <Text style={[typography.body, styles.promptOptionText, { color: prompt === selectedPrompt ? colors.primary : colors.ink }]}>{prompt}</Text>
            {prompt === selectedPrompt && <MaterialDesignIcons name="check" size={20} color={colors.primary} />}
          </Pressable>)}
        </ScrollView>
      </Pressable>
    </Pressable>
  </Modal>;
}

export function ColorPicker({ visible, palette, fontSize, onClose, onSelect, onFontSize }: {
  visible: boolean; palette: ColorPair; fontSize: number; onClose: () => void;
  onSelect: (palette: ColorPair) => void; onFontSize: (size: number) => void;
}) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { colors, paper, typography } = useTheme();
  // Use four columns on compact phones so every color remains a 48-unit target.
  const columns = width < 340 ? 4 : 5;
  const swatchSize = Math.max(48, Math.min(54, (width - insets.left - insets.right - 44) / columns - 8));
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <Pressable accessible={false} style={styles.scrim} onPress={onClose}>
      <Pressable accessible={false} accessibilityViewIsModal style={[styles.colorSheet, { backgroundColor: colors.surface, paddingBottom: Math.max(18, insets.bottom) }]}
        onPress={(event) => event.stopPropagation()}>
        <View style={[styles.sheetHeader, { paddingHorizontal: 0 }]}>
          <Text accessibilityRole="header" style={[typography.sheetTitle, styles.sheetTitle, { color: colors.ink }]}>Page style</Text>
          <Pressable accessibilityRole="button" style={styles.close} onPress={onClose} accessibilityLabel="Close page style">
            <MaterialDesignIcons name="close" size={24} color={colors.ink} />
          </Pressable>
        </View>
        <FlatList key={columns} data={COLOR_PAIRS} keyExtractor={(item) => item.dark} numColumns={columns}
          contentContainerStyle={styles.colorGrid}
          ListHeaderComponent={<Text style={[typography.support, { color: colors.muted }]}>Page color</Text>}
          renderItem={({ item, index }) => {
            const selected = item.dark === palette.dark;
            return <Pressable accessibilityRole="button" accessibilityLabel={`Page color ${index + 1}`}
              accessibilityState={{ selected }} onPress={() => onSelect(item)}
              style={[styles.colorSwatch, { width: swatchSize, height: swatchSize, backgroundColor: item.light,
                borderColor: selected ? paper.ink : `${paper.ink}55`, borderWidth: selected ? 3 : 1 }]}>
              {selected && <MaterialDesignIcons name="check" size={22} color={paper.ink} />}
            </Pressable>;
          }}
          ListFooterComponent={<>
            <View style={[styles.fontRow, { borderTopColor: colors.line }]}>
              <Text style={[typography.support, styles.fontLabel, { color: colors.ink }]}>Writing size</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Decrease text size"
                accessibilityState={{ disabled: fontSize <= 14 }} disabled={fontSize <= 14}
                onPress={() => onFontSize(Math.max(14, fontSize - 1))} style={styles.fontButton}>
                <Text style={[typography.groupHeading, { color: fontSize <= 14 ? colors.disabledInk : colors.ink }]}>A−</Text>
              </Pressable>
              <Text style={[typography.support, styles.fontValue, { color: colors.ink }]}>{fontSize}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Increase text size"
                accessibilityState={{ disabled: fontSize >= 26 }} disabled={fontSize >= 26}
                onPress={() => onFontSize(Math.min(26, fontSize + 1))} style={styles.fontButton}>
                <Text style={[typography.groupHeading, { color: fontSize >= 26 ? colors.disabledInk : colors.ink }]}>A+</Text>
              </Pressable>
            </View>
            <Text style={[typography.journalWriting, styles.colorPreview,
              { backgroundColor: palette.light, color: paper.ink, fontSize, lineHeight: fontSize * 1.65 }]}>Your words, your page.</Text>
            <ActionButton label="Done" onPress={onClose} />
          </>} />
      </Pressable>
    </Pressable>
  </Modal>;
}

