import { sha256 } from "./canonical.ts";
import { evaluate } from "./evaluator.ts";
import type {
  AISystemCase,
  AuditBundle,
  EvidenceCriticality,
  Shock,
  ShockResult,
} from "./types.ts";

function cloneCase(input: AISystemCase): AISystemCase {
  return structuredClone(input);
}

function setPath(root: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(".");
  let cursor: Record<string, unknown> = root;
  for (const part of parts.slice(0, -1)) {
    if (!cursor[part] || typeof cursor[part] !== "object") cursor[part] = {};
    cursor = cursor[part] as Record<string, unknown>;
  }
  cursor[parts.at(-1)!] = value;
}

export function applyShock(input: AISystemCase, shock: Shock): AISystemCase {
  const changed = cloneCase(input);
  for (const operation of shock.operations) {
    if (operation.type === "invalidateEvidence") {
      for (const evidence of changed.evidence) {
        if (operation.evidenceIds.includes(evidence.id)) evidence.unavailable = true;
      }
    } else if (operation.type === "setFact") {
      setPath(changed as unknown as Record<string, unknown>, operation.path, operation.value);
    } else if (operation.type === "addIncident") {
      changed.incidents.push(operation.incident);
    } else if (operation.type === "openRebuttal") {
      for (const claim of changed.claims) {
        const rebuttal = claim.rebuttals.find((item) => item.id === operation.rebuttalId);
        if (rebuttal) rebuttal.resolved = false;
      }
    }
  }
  return changed;
}

function resultFor(
  input: AISystemCase,
  baselineRisk: number,
  id: string,
  title: string,
  kind: "single" | "compound",
): ShockResult {
  const result = evaluate(input);
  return {
    id,
    title,
    kind,
    decision: result.decision,
    assuranceScore: result.assuranceScore,
    residualRisk: result.residualRisk,
    riskDelta: Number((result.residualRisk - baselineRisk).toFixed(1)),
    failedControls: result.controls
      .filter((item) => item.status === "FAIL")
      .map((item) => item.id),
  };
}

function evidenceCriticality(
  input: AISystemCase,
  baselineDecision: string,
  baselineRisk: number,
): EvidenceCriticality[] {
  return input.evidence
    .map((evidence) => {
      const changed = cloneCase(input);
      const selected = changed.evidence.find((item) => item.id === evidence.id)!;
      selected.unavailable = true;
      const result = evaluate(changed);
      const controlsAffected = result.controls
        .filter((control) =>
          control.claims.some((claim) =>
            claim.evidence.some((item) => item.id === evidence.id),
          ),
        )
        .map((item) => item.id);
      return {
        evidenceId: evidence.id,
        title: evidence.title,
        riskDelta: Number((result.residualRisk - baselineRisk).toFixed(1)),
        decisionChanged: result.decision !== baselineDecision,
        controlsAffected,
      };
    })
    .sort((left, right) => right.riskDelta - left.riskDelta);
}

export function runAudit(input: AISystemCase): AuditBundle {
  const baseline = evaluate(input);
  const singles = input.shocks.map((shock) =>
    resultFor(
      applyShock(input, shock),
      baseline.residualRisk,
      shock.id,
      shock.title,
      "single",
    ),
  );
  const compounds: ShockResult[] = [];
  for (let left = 0; left < input.shocks.length; left += 1) {
    for (let right = left + 1; right < input.shocks.length; right += 1) {
      const first = input.shocks[left];
      const second = input.shocks[right];
      const changed = applyShock(applyShock(input, first), second);
      compounds.push(
        resultFor(
          changed,
          baseline.residualRisk,
          `${first.id}+${second.id}`,
          `${first.title} + ${second.title}`,
          "compound",
        ),
      );
    }
  }
  return {
    generatedAt: `${input.asOf}T00:00:00.000Z`,
    caseFingerprint: sha256(input),
    baseline,
    shocks: [...singles, ...compounds],
    evidenceCriticality: evidenceCriticality(
      input,
      baseline.decision,
      baseline.residualRisk,
    ),
  };
}
