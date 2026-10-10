import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { CustomerEmptyState, CustomerScreen } from '@/components/customer-screen';
import { Colors, Spacing } from '@/constants/theme';

export default function CartScreen() {
  const router = useRouter();

  return (
    <CustomerScreen>
      <CustomerEmptyState
        description="Your selected motorcycle parts will appear here."
        icon="+"
        title="Your cart is empty."
      />

      <Pressable
        accessibilityLabel="Browse products"
        accessibilityRole="button"
        onPress={() => router.push('/products')}
        style={({ pressed }) => [
          styles.browseButton,
          pressed && styles.browseButtonPressed,
        ]}
      >
        <Text style={styles.browseButtonText}>Browse Products</Text>
      </Pressable>
    </CustomerScreen>
  );
}

const styles = StyleSheet.create({
  browseButton: {
    alignItems: 'center',
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    justifyContent: 'center',
    marginTop: Spacing.three,
    minHeight: 52,
  },
  browseButtonPressed: {
    backgroundColor: '#B95F00',
  },
  browseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
