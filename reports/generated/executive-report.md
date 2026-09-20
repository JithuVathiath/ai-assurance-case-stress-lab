# Assurance Decision Report

> Deterministic portfolio demonstration. This is not legal advice, a conformity
> assessment, or a substitute for qualified review.

## Executive Decision

| Field | Result |
| --- | ---: |
| System | Northstar Consumer Credit Decisioning System |
| Evaluation date | 2026-09-15 |
| Baseline decision | **APPROVE_WITH_CONDITIONS** |
| Assurance score | 90.3% |
| Residual risk | 26.5 / 100 |
| Stress scenarios ending in HALT | 9 / 15 |
| Case fingerprint | `e8e0c53cf3cf3ce0d200cdaceb466890d44da0fadc8b31f6c6d407d4a52578ad` |

The baseline decision is conditional rather than binary: the engine preserves
the argument, evidence, test results, and unresolved conditions behind it. The
most damaging simulated scenario is **Correlated assurance-evidence loss + Uncontained critical incident**, which raises residual
risk by **26 points** to 52.5.

## Control-Level Assurance

| Control | Score | Status | Framework Touchpoints |
| --- | ---: | --- | --- |
| GOV-01 — Accountability and lifecycle risk management | 98.7% | PASS | EU AI Act, NIST AI RMF, ISO/IEC 42001 |
| DATA-02 — Data lineage and quality fitness | 87.5% | PASS | EU AI Act, NIST AI RMF, ISO/IEC 42001 |
| FAIR-03 — Outcome equity, transparency, and contestability | 66.7% | AT_RISK | EU AI Act, NIST AI RMF, ISO/IEC 42001 |
| HUM-04 — Effective human oversight and stop authority | 98.7% | PASS | EU AI Act, NIST AI RMF, ISO/IEC 42001 |
| MON-05 — Post-deployment monitoring and incident response | 98.3% | PASS | EU AI Act, NIST AI RMF, ISO/IEC 42001 |
| SEC-06 — Robustness, calibration, and adversarial resilience | 93.9% | PASS | EU AI Act, NIST AI RMF, ISO/IEC 42001 |

## Cross-Framework Coverage

- **EU AI Act:** 90.3%
- **NIST AI RMF:** 90.3%
- **ISO/IEC 42001:** 90.3%

Coverage is an evidence-weighted mapping, not a claim of certification or legal
compliance.

## Decision Conditions

- Strengthen FAIR-03: Outcome equity, transparency, and contestability

## Governance Shock Results

| Scenario | Type | Decision | Assurance | Residual Risk | Δ Risk | Failed Controls |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Correlated assurance-evidence loss | single | HALT | 77.0% | 32.6 | +6.1 | DATA-02, FAIR-03 |
| Demographic outcome drift | single | HALT | 85.4% | 28.7 | +2.2 | FAIR-03 |
| Human-override degradation | single | APPROVE_WITH_CONDITIONS | 85.0% | 28.9 | +2.4 | — |
| Uncontained critical incident | single | APPROVE_WITH_CONDITIONS | 86.2% | 46.3 | +19.8 | — |
| Adversarial robustness collapse | single | APPROVE_WITH_CONDITIONS | 87.6% | 27.7 | +1.2 | — |
| Correlated assurance-evidence loss + Demographic outcome drift | compound | HALT | 75.2% | 33.4 | +6.9 | DATA-02, FAIR-03 |
| Correlated assurance-evidence loss + Human-override degradation | compound | HALT | 71.6% | 35.1 | +8.6 | DATA-02, FAIR-03 |
| Correlated assurance-evidence loss + Uncontained critical incident | compound | HALT | 72.8% | 52.5 | +26 | DATA-02, FAIR-03 |
| Correlated assurance-evidence loss + Adversarial robustness collapse | compound | HALT | 74.2% | 33.9 | +7.4 | DATA-02, FAIR-03 |
| Demographic outcome drift + Human-override degradation | compound | HALT | 80.0% | 31.2 | +4.7 | FAIR-03 |
| Demographic outcome drift + Uncontained critical incident | compound | HALT | 81.3% | 48.6 | +22.1 | FAIR-03 |
| Demographic outcome drift + Adversarial robustness collapse | compound | HALT | 82.6% | 30 | +3.5 | FAIR-03 |
| Human-override degradation + Uncontained critical incident | compound | APPROVE_WITH_CONDITIONS | 80.8% | 48.8 | +22.3 | — |
| Human-override degradation + Adversarial robustness collapse | compound | APPROVE_WITH_CONDITIONS | 82.2% | 30.2 | +3.7 | — |
| Uncontained critical incident + Adversarial robustness collapse | compound | APPROVE_WITH_CONDITIONS | 83.4% | 47.6 | +21.1 | — |

## Evidence Decision Criticality

This leave-one-evidence-out analysis identifies evidence whose disappearance
most changes the deployment decision. It is more useful than merely counting
documents.

| Evidence | Δ Residual Risk | Decision Changed | Controls Affected |
| --- | ---: | --- | --- |
| EV-003 — Feature-level data lineage export | +4 | Yes | DATA-02 |
| EV-009 — Independent adversarial security assessment | +2.2 | No | SEC-06 |
| EV-010 — Robustness and calibration evaluation | +2.2 | No | SEC-06 |
| EV-004 — External subgroup outcome audit | +2 | Yes | FAIR-03 |
| EV-006 — Observed human-override simulation | +1.2 | No | HUM-04 |

## Minimal Evidence Cut Sets

A cut set is the smallest set of unavailable evidence records that forces a
`HALT`; no proper subset has the same effect. Searching all single and pairwise
evidence removals found **6**
minimal cut sets.

| Evidence Cut Set | Size | Residual Risk | Failed Controls |
| --- | ---: | ---: | --- |
| EV-003 | 1 | 30.5 | DATA-02 |
| EV-004 | 1 | 28.5 | FAIR-03 |
| EV-005 + EV-006 | 2 | 32.7 | HUM-04 |
| EV-005 + EV-011 | 2 | 28.8 | FAIR-03 |
| EV-007 + EV-008 | 2 | 31.5 | MON-05 |
| EV-009 + EV-010 | 2 | 30.9 | SEC-06 |

## Policy Sensitivity Experiment

The same cases were evaluated across **27 policy configurations per scenario** (54 total). The grid varies the internal-evidence discount, risk-reduction scale, and halt threshold rather than hiding these normative choices inside one score.

| Outcome Across Grid | Count |
| --- | ---: |
| APPROVE | 0 |
| APPROVE_WITH_CONDITIONS | 48 |
| HALT | 6 |

Assurance ranges from **84.6% to 92.3%** and residual risk from **20 to 52.2**. The complete grid is committed as `policy-sensitivity.csv` so reviewers can inspect every configuration.

## Interpretation

The lab models governance as a falsifiable assurance argument. A control only
inherits confidence from current evidence, explicit factual thresholds, and
resolved rebuttals. Stress tests then remove those supports or change operating
facts to expose brittle approvals and correlated weaknesses.

The example is synthetic and intentionally contains one baseline condition so
that reviewers can inspect a realistic decision rather than a perfect demo.
