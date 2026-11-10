import test from "node:test";
import assert from "node:assert/strict";
import {
  createDiagnostics,
  diagnosticReport,
} from "../src/validation/diagnostics.ts";
test("diagnostics retain only bounded anonymous operation categories, never supplied error details", () => {
  const d = createDiagnostics();
  for (let i = 0; i < 25; i++)
    d.record("catalogue", {
      message: "fetch failed secret@example.invalid token=PRIVATE",
      body: "PRIVATE_REVIEW",
      status: 0,
    });
  assert.equal(d.snapshot().length, 20);
  const text = diagnosticReport(d.snapshot());
  assert.match(text, /catalogue.*network/);
  assert.doesNotMatch(text, /PRIVATE|@|token=/);
});
test("feedback snapshots are stable and diagnostics clear on session disposal", () => {
  const d = createDiagnostics();
  d.record("photo_upload", { status: 403 });
  const preview = d.snapshot();
  d.record("nearby", {});
  d.clear();
  assert.equal(d.snapshot().length, 0);
  assert.equal(preview.length, 1);
  assert.equal(preview[0].category, "permission");
});
