import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { BrandArtwork } from '../components/ui/BrandArtwork';
import { useTheme } from '../components/ui/theme';
import { useFirstRun } from '../shared/FirstRunProvider';

const wordmark = require('../../assets/brand/mira-signature.png');

export function WelcomeScreen({ replay = false }: { replay?: boolean }) {
  const { colors, typography } = useTheme();
  const { finishWelcome } = useFirstRun();
  const { width } = useWindowDimensions();
  const pager = React.useRef<ScrollView>(null);
  const [page, setPage] = React.useState(0);
  const [busy, setBusy] = React.useState(false);

  async function continueToMira() {
    if (busy) return;
    if (page === 0) {
      setPage(1);
      pager.current?.scrollTo({ x: width, animated: true });
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

  function goToPage(nextPage: number) {
    setPage(nextPage);
    pager.current?.scrollTo({ x: width * nextPage, animated: true });
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

      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => setPage(Math.round(event.nativeEvent.contentOffset.x / width))}
        style={styles.pager}
      >
        {[0, 1].map((pageIndex) => (
          <ScrollView key={pageIndex} style={{ width }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <BrandArtwork part={pageIndex === 0 ? 'listening' : 'companion'} size={pageIndex === 0 ? 164 : 148} />
            {pageIndex === 0 ? (
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
                  <Text style={[typography.sheetSection, styles.noteTitle, { color: colors.ink }]}>Microphone</Text>
                  <Text style={[typography.support, styles.cardBody, { color: colors.ink }]}>Talk uses your mic while you hold to speak. Calls use it until you mute or end.</Text>
                </View>
                <View style={[styles.allowanceCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
                  <Text style={[typography.sheetSection, { color: colors.ink }]}>Account</Text>
                  <Text style={[typography.support, styles.cardBody, { color: colors.muted }]}>Sign in to use Mira. Talk and calls need internet.</Text>
                </View>
              </>
            )}
            <View accessibilityLabel={'Introduction, step ' + (pageIndex + 1) + ' of 2'} style={styles.progress}>
              {[0, 1].map((index) => <View key={index} style={[styles.progressBar, { backgroundColor: index === pageIndex ? colors.primary : colors.line }]} />)}
            </View>
          </ScrollView>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        {page === 1 && <Pressable accessibilityRole="button" disabled={busy} onPress={() => goToPage(0)}
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
  pager: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 24, gap: 14 },
  title: { textAlign: 'center', maxWidth: 380 },
  intro: { textAlign: 'center', maxWidth: 360, marginBottom: 4 },
  modeCard: { alignSelf: 'stretch', width: '100%', maxWidth: 460, borderWidth: 1, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 16, gap: 4 },
  cardBody: { lineHeight: 21 },
  noteCard: { alignSelf: 'stretch', width: '100%', maxWidth: 460, borderRadius: 20, padding: 20, gap: 8 },
  noteTitle: { textAlign: 'center' },
  allowanceCard: { alignSelf: 'stretch', width: '100%', maxWidth: 460, borderWidth: 1, borderRadius: 18, paddingHorizontal: 20, paddingVertical: 16, gap: 8 },
  progress: { flexDirection: 'row', gap: 8, paddingTop: 4 },
  progressBar: { width: 24, height: 4, borderRadius: 2 },
  footer: { minHeight: 76, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center' },
  back: { width: 88, minHeight: 52, borderWidth: 1, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  primaryButton: { flex: 1, minHeight: 54, maxWidth: 460, borderRadius: 28, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  primaryLabel: { fontSize: 16 },
  pressed: { opacity: 0.72 },
});
