const { getDefaultConfig } = require("expo/metro-config");
const { copyFileSync, mkdirSync } = require("node:fs");
const path = require("node:path");

// MapLibre 6 resolves its module worker relative to import.meta.url. Metro's
// chunk URL is different, so serve the installed worker from the same origin.
const packageFile = require.resolve("maplibre-gl/package.json");
const { version } = require(packageFile);
const source = path.dirname(packageFile);
const destination = path.join(__dirname, "public", "maplibre", version);
mkdirSync(destination, { recursive: true });
for (const file of ["dist/maplibre-gl-worker.mjs", "LICENSE.txt"])
  copyFileSync(
    path.join(source, file),
    path.join(destination, path.basename(file)),
  );

module.exports = getDefaultConfig(__dirname);
