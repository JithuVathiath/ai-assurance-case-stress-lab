# Scoring and Stress Method

## Evidence Support

An evidence record contributes zero when it is unavailable, expired, or not yet
issued on the case evaluation date. Active evidence contributes its stated
confidence, discounted to 86% when it is internally produced rather than
independent.

Multiple supporting records use a bounded accumulation:

```text
claim support = 1 - Π(1 - evidence score)
```

This rewards corroboration without allowing an unbounded document count.
Unresolved rebuttals apply disclosed severity multipliers: low 0.92, medium
0.78, high 0.58, and critical 0.30.

## Control Score

Each control combines weighted claim support with executable factual checks:

```text
control score = 0.72 × weighted claim score + 0.28 × passed-check ratio
```

- `PASS`: score at least 0.75
- `AT_RISK`: score from 0.50 through 0.749
- `FAIL`: score below 0.50

The overall assurance score is the control-criticality-weighted mean.

## Residual Risk and Decision Gates

```text
residual risk = clamp(inherent risk - 46 × assurance + open-incident cost, 0, 100)
```

Incident costs are 2, 5, 10, and 18 points for low, medium, high, and critical
open incidents. The engine returns `HALT` when residual risk reaches 65 or a
control with criticality 4 or 5 fails. Otherwise, an at-risk control or residual
risk of at least 38 creates `APPROVE_WITH_CONDITIONS`; the remaining state is
`APPROVE`.

These are declared portfolio assumptions, not regulatory thresholds.

## Counterfactual Tests

The example declares five single shocks. The engine evaluates each shock and
every pairwise combination, producing 15 scenarios. Operations can:

- invalidate one or more evidence records;
- change a measured operating fact;
- open a previously resolved rebuttal; or
- add an incident with a severity and response state.

The engine separately removes each evidence record from the baseline, reruns the
decision, and records risk change, affected controls, and whether the deployment
decision changed. This turns evidence inventory into decision-criticality
analysis.

## Minimal Evidence Cut Sets

The research extension enumerates every single evidence removal and every
two-evidence combination. A combination is retained only when it forces `HALT`
and no already discovered proper subset also forces `HALT`. This produces an
irreducible set of governance failure paths rather than a list inflated by
supersets of known failures.

The executed case searches 66 pairwise combinations in addition to 11 single
removals and identifies six minimal cut sets. The search is exhaustive only up
to size two; higher-order cut sets remain outside the declared scope.

## Policy Sensitivity

The default policy parameters are explicit constants rather than hidden
assumptions. A deterministic grid varies:

- internal-evidence discount: 0.75, 0.86, and 1.00;
- residual-risk reduction scale: 40, 46, and 52; and
- halt threshold: 45, 55, and 65.

The 27 configurations are evaluated on both the baseline and simulated critical-
incident case, producing 54 cells. This is a structured robustness analysis of
normative policy choices; it is not a statistical confidence interval.

## Reproducibility

The evaluation date is part of the case rather than the wall-clock runtime.
Canonical object serialisation sorts keys before SHA-256 hashing. Generated
timestamps derive from the evaluation date. A full rerun is therefore byte-for-
byte reproducible across supported systems.
