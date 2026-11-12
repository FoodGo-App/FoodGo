import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { createTokenStore } from "./tokenStore";
let webToken: string | null = null;
export const tokenStore = createTokenStore({
  get: () =>
    Platform.OS === "web"
      ? Promise.resolve(webToken)
      : SecureStore.getItemAsync("foodgo.session"),
  set: async (value: string | null) => {
    if (Platform.OS === "web") {
      webToken = value;
      return;
    }
    if (value) await SecureStore.setItemAsync("foodgo.session", value);
    else await SecureStore.deleteItemAsync("foodgo.session");
  },
});
export async function readStore<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(`foodgo:v1:${key}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
export const writeStore = (key: string, value: unknown) =>
  AsyncStorage.setItem(`foodgo:v1:${key}`, JSON.stringify(value));
export const removeStore = (key: string) =>
  AsyncStorage.removeItem(`foodgo:v1:${key}`);
