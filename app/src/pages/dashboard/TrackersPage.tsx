import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEye, faToggleOn, faToggleOff } from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import type { Tracker } from '../../types/models';
import { getTrackers, updateTracker, deleteTracker } from '../../services/trackerService';

export default function TrackersPage() {
  const { isEditor, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

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

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Trackers</h1>
          {(isEditor() || isAdmin()) && (
            <button
              className="bg-accent text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90"
              onClick={() => navigate('/dashboard/trackers/create')}
            >
              <FontAwesomeIcon icon={faPlus} /> Create Tracker
            </button>
          )}
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
                      {tracker.updatedAt?.toDate().toLocaleDateString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex gap-2">
                        <button
                          className="text-blue-600 hover:text-blue-800"
                          onClick={() => navigate(`/dashboard/trackers/${tracker.id}`)}
                          title="View incidents"
                        >
                          <FontAwesomeIcon icon={faEye} />
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