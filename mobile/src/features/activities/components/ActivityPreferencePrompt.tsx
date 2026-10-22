import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton, Eyebrow, useTheme } from '../../../components/ui';
import type { LocalActivityRun } from '../runtime/activityEngine';
import type { Rating } from '../data/activityFeedback';
import { saveActivityPreference } from '../../actions/data/preferenceRepository';

const ratings: { value: Rating; label: string }[] = [
  { value: 'no', label: 'Not at all' },
  { value: 'a_little', label: 'A little' },
  { value: 'yes', label: 'Quite a bit' },
  { value: 'not_sure', label: 'Not sure' },
];

export function ActivityPreferencePrompt({ run, title }: { run?: LocalActivityRun; title: string }) {
  const { colors, typography } = useTheme();
  const [rating, setRating] = React.useState<Rating>();
  const [stage, setStage] = React.useState<'rating' | 'reuse' | 'review' | 'saved' | 'private'>('rating');
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState('');
  if (!run || run.state === 'started' || run.state === 'skipped') return null;
  const eligibleRun = run;

  async function save() {
    if (!rating || busy) return;
    setBusy(true);
    setStatus('');
    try {
      await saveActivityPreference(eligibleRun, rating, `Mira may suggest ${title} again in a similar moment.`);
      setStatus('Saved on this device. You can review or remove this preference in Journal.');
      setStage('saved');
    } catch {
      setStatus('This preference could not be saved on this device.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.prompt, { borderTopColor: colors.line }]}>
      {stage === 'rating' ? <>
        <Eyebrow>OPTIONAL CHECK-IN</Eyebrow>
        <Text accessibilityRole="header" style={[typography.groupHeading, { color: colors.ink }]}>Did this feel helpful?</Text>
        <View style={styles.ratings}>
          {ratings.map((item) => <ActionButton key={item.value} label={item.label} variant="secondary" disabled={busy} style={styles.rating} onPress={() => { setRating(item.value); setStage('reuse'); }} />)}
        </View>
        <ActionButton label="Skip" variant="quiet" disabled={busy} onPress={() => setStage('private')} />
      </> : null}
      {stage === 'reuse' ? <>
        <Eyebrow>YOUR CHOICE</Eyebrow>
        <Text accessibilityRole="header" style={[typography.groupHeading, { color: colors.ink }]}>Would you like Mira to offer {title} again?</Text>
        <ActionButton label="Use again" disabled={busy} onPress={() => setStage('review')} />
        <ActionButton label="No, keep it private" variant="secondary" disabled={busy} onPress={() => setStage('private')} />
      </> : null}
      {stage === 'review' ? <>
        <Eyebrow>REVIEW BEFORE SAVING</Eyebrow>
        <Text style={[typography.body, { color: colors.ink }]}>Mira may suggest {title} again in a similar moment. Only this choice and your rating are saved on this device.</Text>
        {!!status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{status}</Text>}
        <ActionButton label="Save this preference" loading={busy} onPress={() => void save()} />
        <ActionButton label="Keep it private" variant="quiet" disabled={busy} onPress={() => setStage('private')} />
      </> : null}
      {stage === 'saved' || stage === 'private' ? <>
        {!!status && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>{status}</Text>}
        {stage === 'private' ? <Text style={[typography.support, { color: colors.muted }]}>No activity preference was saved.</Text> : null}
      </> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  prompt: { gap: 12, marginTop: 4, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
  ratings: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rating: { flexGrow: 1, flexBasis: 130 },
});
