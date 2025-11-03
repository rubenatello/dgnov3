import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faPlus, faTrash, faVideo, faCheck, faTimes, faEdit } from '@fortawesome/free-solid-svg-icons';
import { Timestamp } from 'firebase/firestore';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import MediaPicker from '../../components/MediaPicker';
import type { Tracker, TrackerIncident, Media } from '../../types/models';
import { createTracker, getTracker, updateTracker } from '../../services/trackerService';
import { US_STATES } from '../../utils/states';
import { addIncident, getIncidents, updateIncident, deleteIncident } from '../../services/trackerService';
import FieldBuilder from '../../components/tracker/FieldBuilder';
import DynamicForm from '../../components/tracker/DynamicForm';
import DynamicTable from '../../components/tracker/DynamicTable';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

export default function CreateEditTrackerPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { userData, isEditor, isAdmin } = useAuth();

  // Tracker form state
  const [trackerData, setTrackerData] = useState<Partial<Tracker>>({
    name: '',
    description: '',
    slug: '',
    isActive: true,
    createdBy: userData?.id || '',
    incidentCount: 0,
    useCustomFields: false,
    customFields: [],
  });

  // Incidents state
  const [incidents, setIncidents] = useState<TrackerIncident[]>([]);
  const [editingIncident, setEditingIncident] = useState<string | null>(null);
  const [newIncident, setNewIncident] = useState<Partial<TrackerIncident>>({
    dateOfOccurrence: Timestamp.fromDate(new Date()),
    location: '',
    city: '',
    state: '',
    description: '',
    bodyCamAvailable: false,
    bodyCamVideoId: '',
    bodyCamVideoUrl: '',
    createdBy: userData?.id || '',
    status: 'active',
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerFor, setMediaPickerFor] = useState<'new' | string>('new');
  
  // Custom fields state
  const [customIncidentData, setCustomIncidentData] = useState<Record<string, string | number | boolean | Date>>({});

  // Define callback functions first
  const loadTracker = useCallback(async (trackerId: string) => {
    setLoading(true);
    try {
      const tracker = await getTracker(trackerId);
      if (tracker) {
        // Check permissions
        if (!isEditor() && !isAdmin() && tracker.createdBy !== userData?.id) {
          alert('You do not have permission to edit this tracker.');
          navigate('/dashboard/trackers');
          return;
        }
        setTrackerData(tracker);
      } else {
        alert('Tracker not found.');
        navigate('/dashboard/trackers');
      }
    } catch (error) {
      console.error('Error loading tracker:', error);
      alert('Failed to load tracker.');
    } finally {
      setLoading(false);
    }
  }, [isEditor, isAdmin, userData?.id, navigate]);

  const loadIncidents = useCallback(async (trackerId: string) => {
    try {
      const fetchedIncidents = await getIncidents(trackerId);
      setIncidents(fetchedIncidents);
    } catch (error) {
      console.error('Error loading incidents:', error);
    }
  }, []);

  // Load tracker and incidents if editing
  useEffect(() => {
    if (isEditing && id) {
      loadTracker(id);
      loadIncidents(id);
    }
  }, [id, isEditing, loadTracker, loadIncidents]);

  // Auto-generate slug when name changes
  useEffect(() => {
    if (trackerData.name && !isEditing) {
      setTrackerData(prev => ({ ...prev, slug: generateSlug(prev.name || '') }));
    }
  }, [trackerData.name, isEditing]);

  // Helper function to remove undefined values from an object recursively
  function removeUndefinedFields(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          result[key] = value.map(item => 
            typeof item === 'object' && item !== null 
              ? removeUndefinedFields(item as Record<string, unknown>)
              : item
          );
        } else if (typeof value === 'object' && value !== null) {
          result[key] = removeUndefinedFields(value as Record<string, unknown>);
        } else {
          result[key] = value;
        }
      }
    }
    return result;
  }

  async function handleSaveTracker(e: React.FormEvent) {
    e.preventDefault();
    if (!trackerData.name?.trim()) {
      alert('Tracker name is required.');
      return;
    }

    setSaving(true);
    try {
      // Clean custom fields to remove undefined values
      const cleanedCustomFields = (trackerData.customFields || []).map(field => {
        const cleanedField = removeUndefinedFields({
          id: field.id || `field_${Date.now()}_${Math.random()}`,
          name: field.name || '',
          type: field.type || 'text',
          required: field.required ?? false,
          placeholder: field.placeholder || '',
          options: Array.isArray(field.options) ? field.options.filter(opt => opt !== undefined && opt !== null && opt !== '') : [],
          maxLength: field.maxLength || undefined,
          order: field.order ?? 0,
        });
        return cleanedField;
      });

      // Clean the tracker data to remove undefined values
      const cleanedTrackerData = removeUndefinedFields({
        ...trackerData,
        name: trackerData.name?.trim() || '',
        description: trackerData.description?.trim() || '',
        slug: trackerData.slug?.trim() || '',
        isActive: trackerData.isActive ?? true,
        createdBy: userData?.id || '',
        incidentCount: trackerData.incidentCount || 0,
        useCustomFields: trackerData.useCustomFields ?? false,
        customFields: cleanedCustomFields,
      });

      if (isEditing && id) {
        await updateTracker(id, cleanedTrackerData);
        alert('Tracker updated successfully!');
      } else {
        const newId = await createTracker(cleanedTrackerData as Omit<Tracker, 'id' | 'createdAt' | 'updatedAt'>);
        alert('Tracker created successfully!');
        navigate(`/dashboard/trackers/${newId}/edit`);
      }
    } catch (error) {
      console.error('Error saving tracker:', error);
      alert('Failed to save tracker.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddIncident() {
    if (!id || !newIncident.city?.trim() || !newIncident.state?.trim() || !newIncident.description?.trim()) {
      alert('City, state, and description are required.');
      return;
    }

    try {
      // Clean the incident data to remove undefined values
      const cleanedIncidentData = removeUndefinedFields({
        ...newIncident,
        dateOfOccurrence: newIncident.dateOfOccurrence || Timestamp.fromDate(new Date()),
        location: `${newIncident.city?.trim() || ''}, ${newIncident.state?.trim() || ''}`,
        city: newIncident.city?.trim() || '',
        state: newIncident.state?.trim() || '',
        description: newIncident.description?.trim() || '',
        bodyCamAvailable: newIncident.bodyCamAvailable ?? false,
        bodyCamVideoId: newIncident.bodyCamVideoId?.trim() || '',
        bodyCamVideoUrl: newIncident.bodyCamVideoUrl?.trim() || '',
        createdBy: userData?.id || '',
        status: newIncident.status || 'active',
        customData: newIncident.customData || {},
      });

      await addIncident(id, cleanedIncidentData as Omit<TrackerIncident, 'id' | 'createdAt'>);
      setNewIncident({
        dateOfOccurrence: Timestamp.fromDate(new Date()),
        location: '',
        city: '',
        state: '',
        description: '',
        bodyCamAvailable: false,
        bodyCamVideoId: '',
        bodyCamVideoUrl: '',
        createdBy: userData?.id || '',
        status: 'active',
      });
      loadIncidents(id);
      // Update tracker incident count
      const tracker = await getTracker(id);
      if (tracker) setTrackerData(tracker);
    } catch (error) {
      console.error('Error adding incident:', error);
      alert('Failed to add incident.');
    }
  }

  // Custom field incident handler
  async function handleAddCustomIncident() {
    if (!id || !trackerData.customFields?.length) return;

    // Validate required fields
    const requiredFields = trackerData.customFields.filter(field => field.required);
    for (const field of requiredFields) {
      if (!customIncidentData[field.id]) {
        alert(`${field.name} is required.`);
        return;
      }
    }

    try {
      const incidentData: Omit<TrackerIncident, 'id' | 'createdAt'> = {
        trackerId: id,
        // Legacy fields (required by interface, but not used in custom mode)
        dateOfOccurrence: Timestamp.fromDate(new Date()),
        location: '',
        description: 'Custom field incident',
        bodyCamAvailable: false,
        createdBy: userData?.id || '',
        status: 'active',
        // Custom data
        customData: customIncidentData,
      };

      // Clean the incident data to remove undefined values
      const cleanedIncidentData = removeUndefinedFields(incidentData);
      await addIncident(id, cleanedIncidentData as Omit<TrackerIncident, 'id' | 'createdAt'>);
      setCustomIncidentData({});
      
      // Refresh incidents and tracker count
      loadIncidents(id);
      const updatedTracker = await getTracker(id);
      if (updatedTracker) {
        setTrackerData(updatedTracker);
      }
    } catch (error) {
      console.error('Error adding custom incident:', error);
      alert('Failed to add incident.');
    }
  }

  async function handleUpdateIncident(incidentId: string, updates: Partial<TrackerIncident>) {
    try {
      // Clean the updates to remove undefined values
      const cleanedUpdates = removeUndefinedFields({ ...updates, updatedBy: userData?.id || '' });
      await updateIncident(incidentId, cleanedUpdates);
      if (id) loadIncidents(id);
    } catch (error) {
      console.error('Error updating incident:', error);
      alert('Failed to update incident.');
    }
  }

  async function handleDeleteIncident(incidentId: string) {
    if (!confirm('Are you sure you want to delete this incident?')) return;
    try {
      await deleteIncident(incidentId);
      if (id) {
        loadIncidents(id);
        // Update tracker incident count
        const tracker = await getTracker(id);
        if (tracker) setTrackerData(tracker);
      }
    } catch (error) {
      console.error('Error deleting incident:', error);
      alert('Failed to delete incident.');
    }
  }

  function handleEditIncident(incidentId: string) {
    setEditingIncident(incidentId);
  }

  function handleCancelEdit() {
    setEditingIncident(null);
  }

  async function handleSaveIncidentEdit(incidentId: string, updatedData: Partial<TrackerIncident>) {
    try {
      await handleUpdateIncident(incidentId, updatedData);
      setEditingIncident(null);
    } catch (error) {
      console.error('Error saving incident edit:', error);
      alert('Failed to save incident changes.');
    }
  }

  // Custom field incident edit handlers
  async function handleCustomIncidentEdit(incidentId: string, customData: Record<string, string | number | boolean | Date>) {
    try {
      await updateIncident(incidentId, { customData, updatedBy: userData?.id });
      loadIncidents(id!);
    } catch (error) {
      console.error('Error updating custom incident:', error);
      alert('Failed to update incident.');
    }
  }

  async function handleCustomIncidentDelete(incidentId: string) {
    try {
      await deleteIncident(incidentId);
      if (id) {
        loadIncidents(id);
        const updatedTracker = await getTracker(id);
        if (updatedTracker) {
          setTrackerData(updatedTracker);
        }
      }
    } catch (error) {
      console.error('Error deleting incident:', error);
      alert('Failed to delete incident.');
    }
  }

  function handleMediaSelect(media: Media) {
    if (mediaPickerFor === 'new') {
      setNewIncident(prev => ({ 
        ...prev, 
        bodyCamVideoId: media.id,
        bodyCamVideoUrl: media.url 
      }));
    } else {
      // Handle editing existing incident
      const incident = incidents.find(i => i.id === mediaPickerFor);
      if (incident) {
        handleUpdateIncident(mediaPickerFor, {
          bodyCamVideoId: media.id,
          bodyCamVideoUrl: media.url
        });
      }
    }
    setShowMediaPicker(false);
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            className="text-gray-600 hover:text-gray-800"
            onClick={() => navigate('/dashboard/trackers')}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Trackers
          </button>
          <h1 className="text-2xl font-bold">
            {isEditing ? `Edit Tracker: ${trackerData.name}` : 'Create New Tracker'}
          </h1>
        </div>

        {/* Tracker Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Tracker Information</h2>
          <form onSubmit={handleSaveTracker} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  value={trackerData.name || ''}
                  onChange={(e) => setTrackerData({ ...trackerData, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={trackerData.slug || ''}
                  onChange={(e) => setTrackerData({ ...trackerData, slug: e.target.value })}
                  className="w-full border rounded px-3 py-2 bg-gray-50"
                  readOnly={!isEditing}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={trackerData.description || ''}
                onChange={(e) => setTrackerData({ ...trackerData, description: e.target.value })}
                className="w-full border rounded px-3 py-2"
                rows={3}
              />
            </div>
            {/* Custom Fields Toggle */}
            <div className="border-t pt-4">
              <label className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  checked={trackerData.useCustomFields || false}
                  onChange={(e) => setTrackerData({ 
                    ...trackerData, 
                    useCustomFields: e.target.checked,
                    customFields: e.target.checked ? (trackerData.customFields || []) : []
                  })}
                />
                <span className="text-sm font-medium">Use Custom Fields</span>
                <span className="text-xs text-gray-500">
                  (Design your own incident form instead of using the standard fields)
                </span>
              </label>

              {trackerData.useCustomFields && (
                <FieldBuilder
                  fields={trackerData.customFields || []}
                  onChange={(fields) => setTrackerData({ ...trackerData, customFields: fields })}
                />
              )}
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={trackerData.isActive || false}
                  onChange={(e) => setTrackerData({ ...trackerData, isActive: e.target.checked })}
                />
                <span className="text-sm">Active</span>
              </label>
              <button
                type="submit"
                disabled={saving}
                className="bg-accent text-white px-6 py-2 rounded hover:bg-opacity-90 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faSave} className="mr-2" />
                {saving ? 'Saving...' : isEditing ? 'Update Tracker' : 'Create Tracker'}
              </button>
            </div>
          </form>
        </div>

        {/* Incidents Section - Only show if editing */}
        {isEditing && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                Incidents ({trackerData.incidentCount || 0})
              </h2>
            </div>

            {/* Conditional Rendering: Custom Fields vs Legacy Form */}
            {trackerData.useCustomFields && trackerData.customFields?.length ? (
              <>
                {/* Custom Fields Form */}
                <div className="border rounded p-4 mb-4 bg-gray-50">
                  <h3 className="font-medium mb-3">Add New Incident</h3>
                  <DynamicForm
                    fields={trackerData.customFields}
                    data={customIncidentData}
                    onChange={setCustomIncidentData}
                    onSubmit={handleAddCustomIncident}
                    submitLabel="Add Incident"
                  />
                </div>

                {/* Custom Fields Table */}
                <DynamicTable
                  fields={trackerData.customFields}
                  incidents={incidents}
                  onEdit={handleCustomIncidentEdit}
                  onDelete={handleCustomIncidentDelete}
                />
              </>
            ) : (
              <>
                {/* Legacy Add New Incident Form */}
                <div className="border rounded p-4 mb-4 bg-gray-50">
                  <h3 className="font-medium mb-3">Add New Incident</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    value={newIncident.dateOfOccurrence?.toDate().toISOString().split('T')[0] || ''}
                    onChange={(e) => setNewIncident({ 
                      ...newIncident, 
                      dateOfOccurrence: Timestamp.fromDate(new Date(e.target.value + 'T12:00:00')) 
                    })}
                    className="w-full border rounded px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input
                    type="text"
                    value={newIncident.city || ''}
                    onChange={(e) => {
                      const city = e.target.value;
                      setNewIncident({ 
                        ...newIncident, 
                        city,
                        location: `${city}${newIncident.state ? `, ${newIncident.state}` : ''}`
                      });
                    }}
                    placeholder="City name"
                    className="w-full border rounded px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State *</label>
                  <select
                    value={newIncident.state || ''}
                    onChange={(e) => {
                      const state = e.target.value;
                      setNewIncident({ 
                        ...newIncident, 
                        state,
                        location: `${newIncident.city || ''}${state ? `, ${state}` : ''}`
                      });
                    }}
                    className="w-full border rounded px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select State</option>
                    {US_STATES.map(state => (
                      <option key={state.abbreviation} value={state.abbreviation}>
                        {state.name} ({state.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Body Cam</label>
                  <select
                    value={newIncident.bodyCamAvailable ? 'yes' : 'no'}
                    onChange={(e) => setNewIncident({ 
                      ...newIncident, 
                      bodyCamAvailable: e.target.value === 'yes' 
                    })}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Video (Optional)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaPickerFor('new');
                      setShowMediaPicker(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2 text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    {newIncident.bodyCamVideoId ? 'Video Selected ✓' : 'Select Video'}
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  value={newIncident.description || ''}
                  onChange={(e) => setNewIncident({ ...newIncident, description: e.target.value })}
                  placeholder="Describe the incident..."
                  className="w-full border rounded px-3 py-2 text-sm"
                  rows={2}
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleAddIncident}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
              >
                <FontAwesomeIcon icon={faPlus} className="mr-2" />
                Add Incident
              </button>
            </div>

            {/* Incidents Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm">Date</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm">Location</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm">Description</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm">Body Cam</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm">Video</th>
                    <th className="border border-gray-300 px-3 py-2 text-left text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.map((incident) => {
                    const isEditing = editingIncident === incident.id;
                    return (
                      <tr key={incident.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          {isEditing ? (
                            <input
                              type="date"
                              defaultValue={incident.dateOfOccurrence?.toDate().toISOString().split('T')[0]}
                              className="w-full border rounded px-2 py-1 text-xs"
                              onBlur={(e) => {
                                if (e.target.value) {
                                  // Create date at noon local time to avoid timezone issues
                                  const selectedDate = new Date(e.target.value + 'T12:00:00');
                                  handleSaveIncidentEdit(incident.id!, {
                                    dateOfOccurrence: Timestamp.fromDate(selectedDate)
                                  });
                                }
                              }}
                            />
                          ) : (
                            incident.dateOfOccurrence?.toDate().toLocaleDateString()
                          )}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          {isEditing ? (
                            <input
                              type="text"
                              defaultValue={incident.location}
                              className="w-full border rounded px-2 py-1 text-xs"
                              onBlur={(e) => {
                                if (e.target.value !== incident.location) {
                                  handleSaveIncidentEdit(incident.id!, { location: e.target.value });
                                }
                              }}
                            />
                          ) : (
                            incident.location
                          )}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">
                          {isEditing ? (
                            <textarea
                              defaultValue={incident.description}
                              className="w-full border rounded px-2 py-1 text-xs"
                              rows={2}
                              onBlur={(e) => {
                                if (e.target.value !== incident.description) {
                                  handleSaveIncidentEdit(incident.id!, { description: e.target.value });
                                }
                              }}
                            />
                          ) : (
                            <div className="max-w-xs truncate" title={incident.description}>
                              {incident.description}
                            </div>
                          )}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-center">
                          {isEditing ? (
                            <input
                              type="checkbox"
                              defaultChecked={incident.bodyCamAvailable}
                              onChange={(e) => {
                                handleSaveIncidentEdit(incident.id!, { bodyCamAvailable: e.target.checked });
                              }}
                            />
                          ) : (
                            <FontAwesomeIcon 
                              icon={incident.bodyCamAvailable ? faCheck : faTimes} 
                              className={incident.bodyCamAvailable ? 'text-green-600' : 'text-red-600'} 
                            />
                          )}
                        </td>
                        <td className="border border-gray-300 px-3 py-2 text-sm text-center">
                          {incident.bodyCamVideoId ? (
                            <div className="flex items-center justify-center gap-2">
                              <FontAwesomeIcon icon={faVideo} className="text-blue-600" title="Video available" />
                              {isEditing && (
                                <button
                                  onClick={() => {
                                    handleSaveIncidentEdit(incident.id!, { 
                                      bodyCamVideoId: '', 
                                      bodyCamVideoUrl: '' 
                                    });
                                  }}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                  title="Remove video"
                                >
                                  <FontAwesomeIcon icon={faTimes} />
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setMediaPickerFor(incident.id!);
                                setShowMediaPicker(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors"
                              title="Add video"
                            >
                              <FontAwesomeIcon icon={faPlus} />
                              <FontAwesomeIcon icon={faVideo} />
                            </button>
                          )}
                        </td>
                        <td className="border border-gray-300 px-3 py-2">
                          <div className="flex gap-2">
                            {isEditing ? (
                              <button
                                className="text-green-600 hover:text-green-800"
                                onClick={handleCancelEdit}
                                title="Finish editing"
                              >
                                <FontAwesomeIcon icon={faCheck} />
                              </button>
                            ) : (
                              <button
                                className="text-blue-600 hover:text-blue-800"
                                onClick={() => handleEditIncident(incident.id!)}
                                title="Edit incident"
                              >
                                <FontAwesomeIcon icon={faEdit} />
                              </button>
                            )}
                            <button
                              className="text-red-600 hover:text-red-800"
                              onClick={() => handleDeleteIncident(incident.id!)}
                              title="Delete incident"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
              </>
            )}
          </div>
        )}

        {/* Media Picker Modal */}
        <MediaPicker
          isOpen={showMediaPicker}
          onSelect={handleMediaSelect}
          onClose={() => setShowMediaPicker(false)}
          filterType="video"
        />
      </div>
    </DashboardLayout>
  );
}