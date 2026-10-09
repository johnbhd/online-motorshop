import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CustomerScreen } from '@/components/customer-screen';
import { Colors, Spacing } from '@/constants/theme';

const discoveryOptions = [
  { label: 'Honda', color: '#D94242' },
  { label: 'Yamaha', color: '#2C5AA0' },
  { label: 'Suzuki', color: '#3E77B6' },
];

export function HomeScreen() {
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
      </View>

      <View style={styles.brandRow}>
        {discoveryOptions.map((option) => (
          <Pressable
            accessibilityLabel={`Browse ${option.label} parts`}
            accessibilityRole="button"
            key={option.label}
            onPress={() => undefined}
            style={({ pressed }) => [styles.brandCard, pressed && styles.pressed]}
          >
            <View style={[styles.brandDot, { backgroundColor: option.color }]} />
            <Text style={styles.brandLabel}>{option.label}</Text>
          </Pressable>
        ))}
      </View>
    </CustomerScreen>
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
    marginTop: Spacing.four,
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
  brandRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  brandCard: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundElement,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 50,
    minWidth: 0,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  brandDot: {
    borderRadius: 5,
    height: 10,
    marginRight: Spacing.two,
    width: 10,
  },
  brandLabel: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.65,
  },
});
