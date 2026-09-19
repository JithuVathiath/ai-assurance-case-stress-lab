import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { buildLedger, verifyLedger } from "./ledger.ts";
import type { AISystemCase, AuditBundle } from "./types.ts";

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function escapeCsv(value: unknown): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function buildMarkdown(input: AISystemCase, bundle: AuditBundle): string {
  const failed = bundle.shocks.filter((item) => item.decision === "HALT");
  const worst = [...bundle.shocks].sort((a, b) => b.residualRisk - a.residualRisk)[0];
  const topEvidence = bundle.evidenceCriticality.slice(0, 5);
  return `# Assurance Decision Report

> Deterministic portfolio demonstration. This is not legal advice, a conformity
> assessment, or a substitute for qualified review.

## Executive Decision

| Field | Result |
| --- | ---: |
| System | ${input.system.name} |
| Evaluation date | ${input.asOf} |
| Baseline decision | **${bundle.baseline.decision}** |
| Assurance score | ${percent(bundle.baseline.assuranceScore)} |
| Residual risk | ${bundle.baseline.residualRisk} / 100 |
| Stress scenarios ending in HALT | ${failed.length} / ${bundle.shocks.length} |
| Case fingerprint | \`${bundle.caseFingerprint}\` |

The baseline decision is conditional rather than binary: the engine preserves
the argument, evidence, test results, and unresolved conditions behind it. The
most damaging simulated scenario is **${worst.title}**, which raises residual
risk by **${worst.riskDelta} points** to ${worst.residualRisk}.

## Control-Level Assurance

| Control | Score | Status | Framework Touchpoints |
| --- | ---: | --- | --- |
${bundle.baseline.controls
  .map(
    (item) =>
      `| ${item.id} — ${item.title} | ${percent(item.score)} | ${item.status} | ${item.mappings.map((mapping) => mapping.framework).join(", ")} |`,
  )
  .join("\n")}

## Cross-Framework Coverage

${Object.entries(bundle.baseline.frameworkCoverage)
  .map(([framework, score]) => `- **${framework}:** ${percent(score)}`)
  .join("\n")}

Coverage is an evidence-weighted mapping, not a claim of certification or legal
compliance.

## Decision Conditions

${bundle.baseline.conditions.length ? bundle.baseline.conditions.map((item) => `- ${item}`).join("\n") : "- None."}

## Governance Shock Results

| Scenario | Type | Decision | Assurance | Residual Risk | Δ Risk | Failed Controls |
| --- | --- | --- | ---: | ---: | ---: | --- |
${bundle.shocks
  .map(
    (item) =>
      `| ${item.title} | ${item.kind} | ${item.decision} | ${percent(item.assuranceScore)} | ${item.residualRisk} | ${item.riskDelta >= 0 ? "+" : ""}${item.riskDelta} | ${item.failedControls.join(", ") || "—"} |`,
  )
  .join("\n")}

## Evidence Decision Criticality

This leave-one-evidence-out analysis identifies evidence whose disappearance
most changes the deployment decision. It is more useful than merely counting
documents.

| Evidence | Δ Residual Risk | Decision Changed | Controls Affected |
| --- | ---: | --- | --- |
${topEvidence
  .map(
    (item) =>
      `| ${item.evidenceId} — ${item.title} | +${item.riskDelta} | ${item.decisionChanged ? "Yes" : "No"} | ${item.controlsAffected.join(", ")} |`,
  )
  .join("\n")}

## Interpretation

The lab models governance as a falsifiable assurance argument. A control only
inherits confidence from current evidence, explicit factual thresholds, and
resolved rebuttals. Stress tests then remove those supports or change operating
facts to expose brittle approvals and correlated weaknesses.

The example is synthetic and intentionally contains one baseline condition so
that reviewers can inspect a realistic decision rather than a perfect demo.
`;
}

function buildMermaid(input: AISystemCase, bundle: AuditBundle): string {
  const lines = [
    "flowchart LR",
    `  DECISION[\"${bundle.baseline.decision}<br/>Risk ${bundle.baseline.residualRisk}/100\"]`,
  ];
  for (const control of bundle.baseline.controls) {
    const controlId = control.id.replaceAll("-", "_");
    lines.push(
      `  ${controlId}[\"${control.id}<br/>${control.status} ${(control.score * 100).toFixed(0)}%\"] --> DECISION`,
    );
    for (const claim of control.claims) {
      const claimId = claim.id.replaceAll("-", "_");
      lines.push(`  ${claimId}[\"${claim.id}\"] --> ${controlId}`);
      for (const evidence of claim.evidence) {
        const evidenceId = evidence.id.replaceAll("-", "_");
        lines.push(
          `  ${evidenceId}[(\"${evidence.id}<br/>${evidence.active ? "active" : "inactive"}\")] --> ${claimId}`,
        );
      }
    }
  }
  lines.push("  classDef pass fill:#d1fae5,stroke:#047857,color:#064e3b");
  lines.push("  classDef risk fill:#fef3c7,stroke:#b45309,color:#78350f");
  lines.push("  classDef fail fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d");
  const pass = bundle.baseline.controls.filter((item) => item.status === "PASS").map((item) => item.id.replaceAll("-", "_"));
  const risk = bundle.baseline.controls.filter((item) => item.status === "AT_RISK").map((item) => item.id.replaceAll("-", "_"));
  const fail = bundle.baseline.controls.filter((item) => item.status === "FAIL").map((item) => item.id.replaceAll("-", "_"));
  if (pass.length) lines.push(`  class ${pass.join(",")} pass`);
  if (risk.length) lines.push(`  class ${risk.join(",")} risk`);
  if (fail.length) lines.push(`  class ${fail.join(",")} fail`);
  return `${lines.join("\n")}\n`;
}

export async function writeReports(
  input: AISystemCase,
  bundle: AuditBundle,
  outputDirectory: string,
): Promise<void> {
  await mkdir(outputDirectory, { recursive: true });
  const ledger = buildLedger(bundle.generatedAt, [
    { event: "CASE_INGESTED", payload: { fingerprint: bundle.caseFingerprint } },
    {
      event: "BASELINE_DECIDED",
      payload: {
        decision: bundle.baseline.decision,
        assuranceScore: bundle.baseline.assuranceScore,
        residualRisk: bundle.baseline.residualRisk,
      },
    },
    {
      event: "STRESS_SUITE_COMPLETED",
      payload: {
        scenarios: bundle.shocks.length,
        halted: bundle.shocks.filter((item) => item.decision === "HALT").length,
      },
    },
  ]);
  const ledgerCheck = verifyLedger(ledger);
  if (!ledgerCheck.valid) throw new Error(ledgerCheck.error);

  const csvRows = [
    ["scenario_id", "title", "kind", "decision", "assurance_score", "residual_risk", "risk_delta", "failed_controls"],
    ...bundle.shocks.map((item) => [
      item.id,
      item.title,
      item.kind,
      item.decision,
      item.assuranceScore,
      item.residualRisk,
      item.riskDelta,
      item.failedControls.join(";"),
    ]),
  ];

  await Promise.all([
    writeFile(join(outputDirectory, "audit-results.json"), `${JSON.stringify(bundle, null, 2)}\n`),
    writeFile(join(outputDirectory, "executive-report.md"), buildMarkdown(input, bundle)),
    writeFile(join(outputDirectory, "assurance-case.mmd"), buildMermaid(input, bundle)),
    writeFile(
      join(outputDirectory, "stress-matrix.csv"),
      `${csvRows.map((row) => row.map(escapeCsv).join(",")).join("\n")}\n`,
    ),
    writeFile(
      join(outputDirectory, "audit-ledger.jsonl"),
      `${ledger.map((entry) => JSON.stringify(entry)).join("\n")}\n`,
    ),
  ]);
}
