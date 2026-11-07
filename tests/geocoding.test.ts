import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { brazilPoint } from "../src/validation/geocoding.ts";
function service(
  platform: string,
  geocode: () => Promise<unknown[]>,
  granted = true,
) {
  const code = ts.transpileModule(
    readFileSync("src/services/geocoding.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText;
  const exports = {} as { findAddress: (address: string) => Promise<unknown> };
  runInNewContext(code, {
    exports,
    setTimeout,
    clearTimeout,
    require: (name: string) => {
      if (name === "expo-location")
        return {
          geocodeAsync: geocode,
          requestForegroundPermissionsAsync: async () => ({ granted }),
        };
      if (name === "react-native") return { Platform: { OS: platform } };
      if (name === "../validation/geocoding") return { brazilPoint };
      throw new Error("Unexpected module");
    },
  });
  return exports.findAddress;
}
test("native geocoder finds a Brazil location and rejects empty or foreign results", async () => {
  const lookup = service("ios", async () => [
    { latitude: 40, longitude: 10 },
    { latitude: -8.05, longitude: -34.88 },
  ]);
  assert.deepEqual(await lookup("Recife, PE, Brasil"), {
    latitude: -8.05,
    longitude: -34.88,
  });
  await assert.rejects(
    service("ios", async () => [])("Cidade, Brasil"),
    /Não encontramos/,
  );
});
test("web and denied Android permission do not silently pretend to locate a city", async () => {
  let calls = 0;
  const geocode = async () => {
    calls++;
    return [];
  };
  await assert.rejects(
    service("web", geocode)("Recife"),
    /no aplicativo do celular/,
  );
  await assert.rejects(
    service("android", geocode, false)("Recife"),
    /permitida/,
  );
  assert.equal(calls, 0);
});
test("native lookup errors give a useful manual-map fallback", async () => {
  await assert.rejects(
    service("ios", async () => {
      throw new Error("private native diagnostics");
    })("Recife"),
    /marque o ponto no mapa/,
  );
});
