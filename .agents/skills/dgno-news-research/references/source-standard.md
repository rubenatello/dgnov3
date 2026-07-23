# DGNO source and verification standard

## Source tiers

Use tiers as a starting point, not a substitute for judgment.

1. Primary records: enacted law, court dockets and opinions, agency records, official datasets, original media, direct testimony, and contemporaneous documents.
2. Direct accountable reporting: named reporters and outlets that describe their sourcing, link documents, correct errors, and distinguish fact from analysis.
3. Specialized secondary sources: subject-matter publications, researchers, watchdogs, and local outlets with relevant access or expertise.
4. Interested-party material: government releases, campaigns, corporations, unions, advocacy groups, attorneys, and public relations statements.
5. Unverified material: anonymous social posts, reposts, screenshots without provenance, unattributed compilations, and AI-generated summaries.

An interested party can possess decisive primary evidence. A prestigious outlet can still be wrong. Evaluate the specific evidence.

## Evidence ledger

Record one row per material claim:

| Field | Required content |
| --- | --- |
| Claim | A narrow falsifiable statement |
| Status | confirmed, supported, disputed, unconfirmed, false, or unknown |
| Best evidence | The strongest direct support |
| Counterevidence | Credible contradictory or limiting evidence |
| Attribution | Who asserts or observed it |
| Source | Direct canonical URL or document identifier |
| Event date | When the underlying event occurred |
| Published/updated | When the source appeared or changed |
| Accessed | ISO 8601 timestamp with timezone |
| Notes | Method, caveat, correction, archive, or access limitation |

## Status meanings

- `confirmed`: directly established by reliable primary evidence or multiple independent high-quality sources with no material conflict.
- `supported`: credible evidence points to the claim, but a meaningful gap remains.
- `disputed`: credible sources materially conflict; describe the conflict without choosing a side beyond the evidence.
- `unconfirmed`: asserted but not independently substantiated.
- `false`: reliable evidence directly refutes the claim.
- `unknown`: available evidence cannot responsibly resolve the question.

## Source diversity

For consequential claims, seek:

- The primary record or closest available evidence.
- A source independent of the entity making the claim.
- The strongest credible challenge, correction, or alternative explanation.
- Local reporting when geography matters.
- Domain expertise when legal, scientific, medical, statistical, or technical interpretation matters.

## Corrections and change tracking

Recheck the primary URL before submission. Note corrections, silent updates, changed headlines, retractions, and later procedural developments. Preserve access time and, when lawful and useful, an archive URL or content fingerprint. Do not rely on an archived copy to conceal that the current source has changed.
