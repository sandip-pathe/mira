import React from 'react';
import { Text } from 'react-native';
import { ActionButton, Eyebrow, Surface, ui } from '../../../components/ui';

export type Rating = 'no' | 'a_little' | 'yes' | 'not_sure';
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
  origin: 'talk' | 'actions_library' | 'actions_continue';
  feedbackStatus: string;
  feedbackRetry: boolean;
  onSave: (allow: boolean) => void;
  onBack: () => void;
}) {
  const returnLabel = origin === 'talk' ? 'Talk' : 'Actions';
  return (
    <>
      {tried === undefined && (
        <Surface style={{ gap: 11 }}>
          <Eyebrow>OPTIONAL CHECK IN</Eyebrow>
          <Text style={ui.heading}>Did you try it?</Text>
          <ActionButton
            label="Yes, I tried it"
            variant="secondary"
            onPress={() => setTried(true)}
          />
          <ActionButton
            label="I stopped early"
            variant="secondary"
            onPress={() => setTried(false)}
          />
          <ActionButton label="Skip these questions" variant="quiet" onPress={onBack} />
        </Surface>
      )}
      {tried !== undefined && rating === undefined && (
        <Surface style={{ gap: 11 }}>
          <Eyebrow>OPTIONAL CHECK IN</Eyebrow>
          <Text style={ui.heading}>Did it help?</Text>
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
        </Surface>
      )}
      {rating && reuse === undefined && (
        <Surface style={{ gap: 10 }}>
          <Eyebrow>YOUR CHOICE</Eyebrow>
          <Text style={ui.heading}>Would you like Mira to suggest this again?</Text>
          <ActionButton label="Yes, show me the preference" onPress={() => setReuse(true)} />
          <ActionButton
            label="No, keep it private"
            variant="secondary"
            onPress={() => onSave(false)}
          />
          <ActionButton label="Not now" variant="quiet" onPress={() => onSave(false)} />
        </Surface>
      )}
      {reuse === true && saved === undefined && (
        <Surface style={{ gap: 10 }}>
          <Eyebrow>REVIEW BEFORE SAVING</Eyebrow>
          <Text style={ui.body}>“Mira may suggest {title} again in a similar moment.”</Text>
          <ActionButton label="Save this preference" loading={busy} onPress={() => onSave(true)} />
          <ActionButton label="Keep it private" variant="quiet" onPress={() => onSave(false)} />
        </Surface>
      )}
      {saved !== undefined && (
        <Surface style={{ gap: 10 }}>
          <Text accessibilityLiveRegion="polite" style={ui.body}>
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
        </Surface>
      )}
      {feedbackRetry && saved === undefined && (
        <Surface style={{ gap: 10 }}>
          <Text accessibilityLiveRegion="polite" style={ui.muted}>
            {feedbackStatus}
          </Text>
          <ActionButton
            label="Retry saving preference"
            loading={busy}
            onPress={() => onSave(true)}
          />
          <ActionButton label="Keep it private" variant="quiet" onPress={() => onSave(false)} />
        </Surface>
      )}
    </>
  );
}
