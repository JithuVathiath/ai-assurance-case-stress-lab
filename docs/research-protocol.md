# Research Protocol

## Research Position

The project investigates whether an AI deployment decision remains defensible
when its evidence graph and governance assumptions are deliberately weakened.
It does not ask whether a document exists; it asks which claims that document
supports, which rebuttals remain open, and whether the decision survives its
loss.

## Research Questions

### RQ1 — Assurance Traceability

Can every deployment decision be traced from control status through explicit
claims to current, content-hashed evidence and measured facts?

- **Endpoint:** no orphan control, claim, or evidence reference in the validated
  example; a complete generated assurance graph.

### RQ2 — Governance Shock Robustness

How often does the baseline decision survive single and pairwise governance
failures?

- **Protocol:** five predefined single shocks and all ten pairwise combinations.
- **Endpoint:** decision, assurance, residual-risk change, and failed controls.
- **Observed:** 9 of 15 counterfactual scenarios force `HALT`.

### RQ3 — Evidence Failure Topology

Which smallest evidence failures are sufficient to make continued deployment
unacceptable under the declared policy?

- **Protocol:** exhaustive leave-one-out and pairwise removal of 11 evidence
  records, followed by proper-subset minimisation.
- **Observed:** six minimal cut sets: two single-artifact and four pairwise paths.

### RQ4 — Normative Policy Sensitivity

Would reasonable changes to evidence independence, risk-reduction scale, or halt
threshold alter the conclusion?

- **Protocol:** a 3 × 3 × 3 parameter grid evaluated on the baseline and critical-
  incident scenarios.
- **Observed:** 54 evaluations produce 48 conditional approvals and six halts;
  assurance ranges from 84.6% to 92.3% and residual risk from 20.0 to 52.2.

### RQ5 — Audit Integrity

Can modification of a prior decision event be detected without an external
database?

- **Endpoint:** a SHA-256 chain verifies when untouched and fails after a tested
  historical-payload mutation.

## Case and Experimental Controls

- The worked case is synthetic, inspectable, and versioned.
- Evaluation date is fixed in the case, so evidence validity does not drift with
  wall-clock execution.
- Shock operations and policy grids are declared before evaluation.
- Canonical key ordering makes hashes reproducible.
- Generated outputs must exactly match a fresh run in CI.
- The project contains no production customer records or hidden evidence.

## Interpretation Rule

Results describe the internal behaviour of a declared assurance model. They do
not estimate the probability of legal compliance, operational harm, or regulator
acceptance. A changed result under the sensitivity grid is evidence of policy
dependence, not evidence that one parameter value is correct.
