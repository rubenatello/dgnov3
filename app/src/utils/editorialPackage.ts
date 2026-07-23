import { SECTIONS } from '../types/models';
import type { Tracker, TrackerIncident } from '../types/models';
import type {
  ArticleEditorialPackage,
  EditorialClaimAssessment,
  EditorialClaimStatus,
  EditorialPackage,
  EditorialSource,
  EditorialSourceKind,
  TrackerEditorialPackage,
  TrackerPackageFieldValue,
  TrackerVerificationStatus,
} from '../types/editorialInbox';

export const MAX_EDITORIAL_PACKAGE_BYTES = 2 * 1024 * 1024;

const SOURCE_KINDS = new Set<EditorialSourceKind>([
  'primary',
  'independent',
  'official',
  'interested',
  'social',
  'other',
]);

const CLAIM_STATUSES = new Set<EditorialClaimStatus>([
  'confirmed',
  'supported',
  'disputed',
  'unconfirmed',
  'false',
  'unknown',
]);

const TRACKER_STATUSES = new Set<TrackerVerificationStatus>([
  'confirmed',
  'supported',
  'disputed',
]);

const BLOCKED_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const REQUIRED_ARTICLE_HEADINGS = ['What Happened', 'What Is Confirmed', 'What Is Speculated'];
const SAFE_ARTICLE_TAGS = new Set([
  'p',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'blockquote',
  'strong',
  'em',
  'a',
  'br',
  'hr',
  'code',
  'pre',
]);

export class EditorialPackageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EditorialPackageError';
  }
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new EditorialPackageError(`${label} must be an object.`);
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if (BLOCKED_OBJECT_KEYS.has(key)) {
      throw new EditorialPackageError(`${label} contains a prohibited key.`);
    }
  }
  return record;
}

function requiredString(value: unknown, label: string, maxLength?: number): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new EditorialPackageError(`${label} is required.`);
  }
  const result = value.trim();
  if (maxLength && result.length > maxLength) {
    throw new EditorialPackageError(`${label} must be ${maxLength} characters or fewer.`);
  }
  return result;
}

function optionalString(value: unknown, label: string, maxLength?: number): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return requiredString(value, label, maxLength);
}

function httpUrl(value: unknown, label: string): string {
  const result = requiredString(value, label);
  let parsed: URL;
  try {
    parsed = new URL(result);
  } catch {
    throw new EditorialPackageError(`${label} must be a valid URL.`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new EditorialPackageError(`${label} must use http or https.`);
  }
  if (parsed.username || parsed.password) {
    throw new EditorialPackageError(`${label} must not contain URL credentials.`);
  }
  return parsed.toString();
}

function isoTimestamp(value: unknown, label: string): string {
  const result = requiredString(value, label);
  if (Number.isNaN(Date.parse(result))) {
    throw new EditorialPackageError(`${label} must be an ISO 8601 timestamp.`);
  }
  return result;
}

function dateString(value: unknown, label: string): string {
  const result = requiredString(value, label);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(result);
  const parsed = match ? new Date(`${result}T12:00:00Z`) : null;
  if (
    !match ||
    !parsed ||
    Number.isNaN(parsed.getTime()) ||
    parsed.getUTCFullYear() !== Number(match[1]) ||
    parsed.getUTCMonth() + 1 !== Number(match[2]) ||
    parsed.getUTCDate() !== Number(match[3])
  ) {
    throw new EditorialPackageError(`${label} must use YYYY-MM-DD.`);
  }
  return result;
}

function parseSources(value: unknown): EditorialSource[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new EditorialPackageError('At least one source is required.');
  }
  const seen = new Set<string>();
  return value.map((rawSource, index) => {
    const source = asRecord(rawSource, `sources[${index}]`);
    const url = httpUrl(source.url, `sources[${index}].url`);
    if (seen.has(url)) throw new EditorialPackageError(`Duplicate source URL: ${url}`);
    seen.add(url);
    const kind = optionalString(source.kind, `sources[${index}].kind`) ?? 'other';
    if (!SOURCE_KINDS.has(kind as EditorialSourceKind)) {
      throw new EditorialPackageError(`Unsupported source kind: ${kind}`);
    }
    return {
      url,
      title: requiredString(source.title, `sources[${index}].title`, 300),
      publisher: requiredString(source.publisher, `sources[${index}].publisher`, 160),
      publishedAt: optionalString(source.publishedAt, `sources[${index}].publishedAt`, 80),
      accessedAt: isoTimestamp(source.accessedAt, `sources[${index}].accessedAt`),
      kind: kind as EditorialSourceKind,
    };
  });
}

function parseClaimStatuses(value: unknown): EditorialClaimAssessment[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new EditorialPackageError('At least one claim assessment is required.');
  }
  return value.map((rawClaim, index) => {
    const claim = asRecord(rawClaim, `claimStatuses[${index}]`);
    const status = requiredString(claim.status, `claimStatuses[${index}].status`);
    if (!CLAIM_STATUSES.has(status as EditorialClaimStatus)) {
      throw new EditorialPackageError(`Unsupported claim status: ${status}`);
    }
    if (!Array.isArray(claim.sourceUrls)) {
      throw new EditorialPackageError(`claimStatuses[${index}].sourceUrls must be an array.`);
    }
    return {
      claim: requiredString(claim.claim, `claimStatuses[${index}].claim`, 600),
      status: status as EditorialClaimStatus,
      sourceUrls: claim.sourceUrls.map((url, urlIndex) =>
        httpUrl(url, `claimStatuses[${index}].sourceUrls[${urlIndex}]`),
      ),
    };
  });
}

function parseArticlePackage(record: Record<string, unknown>): ArticleEditorialPackage {
  if (record.schemaVersion !== 'dgno.article.v1') {
    throw new EditorialPackageError('Article package schemaVersion must be dgno.article.v1.');
  }
  const title = requiredString(record.title, 'title', 220);
  const content = requiredString(record.content, 'content');
  if (content.length < 300) throw new EditorialPackageError('Article content must contain at least 300 characters.');
  if (/<script\b|javascript\s*:|\son\w+\s*=/i.test(content)) {
    throw new EditorialPackageError('Article content contains executable or unsafe HTML.');
  }
  for (const heading of REQUIRED_ARTICLE_HEADINGS) {
    const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp(`<h2[^>]*>\\s*${escaped}\\s*</h2>`, 'i').test(content)) {
      throw new EditorialPackageError(`Article content is missing <h2>${heading}</h2>.`);
    }
  }
  const section = requiredString(record.section, 'section');
  if (!(SECTIONS as readonly string[]).includes(section)) {
    throw new EditorialPackageError(`Unsupported DGNO section: ${section}`);
  }
  if (!Array.isArray(record.tags)) throw new EditorialPackageError('tags must be an array.');
  const tags = [...new Set(record.tags.map((tag, index) => requiredString(tag, `tags[${index}]`, 80)))];

  const sources = parseSources(record.sources);
  const claimStatuses = parseClaimStatuses(record.claimStatuses);
  const sourceUrls = new Set(sources.map((source) => source.url));
  for (const claim of claimStatuses) {
    for (const sourceUrl of claim.sourceUrls) {
      if (!sourceUrls.has(sourceUrl)) {
        throw new EditorialPackageError(`Claim references a URL that is not present in sources: ${sourceUrl}`);
      }
    }
  }

  return {
    schemaVersion: 'dgno.article.v1',
    type: 'article',
    title,
    subtitle: optionalString(record.subtitle, 'subtitle', 300),
    summary: optionalString(record.summary, 'summary', 300),
    section,
    tags,
    content,
    authorName: optionalString(record.authorName, 'authorName', 160),
    featuredImageId: optionalString(record.featuredImageId, 'featuredImageId', 160),
    featuredImageUrl: record.featuredImageUrl ? httpUrl(record.featuredImageUrl, 'featuredImageUrl') : undefined,
    featuredImageDescription: optionalString(record.featuredImageDescription, 'featuredImageDescription', 500),
    featuredImageSourceCredit: optionalString(record.featuredImageSourceCredit, 'featuredImageSourceCredit', 300),
    sources,
    claimStatuses,
  };
}

function parseTrackerFields(value: unknown): Record<string, TrackerPackageFieldValue> {
  const fields = asRecord(value, 'fields');
  const entries = Object.entries(fields);
  if (entries.length === 0) throw new EditorialPackageError('fields must contain at least one proposed value.');
  return Object.fromEntries(
    entries.map(([key, fieldValue]) => {
      if (BLOCKED_OBJECT_KEYS.has(key)) throw new EditorialPackageError('fields contains a prohibited key.');
      if (!['string', 'number', 'boolean'].includes(typeof fieldValue) && fieldValue !== null) {
        throw new EditorialPackageError(`Field ${key} must be a string, number, boolean, or null.`);
      }
      if (typeof fieldValue === 'number' && !Number.isFinite(fieldValue)) {
        throw new EditorialPackageError(`Field ${key} must be a finite number.`);
      }
      return [key, fieldValue as TrackerPackageFieldValue];
    }),
  );
}

function parseTrackerPackage(record: Record<string, unknown>): TrackerEditorialPackage {
  if (record.schemaVersion !== 'dgno.tracker-incident.v1') {
    throw new EditorialPackageError('Tracker package schemaVersion must be dgno.tracker-incident.v1.');
  }
  if (record.operation !== 'create' && record.operation !== 'update') {
    throw new EditorialPackageError('Tracker operation must be create or update.');
  }
  const trackerId = optionalString(record.trackerId, 'trackerId', 160);
  const trackerSlug = optionalString(record.trackerSlug, 'trackerSlug', 240);
  if (!trackerId && !trackerSlug) {
    throw new EditorialPackageError('A trackerId or trackerSlug is required.');
  }
  const verificationStatus = requiredString(record.verificationStatus, 'verificationStatus');
  if (!TRACKER_STATUSES.has(verificationStatus as TrackerVerificationStatus)) {
    throw new EditorialPackageError('verificationStatus must be confirmed, supported, or disputed.');
  }
  const incidentId = optionalString(record.incidentId, 'incidentId', 160);
  const reason = optionalString(record.reason, 'reason', 1000);
  if (record.operation === 'update' && (!incidentId || !reason)) {
    throw new EditorialPackageError('Tracker updates require incidentId and reason.');
  }
  return {
    schemaVersion: 'dgno.tracker-incident.v1',
    type: 'tracker-incident',
    operation: record.operation,
    trackerId,
    trackerSlug,
    incidentId,
    fields: parseTrackerFields(record.fields),
    reason,
    verificationStatus: verificationStatus as TrackerVerificationStatus,
    sources: parseSources(record.sources),
  };
}

export function parseEditorialPackage(value: unknown): EditorialPackage {
  const record = asRecord(value, 'Editorial package');
  if (record.type === 'article') return parseArticlePackage(record);
  if (record.type === 'tracker-incident') return parseTrackerPackage(record);
  throw new EditorialPackageError('Package type must be article or tracker-incident.');
}

export function sanitizeArticleHtml(html: string): string {
  const documentNode = new DOMParser().parseFromString(html, 'text/html');
  documentNode
    .querySelectorAll('script,style,iframe,object,embed,form,input,button,svg,math,link,meta')
    .forEach((element) => element.remove());

  for (const element of Array.from(documentNode.body.querySelectorAll('*'))) {
    const tagName = element.tagName.toLowerCase();
    if (!SAFE_ARTICLE_TAGS.has(tagName)) {
      element.replaceWith(...Array.from(element.childNodes));
      continue;
    }
    const originalHref = tagName === 'a' ? element.getAttribute('href') : null;
    for (const attribute of Array.from(element.attributes)) {
      element.removeAttribute(attribute.name);
    }
    if (tagName === 'a') {
      if (originalHref) {
        try {
          const parsed = new URL(originalHref, window.location.origin);
          if (['http:', 'https:'].includes(parsed.protocol)) {
            element.setAttribute('href', parsed.toString());
            element.setAttribute('target', '_blank');
            element.setAttribute('rel', 'noopener noreferrer');
          }
        } catch {
          element.removeAttribute('href');
        }
      }
    }
  }

  const sanitized = documentNode.body.innerHTML.trim();
  for (const heading of REQUIRED_ARTICLE_HEADINGS) {
    if (!Array.from(documentNode.body.querySelectorAll('h2')).some((node) => node.textContent?.trim() === heading)) {
      throw new EditorialPackageError(`Sanitized article is missing the required heading ${heading}.`);
    }
  }
  return sanitized;
}

export function articlePlainText(html: string): string {
  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

function normalizeTrackerFieldValue(
  field: NonNullable<Tracker['customFields']>[number],
  value: TrackerPackageFieldValue,
): string | number | boolean | undefined {
  if (value === null || value === '') return undefined;
  if (field.type === 'checkbox') {
    if (typeof value !== 'boolean') throw new EditorialPackageError(`${field.name} must be true or false.`);
    return value;
  }
  if (field.type === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new EditorialPackageError(`${field.name} must be a finite number.`);
    }
    return value;
  }
  if (typeof value !== 'string') throw new EditorialPackageError(`${field.name} must be text.`);
  const result = value.trim();
  if (field.type === 'date') return dateString(result, field.name);
  if (field.type === 'url' || field.type === 'file') return httpUrl(result, field.name);
  if (field.type === 'select' && !field.options?.includes(result)) {
    throw new EditorialPackageError(`${field.name} must match a current tracker option.`);
  }
  if (field.maxLength && result.length > field.maxLength) {
    throw new EditorialPackageError(`${field.name} must be ${field.maxLength} characters or fewer.`);
  }
  return result;
}

export function normalizeTrackerFields(
  tracker: Tracker,
  proposedFields: Record<string, TrackerPackageFieldValue>,
  existing: TrackerIncident['customData'] = {},
): NonNullable<TrackerIncident['customData']> {
  const schema = tracker.customFields ?? [];
  if (!tracker.useCustomFields || schema.length === 0) {
    throw new EditorialPackageError('The selected tracker does not have a current custom-field schema.');
  }
  const byId = new Map(schema.map((field) => [field.id, field]));
  const byName = new Map(schema.map((field) => [field.name.toLowerCase(), field]));
  const result: NonNullable<TrackerIncident['customData']> = { ...existing };
  for (const [key, value] of Object.entries(proposedFields)) {
    const field = byId.get(key) ?? byName.get(key.toLowerCase());
    if (!field) throw new EditorialPackageError(`Unknown or obsolete tracker field: ${key}`);
    const normalized = normalizeTrackerFieldValue(field, value);
    if (normalized === undefined) delete result[field.id];
    else result[field.id] = normalized;
  }
  for (const field of schema) {
    const value = result[field.id];
    if (field.required && (value === undefined || value === null || value === '')) {
      throw new EditorialPackageError(`Required tracker field is missing: ${field.name}`);
    }
  }
  return result;
}

export function trackerFieldValue(
  tracker: Tracker,
  customData: TrackerIncident['customData'],
  name: string,
): string | number | boolean | Date | undefined {
  const field = tracker.customFields?.find((candidate) => candidate.name.toLowerCase() === name.toLowerCase());
  return field ? customData?.[field.id] : undefined;
}

function trackerFingerprint(tracker: Tracker, customData: TrackerIncident['customData']): string {
  const date = trackerFieldValue(tracker, customData, 'Date') ?? '';
  const location = [
    trackerFieldValue(tracker, customData, 'Location'),
    trackerFieldValue(tracker, customData, 'City'),
    trackerFieldValue(tracker, customData, 'State'),
  ]
    .filter(Boolean)
    .join('|');
  const fallback =
    trackerFieldValue(tracker, customData, 'Description') ?? trackerFieldValue(tracker, customData, 'Notes') ?? '';
  return `${String(date)}|${location || String(fallback).slice(0, 120)}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

export function findTrackerDuplicates(
  tracker: Tracker,
  incidents: TrackerIncident[],
  customData: TrackerIncident['customData'],
  excludeId?: string,
): { exact: TrackerIncident[]; sameDate: TrackerIncident[]; eventDate?: string } {
  const fingerprint = trackerFingerprint(tracker, customData);
  const eventDateValue = trackerFieldValue(tracker, customData, 'Date');
  const eventDate = typeof eventDateValue === 'string' ? eventDateValue : undefined;
  return {
    exact: incidents.filter(
      (incident) => incident.id !== excludeId && trackerFingerprint(tracker, incident.customData) === fingerprint,
    ),
    sameDate: incidents.filter(
      (incident) =>
        incident.id !== excludeId &&
        eventDate &&
        trackerFieldValue(tracker, incident.customData, 'Date') === eventDate,
    ),
    eventDate,
  };
}

export function deriveLegacyTrackerFields(
  tracker: Tracker,
  customData: TrackerIncident['customData'],
): { eventDate: string; location: string; city: string; state: string; description: string } {
  const eventDateValue = trackerFieldValue(tracker, customData, 'Date');
  if (typeof eventDateValue !== 'string') throw new EditorialPackageError('A valid Date field is required.');
  const city = String(trackerFieldValue(tracker, customData, 'City') ?? '');
  const state = String(trackerFieldValue(tracker, customData, 'State') ?? '');
  const location = String(trackerFieldValue(tracker, customData, 'Location') ?? [city, state].filter(Boolean).join(', '));
  const description = String(
    trackerFieldValue(tracker, customData, 'Description') ??
      trackerFieldValue(tracker, customData, 'Notes') ??
      'Custom field incident',
  );
  return { eventDate: eventDateValue, location, city, state, description };
}
