import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'ald_mobile_auth_token';

export async function getAuthToken() {
  try {
    if (!(await SecureStore.isAvailableAsync())) {
      return null;
    }

    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

    return token?.trim() || null;
  } catch {
    return null;
  }
}

export async function setAuthToken(token: string) {
  if (!(await SecureStore.isAvailableAsync())) {
    throw new Error('Secure token storage is unavailable on this device.');
  }

  await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken() {
  try {
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    }
  } catch {
    // Local session cleanup should remain best-effort after logout or expiry.
  }
}
