import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Colors.light.backgroundElement}
      iconColor={{
        default: Colors.light.textSecondary,
        selected: Colors.light.primary,
      }}
      indicatorColor="#FFF7ED"
      labelStyle={{
        default: { color: Colors.light.textSecondary },
        selected: { color: Colors.light.primary },
      }}>
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
