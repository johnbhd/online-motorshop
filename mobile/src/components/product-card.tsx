import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import type { CatalogProduct } from '@/lib/catalog/types';

type ProductCardProps = {
  product: CatalogProduct;
};

function formatPrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) {
    return 'Contact for price';
  }

  return new Intl.NumberFormat('en-PH', {
    currency: 'PHP',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
    style: 'currency',
  }).format(price);
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const displayPrice = formatPrice(product.price);
  const supportingText = [product.brand, product.category]
    .filter(Boolean)
    .join(' • ');

  return (
    <View
      accessible
      accessibilityLabel={`${product.name}, ${displayPrice}`}
      style={styles.card}
    >
      {product.imageUrl && !imageFailed ? (
        <Image
          accessibilityLabel={`${product.name} product image`}
          onError={() => setImageFailed(true)}
          resizeMode="cover"
          source={{ uri: product.imageUrl }}
          style={styles.image}
        />
      ) : (
        <View accessibilityElementsHidden style={styles.imageFallback}>
          <Text style={styles.imageFallbackText}>ALD</Text>
        </View>
      )}

      <Text numberOfLines={2} style={styles.name}>
        {product.name}
      </Text>
      {supportingText ? (
        <Text numberOfLines={1} style={styles.supportingText}>
          {supportingText}
        </Text>
      ) : null}
      <Text style={styles.price}>{displayPrice}</Text>
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
    overflow: 'hidden',
    padding: Spacing.two,
  },
  image: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    height: 132,
    width: '100%',
  },
  imageFallback: {
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    height: 132,
    justifyContent: 'center',
    width: '100%',
  },
  imageFallbackText: {
    color: Colors.light.textSecondary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  name: {
    color: Colors.light.text,
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 19,
    marginTop: Spacing.two,
  },
  supportingText: {
    color: Colors.light.textSecondary,
    fontSize: 11,
    marginTop: Spacing.one,
  },
  price: {
    color: Colors.light.primary,
    fontSize: 13,
    fontWeight: '800',
    marginTop: Spacing.two,
  },
});
