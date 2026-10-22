import React from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { ActivityFrame } from '../../runtime/ActivityFrame';
import type { ActivityExperienceProps } from '../../runtime/contracts';
import { MoveSceneArtwork } from '../../art/MoveSceneArtwork';
import { ActivityPreferencePrompt } from '../../components/ActivityPreferencePrompt';
import { useMoveSceneExperience } from './useMoveSceneExperience';
import { useMoveSceneCues } from './useMoveSceneCues';
import { MoveSceneChoices, MoveScenePreparation } from './MoveSceneSetup';
import { styles } from './moveSceneStyles';

export function MoveSceneScreen({ origin, onBack }: ActivityExperienceProps) {
  const { colors, typography } = useTheme();
  const x = useMoveSceneExperience(origin);
  useMoveSceneCues(x.phase, x.preferences.audioCue);
  const scroll = React.useRef<ScrollView>(null);
  React.useEffect(() => { Keyboard.dismiss(); scroll.current?.scrollTo({ y: 0, animated: false }); }, [x.phase]);

  function leave() {
    if (x.phase === 'away') Alert.alert('End this break?', 'You can stop here and go back.', [
      { text: 'Keep break open', style: 'cancel' }, { text: 'End and leave', style: 'destructive', onPress: () => { x.stop(); onBack(); } },
    ]);
    else { if (x.run?.state === 'started') x.stop(); onBack(); }
  }
  const scene = x.phase === 'away' ? 'away' : x.phase === 'returned' || x.phase === 'done' ? 'returned' : x.phase === 'prepare' ? 'prepare' : x.phase === 'choose' ? 'choice' : 'intro';
  const backButton = <ActionButton label="Back" variant="quiet" onPress={leave} />;
  return <ActivityFrame><KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
    <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {x.phase === 'loading' && <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>Opening a small change of scene…</Text>
      </View>}
      {x.phase === 'intro' && <>
        <Eyebrow>TAKE A BREAK, IF YOU WANT</Eyebrow>
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>A little change of scene?</Text>
        <MoveSceneArtwork scene={scene} />
        <Text style={[typography.support, { color: colors.muted }]}>Choose a comfortable change of scene or movement. Moving is optional, and you can stop whenever you want.</Text>
        {!!x.status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{x.status}</Text>}
        <View style={styles.spacer} />
        <ActionButton label="Choose a break" onPress={() => x.moveTo('choose')} />{backButton}
      </>}
      {x.phase === 'choose' && <>
        <Eyebrow>CHOOSE WHAT FITS</Eyebrow><MoveSceneArtwork scene={scene} />
        <MoveSceneChoices experience={x} />{backButton}
      </>}
      {x.phase === 'prepare' && <>
        <Eyebrow>YOUR BREAK</Eyebrow><MoveSceneArtwork scene={scene} />
        <MoveScenePreparation experience={x} />{backButton}
      </>}
      {x.phase === 'away' && <>
        <Eyebrow>YOUR TIME</Eyebrow><MoveSceneArtwork scene={scene} />
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>The screen can wait.</Text>
        <Text style={[typography.body, { color: colors.ink }]}>Put your phone aside and take the break you chose. Come back whenever you want.</Text>
        <View style={styles.spacer} /><ActionButton label="I’m back" onPress={x.returnFromAway} />
        <ActionButton label="Stop and leave" variant="quiet" onPress={leave} />
      </>}
      {x.phase === 'returned' && <>
        <Eyebrow>WELCOME BACK</Eyebrow><MoveSceneArtwork scene={scene} />
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>You’re back in your own time.</Text>
        {!!x.elapsed && <Text style={[typography.support, { color: colors.muted }]}>Away for {x.elapsed}. The clock is only an estimate.</Text>}
        <Text style={[typography.body, { color: colors.ink }]}>You chose: {x.title}.</Text>
        <ActionButton label="Finish" onPress={x.complete} />
        <ActionButton label="Choose another option" variant="secondary" onPress={() => x.moveTo('choose')} />{backButton}
      </>}
      {x.phase === 'done' && <>
        <Eyebrow>{x.run?.state === 'skipped' ? 'NO BREAK NEEDED' : 'TAKE A BREAK'}</Eyebrow><MoveSceneArtwork scene={scene} />
        <ActivityPreferencePrompt run={x.run} title="Move / Change Your Scene" />
        <Text accessibilityRole="header" style={[typography.screenTitle, { color: colors.ink }]}>{x.run?.state === 'skipped' ? 'You can leave it here.' : x.run?.state === 'stopped' ? 'You stopped when you wanted.' : 'A pause, at your pace.'}</Text>
        <Text style={[typography.support, { color: colors.muted }]}>{x.run?.state === 'skipped' ? 'There’s nothing to catch up on.' : 'Take what fits and leave the rest.'}</Text>
        <View style={styles.spacer} /><ActionButton label="Done" onPress={onBack} />
      </>}
    </ScrollView>
  </KeyboardAvoidingView></ActivityFrame>;
}
