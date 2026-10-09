import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          md={{ default: 'home', selected: 'home' }}
          sf={{ default: 'house', selected: 'house.fill' }}
        />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="categories">
        <NativeTabs.Trigger.Icon
          md={{ default: 'category', selected: 'category' }}
          sf={{ default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' }}
        />
        <NativeTabs.Trigger.Label>Categories</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="messages">
        <NativeTabs.Trigger.Icon
          md={{ default: 'chat', selected: 'chat' }}
          sf={{ default: 'message', selected: 'message.fill' }}
        />
        <NativeTabs.Trigger.Label>Messages</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="cart">
        <NativeTabs.Trigger.Icon
          md={{ default: 'shopping_cart', selected: 'shopping_cart' }}
          sf={{ default: 'cart', selected: 'cart.fill' }}
        />
        <NativeTabs.Trigger.Label>Cart</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon
          md={{ default: 'settings', selected: 'settings' }}
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
        />
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
