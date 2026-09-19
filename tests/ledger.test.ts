import test from "node:test";
import assert from "node:assert/strict";
import { buildLedger, verifyLedger } from "../src/ledger.ts";

const events = [
  { event: "INGEST", payload: { case: "demo" } },
  { event: "DECIDE", payload: { decision: "APPROVE_WITH_CONDITIONS" } },
];

test("cryptographic ledger verifies when untouched", () => {
  const ledger = buildLedger("2026-09-15T00:00:00.000Z", events);
  assert.equal(verifyLedger(ledger).valid, true);
  assert.equal(ledger[1].previousHash, ledger[0].hash);
});

test("cryptographic ledger detects a changed historical decision", () => {
  const ledger = buildLedger("2026-09-15T00:00:00.000Z", events);
  ledger[0].payload.case = "tampered";
  const result = verifyLedger(ledger);
  assert.equal(result.valid, false);
  assert.match(result.error!, /Invalid hash/);
});
