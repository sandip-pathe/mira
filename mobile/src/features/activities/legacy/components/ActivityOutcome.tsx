import React from 'react';
import { Text } from 'react-native';
import { ActionButton, Eyebrow, useTheme } from '../../../../components/ui';
import { ActivityPanel } from './ActivityPanel';
import type { Rating } from '../../data/activityFeedback';

export type { Rating } from '../../data/activityFeedback';
export function ActivityOutcome({
  tried,
  setTried,
  rating,
  setRating,
  reuse,
  setReuse,
  saved,
  busy,
  title,
  checkInPrompt = 'Did you try it?',
  checkInYesLabel = 'Yes, I tried it',
  checkInNoLabel = 'I stopped early',
  checkInSkipLabel = 'Skip these questions',
  checkInThanks = 'Thanks for letting Mira know. No message was sent by Mira.',
  simpleCheckIn = false,
  origin,
  feedbackStatus,
  feedbackRetry,
  onSave,
  onBack,
}: {
  tried?: boolean;
  setTried: (value: boolean) => void;
  rating?: Rating;
  setRating: (value: Rating) => void;
  reuse?: boolean;
  setReuse: (value: boolean) => void;
  saved?: boolean;
  busy: boolean;
  title: string;
  checkInPrompt?: string;
  checkInYesLabel?: string;
  checkInNoLabel?: string;
  checkInSkipLabel?: string;
  checkInThanks?: string;
  simpleCheckIn?: boolean;
  origin: 'talk' | 'actions_library' | 'actions_continue';
  feedbackStatus: string;
  feedbackRetry: boolean;
  onSave: (allow: boolean) => void;
  onBack: () => void;
}) {
  const { colors, typography } = useTheme();
  const returnLabel = origin === 'talk' ? 'Talk' : 'Actions';
  return (
    <>
      {tried === undefined && (
        <ActivityPanel style={{ gap: 11 }}>
          <Eyebrow>OPTIONAL CHECK IN</Eyebrow>
          <Text style={[typography.groupHeading, { color: colors.ink }]}>{checkInPrompt}</Text>
          <ActionButton
            label={checkInYesLabel}
            variant="secondary"
            onPress={() => setTried(true)}
          />
          <ActionButton
            label={checkInNoLabel}
            variant="secondary"
            onPress={() => setTried(false)}
          />
          <ActionButton label={checkInSkipLabel} variant="quiet" onPress={onBack} />
        </ActivityPanel>
      )}
      {simpleCheckIn && tried !== undefined && (
        <ActivityPanel style={{ gap: 11 }}>
          <Text style={[typography.support, { color: colors.muted }]}>{checkInThanks}</Text>
          <ActionButton label={`Back to ${returnLabel}`} onPress={onBack} />
        </ActivityPanel>
      )}
      {!simpleCheckIn && tried !== undefined && rating === undefined && (
        <ActivityPanel style={{ gap: 11 }}>
          <Eyebrow>OPTIONAL CHECK IN</Eyebrow>
          <Text style={[typography.groupHeading, { color: colors.ink }]}>Did it help?</Text>
          {(['no', 'a_little', 'yes', 'not_sure'] as const).map((value) => (
            <ActionButton
              key={value}
              label={
                value === 'no'
                  ? 'Not at all'
                  : value === 'a_little'
                    ? 'A little'
                    : value === 'yes'
                      ? 'Quite a bit'
                      : 'Not sure'
              }
              variant="secondary"
              onPress={() => setRating(value)}
            />
          ))}
          <ActionButton label="Skip this question" variant="quiet" onPress={onBack} />
        </ActivityPanel>
      )}
      {rating && reuse === undefined && (
        <ActivityPanel style={{ gap: 10 }}>
          <Eyebrow>YOUR CHOICE</Eyebrow>
          <Text style={[typography.groupHeading, { color: colors.ink }]}>Would you like Mira to suggest this again?</Text>
          <ActionButton label="Use again" onPress={() => setReuse(true)} />
          <ActionButton
            label="No, keep it private"
            variant="secondary"
            onPress={() => onSave(false)}
          />
          <ActionButton label="Not now" variant="quiet" onPress={() => onSave(false)} />
        </ActivityPanel>
      )}
      {reuse === true && saved === undefined && (
        <ActivityPanel style={{ gap: 10 }}>
          <Eyebrow>REVIEW BEFORE SAVING</Eyebrow>
          <Text style={[typography.body, { color: colors.ink }]}>"Mira may suggest {title} again in a similar moment."</Text>
          <ActionButton label="Save this preference" loading={busy} onPress={() => onSave(true)} />
          <ActionButton label="Keep it private" variant="quiet" onPress={() => onSave(false)} />
        </ActivityPanel>
      )}
      {saved !== undefined && (
        <ActivityPanel style={{ gap: 10 }}>
          <Text accessibilityLiveRegion="polite" style={[typography.body, { color: colors.ink }]}>
            {feedbackStatus}
          </Text>
          {feedbackRetry && (
            <ActionButton
              label="Retry saving preference"
              loading={busy}
              onPress={() => onSave(true)}
            />
          )}
          <ActionButton label={`Back to ${returnLabel}`} onPress={onBack} />
        </ActivityPanel>
      )}
      {feedbackRetry && saved === undefined && (
        <ActivityPanel style={{ gap: 10 }}>
          <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.muted }]}>
            {feedbackStatus}
          </Text>
          <ActionButton
            label="Retry saving preference"
            loading={busy}
            onPress={() => onSave(true)}
          />
          <ActionButton label="Keep it private" variant="quiet" onPress={() => onSave(false)} />
        </ActivityPanel>
      )}
    </>
  );
}

