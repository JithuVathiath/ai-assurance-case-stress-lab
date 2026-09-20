import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { evaluate } from "../src/evaluator.ts";
import { applyShock, runAudit } from "../src/stress.ts";
import type { AISystemCase } from "../src/types.ts";

const fixture = JSON.parse(
  await readFile(new URL("../examples/credit-decisioning-ai.json", import.meta.url), "utf8"),
) as AISystemCase;

test("baseline preserves the conditional approval and measured scores", () => {
  const result = evaluate(fixture);
  assert.equal(result.decision, "APPROVE_WITH_CONDITIONS");
  assert.equal(result.assuranceScore, 0.903);
  assert.equal(result.residualRisk, 26.5);
  assert.deepEqual(
    result.controls.filter((item) => item.status === "AT_RISK").map((item) => item.id),
    ["FAIR-03"],
  );
});

test("correlated evidence loss halts the system", () => {
  const shock = fixture.shocks.find((item) => item.id === "SH-EVIDENCE")!;
  const result = evaluate(applyShock(fixture, shock));
  assert.equal(result.decision, "HALT");
  assert.deepEqual(
    result.controls.filter((item) => item.status === "FAIL").map((item) => item.id),
    ["DATA-02", "FAIR-03"],
  );
});

test("stress suite includes every single and pairwise compound scenario", () => {
  const bundle = runAudit(fixture);
  assert.equal(bundle.shocks.filter((item) => item.kind === "single").length, 5);
  assert.equal(bundle.shocks.filter((item) => item.kind === "compound").length, 10);
  assert.equal(bundle.shocks.filter((item) => item.decision === "HALT").length, 9);
});

test("critical incident raises risk without silently changing evidence", () => {
  const shock = fixture.shocks.find((item) => item.id === "SH-INCIDENT")!;
  const result = evaluate(applyShock(fixture, shock));
  assert.equal(result.residualRisk, 46.3);
  assert.ok(result.residualRisk > evaluate(fixture).residualRisk);
  assert.ok(result.controls.every((item) => item.claims.every((claim) => claim.evidence.length > 0)));
});

test("audit is deterministic for an identical case", () => {
  assert.deepEqual(runAudit(fixture), runAudit(structuredClone(fixture)));
});

test("research analysis finds minimal governance failure cut sets", () => {
  const research = runAudit(fixture).research;
  assert.equal(research.minimalEvidenceCutSets.length, 6);
  assert.ok(
    research.minimalEvidenceCutSets.some(
      (item) => item.evidenceIds.join("+") === "EV-009+EV-010",
    ),
  );
  assert.ok(
    research.minimalEvidenceCutSets.every(
      (item) => item.size === item.evidenceIds.length && item.failedControls.length > 0,
    ),
  );
});

test("policy sensitivity makes normative choices observable", () => {
  const sensitivity = runAudit(fixture).research.policySensitivity;
  assert.equal(sensitivity.configurationsPerScenario, 27);
  assert.equal(sensitivity.cells.length, 54);
  assert.deepEqual(sensitivity.decisionCounts, {
    APPROVE: 0,
    APPROVE_WITH_CONDITIONS: 48,
    HALT: 6,
  });
  assert.deepEqual(sensitivity.residualRiskRange, [20, 52.2]);
});

test("invalid policy weights fail closed", () => {
  assert.throws(
    () =>
      evaluate(fixture, {
        internalEvidenceDiscount: 0.86,
        claimWeight: 0.7,
        factWeight: 0.4,
        riskReductionScale: 46,
        haltRiskThreshold: 65,
        conditionalRiskThreshold: 38,
        criticalControlFloor: 4,
      }),
    /sum to one/,
  );
});
