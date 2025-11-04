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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Trackers</h1>
          <div className="flex gap-3">
            {trackers.length > 0 && (
              <button
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  canDownload 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-gray-400 text-gray-700 cursor-not-allowed'
                }`}
                onClick={handleDownloadAllCSV}
                title={canDownload ? "Download all tracker data as CSV files" : "Subscriber feature - CSV downloads available to subscribers only"}
              >
                <FontAwesomeIcon icon={faDownload} /> 
                {canDownload ? 'Download All CSV' : 'Download All CSV (Subscribers Only)'}
              </button>
            )}
            {(isEditor() || isAdmin()) && (
              <button
                className="bg-accent text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90"
                onClick={() => navigate('/dashboard/trackers/create')}
              >
                <FontAwesomeIcon icon={faPlus} /> Create Tracker
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show inactive trackers</span>
          </label>
        </div>

        {/* Trackers Table */}
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : trackers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {showInactive ? 'No inactive trackers found.' : 'No active trackers found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Incidents</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Updated</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trackers.map((tracker) => (
                  <tr key={tracker.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">
                      <div>
                        <div className="font-medium">{tracker.name}</div>
                        {tracker.description && (
                          <div className="text-sm text-gray-600 mt-1">{tracker.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                        {tracker.incidentCount || 0}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        tracker.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {tracker.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {formatDate(tracker.updatedAt)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => navigate(`/tracker/${tracker.slug}`)}
                          title="View incidents"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                        <button
                          className={`${
                            canDownload 
                              ? 'text-purple-600 hover:text-purple-800' 
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                          onClick={() => handleDownloadTrackerCSV(tracker)}
                          title={canDownload ? "Download tracker data as CSV" : "Subscriber feature - CSV downloads available to subscribers only"}
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </button>
                        {(isEditor() || isAdmin()) && (
                          <>
                            <button
                              className="text-green-600 hover:text-green-800"
                              onClick={() => navigate(`/dashboard/trackers/${tracker.id}/edit`)}
                              title="Edit tracker"
                            >
                              <FontAwesomeIcon icon={faEdit} />
                            </button>
                            <button
                              className={`${tracker.isActive ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                              onClick={() => handleToggleActive(tracker.id!, tracker.isActive)}
                              title={tracker.isActive ? 'Deactivate' : 'Activate'}
                            >
                              <FontAwesomeIcon icon={tracker.isActive ? faToggleOff : faToggleOn} />
                            </button>
                            <button
                              className="text-red-600 hover:text-red-800"
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