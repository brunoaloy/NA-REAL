const fs = require("node:fs");
const { capture } = require("./private-command.cjs");
const config = JSON.parse(
  capture(
    process.execPath,
    [require.resolve("expo/bin/cli"), "config", "--json"],
    { env: { ...process.env, EXPO_OFFLINE: "1" } },
  ),
);
for (const [label, value] of [
  ["scheme", config.scheme],
  ["Android package", config.android?.package],
  ["iOS bundle identifier", config.ios?.bundleIdentifier],
]) {
  if (!value) throw new Error(label + " absent");
  console.log("PASS " + label + " present");
}
const plugins = (config.plugins || []).map((p) =>
  Array.isArray(p) ? p[0] : p,
);
for (const plugin of [
  "expo-router",
  "@maplibre/maplibre-react-native",
  "expo-location",
  "expo-image-picker",
]) {
  if (!plugins.includes(plugin))
    throw new Error("Missing required plugin " + plugin);
  console.log("PASS plugin " + plugin);
}
const eas = JSON.parse(fs.readFileSync("eas.json", "utf8"));
if (
  !eas.build?.development?.developmentClient ||
  !eas.build?.["development-simulator"]?.ios?.simulator
)
  throw new Error("Development build profiles missing");
console.log("PASS development client and iOS simulator profiles");
const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (!pkg.dependencies["react-native-maps"])
  throw new Error("Expo Go map dependency missing");
if (
  !pkg.scripts.start.includes("--go") ||
  !pkg.scripts["start:tunnel"].includes("--go")
)
  throw new Error("Default mobile commands must target Expo Go");
if (!pkg.devDependencies["@expo/ngrok"])
  throw new Error("Expo Go tunnel dependency missing");
console.log("PASS Expo Go commands, built-in map and local tunnel dependency");
if (
  config.android.package.startsWith("com.example.") ||
  config.ios.bundleIdentifier.startsWith("com.example.")
)
  console.log(
    "PENDING provisional identifiers: owner must select definitive IDs",
  );
if (!config.extra?.eas?.projectId)
  console.log("PENDING EAS project/account not linked");
console.log(
  "This validates configuration only; no APK/IPA, signing or physical-device test.",
);
