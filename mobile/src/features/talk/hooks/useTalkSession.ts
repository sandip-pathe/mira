import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { ApiError, getDemoSession, Message, renewDemoSession, request } from '../../../shared/api';
import { onContextRevoked, onDemoReset, onUrgentHelp } from '../../../shared/demoEvents';
import { Intervention, SupportDecision, rememberIntervention } from '../../../shared/interventions';
import { blankMoment, ContextMatch, MomentState, proposalResponse } from '../conversation';
import { Voice, VoiceState, VoiceTransportState, VoiceTurnState } from '../../../shared/voice';
import { acknowledgeTalkTransfer, peekTalkTransfer } from '../../../shared/talkTransfer';
import { activityCapabilities } from '../../../shared/activityRegistry';
import { consumeQuietTalkReturn } from '../../../shared/musicHandoff';
import { currentConsentRevision, selectTalkContext } from '../data/contextRepository';

export function useTalkSession() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [connectionState, setConnectionState] = useState<VoiceTransportState>('disconnected');
  const connectionRef = useRef<VoiceTransportState>('disconnected');
  const [turnState, setTurnState] = useState<VoiceTurnState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState('');
  const [contextMatches, setContextMatches] = useState<ContextMatch[]>([]);
  const [contextNotice, setContextNotice] = useState('');
  const [textMode, setTextMode] = useState(false);
  const textModeRef = useRef(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [waitingForReply, setWaitingForReply] = useState(false);
  const [failedText, setFailedText] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [moment, setMoment] = useState<MomentState>(blankMoment);
  const [proposal, setProposal] = useState<SupportDecision | undefined>(undefined);
  const [showCaptions, setShowCaptions] = useState(false);
  const [quietReturnMessage, setQuietReturnMessage] = useState('');
  const [sessionEnded, setSessionEnded] = useState(false);
  const proposalRef = useRef<SupportDecision | undefined>(undefined);
  const voiceRef = useRef<Voice | undefined>(undefined);
  const connectAttempt = useRef(0);
  const connectPending = useRef(false);
  const focusedRef = useRef(false);
  const talkIntent = useRef(false);
  const voiceRequested = useRef(false);
  const reconnectAttempts = useRef(0);
  const currentContext = useRef({ messages, moment });
  useEffect(() => {
    currentContext.current = { messages, moment };
  }, [messages, moment]);
  const textAttempt = useRef(0);
  const textRequest = useRef<AbortController | undefined>(undefined);
  const declinedInterventions = useRef(new Set<string>());
  const callbacksRef = useRef<
    | {
        message: (message: Message) => void;
        decision: (decision: SupportDecision) => void;
      }
    | undefined
  >(undefined);
  const getSession = useCallback(() => getDemoSession(), []);
  const updateConnection = useCallback((value: VoiceTransportState) => {
    connectionRef.current = value;
    setConnectionState(value);
    if (value === 'ready') {
      reconnectAttempts.current = 0;
      if (talkIntent.current) {
        talkIntent.current = false;
        void voiceRef.current?.press();
      }
    }
  }, []);
  const updateTurn = useCallback((value: VoiceTurnState) => {
    setTurnState(value);
  }, []);
  const state: VoiceState = connectionState === 'ready'
    ? turnState === 'idle' ? 'ready' : turnState === 'failed' ? 'turn_error' : turnState
    : connectionState;
  const updateTextMode = useCallback((value: boolean) => {
    textModeRef.current = value;
    setTextMode(value);
    setError('');
    if (value) {
      talkIntent.current = false;
      voiceRef.current?.cancel();
    }
  }, []);
  const stopVoice = useCallback(() => {
    voiceRequested.current = false;
    connectAttempt.current += 1;
    connectPending.current = false;
    voiceRef.current?.close();
    updateConnection('disconnected');
    updateTurn('idle');
  }, [updateConnection, updateTurn]);

  const openIntervention = useCallback(
    (intervention: Intervention) => {
      talkIntent.current = false;
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

  const declineProposal = useCallback(() => {
    const intervention = proposalRef.current?.intervention;
    proposalRef.current = undefined;
    setProposal(undefined);
    setMoment((current) => ({
      ...current,
      support_mode: 'listen_more',
      suggested_action: '',
    }));
    if (intervention) declinedInterventions.current.add(intervention.id);
  }, []);

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
    const voice = new Voice({
      transport: updateConnection,
      turn: updateTurn,
      audioLevel: setAudioLevel,
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
          setContextNotice('No relevant shared context matched. Mira is continuing without it.');
      },
      declinedInterventions: () => [...declinedInterventions.current],
      urgentHelp: () => setUrgent(true),
    });
    voiceRef.current = voice;
    setVoiceInstance(voice);
    return () => {
      voice.close();
      if (voiceRef.current === voice) voiceRef.current = undefined;
    };
  }, [updateConnection, updateTurn]);
  const activeVoice = voiceInstance;
  useEffect(() => {
    voiceRef.current = activeVoice;
  }, [activeVoice]);

  const clearLocalDemo = useCallback(() => {
    textAttempt.current += 1;
    textRequest.current?.abort();
    textRequest.current = undefined;
    talkIntent.current = false;
    stopVoice();
    setSending(false);
    setMessages([]);
    declinedInterventions.current.clear();
    setContextMatches([]);
    setContextNotice('');
    setText('');
    updateTextMode(false);
    setUrgent(false);
    setProposal(undefined);
    proposalRef.current = undefined;
    setMoment(blankMoment());
  }, [stopVoice, updateTextMode]);

  useEffect(() => {
    const unsubscribe = onDemoReset(clearLocalDemo);
    return () => {
      unsubscribe();
    };
  }, [clearLocalDemo]);
  useEffect(() => {
    const unsubscribe = onUrgentHelp(() => setUrgent(true));
    return () => {
      unsubscribe();
    };
  }, []);
  useEffect(() => {
    const unsubscribe = onContextRevoked(() => {
      textAttempt.current += 1;
      textRequest.current?.abort();
      textRequest.current = undefined;
      talkIntent.current = false;
      stopVoice();
      setSending(false);
      setMessages([]);
      setFailedText('');
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
  const connect = useCallback(
    async (reconnecting = false) => {
      if (connectPending.current) return;
      const voice = voiceRef.current;
      if (!voice) return;
      voiceRequested.current = true;
      connectPending.current = true;
      const attempt = ++connectAttempt.current;
      setError('');
      setSessionEnded(false);
      updateTextMode(false);
    setContextMatches([]);
    setContextNotice('');
      updateConnection(reconnecting ? 'reconnecting' : 'connecting');
      try {
        const [session] = await Promise.all([getSession(), voice.requestMicPermission()]);
        if (attempt !== connectAttempt.current) return;
        await voice.connect(
          session,
          currentContext.current.messages,
          currentContext.current.moment,
          reconnecting,
          true,
        );
      } catch (e) {
        if (attempt === connectAttempt.current) {
          setError(e instanceof Error ? e.message : 'Mira is temporarily offline.');
          updateConnection('error');
        }
      } finally {
        if (attempt === connectAttempt.current) connectPending.current = false;
      }
    },
    [getSession, updateConnection, updateTextMode],
  );

  const switchToVoice = useCallback(() => {
    setQuietReturnMessage('');
    updateTextMode(false);
    if (['disconnected', 'reconnecting', 'error'].includes(connectionRef.current)) void connect();
  }, [connect, updateTextMode]);

  const talkPressIn = useCallback(() => {
    talkIntent.current = true;
    setError('');
    if (textModeRef.current) updateTextMode(false);
    const current = connectionRef.current;
    if (current === 'ready') {
      talkIntent.current = false;
      void voiceRef.current?.press();
    } else if (current === 'disconnected' || current === 'error') {
      void connect();
    }
  }, [connect, updateTextMode]);

  const talkPressOut = useCallback(() => {
    talkIntent.current = false;
    voiceRef.current?.release();
  }, []);

  useEffect(() => {
    if (connectionState !== 'reconnecting' || !focusedRef.current) return;
    if (reconnectAttempts.current >= 1) {
      updateConnection('error');
      return;
    }
    reconnectAttempts.current += 1;
    const timer = setTimeout(() => void connect(true), 900);
    return () => clearTimeout(timer);
  }, [connect, connectionState, updateConnection]);

  useFocusEffect(
    useCallback(() => {
      if (!activeVoice) return;
      focusedRef.current = true;
      const transfer = peekTalkTransfer();
      const quietMusicReturn = consumeQuietTalkReturn();
      if (transfer) {
        setText((current) =>
          current.trim() ? `${current.trim()}\n\n${transfer.text}` : transfer.text,
        );
        updateTextMode(true);
        acknowledgeTalkTransfer(transfer.id);
      } else if (quietMusicReturn) {
        setQuietReturnMessage('Music may still be playing. Voice is paused; resume it when you are ready.');
        updateTextMode(true);
      }
      let wasBackgrounded = false;
      const subscription = AppState.addEventListener('change', (nextState) => {
        if (nextState !== 'active') {
          wasBackgrounded = true;
          voiceRef.current?.cancel();
        } else if (
          wasBackgrounded &&
          voiceRequested.current &&
          !textModeRef.current &&
          ['disconnected', 'reconnecting', 'error'].includes(connectionRef.current)
        ) {
          wasBackgrounded = false;
          void connect();
        } else if (nextState === 'active') {
          wasBackgrounded = false;
        }
      });
      return () => {
        focusedRef.current = false;
        talkIntent.current = false;
        subscription.remove();
        stopVoice();
      };
      }, [activeVoice, connect, stopVoice, updateTextMode]),
  );

  async function sendText(retryContent?: string) {
    if ((!retryContent && !text.trim()) || sending) return;
    const content = (retryContent ?? text).trim();
    if (content === 'I am in immediate danger and need emergency help now.') {
      activeVoice?.cancel();
      setUrgent(true);
      return;
    }
    const pending = proposalRef.current?.intervention;
    if (pending && proposalResponse(content) === 'accept') {
      setMessages((items) => [...items, { role: 'user', content }]);
      setText('');
      activeVoice?.addTextMessages([{ role: 'user', content }]);
      setText('');
      openIntervention(pending);
      return;
    }
    if (pending && proposalResponse(content) === 'decline') {
      setMessages((items) => [...items, { role: 'user', content }]);
      setText('');
      activeVoice?.addTextMessages([{ role: 'user', content }]);
      setText('');
      void declineProposal();
      return;
    }
    setSending(true);
    setWaitingForReply(true);
    setError('');
    setFailedText('');
    const attempt = ++textAttempt.current;
    textRequest.current?.abort();
    const requestController = new AbortController();
    textRequest.current = requestController;
    const requestTimeout = setTimeout(() => requestController.abort(), 45000);
    const next = retryContent ? messages : [...messages, { role: 'user' as const, content }];
    if (!retryContent) {
      setMessages(next);
      setText('');
    }
    try {
      let current = await getSession();
      if (attempt !== textAttempt.current) return;
      const prepareBody = async () => {
        const approvedContext = await selectTalkContext(content);
        const revision = await currentConsentRevision();
        if (revision !== approvedContext.revision) throw new Error('Shared context changed. Retry to use current consent.');
        return {
          messages: next,
          context_matches: approvedContext.matches,
          approved_preferences: approvedContext.preferences,
          consent_revision: revision,
          declined_interventions: [...declinedInterventions.current],
          moment_state: moment,
          client_activity_capabilities: activityCapabilities(),
        };
      };
      let body = await prepareBody();
      if (attempt !== textAttempt.current) return;
      const path = `/sessions/${current.session_id}/text`;
      type TextReply = {
        text: string;
        moment_state: MomentState;
        context_matches: ContextMatch[];
        decision: SupportDecision;
      };
      let result: TextReply;
      try {
        result = await request<TextReply>(path, current, body, undefined, { signal: requestController.signal });
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401 || attempt !== textAttempt.current || requestController.signal.aborted) throw error;
        current = await renewDemoSession(current);
        if (attempt !== textAttempt.current) return;
        body = await prepareBody();
        if (attempt !== textAttempt.current) return;
        result = await request<TextReply>(`/sessions/${current.session_id}/text`, current, body, undefined, { signal: requestController.signal });
      }
      if (attempt !== textAttempt.current) return;
      activeVoice?.addTextMessages([
        { role: 'user', content },
        { role: 'assistant', content: result.text },
      ]);
      setMessages((current) => [...current, { role: 'assistant', content: result.text }]);
      setWaitingForReply(false);
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
    } catch {
      if (attempt === textAttempt.current) {
        setFailedText(content);
        setWaitingForReply(false);
      }
    } finally {
      clearTimeout(requestTimeout);
      if (textRequest.current === requestController) textRequest.current = undefined;
      if (attempt === textAttempt.current) setSending(false);
    }
  }

  const ready = connectionState === 'ready';
  const controlCaption = textMode
    ? 'Text mode'
    : sessionEnded
      ? 'Hold the mic to start voice again'
      : turnState === 'starting'
        ? 'Turning microphone on…'
      : turnState === 'recording'
        ? 'Listening — release to send'
        : turnState === 'speaking'
          ? 'Hold to interrupt'
          : turnState === 'processing' || turnState === 'finalizing'
            ? 'Mira is responding'
            : ready
              ? 'Hold to talk'
              : connectionState === 'connecting' || connectionState === 'reconnecting'
                ? 'Hold to talk when voice is ready'
                : connectionState === 'error' || turnState === 'failed'
                  ? 'Hold the mic to retry voice, or type instead'
                  : 'Hold the mic to talk';
  const heroTitle = sessionEnded
    ? 'Voice is off.'
    : turnState === 'recording'
      ? "I'm listening."
        : turnState === 'processing' || turnState === 'finalizing'
        ? 'Thinking…'
        : turnState === 'starting'
          ? 'Microphone on'
        : connectionState === 'connecting'
          ? 'Connecting…'
          : connectionState === 'reconnecting'
            ? 'Reconnecting…'
            : connectionState === 'error' || turnState === 'failed'
              ? 'Try again'
              : '';
  const heroSubtitle = sessionEnded
    ? 'Hold the mic when you want to continue.'
      : turnState === 'recording' || turnState === 'processing' || turnState === 'finalizing' || turnState === 'starting'
        ? ''
        : connectionState === 'connecting' || connectionState === 'reconnecting'
          ? ''
          : connectionState === 'error' || turnState === 'failed'
            ? 'Hold the mic to retry, or switch to text.'
            : '';

  const endVoice = useCallback(() => {
    talkIntent.current = false;
    stopVoice();
    updateTextMode(false);
    setSessionEnded(true);
    setError('');
  }, [stopVoice, updateTextMode]);

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
    quietReturnMessage,
    sessionEnded,
    activeVoice,
    connectionState,
    turnState,
    audioLevel,
    ready,
    controlCaption,
    heroTitle,
    heroSubtitle,
    setUrgent,
    setTextMode: updateTextMode,
    setText,
    setShowCaptions,
    setSessionEnded,
    setError,
    openIntervention,
    declineProposal,
    connect,
    switchToVoice,
    talkPressIn,
    talkPressOut,
    endVoice,
    sendText,
    failedText,
    waitingForReply,
    stopVoice,
  };
}
