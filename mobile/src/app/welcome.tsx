import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BrandArtwork } from '../components/ui/BrandArtwork';
import { useTheme } from '../components/ui/theme';
import { useFirstRun } from '../shared/FirstRunProvider';

const wordmark = require('../../assets/brand/mira-signature.png');

export function WelcomeScreen({ replay = false }: { replay?: boolean }) {
  const { colors, typography } = useTheme();
  const { finishWelcome } = useFirstRun();
  const [page, setPage] = React.useState(0);
  const [busy, setBusy] = React.useState(false);

  async function continueToMira() {
    if (busy) return;
    if (page === 0) {
      setPage(1);
      return;
    }
    setBusy(true);
    try {
      await finishWelcome();
      if (replay && router.canGoBack()) router.back();
    } finally {
      setBusy(false);
    }
  }

  async function skip() {
    if (busy) return;
    setBusy(true);
    try {
      await finishWelcome();
      if (replay && router.canGoBack()) router.back();
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={[styles.page, { backgroundColor: colors.canvas }]}>
      <View style={styles.brandRow}>
        <Image source={wordmark} resizeMode="contain" accessibilityLabel="Mira" style={[styles.wordmark, { tintColor: colors.primary }]} />
        <Pressable accessibilityRole="button" accessibilityLabel="Skip introduction" disabled={busy} onPress={() => void skip()}
          style={({ pressed }) => [styles.skip, { borderColor: colors.line }, pressed && styles.pressed]}>
          <Text style={[typography.button, { color: colors.muted }]}>{busy ? ' ' : 'Skip'}</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <BrandArtwork part={page === 0 ? 'listening' : 'companion'} size={page === 0 ? 164 : 148} />
        {page === 0 ? (
          <>
            <Text accessibilityRole="header" style={[typography.screenTitle, styles.title, { color: colors.ink }]}>Meet Mira</Text>
            <Text style={[typography.body, styles.intro, { color: colors.muted }]}>Talk things through and find a next step that feels right for you.</Text>
            <View style={[styles.modeCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Text style={[typography.sheetSection, { color: colors.ink }]}>Talk</Text>
              <Text style={[typography.support, styles.cardBody, { color: colors.muted }]}>Chat by text or hold to talk. Release the button when you finish speaking.</Text>
            </View>
            <View style={[styles.modeCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Text style={[typography.sheetSection, { color: colors.ink }]}>Call Mira</Text>
              <Text style={[typography.support, styles.cardBody, { color: colors.muted }]}>Speak naturally. Mute or end the call whenever you want.</Text>
            </View>
          </>
        ) : (
          <>
            <Text accessibilityRole="header" style={[typography.screenTitle, styles.title, { color: colors.ink }]}>A space that stays yours</Text>
            <Text style={[typography.body, styles.intro, { color: colors.muted }]}>Your Journal entries stay on this device.</Text>
            <View style={[styles.noteCard, { backgroundColor: colors.soft }]}>
              <Text style={[typography.sheetSection, styles.noteTitle, { color: colors.ink }]}>Your microphone</Text>
              <Text style={[typography.body, styles.noteBody, { color: colors.ink }]}>Talk listens only while you hold the button. A Call Mira call uses your microphone until you mute or end it. Mira asks for permission when you choose voice.</Text>
            </View>
            <View style={[styles.allowanceCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Text style={[typography.sheetSection, { color: colors.ink }]}>Your Mira account</Text>
              <Text style={[typography.support, styles.cardBody, { color: colors.muted }]}>Sign in or create an account to use Mira. Talk and Call Mira need an internet connection.</Text>
            </View>
            <Text style={[typography.support, styles.reviewNote, { color: colors.muted }]}>Your Journal entries stay on this device.</Text>
          </>
        )}
        <View accessibilityLabel={'Introduction, step ' + (page + 1) + ' of 2'} style={styles.progress}>
          {[0, 1].map((index) => <View key={index} style={[styles.progressBar, { backgroundColor: index === page ? colors.primary : colors.line }]} />)}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {page === 1 && <Pressable accessibilityRole="button" disabled={busy} onPress={() => setPage(0)}
          style={({ pressed }) => [styles.back, { borderColor: colors.line }, pressed && styles.pressed]}>
          <Text style={[typography.button, { color: colors.ink }]}>Back</Text>
        </Pressable>}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => void continueToMira()}
          style={({ pressed }) => [styles.primaryButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
          <Text style={[typography.button, styles.primaryLabel, { color: colors.onPrimary }]}>{busy ? 'Opening...' : replay && page === 1 ? 'Done' : page === 0 ? 'Continue' : 'Get started'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

export default WelcomeScreen;

const styles = StyleSheet.create({
  page: { flex: 1 },
  brandRow: { minHeight: 56, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wordmark: { width: 102, height: 36 },
  skip: { minWidth: 64, minHeight: 44, paddingHorizontal: 12, borderWidth: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, gap: 14 },
  title: { textAlign: 'center', maxWidth: 380 },
  intro: { textAlign: 'center', maxWidth: 360, marginBottom: 4 },
  modeCard: { alignSelf: 'stretch', width: '100%', maxWidth: 460, borderWidth: 1, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 16, gap: 4 },
  cardBody: { lineHeight: 21 },
  noteCard: { alignSelf: 'stretch', width: '100%', maxWidth: 460, borderRadius: 20, padding: 20, gap: 8 },
  noteTitle: { textAlign: 'center' },
  noteBody: { textAlign: 'center', lineHeight: 25 },
  allowanceCard: { alignSelf: 'stretch', width: '100%', maxWidth: 460, borderWidth: 1, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  reviewNote: { textAlign: 'center', marginTop: 4 },
  progress: { flexDirection: 'row', gap: 8, paddingTop: 4 },
  progressBar: { width: 24, height: 4, borderRadius: 2 },
  footer: { minHeight: 76, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center' },
  back: { width: 88, minHeight: 52, borderWidth: 1, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { flex: 1, minHeight: 54, maxWidth: 460, borderRadius: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  primaryLabel: { fontSize: 16 },
  pressed: { opacity: 0.72 },
});
