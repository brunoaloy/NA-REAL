import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { preferredCity, cityKey } from "../src/validation/cities.ts";
import { validatePlaceStep } from "../src/validation/add-journey.ts";
import { distributionIssues } from "../src/validation/distribution.ts";
import { usesExpoGoMap } from "../src/validation/map-runtime.ts";
test("city preferences accept bounded city/UF only, never coordinates or arbitrary stored data", () => {
  assert.deepEqual(
    preferredCity({ city: " Osório ", state: "rs", latitude: 123 }),
    { city: "Osório", state: "RS" },
  );
  for (const value of [
    null,
    "Osório",
    { city: "A", state: "RS" },
    { city: "Recife", state: "XX" },
    { city: "x".repeat(101), state: "RS" },
  ])
    assert.equal(preferredCity(value), null);
});
test("offline municipal search disambiguates UF, folds accents and gives city centers rather than venue coordinates", async () => {
  const ts = await import("typescript");
  const code = ts.transpileModule(
    readFileSync("src/services/cities.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        esModuleInterop: true,
      },
    },
  ).outputText;
  const data = JSON.parse(readFileSync("src/data/cities.json", "utf8"));
  const exports = {} as {
    suggestCities: (
      term: string,
      state?: string,
    ) => { city: string; state: string }[];
    cityCenter: (city: string, state: string) => [number, number] | undefined;
  };
  runInNewContext(code, {
    exports,
    require: (name: string) =>
      name.endsWith("cities.json") ? data : { cityKey },
  });
  assert(data.length > 5500);
  assert.equal(exports.suggestCities("o").length, 0);
  assert(
    exports
      .suggestCities("osorio", "RS")
      .some((c) => c.city === "Osório" && c.state === "RS"),
  );
  assert(
    exports
      .suggestCities("sao paulo", "sp")
      .some((c) => c.city === "São Paulo"),
  );
  assert(
    exports.suggestCities("bom jesus", "RS").every((c) => c.state === "RS"),
  );
  const center = exports.cityCenter("Osorio", "rs")!;
  assert(
    center[0] < -49 && center[0] > -51 && center[1] < -29 && center[1] > -31,
  );
  assert.equal(exports.cityCenter("Unknown municipality", "RS"), undefined);
});
test("place steps validate before advancing and permit a missing optional photo/pin", () => {
  const draft = {
    name: "Mercado do bairro",
    category: "Compras",
    city: "Osório",
    state: "RS",
    address: "Rua do Bairro, 20",
    description: "",
  };
  assert.doesNotThrow(() => validatePlaceStep(0, draft));
  assert.doesNotThrow(() => validatePlaceStep(1, draft));
  assert.doesNotThrow(() => validatePlaceStep(2, draft));
  assert.throws(() => validatePlaceStep(0, { ...draft, name: "a" }), /nome/);
  assert.throws(() => validatePlaceStep(1, { ...draft, state: "XX" }), /UF/);
  assert.throws(
    () => validatePlaceStep(1, { ...draft, address: "" }),
    /endereço/,
  );
});
test("distribution requires definitive identity and EAS link; builtin map can be chosen outside Expo Go", () => {
  assert.equal(
    distributionIssues({ ios: { bundleIdentifier: "com.example.nareal" } })
      .length,
    2,
  );
  assert.equal(
    distributionIssues({
      ios: { bundleIdentifier: "com.owner.nareal" },
      extra: { eas: { projectId: "11000000-0000-0000-0000-000000000001" } },
    }).length,
    0,
  );
  assert.equal(usesExpoGoMap("ios", "standalone", true), true);
  assert.equal(usesExpoGoMap("web", "standalone", true), false);
});
