#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { runAudit } from "./stress.ts";
import { writeReports } from "./report.ts";
import type { AISystemCase } from "./types.ts";

function usage(): never {
  console.error("Usage: node src/cli.ts audit <case.json> [--out <directory>]");
  process.exit(2);
}

const [, , command, casePath, ...options] = process.argv;
if (command !== "audit" || !casePath) usage();
const outIndex = options.indexOf("--out");
const outputDirectory = resolve(outIndex >= 0 ? options[outIndex + 1] : "reports/generated");
if (outIndex >= 0 && !options[outIndex + 1]) usage();

const input = JSON.parse(await readFile(resolve(casePath), "utf8")) as AISystemCase;
const bundle = runAudit(input);
await writeReports(input, bundle, outputDirectory);

console.log(`Decision: ${bundle.baseline.decision}`);
console.log(`Assurance: ${(bundle.baseline.assuranceScore * 100).toFixed(1)}%`);
console.log(`Residual risk: ${bundle.baseline.residualRisk}/100`);
console.log(`Stress scenarios: ${bundle.shocks.length}`);
console.log(`Reports: ${outputDirectory}`);
