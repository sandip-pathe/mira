import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { ActionButton, useTheme } from '../../../components/ui';

export function UrgentHelpPanel({ onClose }: { onClose: () => void }) {
  const { colors, typography } = useTheme();
  return (
    <ScrollView contentContainerStyle={[styles.panel, { backgroundColor: colors.canvas }]}>
      <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Urgent help now</Text>
      <Text style={[typography.body, { color: colors.ink }]}>
        This demo is not crisis support and is not connected to Mpower. Contact local emergency
        services or someone you trust now.
      </Text>
      <Text style={[typography.body, { color: colors.ink }]}>No one has been contacted through this demo.</Text>
      <ActionButton label="Close help" onPress={onClose} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({ panel: { flexGrow: 1, padding: 22, gap: 20 } });
