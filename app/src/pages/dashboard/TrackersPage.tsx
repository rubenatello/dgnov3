import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEye, faToggleOn, faToggleOff, faDownload } from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import type { Tracker } from '../../types/models';
import { getTrackers, updateTracker, deleteTracker, getIncidents } from '../../services/trackerService';
import { downloadTrackerCSV, downloadAllTrackersCSV } from '../../utils/helpers';
import { formatDate } from '../../utils/dateUtils';
import { hasDownloadAccess } from '../../services/subscriptionService';

export default function TrackersPage() {
  const { isEditor, isAdmin, userData } = useAuth();
  const navigate = useNavigate();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [canDownload, setCanDownload] = useState(false);

  const fetchTrackers = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedTrackers = await getTrackers(!showInactive); // Active by default
      setTrackers(fetchedTrackers);
    } catch (error) {
      console.error('Error fetching trackers:', error);
    } finally {
      setLoading(false);
    }
  }, [showInactive]);

  // Check download access on component mount and when user data changes
  useEffect(() => {
    async function checkDownloadAccess() {
      if (userData?.id) {
        const access = await hasDownloadAccess(userData.id, userData.roles);
        setCanDownload(access);
      } else {
        setCanDownload(false);
      }
    }
    checkDownloadAccess();
  }, [userData]);

  useEffect(() => {
    fetchTrackers();
  }, [fetchTrackers]);

  async function handleToggleActive(id: string, currentStatus: boolean) {
    try {
      await updateTracker(id, { isActive: !currentStatus });
      fetchTrackers(); // Refresh list
    } catch (error) {
      console.error('Error updating tracker status:', error);
    }
  }

  async function handleDeleteTracker(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also delete all associated incidents. This action cannot be undone.`)) return;
    try {
      await deleteTracker(id);
      fetchTrackers(); // Refresh list
    } catch (error) {
      console.error('Error deleting tracker:', error);
    }
  }

  async function handleDownloadTrackerCSV(tracker: Tracker) {
    if (!canDownload) {
      alert('CSV downloads are available to subscribers only. Please subscribe to access this feature.');
      return;
    }
    
    try {
      const incidents = await getIncidents(tracker.id!);
      downloadTrackerCSV(tracker, incidents);
    } catch (error) {
      console.error('Error downloading tracker CSV:', error);
    }
  }

  async function handleDownloadAllCSV() {
    if (!canDownload) {
      alert('CSV downloads are available to subscribers only. Please subscribe to access this feature.');
      return;
    }
    
    try {
      await downloadAllTrackersCSV(trackers, getIncidents);
    } catch (error) {
      console.error('Error downloading all trackers CSV:', error);
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink">Trackers</h1>
            <p className="text-sm text-gray-500 mt-1">Manage and monitor incident tracking databases</p>
          </div>
          <div className="flex gap-3">
            {trackers.length > 0 && (
              <button
                className={`px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                  canDownload 
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                onClick={handleDownloadAllCSV}
                title={canDownload ? "Download all tracker data as CSV files" : "Subscriber feature - CSV downloads available to subscribers only"}
              >
                <FontAwesomeIcon icon={faDownload} /> 
                {canDownload ? 'Export All' : 'Export All (Subscribers)'}
              </button>
            )}
            {(isEditor() || isAdmin()) && (
              <button
                className="bg-accent text-white px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-accent/90 shadow-sm hover:shadow-md transition-all duration-200"
                onClick={() => navigate('/dashboard/trackers/create')}
              >
                <FontAwesomeIcon icon={faPlus} /> Create Tracker
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6 p-3 bg-gray-50 rounded-lg border border-gray-100">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent/50 cursor-pointer"
            />
            <span className="text-sm text-gray-600">Show inactive trackers</span>
          </label>
        </div>

        {/* Trackers Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-4"></div>
            <p className="text-gray-500">Loading trackers...</p>
          </div>
        ) : trackers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="font-semibold text-gray-700 mb-1">
              {showInactive ? 'No inactive trackers' : 'No active trackers'}
            </h3>
            <p className="text-sm text-gray-500">
              {showInactive ? 'All trackers are currently active.' : 'Create your first tracker to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Incidents</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Updated</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {trackers.map((tracker) => (
                  <tr key={tracker.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-5 py-4">
                      <div>
                        <div className="font-semibold text-ink">{tracker.name}</div>
                        {tracker.description && (
                          <div className="text-sm text-gray-500 mt-0.5 line-clamp-1">{tracker.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-sm font-semibold">
                        {tracker.incidentCount || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        tracker.isActive 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${tracker.isActive ? 'bg-emerald-500' : 'bg-gray-400'}`}></span>
                        {tracker.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">
                      {formatDate(tracker.updatedAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center gap-1">
                        <button
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          onClick={() => navigate(`/tracker/${tracker.slug}`)}
                          title="View incidents"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          className={`p-2 rounded-lg transition-colors ${
                            canDownload 
                              ? 'text-purple-600 hover:text-purple-800 hover:bg-purple-50' 
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          onClick={() => handleDownloadTrackerCSV(tracker)}
                          title={canDownload ? "Download tracker data as CSV" : "Subscriber feature"}
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </button>
                        {(isEditor() || isAdmin()) && (
                          <>
                            <button
                              className="p-2 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                              onClick={() => navigate(`/dashboard/trackers/${tracker.id}/edit`)}
                              title="Edit tracker"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              className={`p-2 rounded-lg transition-colors ${tracker.isActive 
                                ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50' 
                                : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                              }`}
                              onClick={() => handleToggleActive(tracker.id!, tracker.isActive)}
                              title={tracker.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <FontAwesomeIcon icon={tracker.isActive ? faToggleOff : faToggleOn} />
                            </button>
                            <button
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              onClick={() => handleDeleteTracker(tracker.id!, tracker.name)}
                              title="Delete tracker"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}