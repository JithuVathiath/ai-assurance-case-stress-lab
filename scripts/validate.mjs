import { readFile } from "node:fs/promises";

const input = JSON.parse(
  await readFile(new URL("../examples/credit-decisioning-ai.json", import.meta.url), "utf8"),
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function unique(items, label) {
  assert(new Set(items).size === items.length, `${label} identifiers must be unique`);
}

assert(input.schemaVersion === "1.0", "Unsupported schema version");
assert(/^\d{4}-\d{2}-\d{2}$/.test(input.asOf), "asOf must be an ISO date");
assert(input.system.inherentRisk >= 0 && input.system.inherentRisk <= 100, "Risk must be 0-100");
unique(input.evidence.map((item) => item.id), "Evidence");
unique(input.claims.map((item) => item.id), "Claim");
unique(input.controls.map((item) => item.id), "Control");
unique(input.shocks.map((item) => item.id), "Shock");

const evidenceIds = new Set(input.evidence.map((item) => item.id));
const claimIds = new Set(input.claims.map((item) => item.id));
for (const evidence of input.evidence) {
  assert(evidence.confidence >= 0 && evidence.confidence <= 1, `${evidence.id} confidence is invalid`);
  assert(evidence.issuedAt <= evidence.validUntil, `${evidence.id} dates are reversed`);
  assert(Object.keys(evidence.content).length > 0, `${evidence.id} content cannot be empty`);
}
for (const claim of input.claims) {
  assert(claim.evidenceIds.length > 0, `${claim.id} has no evidence`);
  for (const id of claim.evidenceIds) assert(evidenceIds.has(id), `${claim.id} references ${id}`);
}
for (const control of input.controls) {
  assert(control.mappings.length === 3, `${control.id} must map all three frameworks`);
  for (const id of control.claimIds) assert(claimIds.has(id), `${control.id} references ${id}`);
}

console.log(`Validated ${input.evidence.length} evidence records, ${input.claims.length} claims, ${input.controls.length} controls, and ${input.shocks.length} shocks.`);
