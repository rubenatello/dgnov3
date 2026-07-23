# Current DGNO tracker schemas

This snapshot was verified against public Firebase data on 2026-07-23. Always run `node app/scripts/dgno-editorial.mjs trackers list` before producing a package because IDs and fields can change.

## Package envelope

Every create package must contain:

```json
{
  "schemaVersion": "dgno.tracker-incident.v1",
  "type": "tracker-incident",
  "operation": "create",
  "trackerSlug": "current-tracker-slug",
  "fields": {},
  "verificationStatus": "supported",
  "sources": []
}
```

For a correction, set `operation` to `update` and include both `incidentId` and a specific `reason`. A package may use `trackerId`, `trackerSlug`, or both. When both are present they must identify the same live tracker.

## U.S. military boat strikes

- Page: `https://dgno.us/tracker/us-military-boat-strikes-against-alleged-narco-traffickers`
- Tracker ID: `P8a1RoC6Khj0XMfT3zCG`
- Slug: `us-military-boat-strikes-against-alleged-narco-traffickers`

| Field name | Field ID | Type | Required |
| --- | --- | --- | --- |
| Date | `field_1763396751696` | date | yes |
| Strikes In Group | `field_1763396774434` | text | no |
| Vessels Struck | `field_1763396783934` | text | no |
| Reported Killed | `field_1763396790496` | text | no |
| Reported Captured | `field_1763396797550` | text | no |
| Reported Missing/Presumed Dead | `field_1763396810290` | text | no |
| Location | `field_1763396832414` | text | no |
| Notes | `field_1763397045996` | textarea | no |

The stored tracker count was 22 while the public active query returned 21 documents on 2026-07-23. The dashboard importer recomputes the active count after a create. Some older incidents contain obsolete field `field_1763396905419`; do not write that field.

Example `fields`:

```json
{
  "Date": "2026-07-23",
  "Strikes In Group": "1",
  "Vessels Struck": "1",
  "Reported Killed": "Unconfirmed",
  "Reported Captured": "0",
  "Reported Missing/Presumed Dead": "0",
  "Location": "Precisely sourced location",
  "Notes": "Attribute the government's characterization, public evidence, credible disputes, uncertainty, and compact source URLs."
}
```

## Federal officer impeding or interfering incidents

- Page: `https://dgno.us/tracker/federal-officer-impeding-or-interfering-incidents`
- Tracker ID: `xIdGEFhtBy9jH9kzyhWw`
- Slug: `federal-officer-impeding-or-interfering-incidents`

| Field name | Field ID | Type | Required |
| --- | --- | --- | --- |
| Date | `field_1762209974447` | date | yes |
| City | `field_1762209979614` | text | no |
| State | `field_1762209981181` | select | yes |
| Description | `field_1762209995056` | textarea | yes |
| Arrested | `field_1762210010114` | checkbox | no |
| Charged | `field_1762210020490` | checkbox | no |
| Charges (if any) | `field_1762210031639` | textarea | no |
| Released | `field_1762210043128` | checkbox | no |
| Convicted | `field_1762210054980` | checkbox | no |
| Notes | `field_1762210061617` | textarea | no |
| Source | `field_1762210067182` | url | no |

Use the exact live `State` option. Do not infer that an arrest means a charge, that a charge means guilt, or that release means dismissal.

Example `fields`:

```json
{
  "Date": "2026-07-23",
  "City": "Example City",
  "State": "California (CA)",
  "Description": "Neutral, attributed description separating officer, witness, video, and defense accounts.",
  "Arrested": true,
  "Charged": false,
  "Charges (if any)": "No charge located as of the access time.",
  "Released": true,
  "Convicted": false,
  "Notes": "State remaining unknowns and the next docket or records check.",
  "Source": "https://example.gov/record"
}
```

## Source objects

Use at least one source:

```json
{
  "url": "https://example.gov/record",
  "title": "Record title",
  "publisher": "Publishing body",
  "publishedAt": "2026-07-23",
  "accessedAt": "2026-07-23T12:00:00-07:00",
  "kind": "primary"
}
```

Allowed `kind` values are `primary`, `independent`, `official`, `interested`, `social`, and `other`.
