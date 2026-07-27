import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import SEOHead from '../components/SEOHead';
import { db } from '../config/firebase';
import type { InvestigationsBoardPayload } from '../types/investigations';

export default function InvestigationsIndexPage() {
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'investigations', 'epstein-files'));
        if (snapshot.exists()) {
          const data = snapshot.data() as InvestigationsBoardPayload;
          setIsActive(data.isActive ?? true);
        }
      } catch (error) {
        console.error('Failed to load investigations status', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

  return (
    <div className="bg-bg">
      <SEOHead
        title="Investigations | DGNO"
        description="Browse DGNO investigations featuring documented sources, timelines, and key relationships." 
        url="https://dgno.us/investigations"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-ink">Investigations</h1>
          <p className="text-inkMuted mt-3 max-w-3xl">
            Explore long-form investigative work with primary sources and structured timelines.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="rounded-2xl border border-stone/20 bg-surface p-6 text-inkMuted">
              Loading investigations…
            </div>
          ) : isActive ? (
            <Link
              to="/investigations/epstein-files"
              className="group rounded-2xl border border-stone/20 bg-surface p-6 shadow-sm hover:-translate-y-1 hover:border-accent/40 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-ink group-hover:text-accent">
                    Epstein Files
                  </h2>
                  <p className="text-sm text-inkMuted mt-1">Interactive investigation board</p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-masthead text-white">1</span>
              </div>
              <p className="text-sm text-inkMuted mt-4">
                A structured map of key people, documents, and timeline events with source links.
              </p>
              <div className="mt-4 text-sm font-semibold text-accent">View board →</div>
            </Link>
          ) : (
            <div className="rounded-2xl border border-stone/20 bg-surface p-6 text-inkMuted">
              No investigations are currently published.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
