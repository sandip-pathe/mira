import React from 'react';
import { Text, View } from 'react-native';
import { ActionButton, Surface, useTheme } from '../../../components/ui';
import { FeedbackItem } from '../types';

export function FeedbackSection({
  items,
  busy,
  recording,
  onAction,
  onPaper = false,
}: {
  items: FeedbackItem[];
  busy: boolean;
  recording: boolean;
  onAction: (id: string, action: 'reuse' | 'delete', enabled?: boolean) => void;
  onPaper?: boolean;
}) {
  const { colors, paper, typography } = useTheme();
  if (!items.length) return null;
  return (
    <View style={{ gap: 12 }}>
      <Text style={[typography.eyebrow, { color: onPaper ? paper.muted : colors.muted }]}>OUTCOMES MIRA CAN REMEMBER</Text>
      {items.map((item) => (
        <Surface key={item.id} style={{ gap: 9 }}>
          <Text style={[typography.body, { color: colors.ink }]}>
            {item.helpful_lesson ||
              `Private rating: ${item.action_id.replaceAll('_', ' ')} · ${item.rating.replaceAll('_', ' ')}`}
          </Text>
          <ActionButton
            label={item.reuse_context ? 'Stop future use' : 'Allow future use'}
            variant="secondary"
            disabled={busy || recording}
            onPress={() => onAction(item.id, 'reuse', !item.reuse_context)}
          />
          <ActionButton
            label="Delete feedback context"
            variant="quiet"
            disabled={busy || recording}
            onPress={() => onAction(item.id, 'delete')}
          />
        </Surface>
      ))}
    </View>
  );
}
