import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const committed = JSON.parse(await readFile("reports/generated/audit-results.json", "utf8"));
const reproduced = JSON.parse(await readFile(".tmp/audit/audit-results.json", "utf8"));
assert.deepEqual(reproduced, committed, "Committed audit results are stale or not reproducible");
console.log("Reproduced audit results exactly match the committed benchmark.");
