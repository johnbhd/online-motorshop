import { CustomerScreen } from '@/components/customer-screen';
import { Colors, Spacing } from '@/constants/theme';
import { StyleSheet, Text } from 'react-native';

export default function ProductsScreen() {
  return (
    <CustomerScreen>
      <Text style={styles.eyebrow}>PRODUCT DISCOVERY</Text>
      <Text style={styles.title}>Motorcycle Parts</Text>
      <Text style={styles.description}>
        The mobile catalog will bring ALD Motorshop products, categories,
        brands, search, and filters into a native browsing experience.
      </Text>
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
});
