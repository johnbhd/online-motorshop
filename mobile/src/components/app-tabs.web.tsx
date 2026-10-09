import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import {
  TabList,
  TabSlot,
  Tabs,
  TabTrigger,
} from 'expo-router/ui';
import type { TabListProps, TabTriggerSlotProps } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

const tabIcons: Record<string, SymbolViewProps['name']> = {
  cart: { ios: 'cart', android: 'shopping_cart', web: 'shopping_cart' },
  categories: {
    ios: 'square.grid.2x2',
    android: 'category',
    web: 'category',
  },
  home: { ios: 'house', android: 'home', web: 'home' },
  messages: { ios: 'message', android: 'chat', web: 'chat' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
};

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.tabSlot} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="index" href="/" asChild>
            <TabButton icon={tabIcons.home}>Home</TabButton>
          </TabTrigger>
          <TabTrigger name="categories" href="/categories" asChild>
            <TabButton icon={tabIcons.categories}>Categories</TabButton>
          </TabTrigger>
          <TabTrigger name="messages" href="/messages" asChild>
            <TabButton icon={tabIcons.messages}>Messages</TabButton>
          </TabTrigger>
          <TabTrigger name="cart" href="/cart" asChild>
            <TabButton icon={tabIcons.cart}>Cart</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton icon={tabIcons.settings}>Settings</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

type TabButtonProps = TabTriggerSlotProps & {
  icon: SymbolViewProps['name'];
};

export function TabButton({ children, icon, isFocused, ...props }: TabButtonProps) {
  const tintColor = isFocused
    ? Colors.light.primary
    : Colors.light.textSecondary;

  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.tabButton, pressed && styles.pressed]}
    >
      <SymbolView
        name={icon}
        size={21}
        tintColor={tintColor}
        style={styles.tabIcon}
      />
      <Text style={[styles.tabLabel, isFocused && styles.tabLabelFocused]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function CustomTabList(props: TabListProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      {...props}
      style={[
        styles.tabListContainer,
        { paddingBottom: Math.max(Spacing.two, insets.bottom) },
      ]}
    >
      <View style={styles.tabListContent}>{props.children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabSlot: {
    height: '100%',
  },
  tabListContainer: {
    alignItems: 'center',
    backgroundColor: Colors.light.backgroundElement,
    borderTopColor: '#E2E8F0',
    borderTopWidth: 1,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: Spacing.one,
    paddingTop: Spacing.two,
    position: 'absolute',
    width: '100%',
    zIndex: 10,
  },
  tabListContent: {
    flexDirection: 'row',
    maxWidth: 560,
    width: '100%',
  },
  tabButton: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: Spacing.one,
  },
  tabIcon: {
    marginBottom: 2,
  },
  tabLabel: {
    color: Colors.light.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabLabelFocused: {
    color: Colors.light.primary,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.7,
  },
});
