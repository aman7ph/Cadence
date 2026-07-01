import * as SecureStore from "expo-secure-store";

// Clerk stores session tokens in iOS Keychain / Android Keystore via this cache
export const tokenCache = {
  getToken:   (key: string) => SecureStore.getItemAsync(key),
  saveToken:  (key: string, value: string) => SecureStore.setItemAsync(key, value),
  clearToken: (key: string) => SecureStore.deleteItemAsync(key),
};
