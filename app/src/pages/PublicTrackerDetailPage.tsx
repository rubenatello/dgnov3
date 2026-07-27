import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faChartBar, faCheck, faDownload, faTimes, faVideo } from '@fortawesome/free-solid-svg-icons';
import { getActiveTrackers, getIncidents } from '../services/trackerService';
import type { Tracker, TrackerField, TrackerIncident } from '../types/models';
import type { EditorialEvidence } from '../types/editorialInbox';
import ExpandableDescription from '../components/ExpandableDescription';
import { downloadTrackerCSV } from '../utils/helpers';
import { formatDate, toDate } from '../utils/dateUtils';
import TrackerVisualizations from '../components/tracker/TrackerVisualizations';
import SEOHead from '../components/SEOHead';

const PUBLIC_INCIDENT_LIMIT = 100;

function safePublicUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function formatCellValue(value: unknown, fieldType: string): string {
  if (value === null || value === undefined || value === '') return 'Not reported';
  if (fieldType === 'checkbox') return value ? 'Yes' : 'No';
  if (fieldType === 'date') {
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return formatDate(value, 'Not reported');
  }
  return String(value);
}

function incidentDate(tracker: Tracker, incident: TrackerIncident): Date | null {
  const dateField = tracker.customFields?.find((field) => field.type === 'date');
  const customValue = dateField ? incident.customData?.[dateField.id] : undefined;
  if (typeof customValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(customValue)) {
    const [year, month, day] = customValue.split('-').map(Number);
    return new Date(year, month - 1, day);
  }
  return toDate(customValue || incident.dateOfOccurrence);
}

function displayDate(value: unknown): { dateTime: string; label: string } | null {
  if (!value) return null;
  const date = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T12:00:00`)
    : toDate(value);
  if (!date || Number.isNaN(date.getTime())) return null;
  return {
    dateTime: date.toISOString(),
    label: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
  };
}

function EvidenceSummary({ evidence, compact = false }: { evidence?: EditorialEvidence; compact?: boolean }) {
  if (!evidence?.sources?.length) {
    return <span className="text-xs text-inkMuted">Structured source record not attached</span>;
  }
  const reviewDate = displayDate(evidence.approvedAt || evidence.recordedAt);
  return (
    <div className="space-y-2">
      {evidence.verificationStatus && (
        <span className="inline-flex rounded-full bg-stone/20 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-ink">
          Record review status: {evidence.verificationStatus}
        </span>
      )}
      <ul className="space-y-1">
        {evidence.sources.map((source) => {
          const publishedDate = displayDate(source.publishedAt);
          const accessedDate = displayDate(source.accessedAt);
          return (
          <li key={`${source.url}-${source.title}`} className="text-xs">
            {safePublicUrl(source.url) ? (
              <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 break-words">{source.title}</a>
            ) : <span className="font-semibold text-ink">{source.title}</span>}
            {!compact && <span className="block text-inkMuted">{source.publisher} · {source.kind}</span>}
            <span className="block text-inkMuted">
              {publishedDate && <>Published <time dateTime={publishedDate.dateTime}>{publishedDate.label}</time></>}
              {publishedDate && accessedDate && <> · </>}
              {accessedDate && <>Accessed <time dateTime={accessedDate.dateTime}>{accessedDate.label}</time></>}
            </span>
          </li>
          );
        })}
      </ul>
      {reviewDate && (
        <p className="text-[11px] text-inkMuted">
          {evidence.approvedAt ? 'Editorial review' : 'Evidence recorded'} <time dateTime={reviewDate.dateTime}>{reviewDate.label}</time>
        </p>
      )}
    </div>
  );
}

function IncidentChangeNote({ incident }: { incident: TrackerIncident }) {
  const updatedDate = displayDate(incident.updatedAt);
  const auditEntries = incident.editorialAudit || [];
  const latestAudit = auditEntries[auditEntries.length - 1];
  const auditDate = displayDate(latestAudit?.recordedAt);
  if (!updatedDate && !latestAudit) return null;

  return (
    <div className="mt-3 border-t border-stone/30 pt-3 text-xs text-inkMuted">
      {updatedDate && <p>Record updated <time dateTime={updatedDate.dateTime}>{updatedDate.label}</time>.</p>}
      {latestAudit && (
        <div className="mt-1">
          <p><strong className="text-ink">Editorial change note:</strong> {latestAudit.reason}</p>
          {latestAudit.changedFields.length > 0 && <p>Fields changed: {latestAudit.changedFields.join(', ')}.</p>}
          {auditDate && <p>Change recorded <time dateTime={auditDate.dateTime}>{auditDate.label}</time>.</p>}
          {latestAudit.sourceUrls.length > 0 && (
            <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1" aria-label="Sources supporting the editorial change">
              {latestAudit.sourceUrls.map((url, index) => {
                const safeUrl = safePublicUrl(url);
                return safeUrl ? <li key={`${safeUrl}-${index}`}><a href={safeUrl} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2">Change source {index + 1}</a></li> : null;
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function FieldValue({ field, value }: { field: TrackerField; value: unknown }) {
  const link = field.type === 'url' ? safePublicUrl(value) : null;
  if (link) {
    return <a href={link} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 break-all">View linked source</a>;
  }
  if (field.type === 'textarea') return <ExpandableDescription description={String(value || '')} maxLength={120} />;
  return <>{formatCellValue(value, field.type)}</>;
}

export default function PublicTrackerDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tracker, setTracker] = useState<Tracker | null>(null);
  const [incidents, setIncidents] = useState<TrackerIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState(0);

  const loadTrackerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allTrackers = await getActiveTrackers();
      const foundTracker = allTrackers.find((candidate) => candidate.slug === slug && candidate.isActive);
      if (!foundTracker?.id) {
        setTracker(null);
        return;
      }
      setTracker(foundTracker);
      const trackerIncidents = await getIncidents(foundTracker.id, PUBLIC_INCIDENT_LIMIT);
      setIncidents([...trackerIncidents].sort((a, b) => (incidentDate(foundTracker, b)?.getTime() || 0) - (incidentDate(foundTracker, a)?.getTime() || 0)));
    } catch (caught) {
      console.error('Error loading tracker data:', caught);
      setError('This tracker could not be loaded right now.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { loadTrackerData(); }, [loadTrackerData]);

  const years = useMemo(() => {
    if (!tracker) return [];
    return Array.from(new Set(incidents.map((incident) => incidentDate(tracker, incident)?.getFullYear()).filter((year): year is number => Boolean(year)))).sort((a, b) => b - a);
  }, [incidents, tracker]);

  const filteredIncidents = useMemo(() => {
    if (!tracker || !yearFilter) return incidents;
    return incidents.filter((incident) => incidentDate(tracker, incident)?.getFullYear() === yearFilter);
  }, [incidents, tracker, yearFilter]);

  function handleDownload() {
    if (!tracker) return;
    downloadTrackerCSV(tracker, filteredIncidents);
  }

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-14 min-h-[60vh] text-inkMuted" role="status">Loading tracker data…</div>;
  if (error) {
    return <div className="max-w-4xl mx-auto px-4 py-14 min-h-[60vh]"><SEOHead title="Tracker unavailable | DGNO" description="The requested DGNO tracker could not be loaded." url={`https://dgno.us/tracker/${encodeURIComponent(slug || '')}`} robots="noindex, nofollow" /><h1 className="text-3xl font-bold text-ink">Tracker unavailable</h1><p role="alert" className="mt-4 text-red-800">{error}</p></div>;
  }
  if (!tracker) {
    return <div className="max-w-4xl mx-auto px-4 py-14 min-h-[60vh]"><SEOHead title="Tracker not found | DGNO" description="The requested DGNO tracker could not be found." url={`https://dgno.us/tracker/${encodeURIComponent(slug || '')}`} robots="noindex, nofollow" /><h1 className="text-3xl font-bold text-ink">Tracker not found</h1><p className="mt-4 text-inkMuted">The requested tracker could not be found or is not active.</p><Link to="/trackers" className="inline-flex mt-6 text-accent underline underline-offset-4">Browse active trackers</Link></div>;
  }

  const updatedAt = toDate(tracker.updatedAt);
  const customFields = [...(tracker.customFields || [])].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-paper">
      <SEOHead
        title={`${tracker.name} | DGNO Tracker`}
        description={tracker.description || `Public-interest incident data and source records for ${tracker.name}.`}
        url={`https://dgno.us/tracker/${tracker.slug}`}
        type="website"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <nav aria-label="Breadcrumb" className="text-sm text-inkMuted mb-6"><Link to="/trackers" className="hover:text-accent">Trackers</Link> <span aria-hidden="true">/</span> {tracker.name}</nav>
        <header className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">DGNO public-interest data</p>
          <h1 className="mt-3 font-heading text-4xl sm:text-5xl font-bold text-ink">{tracker.name}</h1>
          {tracker.description && <p className="mt-4 text-lg sm:text-xl text-inkMuted">{tracker.description}</p>}
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-inkMuted">
            <span>{incidents.length} published records shown (up to {PUBLIC_INCIDENT_LIMIT})</span>
            {updatedAt && <span>Tracker record updated <time dateTime={updatedAt.toISOString()}>{updatedAt.toLocaleDateString()}</time></span>}
          </div>
        </header>

        <section className="mt-8 rounded-xl border border-stone/50 bg-surface p-5 sm:p-6" aria-labelledby="methodology-heading">
          <h2 id="methodology-heading" className="text-xl font-bold text-ink">Methodology and date meaning</h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-5 text-sm text-inkMuted">
            <p><strong className="text-ink">Inclusion:</strong> Records match this tracker's stated scope. Inclusion documents a reported event; it is not by itself a legal conclusion.</p>
            <p><strong className="text-ink">Evidence:</strong> Linked sources and record review labels appear when structured editorial evidence is attached. A review label describes DGNO's inclusion decision and evidence package; it does not mean every field is independently confirmed. Older entries may not yet contain that package.</p>
            <p><strong className="text-ink">Freshness:</strong> The tracker update date means the tracker record changed. It does not mean every incident was independently re-verified on that date.</p>
          </div>
        </section>

        {incidents.length > 0 && (
          <div className="mt-8 flex flex-col sm:flex-row sm:items-end gap-4 sm:justify-between">
            <label className="grid gap-2 text-sm font-semibold text-ink max-w-xs">
              <span><FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />Filter records by occurrence year</span>
              <select value={yearFilter} onChange={(event) => setYearFilter(Number(event.target.value))} className="border border-stone rounded-lg bg-surface px-3 py-2 min-h-11">
                <option value={0}>All available years</option>
                {years.map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
            </label>
            <button type="button" onClick={handleDownload} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-accent-strong px-4 py-3 font-bold text-white hover:bg-accent-dark">
              <FontAwesomeIcon icon={faDownload} aria-hidden="true" /> Download visible records (CSV)
            </button>
          </div>
        )}

        <div className="mt-8">
          <TrackerVisualizations tracker={tracker} incidents={incidents} yearFilter={yearFilter || undefined} />
        </div>

        <section className="mt-8" aria-labelledby="incident-details-heading">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <FontAwesomeIcon icon={faChartBar} className="text-accent" />
            <h2 id="incident-details-heading" className="text-2xl font-bold text-ink">Incident details</h2>
            <span className="text-sm text-inkMuted">{filteredIncidents.length} records</span>
          </div>

          {filteredIncidents.length === 0 ? (
            <p className="rounded-xl border border-stone/50 bg-surface p-6 text-inkMuted">{yearFilter ? 'No incidents match the selected year.' : 'No published incidents are available for this tracker.'}</p>
          ) : (
            <>
              <div className="md:hidden space-y-4">
                {filteredIncidents.map((incident) => (
                  <article key={incident.id} className="rounded-xl border border-stone/50 bg-surface p-5">
                    <h3 className="font-bold text-ink">{incidentDate(tracker, incident)?.toLocaleDateString() || 'Date not reported'}</h3>
                    {tracker.useCustomFields && customFields.length ? (
                      <dl className="mt-4 space-y-3">
                        {customFields.map((field) => (
                          <div key={field.id}><dt className="text-xs uppercase tracking-wide font-bold text-inkMuted">{field.name}</dt><dd className="mt-1 text-sm text-ink"><FieldValue field={field} value={incident.customData?.[field.id]} /></dd></div>
                        ))}
                      </dl>
                    ) : (
                      <dl className="mt-4 space-y-3">
                        <div><dt className="text-xs uppercase tracking-wide font-bold text-inkMuted">Location</dt><dd className="mt-1 text-sm text-ink">{incident.location || 'Not reported'}</dd></div>
                        <div><dt className="text-xs uppercase tracking-wide font-bold text-inkMuted">Description</dt><dd className="mt-1 text-sm text-ink"><ExpandableDescription description={incident.description || ''} maxLength={180} /></dd></div>
                        <div><dt className="text-xs uppercase tracking-wide font-bold text-inkMuted">Body camera reported</dt><dd className="mt-1 text-sm text-ink">{incident.bodyCamAvailable ? 'Yes' : 'No'}</dd></div>
                      </dl>
                    )}
                    <div className="mt-5 pt-4 border-t border-stone/40"><p className="text-xs uppercase tracking-wide font-bold text-inkMuted mb-2">Sources and review</p><EvidenceSummary evidence={incident.editorialEvidence} /><IncidentChangeNote incident={incident} /></div>
                  </article>
                ))}
              </div>

              <div className="hidden md:block overflow-x-auto rounded-xl border border-stone/50 bg-surface">
                <table className="w-full min-w-[760px] text-left">
                  <caption className="sr-only">Published records for {tracker.name}</caption>
                  <thead className="bg-stone/10 text-xs uppercase tracking-wider text-inkMuted">
                    <tr>
                      {tracker.useCustomFields && customFields.length ? customFields.map((field) => <th key={field.id} scope="col" className="px-4 py-3">{field.name}</th>) : (
                        <><th scope="col" className="px-4 py-3">Date</th><th scope="col" className="px-4 py-3">Location</th><th scope="col" className="px-4 py-3">Description</th><th scope="col" className="px-4 py-3 text-center">Body cam</th><th scope="col" className="px-4 py-3 text-center">Video</th></>
                      )}
                      <th scope="col" className="px-4 py-3">Sources and review</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone/40">
                    {filteredIncidents.map((incident) => (
                      <tr key={incident.id} className="align-top hover:bg-stone/5">
                        {tracker.useCustomFields && customFields.length ? customFields.map((field) => <td key={field.id} className="px-4 py-4 text-sm text-ink max-w-sm"><FieldValue field={field} value={incident.customData?.[field.id]} /></td>) : (
                          <><td className="px-4 py-4 text-sm whitespace-nowrap">{formatDate(incident.dateOfOccurrence)}</td><td className="px-4 py-4 text-sm">{incident.location || 'Not reported'}</td><td className="px-4 py-4 text-sm max-w-md"><ExpandableDescription description={incident.description || ''} maxLength={120} /></td><td className="px-4 py-4 text-center"><FontAwesomeIcon icon={incident.bodyCamAvailable ? faCheck : faTimes} className={incident.bodyCamAvailable ? 'text-green-700' : 'text-red-700'} title={incident.bodyCamAvailable ? 'Body camera reported available' : 'Body camera not reported available'} /></td><td className="px-4 py-4 text-center">{incident.bodyCamVideoId || incident.bodyCamVideoUrl ? <FontAwesomeIcon icon={faVideo} className="text-accent" title="Video reported available" /> : <span className="text-inkMuted">—</span>}</td></>
                        )}
                        <td className="px-4 py-4 min-w-72"><EvidenceSummary evidence={incident.editorialEvidence} compact /><IncidentChangeNote incident={incident} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>

        <p className="mt-6 text-sm text-inkMuted">This page requests and displays up to the {PUBLIC_INCIDENT_LIMIT} most recent published records for performance, regardless of the tracker's stored incident count. The CSV includes the records currently visible under the selected year filter.</p>
      </div>
    </div>
  );
}
