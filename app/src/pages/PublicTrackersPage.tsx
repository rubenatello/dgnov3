import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faCalendarAlt, faChartBar, faDownload } from '@fortawesome/free-solid-svg-icons';
import { getAllTrackers, getIncidents } from '../services/trackerService';
import type { Tracker } from '../types/models';
import { downloadAllTrackersCSV } from '../utils/helpers';
import { getYear } from '../utils/dateUtils';

export default function PublicTrackersPage() {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrackers();
  }, []);

  async function loadTrackers() {
    try {
      const allTrackers = await getAllTrackers();
      // Only show active trackers to public
      setTrackers(allTrackers.filter((tracker: Tracker) => tracker.isActive));
    } catch (error) {
      console.error('Error loading trackers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadAllCSV() {
    try {
      await downloadAllTrackersCSV(trackers, getIncidents);
    } catch (error) {
      console.error('Error downloading all trackers CSV:', error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading trackers...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Incident Trackers
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Comprehensive tracking and analysis of critical incidents across the United States. 
            Each tracker provides detailed data, geographic analysis, and statistical insights.
          </p>
          {trackers.length > 0 && (
            <div className="mt-6">
              <button
                onClick={handleDownloadAllCSV}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                title="Download all tracker data as CSV files"
              >
                <FontAwesomeIcon icon={faDownload} />
                Download All Data (CSV)
              </button>
            </div>
          )}
        </div>

        {/* Trackers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trackers.map((tracker) => (
            <Link
              key={tracker.id}
              to={`/tracker/${tracker.slug}`}
              className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-200"
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {tracker.name}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-3">
                  {tracker.description}
                </p>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faChartBar} />
                  <span>{tracker.incidentCount || 0} incidents</span>
                </div>
                <div className="flex items-center gap-1">
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <span>Since {getYear(tracker.createdAt) || 'Unknown'}</span>
                </div>
              </div>

              <div className="flex items-center text-blue-600 text-sm font-medium">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                View detailed analysis →
              </div>
            </Link>
          ))}
        </div>

        {trackers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No active trackers available at this time.</p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About Our Trackers</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Geographic Analysis</h3>
              <p>Interactive maps showing incident distribution across states and regions.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Temporal Tracking</h3>
              <p>Year-over-year comparisons and trend analysis for incidents.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Detailed Data</h3>
              <p>Comprehensive incident details including dates, locations, and documentation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}