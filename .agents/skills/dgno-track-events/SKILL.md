---
name: dgno-track-events
description: Discover, scrape, crawl, vet, deduplicate, or propose corrections for DGNO's Firebase trackers, then create a local JSON review package for the authenticated editorial inbox. Use for the U.S. military boat-strikes tracker, federal-officer impeding or interfering tracker, future CBP/DHS involved-shooting trackers, recurring event monitoring, tracker audits, source-backed corrections, and normalized incident ingestion. Do not use it for unsourced rumor, broad personal-data collection, deleting tracker records, direct Firebase writes, or changing tracker schemas without an explicit request.
---

# DGNO Tracker Reporting

Maintain public trackers as auditable datasets rather than lists of headlines. Invoke `$dgno-news-research` for every discovery or verification pass.

## Workflow

1. Read `references/current-trackers.md`, then fetch the live schema because field definitions can change:

   `node app/scripts/dgno-editorial.mjs trackers list`

2. Define the tracker, date window, jurisdictions, search terms, and crawl stopping condition.
3. Search current primary sources and accountable reporting. Use bounded crawling and the source rules from `$dgno-news-research`.
4. Build an evidence ledger for each candidate. Separate occurrence, allegation, identity, casualty, arrest, charge, release, conviction, location, and legal-authority claims.
5. List current incidents before proposing an addition:

   `node app/scripts/dgno-editorial.mjs incidents list --tracker <tracker-id-or-slug>`

6. Check duplicates by event date plus location, people, vessel count, operation, or other stable identifiers. Treat different headlines about the same event as one incident. Investigate count or field discrepancies rather than incrementing blindly.
7. Map only verified values into current custom fields. Preserve uncertainty in `Notes` or `Description` and in the structured evidence metadata.
8. Create the `dgno.tracker-incident.v1` JSON package described in `references/current-trackers.md` with at least one direct source and a verification status of `confirmed`, `supported`, or `disputed`.
9. Save it under `editorial-inbox/trackers/YYYY-MM-DD-descriptive-slug.json`. Create the local directory when needed; it is intentionally ignored by Git.
10. Report the package path, proposed operation, tracker, verification status, sources, duplicate findings, and material uncertainties. Instruct the editor to review it at `/dashboard/editorial-inbox` while signed in. Do not apply it to Firebase yourself.

## Evidence thresholds

- Confirm that an event occurred before proposing an active incident. An official announcement can confirm that the government says it acted; it does not by itself confirm every characterization, target identity, threat assessment, casualty number, or legal justification.
- Corroborate consequential claims independently when feasible. If credible accounts conflict, use `disputed` and describe both claims precisely.
- For arrests and prosecutions, distinguish detained, arrested, cited, charged, indicted, released, case dismissed, acquitted, and convicted.
- For fatalities or injuries, state who reported the number and whether names or identities are independently confirmed.
- For military strikes, distinguish strike count, vessels struck, persons reported killed, captured, missing, or rescued. Do not call a person a trafficker or terrorist as established fact without adequate evidence.
- For federal-officer incidents, identify the agency when confirmed and distinguish interference allegations from filed charges and adjudicated outcomes.

## Data safeguards

- Use read-only `trackers list` and `incidents list` commands only. Never call the writer with `--apply` or use another direct Firebase write path.
- Never request, store, print, or use a Firebase email, password, refresh token, service-account key, or superuser credential.
- Never delete an incident. Propose an attributed update with an audit reason.
- Never overwrite a materially disputed value without preserving the competing evidence in the notes and source metadata.
- Do not add unsupported fields or obsolete custom-field IDs.
- Do not expose sealed information, private addresses, credentials, minors' identities, or unnecessary personal data.
- Do not commit, push, deploy, publish articles, or run BCP. BCP requires the user's exact instruction `run BCP`.
