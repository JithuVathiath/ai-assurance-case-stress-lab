# Framework Notes and Limitations

## Reference Position

The repository uses primary-source material available on 15 September 2026.
Its framework references are intentionally concise and should be reviewed when
source law, guidance, or standards change.

### EU AI Act

The mapping uses Regulation (EU) 2024/1689 as published on EUR-Lex. It focuses on
risk management, data governance, human oversight, accuracy and robustness,
post-market monitoring, and serious-incident reporting. Applicability, provider
or deployer status, transition dates, sector rules, and jurisdictional facts
require qualified legal analysis. The fictional credit system is treated as
material/high-risk for testing; that is a scenario assumption, not a legal
classification.

Primary source: <https://eur-lex.europa.eu/eli/reg/2024/1689/oj>

### NIST AI RMF

NIST AI RMF 1.0 is voluntary and organises risk activity into Govern, Map,
Measure, and Manage. NIST states that version 1.0 is being revised. The project
uses selected outcomes as traceability labels, not as a one-size-fits-all
checklist.

Primary source: <https://www.nist.gov/itl/ai-risk-management-framework>

### ISO/IEC 42001

The repository references high-level clause and control families using ISO's
public overview. It does not reproduce the standard, claim implementation of
all requirements, or provide an accredited conformity assessment.

Primary source: <https://www.iso.org/artificial-intelligence/ai-management-systems>

## Important Limits

- Synthetic evidence demonstrates engineering behaviour, not operational
  compliance.
- A SHA-256 content hash demonstrates integrity within this repository, not the
  identity or authority of an evidence issuer.
- A crosswalk expresses an analyst's traceability hypothesis. It requires expert
  validation and does not establish equivalence among frameworks.
- Fairness metrics and thresholds depend on law, context, affected populations,
  harms, and organisational risk appetite.
- The worked decision should not be used for real applicants or production
  deployment.
