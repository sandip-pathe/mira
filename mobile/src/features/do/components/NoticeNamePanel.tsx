import React from 'react';
import { Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { ActionButton, Eyebrow, Surface, colors, ui } from '../../../components/ui';
import { ActivityPanel } from './ActivityPanel';
import { useInterventionRun } from '../hooks/useInterventionRun';
import { ExcerptHandoff } from './ExcerptHandoff';

const words = [
  { id: 'worried', label: 'Worried', definition: 'Your mind keeps circling around what might go wrong or what comes next.', nearby: 'Uneasy · Tense · On edge' },
  { id: 'disappointed', label: 'Disappointed', definition: "Something you hoped for, expected, or needed didn't happen the way you wanted.", nearby: 'Let down · Deflated · Discouraged' },
  { id: 'angry', label: 'Angry', definition: 'Something feels unfair, crossed a line, or blocked what matters to you.', nearby: 'Frustrated · Irritated · Resentful' },
  { id: 'lonely', label: 'Lonely', definition: "You want connection, understanding, or company that doesn't feel reachable right now.", nearby: 'Left out · Disconnected · Unseen' },
  { id: 'overwhelmed', label: 'Overwhelmed', definition: 'It feels like there is more to deal with than you can manage right now.', nearby: 'Flooded · Stretched thin · Frazzled' },
  { id: 'numb', label: 'Numb', definition: "It's hard to feel much of anything, like your emotions are muted or far away.", nearby: 'Flat · Drained · Shut down' },
  { id: 'okay', label: 'Okay', definition: 'Things feel steady enough right now, neither strongly pulled down nor keyed up.', nearby: 'Settled · Calm · Manageable' },
  { id: 'excited', label: 'Excited', definition: 'You feel energized and looking forward to something ahead.', nearby: 'Hopeful · Eager · Energized' },
  { id: 'mixed', label: 'Mixed', definition: 'Two or more different feelings are showing up at the same time.', nearby: 'Torn · Conflicted · Bittersweet' },
  { id: 'not_sure', label: 'Not sure', definition: 'Nothing on the list quite fits yet, and that is a valid place to pause.', nearby: 'Hard to name · Still sorting it out' },
] as const;
type WordId = (typeof words)[number]['id'] | `custom:${string}`;
type BranchStage = 'situation' | 'interpretation' | 'supports' | 'unknown' | 'alternative' | 'own' | 'review';
type RunState = ReturnType<typeof useInterventionRun>;

function phraseFor(selected: WordId[]) {
  const labels = selected.map((value) => value.startsWith('custom:') ? value.slice(7) : words.find((word) => word.id === value)?.label).filter(Boolean);
  return labels.length ? `Right now, I feel ${labels.join(', ')}.` : 'Right now, I feel';
}

export function NoticeNameIllustration() {
  const shapes = [
    { left: '12%', top: 18, text: 'Worried', rotate: '-8deg' },
    { left: '48%', top: 32, text: 'Mixed', rotate: '5deg' },
    { left: '26%', top: 73, text: 'Okay', rotate: '3deg' },
    { left: '62%', top: 88, text: 'Unsure', rotate: '-4deg' },
  ];
  return (
    <View accessibilityElementsHidden style={{ height: 144, borderRadius: 22, backgroundColor: '#F1F3EC', overflow: 'hidden', justifyContent: 'center' }}>
      {shapes.map((shape) => <View key={shape.text} style={{ position: 'absolute', left: shape.left as `${number}%`, top: shape.top, borderRadius: 18, borderWidth: 1, borderColor: '#B8C8B8', backgroundColor: '#FFFEFB', paddingHorizontal: 14, paddingVertical: 8, transform: [{ rotate: shape.rotate }] }}><Text style={{ color: colors.ink, fontSize: 15 }}>{shape.text}</Text></View>)}
    </View>
  );
}

export function NoticeNamePanel({ run, onTalkTransfer, onBack, origin }: { run: RunState; onTalkTransfer: (text: string) => boolean; onBack: () => void; origin: string }) {
  const [stage, setStage] = React.useState<'words' | 'phrase' | BranchStage>('words');
  const [selected, setSelected] = React.useState<WordId[]>([]);
  const [customInput, setCustomInput] = React.useState('');
  const [definitionId, setDefinitionId] = React.useState<string>();
  const [phraseEdited, setPhraseEdited] = React.useState(false);
  const [branchSituation, setBranchSituation] = React.useState('');
  const [branchInterpretation, setBranchInterpretation] = React.useState('');
  const [branchSupports, setBranchSupports] = React.useState('');
  const [branchUnknown, setBranchUnknown] = React.useState('');
  const [branchAlternative, setBranchAlternative] = React.useState('');
  const [branchOwn, setBranchOwn] = React.useState('');
  if (run.phase !== 'active' || run.activeId !== 'name_a_feeling') return null;

  const currentDefinition = words.find((word) => word.id === definitionId);
  const returnLabel = origin === 'talk' ? 'Talk' : 'Actions';
  const generatedPhrase = phraseFor(selected);
  const chooseWord = (id: WordId) => {
    const next = selected.includes(id) ? selected.filter((word) => word !== id) : [...selected, id];
    setSelected(next);
    if (phraseEdited) {
      Alert.alert('Update your sentence?', 'Your sentence has been edited. Update it to reflect the words you selected?', [
        { text: 'Keep my sentence', style: 'cancel' },
        { text: 'Update sentence', onPress: () => { run.setDraft(phraseFor(next)); setPhraseEdited(false); } },
      ]);
    } else run.setDraft(phraseFor(next));
  };
  const addCustom = () => {
    const value = customInput.trim();
    if (!value) return;
    const id = `custom:${value}` as WordId;
    if (!selected.includes(id)) chooseWord(id);
    setCustomInput('');
  };
  const branchSummary = [
    branchSituation.trim() ? `What happened: ${branchSituation.trim()}` : '',
    branchInterpretation.trim() ? `My interpretation: ${branchInterpretation.trim()}` : '',
    branchSupports.trim() ? `What supports that reading: ${branchSupports.trim()}` : '',
    branchUnknown.trim() ? `What is still unknown: ${branchUnknown.trim()}` : '',
    branchAlternative.trim() ? `Another plausible explanation: ${branchAlternative.trim()}` : '',
    `My current wording: ${branchOwn.trim() || branchInterpretation.trim() || 'I have not changed my wording.'}`,
  ].filter(Boolean).join('\n\n');
  const stepNext: Record<Exclude<BranchStage, 'review'>, BranchStage> = {
    situation: 'interpretation', interpretation: 'supports', supports: 'unknown',
    unknown: 'alternative', alternative: 'own', own: 'review',
  };

  if (stage === 'words') return (
    <ActivityPanel style={{ gap: 13 }}>
      <NoticeNameIllustration />
      <Eyebrow>NOTICE & NAME</Eyebrow>
      <Text style={ui.heading}>What comes closest to this moment?</Text>
      <Text style={ui.muted}>Choose one or more words. You can also use your own words or leave it uncertain.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {words.map((word) => {
          const checked = selected.includes(word.id);
          return <View key={word.id} style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 18, borderWidth: 1.5, borderColor: checked ? colors.accent : colors.line, backgroundColor: '#FFFEFB' }}>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={`${word.label}${checked ? ', selected' : ''}`} onPress={() => chooseWord(word.id)} style={{ minHeight: 48, justifyContent: 'center', paddingLeft: 13, paddingRight: 7 }}>
              <Text style={{ color: colors.ink, fontSize: 16, fontWeight: checked ? '700' : '500' }}>{checked ? '✓ ' : ''}{word.label}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel={`About ${word.label}`} onPress={() => setDefinitionId(word.id)} style={{ minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: colors.accent, fontSize: 18, fontWeight: '700' }}>ⓘ</Text>
            </Pressable>
          </View>;
        })}
        {selected.filter((value) => value.startsWith('custom:')).map((value) => {
          const label = value.slice(7); const checked = true;
          return <Pressable key={value} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => chooseWord(value)} style={{ minHeight: 48, borderRadius: 18, borderWidth: 1.5, borderColor: colors.accent, backgroundColor: '#FFFEFB', paddingHorizontal: 14, justifyContent: 'center' }}><Text style={{ color: colors.ink, fontSize: 16, fontWeight: '700' }}>✓ {label}</Text></Pressable>;
        })}
      </View>
      <Text style={ui.label}>My own words (English, Hinglish, or mixed)</Text>
      <TextInput accessibilityLabel="Add your own feeling word" value={customInput} onChangeText={setCustomInput} placeholder="Type a word or phrase" style={ui.input} onSubmitEditing={addCustom} />
      <ActionButton label="Add my words" variant="secondary" disabled={!customInput.trim()} onPress={addCustom} />
      <ActionButton label="Continue" disabled={!selected.length} onPress={() => { if (!run.draft.trim() || !phraseEdited) run.setDraft(generatedPhrase); setStage('phrase'); }} />
      <ActionButton label={`Return to ${returnLabel}`} variant="quiet" onPress={onBack} />
      <Modal visible={!!currentDefinition} transparent animationType="slide" onRequestClose={() => setDefinitionId(undefined)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: '#0005' }}>
          <Surface style={{ borderTopLeftRadius: 24, borderTopRightRadius: 24, gap: 12, paddingBottom: 28 }}>
            <View accessibilityViewIsModal style={{ gap: 12 }}>
            <Eyebrow>WORD MEANING</Eyebrow>
            <Text style={ui.heading}>{currentDefinition?.label ?? 'My own words'}</Text>
            <Text style={ui.body}>{currentDefinition?.definition ?? 'This phrase is yours to define. It can be in English, Hinglish, or a mix.'}</Text>
            {!!currentDefinition && <><Text style={ui.label}>Nearby words</Text><Text style={ui.muted}>{currentDefinition.nearby}</Text></>}
            <ActionButton label="Close definition" onPress={() => setDefinitionId(undefined)} />
            </View>
          </Surface>
        </View>
      </Modal>
    </ActivityPanel>
  );

  if (stage === 'phrase') return (
    <ActivityPanel style={{ gap: 13 }}>
      <Eyebrow>YOU CHOSE</Eyebrow>
      <Text style={ui.heading}>A phrase for this moment</Text>
      <Text style={ui.muted}>{selected.map((value) => value.startsWith('custom:') ? value.slice(7) : words.find((word) => word.id === value)?.label).filter(Boolean).join(' · ')}</Text>
      <TextInput accessibilityLabel="Edit your feeling phrase" multiline value={run.draft} onChangeText={(value) => { run.setDraft(value); setPhraseEdited(true); }} style={[ui.input, { minHeight: 90 }]} />
      <TextInput accessibilityLabel="What happened? Optional context" multiline value={run.reflection} onChangeText={run.setReflection} placeholder="Want to add what happened? (Optional)" style={[ui.input, { minHeight: 76 }]} />
      <ActionButton label="Done" onPress={() => void run.finishRun('completed')} />
      <ExcerptHandoff source={run.draft} onOpenInTalk={onTalkTransfer} />
      <ActionButton label="Edit words" variant="secondary" onPress={() => setStage('words')} />
      <ActionButton label="Check a thought" variant="quiet" onPress={() => setStage('situation')} />
    </ActivityPanel>
  );

  if (stage === 'review') return (
    <ActivityPanel style={{ gap: 13 }}>
      <Eyebrow>CHECK A THOUGHT · REVIEW</Eyebrow>
      <Text style={ui.heading}>Your wording</Text>
      <Text style={ui.label}>What happened</Text><Text style={ui.body}>{branchSituation.trim() || 'Skipped'}</Text>
      <Text style={ui.label}>My interpretation</Text><Text style={ui.body}>{branchInterpretation.trim() || 'Skipped'}</Text>
      {!!branchSupports.trim() && <><Text style={ui.label}>What supports that reading</Text><Text style={ui.body}>{branchSupports}</Text></>}
      {!!branchUnknown.trim() && <><Text style={ui.label}>What is still unknown</Text><Text style={ui.body}>{branchUnknown}</Text></>}
      {!!branchAlternative.trim() && <><Text style={ui.label}>Another plausible explanation</Text><Text style={ui.body}>{branchAlternative}</Text></>}
      <Text style={ui.label}>My current wording</Text><Text style={ui.body}>{branchOwn.trim() || branchInterpretation.trim() || 'I have not changed my wording.'}</Text>
      <ActionButton label="Done" onPress={() => void run.finishRun('completed')} />
      <ExcerptHandoff source={branchSummary} onOpenInTalk={onTalkTransfer} />
      <ActionButton label="Edit" variant="secondary" onPress={() => Alert.alert('Edit your reflection', 'Choose what you want to revisit.', [
        { text: 'Situation', onPress: () => setStage('situation') },
        { text: 'Interpretation', onPress: () => setStage('interpretation') },
        { text: 'Current wording', onPress: () => setStage('own') },
        { text: 'Cancel', style: 'cancel' },
      ])} />
      <ActionButton label="Return to feeling phrase" variant="quiet" onPress={() => setStage('phrase')} />
    </ActivityPanel>
  );

  const branchFields: Record<Exclude<BranchStage, 'review'>, { prompt: string; placeholder: string; value: string; set: (value: string) => void }> = {
    situation: { prompt: 'What happened? (Optional)', placeholder: 'Describe the situation, if you want', value: branchSituation, set: setBranchSituation },
    interpretation: { prompt: 'What is your mind telling you this means? (Optional)', placeholder: 'Your interpretation, not a fact Mira has detected', value: branchInterpretation, set: setBranchInterpretation },
    supports: { prompt: 'What supports that reading? (Optional)', placeholder: 'You can leave this blank', value: branchSupports, set: setBranchSupports },
    unknown: { prompt: 'What is still unknown? (Optional)', placeholder: 'Anything you do not know yet', value: branchUnknown, set: setBranchUnknown },
    alternative: { prompt: 'Is there another plausible explanation? (Optional)', placeholder: 'No need to find a positive spin', value: branchAlternative, set: setBranchAlternative },
    own: { prompt: 'What feels like a fairer way to put it, if anything? (Optional)', placeholder: 'You can keep your original interpretation unchanged', value: branchOwn, set: setBranchOwn },
  };
  const field = branchFields[stage as Exclude<BranchStage, 'review'>];
  const next = stepNext[stage as Exclude<BranchStage, 'review'>];
  return (
    <ActivityPanel style={{ gap: 13 }}>
      <Eyebrow>CHECK A THOUGHT · OPTIONAL</Eyebrow>
      <Text style={ui.heading}>{field.prompt}</Text>
      {stage === 'interpretation' && <Text style={ui.muted}>This is your interpretation, not a distortion label or something Mira detected.</Text>}
      {stage === 'own' && <Text style={ui.muted}>It is fine to leave this unchanged.</Text>}
      <TextInput accessibilityLabel={field.prompt} maxLength={2000} multiline value={field.value} onChangeText={field.set} placeholder={field.placeholder} style={[ui.input, { minHeight: 112 }]} />
      <ActionButton label={stage === 'own' ? 'Review' : 'Continue'} onPress={() => setStage(next)} />
      <ActionButton label="Skip this" variant="secondary" onPress={() => setStage(next)} />
      <ActionButton label="Return to feeling phrase" variant="quiet" onPress={() => setStage('phrase')} />
    </ActivityPanel>
  );
}
