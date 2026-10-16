import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { useFonts } from 'expo-font';
import colors from '../theme/colors';
import { initOfflineQueue } from '../lib/offlineQueue';
import { initAudioEngine } from '../lib/sound';
import OfflineSyncBanner from '../components/OfflineSyncBanner';
import AtmosphericBackground from '../components/AtmosphericBackground';
import { FloatingXpProvider } from '../context/FloatingXpContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

function RootNavigator() {
  const { theme, isLight } = useTheme();

  useEffect(() => {
    if (Platform.OS === 'android') {
      RNStatusBar.setBackgroundColor(theme?.bg?.dusk || colors.bg.dusk, true);
    }
    RNStatusBar.setBarStyle(isLight ? 'dark-content' : 'light-content', true);
  }, [theme, isLight]);

  return (
    <View style={[styles.container, { backgroundColor: theme?.bg?.dusk || colors.bg.dusk }]}>
      <StatusBar
        style={isLight ? 'dark' : 'light'}
        backgroundColor={theme?.bg?.dusk || colors.bg.dusk}
        translucent={false}
      />
      <AtmosphericBackground />
      <OfflineSyncBanner />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme?.bg?.dusk || colors.bg.dusk },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="team/[teamId]" options={{ headerShown: false }} />
        <Stack.Screen name="quest/[questId]" options={{ headerShown: false }} />
        <Stack.Screen name="camera/scanner" options={{ headerShown: false }} />
        <Stack.Screen name="challenge/[challengeId]" options={{ headerShown: false }} />
        <Stack.Screen name="admin/dashboard" options={{ headerShown: false }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    initOfflineQueue();
    initAudioEngine();
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    'PressStart2P-Regular': require('../assets/fonts/PressStart2P-Regular.ttf'),
    'Nunito-Regular': require('../assets/fonts/Nunito-Regular.ttf'),
    'Nunito-SemiBold': require('../assets/fonts/Nunito-SemiBold.ttf'),
    'Nunito-Bold': require('../assets/fonts/Nunito-Bold.ttf'),
    'IBMPlexMono-Regular': require('../assets/fonts/IBMPlexMono-Regular.ttf'),
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.accent.gold} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <FloatingXpProvider>
        <RootNavigator />
      </FloatingXpProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.dusk,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
