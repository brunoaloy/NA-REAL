import Constants from "expo-constants";
import { Platform } from "react-native";
import { usesExpoGoMap } from "../validation/map-runtime";
export const builtInMap = usesExpoGoMap(
  Platform.OS,
  Constants.executionEnvironment,
  process.env.EXPO_PUBLIC_NATIVE_MAP_PROVIDER === "builtin",
);
