import React from 'react';
import * as Linking from 'expo-linking';
import { AppState, Pressable, Text, TextInput, View } from 'react-native';
import { ActionButton, Eyebrow, colors, ui } from '../../../components/ui';
import { ActivityPanel } from './ActivityPanel';
import { stageQuietTalkReturn } from '../../../shared/musicHandoff';
import { useInterventionRun } from '../hooks/useInterventionRun';
import { AwaySessionCard } from './AwaySessionCard';
import { ValidatedMusicLink, validateMusicLink } from '../musicLink';

type RunState = ReturnType<typeof useInterventionRun>;
type Stage = 'intro' | 'source' | 'handoff' | 'away' | 'returned';
type Report = 'completed' | 'stopped' | 'skipped';

export function OneSongPanel({
  run,
  origin,
  onBack,
}: {
  run: RunState;
  origin: string;
  onBack: () => void;
}) {
  const active = run.activeId === 'one_song_break';
  const [stageState, setStageState] = React.useState<Stage>('intro');
  const [source, setSource] = React.useState<'manual' | 'link'>('manual');
  const [linkText, setLinkText] = React.useState('');
  const [openError, setOpenError] = React.useState('');
  const [startRequested, setStartRequested] = React.useState(false);
  const stageRef = React.useRef<Stage>('intro');
  const appStateRef = React.useRef(AppState.currentState);
  const destination = origin === 'talk' ? 'Talk' : 'Actions';
  const validatedLink = validateMusicLink(linkText);

  function moveTo(next: Stage) {
    stageRef.current = next;
    setStageState(next);
  }

  React.useEffect(() => {
    if (!active) return;
    const subscription = AppState.addEventListener('change', (next) => {
      const previous = appStateRef.current;
      appStateRef.current = next;
      if (next === 'active' && previous !== 'active' && stageRef.current === 'away') {
        stageRef.current = 'returned';
        setStageState('returned');
      }
    });
    return () => subscription.remove();
  }, [active]);

  if (!active || !['ready', 'active'].includes(run.phase)) return null;

  function start() {
    setStartRequested(true);
    moveTo('source');
    void run.startActivity();
  }

  function stageQuietReturn() {
    if (origin === 'talk') stageQuietTalkReturn();
  }

  function startManualHandoff() {
    stageQuietReturn();
    setOpenError('');
    moveTo('away');
  }

  async function openMusic(link: ValidatedMusicLink) {
    stageQuietReturn();
    setOpenError('');
    moveTo('away');
    try {
      await Linking.openURL(link.url);
    } catch {
      setOpenError('This link could not be opened. You can switch apps and choose the song yourself.');
      if (stageRef.current === 'away') moveTo('handoff');
    }
  }

  async function report(next: Report) {
    await run.finishRun(next);
    onBack();
  }

  if (run.phase === 'ready') return (
    <ActivityPanel style={{ gap: 13 }}>
      <RecordHeadphonesIllustration />
      <Eyebrow>A BREAK WITH YOUR MUSIC</Eyebrow>
      <Text style={ui.heading}>Give yourself one song.</Text>
      <Text style={ui.muted}>Choose your music. Mira cannot tell whether it plays.</Text>
      <ActionButton label="Start" loading={run.busy} onPress={start} />
      {startRequested && run.phase === 'ready' && !!run.status && <Text accessibilityLiveRegion="polite" style={ui.muted}>{run.status}</Text>}
      <ActionButton label={`Back to ${destination}`} variant="quiet" onPress={onBack} />
    </ActivityPanel>
  );

  if (stageState === 'source') return (
    <ActivityPanel style={{ gap: 13 }}>
      <Eyebrow>CHOOSE YOUR MUSIC SOURCE</Eyebrow>
      <Text style={ui.heading}>Where would you like to listen?</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="I will choose in my music app"
        onPress={() => { setSource('manual'); moveTo('handoff'); }}
        style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: 14, minHeight: 62, justifyContent: 'center' }}
      >
        <Text style={ui.label}>I will choose in my music app</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Use a music link"
        accessibilityState={{ selected: source === 'link' }}
        onPress={() => setSource('link')}
        style={{ borderWidth: 1, borderColor: source === 'link' ? colors.accent : colors.line, backgroundColor: source === 'link' ? colors.accentSoft : colors.surface, borderRadius: 16, padding: 14, minHeight: 62, justifyContent: 'center' }}
      >
        <Text style={ui.label}>Use a music link (optional)</Text>
      </Pressable>
      {source === 'link' && (
        <>
          <Text style={ui.muted}>HTTPS links from Spotify, YouTube Music, Apple Music, or SoundCloud are supported. Nothing is saved.</Text>
          <TextInput
            accessibilityLabel="Music link"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            value={linkText}
            onChangeText={setLinkText}
            maxLength={1500}
            placeholder="Paste a music link"
            style={ui.input}
          />
          {!!linkText.trim() && !validatedLink && <Text accessibilityLiveRegion="polite" style={{ color: '#8A3E35', fontSize: 15 }}>Enter an HTTPS link from an allowed music domain.</Text>}
          <ActionButton label="Continue with this link" disabled={!validatedLink} onPress={() => moveTo('handoff')} />
        </>
      )}
      <ActionButton label={`Back to ${destination}`} variant="quiet" onPress={onBack} />
    </ActivityPanel>
  );

  if (stageState === 'handoff') return (
    <ActivityPanel style={{ gap: 13 }}>
      <Eyebrow>READY WHEN YOU ARE</Eyebrow>
      <Text style={ui.heading}>{source === 'manual' ? 'Choose a song in your music app.' : 'Open your music link.'}</Text>
      {source === 'manual' ? (
        <Text style={ui.muted}>Mira will not choose a player or start audio for you.</Text>
      ) : validatedLink ? (
        <>
          <View accessibilityRole="text" accessibilityLabel={`Destination domain: ${validatedLink.domain}`} style={{ alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 }}>
            <Text style={ui.label}>{validatedLink.domain}</Text>
          </View>
          <Text style={ui.muted}>Mira cannot tell whether the link opens or playback starts.</Text>
        </>
      ) : null}
      {!!openError && <Text accessibilityLiveRegion="polite" style={{ color: '#8A3E35', fontSize: 15 }}>{openError}</Text>}
      {source === 'link' && validatedLink && (
        <ActionButton label="Open music" onPress={() => void openMusic(validatedLink)} />
      )}
      <ActionButton
        label={source === 'manual' ? 'Ready - I will switch apps' : 'Switch apps manually'}
        variant={source === 'manual' ? 'primary' : 'secondary'}
        onPress={startManualHandoff}
      />
      <ActionButton label="Choose another source" variant="quiet" onPress={() => moveTo('source')} />
      <ActionButton label={`Back to ${destination}`} variant="quiet" onPress={onBack} />
    </ActivityPanel>
  );

  if (stageState === 'away') return (
    <View style={{ gap: 12 }}>
      <AwaySessionCard
        artwork="record"
        headline="Listen to your song. Come back if you want."
        detail="There is no playback timer here."
      />
      <ActionButton label="I'm back" onPress={() => moveTo('returned')} />
    </View>
  );

  return (
    <ActivityPanel style={{ gap: 13 }}>
      <Eyebrow>WELCOME BACK</Eyebrow>
      <Text style={ui.heading}>What would you like to report?</Text>
      <ActionButton label="Listened" loading={run.busy} onPress={() => void report('completed')} />
      <ActionButton label="Stopped early" variant="secondary" loading={run.busy} onPress={() => void report('stopped')} />
      <ActionButton label="Skip" variant="quiet" loading={run.busy} onPress={() => void report('skipped')} />
    </ActivityPanel>
  );
}

function RecordHeadphonesIllustration() {
  return (
    <View accessibilityElementsHidden style={{ height: 132, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <View style={{ width: 82, height: 82, borderRadius: 41, borderWidth: 2, borderColor: '#536B60', backgroundColor: '#344D45', alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 54, height: 54, borderRadius: 27, borderWidth: 1, borderColor: '#829487', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#D7B77A', alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#344D45' }} />
          </View>
        </View>
      </View>
      <View style={{ width: 52, height: 68, borderWidth: 5, borderColor: '#829487', borderBottomColor: 'transparent', borderTopLeftRadius: 28, borderTopRightRadius: 28, alignItems: 'center', justifyContent: 'space-between', paddingTop: 4, paddingBottom: 0 }}>
        <View style={{ width: 10, height: 22, borderRadius: 6, backgroundColor: '#D7B77A', alignSelf: 'flex-start', marginLeft: -6 }} />
        <View style={{ width: 10, height: 22, borderRadius: 6, backgroundColor: '#D7B77A', alignSelf: 'flex-end', marginRight: -6 }} />
      </View>
    </View>
  );
}
