import type { ReactNode } from 'react';
import {
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CustomerHeader } from '@/components/customer-header';
import { Colors, Spacing } from '@/constants/theme';

type CustomerScreenProps = {
  children: ReactNode;
  showSearch?: boolean;
};

export function CustomerScreen({
  children,
  showSearch = false,
}: CustomerScreenProps) {
  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <CustomerHeader showSearch={showSearch} />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          onScrollBeginDrag={Keyboard.dismiss}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

type CustomerEmptyStateProps = {
  description: string;
  icon: string;
  title: string;
};

export function CustomerEmptyState({
  description,
  icon,
  title,
}: CustomerEmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>{icon}</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 44,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  emptyState: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundElement,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: 40,
  },
  emptyIcon: {
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    marginBottom: Spacing.three,
    width: 56,
  },
  emptyIconText: {
    color: Colors.light.primary,
    fontSize: 26,
    fontWeight: '700',
  },
  emptyTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyDescription: {
    color: Colors.light.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: Spacing.two,
    maxWidth: 300,
    textAlign: 'center',
  },
});
