import test from "node:test";
import assert from "node:assert/strict";
import { usesExpoGoMap, regionBounds } from "../src/validation/map-runtime.ts";
test("Expo Go uses the built-in map without loading MapLibre", () => {
  assert.equal(usesExpoGoMap("ios", "storeClient"), true);
  assert.equal(usesExpoGoMap("android", "storeClient"), true);
  assert.equal(usesExpoGoMap("ios", "bare"), false);
  assert.equal(usesExpoGoMap("android", "standalone"), false);
  assert.equal(usesExpoGoMap("web", "storeClient"), false);
  assert.equal(usesExpoGoMap("ios"), false);
});
test("native map regions become valid search bounds, including poles and dateline", () => {
  assert.deepEqual(
    regionBounds({
      latitude: -15,
      longitude: -51,
      latitudeDelta: 38,
      longitudeDelta: 40,
    }),
    [-71, -34, -31, 4],
  );
  assert.deepEqual(
    regionBounds({
      latitude: 85,
      longitude: 179,
      latitudeDelta: 20,
      longitudeDelta: 10,
    }),
    [-180, 75, 180, 90],
  );
  assert.deepEqual(
    regionBounds({
      latitude: -85,
      longitude: -179,
      latitudeDelta: 20,
      longitudeDelta: 10,
    }),
    [-180, -90, 180, -75],
  );
});

test("native entry evaluates only the selected map module", async () => {
  const { readFileSync } = await import("node:fs");
  const { runInNewContext } = await import("node:vm");
  const ts = await import("typescript");
  const code = ts.transpileModule(
    readFileSync("src/components/map-canvas.tsx", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  for (const builtInMap of [true, false]) {
    const loaded: string[] = [];
    const component = () => null;
    const exports = {} as { default?: unknown };
    runInNewContext(code, {
      exports,
      require: (name: string) => {
        if (name === "../services/map-runtime") return { builtInMap };
        loaded.push(name);
        return { default: component };
      },
    });
    assert.deepEqual(loaded, [
      builtInMap ? "./map-canvas-go" : "./map-canvas-maplibre",
    ]);
    assert.equal(exports.default, component);
  }
});
