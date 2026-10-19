import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { getDemoSession, request } from '../../shared/api';
import {
  ContinueItem,
  Intervention,
  loadContinueItems,
  rememberIntervention,
  removeContinueItem,
} from '../../shared/interventions';
import { ActionButton, Eyebrow, HelpButton, Surface, colors, ui } from '../../components/ui';
import { isCompatibleActivity, RegisteredActivityId } from '../../shared/activityRegistry';
import { emitUrgentHelp } from '../../shared/demoEvents';

const groups: { title: string; ids: RegisteredActivityId[] }[] = [
  { title: 'Express', ids: ['brain_dump', 'unsent_letter', 'name_a_feeling'] },
  { title: 'Move forward', ids: ['one_small_step', 'reach_out'] },
  { title: 'Take a break', ids: ['short_movement', 'one_song_break'] },
  { title: 'Follow a guide', ids: ['grounding', 'paced_breathing'] },
];

export default function ActionsScreen() {
  const [catalog, setCatalog] = React.useState<Intervention[]>([]);
  const [items, setItems] = React.useState<ContinueItem[]>([]);
  const [status, setStatus] = React.useState('Loading activities…');

  const refresh = React.useCallback(async () => {
    try {
      setItems(await loadContinueItems());
    } catch {
      setStatus('Saved items could not be loaded on this device.');
    }
    try {
      const session = await getDemoSession();
      const result = await request<{ actions: Intervention[] }>(
        `/sessions/${session.session_id}/actions`,
        session,
      );
      const ordered = groups.flatMap((group) =>
        group.ids
          .map((id) => result.actions.find((item) => item.id === id))
          .filter((item): item is Intervention => !!item && isCompatibleActivity(item)),
      );
      ordered.forEach(rememberIntervention);
      setCatalog(ordered);
      setStatus(
        ordered.length === 9
          ? ''
          : 'Some activities could not be loaded. Connect to Mira and try again.',
      );
    } catch {
      setStatus('Mira is temporarily offline. Connect to load the activity list.');
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  function open(id: string, origin: 'actions_library' | 'actions_continue', itemId?: string) {
    router.push({ pathname: '/do', params: { id, origin, ...(itemId ? { itemId } : {}) } });
  }

  function showHelp() {
    Alert.alert('Help', 'Choose a support route or urgent help.', [
      {
        text: 'Support route',
        onPress: () =>
          Alert.alert(
            'Support route',
            'This prototype is not connected to Mpower support. Ask the Mpower team which route belongs here.',
          ),
      },
      {
        text: 'Urgent help now',
        onPress: () => {
          emitUrgentHelp();
          router.push('/(tabs)/index');
        },
      },
      { text: 'Close', style: 'cancel' },
    ]);
  }

  function confirmRemove(item: ContinueItem) {
    Alert.alert('Remove from Continue?', 'This removes the item saved on this device.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          void removeContinueItem(item.id)
            .then(() => setItems((current) => current.filter((value) => value.id !== item.id)))
            .catch(() => setStatus('This item could not be removed. Try again.')),
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 22,
          paddingBottom: 28,
          gap: 20,
          maxWidth: 660,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <View style={{ gap: 5 }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <Text
              style={{
                fontSize: 32,
                lineHeight: 42,
                fontWeight: '700',
                color: '#0474f3',
                letterSpacing: -1.2,
              }}
            >
              Activities
            </Text>
            <HelpButton onPress={showHelp} />
          </View>
        </View>
        {!!items.length && (
          <View style={{ gap: 10 }}>
            <Text style={ui.heading}>Continue</Text>
            {items.map((item) => (
              <Surface key={item.id} style={{ gap: 9 }}>
                <Text style={ui.label}>{item.title}</Text>
                {!!item.source_task && <Text style={ui.muted}>Task: {item.source_task}</Text>}
                <Text style={ui.body}>{item.content}</Text>
                {!!item.cue && <Text style={ui.muted}>When: {item.cue}</Text>}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <ActionButton
                    label="Continue"
                    onPress={() => open(item.intervention_id, 'actions_continue', item.id)}
                    style={{ flex: 1 }}
                  />
                  <ActionButton
                    label="Mark done"
                    variant="secondary"
                    onPress={() =>
                      void removeContinueItem(item.id)
                        .then(() =>
                          setItems((current) => current.filter((value) => value.id !== item.id)),
                        )
                        .catch(() => setStatus('This item could not be updated. Try again.'))
                    }
                    style={{ flex: 1 }}
                  />
                </View>
                <ActionButton label="Remove" variant="quiet" onPress={() => confirmRemove(item)} />
              </Surface>
            ))}
          </View>
        )}
        <View style={{ gap: 14 }}>
          <Text style={ui.heading}>Choose an activity</Text>
          {groups
            .filter((group) => group.ids.some((id) => catalog.some((item) => item.id === id)))
            .map((group) => (
              <View key={group.title} style={{ gap: 9 }}>
                <Text style={ui.label}>{group.title}</Text>
                {group.title === 'Express' && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Journal. Recent entries and new entry"
                    onPress={() => router.push('/you')}
                  >
                    <Surface style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
                      <View
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 15,
                          backgroundColor: colors.accentSoft,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <MaterialDesignIcons
                          name="book-open-page-variant-outline"
                          size={22}
                          color={colors.accent}
                        />
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={ui.label}>Journal</Text>
                        <Text style={ui.muted}>Recent entries and a new entry</Text>
                      </View>
                      <MaterialDesignIcons name="chevron-right" size={22} color={colors.muted} />
                    </Surface>
                  </Pressable>
                )}
                {group.ids.map((id) => {
                  const intervention = catalog.find((item) => item.id === id);
                  return (
                    <Pressable
                      key={id}
                      accessibilityRole="button"
                      accessibilityLabel={
                        intervention ? `${intervention.title}. ${intervention.summary}` : id
                      }
                      onPress={() => intervention && open(id, 'actions_library')}
                      disabled={!intervention}
                    >
                      <Surface
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 13,
                          opacity: intervention ? 1 : 0.65,
                        }}
                      >
                        <View
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 15,
                            backgroundColor: colors.accentSoft,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <MaterialDesignIcons
                            name={
                              id === 'grounding'
                                ? 'eye-outline'
                                : id === 'brain_dump'
                                  ? 'notebook-edit-outline'
                                  : id === 'task_reset_60s' || id === 'one_small_step'
                                    ? 'checkbox-marked-circle-outline'
                                    : id === 'name_a_feeling'
                                      ? 'emoticon-outline'
                                      : id === 'write_100_words' || id === 'unsent_message'
                                        ? 'email-edit-outline'
                                        : id === 'reach_out'
                                          ? 'message-text-outline'
                                          : id === 'short_movement'
                                            ? 'walk'
                                            : id === 'one_song_break' || id === 'one_song_reset'
                                              ? 'music-note-outline'
                                              : 'account-switch-outline'
                            }
                            size={22}
                            color={colors.accent}
                          />
                        </View>
                        <View style={{ flex: 1, gap: 4 }}>
                          <Text style={ui.label}>
                            {intervention?.title ?? id.replaceAll('_', ' ')}
                          </Text>
                          <Text style={ui.muted}>
                            {intervention?.summary ?? 'Activity details load when Mira is online.'}
                          </Text>
                        </View>
                        {intervention && (
                          <MaterialDesignIcons
                            name="chevron-right"
                            size={22}
                            color={colors.muted}
                          />
                        )}
                      </Surface>
                    </Pressable>
                  );
                })}
              </View>
            ))}
        </View>
        {!!status && (
          <Text accessibilityLiveRegion="polite" style={ui.muted}>
            {status}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
