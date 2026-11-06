import test from "node:test";
import assert from "node:assert/strict";
import { errorMessage } from "../src/validation/errors.ts";
test("backend objects produce useful text without leaking diagnostics", () => {
  assert.match(
    errorMessage({ code: "PGRST205", message: "missing table private.schema" }),
    /serviço/,
  );
  assert.match(
    errorMessage({ code: "42501", message: "private row" }),
    /permissão/,
  );
  assert.match(
    errorMessage({ code: "23505", details: "private author" }),
    /cadastrado/,
  );
  assert.equal(
    errorMessage({ message: "password=secret SQL data" }),
    "Não foi possível concluir agora. Tente novamente.",
  );
});
test("validation points to the field and network failures support retry", () => {
  assert.equal(
    errorMessage({
      name: "ZodError",
      issues: [{ path: ["rating"], message: "Internal diagnostic" }],
    }),
    "Confira o campo nota de 1 a 5.",
  );
  assert.match(errorMessage(new TypeError("Failed to fetch")), /internet/);
  assert.equal(
    errorMessage(new Error("Entre para contribuir.")),
    "Entre para contribuir.",
  );
  assert.match(errorMessage({ code: "email_not_confirmed" }), /Confirme/);
});
test("local errors with credentials or SQL receive generic text", () => {
  for (const message of [
    "postgres://name:secret@host/db",
    "sb_secret_NEVER_PRINT",
    "token=secret",
    "select * from private_rows",
  ])
    assert.equal(
      errorMessage(new Error(message)),
      "Não foi possível concluir agora. Tente novamente.",
    );
});
