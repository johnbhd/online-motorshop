import { StyleSheet } from 'react-native';

import { MobileScreen } from '@/components/mobile-screen';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/components/auth/AuthProvider';
import { Spacing } from '@/constants/theme';

export default function AccountScreen() {
  const { user, isRestoring, error } = useAuth();

  const status = isRestoring
    ? 'Restoring customer session'
    : user
      ? `Signed in as ${user.name}`
      : error
        ? 'Session check needs attention'
        : 'Continue as guest or sign in later';

  return (
    <MobileScreen
      title="Your ALD account."
      description="Sign-in, registration, profile, notifications, and customer-owned orders will live here while Laravel remains the authorization boundary."
      status={status}>
      {error ? (
        <ThemedText themeColor="textSecondary" style={styles.error}>
          {error}
        </ThemedText>
      ) : null}
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  error: {
    marginTop: Spacing.three,
  },
});
