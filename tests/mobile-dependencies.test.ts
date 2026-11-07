import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
const { checkMobileDependencies } = createRequire(import.meta.url)(
  "../scripts/check-mobile-dependencies.cjs",
);
function fixture(gradient?: string) {
  const root = mkdtempSync(join(tmpdir(), "na-real-dependencies-"));
  writeFileSync(
    join(root, "package.json"),
    JSON.stringify({
      dependencies: { expo: "~58.0.23", "expo-linear-gradient": "~58.0.3" },
    }),
  );
  writeFileSync(
    join(root, "package-lock.json"),
    JSON.stringify({
      packages: {
        "node_modules/expo": { version: "58.0.23" },
        "node_modules/expo-linear-gradient": { version: "58.0.3" },
        "node_modules/@expo/ngrok": { version: "4.1.3" },
      },
    }),
  );
  for (const [name, version] of [
    ["expo", "58.0.23"],
    ["@expo/ngrok", "4.1.3"],
    ...(gradient ? [["expo-linear-gradient", gradient]] : []),
  ]) {
    const dir = join(root, "node_modules", name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "package.json"), JSON.stringify({ version }));
  }
  return root;
}
test("missing gradient produces installation guidance before Expo starts", () => {
  const root = fixture();
  try {
    assert.throws(
      () => checkMobileDependencies(root),
      (e: Error) =>
        e.message.includes("expo-linear-gradient") &&
        e.message.includes("npm ci") &&
        e.message.includes("npm run phone"),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
test("installed dependencies must match the lockfile, not just exist", () => {
  for (const version of ["58.0.3", "57.0.0"]) {
    const root = fixture(version);
    try {
      if (version === "58.0.3")
        assert.doesNotThrow(() => checkMobileDependencies(root));
      else assert.throws(() => checkMobileDependencies(root), /desatualizadas/);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }
});
