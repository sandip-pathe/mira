import React from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTalkSession } from './hooks/useTalkSession';
import { TalkCallControls } from './components/TalkCallControls';
import { TalkHeader } from './components/TalkHeader';
import { TalkTextPanel } from './components/TalkTextPanel';
import { TalkTextComposer } from './components/TalkTextComposer';
import { TalkVoicePanel } from './components/TalkVoicePanel';
import { PresenceHero } from './components/PresenceHero';
import { UrgentHelpPanel } from './components/UrgentHelpPanel';

function Mira() {
  const {
    messages,
    state,
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
    activeVoice,
    controlCaption,
    heroTitle,
    heroSubtitle,
    setUrgent,
    setTextMode,
    setText,
    setShowCaptions,
    openIntervention,
    declineProposal,
    switchToVoice,
    talkPressIn,
    talkPressOut,
    endVoice,
    sendText,
    failedText,
    waitingForReply,
    audioLevel,
  } = useTalkSession();

  const openOnhelp = () => {
    {
      activeVoice?.cancel();
      Alert.alert('Help', 'Choose a support route or urgent help.', [
        {
          text: 'Support route',
          onPress: () =>
            Alert.alert(
              'Support route',
              'This prototype is not connected to Mpower support. Ask the Mpower team which route belongs here.',
            ),
        },
        { text: 'Urgent help now', onPress: () => setUrgent(true) },
        { text: 'Close', style: 'cancel' },
      ]);
    }
  };

  return (
    <SafeAreaView style={styles.page}>
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TalkHeader onHelp={openOnhelp} />
        {urgent ? (
          <UrgentHelpPanel onClose={() => setUrgent(false)} />
        ) : (
          <>
            {!textMode ? (
              <View style={styles.voiceBody}>
                <ScrollView
                  style={[styles.voiceDetails, showCaptions && styles.voiceDetailsExpanded]}
                  contentContainerStyle={styles.voiceDetailsContent}
                  keyboardShouldPersistTaps="handled"
                >
                  <TalkVoicePanel
                    decision={proposal}
                    onAccept={() => {
                      if (proposal?.intervention) openIntervention(proposal.intervention);
                    }}
                    onDecline={() => void declineProposal()}
                    showSupportNote={moment.support_mode === 'suggest_human_support'}
                    showDetails={showCaptions}
                    contextNotice={contextNotice}
                    contextMatches={contextMatches}
                    messages={messages}
                  />
                </ScrollView>
                <View style={[styles.presenceSlot, showCaptions && styles.expandedPresenceSlot]}>
                  <PresenceHero
                    state={state}
                    title={heroTitle || (messages.length === 0 ? "What's on your mind?" : '')}
                    subtitle={heroSubtitle}
                    audioLevel={audioLevel}
                    compact={showCaptions}
                    welcome={messages.length === 0}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={showCaptions ? 'Hide subtitles' : 'Show subtitles'}
                    accessibilityState={{ selected: showCaptions }}
                    hitSlop={8}
                    onPress={() => setShowCaptions((value) => !value)}
                    style={[
                      styles.subtitlesButton,
                      showCaptions && styles.subtitlesButtonExpanded,
                    ]}
                  >
                    <MaterialDesignIcons
                      name={showCaptions ? 'closed-caption' : 'closed-caption-outline'}
                      size={25}
                      color={showCaptions ? '#163632' : '#657873'}
                    />
                  </Pressable>
                </View>
              </View>
            ) : (
              <ScrollView
                style={styles.mainScroll}
                contentContainerStyle={styles.mainContent}
                keyboardShouldPersistTaps="handled"
              >
                {!!quietReturnMessage && (
                  <View style={styles.quietReturnNote}>
                    <Text accessibilityLiveRegion="polite" style={styles.quietReturnText}>
                      {quietReturnMessage}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Resume voice when ready"
                      onPress={switchToVoice}
                      style={styles.resumeVoiceButton}
                    >
                      <Text style={styles.resumeVoiceText}>Resume voice</Text>
                    </Pressable>
                  </View>
                )}
                <TalkTextPanel
                  messages={messages}
                  title={heroTitle}
                  contextNotice={contextNotice}
                  contextMatches={contextMatches}
                  decision={proposal}
                  onAccept={() => {
                    if (proposal?.intervention) openIntervention(proposal.intervention);
                  }}
                  onDecline={() => void declineProposal()}
                  failedText={failedText}
                  waitingForReply={waitingForReply}
                  onRetry={() => void sendText(failedText)}
                />
              </ScrollView>
            )}
            {textMode ? (
              <TalkTextComposer
                text={text}
                onChangeText={setText}
                onSend={() => void sendText()}
                sending={sending}
                onSwitchToVoice={switchToVoice}
              />
            ) : (
              <TalkCallControls
                state={state}
                textMode={textMode}
                caption={controlCaption}
                onToggleMode={() => setTextMode(true)}
                onTalkPressIn={talkPressIn}
                onTalkPressOut={talkPressOut}
                onEnd={endVoice}
              />
            )}
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default Mira;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F2F3EC' },
  keyboardArea: { flex: 1 },
  mainScroll: { flex: 1 },
  presenceSlot: { flex: 1, width: '100%', maxWidth: 660, position: 'relative' },
  expandedPresenceSlot: { flex: 0, height: 136, marginTop: 8 },
  subtitlesButton: {
    position: 'absolute',
    right: 22,
    top: '50%',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -18 }],
  },
  subtitlesButtonExpanded: { top: 8, transform: [] },
  voiceDetails: {
    flex: 0,
    flexShrink: 1,
    maxWidth: 660,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 22,
  },
  voiceBody: { flex: 1, alignItems: 'center', width: '100%' },
  voiceDetailsExpanded: { flex: 1 },
  voiceDetailsContent: { paddingTop: 4, paddingBottom: 8, gap: 14 },
  quietReturnNote: { width: '100%', maxWidth: 660, alignSelf: 'center', marginBottom: 10, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#C7D4C4', backgroundColor: '#EAF0E6', gap: 6 },
  quietReturnText: { color: '#294A3D', fontSize: 15, lineHeight: 21 },
  resumeVoiceButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', paddingHorizontal: 10 },
  resumeVoiceText: { color: '#2F704F', fontSize: 15, fontWeight: '700' },
  mainContent: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 14,
    maxWidth: 660,
    width: '100%',
    alignSelf: 'center',
  },
});
