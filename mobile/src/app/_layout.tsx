import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AuthProvider } from '@/components/auth/AuthProvider';
import { MobileOnboardingOverlay } from '@/components/onboarding-screen';
import { MobileSplashOverlay } from '@/components/splash-screen';
import AppTabs from '@/components/app-tabs';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const handleSplashComplete = useCallback(() => {
    setShowOnboarding(true);
  }, []);
  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AuthProvider>
        <AppTabs />
        <MobileSplashOverlay onComplete={handleSplashComplete} />
        {showOnboarding ? (
          <MobileOnboardingOverlay onComplete={handleOnboardingComplete} />
        ) : null}
      </AuthProvider>
    </ThemeProvider>
  );
}
