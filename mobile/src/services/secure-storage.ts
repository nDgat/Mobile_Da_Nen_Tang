import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage; } catch { return null; }
}

export async function getStoredItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") return browserStorage()?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

export async function setStoredItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") { browserStorage()?.setItem(key, value); return; }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteStoredItem(key: string): Promise<void> {
  if (Platform.OS === "web") { browserStorage()?.removeItem(key); return; }
  await SecureStore.deleteItemAsync(key);
}
