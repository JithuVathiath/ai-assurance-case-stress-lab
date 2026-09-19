export type Decision = "APPROVE" | "APPROVE_WITH_CONDITIONS" | "HALT";
export type ControlStatus = "PASS" | "AT_RISK" | "FAIL";
export type Severity = "low" | "medium" | "high" | "critical";

export interface FrameworkReference {
  framework: "EU AI Act" | "NIST AI RMF" | "ISO/IEC 42001";
  references: string[];
}

export interface Evidence {
  id: string;
  title: string;
  kind: string;
  owner: string;
  issuedAt: string;
  validUntil: string;
  independent: boolean;
  confidence: number;
  source: string;
  content: Record<string, unknown>;
  unavailable?: boolean;
}

export interface Rebuttal {
  id: string;
  statement: string;
  severity: Severity;
  resolved: boolean;
}

export interface Claim {
  id: string;
  statement: string;
  weight: number;
  evidenceIds: string[];
  rebuttals: Rebuttal[];
}

export interface FactCheck {
  path: string;
  operator: "gte" | "lte" | "eq" | "includes";
  expected: number | string | boolean;
  label: string;
}

export interface Control {
  id: string;
  title: string;
  criticality: number;
  claimIds: string[];
  factChecks: FactCheck[];
  mappings: FrameworkReference[];
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  open: boolean;
}

export interface AISystemCase {
  schemaVersion: string;
  asOf: string;
  system: {
    id: string;
    name: string;
    purpose: string;
    owner: string;
    lifecycleStage: string;
    riskClassification: string;
    inherentRisk: number;
  };
  facts: Record<string, unknown>;
  evidence: Evidence[];
  claims: Claim[];
  controls: Control[];
  incidents: Incident[];
  shocks: Shock[];
}

export type ShockOperation =
  | { type: "invalidateEvidence"; evidenceIds: string[] }
  | { type: "setFact"; path: string; value: unknown }
  | { type: "addIncident"; incident: Incident }
  | { type: "openRebuttal"; rebuttalId: string };

export interface Shock {
  id: string;
  title: string;
  hypothesis: string;
  operations: ShockOperation[];
}

export interface EvidenceAssessment {
  id: string;
  active: boolean;
  score: number;
  contentHash: string;
  reason: string;
}

export interface ClaimAssessment {
  id: string;
  score: number;
  evidence: EvidenceAssessment[];
  openRebuttals: string[];
}

export interface FactAssessment {
  label: string;
  path: string;
  observed: unknown;
  expected: unknown;
  passed: boolean;
}

export interface ControlAssessment {
  id: string;
  title: string;
  score: number;
  status: ControlStatus;
  criticality: number;
  claims: ClaimAssessment[];
  facts: FactAssessment[];
  mappings: FrameworkReference[];
}

export interface Evaluation {
  systemId: string;
  asOf: string;
  decision: Decision;
  assuranceScore: number;
  residualRisk: number;
  controls: ControlAssessment[];
  frameworkCoverage: Record<string, number>;
  blockingReasons: string[];
  conditions: string[];
}

export interface ShockResult {
  id: string;
  title: string;
  kind: "single" | "compound";
  decision: Decision;
  assuranceScore: number;
  residualRisk: number;
  riskDelta: number;
  failedControls: string[];
}

export interface EvidenceCriticality {
  evidenceId: string;
  title: string;
  riskDelta: number;
  decisionChanged: boolean;
  controlsAffected: string[];
}

export interface AuditBundle {
  generatedAt: string;
  caseFingerprint: string;
  baseline: Evaluation;
  shocks: ShockResult[];
  evidenceCriticality: EvidenceCriticality[];
}
