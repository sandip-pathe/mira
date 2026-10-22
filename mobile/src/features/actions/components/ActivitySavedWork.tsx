import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { router } from 'expo-router';
import { ActionButton, useTheme } from '../../../components/ui';
import type { ActivityLibrary, SavedCollection } from '../hooks/useActivityLibrary';

function SavedGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors, typography } = useTheme();
  return <View style={styles.group}>
    <Text accessibilityRole="header" style={[typography.groupHeading, { color: colors.ink }]}>{title}</Text>
    {children}
  </View>;
}

function SavedRow({ title, text, meta, onPress, onRemove }: {
  title?: string; text: string; meta?: string; onPress: () => void; onRemove: () => void;
}) {
  const { colors, typography } = useTheme();
  return <View style={[styles.savedRow, { borderBottomColor: colors.line }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${title ?? 'saved wording'}: ${text}`}
      onPress={onPress} style={({ pressed }) => [styles.savedOpen, { opacity: pressed ? 0.65 : 1 }]}>
      {!!title && <Text style={[typography.activityTitle, { color: colors.ink }]}>{title}</Text>}
      <Text numberOfLines={3} style={[typography.body, { color: colors.ink }]}>{text}</Text>
      {!!meta && <Text style={[typography.support, { color: colors.muted }]}>{meta}</Text>}
    </Pressable>
    <ActionButton label="Remove" variant="quiet" onPress={onRemove} style={styles.remove} />
  </View>;
}

export function ActivitySavedWork({ library, onContinueLayout }: {
  library: ActivityLibrary;
  onContinueLayout: (event: LayoutChangeEvent) => void;
}) {
  const { colors, typography } = useTheme();
  function confirmRemove(collection: SavedCollection, id: string, title: string) {
    Alert.alert(title, 'This removes the item saved on this device.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void library.remove(collection, id) },
    ]);
  }
  return <>
    {!!library.items.length && <View onLayout={onContinueLayout}>
      <SavedGroup title="Continue">
        {library.items.map((item) => <View key={item.id} style={[styles.continueItem, { borderBottomColor: colors.line }]}>
          <Text style={[typography.activityTitle, { color: colors.ink }]}>{item.title}</Text>
          {!!item.source_task && <Text style={[typography.support, { color: colors.muted }]}>Task: {item.source_task}</Text>}
          <Text style={[typography.body, { color: colors.ink }]}>{item.content}</Text>
          {!!item.cue && <Text style={[typography.support, { color: colors.muted }]}>When: {item.cue}</Text>}
          <View style={styles.continueActions}>
            <ActionButton label="Continue" onPress={() => router.push({ pathname: '/do', params: {
              id: item.intervention_id, origin: 'actions_continue', itemId: item.id,
            } })} style={styles.grow} />
            <ActionButton label="Mark done" variant="secondary" onPress={() => void library.remove('items', item.id)} style={styles.grow} />
          </View>
          <ActionButton label="Remove" variant="quiet" onPress={() => confirmRemove('items', item.id, 'Remove from Continue?')} style={styles.remove} />
        </View>)}
      </SavedGroup>
    </View>}
    {!!library.takeaways.length && <SavedGroup title="Saved takeaways">
      {library.takeaways.map((item) => <SavedRow key={item.id}
        title={item.section === 'heavy' ? 'What seems heavy' : item.section === 'wait' ? 'Could wait for now' : 'One thread to follow'}
        text={item.text} meta="Saved from Brain Dump"
        onPress={() => router.push({ pathname: '/saved-takeaway', params: { id: item.id } })}
        onRemove={() => confirmRemove('takeaways', item.id, 'Remove saved takeaway?')} />)}
    </SavedGroup>}
    {!!library.savedActions.length && <SavedGroup title="Saved actions">
      {library.savedActions.map((item) => <SavedRow key={item.id}
        title={item.outcome === 'tried' ? 'Tried' : item.outcome === 'not_tried' ? 'Not tried yet' : 'One Small Step'}
        text={item.firstMove} meta={item.task}
        onPress={() => router.push({ pathname: '/saved-action', params: { id: item.id } })}
        onRemove={() => confirmRemove('savedActions', item.id, 'Remove saved action?')} />)}
    </SavedGroup>}
    {!!library.savedWordings.length && <SavedGroup title="Saved wording">
      {library.savedWordings.map((item) => <SavedRow key={item.id} text={item.text}
        meta="Saved from Notice & Name · private on this device"
        onPress={() => router.push({ pathname: '/saved-wording', params: { id: item.id } })}
        onRemove={() => confirmRemove('savedWordings', item.id, 'Remove saved wording?')} />)}
    </SavedGroup>}
    {!!library.messageDrafts.length && <SavedGroup title="Message drafts">
      {library.messageDrafts.map((item) => <SavedRow key={item.id} title="Reach Out draft" text={item.message}
        onPress={() => router.push({ pathname: '/saved-reach-out', params: { id: item.id } })}
        onRemove={() => confirmRemove('messageDrafts', item.id, 'Remove message draft?')} />)}
    </SavedGroup>}
  </>;
}

const styles = StyleSheet.create({
  group: { gap: 10 },
  savedRow: { borderBottomWidth: StyleSheet.hairlineWidth, paddingTop: 6, paddingBottom: 8 },
  savedOpen: { gap: 6, paddingVertical: 6, minHeight: 48 },
  continueItem: { gap: 9, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  continueActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grow: { flexGrow: 1, flexBasis: 130 },
  remove: { alignSelf: 'flex-start' },
});
