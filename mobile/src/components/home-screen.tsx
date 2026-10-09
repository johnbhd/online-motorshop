import { StyleSheet, Text, View } from 'react-native';

import { CustomerScreen } from '@/components/customer-screen';
import { ProductSkeletonCard } from '@/components/product-skeleton-card';
import { Colors, Spacing } from '@/constants/theme';

export function HomeScreen() {
  return (
    <CustomerScreen showSearch>
      <View style={styles.introSection}>
        <Text style={styles.eyebrow}>GENUINE MOTORCYCLE PARTS</Text>
        <Text style={styles.title}>Ride ready with the right parts.</Text>
        <Text style={styles.description}>
          Browse parts for Honda, Yamaha, and Suzuki, then prepare your order
          request from your phone.
        </Text>
      </View>

      <View style={styles.highlightRow}>
        <Highlight label="Genuine parts" />
        <Highlight label="Guest ordering" />
        <Highlight label="Pickup or delivery" />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>EXPLORE THE CATALOG</Text>
          <Text style={styles.sectionTitle}>Featured Products</Text>
        </View>
      </View>

      <View style={styles.skeletonRow}>
        <ProductSkeletonCard />
        <ProductSkeletonCard />
      </View>
      <View style={styles.skeletonRow}>
        <ProductSkeletonCard />
        <ProductSkeletonCard />
      </View>
    </CustomerScreen>
  );
}

function Highlight({ label }: { label: string }) {
  return (
    <View style={styles.highlight}>
      <View style={styles.highlightDot} />
      <Text style={styles.highlightText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  introSection: {
    backgroundColor: Colors.light.backgroundElement,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
  },
  eyebrow: {
    color: Colors.light.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    color: Colors.light.text,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    marginTop: Spacing.two,
  },
  description: {
    color: Colors.light.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: Spacing.two,
  },
  highlightRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  highlight: {
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 8,
    flex: 1,
    minHeight: 58,
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.two,
  },
  highlightDot: {
    backgroundColor: Colors.light.primary,
    borderRadius: 5,
    height: 10,
    marginBottom: Spacing.one,
    width: 10,
  },
  highlightText: {
    color: Colors.light.text,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
    marginTop: Spacing.five,
  },
  sectionEyebrow: {
    color: Colors.light.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  skeletonRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
});
