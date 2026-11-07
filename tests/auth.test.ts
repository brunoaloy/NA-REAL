import test from "node:test";
import assert from "node:assert/strict";
import { authInput } from "../src/validation/auth.ts";
test("login trims email but preserves password and accepts existing shorter passwords", () => {
  assert.deepEqual(
    authInput("login", { email: " pessoa@example.com ", password: " senha " }),
    { email: "pessoa@example.com", password: " senha " },
  );
  assert.equal(
    authInput("login", { email: "pessoa@example.com", password: "123456" })
      .password,
    "123456",
  );
  assert.throws(
    () => authInput("login", { email: "pessoa@example.com", password: "" }),
    /senha/,
  );
});
test("signup requires eight characters and an identical confirmation", () => {
  assert.throws(
    () =>
      authInput("signup", {
        email: "pessoa@example.com",
        password: "1234567",
        confirmation: "1234567",
      }),
    /8 caracteres/,
  );
  assert.throws(
    () =>
      authInput("signup", {
        email: "pessoa@example.com",
        password: "12345678",
        confirmation: "87654321",
      }),
    /não conferem/,
  );
  assert.equal(
    authInput("signup", {
      email: "pessoa@example.com",
      password: "12345678",
      confirmation: "12345678",
    }).password,
    "12345678",
  );
});
test("recovery requires only a valid email, never a password", () => {
  assert.deepEqual(authInput("reset", { email: " pessoa@example.com " }), {
    email: "pessoa@example.com",
    password: "",
  });
  for (const email of [
    "",
    "not-email",
    "a@b",
    "a b@example.com",
    "a".repeat(250) + "@example.com",
  ])
    assert.throws(() => authInput("reset", { email }), /e-mail válido/);
});
