import React from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import type { FirebaseError } from 'firebase/app';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, useTheme } from '../components/ui';
import { firebaseAuth } from '../shared/firebase';
import { StyleSheet, Text, TextInput, View } from 'react-native';

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
      <View style={styles.content}>
        <Text style={[typography.screenTitle, { color: colors.ink }]}>Mira</Text>
        <Text style={[typography.body, { color: colors.muted }]}>Sign in to continue.</Text>
        <TextInput
          accessibilityLabel="Email address"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email address"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          editable={!busy}
          returnKeyType="next"
          style={[styles.input, typography.body, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface }]}
        />
        <TextInput
          accessibilityLabel="Password"
          autoCapitalize="none"
          autoComplete="current-password"
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!busy}
          onSubmitEditing={() => void signIn()}
          returnKeyType="done"
          style={[styles.input, typography.body, { color: colors.ink, borderColor: colors.line, backgroundColor: colors.surface }]}
        />
        {!!error && <Text accessibilityLiveRegion="polite" style={[typography.support, { color: colors.error }]}>{error}</Text>}
        <ActionButton label="Sign in" loading={busy} disabled={!email.trim() || !password} onPress={() => void signIn()} />
        <Text style={[typography.support, { color: colors.muted, textAlign: 'center' }]}>Use an account already set up for Mira.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', gap: 16, width: '100%', maxWidth: 480, alignSelf: 'center', padding: 24 },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16 },
});
