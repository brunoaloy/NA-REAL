import test from "node:test";
import assert from "node:assert/strict";
import {
  nativeMapCamera,
  nativeMapRegion,
  zoomNativeRegion,
} from "../src/validation/native-map-camera.ts";
import { moderationPreview } from "../src/validation/moderation-preview.ts";
test("native map applies the latest city only after readiness and starts close enough for street exploration", () => {
  const calls: unknown[] = [],
    camera = nativeMapCamera([-50.2667, -29.8881]);
  camera.animator((r) => calls.push(r));
  camera.target([-46.6333, -23.5505]);
  assert.equal(calls.length, 0);
  camera.ready();
  assert.deepEqual(calls[0], nativeMapRegion([-46.6333, -23.5505]));
  assert.equal((calls[0] as { latitudeDelta: number }).latitudeDelta, 0.012);
  const panned = {
    latitude: -23.5,
    longitude: -46.6,
    latitudeDelta: 0.02,
    longitudeDelta: 0.03,
  };
  camera.region(panned);
  camera.zoom(0.5);
  assert.deepEqual(calls[1], {
    ...panned,
    latitudeDelta: 0.01,
    longitudeDelta: 0.015,
  });
  camera.focus();
  assert.deepEqual(calls[2], nativeMapRegion([-46.6333, -23.5505]));
});
test("map zoom keeps the current center and clamps excessive zoom", () => {
  const r = nativeMapRegion([-50, -29]);
  assert.equal(zoomNativeRegion(r, 0.00001).latitudeDelta, 0.0015);
  assert.equal(zoomNativeRegion(r, 100000).longitudeDelta, 80);
  assert.equal(zoomNativeRegion(r, 0.5).longitude, r.longitude);
});
test("moderation preview exposes reviewable fields without raw auth or internal metadata", () => {
  assert.deepEqual(
    moderationPreview("places", {
      name: " Mercado ",
      category: "Compras",
      city: "Osório",
      state: "RS",
      address: "Rua, 10",
      created_by: "private-owner",
      secret: "hidden",
    }),
    {
      title: "Mercado",
      fields: [
        { label: "Categoria", value: "Compras" },
        { label: "Cidade", value: "Osório, RS" },
        { label: "Endereço", value: "Rua, 10" },
      ],
    },
  );
  assert.equal(moderationPreview("places", null).title, "Lugar");
});
