import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../components/ui/theme';
import { DEFAULT_THEME_ID, type ThemeId } from '../components/ui/themeTokens';
import { fontSources } from '../components/ui/typography';

// Change locally to preview converted screens; production starts in Warm light.
const DEVELOPMENT_THEME: ThemeId = DEFAULT_THEME_ID;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontSources);

  React.useEffect(() => {
    if (fontError) console.warn('Mira fonts could not load; using system fonts.', fontError);
  }, [fontError]);

  return (
    <SafeAreaProvider>
      <ThemeProvider
        fontsLoaded={fontsLoaded}
        initialThemeId={__DEV__ ? DEVELOPMENT_THEME : DEFAULT_THEME_ID}
      >
        <RootNavigator ready={fontsLoaded || !!fontError} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator({ ready }: { ready: boolean }) {
  const { colors, isDark, themeReady } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.canvas }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {ready && themeReady && (
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="do" options={{ presentation: 'card' }} />
        </Stack>
      )}
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
