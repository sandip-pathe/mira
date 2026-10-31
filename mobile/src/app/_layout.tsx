import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../components/ui/theme';
import { DEFAULT_THEME_ID, type ThemeId } from '../components/ui/themeTokens';
import { fontSources } from '../components/ui/typography';
import { AuthProvider, useAuth } from '../shared/AuthProvider';

// Change locally to preview converted screens; production starts in Warm light.
const DEVELOPMENT_THEME: ThemeId = DEFAULT_THEME_ID;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontSources);

  React.useEffect(() => {
    if (fontError) console.warn('Mira fonts could not load; using system fonts.', fontError);
  }, [fontError]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider
          fontsLoaded={fontsLoaded}
          initialThemeId={__DEV__ ? DEVELOPMENT_THEME : DEFAULT_THEME_ID}
        >
          <AuthProvider>
            <RootNavigator ready={fontsLoaded || !!fontError} />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator({ ready }: { ready: boolean }) {
  const { colors, isDark, themeReady } = useTheme();
  const { user, ready: authReady } = useAuth();

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {ready && themeReady && authReady && (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
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
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
