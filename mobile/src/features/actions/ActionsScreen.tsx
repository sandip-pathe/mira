import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { getDemoSession, request } from '../../shared/api';
import {
  ContinueItem,
  Intervention,
  loadContinueItems,
  rememberIntervention,
  removeContinueItem,
} from '../../shared/interventions';
import { ActionButton, Eyebrow, Surface, colors, ui } from '../../components/ui';

const groups: { title: string; ids: string[] }[] = [
  { title: 'Right now', ids: ['pause_60s', 'grounding', 'name_a_feeling'] },
  { title: 'Move forward', ids: ['task_reset_60s', 'brain_dump', 'tiny_next_step', 'reach_out'] },
  { title: 'Reset / wind down', ids: ['short_movement', 'sleep_wind_down'] },
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
          .filter((item): item is Intervention => !!item),
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
          paddingTop: 18,
          paddingBottom: 28,
          gap: 20,
          maxWidth: 660,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <View style={{ gap: 5 }}>
          <Eyebrow>ACTIVITIES</Eyebrow>
          <Text style={ui.title}>Activities</Text>
          <Text style={ui.muted}>Choose one small thing to try.</Text>
        </View>
        {!!items.length && (
          <View style={{ gap: 10 }}>
            <Text style={ui.heading}>Continue</Text>
            {items.map((item) => (
              <Surface key={item.id} style={{ gap: 9 }}>
                <Text style={ui.label}>{item.title}</Text>
                <Text style={ui.body}>{item.content}</Text>
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
          {groups.map((group) => (
            <View key={group.title} style={{ gap: 9 }}>
              <Text style={ui.label}>{group.title}</Text>
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
                    <Surface style={{ gap: 4, opacity: intervention ? 1 : 0.65 }}>
                      <Text style={ui.label}>{intervention?.title ?? id.replaceAll('_', ' ')}</Text>
                      <Text style={ui.muted}>
                        {intervention?.summary ?? 'Activity details load when Mira is online.'}
                      </Text>
                      {intervention && (
                        <Text style={{ color: colors.accent, fontSize: 14, fontWeight: '600' }}>
                          View activity
                        </Text>
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
