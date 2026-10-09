import { StyleSheet, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

export function ProductSkeletonCard() {
  return (
    <View
      accessible
      accessibilityLabel="Loading product placeholder"
      style={styles.card}
    >
      <View style={styles.imagePlaceholder} />
      <View style={styles.smallLine} />
      <View style={styles.nameLine} />
      <View style={styles.priceLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.backgroundElement,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    minWidth: 0,
    padding: Spacing.two,
  },
  imagePlaceholder: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    height: 112,
    width: '100%',
  },
  smallLine: {
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    height: 8,
    marginTop: Spacing.two,
    width: '42%',
  },
  nameLine: {
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    height: 11,
    marginTop: Spacing.two,
    width: '82%',
  },
  priceLine: {
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    height: 10,
    marginTop: Spacing.two,
    width: '58%',
  },
});
