import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';

const MINIMUM_DISPLAY_DURATION = 1400;
const LOGO_REVEAL_DURATION = 450;
const EXIT_DURATION = 260;

const logo = require('@/assets/images/ald-logo.png');

export function MobileSplashOverlay() {
  const [visible, setVisible] = useState(true);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.96)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const revealAnimation = Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: LOGO_REVEAL_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: LOGO_REVEAL_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    revealAnimation.start();

    return () => {
      revealAnimation.stop();
    };
  }, [logoOpacity, logoScale]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let exitAnimation: Animated.CompositeAnimation | null = null;
    const timeoutId = setTimeout(() => {
      exitAnimation = Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: EXIT_DURATION,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      });

      exitAnimation.start(({ finished }) => {
        if (!finished) {
          return;
        }

        setVisible(false);
        void ExpoSplashScreen.hideAsync();
      });
    }, MINIMUM_DISPLAY_DURATION);

    return () => {
      clearTimeout(timeoutId);
      exitAnimation?.stop();
    };
  }, [overlayOpacity, visible]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      accessibilityViewIsModal
      accessible
      accessibilityLabel="ALD Motorshop is loading"
      style={[styles.overlay, { opacity: overlayOpacity }]}
    >
      <StatusBar style="light" />

      <Animated.Image
        accessibilityLabel="ALD Motorshop logo"
        resizeMode="contain"
        source={logo}
        style={[
          styles.logo,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      />

      <View
        accessible
        accessibilityLabel="Loading"
        style={styles.loadingState}
      >
        <ActivityIndicator
          accessibilityLabel="Loading ALD Motorshop"
          color={Colors.dark.primary}
          size="small"
        />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    justifyContent: 'center',
    zIndex: 1000,
  },
  logo: {
    aspectRatio: 1,
    maxWidth: 260,
    width: '60%',
  },
  loadingState: {
    alignItems: 'center',
    gap: 12,
    marginTop: 28,
  },
  loadingText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
