import test from "node:test";
import assert from "node:assert/strict";
import {
  placeInput,
  reviewInput,
  messageInput,
  isRecent,
} from "../src/validation/domain.ts";
test("cadastro valida UF, categoria e campos obrigatórios", () => {
  const valid = {
    is_public_venue: true,
    name: "Mercado Central",
    category: "Compras",
    city: "Belo Horizonte",
    state: "MG",
    address: "Avenida Central, 10",
  };
  assert.equal(placeInput.safeParse(valid).success, true);
  for (const patch of [
    { state: "XX" },
    { name: " " },
    { category: "Casa privada" },
    { address: "" },
  ])
    assert.equal(placeInput.safeParse({ ...valid, ...patch }).success, false);
});
test("avaliação rejeita nota fracionária, inválida e texto excessivo", () => {
  assert.equal(
    reviewInput.safeParse({ rating: 5, body: "Muito bom" }).success,
    true,
  );
  for (const rating of [0, 6, 2.5])
    assert.equal(
      reviewInput.safeParse({ rating, body: "Bom local" }).success,
      false,
    );
  assert.equal(
    reviewInput.safeParse({ rating: 3, body: "x".repeat(501) }).success,
    false,
  );
});
test("mensagem vazia e acima do limite não são aceitas", () => {
  assert.equal(messageInput.safeParse("   ").success, false);
  assert.equal(messageInput.safeParse("x".repeat(1001)).success, false);
  assert.equal(messageInput.parse(" Olá "), "Olá");
});
test("relatos expirados não são atuais", () => {
  const now = Date.parse("2026-11-06T12:00:00Z");
  assert.equal(isRecent("2026-11-06T11:59:00Z", now), false);
  assert.equal(isRecent("2026-11-06T12:00:00Z", now), false);
  assert.equal(isRecent("2026-11-06T12:01:00Z", now), true);
  assert.equal(isRecent("invalid", now), false);
});
