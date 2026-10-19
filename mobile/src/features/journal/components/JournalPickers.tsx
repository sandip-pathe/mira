import React from 'react';
import { FlatList, Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useAudioPlayer } from 'expo-audio';
import { ActionButton, Surface, ui } from '../../../components/ui';
import { COLOR_PAIRS, PROMPT_GROUPS, type ColorPair } from './journalConstants';
import { styles } from './journalStyles';

export function VoiceNoteRow({
  uri,
  createdAt,
  onDelete,
}: {
  uri: string;
  createdAt: number;
  onDelete: () => void;
}) {
  const player = useAudioPlayer(uri);
  return (
    <Surface style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10 }}>
      <Text style={[ui.body, { flex: 1 }]}>{new Date(createdAt).toLocaleString()}</Text>
      <ActionButton
        label={player.playing ? 'Pause' : 'Play'}
        variant="quiet"
        onPress={() => (player.playing ? player.pause() : player.play())}
      />
      <ActionButton label="Delete" variant="quiet" onPress={onDelete} />
    </Surface>
  );
}

export function PromptPicker({
  visible,
  onClose,
  onSelect,
  background,
  foreground,
  subtle,
}: {
  visible: boolean;
  onClose: () => void;
  onSelect: (prompt: string) => void;
  background: string;
  foreground: string;
  subtle: string;
}) {
  const [category, setCategory] = React.useState(PROMPT_GROUPS[0]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable
          style={[styles.promptSheet, { backgroundColor: background }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={[styles.sheetHeader, { borderBottomColor: `${foreground}30` }]}>
            <Text style={[styles.sheetTitle, { color: foreground }]}>Getting Started Prompts</Text>
            <Pressable onPress={onClose} accessibilityLabel="Close prompts">
              <MaterialDesignIcons name="close" size={26} color={foreground} />
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categories}
          >
            {PROMPT_GROUPS.map((group) => {
              const selected = group.title === category.title;
              return (
                <Pressable
                  key={group.title}
                  onPress={() => setCategory(group)}
                  style={[
                    styles.categoryTab,
                    { backgroundColor: selected ? foreground : `${foreground}0D` },
                  ]}
                >
                  <Text
                    style={{
                      color: selected ? background : foreground,
                      fontWeight: selected ? '700' : '500',
                    }}
                  >
                    {group.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <ScrollView contentContainerStyle={styles.promptList}>
            <Text style={[styles.categoryTitle, { color: foreground }]}>{category.title}</Text>
            {category.prompts.map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => onSelect(prompt)}
                style={[styles.promptOption, { backgroundColor: `${foreground}0D` }]}
              >
                <MaterialDesignIcons name="chevron-right" size={22} color={subtle} />
                <Text style={[styles.promptOptionText, { color: foreground }]}>{prompt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function ColorPicker({
  visible,
  palette,
  fontSize,
  background,
  foreground,
  onClose,
  onSelect,
  onFontSize,
}: {
  visible: boolean;
  palette: ColorPair;
  fontSize: number;
  background: string;
  foreground: string;
  onClose: () => void;
  onSelect: (palette: ColorPair) => void;
  onFontSize: (size: number) => void;
}) {
  const { width } = useWindowDimensions();
  const swatchSize = Math.max(40, Math.min(54, (width - 40) / 5 - 8));
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose}>
        <Pressable
          style={[styles.colorSheet, { backgroundColor: background }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={styles.handle} />
          <Pressable style={styles.closeColor} onPress={onClose} accessibilityLabel="Close colors">
            <MaterialDesignIcons name="close" size={28} color={foreground} />
          </Pressable>
          <Text style={[styles.colorTitle, { color: foreground }]}>Choose Background Color</Text>
          <FlatList
            data={COLOR_PAIRS}
            keyExtractor={(item) => item.dark}
            numColumns={5}
            contentContainerStyle={styles.colorGrid}
            renderItem={({ item }) => {
              const swatch = item.light;
              const selected = item.dark === palette.dark;
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Choose light ${item.dark} theme`}
                  onPress={() => onSelect(item)}
                  style={[
                    styles.colorSwatch,
                    {
                      width: swatchSize,
                      height: swatchSize,
                      backgroundColor: swatch,
                      borderColor: selected ? foreground : `${foreground}55`,
                      borderWidth: selected ? 3 : 1,
                    },
                  ]}
                />
              );
            }}
          />
          <View style={[styles.fontRow, { borderTopColor: `${foreground}30` }]}>
            <Text style={[styles.fontLabel, { color: foreground }]}>Writing size</Text>
            <Pressable
              onPress={() => onFontSize(Math.max(14, fontSize - 1))}
              accessibilityLabel="Decrease text size"
              style={styles.fontButton}
            >
              <Text style={{ color: foreground, fontSize: 20 }}>A−</Text>
            </Pressable>
            <Text style={[styles.fontValue, { color: foreground }]}>{fontSize}</Text>
            <Pressable
              onPress={() => onFontSize(Math.min(26, fontSize + 1))}
              accessibilityLabel="Increase text size"
              style={styles.fontButton}
            >
              <Text style={{ color: foreground, fontSize: 20 }}>A+</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

