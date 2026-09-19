import { sha256 } from "./canonical.ts";

export interface LedgerEntry {
  sequence: number;
  timestamp: string;
  event: string;
  payload: Record<string, unknown>;
  previousHash: string;
  hash: string;
}

export function buildLedger(
  timestamp: string,
  events: Array<{ event: string; payload: Record<string, unknown> }>,
): LedgerEntry[] {
  const ledger: LedgerEntry[] = [];
  let previousHash = "GENESIS";
  for (const [index, item] of events.entries()) {
    const unsigned = {
      sequence: index + 1,
      timestamp,
      event: item.event,
      payload: item.payload,
      previousHash,
    };
    const entry = { ...unsigned, hash: sha256(unsigned) };
    ledger.push(entry);
    previousHash = entry.hash;
  }
  return ledger;
}

export function verifyLedger(ledger: LedgerEntry[]): {
  valid: boolean;
  error?: string;
} {
  let expectedPrevious = "GENESIS";
  for (const entry of ledger) {
    if (entry.previousHash !== expectedPrevious) {
      return { valid: false, error: `Broken link at sequence ${entry.sequence}` };
    }
    const { hash, ...unsigned } = entry;
    if (sha256(unsigned) !== hash) {
      return { valid: false, error: `Invalid hash at sequence ${entry.sequence}` };
    }
    expectedPrevious = hash;
  }
  return { valid: true };
}
