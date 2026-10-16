import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTalkSession } from './hooks/useTalkSession';
import { TalkCallControls } from './components/TalkCallControls';
import { TalkHeader } from './components/TalkHeader';
import { TalkTextPanel } from './components/TalkTextPanel';
import { TalkVoicePanel } from './components/TalkVoicePanel';
import { UrgentHelpPanel } from './components/UrgentHelpPanel';

function Mira() {
  const {
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
      <TalkHeader ready={ready} error={error} status={statusText} onHelp={() => openOnhelp()} />
      {urgent ? (
        <UrgentHelpPanel onClose={() => setUrgent(false)} />
      ) : (
        <>
          <ScrollView
            style={styles.mainScroll}
            contentContainerStyle={styles.mainContent}
            keyboardShouldPersistTaps="handled"
          >
            {!textMode ? (
              <TalkVoicePanel
                state={state}
                error={error}
                title={heroTitle}
                subtitle={heroSubtitle}
                decision={proposal}
                onAccept={() => {
                  if (proposal?.intervention) openIntervention(proposal.intervention);
                }}
                onDecline={() => void declineProposal()}
                showSupportNote={moment.support_mode === 'suggest_human_support'}
                showDetails={showCaptions}
                onToggleDetails={() => setShowCaptions((value) => !value)}
                contextNotice={contextNotice}
                contextMatches={contextMatches}
                messages={messages}
              />
            ) : (
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
                error={error}
                text={text}
                onChangeText={setText}
                onSend={() => void sendText()}
                sending={sending}
              />
            )}
          </ScrollView>
          <TalkCallControls
            state={state}
            error={error}
            textMode={textMode}
            ready={ready}
            voice={activeVoice}
            caption={controlCaption}
            onToggleMode={() => {
              if (textMode) {
                setTextMode(false);
                if (!ready) void connect();
              } else {
                stopVoice();
                setTextMode(true);
              }
            }}
            onConnect={() => void connect()}
            onEnd={() => {
              stopVoice();
              setTextMode(false);
              setSessionEnded(true);
              setError('');
            }}
          />
        </>
      )}
    </SafeAreaView>
  );
}

export default Mira;

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#F2F3EC' },
  mainScroll: { flex: 1 },
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
