import test from "node:test";
import assert from "node:assert/strict";
import { profileInput } from "../src/validation/profile.ts";
import { brazilPoint, addressQuery } from "../src/validation/geocoding.ts";
test("simple profiles require only a name; optional handle is null rather than invalid empty text", () => {
  assert.deepEqual(profileInput({ name: " Ana ", bio: " Gosto de cafés " }), {
    display_name: "Ana",
    bio: "Gosto de cafés",
    handle: null,
  });
  assert.deepEqual(
    profileInput({ name: "Ana", bio: "", handle: " ANA_SILVA " }),
    { display_name: "Ana", bio: "", handle: "ana_silva" },
  );
  assert.throws(() => profileInput({ name: " ", bio: "" }), /nome/);
  assert.throws(
    () => profileInput({ name: "Ana", bio: "a".repeat(301) }),
    /300/,
  );
  assert.throws(
    () => profileInput({ name: "Ana", bio: "", handle: "a!" }),
    /nome de usuário/,
  );
});
test("address lookup uses city/UF and rejects invalid or out-of-range points", () => {
  assert.equal(
    addressQuery(" Rua da Praça, 10 ", " Recife ", " pe "),
    "Rua da Praça, 10, Recife, PE, Brasil",
  );
  assert.equal(addressQuery("", "Recife", "PE"), "Recife, PE, Brasil");
  assert.deepEqual(brazilPoint({ latitude: -8.05, longitude: -34.88 }), {
    latitude: -8.05,
    longitude: -34.88,
  });
  for (const point of [
    { latitude: NaN, longitude: -40 },
    { latitude: 20, longitude: -40 },
    { latitude: -10, longitude: 40 },
    { latitude: -10 },
    { longitude: -40 },
  ])
    assert.equal(brazilPoint(point), undefined);
});
