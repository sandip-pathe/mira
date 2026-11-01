import React from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { useTheme } from './theme';
import { themes, type ThemeId } from './themeTokens';
import { saveThemePreference } from '../../shared/storage/themePreference';

const choices: ThemeId[] = ['warm-light', 'forest-dark', 'blackout'];

export function ThemePickerButton() {
  const { id, colors, typography, setThemeId } = useTheme();
  const [visible, setVisible] = React.useState(false);

  function chooseTheme(themeId: ThemeId) {
    setVisible(false);
    setThemeId(themeId);
    void saveThemePreference(themeId).catch(() => {
      Alert.alert('Theme not saved', 'This look is active for now, but Mira could not save it on this device.');
    });
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Appearance. Current theme: ${themes[id].label}`}
      onPress={() => setVisible(true)}
      style={({ pressed }) => [styles.button, pressed && { backgroundColor: colors.soft }]}
    >
      <MaterialDesignIcons name="theme-light-dark" size={26} color={colors.ink} />
      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={[styles.backdrop, { backgroundColor: '#00000066' }]} onPress={() => setVisible(false)}>
          <Pressable accessibilityRole="none" onPress={() => {}} style={[styles.sheet, { backgroundColor: colors.canvas }]}>
            <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Appearance</Text>
            <Text style={[typography.support, { color: colors.muted }]}>Choose a look for Mira.</Text>
            {choices.map((themeId) => {
              const option = themes[themeId];
              return (
                <Pressable key={themeId} accessibilityRole="radio" accessibilityState={{ selected: themeId === id }}
                  onPress={() => chooseTheme(themeId)}
                  style={[styles.option, { backgroundColor: colors.surface, borderColor: themeId === id ? colors.primary : colors.line }]}>
                  <View style={[styles.swatch, { backgroundColor: option.colors.canvas, borderColor: option.colors.line }]}>
                    <View style={[styles.swatchMark, { backgroundColor: option.colors.primary }]} />
                  </View>
                  <Text style={[typography.activityTitle, styles.optionLabel, { color: colors.ink }]}>{option.label}</Text>
                  {themeId === id && <MaterialDesignIcons name="check-circle" size={22} color={colors.primary} />}
                </Pressable>
              );
            })}
            <Pressable accessibilityRole="button" onPress={() => setVisible(false)} style={styles.close}>
              <Text style={[typography.button, { color: colors.primary }]}>Done</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    minHeight: 48,
    paddingHorizontal: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  backdrop: { flex: 1, justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 460, alignSelf: 'center', borderRadius: 24, padding: 22, gap: 12 },
  option: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderWidth: 1.5, borderRadius: 16 },
  swatch: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  swatchMark: { width: 17, height: 17, borderRadius: 9 },
  optionLabel: { flex: 1 },
  close: { minHeight: 44, justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end', paddingHorizontal: 12 },
});
