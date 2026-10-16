import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton, colors } from '../../../components/ui';

export function UrgentHelpPanel({ onClose }: { onClose: () => void }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>Urgent help now</Text>
      <Text style={styles.body}>
        This demo is not crisis support and is not connected to Mpower. Contact local emergency
        services or someone you trust now.
      </Text>
      <Text style={styles.body}>No one has been contacted through this demo.</Text>
      <ActionButton label="Close help" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, padding: 22, gap: 20, backgroundColor: colors.canvas },
  title: { fontSize: 25, lineHeight: 32, fontWeight: '700', color: '#183A34' },
  body: { fontSize: 15, lineHeight: 22, color: '#263F3A' },
});
