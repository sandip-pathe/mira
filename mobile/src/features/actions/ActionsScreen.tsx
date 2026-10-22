import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ActionButton, HelpButton, ThemePickerButton, useTheme } from '../../components/ui';
import { BrandArtwork } from '../../components/ui/BrandArtwork';
import { emitUrgentHelp } from '../../shared/demoEvents';
import { activityGroups, getBundledActivities } from '../activities/data/catalog';
import { canonicalActivityId, type RegisteredActivityId } from '../../shared/activityRegistry';
import { rankPromotedActivities } from '../../shared/context/preferenceFeatures';
import { ActivityLibraryRow, activityIcons } from './components/ActivityLibraryRow';
import { ActivitySavedWork } from './components/ActivitySavedWork';
import { useActivityLibrary } from './hooks/useActivityLibrary';

const catalog = getBundledActivities();
const stableCatalogOrder = activityGroups.flatMap((group) => group.ids);

function showHelp() {
  Alert.alert('Help', 'Choose a support route or urgent help.', [
    {
      text: 'Support route',
      onPress: () => Alert.alert(
        'Support route',
        'This prototype is not connected to Mpower support. Ask the Mpower team which route belongs here.',
      ),
    },
    {
      text: 'Urgent help now',
      onPress: () => { emitUrgentHelp(); router.push('/(tabs)/index'); },
    },
    { text: 'Close', style: 'cancel' },
  ]);
}

export default function ActionsScreen() {
  const { colors, typography } = useTheme();
  const library = useActivityLibrary();
  const scroll = React.useRef<ScrollView>(null);
  const continueY = React.useRef(0);
  const promoted = rankPromotedActivities(library.preferences, stableCatalogOrder)
    .filter(({ activityId }) => stableCatalogOrder.some((id) => id === activityId));
  const promotedIds = new Set(promoted.map((item) => item.activityId));

  function renderActivity(id: RegisteredActivityId, preferred = false) {
    const activity = catalog.find((item) => canonicalActivityId(item.id) === id);
    if (!activity) return null;
    return <ActivityLibraryRow key={id} title={activity.title} summary={activity.summary}
      icon={activityIcons[id as keyof typeof activityIcons] ?? 'shape-outline'}
      preferred={preferred}
      onPress={() => router.push({ pathname: '/do', params: { id, origin: 'actions_library' } })} />;
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.screen, { backgroundColor: colors.canvas }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>Activities</Text>
        <View style={styles.headerActions}>
          <ThemePickerButton />
          <HelpButton onPress={showHelp} />
        </View>
      </View>
      <ScrollView ref={scroll} contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={[typography.activitiesIntro, styles.invitation, { color: colors.ink }]}>
            What sounds doable right now?
          </Text>
          <BrandArtwork part="activities" size={122} />
        </View>
        {!!library.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>
          {library.status}
        </Text>}
        {!!library.items.length && <ActionButton label={`Continue (${library.items.length}) ↓`} variant="quiet"
          onPress={() => scroll.current?.scrollTo({ y: continueY.current, animated: false })}
          style={styles.resume} />}
        {!!promoted.length && <View style={[styles.preferred, { backgroundColor: colors.soft }]}>
          <Text accessibilityRole="header" style={[typography.recentTitle, { color: colors.ink }]}>Your picks</Text>
          {promoted.map(({ activityId }) => renderActivity(activityId, true))}
        </View>}
        {activityGroups.map((group) => {
          const groupIds = group.ids.filter((id) => !promotedIds.has(id));
          if (!groupIds.length && group.title !== 'Express') return null;
          return <View key={group.title}>
            <Text accessibilityRole="header" style={[typography.groupHeading, { color: colors.ink }]}>{group.title}</Text>
            {group.title === 'Express' && <ActivityLibraryRow title="Journal"
              summary="Recent entries and a new entry" icon={activityIcons.journal}
              onPress={() => router.push('/you')} />}
            {groupIds.map((id) => renderActivity(id))}
          </View>;
        })}
        <ActivitySavedWork library={library}
          onContinueLayout={(event) => { continueY.current = event.nativeEvent.layout.y; }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    minHeight: 68, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 12, maxWidth: 660, width: '100%', alignSelf: 'center',
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  content: { paddingHorizontal: 22, paddingBottom: 28, gap: 22, maxWidth: 660, width: '100%', alignSelf: 'center' },
  intro: { minHeight: 116, flexDirection: 'row', alignItems: 'center', gap: 8 },
  invitation: { flex: 1 },
  preferred: { padding: 16, borderRadius: 20 },
  resume: { alignSelf: 'flex-start' },
});
