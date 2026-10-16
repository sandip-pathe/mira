import { useCallback, useEffect, useRef, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { getDemoSession, Message, request } from '../../../shared/api';
import { onContextRevoked, onDemoReset } from '../../../shared/demoEvents';
import { Intervention, SupportDecision, rememberIntervention } from '../../../shared/interventions';
import { blankMoment, ContextMatch, MomentState, proposalResponse } from '../conversation';
import { Voice, VoiceState } from '../../../shared/voice';

export function useTalkSession() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [state, setState] = useState<VoiceState>('disconnected');
  const [error, setError] = useState('');
  const [contextMatches, setContextMatches] = useState<ContextMatch[]>([]);
  const [contextNotice, setContextNotice] = useState('');
  const [textMode, setTextMode] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [moment, setMoment] = useState<MomentState>(blankMoment);
  const [proposal, setProposal] = useState<SupportDecision | undefined>(undefined);
  const [showCaptions, setShowCaptions] = useState(false);
  const [sessionEnded, setSessionEnded] = useState(false);
  const proposalRef = useRef<SupportDecision | undefined>(undefined);
  const voiceRef = useRef<Voice | undefined>(undefined);
  const connectAttempt = useRef(0);
  const connectPending = useRef(false);
  const textAttempt = useRef(0);
  const callbacksRef = useRef<
    | {
        message: (message: Message) => void;
        decision: (decision: SupportDecision) => void;
      }
    | undefined
  >(undefined);
  const getSession = useCallback(() => getDemoSession(), []);
  const stopVoice = useCallback(() => {
    connectAttempt.current += 1;
    connectPending.current = false;
    voiceRef.current?.close();
    setState('disconnected');
  }, []);

  const openIntervention = useCallback(
    (intervention: Intervention) => {
      rememberIntervention(intervention);
      proposalRef.current = undefined;
      setProposal(undefined);
      stopVoice();
      router.push({
        pathname: '/do',
        params: { id: intervention.id, origin: 'talk' },
      });
    },
    [stopVoice],
  );

  const handleDecision = useCallback((value: SupportDecision) => {
    if (value.intervention) rememberIntervention(value.intervention);
    const mode = {
      listen: 'listen_more',
      ask_question: 'clarify',
      offer_intervention: 'offer_action',
      human_support: 'suggest_human_support',
    } as const;
    const next = value.route === 'offer_intervention' && value.intervention ? value : undefined;
    proposalRef.current = next;
    setProposal(next);
    setMoment((current) => ({
      ...current,
      support_mode: mode[value.route],
      what_happened: value.situation_summary || current.what_happened,
      what_is_unclear: value.question || current.what_is_unclear,
      suggested_action: value.intervention?.title ?? '',
    }));
  }, []);

  const declineProposal = useCallback(async () => {
    const intervention = proposalRef.current?.intervention;
    proposalRef.current = undefined;
    setProposal(undefined);
    setMoment((current) => ({
      ...current,
      support_mode: 'listen_more',
      suggested_action: '',
    }));
    if (!intervention) return;
    try {
      const session = await getSession();
      await request(
        `/sessions/${session.session_id}/interventions/${intervention.id}/decline`,
        session,
        {},
      );
    } catch {
      /* The choice is still respected in this conversation. */
    }
  }, [getSession]);

  const handleVoiceMessage = useCallback(
    (message: Message) => {
      setMessages((current) => [...current, message]);
      if (message.role !== 'user') return;
      if (message.content.trim() === 'I am in immediate danger and need emergency help now.') {
        voiceRef.current?.cancel();
        setUrgent(true);
        return;
      }
      const pending = proposalRef.current?.intervention;
      if (!pending) return;
      const response = proposalResponse(message.content);
      if (response === 'decline') {
        void declineProposal();
      } else if (response === 'accept') {
        openIntervention(pending);
      }
    },
    [declineProposal, openIntervention],
  );

  useEffect(() => {
    callbacksRef.current = {
      message: handleVoiceMessage,
      decision: handleDecision,
    };
  }, [handleVoiceMessage, handleDecision]);
  const [voiceInstance, setVoiceInstance] = useState<Voice | undefined>(undefined);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        setVoiceInstance(
          new Voice({
            state: setState,
            error: setError,
            message: (value) => {
              if (value.role === 'user') callbacksRef.current?.message(value);
              else setMessages((current) => [...current, value]);
            },
            decision: (value) => callbacksRef.current?.decision(value),
            moment: (value) =>
              setMoment((current) => ({
                ...value,
                previously_helpful: current.previously_helpful,
              })),
            context: (matches, noMatch) => {
              if (matches.length) {
                setContextNotice('');
                const lesson = matches.find((item) => item.source_type === 'feedback')?.excerpt;
                if (lesson)
                  setMoment((current) => ({
                    ...current,
                    previously_helpful: lesson,
                  }));
                setContextMatches((current) => {
                  const byId = new Map(current.map((item) => [item.id, item]));
                  matches.forEach((item) => byId.set(item.id, item));
                  return [...byId.values()];
                });
              } else if (noMatch)
                setContextNotice(
                  'No relevant shared context matched. Mira is continuing without it.',
                );
            },
            urgentHelp: () => setUrgent(true),
          }),
        ),
      0,
    );
    return () => clearTimeout(timer);
  }, []);
  const activeVoice = voiceInstance;
  useEffect(() => {
    voiceRef.current = activeVoice;
  }, [activeVoice]);

  const clearLocalDemo = useCallback(() => {
    textAttempt.current += 1;
    stopVoice();
    setSending(false);
    setMessages([]);
    setContextMatches([]);
    setContextNotice('');
    setText('');
    setTextMode(false);
    setUrgent(false);
    setProposal(undefined);
    proposalRef.current = undefined;
    setMoment(blankMoment());
  }, [stopVoice]);

  useEffect(() => {
    const unsubscribe = onDemoReset(clearLocalDemo);
    return () => {
      unsubscribe();
    };
  }, [clearLocalDemo]);
  useEffect(() => {
    const unsubscribe = onContextRevoked(() => {
      textAttempt.current += 1;
      stopVoice();
      setSending(false);
      setMessages([]);
      setContextMatches([]);
      setContextNotice('');
      setMoment(blankMoment());
      setProposal(undefined);
      proposalRef.current = undefined;
    });
    return () => {
      unsubscribe();
    };
  }, [stopVoice]);
  useFocusEffect(useCallback(() => () => stopVoice(), [stopVoice]));

  async function connect() {
    if (connectPending.current) return;
    connectPending.current = true;
    const attempt = ++connectAttempt.current;
    setError('');
    setSessionEnded(false);
    setTextMode(false);
    setContextMatches([]);
    setContextNotice('');
    setState('connecting');
    try {
      const session = await getSession();
      if (attempt !== connectAttempt.current) return;
      const voice = voiceRef.current;
      if (!voice) throw new Error('Voice is still starting. Please try again.');
      await voice.connect(session, messages, undefined, moment);
    } catch (e) {
      if (attempt === connectAttempt.current) {
        setError(e instanceof Error ? e.message : 'Mira is temporarily offline.');
        setState('disconnected');
      }
    } finally {
      if (attempt === connectAttempt.current) connectPending.current = false;
    }
  }

  async function sendText() {
    if (!text.trim() || sending) return;
    const content = text.trim();
    if (content === 'I am in immediate danger and need emergency help now.') {
      activeVoice?.cancel();
      setUrgent(true);
      return;
    }
    const pending = proposalRef.current?.intervention;
    if (pending && proposalResponse(content) === 'accept') {
      setMessages((items) => [...items, { role: 'user', content }]);
      setText('');
      openIntervention(pending);
      return;
    }
    if (pending && proposalResponse(content) === 'decline') {
      setMessages((items) => [...items, { role: 'user', content }]);
      setText('');
      void declineProposal();
      return;
    }
    setSending(true);
    setError('');
    const attempt = ++textAttempt.current;
    const next = [...messages, { role: 'user' as const, content }];
    try {
      const current = await getSession();
      if (attempt !== textAttempt.current) return;
      const result = await request<{
        text: string;
        moment_state: MomentState;
        context_matches: ContextMatch[];
        decision: SupportDecision;
      }>(`/sessions/${current.session_id}/text`, current, {
        messages: next,
        feedback_id: null,
        moment_state: moment,
      });
      if (attempt !== textAttempt.current) return;
      setMessages([...next, { role: 'assistant', content: result.text }]);
      setText('');
      const lesson = result.context_matches?.find(
        (item) => item.source_type === 'feedback',
      )?.excerpt;
      setMoment({
        ...result.moment_state,
        previously_helpful: lesson ?? moment.previously_helpful,
      });
      setContextMatches(result.context_matches ?? []);
      setContextNotice(
        result.context_matches?.length
          ? ''
          : 'No relevant shared context matched. Mira is continuing without it.',
      );
      handleDecision(result.decision);
    } catch (e) {
      if (attempt === textAttempt.current)
        setError(e instanceof Error ? e.message : 'Mira is temporarily offline.');
    } finally {
      if (attempt === textAttempt.current) setSending(false);
    }
  }

  const ready = ['ready', 'thinking', 'speaking', 'listening'].includes(state);
  const statusText = sessionEnded
    ? 'Call ended'
    : state === 'connecting'
      ? 'Connecting...'
      : state === 'listening'
        ? 'Listening'
        : state === 'thinking'
          ? 'Thinking'
          : state === 'speaking'
            ? 'Speaking'
            : ready
              ? 'Ready to listen'
              : error
                ? 'Voice disconnected'
                : 'Tap mic to connect';
  const controlCaption = textMode
    ? 'Text mode'
    : sessionEnded
      ? 'Call ended'
      : state === 'listening'
        ? 'Listening - release to send'
        : state === 'speaking'
          ? 'Hold to interrupt'
          : ready
            ? 'Hold to talk'
            : state === 'connecting'
              ? 'Connecting...'
              : 'Tap to connect - hold to talk';
  const heroTitle = sessionEnded
    ? 'We can pick this up later.'
    : state === 'listening'
      ? "I'm listening."
      : state === 'thinking'
        ? 'Let me think for a moment.'
        : error
          ? 'Voice is disconnected.'
          : "I'm here with you.";
  const heroSubtitle = sessionEnded
    ? 'The conversation was not saved.'
    : state === 'listening'
      ? "Release when you're done."
      : state === 'thinking'
        ? 'Take your time.'
        : error
          ? 'You can retry voice or type instead.'
          : 'Take your time.';

  return {
    messages,
    state,
    error,
    contextMatches,
    contextNotice,
    textMode,
    text,
    sending,
    urgent,
    moment,
    proposal,
    showCaptions,
    sessionEnded,
    activeVoice,
    ready,
    statusText,
    controlCaption,
    heroTitle,
    heroSubtitle,
    setUrgent,
    setTextMode,
    setText,
    setShowCaptions,
    setSessionEnded,
    setError,
    openIntervention,
    declineProposal,
    connect,
    sendText,
    stopVoice,
  };
}
