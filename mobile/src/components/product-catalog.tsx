import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ProductCard } from '@/components/product-card';
import { ProductSkeletonCard } from '@/components/product-skeleton-card';
import { Colors, Spacing } from '@/constants/theme';
import type { CatalogProduct } from '@/lib/catalog/types';

type CatalogFeedbackProps = {
  description: string;
  onRetry: () => void;
  title: string;
};

export function CatalogFeedback({
  description,
  onRetry,
  title,
}: CatalogFeedbackProps) {
  return (
    <View style={styles.feedback}>
      <Text style={styles.feedbackTitle}>{title}</Text>
      <Text style={styles.feedbackDescription}>{description}</Text>
      <Pressable
        accessibilityLabel="Retry catalog request"
        accessibilityRole="button"
        onPress={onRetry}
        style={({ pressed }) => [styles.retryButton, pressed && styles.pressed]}
      >
        <Text style={styles.retryLabel}>Retry</Text>
      </Pressable>
    </View>
  );
}

export function ProductSkeletonGrid() {
  return (
    <View style={styles.skeletonGrid}>
      <View style={styles.gridRow}>
        <ProductSkeletonCard />
        <ProductSkeletonCard />
      </View>
      <View style={styles.gridRow}>
        <ProductSkeletonCard />
        <ProductSkeletonCard />
      </View>
    </View>
  );
}

export function ProductGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <View style={styles.productGrid}>
      {products.map((product) => (
        <View key={product.id} style={styles.productGridItem}>
          <ProductCard product={product} />
        </View>
      ))}
    </View>
  );
}

type ProductCatalogProps = {
  error: Error | null;
  hasNextPage: boolean;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  loadMore: () => void;
  onRefresh: () => void;
  onRetry: () => void;
  paginationError: Error | null;
  products: CatalogProduct[];
  searchQuery?: string;
  title?: string;
};

export function ProductCatalog({
  error,
  hasNextPage,
  isInitialLoading,
  isLoadingMore,
  isRefreshing,
  loadMore,
  onRefresh,
  onRetry,
  paginationError,
  products,
  searchQuery,
  title = 'Motorcycle Parts',
}: ProductCatalogProps) {
  const emptyMessage = searchQuery?.trim()
    ? 'No products match your search.'
    : 'No products found.';

  const listHeader = (
    <View style={styles.listHeader}>
      <Text style={styles.listEyebrow}>PRODUCT CATALOG</Text>
      <Text style={styles.listTitle}>{title}</Text>
      {searchQuery?.trim() ? (
        <Text style={styles.searchSummary}>
          Results for “{searchQuery.trim()}”
        </Text>
      ) : null}
      {error && products.length > 0 ? (
        <CatalogFeedback
          description="The latest catalog refresh failed. Your current products are still shown."
          onRetry={onRetry}
          title="Could not refresh products"
        />
      ) : null}
    </View>
  );

  const emptyContent = isInitialLoading ? (
    <ProductSkeletonGrid />
  ) : error ? (
    <CatalogFeedback
      description="Check your connection and try again."
      onRetry={onRetry}
      title="Unable to load products"
    />
  ) : (
    <View style={styles.emptyContent}>
      <Text style={styles.emptyTitle}>{emptyMessage}</Text>
      <Text style={styles.emptyDescription}>
        Try another search or browse the available categories.
      </Text>
    </View>
  );

  return (
    <FlatList
      columnWrapperStyle={styles.columnWrapper}
      contentContainerStyle={[
        styles.listContent,
        products.length === 0 && styles.emptyListContent,
      ]}
      data={products}
      keyExtractor={(item) => String(item.id)}
      keyboardDismissMode="on-drag"
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={emptyContent}
      ListFooterComponent={
        isLoadingMore ? (
          <View style={styles.footerLoading}>
            <ActivityIndicator color={Colors.light.primary} />
          </View>
        ) : paginationError ? (
          <CatalogFeedback
            description="Your existing products are still available."
            onRetry={loadMore}
            title="Unable to load more products"
          />
        ) : null
      }
      ListHeaderComponent={listHeader}
      numColumns={2}
      onEndReached={() => {
        if (hasNextPage) {
          loadMore();
        }
      }}
      onEndReachedThreshold={0.4}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      renderItem={({ item }) => <ProductCard product={item} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  columnWrapper: {
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  emptyContent: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundElement,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
  },
  emptyDescription: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: Spacing.two,
    textAlign: 'center',
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyTitle: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  feedback: {
    backgroundColor: '#FFF7ED',
    borderColor: '#F7C98C',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: Spacing.three,
    padding: Spacing.three,
  },
  feedbackDescription: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: Spacing.one,
  },
  feedbackTitle: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '800',
  },
  footerLoading: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  listContent: {
    paddingBottom: 108,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  listEyebrow: {
    color: Colors.light.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  listHeader: {
    marginBottom: Spacing.three,
  },
  listTitle: {
    color: Colors.light.text,
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 36,
    marginTop: Spacing.two,
  },
  pressed: {
    opacity: 0.7,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  productGridItem: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 0,
  },
  retryButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    marginTop: Spacing.two,
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  retryLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  searchSummary: {
    color: Colors.light.textSecondary,
    fontSize: 14,
    marginTop: Spacing.two,
  },
  skeletonGrid: {
    flex: 1,
    gap: Spacing.three,
    width: '100%',
  },
});
