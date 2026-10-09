import { useState } from 'react';
import {
  Image,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

const logo = require('@/assets/images/ald-logo.png');

type CustomerHeaderProps = {
  showSearch?: boolean;
};

export function CustomerHeader({ showSearch = false }: CustomerHeaderProps) {
  const [query, setQuery] = useState('');

  return (
    <>
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
            <Text style={styles.brandName}>ALD Motorshop</Text>
            <Text style={styles.brandTagline}>Motorcycle Parts Trading</Text>
          </View>
        </View>
      </View>

      {showSearch ? (
        <View style={styles.searchContainer}>
          <View style={styles.searchField}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no"
              style={styles.searchGlyph}
            >
              <View style={styles.searchGlyphCircle} />
              <View style={styles.searchGlyphHandle} />
            </View>
            <TextInput
              accessibilityHint="Search is visual only until the catalog feature is connected."
              accessibilityLabel="Search motorcycle parts"
              blurOnSubmit
              onChangeText={setQuery}
              onSubmitEditing={Keyboard.dismiss}
              placeholder="Search motorcycle parts"
              placeholderTextColor={Colors.light.textSecondary}
              returnKeyType="search"
              style={styles.searchInput}
              value={query}
            />
          </View>
        </View>
      ) : null}
    </>
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
    paddingHorizontal: Spacing.four,
  },
  brandGroup: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
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
  searchContainer: {
    backgroundColor: Colors.light.backgroundElement,
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
  },
  searchField: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  searchGlyph: {
    height: 24,
    marginRight: Spacing.two,
    position: 'relative',
    width: 24,
  },
  searchGlyphCircle: {
    borderColor: Colors.light.primary,
    borderRadius: 8,
    borderWidth: 2,
    height: 15,
    left: 1,
    position: 'absolute',
    top: 1,
    width: 15,
  },
  searchGlyphHandle: {
    backgroundColor: Colors.light.primary,
    borderRadius: 2,
    height: 2,
    left: 14,
    position: 'absolute',
    top: 16,
    transform: [{ rotate: '45deg' }],
    width: 9,
  },
  searchInput: {
    color: Colors.light.text,
    flex: 1,
    fontSize: 15,
    minHeight: 42,
    paddingHorizontal: 0,
  },
});
