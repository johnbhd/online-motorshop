import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CatalogFeedback } from '@/components/product-catalog';
import { CustomerScreen } from '@/components/customer-screen';
import { Colors, Spacing } from '@/constants/theme';
import { ApiError } from '@/lib/api/client';
import { getCategories } from '@/lib/catalog/api';
import type { CatalogCategory } from '@/lib/catalog/types';

const supportedBrands = [
  { color: '#D94242', name: 'Honda' },
  { color: '#2C5AA0', name: 'Yamaha' },
  { color: '#3E77B6', name: 'Suzuki' },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadCategories = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      setCategories(await getCategories(signal));
    } catch (value) {
      if (value instanceof ApiError && value.kind === 'cancelled') {
        return;
      }

      setError(
        value instanceof Error
          ? value
          : new Error('The categories could not be loaded.'),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void loadCategories(controller.signal);

    return () => controller.abort();
  }, [loadCategories]);

  return (
    <CustomerScreen>
      <Text style={styles.eyebrow}>DISCOVER YOUR OPTIONS</Text>
      <Text style={styles.title}>Categories & Brands</Text>
      <Text style={styles.description}>
        Browse live catalog categories or filter motorcycle parts by supported
        manufacturer.
      </Text>

      <Text style={styles.sectionTitle}>Categories</Text>
      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors.light.primary} />
          <Text style={styles.loadingText}>Loading categories</Text>
        </View>
      ) : error ? (
        <CatalogFeedback
          description="Check your connection and try again."
          onRetry={() => void loadCategories()}
          title="Unable to load categories"
        />
      ) : categories.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No categories found.</Text>
        </View>
      ) : (
        <View style={styles.categoryList}>
          {categories.map((category) => (
            <Pressable
              accessibilityLabel={`Browse ${category.name} products`}
              accessibilityRole="button"
              key={category.id}
              onPress={() =>
                router.push({
                  pathname: '/products',
                  params: { category: category.name },
                })
              }
              style={({ pressed }) => [
                styles.categoryCard,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.categoryName}>{category.name}</Text>
              {category.description ? (
                <Text numberOfLines={2} style={styles.categoryDescription}>
                  {category.description}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Shop by Brand</Text>
      <View style={styles.brandRow}>
        {supportedBrands.map((brand) => (
          <Pressable
            accessibilityLabel={`Browse ${brand.name} products`}
            accessibilityRole="button"
            key={brand.name}
            onPress={() =>
              router.push({
                pathname: '/products',
                params: { brand: brand.name },
              })
            }
            style={({ pressed }) => [styles.brandCard, pressed && styles.pressed]}
          >
            <View style={[styles.brandDot, { backgroundColor: brand.color }]} />
            <Text style={styles.brandName}>{brand.name}</Text>
          </Pressable>
        ))}
      </View>
    </CustomerScreen>
  );
}

const styles = StyleSheet.create({
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
  brandName: {
    color: Colors.light.text,
    fontSize: 13,
    fontWeight: '800',
  },
  brandRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.three,
    marginTop: Spacing.two,
  },
  categoryCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
  },
  categoryDescription: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: Spacing.one,
  },
  categoryList: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  categoryName: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '800',
  },
  description: {
    color: Colors.light.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: Spacing.two,
  },
  emptyState: {
    backgroundColor: Colors.light.backgroundElement,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: Spacing.two,
    padding: Spacing.three,
  },
  emptyTitle: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '800',
  },
  eyebrow: {
    color: Colors.light.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  loadingState: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundElement,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.two,
    padding: Spacing.three,
  },
  loadingText: {
    color: Colors.light.textSecondary,
    fontSize: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: 19,
    fontWeight: '800',
    marginTop: Spacing.four,
  },
  title: {
    color: Colors.light.text,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    marginTop: Spacing.two,
  },
});
