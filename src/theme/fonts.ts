import { Platform } from "react-native";
const family = (name: string) =>
  Platform.OS === "web"
    ? `${name}, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
    : name;
export const fonts = {
  regular: family("Inter_400Regular"),
  semibold: family("Inter_600SemiBold"),
  bold: family("Inter_700Bold"),
};
