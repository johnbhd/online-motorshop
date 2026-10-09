import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';

import { CustomerHeader } from '@/components/customer-header';
import { ProductCatalog } from '@/components/product-catalog';
import { Colors } from '@/constants/theme';
import { useProductCatalog } from '@/hooks/use-product-catalog';

export default function ProductsScreen() {
  const { brand: brandParam, category: categoryParam } =
    useLocalSearchParams<{ brand?: string; category?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const brand = Array.isArray(brandParam) ? brandParam[0] : brandParam;
  const category = Array.isArray(categoryParam)
    ? categoryParam[0]
    : categoryParam;
  const catalog = useProductCatalog({
    filters: { brand, category, search: searchQuery },
    perPage: 20,
  });

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <CustomerHeader onSearchChange={setSearchQuery} />
        <ProductCatalog
          error={catalog.error}
          hasNextPage={catalog.hasNextPage}
          isInitialLoading={catalog.isInitialLoading}
          isLoadingMore={catalog.isLoadingMore}
          isRefreshing={catalog.isRefreshing}
          loadMore={catalog.loadMore}
          onRefresh={catalog.refresh}
          onRetry={catalog.retry}
          paginationError={catalog.paginationError}
          products={catalog.products}
          searchQuery={searchQuery}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
});
