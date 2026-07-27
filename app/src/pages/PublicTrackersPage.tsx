import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCalendarAlt, faChartBar } from '@fortawesome/free-solid-svg-icons';
import { getActiveTrackers } from '../services/trackerService';
import type { Tracker } from '../types/models';
import { getYear, toDate } from '../utils/dateUtils';
import SEOHead from '../components/SEOHead';

export default function PublicTrackersPage() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getActiveTrackers()
      .then((items) => active && setTrackers(items.filter((tracker) => tracker.isActive)))
      .catch((caught) => {
        console.error('Error loading trackers:', caught);
        if (active) setError('Public trackers could not be loaded right now.');
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-screen bg-paper">
      <SEOHead
        title="Public-interest data trackers | DGNO"
        description="Explore DGNO's active incident and accountability trackers, including methodology, source records, and downloadable public data."
        url="https://dgno.us/trackers"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <header className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Public-interest data</p>
          <h1 className="mt-3 font-heading text-4xl sm:text-5xl font-bold text-ink">DGNO Trackers</h1>
          <p className="mt-4 text-lg sm:text-xl text-inkMuted">
            Active datasets maintained to document recurring government, military, and public-accountability events. Each tracker explains its scope and shows source evidence when that evidence is attached to a record.
          </p>
          <div className="mt-6 inline-flex rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent-dark">
            Public access · no account or subscription required
          </div>
        </header>

        <div className="mt-12 min-h-[34rem] md:min-h-[20rem]">
        {loading ? (
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading active DGNO trackers" role="status">
            {[0, 1].map((item) => (
              <div key={item} className="min-h-64 animate-pulse rounded-xl border border-stone/50 bg-surface p-6">
                <div className="h-6 w-4/5 rounded bg-stone-light" />
                <div className="mt-4 h-4 w-full rounded bg-stone-light" />
                <div className="mt-2 h-4 w-3/4 rounded bg-stone-light" />
                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="h-12 rounded bg-stone-light" />
                  <div className="h-12 rounded bg-stone-light" />
                </div>
                <span className="sr-only">Loading tracker summaries…</span>
              </div>
            ))}
          </section>
        ) : error ? (
          <div role="alert" className="rounded-lg border-l-4 border-red-600 bg-red-50 p-5 text-red-900">
            <p className="font-semibold">Unable to load trackers</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        ) : trackers.length ? (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" aria-label="Active DGNO trackers">
            {trackers.map((tracker) => {
              const updatedAt = toDate(tracker.updatedAt);
              return (
                <article key={tracker.id} className="bg-surface rounded-xl shadow-sm border border-stone/50 p-6 flex flex-col transition hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg">
                  <h2 className="text-xl font-bold text-ink">
                    <Link to={`/tracker/${tracker.slug}`} className="hover:text-accent">{tracker.name}</Link>
                  </h2>
                  {tracker.description && <p className="mt-3 text-inkMuted text-sm line-clamp-4">{tracker.description}</p>}
                  <dl className="mt-5 grid grid-cols-2 gap-3 text-sm text-inkMuted">
                    <div>
                      <dt className="flex items-center gap-2"><FontAwesomeIcon icon={faChartBar} /> Published records</dt>
                      <dd className="mt-1 text-lg font-bold text-ink">{tracker.incidentCount ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="flex items-center gap-2"><FontAwesomeIcon icon={faCalendarAlt} /> Tracker created</dt>
                      <dd className="mt-1 text-lg font-bold text-ink">{getYear(tracker.createdAt) || 'Not stated'}</dd>
                    </div>
                  </dl>
                  {updatedAt && (
                    <p className="mt-4 text-xs text-inkMuted">
                      Tracker record updated <time dateTime={updatedAt.toISOString()}>{updatedAt.toLocaleDateString()}</time>
                    </p>
                  )}
                  <Link to={`/tracker/${tracker.slug}`} className="mt-6 inline-flex items-center gap-2 font-semibold text-accent underline underline-offset-4">
                    View data and methodology <FontAwesomeIcon icon={faArrowRight} aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </section>
        ) : (
          <p className="rounded-lg bg-surface border border-stone/50 p-6 text-inkMuted">No active public trackers are available at this time.</p>
        )}
        </div>

        <section className="mt-14 bg-surface rounded-xl border border-stone/50 p-6 sm:p-8" aria-labelledby="tracker-method-heading">
          <h2 id="tracker-method-heading" className="text-2xl font-bold text-ink">How to read these trackers</h2>
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-inkMuted">
            <div><h3 className="font-bold text-ink">Scope</h3><p className="mt-2">Each tracker defines the events it includes. A record's presence documents DGNO's inclusion decision; it is not automatically a legal finding.</p></div>
            <div><h3 className="font-bold text-ink">Dates</h3><p className="mt-2">Occurrence dates describe the reported event. “Updated” describes maintenance of the tracker record and does not claim that every fact was re-verified that day.</p></div>
            <div><h3 className="font-bold text-ink">Evidence</h3><p className="mt-2">Where a record contains an editorial evidence package, DGNO displays its sources and review status. Older records may not yet contain that structured evidence.</p></div>
          </div>
        </section>
      </div>
    </div>
  );
}
