import React from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ActionButton, useTheme } from '../../components/ui';
import { useTalkSession } from './hooks/useTalkSession';
import { useTalkMotion } from './hooks/useTalkMotion';
import { talkPresentation } from './talkPresentation';
import { TalkCallControls } from './components/TalkCallControls';
import { TalkHeader } from './components/TalkHeader';
import { TalkTextPanel } from './components/TalkTextPanel';
import { TalkTextComposer } from './components/TalkTextComposer';
import { TalkVoicePanel } from './components/TalkVoicePanel';
import { PresenceHero } from './components/PresenceHero';
import { TalkConversationSheet } from './components/TalkConversationSheet';
import { UrgentHelpPanel } from './components/UrgentHelpPanel';
import { callController, isCallLive, useMiraCall } from '../call/callController';

export default function TalkScreen() {
  const call = useMiraCall();
  const {
    messages, state, error, sessionEnded, contextMatches,
    textMode, text, sending, urgent, moment, proposal, showCaptions,
    quietReturnMessage, activeVoice, controlCaption,
    setUrgent, setTextMode, setText, setShowCaptions, acceptProposal,
    declineProposal, switchToVoice, talkPressIn, talkPressOut,
    endVoice, sendText, failedText, waitingForReply, audioLevel,
  } = useTalkSession();
  const { colors, typography } = useTheme();
  const { height, fontScale } = useWindowDimensions();
  const motionAllowed = useTalkMotion(!textMode && !urgent && !showCaptions);
  const conversationScroll = React.useRef<ScrollView>(null);
  React.useEffect(() => {
    if (!textMode) return;
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      requestAnimationFrame(() => conversationScroll.current?.scrollToEnd({ animated: false }));
    });
    return () => subscription.remove();
  }, [textMode]);
  const presentation = talkPresentation(state, sessionEnded, error);
  const hasOffer = !!proposal?.intervention;
  const compact = hasOffer || height < 640 || fontScale > 1.5;
  const accept = () => { if (proposal?.intervention) acceptProposal(proposal.proposal_id); };

  useFocusEffect(React.useCallback(() => () => setShowCaptions(false), [setShowCaptions]));

  const openConversation = () => {
    if (['recording', 'starting', 'connecting', 'reconnecting'].includes(state)) {
      // Cancel capture before the modal takes touch focus; release then only
      // clears pending hold intent because Voice.cancel has cleared the hold.
      activeVoice?.cancel();
      talkPressOut();
    }
    setShowCaptions(true);
  };

  const openHelp = () => {
    activeVoice?.cancel();
    Alert.alert('Help', 'Choose a support route or urgent help.', [
      {
        text: 'Support route',
        onPress: () => Alert.alert('Support route', 'This prototype is not connected to Mpower support. Ask the Mpower team which route belongs here.'),
      },
      { text: 'Urgent help now', onPress: () => setUrgent(true) },
      { text: 'Close', style: 'cancel' },
    ]);
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.page, { backgroundColor: colors.canvas }]}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TalkHeader onHelp={openHelp} callLabel={isCallLive(call.state) ? 'Return to call' : 'Call Mira'} onCall={() => {
          if (!isCallLive(call.state)) {
            endVoice();
            void callController.start();
          }
          router.push('/call');
        }} />
        {urgent ? <UrgentHelpPanel onClose={() => setUrgent(false)} /> : <>
          {textMode ? <>
            <ScrollView
              ref={conversationScroll}
              style={styles.page}
              contentContainerStyle={styles.textContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              onLayout={() => conversationScroll.current?.scrollToEnd({ animated: false })}
              onContentSizeChange={() => conversationScroll.current?.scrollToEnd({ animated: false })}
            >
              {!!quietReturnMessage && <View style={[styles.quietReturn, { backgroundColor: colors.soft }]}>
                <Text accessibilityLiveRegion="polite" style={[typography.body, { color: colors.ink }]}>{quietReturnMessage}</Text>
                <ActionButton label="Resume voice" variant="quiet" onPress={switchToVoice} style={styles.resumeVoice} />
              </View>}
              <TalkTextPanel
                messages={messages}
                title="Your conversation will appear here."
                contextMatches={contextMatches}
                decision={proposal}
                onAccept={accept}
                onDecline={() => void declineProposal()}
                failedText={failedText}
                error={error}
                waitingForReply={waitingForReply}
                onRetry={() => void sendText(failedText)}
              />
            </ScrollView>
            <TalkTextComposer text={text} onChangeText={setText} onSend={() => void sendText()} sending={sending} onSwitchToVoice={switchToVoice} />
          </> : <>
            <ScrollView style={styles.page} contentContainerStyle={styles.voiceContent} keyboardShouldPersistTaps="handled">
              <PresenceHero
                state={state}
                title={presentation.title}
                subtitle={presentation.subtitle}
                audioLevel={audioLevel}
                compact={compact}
                welcome={!messages.length}
                motionAllowed={motionAllowed}
                onConversation={openConversation}
              />
              <TalkVoicePanel
                decision={proposal}
                onAccept={accept}
                onDecline={() => void declineProposal()}
                showSupportNote={moment.support_mode === 'suggest_human_support'}
                hasContext={!!contextMatches.length}
              />
            </ScrollView>
            <TalkCallControls
              state={state}
              textMode={textMode}
              caption={!sessionEnded && ['ready', 'idle', 'disconnected'].includes(state) ? 'Hold to talk' : controlCaption}
              compact={height < 640 || fontScale > 1.5}
              onToggleMode={() => setTextMode(true)}
              onTalkPressIn={talkPressIn}
              onTalkPressOut={talkPressOut}
              onEnd={endVoice}
            />
          </>}
        </>}
      </KeyboardAvoidingView>
      <TalkConversationSheet visible={showCaptions && !textMode && !urgent} onClose={() => setShowCaptions(false)} messages={messages} contextMatches={contextMatches} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  voiceContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8, gap: 8, width: '100%', maxWidth: 660, alignSelf: 'center' },
  textContent: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 8, paddingBottom: 18, gap: 14, width: '100%', maxWidth: 660, alignSelf: 'center' },
  quietReturn: { padding: 14, borderRadius: 16, gap: 8 },
  resumeVoice: { alignSelf: 'flex-start' },
});
