import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faChartBar, faVideo, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { getActiveTrackers, getIncidents } from '../services/trackerService';
import type { Tracker, TrackerIncident } from '../types/models';
import ExpandableDescription from '../components/ExpandableDescription';
import { downloadTrackerCSV } from '../utils/helpers';
import { formatDate } from '../utils/dateUtils';
import SubscriberDownloadButton from '../components/SubscriberDownloadButton';
import TrackerVisualizations from '../components/tracker/TrackerVisualizations';



export default function PublicTrackerDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tracker, setTracker] = useState<Tracker | null>(null);
  const [incidents, setIncidents] = useState<TrackerIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());

  // Function to format cell values based on field type
  function formatCellValue(value: unknown, fieldType: string): string {
    if (value === null || value === undefined || value === '') return '-';
    
    switch (fieldType) {
      case 'date':
        // Handle date formatting without timezone issues
        if (typeof value === 'string') {
          const dateStr = value;
          // Parse as YYYY-MM-DD format directly to avoid timezone issues
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [year, month, day] = dateStr.split('-').map(Number);
            const date = new Date(year, month - 1, day); // month is 0-indexed
            return date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric'
            });
          }
          // Fallback for other date formats
          const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
          return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            timeZone: 'UTC' // Force UTC to avoid timezone shifts
          });
        }
        return formatDate(value);
      case 'checkbox':
        return value ? 'Yes' : 'No';
      case 'url':
        return typeof value === 'string' ? value : String(value);
      case 'number':
        return typeof value === 'number' ? value.toString() : String(value);
      default:
        return String(value);
    }
  }

  // Function to render table headers dynamically
  function renderTableHeaders() {
    if (!tracker) return null;

    if (tracker.useCustomFields && tracker.customFields?.length) {
      // Custom fields tracker - render dynamic headers
      return (
        <tr>
          {tracker.customFields.map((field) => (
            <th key={field.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              {field.name}
            </th>
          ))}
        </tr>
      );
    } else {
      // Legacy tracker - render standard headers
      return (
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Date</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Location</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Body Cam</th>
          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Video</th>
        </tr>
      );
    }
  }

  // Function to render table rows dynamically
  function renderTableRow(incident: TrackerIncident) {
    if (!tracker) return null;

    if (tracker.useCustomFields && tracker.customFields?.length) {
      // Custom fields tracker - render dynamic cells
      return (
        <tr key={incident.id} className="hover:bg-gray-50">
          {tracker.customFields.map((field) => {
            const value = incident.customData?.[field.id];
            return (
              <td key={field.id} className="px-4 py-3 text-sm text-gray-900">
                {field.type === 'url' && value ? (
                  <a href={String(value)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {String(value)}
                  </a>
                ) : field.type === 'textarea' ? (
                  <div className="max-w-md">
                    <ExpandableDescription 
                      description={String(value || '')} 
                      maxLength={80}
                    />
                  </div>
                ) : (
                  formatCellValue(value, field.type)
                )}
              </td>
            );
          })}
        </tr>
      );
    } else {
      // Legacy tracker - render standard cells
      return (
        <tr key={incident.id} className="hover:bg-gray-50">
          <td className="px-4 py-3 text-sm text-gray-900">
            {formatDate(incident.dateOfOccurrence)}
          </td>
          <td className="px-4 py-3 text-sm text-gray-900">
            {incident.location}
          </td>
          <td className="px-4 py-3 text-sm text-gray-900">
            <div className="max-w-md">
              <ExpandableDescription 
                description={incident.description} 
                maxLength={80}
              />
            </div>
          </td>
          <td className="px-4 py-3 text-sm text-center">
            <FontAwesomeIcon 
              icon={incident.bodyCamAvailable ? faCheck : faTimes} 
              className={incident.bodyCamAvailable ? 'text-green-600' : 'text-red-600'} 
            />
          </td>
          <td className="px-4 py-3 text-sm text-center">
            {incident.bodyCamVideoId ? (
              <FontAwesomeIcon icon={faVideo} className="text-blue-600" title="Video available" />
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </td>
        </tr>
      );
    }
  }

  const loadTrackerData = useCallback(async () => {
    try {
      // Find tracker by slug
      const allTrackers = await getActiveTrackers();
      const foundTracker = allTrackers.find(t => t.slug === slug && t.isActive);
      
      if (!foundTracker) {
        setTracker(null);
        setLoading(false);
        return;
      }

      setTracker(foundTracker);
      
      // Load incidents and sort chronologically (oldest to newest)
      const trackerIncidents = await getIncidents(foundTracker.id!);
      
      // Sort incidents by date
      const sortedIncidents = [...trackerIncidents].sort((a, b) => {
        const dateField = foundTracker.customFields?.find(field => field.type === 'date');
        
        let dateA: Date, dateB: Date;
        
        if (dateField && a.customData?.[dateField.id] && b.customData?.[dateField.id]) {
          // Use custom date field, parse as local date to avoid timezone issues
          const dateStrA = a.customData[dateField.id] as string;
          const dateStrB = b.customData[dateField.id] as string;
          
          // Parse YYYY-MM-DD format directly
          if (dateStrA.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [yearA, monthA, dayA] = dateStrA.split('-').map(Number);
            dateA = new Date(yearA, monthA - 1, dayA);
          } else {
            dateA = new Date(dateStrA + (dateStrA.includes('T') ? '' : 'T12:00:00'));
          }
          
          if (dateStrB.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [yearB, monthB, dayB] = dateStrB.split('-').map(Number);
            dateB = new Date(yearB, monthB - 1, dayB);
          } else {
            dateB = new Date(dateStrB + (dateStrB.includes('T') ? '' : 'T12:00:00'));
          }
        } else {
          // Fallback to legacy dates
          dateA = a.dateOfOccurrence?.toDate() || new Date(0);
          dateB = b.dateOfOccurrence?.toDate() || new Date(0);
        }
        
        return dateA.getTime() - dateB.getTime(); // Oldest first
      });
      
      setIncidents(sortedIncidents);
    } catch (error) {
      console.error('Error loading tracker data:', error);
    } finally {
      setLoading(false);
    }
  }, [slug]);







  useEffect(() => {
    if (slug) {
      loadTrackerData();
    }
  }, [slug, loadTrackerData]);





  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading tracker data...</div>
        </div>
      </div>
    );
  }

  if (!tracker) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Tracker Not Found</h1>
            <p className="text-gray-600">The requested tracker could not be found or is not active.</p>
          </div>
        </div>
      </div>
    );
  }

  const filteredIncidents = incidents;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {tracker.name}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            {tracker.description}
          </p>
          

        </div>

        {/* Year Filter - only show if there are incidents */}
        {incidents.length > 0 && (
          <div className="mb-6 text-center">
            <label className="inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarAlt} />
              <span className="font-medium">Filter by Year:</span>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(Number(e.target.value))}
                className="border rounded px-3 py-1"
              >
                <option value={0}>All Years</option>
                <option value={2025}>2025</option>
                <option value={2024}>2024</option>
                <option value={2023}>2023</option>
              </select>
            </label>
          </div>
        )}

        {/* Custom Visualizations */}
        <div className="mb-8">
          <TrackerVisualizations 
            tracker={tracker} 
            incidents={incidents} 
            yearFilter={yearFilter > 0 ? yearFilter : undefined} 
          />
        </div>



        {/* Incidents Data Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FontAwesomeIcon icon={faChartBar} />
                Incident Details
                <span className="text-base font-normal text-gray-500">
                  ({filteredIncidents.length} incidents)
                </span>
              </h2>
              <SubscriberDownloadButton
                onDownload={() => tracker && downloadTrackerCSV(tracker, incidents)}
                label="Download CSV"
                className="px-4 py-2"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                {renderTableHeaders()}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIncidents.map((incident) => renderTableRow(incident))}
              </tbody>
            </table>
            {filteredIncidents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No incidents found for the selected period.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}