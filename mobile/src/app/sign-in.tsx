import React from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import type { FirebaseError } from 'firebase/app';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, useTheme } from '../components/ui';
import { firebaseAuth } from '../shared/firebase';
import { BrandArtwork } from '../components/ui/BrandArtwork';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const wordmark = require('../../assets/brand/mira-signature.png');

function messageFor(error: unknown) {
  const code = (error as FirebaseError | undefined)?.code;
  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password')
    return 'Email or password is incorrect.';
  if (code === 'auth/operation-not-allowed')
    return 'Email and password sign-in is not enabled for this Firebase project.';
  if (code === 'auth/network-request-failed') return 'Could not reach sign-in. Check your connection and try again.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Wait a little, then try again.';
  return 'Sign-in failed. Check your details and try again.';
}

export default function SignInScreen() {
  const { colors, typography } = useTheme();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  async function signIn() {
    if (busy || !email.trim() || !password) return;
    setBusy(true);
    setError('');
    try {
      await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
    } catch (failure) {
      setError(messageFor(failure));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.canvas }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <BrandArtwork part="companion" size={112} />
          <Image source={wordmark} resizeMode="contain" accessibilityLabel="Mira" style={[styles.wordmark, { tintColor: colors.primary }]} />
          <Text style={[typography.screenTitle, styles.title, { color: colors.ink }]}>Welcome back</Text>
          <Text style={[typography.body, styles.subtitle, { color: colors.muted }]}>Sign in with the reviewer account provided with Mira.</Text>
          <TextInput
            accessibilityLabel="Email address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="Email address"
            placeholderTextColor={colors.muted}
            value={email}
            onChangeText={setEmail}
            editable={!busy}
            returnKeyType="next"
            style={[styles.input, typography.body, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface }]}
          />
          <View style={styles.passwordField}>
            <TextInput
              accessibilityLabel="Password"
              autoCapitalize="none"
              autoComplete="current-password"
              textContentType="password"
              placeholder="Password"
              placeholderTextColor={colors.muted}
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
              editable={!busy}
              onSubmitEditing={() => void signIn()}
              returnKeyType="done"
              style={[styles.input, styles.passwordInput, typography.body, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface }]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={passwordVisible ? 'Hide password' : 'Show password'}
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={() => setPasswordVisible((visible) => !visible)}
              hitSlop={8}
              style={styles.passwordToggle}
            >
              <Text style={[typography.button, { color: colors.primary }]}>{passwordVisible ? 'Hide' : 'Show'}</Text>
            </Pressable>
          </View>
          {!!error && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.error }]}>{error}</Text>}
          <ActionButton label="Sign in" loading={busy} disabled={!email.trim() || !password} onPress={() => void signIn()} />
          <Text style={[typography.support, styles.footer, { color: colors.muted }]}>Reviewer access is invitation-only. If your sign-in details do not work, contact the person who shared them.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 28 },
  content: { justifyContent: 'center', gap: 16, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 24 },
  wordmark: { width: 128, height: 42, alignSelf: 'center', marginTop: -8 },
  title: { textAlign: 'center', marginTop: 4 },
  subtitle: { textAlign: 'center', marginBottom: 8 },
  input: { minHeight: 54, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16 },
  passwordField: { justifyContent: 'center' },
  passwordInput: { paddingRight: 76 },
  passwordToggle: { position: 'absolute', right: 16, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  footer: { textAlign: 'center', lineHeight: 21, marginTop: 2 },
});
