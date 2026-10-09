import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BottomTabInset,
  Colors,
  MaxContentWidth,
  Spacing,
} from '@/constants/theme';

type MobileScreenProps = {
  eyebrow?: string;
  title: string;
  description: string;
  status?: string;
  children?: ReactNode;
};

export function MobileScreen({
  eyebrow = 'ALD MOTORSHOP',
  title,
  description,
  status = 'Mobile foundation in progress',
  children,
}: MobileScreenProps) {
  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <ThemedText type="smallBold" themeColor="primary">
            {eyebrow}
          </ThemedText>

          <View style={styles.brandRule} />

          <ThemedText type="title" style={styles.title}>
            {title}
          </ThemedText>

          <ThemedText themeColor="textSecondary" style={styles.description}>
            {description}
          </ThemedText>

          <ThemedView type="backgroundElement" style={styles.statusCard}>
            <ThemedText type="smallBold">{status}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Customer features will connect to the existing Laravel API in the
              next migration steps.
            </ThemedText>
          </ThemedView>

          {children}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.five,
  },
  brandRule: {
    width: 56,
    height: 4,
    marginTop: Spacing.two,
    marginBottom: Spacing.four,
    borderRadius: 2,
    backgroundColor: Colors.light.primary,
  },
  title: {
    maxWidth: 520,
    fontSize: 40,
    lineHeight: 46,
  },
  description: {
    maxWidth: 560,
    marginTop: Spacing.three,
  },
  statusCard: {
    gap: Spacing.two,
    marginTop: Spacing.five,
    padding: Spacing.four,
    borderRadius: Spacing.three,
  },
});
