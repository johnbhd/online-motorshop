import { useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

const logo = require('@/assets/images/ald-logo.png');

const icons: Record<string, SymbolViewProps['name']> = {
  cart: { ios: 'cart', android: 'shopping_cart', web: 'shopping_cart' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  notification: {
    ios: 'bell',
    android: 'notifications_none',
    web: 'notifications_none',
  },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
};

export function CustomerHeader() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus();
    }

    return () => {
      Keyboard.dismiss();
    };
  }, [isSearchOpen]);

  const openSearch = () => {
    setIsSearchOpen(true);
  };

  const closeSearch = () => {
    Keyboard.dismiss();
    setIsSearchOpen(false);
    setIsSearchFocused(false);
    setQuery('');
  };

  if (isSearchOpen) {
    return (
      <View style={styles.header}>
        <View
          style={[
            styles.searchModeField,
            isSearchFocused && styles.searchModeFieldFocused,
          ]}
        >
          <SymbolView
            accessibilityLabel="Search products"
            name={icons.search}
            size={20}
            tintColor={Colors.light.primary}
          />
          <TextInput
            ref={inputRef}
            accessibilityLabel="Search motorcycle parts"
            accessibilityHint="Search is visual only until the catalog feature is connected."
            autoCapitalize="none"
            autoCorrect={false}
            blurOnSubmit
            onChangeText={setQuery}
            onBlur={() => setIsSearchFocused(false)}
            onFocus={() => setIsSearchFocused(true)}
            onSubmitEditing={Keyboard.dismiss}
            placeholder="Search motorcycle parts"
            placeholderTextColor={Colors.light.textSecondary}
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
        </View>

        <Pressable
          accessibilityLabel="Close search"
          accessibilityRole="button"
          onPress={closeSearch}
          style={({ pressed }) => [
            styles.utilityButton,
            pressed && styles.pressed,
          ]}
        >
          <SymbolView
            name={icons.close}
            size={21}
            tintColor={Colors.light.text}
          />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.brandGroup}>
        <View style={styles.logoFrame}>
          <Image
            accessibilityLabel="ALD Motorshop logo"
            source={logo}
            style={styles.logoImage}
          />
        </View>

        <View style={styles.brandCopy}>
          <Text numberOfLines={1} style={styles.brandName}>
            ALD Motorshop
          </Text>
          <Text numberOfLines={1} style={styles.brandTagline}>
            Motorcycle Parts Trading
          </Text>
        </View>
      </View>

      <View style={styles.utilityActions}>
        <Pressable
          accessibilityLabel="Search products"
          accessibilityRole="button"
          onPress={openSearch}
          style={({ pressed }) => [
            styles.utilityButton,
            pressed && styles.pressed,
          ]}
        >
          <SymbolView
            name={icons.search}
            size={21}
            tintColor={Colors.light.text}
          />
        </Pressable>

        <Pressable
          accessibilityHint="Notifications are not available yet."
          accessibilityLabel="Notifications"
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          disabled
          style={styles.utilityButton}
        >
          <SymbolView
            name={icons.notification}
            size={21}
            tintColor={Colors.light.text}
          />
        </Pressable>

        <Pressable
          accessibilityLabel="Cart"
          accessibilityRole="button"
          onPress={() => router.push('/cart')}
          style={({ pressed }) => [
            styles.utilityButton,
            pressed && styles.pressed,
          ]}
        >
          <SymbolView
            name={icons.cart}
            size={21}
            tintColor={Colors.light.text}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundElement,
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 68,
    paddingHorizontal: Spacing.three,
  },
  brandGroup: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  logoFrame: {
    alignItems: 'center',
    backgroundColor: Colors.light.text,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 36,
  },
  logoImage: {
    height: 36,
    width: 36,
  },
  brandCopy: {
    flexShrink: 1,
    marginLeft: Spacing.two,
  },
  brandName: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '800',
  },
  brandTagline: {
    color: Colors.light.textSecondary,
    fontSize: 10,
    marginTop: 2,
  },
  utilityActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.one,
  },
  utilityButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 40,
  },
  pressed: {
    opacity: 0.6,
  },
  searchModeField: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  searchModeFieldFocused: {
    borderColor: Colors.light.primary,
    shadowColor: Colors.light.primary,
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
  },
  searchInput: {
    color: Colors.light.text,
    flex: 1,
    fontSize: 15,
    minHeight: 42,
    outlineWidth: 0,
    paddingHorizontal: Spacing.two,
  },
});
