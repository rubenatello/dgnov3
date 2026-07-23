# DGNO article standard

## Copy requirements

- Write a precise headline that states the verified development rather than the most dramatic allegation.
- Keep the summary at 300 characters or fewer.
- Use plain, direct prose and short paragraphs.
- Identify the source of contested claims in the same sentence.
- Use `alleged`, `according to`, and similar qualifiers only where they convey a real evidentiary or procedural distinction.
- Distinguish event time from announcement time and article update time.
- Give readers the strongest relevant evidence and the strongest credible limitation.
- When a subject faces an accusation, state the procedural posture and response fairly. Do not imply that arrest, charge, indictment, civil complaint, or investigation proves guilt.
- For numbers, describe the denominator, timeframe, revisions, and methodology when material.

## HTML structure

The `content` field is Tiptap-compatible HTML. Use basic semantic elements such as `p`, `h2`, `h3`, `ul`, `ol`, `li`, `blockquote`, `strong`, `em`, and `a`.

```html
<p>A concise lede stating the verified development and why it matters.</p>
<h2>What Happened</h2>
<p>A chronological, attributed account.</p>
<h2>What Is Confirmed</h2>
<p>Facts supported by the evidence ledger, with direct links where useful.</p>
<h2>What Is Speculated</h2>
<p>Material disputed or unconfirmed claims, who advances them, and what evidence is missing.</p>
<h2>Sources and Documents</h2>
<ul><li><a href="https://example.gov/record">Primary record title</a></li></ul>
```

Do not use JavaScript URLs, embedded scripts, tracking pixels, or copied article markup.

## Editorial package

Create a JSON object like this:

```json
{
  "schemaVersion": "dgno.article.v1",
  "type": "article",
  "title": "Narrow, evidence-supported headline",
  "subtitle": "Optional explanatory deck",
  "summary": "A summary no longer than 300 characters.",
  "section": "Politics",
  "tags": ["example-tag"],
  "content": "<p>...</p><h2>What Happened</h2>...",
  "authorName": "Optional editor-approved newsroom byline",
  "sources": [
    {
      "url": "https://example.gov/record",
      "title": "Record title",
      "publisher": "Publishing body",
      "publishedAt": "2026-07-23",
      "accessedAt": "2026-07-23T12:00:00-07:00",
      "kind": "primary"
    }
  ],
  "claimStatuses": [
    {
      "claim": "A narrow material claim",
      "status": "confirmed",
      "sourceUrls": ["https://example.gov/record"]
    }
  ]
}
```

Allowed sections are defined in `app/src/types/models.ts`. Every claim URL must also appear in `sources`. The authenticated dashboard importer rejects packages that omit a source, required heading, title, valid section, summary-compliant length, or meaningful content. It sanitizes HTML, checks the generated slug again, and creates only a `review` article after an editor confirms the preview.

## Final audit

- Open every submitted link once more.
- Confirm quotations character-for-character.
- Check names, titles, pronouns, locations, time zones, arithmetic, and legal posture.
- Search for a correction or newer official record.
- Remove any sentence that the evidence ledger cannot support or clearly label.
- Confirm the output is a local `dgno.article.v1` package, not a Firebase write.
