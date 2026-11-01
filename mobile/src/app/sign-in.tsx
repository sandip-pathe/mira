import React from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import type { FirebaseError } from 'firebase/app';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, useTheme } from '../components/ui';
import { firebaseAuth } from '../shared/firebase';
import { BrandArtwork } from '../components/ui/BrandArtwork';
import { Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const wordmark = require('../../assets/brand/mira-signature.png');

function messageFor(error: unknown, registering: boolean) {
  const code = (error as FirebaseError | undefined)?.code;
  if (registering && code === 'auth/email-already-in-use') return 'An account already uses this email. Sign in instead.';
  if (code === 'auth/invalid-email') return 'Enter a valid email address.';
  if (registering && code === 'auth/weak-password') return 'Choose a stronger password with at least 6 characters.';
  if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password')
    return 'Email or password is incorrect.';
  if (code === 'auth/operation-not-allowed')
    return 'Email and password accounts are not enabled for this Firebase project.';
  if (code === 'auth/network-request-failed') return 'Could not reach Mira. Check your connection and try again.';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Wait a little, then try again.';
  return registering ? 'Could not create the account. Check your details and try again.' : 'Sign-in failed. Check your details and try again.';
}

export default function SignInScreen() {
  const { colors, typography } = useTheme();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [registering, setRegistering] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [keyboardOpen, setKeyboardOpen] = React.useState(false);

  React.useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  async function submit() {
    if (busy || !email.trim() || !password) return;
    if (registering && password !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      if (registering) await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
      else await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
    } catch (failure) {
      setError(messageFor(failure, registering));
    } finally {
      setBusy(false);
    }
  }

  function changeMode() {
    Keyboard.dismiss();
    setRegistering((value) => !value);
    setError('');
    setConfirmPassword('');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.canvas }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={[styles.scroll, keyboardOpen && styles.scrollWithKeyboard]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <View style={[styles.content, keyboardOpen && styles.contentWithKeyboard]}>
            {!keyboardOpen && <>
              <View style={styles.artwork}><BrandArtwork part="companion" size={112} /></View>
              <Image source={wordmark} resizeMode="contain" accessibilityLabel="Mira" style={[styles.wordmark, { tintColor: colors.primary }]} />
            </>}
            <Text style={[typography.screenTitle, styles.title, { color: colors.ink }]}>{registering ? 'Create your account' : 'Welcome back'}</Text>
            {!keyboardOpen && <Text style={[typography.body, styles.subtitle, { color: colors.muted }]}>
              {registering ? 'Create an account to start using Mira.' : 'Sign in to continue to Mira.'}
            </Text>}
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
                autoComplete={registering ? 'new-password' : 'current-password'}
                textContentType={registering ? 'newPassword' : 'password'}
                placeholder="Password"
                placeholderTextColor={colors.muted}
                secureTextEntry={!passwordVisible}
                value={password}
                onChangeText={setPassword}
                editable={!busy}
                onSubmitEditing={() => registering ? undefined : void submit()}
                returnKeyType={registering ? 'next' : 'done'}
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
            {registering && (
              <TextInput
                accessibilityLabel="Confirm password"
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                placeholder="Confirm password"
                placeholderTextColor={colors.muted}
                secureTextEntry={!passwordVisible}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!busy}
                onSubmitEditing={() => void submit()}
                returnKeyType="done"
                style={[styles.input, typography.body, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface }]}
              />
            )}
            {!!error && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.error }]}>{error}</Text>}
            <ActionButton
              label={registering ? 'Create account' : 'Sign in'}
              loading={busy}
              disabled={!email.trim() || !password || (registering && !confirmPassword)}
              onPress={() => void submit()}
            />
            <Pressable accessibilityRole="button" disabled={busy} onPress={changeMode} hitSlop={8} style={styles.modeToggle}>
              <Text style={[typography.support, { color: colors.muted }]}>
                {registering ? 'Already have an account? ' : 'New to Mira? '}
                <Text style={{ color: colors.primary }}>{registering ? 'Sign in' : 'Create account'}</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingVertical: 28 },
  scrollWithKeyboard: { justifyContent: 'center', paddingVertical: 8 },
  content: { justifyContent: 'center', gap: 16, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 24 },
  contentWithKeyboard: { justifyContent: 'flex-start', gap: 12 },
  artwork: { alignItems: 'center' },
  wordmark: { width: 128, height: 42, alignSelf: 'center', marginTop: -8 },
  title: { textAlign: 'center', marginTop: 4 },
  subtitle: { textAlign: 'center', marginBottom: 8 },
  input: { minHeight: 54, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16 },
  passwordField: { justifyContent: 'center' },
  passwordInput: { paddingRight: 76 },
  passwordToggle: { position: 'absolute', right: 16, minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  modeToggle: { alignItems: 'center', paddingVertical: 8 },
});
