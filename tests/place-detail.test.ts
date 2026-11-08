import test from "node:test";
import assert from "node:assert/strict";
import {
  destinationLabel,
  directionsUrl,
  validPlaceId,
} from "../src/validation/place-detail.ts";
test("directions use the real destination and leave the origin to the maps app", () => {
  const place = {
    address: "Rua da Praça, 10 & Anexo",
    city: "Recife",
    state: "PE",
  };
  assert.equal(
    destinationLabel(place),
    "Rua da Praça, 10 & Anexo, Recife, PE, Brasil",
  );
  const apple = new URL(directionsUrl("ios", place));
  assert.equal(apple.hostname, "maps.apple.com");
  assert.equal(apple.searchParams.get("daddr"), destinationLabel(place));
  assert.equal(apple.searchParams.has("saddr"), false);
  const google = new URL(directionsUrl("web", place));
  assert.equal(google.hostname, "www.google.com");
  assert.equal(google.searchParams.get("destination"), destinationLabel(place));
  assert.equal(google.searchParams.has("origin"), false);
  assert.equal(google.searchParams.has("Anexo"), false);
  assert.throws(
    () => destinationLabel({ address: " ", city: "", state: "" }),
    /endereço/,
  );
});
test("detail links require one valid UUID rather than malformed or repeated route params", () => {
  assert.equal(validPlaceId("11000000-0000-0000-0000-000000000001"), true);
  for (const id of [
    undefined,
    "",
    ["11000000-0000-0000-0000-000000000001"],
    "not-a-place",
    "11000000-0000-0000-0000-000000000001/extra",
  ])
    assert.equal(validPlaceId(id), false);
});
