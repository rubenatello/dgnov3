
import { useEffect, useState } from 'react';
import {collection, query, where, getCountFromServer} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import AnalyticsSetupPanel from '../../components/dashboard/AnalyticsSetupPanel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faFileAlt,
  faRocket,
  faPenNib,
  faPhotoFilm,
  faCog,
  faNewspaper,
  faChartLine,
  faArrowRight,
  faBolt
} from '@fortawesome/free-solid-svg-icons';

export default function DashboardPage() {
  const { userData, isStaff } = useAuth();
  const [publishedCount, setPublishedCount] = useState<number>(0);
  const [draftCount, setDraftCount] = useState<number>(0);

  useEffect(() => {
    async function fetchPublishedCount() {
      if (!userData?.displayName) return;
      const q = query(
        collection(db, 'articles'),
        where('authorName', '==', userData.displayName),
        where('status', '==', 'published')
      );
      const snapshot = await getCountFromServer(q);
      setPublishedCount(snapshot.data().count);
    }

    fetchPublishedCount();
  }, [userData?.displayName]);

  useEffect(() => {
  async function fetchDraftCount() {
    if (!userData?.displayName) return;
    const q = query(
      collection(db, 'articles'),
      where('authorName', '==', userData.displayName),
      where('status', '==', 'draft')
    );
    const snapshot = await getCountFromServer(q);
    setDraftCount(snapshot.data().count);
  }
  fetchDraftCount();
}, [userData?.displayName]);

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-accent to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
          <div className="relative z-10">
            <h1 className="text-3xl font-heading font-bold mb-2">
              {getGreeting()}, {userData?.displayName}! 👋
            </h1>
            <p className="text-white/80 text-lg">
              {isStaff() 
                ? "Ready to create something amazing? Your dashboard is ready." 
                : "Welcome back! Manage your profile and bookmarked articles."}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Role Card */}
          <div className="bg-white rounded-xl border border-stone p-5 hover:shadow-lg hover:border-accent/30 transition-all group">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-inkMuted font-medium mb-1">Your Role</p>
                <p className="text-xl font-bold text-ink capitalize">
                  {userData?.roles?.[0] || 'Reader'}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent group-hover:scale-110 transition-all">
                <FontAwesomeIcon icon={faUser} className="w-5 h-5 text-accent group-hover:text-white" />
              </div>
            </div>
          </div>

          {isStaff() && (
            <>
              {/* Drafts Card */}
              <div className="bg-white rounded-xl border border-stone p-5 hover:shadow-lg hover:border-amber-300 transition-all group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-inkMuted font-medium mb-1">Draft Articles</p>
                    <p className="text-3xl font-bold text-ink">
                      {draftCount !== null ? draftCount : '...'}
                    </p>
                    <p className="text-xs text-inkMuted mt-1">Waiting to publish</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:bg-amber-500 group-hover:scale-110 transition-all">
                    <FontAwesomeIcon icon={faFileAlt} className="w-5 h-5 text-amber-600 group-hover:text-white" />
                  </div>
                </div>
              </div>

              {/* Published Card */}
              <div className="bg-white rounded-xl border border-stone p-5 hover:shadow-lg hover:border-green-300 transition-all group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-inkMuted font-medium mb-1">Published</p>
                    <p className="text-3xl font-bold text-ink">
                      {publishedCount !== null ? publishedCount : '...'}
                    </p>
                    <p className="text-xs text-inkMuted mt-1">Live articles</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-500 group-hover:scale-110 transition-all">
                    <FontAwesomeIcon icon={faRocket} className="w-5 h-5 text-green-600 group-hover:text-white" />
                  </div>
                </div>
              </div>

              {/* Analytics Preview Card */}
              <div className="bg-white rounded-xl border border-stone p-5 hover:shadow-lg hover:border-purple-300 transition-all group">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-inkMuted font-medium mb-1">Total Articles</p>
                    <p className="text-3xl font-bold text-ink">
                      {publishedCount + draftCount}
                    </p>
                    <p className="text-xs text-inkMuted mt-1">All your content</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-500 group-hover:scale-110 transition-all">
                    <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 text-purple-600 group-hover:text-white" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-stone overflow-hidden">
          <div className="px-6 py-4 border-b border-stone bg-stone/10">
            <h2 className="text-lg font-heading font-bold text-ink flex items-center gap-2">
              <FontAwesomeIcon icon={faBolt} className="text-accent" />
              Quick Actions
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isStaff() ? (
                <>
                  <a
                    href="/dashboard/articles/create"
                    className="group flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-stone hover:border-accent hover:bg-accent/5 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent transition-all">
                      <FontAwesomeIcon icon={faPenNib} className="w-5 h-5 text-accent group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-ink group-hover:text-accent transition-colors">Create New Article</p>
                      <p className="text-sm text-inkMuted">Start writing your next story</p>
                    </div>
                    <FontAwesomeIcon icon={faArrowRight} className="text-inkMuted group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </a>
                  <a
                    href="/dashboard/articles"
                    className="group flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-stone hover:border-accent hover:bg-accent/5 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-all">
                      <FontAwesomeIcon icon={faFileAlt} className="w-5 h-5 text-blue-600 group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-ink group-hover:text-blue-600 transition-colors">Manage Articles</p>
                      <p className="text-sm text-inkMuted">Edit and organize content</p>
                    </div>
                    <FontAwesomeIcon icon={faArrowRight} className="text-inkMuted group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </a>
                  <a
                    href="/dashboard/media"
                    className="group flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-stone hover:border-accent hover:bg-accent/5 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:bg-purple-500 transition-all">
                      <FontAwesomeIcon icon={faPhotoFilm} className="w-5 h-5 text-purple-600 group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-ink group-hover:text-purple-600 transition-colors">Media Library</p>
                      <p className="text-sm text-inkMuted">Upload images and videos</p>
                    </div>
                    <FontAwesomeIcon icon={faArrowRight} className="text-inkMuted group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                  </a>
                  <a
                    href="/dashboard/analytics"
                    className="group flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-stone hover:border-accent hover:bg-accent/5 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-500 transition-all">
                      <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 text-green-600 group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-ink group-hover:text-green-600 transition-colors">View Analytics</p>
                      <p className="text-sm text-inkMuted">Track your performance</p>
                    </div>
                    <FontAwesomeIcon icon={faArrowRight} className="text-inkMuted group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                  </a>
                </>
              ) : (
                <>
                  <a
                    href="/dashboard/settings"
                    className="group flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-stone hover:border-accent hover:bg-accent/5 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent transition-all">
                      <FontAwesomeIcon icon={faCog} className="w-5 h-5 text-accent group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-ink group-hover:text-accent transition-colors">Complete Your Profile</p>
                      <p className="text-sm text-inkMuted">Add your bio and profile picture</p>
                    </div>
                    <FontAwesomeIcon icon={faArrowRight} className="text-inkMuted group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </a>
                  <a
                    href="/"
                    className="group flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-stone hover:border-accent hover:bg-accent/5 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-500 transition-all">
                      <FontAwesomeIcon icon={faNewspaper} className="w-5 h-5 text-blue-600 group-hover:text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-ink group-hover:text-blue-600 transition-colors">Browse Articles</p>
                      <p className="text-sm text-inkMuted">Discover groundbreaking news</p>
                    </div>
                    <FontAwesomeIcon icon={faArrowRight} className="text-inkMuted group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Analytics Setup Panel - Only for staff */}
        {isStaff() && (
          <AnalyticsSetupPanel />
        )}
      </div>
    </DashboardLayout>
  );
}
