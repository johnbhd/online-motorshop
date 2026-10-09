import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Keyboard,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors, Spacing } from '@/constants/theme';

const logo = require('@/assets/images/ald-logo.png');

type CustomerHeaderProps = {
  showSearch?: boolean;
};

type MenuItem = {
  label: string;
  href?: '/' | '/products';
};

const menuItems: MenuItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Products', href: '/products' },
  { label: 'About' },
  { label: 'Contact' },
  { label: 'Track Order' },
];

export function CustomerHeader({ showSearch = false }: CustomerHeaderProps) {
  const router = useRouter();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [query, setQuery] = useState('');

  const closeMenu = () => {
    setIsMenuVisible(false);
  };

  const handleMenuItemPress = (item: MenuItem) => {
    if (!item.href) {
      return;
    }

    closeMenu();
    router.push(item.href);
  };

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

        <Pressable
          accessibilityLabel="Open navigation menu"
          accessibilityRole="button"
          onPress={() => setIsMenuVisible(true)}
          style={({ pressed }) => [
            styles.menuButton,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.menuIcon}>
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
            <View style={styles.menuLine} />
          </View>
        </Pressable>
      </View>

      {showSearch ? (
        <View style={styles.searchContainer}>
          <View accessibilityElementsHidden style={styles.searchGlyph}>
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
      ) : null}

      <Modal
        animationType="slide"
        onRequestClose={closeMenu}
        transparent
        visible={isMenuVisible}
      >
        <View style={styles.modalRoot}>
          <Pressable
            accessibilityLabel="Close navigation menu"
            accessibilityRole="button"
            onPress={closeMenu}
            style={styles.backdrop}
          />

          <SafeAreaView style={styles.drawer}>
            <View style={styles.drawerHeader}>
              <View>
                <Text style={styles.drawerEyebrow}>ALD MOTORSHOP</Text>
                <Text style={styles.drawerTitle}>Menu</Text>
              </View>

              <Pressable
                accessibilityLabel="Close navigation menu"
                accessibilityRole="button"
                onPress={closeMenu}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.closeIcon}>
                  <View style={[styles.closeLine, styles.closeLineFirst]} />
                  <View style={[styles.closeLine, styles.closeLineSecond]} />
                </View>
              </Pressable>
            </View>

            <View style={styles.menuItems}>
              {menuItems.map((item) => (
                <Pressable
                  key={item.label}
                  accessibilityLabel={item.href ? item.label : `${item.label}, coming soon`}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !item.href }}
                  disabled={!item.href}
                  onPress={() => handleMenuItemPress(item)}
                  style={({ pressed }) => [
                    styles.menuItem,
                    !item.href && styles.menuItemDisabled,
                    pressed && styles.menuItemPressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.menuItemText,
                      !item.href && styles.menuItemTextDisabled,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {!item.href ? (
                    <Text style={styles.comingSoonText}>Soon</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>

            <Text style={styles.drawerFooter}>
              Genuine motorcycle parts. Reliable service.
            </Text>
          </SafeAreaView>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
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
  menuButton: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    minWidth: 44,
  },
  menuIcon: {
    gap: 4,
  },
  menuLine: {
    backgroundColor: Colors.light.text,
    borderRadius: 2,
    height: 2,
    width: 22,
  },
  pressed: {
    opacity: 0.6,
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundElement,
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingBottom: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
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
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.light.text,
    flex: 1,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
  },
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    backgroundColor: 'rgba(8, 16, 29, 0.42)',
    flex: 1,
  },
  drawer: {
    backgroundColor: Colors.light.backgroundElement,
    elevation: 12,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    shadowColor: '#08101D',
    shadowOffset: { height: 0, width: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    width: '84%',
  },
  drawerHeader: {
    alignItems: 'center',
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: Spacing.three,
    paddingTop: Spacing.two,
  },
  drawerEyebrow: {
    color: Colors.light.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  drawerTitle: {
    color: Colors.light.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: Spacing.one,
  },
  closeButton: {
    alignItems: 'center',
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  closeIcon: {
    height: 22,
    position: 'relative',
    width: 22,
  },
  closeLine: {
    backgroundColor: Colors.light.text,
    borderRadius: 2,
    height: 2,
    left: 0,
    position: 'absolute',
    top: 10,
    width: 22,
  },
  closeLineFirst: {
    transform: [{ rotate: '45deg' }],
  },
  closeLineSecond: {
    transform: [{ rotate: '-45deg' }],
  },
  menuItems: {
    flex: 1,
    paddingTop: Spacing.three,
  },
  menuItem: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  menuItemDisabled: {
    opacity: 0.7,
  },
  menuItemPressed: {
    backgroundColor: '#FFF7ED',
  },
  menuItemText: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '700',
  },
  menuItemTextDisabled: {
    color: Colors.light.textSecondary,
  },
  comingSoonText: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  drawerFooter: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    paddingBottom: Spacing.four,
  },
});
