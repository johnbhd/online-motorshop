import { StyleSheet, Text, View } from 'react-native';

import { CustomerScreen } from '@/components/customer-screen';
import { Colors, Spacing } from '@/constants/theme';

export default function CategoriesScreen() {
  return (
    <CustomerScreen showSearch>
      <Text style={styles.eyebrow}>DISCOVER YOUR OPTIONS</Text>
      <Text style={styles.title}>Categories & Brands</Text>
      <Text style={styles.description}>
        Browse motorcycle parts by category or manufacturer when the catalog is
        connected.
      </Text>

      <View style={styles.optionCard}>
        <View style={styles.optionIcon}>
          <Text style={styles.optionIconText}>C</Text>
        </View>
        <View style={styles.optionCopy}>
          <Text style={styles.optionTitle}>Categories</Text>
          <Text style={styles.optionDescription}>
            Engine, brake, electrical, suspension, and more.
          </Text>
        </View>
      </View>

      <View style={styles.optionCard}>
        <View style={styles.optionIcon}>
          <Text style={styles.optionIconText}>M</Text>
        </View>
        <View style={styles.optionCopy}>
          <Text style={styles.optionTitle}>Brands</Text>
          <Text style={styles.optionDescription}>
            Honda, Yamaha, Suzuki, and compatible models.
          </Text>
        </View>
      </View>
    </CustomerScreen>
  );
}

const styles = StyleSheet.create({
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
  optionCard: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundElement,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: Spacing.three,
    padding: Spacing.three,
  },
  optionIcon: {
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  optionIconText: {
    color: Colors.light.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  optionCopy: {
    flex: 1,
    marginLeft: Spacing.three,
  },
  optionTitle: {
    color: Colors.light.text,
    fontSize: 17,
    fontWeight: '800',
  },
  optionDescription: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.one,
  },
});
