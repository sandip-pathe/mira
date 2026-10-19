import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { ActionButton, Eyebrow, Surface, colors, ui } from '../../../components/ui';
import { ActivityPanel } from './ActivityPanel';
import { useInterventionRun } from '../hooks/useInterventionRun';

type RunState = ReturnType<typeof useInterventionRun>;
type Intent = 'listen' | 'company' | 'practical' | 'own';
type Stage = 'intro' | 'intent' | 'editor' | 'preview';

const starters: { id: Intent; title: string; message: string }[] = [
  { id: 'listen', title: 'Someone to listen', message: 'Hey, have you got a few minutes? I could use someone to talk to.' },
  { id: 'company', title: 'Some company', message: 'Hey, are you free sometime soon? Would be good to hang out or catch up for a bit.' },
  { id: 'practical', title: 'Practical help', message: 'Hey, have you got a quick moment to help me think through something practical?' },
  { id: 'own', title: 'My own message', message: '' },
];

export function ReachOutPanel({ run, origin, onBack }: { run: RunState; origin: string; onBack: () => void }) {
  const [stage, setStage] = React.useState<Stage>('intro');
  const [intent, setIntent] = React.useState<Intent>();
  const [alias, setAlias] = React.useState('');
  const [startRequested, setStartRequested] = React.useState(false);
  const handledActiveRef = React.useRef(false);
  const active = run.intervention?.id === 'reach_out';
  const destination = origin === 'talk' ? 'Talk' : 'Actions';

  React.useEffect(() => {
    if (!active || run.phase !== 'active' || handledActiveRef.current) return;
    handledActiveRef.current = true;
    if (run.draft.trim()) {
      const timer = setTimeout(() => setStage('preview'), 0);
      return () => clearTimeout(timer);
    }
  }, [active, run.draft, run.phase]);

  if (!active || !['ready', 'active'].includes(run.phase)) return null;

  function chooseIntent(value: Intent) {
    const selected = starters.find((item) => item.id === value);
    setIntent(value);
    run.setDraft(selected?.message ?? '');
    setStage('editor');
  }

  function editMessage(value: string) {
    run.setDraft(value);
  }

  if (run.phase === 'ready') return (
    <ActivityPanel style={{ gap: 14 }}>
      <MessageIllustration />
      <Eyebrow>REACH OUT, IF YOU WANT</Eyebrow>
      <Text style={ui.heading}>Want help finding the words to contact someone?</Text>
      <Text style={ui.muted}>You choose whether to contact them. Mira will not send anything.</Text>
      <ActionButton label="Start" loading={run.busy} onPress={() => { setStartRequested(true); setStage('intent'); void run.startActivity(); }} />
      {startRequested && !!run.status && <Text accessibilityLiveRegion="polite" style={ui.muted}>{run.status}</Text>}
      <ActionButton label="Not right now" variant="quiet" onPress={onBack} />
    </ActivityPanel>
  );

  if (stage === 'intent') return (
    <ActivityPanel style={{ gap: 13 }}>
      <Eyebrow>WHAT WOULD HELP?</Eyebrow>
      <Text style={ui.heading}>What would you like to ask for?</Text>
      <Text style={ui.muted}>Choose a starting point. You can edit every word.</Text>
      {starters.map((item) => <ActionButton key={item.id} label={item.title} variant="secondary" onPress={() => chooseIntent(item.id)} />)}
      <ActionButton label="Return to where you came from" variant="quiet" onPress={onBack} />
    </ActivityPanel>
  );

  if (stage === 'editor') return (
    <ActivityPanel style={{ gap: 13 }}>
      <Eyebrow>YOUR MESSAGE</Eyebrow>
      <Text style={ui.heading}>Write it in your own words.</Text>
      <TextInput
        accessibilityLabel="Optional recipient alias"
        value={alias}
        onChangeText={setAlias}
        maxLength={60}
        placeholder="Alias or ‘I know who’ (Optional)"
        style={ui.input}
      />
      <TextInput
        accessibilityLabel="Editable message draft"
        multiline
        maxLength={2000}
        value={run.draft}
        onChangeText={editMessage}
        placeholder={intent === 'own' ? 'Write your own message' : 'Edit your message'}
        style={[ui.input, { minHeight: 150, textAlignVertical: 'top' }]}
      />
      <Text style={ui.muted}>This draft is temporary until you choose to keep it for later. Nothing is sent.</Text>
      <ActionButton label="Preview message" disabled={!run.draft.trim()} onPress={() => setStage('preview')} />
      <ActionButton label="Choose a different starting point" variant="secondary" onPress={() => setStage('intent')} />
      <ActionButton label={`Return to ${destination}`} variant="quiet" onPress={onBack} />
    </ActivityPanel>
  );

  return (
    <ActivityPanel style={{ gap: 13 }}>
      <Eyebrow>MESSAGE PREVIEW</Eyebrow>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <Text accessibilityLabel="Delivery status: not sent" style={{ color: colors.ink, fontSize: 14, fontWeight: '700', borderWidth: 1, borderColor: colors.line, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 7 }}>Not sent</Text>
      </View>
      {!!alias.trim() && <Text style={ui.muted}>For: {alias.trim()}</Text>}
      <Surface style={{ backgroundColor: '#F6F4EF', borderColor: '#D8D9CE', gap: 8 }}>
        <Text style={ui.body}>{run.draft}</Text>
      </Surface>
      <ActionButton label="Edit" variant="secondary" onPress={() => setStage('editor')} />
      <ActionButton
        label={run.continueSaved ? 'Update saved draft' : 'Keep for later'}
        variant="secondary"
        loading={run.busy}
        onPress={() => run.confirmKeepInActions(run.draft, undefined, {
          title: run.continueSaved ? 'Update this saved message?' : 'Keep this message for later?',
          message: run.continueSaved
            ? 'Update the message saved on this device in Actions > Continue? Mira will not send it.'
            : 'Save this message on this device in Actions > Continue? The recipient alias is not saved, and Mira will not send it.',
          confirmLabel: run.continueSaved ? 'Update saved draft' : 'Keep for later',
        })}
      />
      {!!run.localStatus && <Text accessibilityLiveRegion="polite" style={ui.muted}>{run.localStatus}</Text>}
      <ActionButton label="Return" variant="quiet" onPress={() => void run.finishRun('completed')} />
    </ActivityPanel>
  );
}

function MessageIllustration() {
  return (
    <View accessibilityElementsHidden style={{ height: 156, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ width: 178, minHeight: 112, borderWidth: 1.5, borderColor: '#A9B8A8', borderRadius: 18, backgroundColor: '#FFFEFB', padding: 16, gap: 10, transform: [{ rotate: '-2deg' }] }}>
        {[116, 136, 92].map((width) => <View key={width} style={{ width, height: 4, borderRadius: 2, backgroundColor: '#C9D4C7' }} />)}
        <View style={{ width: 32, height: 32, borderRadius: 16, alignSelf: 'flex-end', backgroundColor: '#E4EBE0', borderWidth: 1, borderColor: '#A9B8A8' }} />
      </View>
    </View>
  );
}
