
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../components/DashboardLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faFileAlt,
  faRocket,
  faPenNib,
  faPhotoFilm,
  faCog,
  faNewspaper
} from '@fortawesome/free-solid-svg-icons';

export default function DashboardPage() {
  const { userData, isStaff } = useAuth();

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-heading font-bold text-ink mb-2">
          Welcome back, {userData?.displayName}!
        </h1>
        <p className="text-inkMuted mb-8">
          {isStaff() 
            ? 'Manage your content and settings from the sidebar.' 
            : 'Manage your profile and bookmarked articles.'}
        </p>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border border-stone p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-inkMuted mb-1">Your Role</p>
                <p className="text-2xl font-bold text-ink">
                  {userData?.roles.join(', ') || 'Reader'}
                </p>
              </div>
              <div className="text-4xl">
                <FontAwesomeIcon icon={faUser} className="w-8 h-8 text-accent" />
              </div>
            </div>
          </div>

          {isStaff() && (
            <>
              <div className="bg-white rounded-lg border border-stone p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-inkMuted mb-1">Draft Articles</p>
                    <p className="text-2xl font-bold text-ink">0</p>
                  </div>
                  <div className="text-4xl">
                    <FontAwesomeIcon icon={faFileAlt} className="w-8 h-8 text-accent" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-stone p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-inkMuted mb-1">Published</p>
                    <p className="text-2xl font-bold text-ink">0</p>
                  </div>
                  <div className="text-4xl">
                    <FontAwesomeIcon icon={faRocket} className="w-8 h-8 text-accent" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Getting Started */}
        <div className="bg-white rounded-lg border border-stone p-6">
          <h2 className="text-xl font-heading font-bold text-ink mb-4">
            {isStaff() ? 'Quick Actions' : 'Getting Started'}
          </h2>
          <div className="space-y-3">
            {isStaff() ? (
              <>
                <a
                  href="/dashboard/articles/create"
                  className="group block p-4 border border-stone rounded-lg hover:border-accent hover:bg-accent transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      <FontAwesomeIcon icon={faPenNib} className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
                    </span>
                    <div>
                      <p className="font-medium text-ink group-hover:text-white transition-colors">Create New Article</p>
                      <p className="text-sm text-inkMuted group-hover:text-white group-hover:text-opacity-90 transition-colors">Start writing your next story</p>
                    </div>
                  </div>
                </a>
                <a
                  href="/dashboard/media"
                  className="group block p-4 border border-stone rounded-lg hover:border-accent hover:bg-accent transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      <FontAwesomeIcon icon={faPhotoFilm} className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
                    </span>
                    <div>
                      <p className="font-medium text-ink group-hover:text-white transition-colors">Upload Media</p>
                      <p className="text-sm text-inkMuted group-hover:text-white group-hover:text-opacity-90 transition-colors">Add images or videos to your library</p>
                    </div>
                  </div>
                </a>
              </>
            ) : (
              <>
                <a
                  href="/dashboard/settings"
                  className="group block p-4 border border-stone rounded-lg hover:border-accent hover:bg-accent transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      <FontAwesomeIcon icon={faCog} className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
                    </span>
                    <div>
                      <p className="font-medium text-ink group-hover:text-white transition-colors">Complete Your Profile</p>
                      <p className="text-sm text-inkMuted group-hover:text-white group-hover:text-opacity-90 transition-colors">Add your bio and profile picture</p>
                    </div>
                  </div>
                </a>
                <a
                  href="/"
                  className="group block p-4 border border-stone rounded-lg hover:border-accent hover:bg-accent transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      <FontAwesomeIcon icon={faNewspaper} className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
                    </span>
                    <div>
                      <p className="font-medium text-ink group-hover:text-white transition-colors">Browse Articles</p>
                      <p className="text-sm text-inkMuted group-hover:text-white group-hover:text-opacity-90 transition-colors">Discover groundbreaking news</p>
                    </div>
                  </div>
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
