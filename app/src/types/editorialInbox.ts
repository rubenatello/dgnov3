export type EditorialSourceKind =
  | 'primary'
  | 'independent'
  | 'official'
  | 'interested'
  | 'social'
  | 'other';

export type EditorialClaimStatus =
  | 'confirmed'
  | 'supported'
  | 'disputed'
  | 'unconfirmed'
  | 'false'
  | 'unknown';

export type TrackerVerificationStatus = 'confirmed' | 'supported' | 'disputed';

export interface EditorialSource {
  url: string;
  title: string;
  publisher: string;
  publishedAt?: string;
  accessedAt: string;
  kind: EditorialSourceKind;
}

export interface EditorialClaimAssessment {
  claim: string;
  status: EditorialClaimStatus;
  sourceUrls: string[];
}

export interface EditorialEvidence {
  workflow: 'jensen' | 'lancelot';
  packageSchemaVersion: string;
  sources: EditorialSource[];
  claimStatuses?: EditorialClaimAssessment[];
  verificationStatus?: TrackerVerificationStatus;
  recordedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  packageFileName?: string;
}

export interface EditorialAuditEntry {
  workflow: 'lancelot';
  reason: string;
  changedFields: string[];
  sourceUrls: string[];
  recordedAt: string;
  approvedBy: string;
}

export interface ArticleEditorialPackage {
  schemaVersion: 'dgno.article.v1';
  type: 'article';
  title: string;
  subtitle?: string;
  summary?: string;
  section: string;
  tags: string[];
  content: string;
  authorName?: string;
  featuredImageId?: string;
  featuredImageUrl?: string;
  featuredImageDescription?: string;
  featuredImageSourceCredit?: string;
  sources: EditorialSource[];
  claimStatuses: EditorialClaimAssessment[];
}

export type TrackerPackageFieldValue = string | number | boolean | null;

export interface TrackerEditorialPackage {
  schemaVersion: 'dgno.tracker-incident.v1';
  type: 'tracker-incident';
  operation: 'create' | 'update';
  trackerId?: string;
  trackerSlug?: string;
  incidentId?: string;
  fields: Record<string, TrackerPackageFieldValue>;
  reason?: string;
  verificationStatus: TrackerVerificationStatus;
  sources: EditorialSource[];
}

export type EditorialPackage = ArticleEditorialPackage | TrackerEditorialPackage;
