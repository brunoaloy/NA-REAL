import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeFilters,
  mapFilters,
  mapCenter,
  hasFilters,
  emptyFilters,
} from "../src/validation/explore.ts";
test("search filters normalize whitespace and UF and reject invalid states", () => {
  assert.deepEqual(
    normalizeFilters({
      search: "  Café  ",
      category: "Comer",
      city: " Recife ",
      state: " pe ",
    }),
    { search: "Café", category: "Comer", city: "Recife", state: "PE" },
  );
  assert.throws(
    () => normalizeFilters({ ...emptyFilters, state: "XX" }),
    /UF válida/,
  );
  assert.equal(
    normalizeFilters({
      ...emptyFilters,
      search: "a".repeat(200),
      city: "b".repeat(200),
    }).search.length,
    120,
  );
  assert.equal(
    normalizeFilters({ ...emptyFilters, city: "b".repeat(200) }).city.length,
    100,
  );
  assert.equal(hasFilters(emptyFilters), false);
  assert.equal(hasFilters({ ...emptyFilters, category: "Lazer" }), true);
});
test("map keeps list search/category/city/UF and rejects malformed deep-link params", () => {
  const filters = {
    search: "Café",
    category: "Comer",
    city: "Recife",
    state: "PE",
  };
  assert.deepEqual(mapFilters(filters), filters);
  assert.deepEqual(
    mapFilters({
      search: ["unexpected", "values"],
      state: "bad",
      category: "invalid",
    }),
    emptyFilters,
  );
});
test("map center accepts zero and negative coordinates, rejects incomplete/out-of-range inputs", () => {
  assert.deepEqual(
    mapCenter({ latitude: "-8.05", longitude: "-34.88" }),
    [-34.88, -8.05],
  );
  assert.deepEqual(mapCenter({ latitude: "0", longitude: "0" }), [0, 0]);
  for (const params of [
    { latitude: "", longitude: "0" },
    { latitude: "90.1", longitude: "0" },
    { latitude: "0", longitude: "181" },
    { latitude: "NaN", longitude: "0" },
    { latitude: "1" },
  ])
    assert.equal(mapCenter(params), undefined);
});
