import * as ExpoSplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
} from 'react-native';

import { Colors } from '@/constants/theme';

const MINIMUM_DISPLAY_DURATION = 1400;
const LOGO_REVEAL_DURATION = 450;
const EXIT_DURATION = 260;

const logo = require('@/assets/images/ald-logo.png');

type MobileSplashOverlayProps = {
  onComplete?: () => void;
};

export function MobileSplashOverlay({
  onComplete,
}: MobileSplashOverlayProps) {
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
        onComplete?.();
      });
    }, MINIMUM_DISPLAY_DURATION);

    return () => {
      clearTimeout(timeoutId);
      exitAnimation?.stop();
    };
  }, [onComplete, overlayOpacity, visible]);

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      accessibilityViewIsModal
      accessible
      accessibilityLabel="ALD Motorshop"
      style={[styles.overlay, { opacity: overlayOpacity }]}
    >
      <StatusBar style="dark" />

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

      <Text style={styles.brandName}>ALD Motorshop</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    zIndex: 1000,
  },
  logo: {
    aspectRatio: 1,
    maxWidth: 260,
    width: '60%',
  },
  brandName: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginTop: 24,
  },
});
