import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { CustomerScreen } from '@/components/customer-screen';
import { ProductSkeletonCard } from '@/components/product-skeleton-card';
import { Colors, Spacing } from '@/constants/theme';

const discoveryOptions = [
  { label: 'Honda', color: '#D94242' },
  { label: 'Yamaha', color: '#2C5AA0' },
  { label: 'Suzuki', color: '#3E77B6' },
];

const serviceHighlights = [
  'Genuine parts',
  'Guest ordering',
  'Pickup or delivery',
];

export function HomeScreen() {
  const router = useRouter();

  return (
    <CustomerScreen>
      <View style={styles.heroCard}>
        <View style={styles.heroCopy}>
          <Text style={styles.heroEyebrow}>GENUINE MOTORCYCLE PARTS</Text>
          <Text style={styles.heroTitle}>Ride ready with the right parts.</Text>
          <Text style={styles.heroDescription}>
            Browse parts for Honda, Yamaha, and Suzuki, then prepare your order
            request from your phone.
          </Text>

          <View style={styles.heroBrandRow}>
            <Text style={styles.heroBrandLabel}>Honda</Text>
            <Text style={styles.heroBrandSeparator}>•</Text>
            <Text style={styles.heroBrandLabel}>Yamaha</Text>
            <Text style={styles.heroBrandSeparator}>•</Text>
            <Text style={styles.heroBrandLabel}>Suzuki</Text>
          </View>
        </View>

        <View accessibilityElementsHidden style={styles.heroGraphic}>
          <View style={styles.heroGraphicRing} />
          <View style={styles.heroGraphicBlock} />
          <View style={styles.heroGraphicDot} />
        </View>
      </View>

      <View style={styles.sectionHeaderCompact}>
        <View>
          <Text style={styles.sectionEyebrow}>SHOP BY MAKE</Text>
          <Text style={styles.sectionTitle}>Find your fit</Text>
        </View>
        <Pressable
          accessibilityLabel="Browse categories"
          accessibilityRole="button"
          onPress={() => router.push('/categories')}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.textLink}>Categories</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.discoveryContent}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {discoveryOptions.map((option) => (
          <View key={option.label} style={styles.discoveryChip}>
            <View style={[styles.discoveryDot, { backgroundColor: option.color }]} />
            <Text style={styles.discoveryLabel}>{option.label}</Text>
          </View>
        ))}
        <Pressable
          accessibilityLabel="Browse categories"
          accessibilityRole="button"
          onPress={() => router.push('/categories')}
          style={({ pressed }) => [
            styles.discoveryChip,
            styles.categoryChip,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.categoryChipLabel}>Categories</Text>
          <Text style={styles.categoryChipArrow}>&gt;</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.highlightRow}>
        {serviceHighlights.map((label) => (
          <Highlight key={label} label={label} />
        ))}
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionEyebrow}>EXPLORE THE CATALOG</Text>
          <Text style={styles.sectionTitle}>Featured Products</Text>
        </View>
        <Pressable
          accessibilityLabel="See all products"
          accessibilityRole="button"
          onPress={() => router.push('/products')}
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.textLink}>See All</Text>
        </Pressable>
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
  heroCard: {
    backgroundColor: Colors.light.text,
    borderRadius: 18,
    flexDirection: 'row',
    minHeight: 224,
    overflow: 'hidden',
    padding: Spacing.four,
    position: 'relative',
  },
  heroCopy: {
    flex: 1,
    zIndex: 1,
  },
  heroEyebrow: {
    color: Colors.light.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 29,
    fontWeight: '800',
    lineHeight: 34,
    marginTop: Spacing.two,
    maxWidth: 250,
  },
  heroDescription: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.two,
    maxWidth: 255,
  },
  heroBrandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: Spacing.three,
  },
  heroBrandLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  heroBrandSeparator: {
    color: Colors.light.primary,
    fontSize: 13,
    marginHorizontal: Spacing.one,
  },
  heroGraphic: {
    height: 170,
    position: 'absolute',
    right: -20,
    top: 25,
    width: 140,
  },
  heroGraphicRing: {
    borderColor: Colors.light.primary,
    borderRadius: 75,
    borderWidth: 18,
    height: 150,
    opacity: 0.85,
    position: 'absolute',
    right: -18,
    top: 4,
    width: 150,
  },
  heroGraphicBlock: {
    backgroundColor: '#16234A',
    borderColor: '#33436D',
    borderRadius: 12,
    borderWidth: 1,
    height: 74,
    position: 'absolute',
    right: 35,
    top: 47,
    transform: [{ rotate: '-14deg' }],
    width: 52,
  },
  heroGraphicDot: {
    backgroundColor: '#FFFFFF',
    borderRadius: 7,
    height: 14,
    position: 'absolute',
    right: 47,
    top: 77,
    width: 14,
  },
  sectionHeaderCompact: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.five,
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
  textLink: {
    color: Colors.light.primary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  discoveryContent: {
    gap: Spacing.two,
    paddingRight: Spacing.four,
    paddingTop: Spacing.three,
  },
  discoveryChip: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundElement,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  discoveryDot: {
    borderRadius: 5,
    height: 10,
    marginRight: Spacing.two,
    width: 10,
  },
  discoveryLabel: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '800',
  },
  categoryChip: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F7C98C',
  },
  categoryChipLabel: {
    color: Colors.light.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  categoryChipArrow: {
    color: Colors.light.primary,
    fontSize: 17,
    marginLeft: Spacing.two,
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
  skeletonRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  pressed: {
    opacity: 0.65,
  },
});
