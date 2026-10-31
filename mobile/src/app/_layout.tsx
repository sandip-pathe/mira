import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../components/ui/theme';
import { DEFAULT_THEME_ID, type ThemeId } from '../components/ui/themeTokens';
import { fontSources } from '../components/ui/typography';
import { AuthProvider, useAuth } from '../shared/AuthProvider';
import { callController } from '../features/call/callController';
import { OngoingCallBar } from '../features/call/OngoingCallBar';
import { FirstRunProvider, useFirstRun } from '../shared/FirstRunProvider';
import { StartupScreen } from '../components/ui/StartupScreen';

void SplashScreen.preventAutoHideAsync().catch(() => {});

// Change locally to preview converted screens; production starts in Warm light.
const DEVELOPMENT_THEME: ThemeId = DEFAULT_THEME_ID;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontSources);

  React.useEffect(() => {
    if (fontError) console.warn('Mira fonts could not load; using system fonts.', fontError);
  }, [fontError]);

  React.useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider
          fontsLoaded={fontsLoaded}
          initialThemeId={__DEV__ ? DEVELOPMENT_THEME : DEFAULT_THEME_ID}
        >
          <AuthProvider>
            <FirstRunProvider>
              <RootNavigator ready={fontsLoaded || !!fontError} />
            </FirstRunProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator({ ready }: { ready: boolean }) {
  const { colors, isDark, themeReady } = useTheme();
  const { user, ready: authReady } = useAuth();
  const { welcomeCompleted } = useFirstRun();
  const userId = user?.uid;
  React.useEffect(() => {
    if (!userId) callController.reset();
    return () => callController.reset();
  }, [userId]);

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {!(ready && themeReady && authReady && welcomeCompleted !== null) && <StartupScreen />}
      {ready && themeReady && authReady && welcomeCompleted !== null && (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
          <Stack.Protected guard={!welcomeCompleted}>
            <Stack.Screen name="welcome" />
          </Stack.Protected>
          <Stack.Protected guard={!user}>
            <Stack.Screen name="sign-in" />
          </Stack.Protected>
          <Stack.Protected guard={!!user}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="do" options={{ presentation: 'card' }} />
            <Stack.Screen name="call" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          </Stack.Protected>
        </Stack>
      )}
      {!!user && welcomeCompleted && ready && themeReady && authReady && <OngoingCallBar />}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
