import React from 'react';
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { router } from 'expo-router';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { ActivityFrame } from '../../runtime/ActivityFrame';
import type { ActivityExperienceProps } from '../../runtime/contracts';
import { ReachOutArtwork } from '../../art/ReachOutArtwork';
import { ActivityBackButton } from '../../components/ActivityBackButton';
import { reachOutIntents } from './reachOutToneVariants';
import { useReachOutExperience } from './useReachOutExperience';
import { ReachOutEditor } from './ReachOutEditor';
import { ReachOutPreview } from './ReachOutPreview';
import { styles } from './reachOutStyles';

export function ReachOutScreen({ origin, contextId, draftId, onBack }: ActivityExperienceProps) {
  const { colors, typography } = useTheme();
  const x = useReachOutExperience({ origin, contextId, draftId });
  const scroll = React.useRef<ScrollView>(null);
  React.useEffect(() => { Keyboard.dismiss(); scroll.current?.scrollTo({ y: 0, animated: false }); }, [x.screen]);
  function home() { x.cancelRewrite(); x.setScreen('home'); }
  function leave() { x.cancelRewrite(); onBack(); }
  return <ActivityFrame><KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {x.screen === 'loading' && <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>Opening your drafts…</Text>
      </View>}
      {x.screen === 'home' && <>
        <Eyebrow>MOVE FORWARD · REACH OUT</Eyebrow>
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>A small message can open a door.</Text>
        <ReachOutArtwork />
        <Text style={[typography.support, { color: colors.muted }]}>Shape a message in your own words. It stays here until you choose to share it.</Text>
        <ActionButton label="Write a message" onPress={() => x.setScreen('intent')} />
        {!!x.savedDrafts.length && <>
          <Text accessibilityRole="header" style={[typography.groupHeading, { color: colors.ink }]}>Saved drafts</Text>
          {x.savedDrafts.map((item) => <Pressable key={item.id} accessibilityRole="button"
            onPress={() => router.push({ pathname: '/saved-reach-out', params: { id: item.id } })}
            style={({ pressed }) => [styles.row, styles.draftRow, { borderColor: colors.line, opacity: pressed ? 0.65 : 1 }]}>
            <View style={styles.rowText}>
              <Text style={[typography.recentTitle, { color: colors.ink }]} numberOfLines={2}>{item.message}</Text>
              <Text style={[typography.support, { color: colors.muted }]}>Saved {new Date(item.updatedAt).toLocaleDateString()}</Text>
            </View>
            <MaterialDesignIcons name="arrow-top-right" size={19} color={colors.primary} />
          </Pressable>)}
        </>}
        {!!x.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{x.status}</Text>}
        <View style={styles.spacer} /><ActionButton label="Back" variant="quiet" onPress={leave} />
      </>}
      {x.screen === 'intent' && <>
        <ActivityBackButton label="Reach Out" onPress={home} />
        <Eyebrow>REACH OUT</Eyebrow>
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>What would feel helpful to ask for?</Text>
        {reachOutIntents.map((item) => <Pressable key={item.id} accessibilityRole="button" onPress={() => x.startIntent(item.id)}
          style={({ pressed }) => [styles.row, { borderColor: colors.line, opacity: pressed ? 0.65 : 1 }]}>
          <Text style={[typography.activityTitle, { color: colors.ink, flex: 1 }]}>{item.label}</Text>
          <MaterialDesignIcons name="chevron-right" size={20} color={colors.primary} />
        </Pressable>)}
      </>}
      {x.screen === 'editor' && <ReachOutEditor experience={x} onHome={home} />}
      {x.screen === 'preview' && <ReachOutPreview experience={x} onBack={leave} />}
    </ScrollView>
  </KeyboardAvoidingView></ActivityFrame>;
}
