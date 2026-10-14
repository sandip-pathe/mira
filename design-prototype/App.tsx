import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

const c = {
  canvas: '#F6F3EC', surface: '#FFFEFB', ink: '#242B25', muted: '#536257', accent: '#3F6852',
  soft: '#E8EFE8', line: '#D6D8CF', quiet: '#F0EEE7', danger: '#9A3D35', white: '#FFFFFF',
};
type Direction = 'minimal' | 'abstract' | 'character';
type Stage = 'talk' | 'do' | 'feedback' | 'you';
const directions: { id: Direction; title: string; detail: string }[] = [
  { id: 'minimal', title: 'A · Quiet canvas', detail: 'No character. Calm type and open space lead.' },
  { id: 'abstract', title: 'B · Soft presence', detail: 'A subtle abstract form gives Talk a focal point.' },
  { id: 'character', title: 'C · Small companion', detail: 'A restrained illustrated face adds warmth.' },
];

function Button({ label, onPress, primary = false, quiet = false, compact = false }: {
  label: string; onPress: () => void; primary?: boolean; quiet?: boolean; compact?: boolean;
}) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [
    styles.button, primary && styles.primaryButton, quiet && styles.quietButton,
    compact && styles.compactButton, pressed && styles.pressed,
  ]}><Text style={[styles.buttonText, primary && styles.inverseText, quiet && styles.quietText]}>{label}</Text></Pressable>;
}

function Presence({ direction }: { direction: Direction }) {
  if (direction === 'minimal') return <View style={styles.minimalMark}><Text style={styles.minimalMarkText}>m</Text></View>;
  if (direction === 'abstract') return <View style={styles.abstractHalo}><View style={styles.abstractCore}><View style={styles.abstractDot} /></View></View>;
  return <View style={styles.characterHalo}><View style={styles.hair}><View style={styles.face}><View style={styles.eyes}><View style={styles.eye} /><View style={styles.eye} /></View><View style={styles.smile} /></View></View></View>;
}

export default function App() {
  const { width } = useWindowDimensions();
  const wide = width >= 980;
  const [direction, setDirection] = useState<Direction>('minimal');
  const [stage, setStage] = useState<Stage>('talk');
  const [listening, setListening] = useState(false);
  const [offer, setOffer] = useState(false);
  const [typed, setTyped] = useState(false);
  const [rating, setRating] = useState('');
  const [notice, setNotice] = useState('');

  const resetTalk = () => { setStage('talk'); setOffer(false); setTyped(false); setListening(false); setNotice(''); };
  const sendText = () => { setTyped(false); setOffer(true); setNotice('Thinking · demo response'); };
  const finish = () => { setStage('feedback'); setOffer(false); };

  return <ScrollView contentContainerStyle={styles.page}>
    <View style={styles.pageHeader}>
      <Text style={styles.kicker}>MIRA · V0.03 UI STUDY</Text>
      <Text style={styles.pageTitle}>Talk, with three levels of presence</Text>
      <Text style={styles.pageSub}>The flow stays the same. Compare the visual directions, then try the activity offer and return to Talk.</Text>
      <View style={styles.directionRow}>{directions.map(item => <Pressable key={item.id} onPress={() => setDirection(item.id)} accessibilityRole="button" accessibilityState={{ selected: direction === item.id }} style={[styles.directionCard, direction === item.id && styles.directionSelected]}>
        <Text style={[styles.directionTitle, direction === item.id && styles.directionTitleSelected]}>{item.title}</Text>
        <Text style={styles.directionDetail}>{item.detail}</Text>
      </Pressable>)}</View>
    </View>

    <View style={[styles.workArea, wide && styles.workAreaWide]}>
      <View style={[styles.phone, wide && styles.phoneWide]}>
        <View style={styles.phoneTop}><View><Text style={styles.brand}>mira</Text><Text style={styles.demo}>AI WELLBEING DEMO</Text></View>
          <Pressable accessibilityRole="button" onPress={() => setNotice('Help · support route is a demo placeholder.')} style={styles.help}><Text style={styles.helpText}>Help</Text></Pressable></View>

        {stage === 'talk' && <>
          <View style={styles.talkArea}>
            <View style={styles.statusRow}><View style={[styles.statusDot, listening && styles.statusDotLive]} /><Text style={styles.status}>{listening ? 'Listening · recording' : notice || 'Ready · mic off'}</Text></View>
            <View style={styles.presenceSlot}><Presence direction={direction} /></View>
            <Text style={styles.headline}>{listening ? 'I’m listening.' : offer ? 'That sounds like a lot to carry.' : 'What’s going on?'}</Text>
            <Text style={styles.supporting}>{offer ? 'Would it help to get some of it out of your head?' : 'Take your time. Speak or type whenever you’re ready.'}</Text>
            {offer && <View style={styles.offerCard}>
              <Text style={styles.offerEyebrow}>ONE OPTIONAL ACTIVITY</Text><Text style={styles.offerTitle}>Clear a little space</Text>
              <Text style={styles.offerCopy}>A short brain dump · about 2 minutes</Text>
              <View style={styles.offerButtons}><Button label="Try it" primary onPress={() => { setStage('do'); setOffer(false); setNotice(''); }} /><Button label="Keep talking" onPress={() => { setOffer(false); setNotice(''); }} /></View>
            </View>}
          {typed && <View style={styles.composer}><View style={styles.textInput}><Text style={styles.inputHint}>Type what’s going on…</Text></View><Text style={styles.privacyNote}>Sample only · this prototype doesn’t collect text.</Text><View style={styles.offerButtons}><Button label="Cancel" quiet onPress={() => setTyped(false)} /><Button label="Continue" primary onPress={sendText} /></View></View>}
          </View>
          <View style={styles.controls}><Pressable accessibilityRole="button" onPress={() => { setTyped(true); setOffer(false); }} style={styles.control}><Text style={styles.controlGlyph}>⌨</Text><Text style={styles.controlLabel}>Type</Text></Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Hold to speak" onPressIn={() => { setListening(true); setNotice(''); }} onPressOut={() => { setListening(false); setOffer(true); setNotice('Thinking · demo response'); }} style={[styles.micButton, listening && styles.micLive]}><Text style={styles.micGlyph}>{listening ? '◉' : '●'}</Text><Text style={styles.micLabel}>{listening ? 'Release to send' : 'Hold to speak'}</Text></Pressable>
            <Pressable accessibilityRole="button" onPress={resetTalk} style={styles.control}><Text style={[styles.controlGlyph, styles.endGlyph]}>×</Text><Text style={styles.controlLabel}>End</Text></Pressable></View>
          <Text style={styles.footerHint}>Mic is off until you press and hold.</Text>
        </>}

        {stage === 'do' && <View style={styles.activityArea}>
          <View style={styles.doTop}><Pressable accessibilityRole="button" onPress={resetTalk}><Text style={styles.backText}>‹  Back to Talk</Text></Pressable><Text style={styles.status}>DO · OPTIONAL</Text></View>
          <Text style={styles.activityKicker}>BRAIN DUMP</Text><Text style={styles.activityTitle}>Get it out of your head.</Text>
          <Text style={styles.activityCopy}>Write a few thoughts down. You choose what to do with them.</Text>
          <View style={styles.dumpInput}><Text style={styles.inputHint}>Sample thought: “I have a few things on my mind.”</Text></View>
          <Text style={styles.privacyNote}>Sample content only. A real Brain Dump stays temporary and is not saved to Journal.</Text>
          <View style={styles.activityActions}><Button label="Stop" onPress={resetTalk} /><Button label="Done" primary onPress={finish} /></View>
        </View>}

        {stage === 'feedback' && <View style={styles.feedbackArea}>
          <Text style={styles.feedbackKicker}>BACK IN TALK</Text><Text style={styles.feedbackTitle}>Did that help?</Text>
          <Text style={styles.feedbackCopy}>Your answer stays private unless you choose to save a preference.</Text>
          <View style={styles.ratingRow}>{['Not at all', 'A little', 'Quite a bit'].map(value => <Pressable key={value} onPress={() => setRating(value)} accessibilityRole="button" accessibilityState={{ selected: rating === value }} style={[styles.rating, rating === value && styles.ratingSelected]}><Text style={[styles.ratingText, rating === value && styles.ratingTextSelected]}>{value}</Text></Pressable>)}</View>
          <Button label={rating ? 'Back to Talk' : 'Skip'} primary onPress={() => { setStage('talk'); setRating(''); setNotice(''); }} />
        </View>}

        {stage === 'you' && <View style={styles.activityArea}>
          <Text style={styles.activityKicker}>YOU · PRIVATE</Text><Text style={styles.activityTitle}>A little space for your notes.</Text>
          <Text style={styles.activityCopy}>Journal entries are private. Mira only uses an excerpt after you approve it.</Text>
          <View style={styles.dumpInput}><Text style={styles.inputHint}>Write a private note…</Text></View>
          <View style={styles.activityActions}><Button label="Talk" primary onPress={resetTalk} /></View>
        </View>}

        <View style={styles.tabs}><Pressable onPress={resetTalk} accessibilityRole="tab" accessibilityState={{ selected: stage !== 'you' }} style={styles.tab}><Text style={[styles.tabGlyph, stage !== 'you' && styles.tabActive]}>◌</Text><Text style={[styles.tabText, stage !== 'you' && styles.tabActive]}>Talk</Text></Pressable><Pressable onPress={() => { setStage('you'); setOffer(false); }} accessibilityRole="tab" accessibilityState={{ selected: stage === 'you' }} style={styles.tab}><Text style={[styles.tabGlyph, stage === 'you' && styles.tabActive]}>▤</Text><Text style={[styles.tabText, stage === 'you' && styles.tabActive]}>You</Text></Pressable></View>
      </View>

      <View style={styles.notes}>
        <Text style={styles.notesKicker}>CURRENT DIRECTION</Text><Text style={styles.notesTitle}>{directions.find(item => item.id === direction)?.title}</Text>
        <Text style={styles.notesCopy}>{directions.find(item => item.id === direction)?.detail}</Text>
        <View style={styles.rule} /><Text style={styles.notesKicker}>FLOW</Text>
        <Text style={styles.flow}>Talk → one optional offer → focused Do → outcome → Talk</Text>
        <Text style={styles.notesCopy}>Voice remains explicit push-to-talk. The mic is off by default; press and hold to speak, release to send. The mock mic does not record audio.</Text>
        <View style={styles.rule} /><Text style={styles.notesKicker}>STILL OPEN</Text>
        <Text style={styles.notesCopy}>Presence, final type and color choice, and the call canvas need user testing. This prototype makes no final design selection.</Text>
      </View>
    </View>
    <Text style={styles.disclaimer}>UI study only · No audio, service calls, or persistence. Product behavior remains governed by PRD/mira_prd.md.</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({
  page: { minHeight: '100%', backgroundColor: '#EFEEE8', paddingVertical: 28, paddingHorizontal: 22, alignItems: 'center' },
  pageHeader: { width: '100%', maxWidth: 1100, marginBottom: 22 }, kicker: { color: c.muted, fontSize: 12, letterSpacing: 1.5, fontWeight: '700' },
  pageTitle: { color: c.ink, fontSize: 34, lineHeight: 42, fontWeight: '500', marginTop: 8 }, pageSub: { color: c.muted, fontSize: 16, lineHeight: 24, maxWidth: 680, marginTop: 6 },
  directionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 }, directionCard: { width: 250, minHeight: 76, borderWidth: 1, borderColor: c.line, borderRadius: 14, backgroundColor: c.surface, padding: 12 }, directionSelected: { borderColor: c.accent, backgroundColor: c.soft },
  directionTitle: { color: c.ink, fontSize: 15, fontWeight: '700' }, directionTitleSelected: { color: c.accent }, directionDetail: { color: c.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  workArea: { width: '100%', maxWidth: 1100, alignItems: 'center', gap: 24 }, workAreaWide: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
  phone: { width: '100%', maxWidth: 390, minHeight: 760, backgroundColor: c.canvas, borderRadius: 30, borderWidth: 1, borderColor: '#D7D6CE', overflow: 'hidden', shadowColor: '#20251F', shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } }, phoneWide: { width: 390, flexShrink: 0 },
  phoneTop: { minHeight: 68, paddingHorizontal: 22, borderBottomWidth: 1, borderBottomColor: c.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.surface }, brand: { color: c.ink, fontSize: 20, fontWeight: '700', letterSpacing: 0.4 }, demo: { color: c.muted, fontSize: 9, letterSpacing: 1.2, marginTop: 1 }, help: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, helpText: { color: c.accent, fontSize: 14, fontWeight: '700' },
  talkArea: { flex: 1, minHeight: 500, paddingHorizontal: 23, paddingTop: 16, alignItems: 'center' }, statusRow: { flexDirection: 'row', gap: 7, alignItems: 'center' }, statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#839080' }, statusDotLive: { backgroundColor: c.danger }, status: { color: c.muted, fontSize: 11, letterSpacing: 0.4 }, presenceSlot: { height: 190, width: '100%', alignItems: 'center', justifyContent: 'center' },
  minimalMark: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: c.accent }, minimalMarkText: { color: c.white, fontSize: 18, fontWeight: '600' },
  abstractHalo: { width: 150, height: 150, borderRadius: 75, backgroundColor: '#E9EFE7', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DAE2D8' }, abstractCore: { width: 116, height: 116, borderRadius: 58, backgroundColor: '#C6D6C5', alignItems: 'center', justifyContent: 'center' }, abstractDot: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EEF2EA', borderWidth: 1, borderColor: '#B8CBB8' },
  characterHalo: { width: 142, height: 142, borderRadius: 71, backgroundColor: '#E9E9DF', alignItems: 'center', justifyContent: 'center' }, hair: { width: 76, height: 91, backgroundColor: '#343C35', borderRadius: 40, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 3 }, face: { width: 64, height: 74, backgroundColor: '#D8B99B', borderRadius: 32, alignItems: 'center', paddingTop: 29 }, eyes: { flexDirection: 'row', gap: 18 }, eye: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#3C413C' }, smile: { width: 16, height: 7, borderBottomWidth: 1.5, borderColor: '#5D493B', borderRadius: 10, marginTop: 10 },
  headline: { color: c.ink, fontSize: 26, lineHeight: 34, fontWeight: '500', textAlign: 'center', maxWidth: 310 }, supporting: { color: c.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8, maxWidth: 300 },
  offerCard: { alignSelf: 'stretch', backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 17, padding: 15, marginTop: 22 }, offerEyebrow: { color: c.muted, fontSize: 10, letterSpacing: 1.15, fontWeight: '700' }, offerTitle: { color: c.ink, fontSize: 19, fontWeight: '600', marginTop: 7 }, offerCopy: { color: c.muted, fontSize: 13, marginTop: 4 }, offerButtons: { flexDirection: 'row', gap: 9, marginTop: 14 },
  button: { flex: 1, minHeight: 48, borderWidth: 1, borderColor: c.line, borderRadius: 13, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }, primaryButton: { backgroundColor: c.accent, borderColor: c.accent }, quietButton: { borderColor: 'transparent', backgroundColor: 'transparent' }, compactButton: { minHeight: 40 }, pressed: { opacity: 0.75 }, buttonText: { color: c.ink, fontSize: 14, fontWeight: '600' }, inverseText: { color: c.white }, quietText: { color: c.muted },
  composer: { alignSelf: 'stretch', marginTop: 14, padding: 12, borderRadius: 15, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }, textInput: { minHeight: 70, borderWidth: 1, borderColor: c.line, borderRadius: 12, backgroundColor: c.surface, padding: 12, justifyContent: 'flex-start' }, inputHint: { color: c.muted, fontSize: 14, lineHeight: 21 },
  controls: { minHeight: 100, borderTopWidth: 1, borderColor: c.line, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, paddingHorizontal: 15 }, control: { minWidth: 58, minHeight: 60, alignItems: 'center', justifyContent: 'center', gap: 3 }, controlGlyph: { color: c.ink, fontSize: 20, lineHeight: 25 }, endGlyph: { color: c.danger, fontSize: 27 }, controlLabel: { color: c.muted, fontSize: 10, fontWeight: '600' }, micButton: { minWidth: 112, minHeight: 64, borderRadius: 22, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 }, micLive: { backgroundColor: c.danger }, micGlyph: { color: c.white, fontSize: 18 }, micLabel: { color: c.white, fontSize: 10, fontWeight: '700', marginTop: 2 }, footerHint: { color: c.muted, fontSize: 11, textAlign: 'center', paddingVertical: 9 },
  activityArea: { flex: 1, minHeight: 585, padding: 23, paddingTop: 16 }, doTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 42, marginBottom: 30 }, backText: { color: c.accent, fontSize: 14, fontWeight: '600' }, activityKicker: { color: c.muted, fontSize: 11, letterSpacing: 1.3, fontWeight: '700' }, activityTitle: { color: c.ink, fontSize: 28, lineHeight: 36, fontWeight: '500', marginTop: 9 }, activityCopy: { color: c.muted, fontSize: 15, lineHeight: 23, marginTop: 8 }, dumpInput: { minHeight: 190, borderWidth: 1, borderColor: c.line, borderRadius: 16, backgroundColor: c.surface, padding: 15, color: c.ink, fontSize: 16, lineHeight: 24, marginTop: 22 }, privacyNote: { color: c.muted, fontSize: 12, lineHeight: 18, marginTop: 12 }, activityActions: { flexDirection: 'row', gap: 10, marginTop: 'auto', paddingTop: 18 },
  feedbackArea: { flex: 1, minHeight: 585, padding: 24, justifyContent: 'center' }, feedbackKicker: { color: c.muted, textAlign: 'center', fontSize: 11, letterSpacing: 1.2, fontWeight: '700' }, feedbackTitle: { color: c.ink, textAlign: 'center', fontSize: 29, fontWeight: '500', marginTop: 12 }, feedbackCopy: { color: c.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 9 }, ratingRow: { flexDirection: 'row', gap: 7, marginVertical: 23 }, rating: { flex: 1, minHeight: 54, borderWidth: 1, borderColor: c.line, borderRadius: 13, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }, ratingSelected: { borderColor: c.accent, backgroundColor: c.soft }, ratingText: { color: c.muted, fontSize: 11, textAlign: 'center' }, ratingTextSelected: { color: c.accent, fontWeight: '700' },
  tabs: { height: 65, borderTopWidth: 1, borderColor: c.line, backgroundColor: c.surface, flexDirection: 'row', justifyContent: 'center', gap: 52, alignItems: 'center' }, tab: { width: 55, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, tabGlyph: { fontSize: 18, color: c.muted }, tabText: { fontSize: 10, color: c.muted, marginTop: 1 }, tabActive: { color: c.accent, fontWeight: '700' },
  notes: { width: '100%', maxWidth: 460, minHeight: 400, backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: 20, padding: 22, marginTop: 0 }, notesKicker: { color: c.muted, fontSize: 10, letterSpacing: 1.3, fontWeight: '700' }, notesTitle: { color: c.ink, fontSize: 22, fontWeight: '500', marginTop: 8 }, notesCopy: { color: c.muted, fontSize: 14, lineHeight: 21, marginTop: 8 }, rule: { height: 1, backgroundColor: c.line, marginVertical: 18 }, flow: { color: c.ink, fontSize: 16, lineHeight: 24, marginTop: 8 }, disclaimer: { width: '100%', maxWidth: 1100, color: c.muted, fontSize: 12, lineHeight: 18, marginTop: 18, marginBottom: 12 },
});
