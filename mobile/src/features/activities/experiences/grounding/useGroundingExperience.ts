import React from 'react';
import { randomUUID } from 'expo-crypto';
import { saveActivityPreference } from '../../../actions/data/preferenceRepository';
import type { Rating } from '../../data/activityFeedback';
import { createLocalActivityRun, finishLocalActivityRun, type LocalActivityRun } from '../../runtime/activityEngine';
import type { ActivityOrigin } from '../../runtime/contracts';

export const groundingSenses = [
  { label: 'See', target: 3, prompt: 'Notice 3 things you can see.' },
  { label: 'Hear', target: 2, prompt: 'Notice 2 things you can hear.' },
  { label: 'Feel', target: 1, prompt: 'Notice one comfortable point of contact, such as your feet or the chair.' },
] as const;

export type GroundingPhase = 'ready' | 'active' | 'done';
export type GroundingFeedbackStep = 'rating' | 'reuse' | 'review' | 'saved';

export function useGroundingExperience(origin: ActivityOrigin) {
  const [runId] = React.useState(() => randomUUID());
  const [initialRun] = React.useState<LocalActivityRun | undefined>(() =>
    origin === 'talk' ? createLocalActivityRun(runId, 'grounding') : undefined,
  );
  const [run, setRun] = React.useState(initialRun);
  const [phase, setPhase] = React.useState<GroundingPhase>(() => origin === 'talk' ? 'active' : 'ready');
  const [index, setIndex] = React.useState(0);
  const [counts, setCounts] = React.useState<[number, number, number]>([0, 0, 0]);
  const [skipped, setSkipped] = React.useState<[boolean, boolean, boolean]>([false, false, false]);
  const [rippleKey, setRippleKey] = React.useState(0);
  const [feedbackStep, setFeedbackStep] = React.useState<GroundingFeedbackStep>('rating');
  const [rating, setRating] = React.useState<Rating>();
  const [busy, setBusy] = React.useState(false);
  const [status, setStatus] = React.useState('');

  const sense = groundingSenses[index];
  const canAdvance = skipped[index] || counts[index] >= sense.target;
  const senseSummary = groundingSenses.map((item, at) => ({
    label: item.label, target: item.target, count: counts[at], skipped: skipped[at],
  }));

  const start = React.useCallback(() => {
    if (phase !== 'ready') return;
    setRun(createLocalActivityRun(runId, 'grounding'));
    setPhase('active');
  }, [phase, runId]);

  const noticeOne = React.useCallback(() => {
    if (phase !== 'active' || skipped[index] || counts[index] >= sense.target) return;
    setCounts((current) => current.map((count, at) => at === index ? Math.min(sense.target, count + 1) : count) as [number, number, number]);
    setRippleKey((key) => key + 1);
  }, [counts, index, phase, sense.target, skipped]);

  const undo = React.useCallback(() => {
    if (skipped[index]) {
      setSkipped((current) => current.map((value, at) => at === index ? false : value) as [boolean, boolean, boolean]);
      return;
    }
    setCounts((current) => current.map((count, at) => at === index ? Math.max(0, count - 1) : count) as [number, number, number]);
  }, [index, skipped]);

  const skipSense = React.useCallback(() => {
    setSkipped((current) => current.map((value, at) => at === index ? true : value) as [boolean, boolean, boolean]);
  }, [index]);

  const previous = React.useCallback(() => setIndex((value) => Math.max(0, value - 1)), []);

  const next = React.useCallback(() => {
    if (!canAdvance) return;
    if (index < groundingSenses.length - 1) {
      setIndex((value) => Math.min(groundingSenses.length - 1, value + 1));
      return;
    }
    if (!run || run.state !== 'started') return;
    setRun(finishLocalActivityRun(run, 'completed'));
    setPhase('done');
  }, [canAdvance, index, run]);

  const chooseRating = React.useCallback((value: Rating) => {
    setRating(value);
    setFeedbackStep('reuse');
    setStatus('');
  }, []);

  const reviewPreference = React.useCallback(() => setFeedbackStep('review'), []);

  const savePreference = React.useCallback(async () => {
    if (!run || run.state === 'started' || !rating || busy) return;
    setBusy(true);
    setStatus('');
    try {
      const result = await saveActivityPreference(run, rating, 'Mira may suggest Grounding again in a similar moment.');
      setStatus(result.reuse_context
        ? 'Preference saved on this device. You can review or remove it in Journal.'
        : 'This preference was previously changed. You can review it in Journal.');
      setFeedbackStep('saved');
    } catch {
      setStatus('This preference could not be saved on this device.');
    } finally {
      setBusy(false);
    }
  }, [busy, rating, run]);

  const keepPrivate = React.useCallback(() => {
    setStatus('No preference was saved. Your answer stays in this session.');
    setFeedbackStep('saved');
  }, []);

  const skipFeedback = React.useCallback(() => {
    setStatus('');
    setFeedbackStep('saved');
  }, []);

  return {
    phase, index, sense, counts, skipped, rippleKey, canAdvance, senseSummary, feedbackStep, rating,
    busy, status, start, noticeOne, undo, skipSense, previous, next, chooseRating,
    reviewPreference, savePreference, keepPrivate, skipFeedback,
  };
}

export type GroundingExperience = ReturnType<typeof useGroundingExperience>;
