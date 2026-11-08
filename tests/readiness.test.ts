import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { feedbackReport } from "../src/validation/feedback.ts";
import {
  latestContributions,
  contributionDecision,
  contributionTitle,
  contributionStatus,
} from "../src/validation/contributions.ts";
const require = createRequire(import.meta.url);
test("contribution tracking shows current version and current-state reason without inventing approval", () => {
  const items = [
    {
      id: "1",
      target_type: "places",
      target_id: "place",
      state: "approved",
      created_at: "2026-01-01",
      title: "Praça",
    },
    {
      id: "2",
      target_type: "places",
      target_id: "place",
      state: "pending",
      created_at: "2026-01-02",
      moderation_actions: [
        {
          id: "a",
          decision: "rejected",
          reason: "Old rejection",
          created_at: "2026-01-01",
        },
      ],
    },
    {
      id: "3",
      target_type: "photos",
      target_id: "photo",
      state: "superseded",
      created_at: "2026-01-03",
    },
  ];
  assert.deepEqual(
    latestContributions(items).map((i) => i.id),
    ["2"],
  );
  assert.equal(contributionDecision(items[1]), "");
  const rejected = {
    ...items[1],
    state: "rejected",
    moderation_actions: [
      {
        id: "b",
        decision: "rejected",
        reason: "Corrija o endereço.",
        created_at: "2026-01-03",
      },
      {
        id: "a",
        decision: "rejected",
        reason: "Old rejection",
        created_at: "2026-01-01",
      },
    ],
  };
  assert.equal(contributionDecision(rejected), "Corrija o endereço.");
  assert.equal(contributionStatus("rejected").label, "Precisa de ajuste");
  assert.equal(contributionStatus("unknown").label, "Em análise");
  assert.equal(
    contributionTitle({ ...items[0], body: "ignore" }),
    "Lugar · Praça",
  );
});
test("feedback contains explicit fields and device summary only; invalid drafts are rejected", () => {
  const context = {
    version: "0.1.0",
    build: "Expo Go",
    platform: "ios",
    os: "26",
    model: "iPhone",
    email: "must-not-include@example.com",
    token: "must-not-include-token",
  };
  const report = feedbackReport(
    {
      screen: "Busca",
      description: "Não encontrei o botão.",
      expected: "Ver resultados",
      password: "do-not-include",
    },
    context,
  );
  assert(
    report.includes("NA REAL") &&
      report.includes("iPhone") &&
      report.includes("Não encontrei"),
  );
  assert(
    !report.includes("must-not-include") && !report.includes("do-not-include"),
  );
  assert.throws(
    () =>
      feedbackReport({ screen: "", description: "x", expected: "" }, context),
    /tela/,
  );
});
test("branded emails preserve Supabase confirmation URLs and avoid tracking/external assets", () => {
  const { emailBranding } = require("../scripts/auth-email-branding.cjs");
  const payload = emailBranding();
  assert.deepEqual(
    Object.keys(payload).sort(),
    [
      "smtp_sender_name",
      "mailer_subjects_confirmation",
      "mailer_subjects_recovery",
      "mailer_templates_confirmation_content",
      "mailer_templates_recovery_content",
    ].sort(),
  );
  assert.equal(payload.smtp_sender_name, "NA REAL");
  for (const kind of ["confirmation", "recovery"]) {
    assert(payload[`mailer_subjects_${kind}`].includes("NA REAL"));
    const html = payload[`mailer_templates_${kind}_content`];
    assert(
      html.includes('lang="pt-BR"') &&
        html.includes('href="{{ .ConfirmationURL }}"'),
    );
    assert.equal((html.match(/{{ \.ConfirmationURL }}/g) || []).length, 3);
    assert(!/<script|<img|onclick=|https?:\/\//i.test(html));
    assert(!html.includes("Supabase"));
    assert(
      readFileSync("supabase/config.toml", "utf8").includes(
        `[auth.email.template.${kind}]`,
      ),
    );
  }
});
