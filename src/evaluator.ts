import { round, sha256 } from "./canonical.ts";
import type {
  AISystemCase,
  Claim,
  ClaimAssessment,
  Control,
  ControlAssessment,
  ControlStatus,
  Evaluation,
  Evidence,
  EvidenceAssessment,
  FactAssessment,
  Severity,
} from "./types.ts";

const rebuttalPenalty: Record<Severity, number> = {
  low: 0.92,
  medium: 0.78,
  high: 0.58,
  critical: 0.3,
};

const incidentPenalty: Record<Severity, number> = {
  low: 2,
  medium: 5,
  high: 10,
  critical: 18,
};

function getPath(root: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object" && key in value) {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }, root);
}

function assessEvidence(evidence: Evidence, asOf: string): EvidenceAssessment {
  const unavailable = Boolean(evidence.unavailable);
  const expired = evidence.validUntil < asOf;
  const notIssued = evidence.issuedAt > asOf;
  const active = !unavailable && !expired && !notIssued;
  const independence = evidence.independent ? 1 : 0.86;
  const score = active ? evidence.confidence * independence : 0;
  const reason = unavailable
    ? "unavailable"
    : expired
      ? "expired"
      : notIssued
        ? "not yet issued"
        : evidence.independent
          ? "active, independent evidence"
          : "active, internally produced evidence";
  return {
    id: evidence.id,
    active,
    score: round(score),
    contentHash: sha256(evidence.content),
    reason,
  };
}

function assessClaim(
  claim: Claim,
  evidenceById: Map<string, Evidence>,
  asOf: string,
): ClaimAssessment {
  const evidence = claim.evidenceIds.map((id) => {
    const item = evidenceById.get(id);
    if (!item) {
      return {
        id,
        active: false,
        score: 0,
        contentHash: "MISSING",
        reason: "evidence record missing",
      };
    }
    return assessEvidence(item, asOf);
  });
  const activeScores = evidence.filter((item) => item.active).map((item) => item.score);
  const support = activeScores.length
    ? 1 - activeScores.reduce((remaining, score) => remaining * (1 - score), 1)
    : 0;
  const open = claim.rebuttals.filter((item) => !item.resolved);
  const penalty = open.reduce(
    (current, item) => current * rebuttalPenalty[item.severity],
    1,
  );
  return {
    id: claim.id,
    score: round(support * penalty),
    evidence,
    openRebuttals: open.map((item) => item.id),
  };
}

function compare(observed: unknown, operator: string, expected: unknown): boolean {
  if (operator === "gte") return Number(observed) >= Number(expected);
  if (operator === "lte") return Number(observed) <= Number(expected);
  if (operator === "eq") return observed === expected;
  if (operator === "includes") {
    return Array.isArray(observed) && observed.includes(expected);
  }
  return false;
}

function assessFacts(control: Control, facts: Record<string, unknown>): FactAssessment[] {
  return control.factChecks.map((check) => {
    const observed = getPath(facts, check.path);
    return {
      label: check.label,
      path: check.path,
      observed,
      expected: check.expected,
      passed: compare(observed, check.operator, check.expected),
    };
  });
}

function statusFor(score: number): ControlStatus {
  if (score >= 0.75) return "PASS";
  if (score >= 0.5) return "AT_RISK";
  return "FAIL";
}

function assessControl(
  control: Control,
  claimsById: Map<string, Claim>,
  evidenceById: Map<string, Evidence>,
  factsRoot: Record<string, unknown>,
  asOf: string,
): ControlAssessment {
  const claims = control.claimIds.map((id) => {
    const claim = claimsById.get(id);
    if (!claim) {
      return { id, score: 0, evidence: [], openRebuttals: ["MISSING_CLAIM"] };
    }
    return assessClaim(claim, evidenceById, asOf);
  });
  const weighted = claims.reduce((sum, assessment) => {
    const weight = claimsById.get(assessment.id)?.weight ?? 1;
    return sum + assessment.score * weight;
  }, 0);
  const totalWeight = claims.reduce(
    (sum, assessment) => sum + (claimsById.get(assessment.id)?.weight ?? 1),
    0,
  );
  const claimScore = totalWeight ? weighted / totalWeight : 0;
  const facts = assessFacts(control, factsRoot);
  const factScore = facts.length
    ? facts.filter((item) => item.passed).length / facts.length
    : 1;
  const score = round(claimScore * 0.72 + factScore * 0.28);
  return {
    id: control.id,
    title: control.title,
    score,
    status: statusFor(score),
    criticality: control.criticality,
    claims,
    facts,
    mappings: control.mappings,
  };
}

export function evaluate(input: AISystemCase): Evaluation {
  const claimsById = new Map(input.claims.map((item) => [item.id, item]));
  const evidenceById = new Map(input.evidence.map((item) => [item.id, item]));
  const factsRoot = { system: input.system, facts: input.facts };
  const controls = input.controls.map((control) =>
    assessControl(control, claimsById, evidenceById, factsRoot, input.asOf),
  );
  const criticalityTotal = controls.reduce((sum, item) => sum + item.criticality, 0);
  const assuranceScore = round(
    controls.reduce((sum, item) => sum + item.score * item.criticality, 0) /
      criticalityTotal,
  );
  const openIncidentCost = input.incidents
    .filter((item) => item.open)
    .reduce((sum, item) => sum + incidentPenalty[item.severity], 0);
  const residualRisk = round(
    Math.min(100, Math.max(0, input.system.inherentRisk - assuranceScore * 46 + openIncidentCost)),
    1,
  );
  const criticalFailures = controls.filter(
    (item) => item.status === "FAIL" && item.criticality >= 4,
  );
  const decision =
    criticalFailures.length > 0 || residualRisk >= 65
      ? "HALT"
      : controls.some((item) => item.status !== "PASS") || residualRisk >= 38
        ? "APPROVE_WITH_CONDITIONS"
        : "APPROVE";
  const blockingReasons = criticalFailures.map(
    (item) => `${item.id}: ${item.title} failed at ${item.score}`,
  );
  if (residualRisk >= 65) blockingReasons.push(`Residual risk ${residualRisk} exceeds 65`);
  const conditions = controls
    .filter((item) => item.status === "AT_RISK")
    .map((item) => `Strengthen ${item.id}: ${item.title}`);

  const frameworkNames = [...new Set(
    controls.flatMap((control) => control.mappings.map((mapping) => mapping.framework)),
  )];
  const frameworkCoverage = Object.fromEntries(
    frameworkNames.map((framework) => {
      const mapped = controls.filter((control) =>
        control.mappings.some((mapping) => mapping.framework === framework),
      );
      const weight = mapped.reduce((sum, item) => sum + item.criticality, 0);
      const score = mapped.reduce(
        (sum, item) => sum + item.score * item.criticality,
        0,
      );
      return [framework, round(score / weight)];
    }),
  );

  return {
    systemId: input.system.id,
    asOf: input.asOf,
    decision,
    assuranceScore,
    residualRisk,
    controls,
    frameworkCoverage,
    blockingReasons,
    conditions,
  };
}
