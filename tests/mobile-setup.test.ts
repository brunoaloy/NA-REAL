import test from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  writeFileSync,
  readFileSync,
  existsSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const {
  readEnvironment,
  publicConfiguration,
  selectPublicKey,
  writePublicEnvironment,
  checkConnection,
  ensureMobileConfiguration,
} = require("../scripts/setup-mobile.cjs");
const url = "https://zcnfssihiqmbrlwvlsme.supabase.co";
const key = "sb_publishable_TEST_ONLY";
const fixture = (role: string) =>
  "fixture." + btoa(JSON.stringify({ role })) + ".not-a-real-signature";
function temporary() {
  const root = mkdtempSync(join(tmpdir(), "na-real-mobile-"));
  return {
    root,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}
test("environment follows Expo development precedence and accepts the anon alias", () => {
  const { root, cleanup } = temporary();
  try {
    writeFileSync(
      join(root, ".env"),
      'EXPO_PUBLIC_SUPABASE_URL="' +
        url +
        '"\nEXPO_PUBLIC_SUPABASE_ANON_KEY=' +
        key +
        "\nOTHER=base",
    );
    writeFileSync(join(root, ".env.local"), "OTHER=local");
    writeFileSync(
      join(root, ".env.development.local"),
      "OTHER=development-local",
    );
    assert.equal(readEnvironment(root, {}).OTHER, "development-local");
    assert.equal(readEnvironment(root, { OTHER: "shell" }).OTHER, "shell");
    assert.equal(
      publicConfiguration(readEnvironment(root, {})).status,
      "ready",
    );
    assert.equal(
      publicConfiguration({
        ...readEnvironment(root, {}),
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_FORBIDDEN",
      }).status,
      "invalid",
    );
  } finally {
    cleanup();
  }
});
test("CLI key selection prefers public keys and never accepts service_role or secret", () => {
  const anon = { name: "anon", api_key: fixture("anon") };
  assert.equal(
    selectPublicKey([
      { name: "service_role", api_key: fixture("service_role") },
      anon,
      { type: "publishable", api_key: key },
    ]),
    key,
  );
  assert.equal(selectPublicKey({ rows: [anon] }), anon.api_key);
  assert.throws(() =>
    selectPublicKey([
      { name: "anon", api_key: fixture("service_role") },
      { type: "secret", api_key: "sb_secret_FORBIDDEN" },
    ]),
  );
});
test("public environment updates preserve unrelated settings and reject administrative keys", () => {
  const { root, cleanup } = temporary();
  try {
    writeFileSync(
      join(root, ".env.local"),
      "# Preserve this comment\r\nEXPO_PUBLIC_MAP_STYLE_URL=licensed-style\r\nEXPO_PUBLIC_SUPABASE_URL=old\r\nEXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=old\r\n",
    );
    writePublicEnvironment(root, url, key);
    const text = readFileSync(join(root, ".env.local"), "utf8");
    assert.match(text, /# Preserve this comment/);
    assert.match(text, /EXPO_PUBLIC_MAP_STYLE_URL=licensed-style/);
    assert.equal(
      readEnvironment(root, {}).EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      key,
    );
    assert.throws(() =>
      writePublicEnvironment(root, url, "sb_secret_FORBIDDEN"),
    );
    assert.equal(readFileSync(join(root, ".env.local"), "utf8"), text);
  } finally {
    cleanup();
  }
});
test("fresh computer recovers configuration before a read-only probe and saves no token", async () => {
  const { root, cleanup } = temporary();
  try {
    const messages: string[] = [];
    const events: string[] = [];
    const env = await ensureMobileConfiguration({
      root,
      inherited: { SUPABASE_ACCESS_TOKEN: "private-administrative-token" },
      loadKey: async (ref: string) => {
        assert.equal(ref, "zcnfssihiqmbrlwvlsme");
        events.push("recover");
        return key;
      },
      probe: async (u: string, k: string) => {
        assert.equal(u, url);
        assert.equal(k, key);
        events.push("probe");
        return 0;
      },
      log: (message: string) => messages.push(message),
      prompt: undefined,
    });
    assert.deepEqual(events, ["recover", "probe"]);
    assert.equal(env.NA_REAL_REQUIRE_SERVICES, "1");
    assert.equal(env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY, key);
    assert.match(messages.join(" "), /Catálogo público vazio/);
    assert.equal(messages.join(" ").includes(key), false);
    assert.equal(
      readFileSync(join(root, ".env.local"), "utf8").includes(
        "private-administrative-token",
      ),
      false,
    );
  } finally {
    cleanup();
  }
});
test("ready environment skips key retrieval; failed connection never saves recovered values", async () => {
  const { root, cleanup } = temporary();
  try {
    await ensureMobileConfiguration({
      root,
      inherited: {
        EXPO_PUBLIC_SUPABASE_URL: url,
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key,
      },
      loadKey: () => {
        throw new Error("must not retrieve");
      },
      probe: async () => 0,
      log: () => {},
    });
    assert.equal(existsSync(join(root, ".env.local")), false);
    await assert.rejects(
      ensureMobileConfiguration({
        root,
        inherited: {},
        loadKey: () => key,
        probe: async () => {
          throw new Error("offline");
        },
        log: () => {},
      }),
    );
    assert.equal(existsSync(join(root, ".env.local")), false);
  } finally {
    cleanup();
  }
});
test("missing CLI login stops safely without exposing private output", async () => {
  const { root, cleanup } = temporary();
  try {
    await assert.rejects(
      ensureMobileConfiguration({
        root,
        inherited: {},
        loadKey: () => {
          throw new Error("private-output");
        },
        probe: () => {
          throw new Error("must not probe");
        },
        prompt: undefined,
        log: () => {},
      }),
      (e: Error) =>
        e.message.includes("npx supabase login") &&
        !e.message.includes("private-output"),
    );
    assert.equal(existsSync(join(root, ".env.local")), false);
  } finally {
    cleanup();
  }
});
test("live probe calls only the read-only catalog RPC and reports HTTP failures safely", async () => {
  let called = false;
  const count = await checkConnection(
    url,
    key,
    async (u: URL, options: RequestInit) => {
      called = true;
      assert.equal(u.pathname, "/rest/v1/rpc/search_places");
      assert.equal(options.method, "POST");
      assert.deepEqual(JSON.parse(options.body as string), {
        term: "",
        category_filter: "Todos",
      });
      return { ok: true, json: async () => [] };
    },
  );
  assert.equal(called, true);
  assert.equal(count, 0);
  await assert.rejects(
    checkConnection(url, key, async () => ({
      ok: false,
      status: 401,
      json: () => {
        throw new Error("private response");
      },
    })),
    /HTTP 401/,
  );
  await assert.rejects(
    checkConnection(url, key, async () => {
      throw new Error("private network diagnostics");
    }),
    (e: Error) => !e.message.includes("private network"),
  );
});
