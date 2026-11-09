import test from "node:test";
import assert from "node:assert/strict";
import {
  registrationContext,
  registrationParams,
} from "../src/validation/registration-context.ts";
test("city-to-registration context accepts explicit city/UF/name and never copies map centers", () => {
  const params = registrationParams(
    { city: " Osório ", state: "rs", name: " Café da praça " },
    "request-1",
  );
  assert.deepEqual(
    registrationContext({
      ...params,
      latitude: "-29.8881",
      longitude: "-50.2691",
    }),
    { key: "request-1", city: "Osório", state: "RS", name: "Café da praça" },
  );
  assert.equal(params.latitude, "");
  assert.equal(params.longitude, "");
  assert.equal(params.locationKey, "");
  assert.equal(
    registrationContext({
      requestKey: "key",
      city: "Osório",
      state: "RS",
      suggestedName: "osorio",
    })?.name,
    undefined,
  );
});
test("registration links reject repeated/malformed route params and support free manual entry", () => {
  for (const requestKey of [undefined, ["a"], "x".repeat(101), "../unsafe"])
    assert.equal(
      registrationContext({ requestKey, city: "Osório", state: "RS" }),
      undefined,
    );
  assert.equal(
    registrationContext({ requestKey: "key", city: ["Osório"], state: "RS" }),
    undefined,
  );
  assert.equal(
    registrationContext({ requestKey: "key", city: "Osório", state: "XX" }),
    undefined,
  );
  assert.deepEqual(
    registrationContext({ requestKey: "key", suggestedName: "Lugar novo" }),
    { key: "key", name: "Lugar novo" },
  );
  assert.equal(
    registrationContext({ requestKey: "key", suggestedName: "a".repeat(200) })
      ?.name?.length,
    120,
  );
});
