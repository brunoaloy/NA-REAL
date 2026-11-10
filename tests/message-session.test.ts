import test from "node:test";
import assert from "node:assert/strict";
import ts from "typescript";
import { readFileSync } from "node:fs";
import { assertSessionOwner } from "../src/validation/session-lifecycle.ts";
test("a message keeps its initiating actor if the global session changes during verification", async () => {
  let resolveUser;
  const user = new Promise((resolve) => {
    resolveUser = resolve;
  });
  const sent = [];
  const output = ts.transpileModule(
    readFileSync(
      new URL("../src/services/catalog.ts", import.meta.url),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  const service = {};
  new Function("require", "exports", output)((name) => {
    if (name === "./supabase")
      return {
        db: () => ({
          auth: {
            getUser: async (token) => {
              assert.equal(token, "actor-A");
              return user;
            },
            getSession: async () => ({
              data: { session: { access_token: "actor-B" } },
            }),
          },
        }),
        dbForAccessToken: (token) => ({
          rpc: async (name, body) => {
            sent.push({ token, name, body });
            return { data: "saved", error: null };
          },
        }),
      };
    if (name === "../validation/session-lifecycle")
      return { assertSessionOwner };
    if (name === "../validation/domain")
      return { messageInput: { parse: (value) => value.trim() } };
    return {};
  }, service);
  const work = service.sendMessage(
    "place",
    " Olá ",
    "request",
    null,
    "A",
    "actor-A",
  );
  resolveUser({ data: { user: { id: "A" } }, error: null });
  assert.equal(await work, "saved");
  assert.equal(sent.length, 1);
  assert.equal(sent[0].token, "actor-A");
  assert.equal(sent[0].body.body, "Olá");
  await assert.rejects(
    service.sendMessage("place", "Texto", "request2", null, "B", "actor-A"),
    /sessão mudou/,
  );
  assert.equal(sent.length, 1);
});
