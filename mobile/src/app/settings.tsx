import { StyleSheet, Text, View } from 'react-native';

import { CustomerScreen } from '@/components/customer-screen';
import { Colors, Spacing } from '@/constants/theme';

const settingSections = [
  {
    label: 'Account',
    description: 'Customer profile features will be added with authentication.',
  },
  {
    label: 'Notifications',
    description: 'Notification preferences will appear here later.',
  },
  {
    label: 'App Preferences',
    description: 'Mobile display and behavior settings are not available yet.',
  },
  {
    label: 'About ALD Motorshop',
    description: 'Motorcycle parts trading for riders and everyday service.',
  },
];

export default function SettingsScreen() {
  return (
    <CustomerScreen>
      <Text style={styles.eyebrow}>YOUR APP</Text>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.description}>
        Account and app preferences will be organized here as the mobile
        customer experience grows.
      </Text>

      <View style={styles.sectionList}>
        {settingSections.map((section) => (
          <View key={section.label} style={styles.settingRow}>
            <Text style={styles.settingLabel}>{section.label}</Text>
            <Text style={styles.settingDescription}>{section.description}</Text>
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
  sectionList: {
    backgroundColor: Colors.light.backgroundElement,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    marginTop: Spacing.four,
    overflow: 'hidden',
  },
  settingRow: {
    borderBottomColor: '#F1F5F9',
    borderBottomWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  settingLabel: {
    color: Colors.light.text,
    fontSize: 16,
    fontWeight: '800',
  },
  settingDescription: {
    color: Colors.light.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: Spacing.one,
  },
});
