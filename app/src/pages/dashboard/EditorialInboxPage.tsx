import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowUpRightFromSquare,
  faCircleCheck,
  faDatabase,
  faFileLines,
  faInbox,
  faRotate,
  faShieldHalved,
  faTriangleExclamation,
  faUpload,
} from '@fortawesome/free-solid-svg-icons';
import { Timestamp } from 'firebase/firestore';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { articleSlugExists, createArticle } from '../../services/articleService';
import {
  addIncident,
  getAllTrackers,
  getIncident,
  getIncidents,
  updateIncident,
} from '../../services/trackerService';
import type { Tracker, TrackerIncident } from '../../types/models';
import type {
  ArticleEditorialPackage,
  EditorialEvidence,
  EditorialPackage,
  TrackerEditorialPackage,
} from '../../types/editorialInbox';
import {
  MAX_EDITORIAL_PACKAGE_BYTES,
  articlePlainText,
  deriveLegacyTrackerFields,
  findTrackerDuplicates,
  normalizeTrackerFields,
  parseEditorialPackage,
  sanitizeArticleHtml,
  trackerFieldValue,
} from '../../utils/editorialPackage';
import { generateSlug } from '../../utils/helpers';

interface TrackerReview {
  tracker: Tracker;
  incidents: TrackerIncident[];
  existing?: TrackerIncident;
  customData: NonNullable<TrackerIncident['customData']>;
  duplicates: ReturnType<typeof findTrackerDuplicates>;
  legacy: ReturnType<typeof deriveLegacyTrackerFields>;
}

interface ImportResult {
  kind: 'article' | 'tracker';
  id: string;
  label: string;
  href: string;
}

function messageFrom(error: unknown): string {
  return error instanceof Error ? error.message : 'An unexpected error occurred.';
}

function formatFieldValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

function buildEvidence(
  workflow: 'jensen' | 'lancelot',
  pkg: EditorialPackage,
  fileName: string,
  userId: string,
): EditorialEvidence {
  const recordedAt = new Date().toISOString();
  return {
    workflow,
    packageSchemaVersion: pkg.schemaVersion,
    sources: pkg.sources,
    claimStatuses: pkg.type === 'article' ? pkg.claimStatuses : undefined,
    verificationStatus: pkg.type === 'tracker-incident' ? pkg.verificationStatus : undefined,
    recordedAt,
    approvedAt: recordedAt,
    approvedBy: userId,
    packageFileName: fileName,
  };
}

async function loadTrackerReview(pkg: TrackerEditorialPackage): Promise<TrackerReview> {
  const trackers = await getAllTrackers();
  const tracker = trackers.find(
    (candidate) =>
      (pkg.trackerId && candidate.id === pkg.trackerId) ||
      (pkg.trackerSlug && candidate.slug === pkg.trackerSlug),
  );
  if (!tracker?.id) throw new Error('The package does not match a current DGNO tracker.');
  if (pkg.trackerId && pkg.trackerSlug && (tracker.id !== pkg.trackerId || tracker.slug !== pkg.trackerSlug)) {
    throw new Error('trackerId and trackerSlug do not identify the same current tracker.');
  }

  const [incidents, existing] = await Promise.all([
    getIncidents(tracker.id, 500),
    pkg.operation === 'update' && pkg.incidentId ? getIncident(pkg.incidentId) : Promise.resolve(null),
  ]);
  if (pkg.operation === 'update' && (!existing || existing.trackerId !== tracker.id)) {
    throw new Error('The incident selected for update was not found in this tracker.');
  }

  const customData = normalizeTrackerFields(tracker, pkg.fields, existing?.customData);
  return {
    tracker,
    incidents,
    existing: existing ?? undefined,
    customData,
    duplicates: findTrackerDuplicates(tracker, incidents, customData, existing?.id),
    legacy: deriveLegacyTrackerFields(tracker, customData),
  };
}

export default function EditorialInboxPage() {
  const { currentUser, userData } = useAuth();
  const toast = useToast();
  const [pkg, setPackage] = useState<EditorialPackage | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [trackerReview, setTrackerReview] = useState<TrackerReview | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [approved, setApproved] = useState(false);
  const [distinctSameDate, setDistinctSameDate] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const articleText = useMemo(
    () => (pkg?.type === 'article' ? articlePlainText(pkg.content) : ''),
    [pkg],
  );

  const resetReview = () => {
    setPackage(null);
    setFileName('');
    setError('');
    setNotice('');
    setTrackerReview(null);
    setApproved(false);
    setDistinctSameDate(false);
    setResult(null);
  };

  const handleFile = async (file?: File) => {
    resetReview();
    if (!file) return;
    setFileName(file.name);
    if (file.size > MAX_EDITORIAL_PACKAGE_BYTES) {
      setError('Package rejected: files may not exceed 2 MB.');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.json')) {
      setError('Package rejected: choose a .json file.');
      return;
    }

    try {
      const parsed = parseEditorialPackage(JSON.parse(await file.text()));
      if (parsed.type === 'article') {
        const sanitizedContent = sanitizeArticleHtml(parsed.content);
        if (sanitizedContent !== parsed.content.trim()) {
          setNotice('Unsafe or unsupported article markup was removed. Review the plain-text preview carefully.');
        }
        setPackage({ ...parsed, content: sanitizedContent });
      } else {
        setLoadingContext(true);
        const review = await loadTrackerReview(parsed);
        setTrackerReview(review);
        setPackage(parsed);
      }
    } catch (caught) {
      setError(`Package rejected: ${messageFrom(caught)}`);
    } finally {
      setLoadingContext(false);
    }
  };

  const applyArticle = async (articlePackage: ArticleEditorialPackage, userId: string) => {
    const content = sanitizeArticleHtml(articlePackage.content);
    const slug = generateSlug(articlePackage.title);
    if (await articleSlugExists(slug)) {
      throw new Error(`An article already uses the slug “${slug}”. Revise the headline before importing.`);
    }
    const text = articlePlainText(content);
    const id = await createArticle({
      title: articlePackage.title,
      subtitle: articlePackage.subtitle,
      summary: articlePackage.summary,
      content,
      section: articlePackage.section,
      tags: articlePackage.tags,
      featuredImageId: articlePackage.featuredImageId,
      featuredImageUrl: articlePackage.featuredImageUrl,
      featuredImageDescription: articlePackage.featuredImageDescription,
      featuredImageSourceCredit: articlePackage.featuredImageSourceCredit,
      authorId: userId,
      authorName: articlePackage.authorName ?? 'Jensen',
      status: 'review',
      wordCount: text ? text.split(/\s+/).length : 0,
      breakingRequested: false,
      lastUpdatedBy: userId,
      editorialEvidence: buildEvidence('jensen', articlePackage, fileName, userId),
    });
    return { kind: 'article' as const, id, label: articlePackage.title, href: `/dashboard/articles/edit/${id}` };
  };

  const applyTracker = async (trackerPackage: TrackerEditorialPackage, userId: string) => {
    const review = await loadTrackerReview(trackerPackage);
    if (!review.tracker.id) throw new Error('The selected tracker is missing its identifier.');
    if (review.duplicates.exact.length > 0) {
      throw new Error('Import stopped: a matching active incident already exists.');
    }
    if (review.duplicates.sameDate.length > 0 && !distinctSameDate) {
      throw new Error('Confirm that this is a distinct event from the same-date incidents before applying.');
    }

    const evidence = buildEvidence('lancelot', trackerPackage, fileName, userId);
    let id: string;
    if (trackerPackage.operation === 'create') {
      id = await addIncident(review.tracker.id, {
        trackerId: review.tracker.id,
        dateOfOccurrence: Timestamp.fromDate(new Date(`${review.legacy.eventDate}T12:00:00Z`)),
        location: review.legacy.location,
        city: review.legacy.city,
        state: review.legacy.state,
        description: review.legacy.description,
        bodyCamAvailable: trackerFieldValue(review.tracker, review.customData, 'Body Cam Available') === true,
        createdBy: userId,
        status: 'active',
        customData: review.customData,
        editorialEvidence: evidence,
      });
    } else {
      const existing = review.existing;
      if (!existing?.id) throw new Error('The incident selected for update no longer exists.');
      const auditEntry = {
        workflow: 'lancelot' as const,
        reason: trackerPackage.reason ?? 'Source-backed correction',
        changedFields: Object.keys(trackerPackage.fields),
        sourceUrls: trackerPackage.sources.map((source) => source.url),
        recordedAt: evidence.recordedAt,
        approvedBy: userId,
      };
      await updateIncident(existing.id, {
        dateOfOccurrence: Timestamp.fromDate(new Date(`${review.legacy.eventDate}T12:00:00Z`)),
        location: review.legacy.location,
        city: review.legacy.city,
        state: review.legacy.state,
        description: review.legacy.description,
        bodyCamAvailable: trackerFieldValue(review.tracker, review.customData, 'Body Cam Available') === true,
        customData: review.customData,
        updatedBy: userId,
        editorialEvidence: evidence,
        editorialAudit: [...(existing.editorialAudit ?? []), auditEntry],
      });
      id = existing.id;
    }
    return {
      kind: 'tracker' as const,
      id,
      label: `${review.tracker.name}: ${review.legacy.eventDate}`,
      href: `/tracker/${review.tracker.slug}`,
    };
  };

  const handleApply = async () => {
    if (!pkg || !approved || !currentUser?.uid) return;
    setApplying(true);
    setError('');
    try {
      const imported =
        pkg.type === 'article'
          ? await applyArticle(pkg, currentUser.uid)
          : await applyTracker(pkg, currentUser.uid);
      setResult(imported);
      toast.push({
        type: 'success',
        title: pkg.type === 'article' ? 'Article sent to review' : 'Tracker incident applied',
        description: imported.label,
      });
    } catch (caught) {
      const detail = messageFrom(caught);
      setError(detail);
      toast.push({ type: 'error', title: 'Import failed', description: detail });
    } finally {
      setApplying(false);
    }
  };

  const publicTrackerWarning = pkg?.type === 'tracker-incident' && trackerReview?.tracker.isActive;
  const exactDuplicate = Boolean(trackerReview?.duplicates.exact.length);
  const sameDateCount = trackerReview?.duplicates.sameDate.length ?? 0;
  const canApply = Boolean(pkg && approved && !applying && !loadingContext && !result && !exactDuplicate);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
              <FontAwesomeIcon icon={faInbox} /> AI Editorial Inbox
            </div>
            <h1 className="font-heading text-3xl font-bold text-ink">Review before Firebase</h1>
            <p className="mt-2 max-w-3xl text-sm text-inkMuted">
              Import a Jensen article or Lancelot tracker package. Nothing is written until an authorized editor reviews
              the evidence and confirms the change here.
            </p>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
            <FontAwesomeIcon icon={faShieldHalved} className="mr-2" />
            Signed in as {userData?.displayName ?? currentUser?.email ?? 'editor'}
          </div>
        </header>

        <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 px-6 py-10 text-center transition hover:border-accent hover:bg-stone-50">
            <FontAwesomeIcon icon={faUpload} className="mb-3 text-3xl text-accent" />
            <span className="font-semibold text-ink">Choose an editorial JSON package</span>
            <span className="mt-1 text-xs text-inkMuted">Local file only · 2 MB maximum · never uploads credentials</span>
            <input
              className="sr-only"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const selected = event.currentTarget.files?.[0];
                event.currentTarget.value = '';
                void handleFile(selected);
              }}
            />
          </label>
          {fileName && <p className="mt-3 text-sm text-inkMuted">Selected: {fileName}</p>}
        </section>

        {loadingContext && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
            Checking the package against the live tracker schema and incident list…
          </div>
        )}
        {notice && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />{notice}
          </div>
        )}
        {error && (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />{error}
          </div>
        )}

        {pkg?.type === 'article' && (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-accent">
                <FontAwesomeIcon icon={faFileLines} /> Jensen article preview
              </div>
              <h2 className="font-heading text-2xl font-bold text-ink">{pkg.title}</h2>
              {pkg.subtitle && <p className="mt-2 text-lg text-inkMuted">{pkg.subtitle}</p>}
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-stone-100 px-3 py-1">{pkg.section}</span>
                <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-900">Review only</span>
                <span className="rounded-full bg-stone-100 px-3 py-1">{articleText.split(/\s+/).filter(Boolean).length} words</span>
              </div>
              {pkg.summary && <p className="mt-5 rounded-lg bg-stone-50 p-4 text-sm text-ink">{pkg.summary}</p>}
              <div className="mt-5 max-h-[32rem] overflow-y-auto whitespace-pre-wrap rounded-lg border border-stone-200 p-4 text-sm leading-7 text-ink">
                {articleText}
              </div>
            </div>
            <EvidencePanel pkg={pkg} />
          </section>
        )}

        {pkg?.type === 'tracker-incident' && trackerReview && (
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-accent">
                <FontAwesomeIcon icon={faDatabase} /> Lancelot tracker preview
              </div>
              <h2 className="font-heading text-2xl font-bold text-ink">{trackerReview.tracker.name}</h2>
              <p className="mt-2 text-sm text-inkMuted">
                {pkg.operation === 'create' ? 'New incident' : `Correction to ${pkg.incidentId}`}
              </p>
              {pkg.reason && <p className="mt-4 rounded-lg bg-stone-50 p-4 text-sm"><strong>Reason:</strong> {pkg.reason}</p>}

              <div className="mt-5 overflow-hidden rounded-lg border border-stone-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-100 text-xs uppercase text-inkMuted">
                    <tr><th className="px-4 py-3">Field</th><th className="px-4 py-3">Current</th><th className="px-4 py-3">Proposed</th></tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {(trackerReview.tracker.customFields ?? []).map((field) => (
                      <tr key={field.id}>
                        <th className="px-4 py-3 font-medium text-ink">{field.name}</th>
                        <td className="px-4 py-3 text-inkMuted">{formatFieldValue(trackerReview.existing?.customData?.[field.id])}</td>
                        <td className="px-4 py-3 text-ink">{formatFieldValue(trackerReview.customData[field.id])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {exactDuplicate && (
                <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
                  Import blocked: {trackerReview.duplicates.exact.length} matching active incident(s) found.
                </div>
              )}
              {!exactDuplicate && sameDateCount > 0 && (
                <label className="mt-4 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                  <input
                    type="checkbox"
                    checked={distinctSameDate}
                    onChange={(event) => setDistinctSameDate(event.target.checked)}
                    className="mt-0.5"
                  />
                  <span>I verified this is distinct from the {sameDateCount} active incident(s) already recorded on {trackerReview.duplicates.eventDate}.</span>
                </label>
              )}
            </div>
            <EvidencePanel pkg={pkg} />
          </section>
        )}

        {pkg && !result && (
          <section className="rounded-xl border border-stone-300 bg-white p-6 shadow-sm">
            {publicTrackerWarning && (
              <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-900">
                <FontAwesomeIcon icon={faTriangleExclamation} className="mr-2" />
                This tracker is public. Applying the package will make a new incident or correction visible immediately.
              </p>
            )}
            <label className="flex items-start gap-3 text-sm text-ink">
              <input type="checkbox" checked={approved} onChange={(event) => setApproved(event.target.checked)} className="mt-0.5" />
              <span>
                I reviewed the proposed content, source links, confirmation labels, and any duplicate warnings. I authorize this
                {pkg.type === 'article' ? ' article to enter editorial review' : ' tracker change'} under my signed-in account.
              </span>
            </label>
            <button
              type="button"
              disabled={!canApply || (sameDateCount > 0 && !distinctSameDate)}
              onClick={() => void handleApply()}
              className="mt-5 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {applying ? 'Running final checks…' : pkg.type === 'article' ? 'Send article to review' : `Apply ${pkg.operation}`}
            </button>
          </section>
        )}

        {result && (
          <section className="rounded-xl border border-green-300 bg-green-50 p-6 text-green-950">
            <div className="flex items-start gap-3">
              <FontAwesomeIcon icon={faCircleCheck} className="mt-1 text-xl" />
              <div>
                <h2 className="font-heading text-xl font-bold">Import complete</h2>
                <p className="mt-1 text-sm">{result.label} · ID {result.id}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link to={result.href} className="rounded-lg bg-green-900 px-4 py-2 text-sm font-semibold text-white">
                    Open {result.kind === 'article' ? 'review item' : 'public tracker'} <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="ml-1" />
                  </Link>
                  <button type="button" onClick={resetReview} className="rounded-lg border border-green-900 px-4 py-2 text-sm font-semibold">
                    <FontAwesomeIcon icon={faRotate} className="mr-1" /> Review another
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}

function EvidencePanel({ pkg }: { pkg: EditorialPackage }) {
  return (
    <aside className="space-y-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="font-heading text-lg font-bold text-ink">Evidence ledger</h2>
        <p className="mt-1 text-xs text-inkMuted">URLs open in a new tab for independent review.</p>
      </div>
      <div className="space-y-3">
        {pkg.sources.map((source) => (
          <a
            key={source.url}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-stone-200 p-3 text-sm transition hover:border-accent"
          >
            <span className="block font-semibold text-ink">{source.title}</span>
            <span className="mt-1 block text-xs text-inkMuted">{source.publisher} · {source.kind}</span>
          </a>
        ))}
      </div>
      {pkg.type === 'article' ? (
        <div>
          <h3 className="text-sm font-bold text-ink">Claim assessments</h3>
          {pkg.claimStatuses.length === 0 ? (
            <p className="mt-2 text-sm text-amber-800">No individual claim assessments supplied.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {pkg.claimStatuses.map((claim, index) => (
                <li key={`${claim.claim}-${index}`} className="rounded-lg bg-stone-50 p-3">
                  <span className="mr-2 rounded bg-stone-200 px-2 py-0.5 text-xs font-bold uppercase">{claim.status}</span>
                  {claim.claim}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="rounded-lg bg-stone-100 p-3 text-sm">
          <strong>Verification:</strong> {pkg.verificationStatus}
        </div>
      )}
    </aside>
  );
}
