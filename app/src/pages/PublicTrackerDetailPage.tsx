import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMapMarkerAlt, faCalendarAlt, faChartBar, faVideo, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { getAllTrackers, getIncidents } from '../services/trackerService';
import type { Tracker, TrackerIncident } from '../types/models';
import USStateMap from '../components/USStateMap';
import ExpandableDescription from '../components/ExpandableDescription';

// US State data for map visualization
const US_STATES = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
};

interface StateCount {
  state: string;
  count: number;
  abbreviation: string;
}

export default function PublicTrackerDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [tracker, setTracker] = useState<Tracker | null>(null);
  const [incidents, setIncidents] = useState<TrackerIncident[]>([]);
  const [stateCounts, setStateCounts] = useState<StateCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());

  const loadTrackerData = useCallback(async () => {
    try {
      // Find tracker by slug
      const allTrackers = await getAllTrackers();
      const foundTracker = allTrackers.find(t => t.slug === slug && t.isActive);
      
      if (!foundTracker) {
        setTracker(null);
        setLoading(false);
        return;
      }

      setTracker(foundTracker);
      
      // Load incidents
      const trackerIncidents = await getIncidents(foundTracker.id!);
      setIncidents(trackerIncidents);
    } catch (error) {
      console.error('Error loading tracker data:', error);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const calculateStateCounts = useCallback(() => {
    const counts = new Map<string, number>();
    
    incidents
      .filter(incident => {
        if (yearFilter === 0) return true; // All years
        return incident.dateOfOccurrence?.toDate().getFullYear() === yearFilter;
      })
      .forEach(incident => {
        let stateCode = '';
        
        // First try structured state field (new incidents)
        if (incident.state) {
          stateCode = incident.state.toUpperCase();
        } else {
          // Fall back to parsing location field (legacy incidents)
          const location = incident.location || '';
          const parts = location.split(',').map(p => p.trim());
          
          if (parts.length >= 2) {
            const stateInput = parts[parts.length - 1]; // Last part should be state
            
            // Handle both full state names and abbreviations
            stateCode = stateInput.toUpperCase();
            
            // If it's a full state name, convert to abbreviation
            const fullStateName = Object.keys(US_STATES).find(state => 
              state.toUpperCase() === stateInput.toUpperCase()
            );
            if (fullStateName) {
              stateCode = US_STATES[fullStateName as keyof typeof US_STATES];
            }
          }
        }
        
        // Validate it's a real state abbreviation
        if (stateCode && Object.values(US_STATES).includes(stateCode)) {
          counts.set(stateCode, (counts.get(stateCode) || 0) + 1);
        }
      });

    const stateCountsArray = Array.from(counts.entries()).map(([abbreviation, count]) => {
      const fullName = Object.keys(US_STATES).find(state => 
        US_STATES[state as keyof typeof US_STATES] === abbreviation
      ) || abbreviation;
      
      return {
        state: fullName,
        abbreviation,
        count
      };
    }).sort((a, b) => b.count - a.count);

    setStateCounts(stateCountsArray);
  }, [incidents, yearFilter]);

  useEffect(() => {
    if (slug) {
      loadTrackerData();
    }
  }, [slug, loadTrackerData]);

  useEffect(() => {
    if (incidents.length > 0) {
      calculateStateCounts();
    }
  }, [incidents, yearFilter, calculateStateCounts]);

  function getAvailableYears() {
    const years = new Set<number>();
    incidents.forEach(incident => {
      if (incident.dateOfOccurrence) {
        years.add(incident.dateOfOccurrence.toDate().getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }

  function getCurrentYearCount() {
    return incidents.filter(incident => 
      incident.dateOfOccurrence?.toDate().getFullYear() === new Date().getFullYear()
    ).length;
  }

  function getBodyCamVerificationRate() {
    const totalIncidents = filteredIncidents.length;
    if (totalIncidents === 0) return 0;
    
    const verifiedIncidents = filteredIncidents.filter(incident => 
      incident.bodyCamAvailable && incident.bodyCamVideoId
    ).length;
    
    return Math.round((verifiedIncidents / totalIncidents) * 100);
  }

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

  const availableYears = getAvailableYears();
  const currentYearCount = getCurrentYearCount();
  const filteredIncidents = yearFilter === 0 ? incidents : 
    incidents.filter(incident => incident.dateOfOccurrence?.toDate().getFullYear() === yearFilter);

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
          
          {/* Key Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-blue-600">{incidents.length}</div>
              <div className="text-sm text-gray-600">Total Incidents</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-green-600">{currentYearCount}</div>
              <div className="text-sm text-gray-600">This Year ({new Date().getFullYear()})</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-purple-600">{stateCounts.length}</div>
              <div className="text-sm text-gray-600">States Affected</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-2xl font-bold text-red-600">{getBodyCamVerificationRate()}%</div>
              <div className="text-xs text-gray-600 leading-tight">Independently Verified BodyCam or Footage Available</div>
            </div>
          </div>
        </div>

        {/* Year Filter */}
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
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </label>
        </div>

        {/* State Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* US State Map */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faMapMarkerAlt} />
              Geographic Distribution
            </h2>
            <USStateMap 
              data={stateCounts} 
              year={yearFilter > 0 ? yearFilter : undefined}
            />
          </div>

          {/* State Rankings */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faChartBar} />
              States by Incident Count
            </h2>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {stateCounts.map((stateData, index) => (
                <div key={stateData.abbreviation} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                    <span className="font-medium">{stateData.state}</span>
                    <span className="text-xs text-gray-500">({stateData.abbreviation})</span>
                  </div>
                  <span className="font-bold text-blue-600">{stateData.count}</span>
                </div>
              ))}
              {stateCounts.length === 0 && (
                <p className="text-gray-500 text-center py-4">No data available for selected period</p>
              )}
            </div>
          </div>
        </div>

        {/* Incidents Data Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FontAwesomeIcon icon={faChartBar} />
              Incident Details
              <span className="text-base font-normal text-gray-500">
                ({filteredIncidents.length} incidents)
              </span>
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Body Cam</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Video</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {incident.dateOfOccurrence?.toDate().toLocaleDateString()}
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
                ))}
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