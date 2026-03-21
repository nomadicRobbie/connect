import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export const tokenStorage = {
  async getItem(key: string) {
    if (Platform.OS === "web") {
      return canUseLocalStorage() ? window.localStorage.getItem(key) : null;
    }

    return SecureStore.getItemAsync(key);
  },

  async setItem(key: string, value: string) {
    if (Platform.OS === "web") {
      if (canUseLocalStorage()) {
        window.localStorage.setItem(key, value);
      }
      return;
    }

    await SecureStore.setItemAsync(key, value);
  },

  async deleteItem(key: string) {
    if (Platform.OS === "web") {
      if (canUseLocalStorage()) {
        window.localStorage.removeItem(key);
      }
      return;
    }

    await SecureStore.deleteItemAsync(key);
  },
};
