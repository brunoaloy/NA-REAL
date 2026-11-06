import test from "node:test";
import assert from "node:assert/strict";
import { featureCollection } from "../src/validation/geo.ts";
test("map emits longitude first and excludes absent or invalid positions", () => {
  const collection = featureCollection([
    { id: "a", name: "Local A", longitude: -43.9, latitude: -19.9 },
    { id: "b", name: "Sem pin", longitude: null, latitude: null },
    { id: "c", name: "Inválido", longitude: NaN, latitude: 1 },
  ]);
  assert.equal(collection.features.length, 1);
  assert.deepEqual(collection.features[0].geometry.coordinates, [-43.9, -19.9]);
  assert.equal(collection.features[0].properties?.id, "a");
});
