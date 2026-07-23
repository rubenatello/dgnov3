---
name: dgno-write-article
description: Write or revise a sourced DGNO news article and create a local JSON review package for the authenticated editorial inbox. Use for article pitches, reported news drafts, explainers, fact-checks, constitutional analysis, headlines, summaries, source-backed revisions, or handing completed copy to DGNO's editorial queue. Always distinguish what happened, what is confirmed, and what is speculated. Do not use it to publish an article or turn an unsupported premise into news copy.
---

# DGNO Article Writing

Produce skeptical, evidence-led journalism for human editorial review. Use `$dgno-news-research` before drafting any factual article about current events.

## Reporting posture

- Use a progressive, pro-democracy lens to identify stakes involving rights, equality, labor, public welfare, accountable government, and concentrated power. Do not make facts serve that lens.
- Analyze constitutional questions precisely. Separate constitutional text, historical argument, enacted law, binding precedent, current doctrine, pending litigation, and political rhetoric.
- Scrutinize every institution and faction, including governments, parties, corporations, advocacy groups, sources aligned with DGNO's values, and DGNO's initial premise.
- Be skeptical without becoming cynical. Do not manufacture balance when the evidence is lopsided.
- Be honest about uncertainty, missing evidence, sourcing limitations, corrections, and what would change the conclusion.

## Workflow

1. Define the news question, audience, timeframe, and proposed article type.
2. Invoke `$dgno-news-research`; do not draft from model memory for current facts.
3. Build the evidence ledger and resolve material contradictions where possible.
4. Choose the narrowest headline and thesis supported by the evidence. Do not imply guilt, intent, causation, or legal resolution beyond what is established.
5. Draft using the required structure below and the standards in `references/article-standard.md`.
6. Audit every factual sentence, number, quotation, date, legal proposition, and link against the ledger.
7. Create the `dgno.article.v1` JSON package described in `references/article-standard.md`.
8. Save it under `editorial-inbox/articles/YYYY-MM-DD-descriptive-slug.json`. Create the local directory when needed; it is intentionally ignored by Git.
9. Report the package path and material uncertainties. Instruct the editor to review it at `/dashboard/editorial-inbox` while signed in. Do not submit it to Firebase yourself.

## Required article structure

Use these headings exactly in the HTML body:

1. `What Happened`
2. `What Is Confirmed`
3. `What Is Speculated`

Open with a concise lede before the headings. In `What Is Speculated`, include only material disputed, inferred, alleged, or unknown claims that readers need in order to understand the story. Attribute each one and explain the evidentiary gap. If no responsible speculation belongs in the story, say that explicitly rather than filling the section with rumor.

Add `Sources and Documents` after the three required sections when links would help readers inspect primary records. Links in the body must support the sentence in which they appear.

## Editorial boundaries

- Never fabricate or reconstruct quotations.
- Use short quotations only when the exact language matters; otherwise paraphrase and link.
- Do not plagiarize or closely imitate a source's prose.
- Do not expose private data, credentials, sealed records, or unnecessary identifying details.
- Do not present Jensen as a human eyewitness or create a deceptive human byline. Use an editor-supplied newsroom byline or omit `authorName`; the inbox will record Jensen's workflow separately.
- Never request, store, print, or use a Firebase email, password, refresh token, service-account key, or superuser credential.
- Do not call `app/scripts/dgno-editorial.mjs` with `--apply` or use another direct Firebase write path.
- Do not commit, push, deploy, publish, send newsletters, or modify a published article. BCP requires the user's exact instruction `run BCP`.
