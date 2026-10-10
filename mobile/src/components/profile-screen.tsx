import { useRouter } from 'expo-router';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CustomerScreen } from '@/components/customer-screen';
import { Colors, Spacing } from '@/constants/theme';

type ProfileShortcut = {
  description: string;
  icon: SymbolViewProps['name'];
  route: '/orders' | '/messages' | '/categories' | '/cart';
  title: string;
};

const profileShortcuts: ProfileShortcut[] = [
  {
    description: 'View submitted requests',
    icon: { ios: 'list.bullet.rectangle', android: 'receipt_long', web: 'receipt_long' },
    route: '/orders',
    title: 'My Orders',
  },
  {
    description: 'Contact ALD Motorshop',
    icon: { ios: 'message', android: 'chat', web: 'chat' },
    route: '/messages',
    title: 'Messages',
  },
  {
    description: 'Browse parts and brands',
    icon: { ios: 'square.grid.2x2', android: 'category', web: 'category' },
    route: '/categories',
    title: 'Categories',
  },
  {
    description: 'Review selected parts',
    icon: { ios: 'cart', android: 'shopping_cart', web: 'shopping_cart' },
    route: '/cart',
    title: 'Cart',
  },
];

const profileRows = [
  {
    description: 'Customer alerts will be available with notifications.',
    title: 'Notifications',
  },
  {
    description: 'Support options will be added in a future mobile update.',
    title: 'Help & Support',
  },
  {
    description: 'Motorcycle parts trading for riders and everyday service.',
    title: 'About ALD Motorshop',
  },
];

export function ProfileScreen() {
  const router = useRouter();

  return (
    <CustomerScreen>
      <Text style={styles.eyebrow}>YOUR ALD ACCOUNT</Text>
      <Text style={styles.title}>Profile</Text>
      <Text style={styles.description}>
        Keep your order requests, conversations, and favorite browsing paths in
        one place.
      </Text>

      <View style={styles.identityCard}>
        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            <SymbolView
              name={{ ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' }}
              size={42}
              tintColor={Colors.light.primary}
            />
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.identityName}>Guest customer</Text>
            <Text style={styles.identityDescription}>
              Sign in and profile details will connect when authentication is
              added.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.accountSurface}>
        <Text style={styles.accountEyebrow}>ALD CUSTOMER ACCOUNT</Text>
        <Text style={styles.accountTitle}>Your account, your ride.</Text>
        <Text style={styles.accountDescription}>
          Access the parts, order requests, and support paths that matter most
          to your motorcycle.
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderTitle}>Quick access</Text>
        <Text style={styles.sectionHint}>Available now</Text>
      </View>

      <View style={styles.shortcutGrid}>
        {[profileShortcuts.slice(0, 2), profileShortcuts.slice(2)].map(
          (row, rowIndex) => (
            <View key={rowIndex} style={styles.shortcutRow}>
              {row.map((shortcut) => (
                <Pressable
                  accessibilityLabel={shortcut.title}
                  accessibilityRole="button"
                  key={shortcut.title}
                  onPress={() => router.push(shortcut.route)}
                  style={({ pressed }) => [
                    styles.shortcutCard,
                    pressed && styles.pressed,
                  ]}
                >
                  <SymbolView
                    name={shortcut.icon}
                    size={22}
                    tintColor={Colors.light.primary}
                  />
                  <Text style={styles.shortcutTitle}>{shortcut.title}</Text>
                  <Text style={styles.shortcutDescription}>
                    {shortcut.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          ),
        )}
      </View>

      <Text style={styles.accountSectionTitle}>Account & App</Text>
      <View style={styles.profileRows}>
        {profileRows.map((row) => (
          <View key={row.title} style={styles.profileRow}>
            <View style={styles.profileRowCopy}>
              <Text style={styles.profileRowTitle}>{row.title}</Text>
              <Text style={styles.profileRowDescription}>{row.description}</Text>
            </View>
            <Text style={styles.profileRowArrow}>&gt;</Text>
          </View>
        ))}
      </View>
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
  identityCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: Spacing.four,
    padding: Spacing.three,
  },
  identityRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  identityCopy: {
    flex: 1,
    marginLeft: Spacing.three,
  },
  identityName: {
    color: Colors.light.text,
    fontSize: 18,
    fontWeight: '800',
  },
  identityDescription: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: Spacing.one,
  },
  accountSurface: {
    backgroundColor: Colors.light.text,
    borderRadius: 16,
    marginTop: Spacing.three,
    padding: Spacing.four,
  },
  accountEyebrow: {
    color: Colors.light.primary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  accountTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: Spacing.two,
  },
  accountDescription: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 21,
    marginTop: Spacing.two,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
    marginTop: Spacing.five,
  },
  sectionHeaderTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: '800',
  },
  accountSectionTitle: {
    color: Colors.light.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: Spacing.five,
  },
  sectionHint: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  shortcutGrid: {
    gap: Spacing.two,
  },
  shortcutRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  shortcutCard: {
    backgroundColor: Colors.light.backgroundElement,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    minHeight: 126,
    padding: Spacing.three,
  },
  shortcutTitle: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: Spacing.two,
  },
  shortcutDescription: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: Spacing.one,
  },
  profileRows: {
    backgroundColor: Colors.light.backgroundElement,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: Spacing.three,
    overflow: 'hidden',
  },
  profileRow: {
    alignItems: 'center',
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 70,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  profileRowCopy: {
    flex: 1,
  },
  profileRowTitle: {
    color: Colors.light.text,
    fontSize: 15,
    fontWeight: '800',
  },
  profileRowDescription: {
    color: Colors.light.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: Spacing.one,
  },
  profileRowArrow: {
    color: Colors.light.textSecondary,
    fontSize: 20,
    marginLeft: Spacing.two,
  },
  pressed: {
    opacity: 0.68,
  },
});
