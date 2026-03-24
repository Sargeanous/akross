import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'proximity_access_token';
const REFRESH_TOKEN_KEY = 'proximity_refresh_token';

/**
 * Secure token storage using expo-secure-store.
 *
 * Tokens are stored in the platform's secure keychain (iOS Keychain / Android Keystore).
 * NEVER use AsyncStorage for auth tokens — it is unencrypted.
 */

export async function getTokens(): Promise<{
  accessToken: string | null;
  refreshToken: string | null;
}> {
  const [accessToken, refreshToken] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
  ]);
  return { accessToken, refreshToken };
}

export async function setTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
  ]);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}
