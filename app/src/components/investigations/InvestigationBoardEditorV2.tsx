import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent, ChangeEvent } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave,
  faEye,
  faEdit,
  faTrash,
  faExpand,
  faUndo,
  faRedo,
  faSearch,
  faUser,
  faMapMarkerAlt,
  faCalendar,
  faTimes,
  faCheck,
  faImage,
  faFilePdf,
  faPhone,
  faPlane,
  faDollarSign,
  faGavel,
  faNewspaper,
  faEllipsisH,
  faUsers,
  faLink,
  faCloudUploadAlt,
  faSpinner,
  faFileAlt,
  faExternalLinkAlt,
} from '@fortawesome/free-solid-svg-icons';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import MediaPicker from '../MediaPicker';
import type { Media } from '../../types/models';
import type {
  EvidenceItem,
  EvidenceItemType,
  InvestigationPerson,
  InvestigationLocation,
  TimelineEvent,
  TimelineEventType,
  InvestigationsBoardPayload,
  BoardConnection,
} from '../../types/investigations';
import { uploadMediaFile } from '../../services/mediaService';

const BOARD_DOC_ID = 'epstein-files';

// ============================================
// Color schemes for different entity types
// ============================================
const entityColors = {
  person: { bg: 'bg-sky-50', border: 'border-sky-300', text: 'text-sky-700', accent: 'bg-sky-500' },
  location: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', accent: 'bg-emerald-500' },
  event: { bg: 'bg-violet-50', border: 'border-violet-300', text: 'text-violet-700', accent: 'bg-violet-500' },
};

const eventTypeConfig: Record<TimelineEventType, { icon: typeof faPhone; label: string; color: string }> = {
  communication: { icon: faPhone, label: 'Communication', color: 'text-blue-600' },
  meeting: { icon: faUsers, label: 'Meeting', color: 'text-purple-600' },
  travel: { icon: faPlane, label: 'Travel', color: 'text-orange-600' },
  transaction: { icon: faDollarSign, label: 'Transaction', color: 'text-green-600' },
  legal: { icon: faGavel, label: 'Legal', color: 'text-red-600' },
  media: { icon: faNewspaper, label: 'Media', color: 'text-cyan-600' },
  other: { icon: faEllipsisH, label: 'Other', color: 'text-gray-600' },
};

// ============================================
// History State
// ============================================
interface HistoryState {
  people: InvestigationPerson[];
  locations: InvestigationLocation[];
  events: TimelineEvent[];
}

interface Props {
  readOnly?: boolean;
}

// ============================================
// Main Component
// ============================================
export default function InvestigationBoardEditorV2({ readOnly = false }: Props) {
  const { isEditor, isSuperUser, userData } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Board state
  const [loading, setLoading] = useState(true);
  const [boardTitle, setBoardTitle] = useState('Investigation Board');
  const [boardDescription, setBoardDescription] = useState('');
  const [people, setPeople] = useState<InvestigationPerson[]>([]);
  const [locations, setLocations] = useState<InvestigationLocation[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isActive, setIsActive] = useState(true);

  // UI state
  const [editMode, setEditMode] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'people' | 'locations' | 'events'>('all');

  // Selection state
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'person' | 'location' | 'event';
    id: string;
  } | null>(null);

  // Drag state
  const [draggingEntity, setDraggingEntity] = useState<{
    type: 'person' | 'location' | 'event';
    id: string;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Panel state
  const [activePanel, setActivePanel] = useState<'none' | 'people' | 'locations' | 'events' | 'settings'>('none');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'person' | 'location'>('person');
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // ============================================
  // Form States
  // ============================================
  const [personForm, setPersonForm] = useState<InvestigationPerson>({
    id: '',
    name: '',
    title: '',
    bio: '',
    imageUrl: '',
  });
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);

  const [locationForm, setLocationForm] = useState<InvestigationLocation>({
    id: '',
    name: '',
    address: '',
    city: '',
    state: '',
    country: '',
    imageUrl: '',
  });
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);

  const [eventForm, setEventForm] = useState<TimelineEvent>({
    id: '',
    title: '',
    eventType: 'meeting',
    date: '',
    time: '',
    description: '',
    peopleIds: [],
    locationIds: [],
    documents: [],
    x: 400,
    y: 300,
  });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Evidence form for events
  const [evidenceForm, setEvidenceForm] = useState<EvidenceItem>({
    label: '',
    url: '',
    type: 'link',
  });

  const canEdit = !readOnly && (isEditor() || isSuperUser());

  // ============================================
  // Load Board Data
  // ============================================
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'investigations', BOARD_DOC_ID));
        if (snapshot.exists()) {
          const data = snapshot.data() as InvestigationsBoardPayload;
          setBoardTitle(data.title || 'Investigation Board');
          setBoardDescription(data.description || '');
          setPeople(data.people || []);
          setLocations(data.locations || []);
          setEvents(data.events || []);
          setIsActive(data.isActive ?? true);
        }
      } catch (error) {
        console.error('Failed to load board:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBoard();
  }, []);

  // ============================================
  // Save Board
  // ============================================
  const saveBoard = useCallback(async () => {
    if (!canEdit) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const payload: InvestigationsBoardPayload = {
        title: boardTitle,
        description: boardDescription,
        people,
        locations,
        events,
        documents: [],
        isActive,
        updatedAt: serverTimestamp(),
        updatedBy: userData?.email || 'unknown',
      };
      await setDoc(doc(db, 'investigations', BOARD_DOC_ID), payload);
      setSaveMessage('Saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveMessage('Save failed!');
    } finally {
      setSaving(false);
    }
  }, [canEdit, boardTitle, boardDescription, people, locations, events, isActive, userData]);

  // ============================================
  // History Management
  // ============================================
  const pushHistory = useCallback(() => {
    const newState: HistoryState = {
      people: JSON.parse(JSON.stringify(people)),
      locations: JSON.parse(JSON.stringify(locations)),
      events: JSON.parse(JSON.stringify(events)),
    };
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), newState]);
    setHistoryIndex((prev) => prev + 1);
  }, [people, locations, events, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setPeople(prevState.people);
      setLocations(prevState.locations);
      setEvents(prevState.events);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setPeople(nextState.people);
      setLocations(nextState.locations);
      setEvents(nextState.events);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [history, historyIndex]);

  // ============================================
  // Auto-generate Connections
  // ============================================
  const connections = useMemo<BoardConnection[]>(() => {
    const conns: BoardConnection[] = [];
    
    events.forEach((event) => {
      // Connect event to each tagged person
      event.peopleIds.forEach((personId) => {
        conns.push({
          id: `${event.id}-person-${personId}`,
          fromType: 'event',
          fromId: event.id,
          toType: 'person',
          toId: personId,
          label: eventTypeConfig[event.eventType].label,
          eventId: event.id,
        });
      });
      
      // Connect event to each tagged location
      event.locationIds.forEach((locationId) => {
        conns.push({
          id: `${event.id}-location-${locationId}`,
          fromType: 'event',
          fromId: event.id,
          toType: 'location',
          toId: locationId,
          label: 'at',
          eventId: event.id,
        });
      });
    });
    
    return conns;
  }, [events]);

  // Canvas bounds for connection lines
  const canvasSize = useMemo(() => {
    const minWidth = 3000;
    const minHeight = 2000;
    const padding = 400;
    const points = [...people, ...locations, ...events].map((item) => ({
      x: (item.x ?? 100) + 120,
      y: (item.y ?? 100) + 100,
    }));

    if (points.length === 0) {
      return { width: minWidth, height: minHeight };
    }

    const maxX = Math.max(...points.map((p) => p.x));
    const maxY = Math.max(...points.map((p) => p.y));

    return {
      width: Math.max(minWidth, maxX + padding),
      height: Math.max(minHeight, maxY + padding),
    };
  }, [people, locations, events]);

  // ============================================
  // Zoom Controls
  // ============================================
  const zoomIn = () => setScale((s) => Math.min(2, s * 1.15));
  const zoomOut = () => setScale((s) => Math.max(0.4, s / 1.15));
  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  // ============================================
  // Wheel Zoom
  // ============================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const wheelListener = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY;
      const zoomFactor = delta > 0 ? 1.08 : 0.92;
      setScale((current) => Math.min(2, Math.max(0.4, current * zoomFactor)));
    };

    container.addEventListener('wheel', wheelListener, { passive: false });
    return () => container.removeEventListener('wheel', wheelListener);
  }, []);

  // ============================================
  // Pan Handlers
  // ============================================
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || draggingEntity) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isPanning && !draggingEntity) {
      setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
    
    if (draggingEntity && editMode) {
      const bounds = canvasRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const x = (e.clientX - bounds.left - dragOffset.x) / scale;
      const y = (e.clientY - bounds.top - dragOffset.y) / scale;
      
      if (draggingEntity.type === 'person') {
        setPeople((prev) => prev.map((p) => 
          p.id === draggingEntity.id ? { ...p, x, y } : p
        ));
      } else if (draggingEntity.type === 'location') {
        setLocations((prev) => prev.map((l) => 
          l.id === draggingEntity.id ? { ...l, x, y } : l
        ));
      } else if (draggingEntity.type === 'event') {
        setEvents((prev) => prev.map((ev) => 
          ev.id === draggingEntity.id ? { ...ev, x, y } : ev
        ));
      }
    }
  };

  const handleMouseUp = () => {
    if (draggingEntity) {
      pushHistory();
    }
    setIsPanning(false);
    setDraggingEntity(null);
  };

  // ============================================
  // Entity Mouse Handlers
  // ============================================
  const handleEntityMouseDown = (
    e: MouseEvent<HTMLButtonElement>,
    type: 'person' | 'location' | 'event',
    id: string
  ) => {
    if (!editMode) return;
    e.stopPropagation();
    
    const bounds = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - bounds.left,
      y: e.clientY - bounds.top,
    });
    setDraggingEntity({ type, id });
  };

  const handleEntityClick = (
    type: 'person' | 'location' | 'event',
    id: string
  ) => {
    if (draggingEntity) return;
    setSelectedEntity({ type, id });
  };

  // ============================================
  // Get Entity Position
  // ============================================
  const getEntityPosition = (type: 'person' | 'location' | 'event', id: string) => {
    if (type === 'person') {
      const person = people.find((p) => p.id === id);
      return { x: person?.x ?? 100, y: person?.y ?? 100 };
    }
    if (type === 'location') {
      const location = locations.find((l) => l.id === id);
      return { x: location?.x ?? 200, y: location?.y ?? 200 };
    }
    const event = events.find((ev) => ev.id === id);
    return { x: event?.x ?? 300, y: event?.y ?? 300 };
  };

  // ============================================
  // CRUD Operations - People
  // ============================================
  const resetPersonForm = () => {
    setPersonForm({ id: '', name: '', title: '', bio: '', imageUrl: '' });
    setEditingPersonId(null);
  };

  const savePerson = () => {
    if (!personForm.name.trim()) return;
    
    pushHistory();
    
    if (editingPersonId) {
      setPeople((prev) => prev.map((p) => 
        p.id === editingPersonId ? { ...p, ...personForm } : p
      ));
    } else {
      const newPerson: InvestigationPerson = {
        ...personForm,
        id: `person-${Date.now()}`,
        x: 100 + Math.random() * 300,
        y: 100 + Math.random() * 200,
        createdBy: userData?.email,
      };
      setPeople((prev) => [...prev, newPerson]);
    }
    
    resetPersonForm();
  };

  const editPerson = (id: string) => {
    const person = people.find((p) => p.id === id);
    if (person) {
      setPersonForm(person);
      setEditingPersonId(id);
      setActivePanel('people');
    }
  };

  const deletePerson = (id: string) => {
    if (!confirm('Delete this person? They will be removed from all events.')) return;
    pushHistory();
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setEvents((prev) => prev.map((ev) => ({
      ...ev,
      peopleIds: ev.peopleIds.filter((pid) => pid !== id),
    })));
    if (selectedEntity?.type === 'person' && selectedEntity.id === id) {
      setSelectedEntity(null);
    }
  };

  // ============================================
  // CRUD Operations - Locations
  // ============================================
  const resetLocationForm = () => {
    setLocationForm({ id: '', name: '', address: '', city: '', state: '', country: '', imageUrl: '' });
    setEditingLocationId(null);
  };

  const saveLocation = () => {
    if (!locationForm.name.trim()) return;
    
    pushHistory();
    
    if (editingLocationId) {
      setLocations((prev) => prev.map((l) => 
        l.id === editingLocationId ? { ...l, ...locationForm } : l
      ));
    } else {
      const newLocation: InvestigationLocation = {
        ...locationForm,
        id: `location-${Date.now()}`,
        x: 200 + Math.random() * 300,
        y: 150 + Math.random() * 200,
        createdBy: userData?.email,
      };
      setLocations((prev) => [...prev, newLocation]);
    }
    
    resetLocationForm();
  };

  const editLocation = (id: string) => {
    const location = locations.find((l) => l.id === id);
    if (location) {
      setLocationForm(location);
      setEditingLocationId(id);
      setActivePanel('locations');
    }
  };

  const deleteLocation = (id: string) => {
    if (!confirm('Delete this location? It will be removed from all events.')) return;
    pushHistory();
    setLocations((prev) => prev.filter((l) => l.id !== id));
    setEvents((prev) => prev.map((ev) => ({
      ...ev,
      locationIds: ev.locationIds.filter((lid) => lid !== id),
    })));
    if (selectedEntity?.type === 'location' && selectedEntity.id === id) {
      setSelectedEntity(null);
    }
  };

  // ============================================
  // CRUD Operations - Events
  // ============================================
  const resetEventForm = () => {
    setEventForm({
      id: '',
      title: '',
      eventType: 'meeting',
      date: '',
      time: '',
      description: '',
      peopleIds: [],
      locationIds: [],
      documents: [],
      x: 400,
      y: 300,
    });
    setEditingEventId(null);
    setEvidenceForm({ label: '', url: '', type: 'link' });
  };

  const saveEvent = () => {
    if (!eventForm.title.trim() || !eventForm.date) return;
    
    pushHistory();
    
    if (editingEventId) {
      setEvents((prev) => prev.map((ev) => 
        ev.id === editingEventId ? { ...ev, ...eventForm } : ev
      ));
    } else {
      const newEvent: TimelineEvent = {
        ...eventForm,
        id: `event-${Date.now()}`,
        x: 300 + Math.random() * 300,
        y: 200 + Math.random() * 200,
        createdBy: userData?.email,
      };
      setEvents((prev) => [...prev, newEvent]);
    }
    
    resetEventForm();
  };

  const editEvent = (id: string) => {
    const event = events.find((ev) => ev.id === id);
    if (event) {
      setEventForm(event);
      setEditingEventId(id);
      setActivePanel('events');
    }
  };

  const deleteEvent = (id: string) => {
    if (!confirm('Delete this event?')) return;
    pushHistory();
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
    if (selectedEntity?.type === 'event' && selectedEntity.id === id) {
      setSelectedEntity(null);
    }
  };

  // Add evidence to event form
  const addEvidenceToEvent = () => {
    if (!evidenceForm.label.trim() || !evidenceForm.url.trim()) return;
    setEventForm((f) => ({
      ...f,
      documents: [...f.documents, { ...evidenceForm }],
    }));
    setEvidenceForm({ label: '', url: '', type: 'link' });
  };

  const removeEvidenceFromEvent = (index: number) => {
    setEventForm((f) => ({
      ...f,
      documents: f.documents.filter((_, i) => i !== index),
    }));
  };

  // ============================================
  // Media Picker Handler
  // ============================================
  const handleMediaSelect = (media: Media) => {
    if (mediaPickerTarget === 'person') {
      setPersonForm((f) => ({ ...f, imageUrl: media.url }));
    } else if (mediaPickerTarget === 'location') {
      setLocationForm((f) => ({ ...f, imageUrl: media.url }));
    }
    setShowMediaPicker(false);
  };

  // ============================================
  // Direct Image Upload Handler
  // ============================================
  const handleImageUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    target: 'person' | 'location'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setUploadingImage(true);
    setUploadProgress('Uploading image...');

    try {
      // uploadMediaFile returns just the URL string
      const folder = target === 'person' ? 'investigations/people' : 'investigations/locations';
      const url = await uploadMediaFile(file, folder);

      if (target === 'person') {
        setPersonForm((f) => ({ ...f, imageUrl: url }));
      } else {
        setLocationForm((f) => ({ ...f, imageUrl: url }));
      }
      setUploadProgress('Upload complete!');
      setTimeout(() => setUploadProgress(null), 2000);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress('Upload failed. Please try again.');
      setTimeout(() => setUploadProgress(null), 3000);
    } finally {
      setUploadingImage(false);
    }

    // Reset input
    e.target.value = '';
  };

  // ============================================
  // Document Upload Handler
  // ============================================
  const handleDocumentUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a PDF or image file');
      return;
    }

    setUploadingDocument(true);
    setUploadProgress('Uploading document...');

    try {
      // uploadMediaFile returns just the URL string
      const folder = file.type === 'application/pdf' ? 'investigations/documents' : 'investigations/evidence';
      const url = await uploadMediaFile(file, folder);

      // Determine type based on file
      const evidenceType: EvidenceItemType = file.type === 'application/pdf' ? 'pdf' : 'image';
      
      // Add to event form documents
      setEventForm((f) => ({
        ...f,
        documents: [
          ...f.documents,
          {
            label: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for label
            url: url,
            type: evidenceType,
          },
        ],
      }));

      setUploadProgress('Document uploaded!');
      setTimeout(() => setUploadProgress(null), 2000);
      setShowDocumentUploadModal(false);
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress('Upload failed. Please try again.');
      setTimeout(() => setUploadProgress(null), 3000);
    } finally {
      setUploadingDocument(false);
    }

    // Reset input
    e.target.value = '';
  };

  // ============================================
  // Keyboard Shortcuts
  // ============================================
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey && editMode) {
        e.preventDefault();
        undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey && editMode) {
        e.preventDefault();
        redo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && editMode) {
        e.preventDefault();
        saveBoard();
      }
      if (e.key === 'Escape') {
        setSelectedEntity(null);
        setActivePanel('none');
        setShowDocumentUploadModal(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editMode, undo, redo, saveBoard]);

  // ============================================
  // Selected Entity Details
  // ============================================
  const selectedPerson = selectedEntity?.type === 'person' 
    ? people.find((p) => p.id === selectedEntity.id) 
    : null;
  const selectedLocation = selectedEntity?.type === 'location'
    ? locations.find((l) => l.id === selectedEntity.id)
    : null;
  const selectedEvent = selectedEntity?.type === 'event'
    ? events.find((ev) => ev.id === selectedEntity.id)
    : null;

  // Events related to selected person/location
  const relatedEvents = useMemo(() => {
    if (selectedEntity?.type === 'person') {
      return events.filter((ev) => ev.peopleIds.includes(selectedEntity.id));
    }
    if (selectedEntity?.type === 'location') {
      return events.filter((ev) => ev.locationIds.includes(selectedEntity.id));
    }
    return [];
  }, [events, selectedEntity]);

  // ============================================
  // Loading State
  // ============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-inkMuted">Loading investigation board...</div>
      </div>
    );
  }

  if (!isActive && !canEdit) {
    return (
      <div className="max-w-2xl mx-auto bg-white border border-stone/30 rounded-2xl p-8 text-center">
        <h1 className="text-3xl font-bold text-ink">Investigation Unavailable</h1>
        <p className="text-inkMuted mt-3">
          This investigation is temporarily offline while updates are in progress.
        </p>
      </div>
    );
  }

  // ============================================
  // Render
  // ============================================
  return (
    <div className="relative h-full w-full">
      {/* Header */}
      <div className="bg-white border-b border-stone/20 px-4 sm:px-6 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            {editMode ? (
              <input
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                className="text-xl font-bold text-ink bg-transparent border-b border-transparent hover:border-stone/30 focus:border-accent focus:outline-none w-full"
              />
            ) : (
              <h1 className="text-xl font-bold text-ink truncate">{boardTitle}</h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className={`px-4 py-2 text-sm rounded-full flex items-center gap-2 transition-all ${
                    editMode
                      ? 'bg-ink text-white'
                      : 'border border-stone/40 text-ink hover:bg-stone/10'
                  }`}
                >
                  <FontAwesomeIcon icon={editMode ? faEye : faEdit} className="text-xs" />
                  {editMode ? 'Preview' : 'Edit'}
                </button>
                {editMode && (
                  <button
                    onClick={saveBoard}
                    disabled={saving}
                    className="px-4 py-2 text-sm rounded-full bg-accent text-white flex items-center gap-2 disabled:opacity-60"
                  >
                    <FontAwesomeIcon icon={faSave} className="text-xs" />
                    {saving ? 'Saving…' : 'Publish'}
                  </button>
                )}
              </>
            )}
            {saveMessage && (
              <span className={`text-xs ${saveMessage.includes('failed') ? 'text-red-600' : 'text-emerald-600'}`}>
                {saveMessage}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-180px)] sm:h-[calc(100vh-160px)] lg:h-[calc(100vh-140px)]">
        {/* Canvas area */}
        <div className="flex-1 flex flex-col min-h-[60vh] lg:min-h-0">
          {/* Toolbar */}
          <div className="bg-stone/5 border-b border-stone/20 px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Search */}
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-inkMuted text-xs" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-stone/30 focus:outline-none focus:ring-2 focus:ring-accent/40 w-full sm:w-48"
              />
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="px-3 py-2 text-sm rounded-lg border border-stone/30 bg-white w-full sm:w-auto"
            >
              <option value="all">All</option>
              <option value="people">People</option>
              <option value="locations">Locations</option>
              <option value="events">Events</option>
            </select>

            {/* Zoom */}
            <div className="flex items-center gap-1 border-l border-stone/30 pl-3">
              <button onClick={zoomOut} className="p-2 hover:bg-white rounded" title="Zoom out">−</button>
              <span className="text-xs text-inkMuted w-12 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={zoomIn} className="p-2 hover:bg-white rounded" title="Zoom in">+</button>
              <button onClick={resetView} className="p-2 hover:bg-white rounded text-xs" title="Reset view">
                <FontAwesomeIcon icon={faExpand} />
              </button>
            </div>

            {/* Undo/Redo */}
            {editMode && (
              <div className="flex items-center gap-2 border-l border-stone/30 pl-3">
                <button
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="p-2 hover:bg-white rounded disabled:opacity-30"
                  title="Undo (Ctrl+Z)"
                >
                  <FontAwesomeIcon icon={faUndo} className="text-xs" />
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-2 hover:bg-white rounded disabled:opacity-30"
                  title="Redo (Ctrl+Shift+Z)"
                >
                  <FontAwesomeIcon icon={faRedo} className="text-xs" />
                </button>
              </div>
            )}

            {/* Add buttons */}
            {editMode && (
              <div className="flex items-center gap-2 border-l border-stone/30 pl-3 ml-auto">
                <button
                  onClick={() => { setActivePanel('people'); resetPersonForm(); }}
                  className={`px-3 py-2 text-sm rounded-lg flex items-center gap-2 ${
                    activePanel === 'people' 
                      ? 'bg-sky-500 text-white' 
                      : 'border border-stone/30 hover:bg-white'
                  }`}
                >
                  <FontAwesomeIcon icon={faUser} className="text-xs" />
                  People ({people.length})
                </button>
                <button
                  onClick={() => { setActivePanel('locations'); resetLocationForm(); }}
                  className={`px-3 py-2 text-sm rounded-lg flex items-center gap-2 ${
                    activePanel === 'locations'
                      ? 'bg-emerald-500 text-white'
                      : 'border border-stone/30 hover:bg-white'
                  }`}
                >
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" />
                  Locations ({locations.length})
                </button>
                <button
                  onClick={() => { setActivePanel('events'); resetEventForm(); }}
                  className={`px-3 py-2 text-sm rounded-lg flex items-center gap-2 ${
                    activePanel === 'events'
                      ? 'bg-violet-500 text-white'
                      : 'border border-stone/30 hover:bg-white'
                  }`}
                >
                  <FontAwesomeIcon icon={faCalendar} className="text-xs" />
                  Events ({events.length})
                </button>
              </div>
            )}
          </div>

          {/* Canvas */}
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="flex-1 bg-stone/5 overflow-hidden cursor-grab relative"
            style={{ cursor: isPanning ? 'grabbing' : draggingEntity ? 'move' : 'grab' }}
          >
            <div
              ref={canvasRef}
              className="absolute inset-0"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: '0 0',
              }}
            >
              {/* Connection lines */}
              <svg
                className="absolute inset-0 pointer-events-none"
                width={canvasSize.width}
                height={canvasSize.height}
                viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
              >
                {connections.map((conn) => {
                  const fromPos = getEntityPosition(conn.fromType, conn.fromId);
                  const toPos = getEntityPosition(conn.toType, conn.toId);

                  const x1 = fromPos.x + 60;
                  const y1 = fromPos.y + 40;
                  const x2 = toPos.x + 60;
                  const y2 = toPos.y + 40;
                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  const dist = Math.hypot(dx, dy) || 1;
                  const nx = -dy / dist;
                  const ny = dx / dist;
                  const bend = Math.min(160, Math.max(0, dist * 0.2));
                  const cx = x1 + dx * 0.5 + nx * bend;
                  const cy = y1 + dy * 0.5 + ny * bend;
                  const pathD = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
                  
                  const isHighlighted = 
                    (selectedEntity?.type === conn.fromType && selectedEntity.id === conn.fromId) ||
                    (selectedEntity?.type === conn.toType && selectedEntity.id === conn.toId);
                  
                  return (
                    <g key={conn.id}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={isHighlighted ? '#8b5cf6' : '#d1d5db'}
                        strokeWidth={isHighlighted ? 2 : 1}
                        strokeDasharray={conn.toType === 'location' ? '4,4' : undefined}
                      />
                    </g>
                  );
                })}
              </svg>

              {/* People nodes */}
              {(filterType === 'all' || filterType === 'people') && people.map((person) => (
                <button
                  key={person.id}
                  onMouseDown={(e) => handleEntityMouseDown(e, 'person', person.id)}
                  onClick={() => handleEntityClick('person', person.id)}
                  className={`absolute w-[96px] sm:w-[120px] rounded-xl border-2 p-2 sm:p-3 text-left transition-all ${
                    entityColors.person.bg
                  } ${
                    selectedEntity?.type === 'person' && selectedEntity.id === person.id
                      ? 'border-sky-500 ring-2 ring-sky-500/30'
                      : entityColors.person.border
                  } hover:shadow-lg`}
                  style={{
                    left: person.x ?? 100,
                    top: person.y ?? 100,
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    {person.imageUrl ? (
                      <img
                        src={person.imageUrl}
                        alt={person.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover mb-2"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-sky-200 flex items-center justify-center mb-2">
                        <FontAwesomeIcon icon={faUser} className="text-sky-600" />
                      </div>
                    )}
                    <span className="font-medium text-xs sm:text-sm text-ink leading-tight line-clamp-2">
                      {person.name}
                    </span>
                    {person.title && (
                      <span className="text-[9px] sm:text-[10px] text-inkMuted mt-1 line-clamp-1">
                        {person.title}
                      </span>
                    )}
                  </div>
                </button>
              ))}

              {/* Location nodes */}
              {(filterType === 'all' || filterType === 'locations') && locations.map((location) => (
                <button
                  key={location.id}
                  onMouseDown={(e) => handleEntityMouseDown(e, 'location', location.id)}
                  onClick={() => handleEntityClick('location', location.id)}
                  className={`absolute w-[96px] sm:w-[120px] rounded-xl border-2 p-2 sm:p-3 text-left transition-all ${
                    entityColors.location.bg
                  } ${
                    selectedEntity?.type === 'location' && selectedEntity.id === location.id
                      ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                      : entityColors.location.border
                  } hover:shadow-lg`}
                  style={{
                    left: location.x ?? 200,
                    top: location.y ?? 200,
                  }}
                >
                  <div className="flex flex-col items-center text-center">
                    {location.imageUrl ? (
                      <img
                        src={location.imageUrl}
                        alt={location.name}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover mb-2"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-emerald-200 flex items-center justify-center mb-2">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-emerald-600" />
                      </div>
                    )}
                    <span className="font-medium text-xs sm:text-sm text-ink leading-tight line-clamp-2">
                      {location.name}
                    </span>
                    {location.city && (
                      <span className="text-[9px] sm:text-[10px] text-inkMuted mt-1 line-clamp-1">
                        {location.city}{location.state ? `, ${location.state}` : ''}
                      </span>
                    )}
                  </div>
                </button>
              ))}

              {/* Event nodes */}
              {(filterType === 'all' || filterType === 'events') && events.map((event) => {
                const config = eventTypeConfig[event.eventType];
                return (
                  <button
                    key={event.id}
                    onMouseDown={(e) => handleEntityMouseDown(e, 'event', event.id)}
                    onClick={() => handleEntityClick('event', event.id)}
                    className={`absolute w-[140px] sm:w-[160px] rounded-xl border-2 p-2 sm:p-3 text-left transition-all ${
                      entityColors.event.bg
                    } ${
                      selectedEntity?.type === 'event' && selectedEntity.id === event.id
                        ? 'border-violet-500 ring-2 ring-violet-500/30'
                        : entityColors.event.border
                    } hover:shadow-lg`}
                    style={{
                      left: event.x,
                      top: event.y,
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-violet-200 flex items-center justify-center flex-shrink-0 ${config.color}`}>
                        <FontAwesomeIcon icon={config.icon} className="text-sm" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-xs sm:text-sm text-ink leading-tight line-clamp-2 block">
                          {event.title}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-inkMuted mt-1 block">
                          {event.date}
                        </span>
                        {event.peopleIds.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <FontAwesomeIcon icon={faUser} className="text-[8px] text-sky-500" />
                            <span className="text-[9px] text-inkMuted">{event.peopleIds.length}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-stone/20 overflow-y-auto">
          {/* Stats */}
          <div className="p-4 border-b border-stone/20">
            <h2 className="text-xs font-semibold text-inkMuted uppercase tracking-wide mb-3">Overview</h2>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div className="p-2 rounded-lg bg-sky-50">
                <span className="block text-xl font-bold text-sky-600">{people.length}</span>
                <span className="text-[10px] text-inkMuted">People</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50">
                <span className="block text-xl font-bold text-emerald-600">{locations.length}</span>
                <span className="text-[10px] text-inkMuted">Locations</span>
              </div>
              <div className="p-2 rounded-lg bg-violet-50">
                <span className="block text-xl font-bold text-violet-600">{events.length}</span>
                <span className="text-[10px] text-inkMuted">Events</span>
              </div>
            </div>
          </div>

          {/* Selected Entity Details */}
          {selectedPerson && (
            <div className="p-4 border-b border-stone/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-ink text-sm">Person Details</h3>
                {editMode && (
                  <div className="flex gap-2">
                    <button onClick={() => editPerson(selectedPerson.id)} className="text-xs text-accent hover:underline">
                      Edit
                    </button>
                    <button onClick={() => deletePerson(selectedPerson.id)} className="text-xs text-red-600 hover:underline">
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-start gap-3">
                {selectedPerson.imageUrl ? (
                  <img src={selectedPerson.imageUrl} alt={selectedPerson.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center">
                    <FontAwesomeIcon icon={faUser} className="text-sky-500 text-xl" />
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-ink">{selectedPerson.name}</h4>
                  {selectedPerson.title && <p className="text-sm text-inkMuted">{selectedPerson.title}</p>}
                </div>
              </div>
              {selectedPerson.bio && (
                <p className="text-sm text-inkMuted mt-3">{selectedPerson.bio}</p>
              )}
              {relatedEvents.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-xs font-medium text-inkMuted uppercase mb-2">Related Events ({relatedEvents.length})</h5>
                  <div className="space-y-2">
                    {relatedEvents.slice(0, 5).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEntity({ type: 'event', id: ev.id })}
                        className="w-full text-left p-2 rounded bg-violet-50 hover:bg-violet-100 text-sm transition-colors"
                      >
                        <span className="font-medium text-ink">{ev.title}</span>
                        <span className="block text-[10px] text-inkMuted">{ev.date}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedLocation && (
            <div className="p-4 border-b border-stone/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-ink text-sm">Location Details</h3>
                {editMode && (
                  <div className="flex gap-2">
                    <button onClick={() => editLocation(selectedLocation.id)} className="text-xs text-accent hover:underline">
                      Edit
                    </button>
                    <button onClick={() => deleteLocation(selectedLocation.id)} className="text-xs text-red-600 hover:underline">
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-start gap-3">
                {selectedLocation.imageUrl ? (
                  <img src={selectedLocation.imageUrl} alt={selectedLocation.name} className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-emerald-500 text-xl" />
                  </div>
                )}
                <div>
                  <h4 className="font-medium text-ink">{selectedLocation.name}</h4>
                  <p className="text-sm text-inkMuted">{selectedLocation.address}</p>
                  {selectedLocation.city && (
                    <p className="text-sm text-inkMuted">
                      {selectedLocation.city}{selectedLocation.state ? `, ${selectedLocation.state}` : ''}
                      {selectedLocation.country ? `, ${selectedLocation.country}` : ''}
                    </p>
                  )}
                </div>
              </div>
              {relatedEvents.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-xs font-medium text-inkMuted uppercase mb-2">Events at this Location ({relatedEvents.length})</h5>
                  <div className="space-y-2">
                    {relatedEvents.slice(0, 5).map((ev) => (
                      <button
                        key={ev.id}
                        onClick={() => setSelectedEntity({ type: 'event', id: ev.id })}
                        className="w-full text-left p-2 rounded bg-violet-50 hover:bg-violet-100 text-sm transition-colors"
                      >
                        <span className="font-medium text-ink">{ev.title}</span>
                        <span className="block text-[10px] text-inkMuted">{ev.date}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedEvent && (
            <div className="p-4 border-b border-stone/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-ink text-sm">Event Details</h3>
                {editMode && (
                  <div className="flex gap-2">
                    <button onClick={() => editEvent(selectedEvent.id)} className="text-xs text-accent hover:underline">
                      Edit
                    </button>
                    <button onClick={() => deleteEvent(selectedEvent.id)} className="text-xs text-red-600 hover:underline">
                      Delete
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-1 rounded text-xs ${eventTypeConfig[selectedEvent.eventType].color} bg-violet-100`}>
                  <FontAwesomeIcon icon={eventTypeConfig[selectedEvent.eventType].icon} className="mr-1" />
                  {eventTypeConfig[selectedEvent.eventType].label}
                </span>
                <span className="text-sm text-inkMuted">{selectedEvent.date}</span>
              </div>
              <h4 className="font-medium text-ink mb-2">{selectedEvent.title}</h4>
              {selectedEvent.description && (
                <p className="text-sm text-inkMuted mb-3">{selectedEvent.description}</p>
              )}
              
              {/* Tagged People */}
              {selectedEvent.peopleIds.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-xs font-medium text-inkMuted uppercase mb-2">People Involved</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.peopleIds.map((pid) => {
                      const person = people.find((p) => p.id === pid);
                      if (!person) return null;
                      return (
                        <button
                          key={pid}
                          onClick={() => setSelectedEntity({ type: 'person', id: pid })}
                          className="flex items-center gap-1 px-2 py-1 rounded-full bg-sky-50 hover:bg-sky-100 text-xs transition-colors"
                        >
                          {person.imageUrl ? (
                            <img src={person.imageUrl} alt={person.name} className="w-4 h-4 rounded-full object-cover" />
                          ) : (
                            <FontAwesomeIcon icon={faUser} className="text-sky-500 text-[10px]" />
                          )}
                          <span className="text-ink">{person.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tagged Locations */}
              {selectedEvent.locationIds.length > 0 && (
                <div className="mb-3">
                  <h5 className="text-xs font-medium text-inkMuted uppercase mb-2">Locations</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.locationIds.map((lid) => {
                      const location = locations.find((l) => l.id === lid);
                      if (!location) return null;
                      return (
                        <button
                          key={lid}
                          onClick={() => setSelectedEntity({ type: 'location', id: lid })}
                          className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-xs transition-colors"
                        >
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-emerald-500 text-[10px]" />
                          <span className="text-ink">{location.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Documents/Evidence */}
              {selectedEvent.documents.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-inkMuted uppercase mb-2">
                    Evidence ({selectedEvent.documents.length})
                  </h5>
                  <div className="space-y-2">
                    {selectedEvent.documents.map((doc, i) => (
                      <a
                        key={i}
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg bg-stone/5 hover:bg-violet-50 transition-colors group"
                      >
                        <div className={`w-8 h-8 rounded flex items-center justify-center flex-shrink-0 ${
                          doc.type === 'pdf' ? 'bg-red-100' : doc.type === 'image' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          <FontAwesomeIcon 
                            icon={doc.type === 'pdf' ? faFilePdf : doc.type === 'image' ? faImage : faLink} 
                            className={`text-sm ${
                              doc.type === 'pdf' ? 'text-red-500' : doc.type === 'image' ? 'text-blue-500' : 'text-gray-500'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate group-hover:text-violet-600">
                            {doc.label}
                          </p>
                          <p className="text-[10px] text-inkMuted uppercase">{doc.type}</p>
                        </div>
                        <FontAwesomeIcon 
                          icon={faExternalLinkAlt} 
                          className="text-xs text-inkMuted group-hover:text-violet-500" 
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!selectedEntity && activePanel === 'none' && (
            <div className="p-6 text-center text-inkMuted">
              <p className="text-sm">Click an item on the board to see details</p>
              {editMode && (
                <p className="text-xs mt-2">Use the buttons above to add people, locations, or events</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ============================================ */}
      {/* Slide-out Panel for People */}
      {/* ============================================ */}
      {activePanel === 'people' && editMode && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-sky-500 to-sky-600 text-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} />
                {editingPersonId ? 'Edit Person' : 'Add Person'}
              </h2>
              <button onClick={() => { setActivePanel('none'); resetPersonForm(); }} className="p-2 hover:bg-white/20 rounded">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Name *</label>
              <input
                value={personForm.name}
                onChange={(e) => setPersonForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-stone/30 focus:ring-2 focus:ring-sky-500/40 focus:outline-none"
                placeholder="Full name"
              />
            </div>

            {/* Title/Role */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Title / Role</label>
              <input
                value={personForm.title || ''}
                onChange={(e) => setPersonForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-stone/30 focus:ring-2 focus:ring-sky-500/40 focus:outline-none"
                placeholder="e.g., Financier, Pilot, Associate"
              />
            </div>

            {/* Image - Enhanced with upload + media library */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Photo</label>
              
              {/* Preview */}
              {personForm.imageUrl && (
                <div className="mb-3 flex items-center gap-3">
                  <img src={personForm.imageUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-sky-200" />
                  <button
                    onClick={() => setPersonForm((f) => ({ ...f, imageUrl: '' }))}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Upload Options */}
              <div className="space-y-2">
                {/* Direct Upload */}
                <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                  uploadingImage ? 'border-sky-300 bg-sky-50' : 'border-stone/30 hover:border-sky-400 hover:bg-sky-50'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'person')}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  {uploadingImage ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-sky-500" />
                      <span className="text-sm text-sky-600">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCloudUploadAlt} className="text-sky-500" />
                      <span className="text-sm text-ink">Upload Photo</span>
                    </>
                  )}
                </label>

                {/* Media Library Button */}
                <button
                  onClick={() => { setMediaPickerTarget('person'); setShowMediaPicker(true); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-stone/30 hover:bg-stone/5 transition-colors"
                >
                  <FontAwesomeIcon icon={faImage} className="text-inkMuted" />
                  <span className="text-sm text-ink">Choose from Media Library</span>
                </button>

                {/* Manual URL Input */}
                <div className="relative">
                  <input
                    value={personForm.imageUrl || ''}
                    onChange={(e) => setPersonForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-stone/30 focus:ring-2 focus:ring-sky-500/40 focus:outline-none text-sm"
                    placeholder="Or paste image URL..."
                  />
                </div>
              </div>

              {uploadProgress && (
                <p className={`text-xs mt-2 ${uploadProgress.includes('failed') ? 'text-red-600' : 'text-sky-600'}`}>
                  {uploadProgress}
                </p>
              )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Bio / Notes</label>
              <textarea
                value={personForm.bio || ''}
                onChange={(e) => setPersonForm((f) => ({ ...f, bio: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-stone/30 focus:ring-2 focus:ring-sky-500/40 focus:outline-none"
                placeholder="Brief background or notes..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={savePerson}
                disabled={!personForm.name.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-sky-500 text-white font-medium disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                {editingPersonId ? 'Update' : 'Add Person'}
              </button>
              {editingPersonId && (
                <button
                  onClick={resetPersonForm}
                  className="px-4 py-2 rounded-lg border border-stone/30 hover:bg-stone/10"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Existing People List */}
          {people.length > 0 && (
            <div className="border-t border-stone/20 p-4">
              <h3 className="text-xs font-semibold text-inkMuted uppercase tracking-wide mb-3">
                All People ({people.length})
              </h3>
              <div className="space-y-2">
                {people.map((person) => (
                  <div
                    key={person.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone/5 group"
                  >
                    {person.imageUrl ? (
                      <img src={person.imageUrl} alt={person.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
                        <FontAwesomeIcon icon={faUser} className="text-sky-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink text-sm truncate">{person.name}</p>
                      {person.title && <p className="text-xs text-inkMuted truncate">{person.title}</p>}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                      <button
                        onClick={() => editPerson(person.id)}
                        className="p-1 text-xs text-accent hover:bg-accent/10 rounded"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => deletePerson(person.id)}
                        className="p-1 text-xs text-red-600 hover:bg-red-50 rounded"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* Slide-out Panel for Locations */}
      {/* ============================================ */}
      {activePanel === 'locations' && editMode && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl z-50 overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                {editingLocationId ? 'Edit Location' : 'Add Location'}
              </h2>
              <button onClick={() => { setActivePanel('none'); resetLocationForm(); }} className="p-2 hover:bg-white/20 rounded">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Name *</label>
              <input
                value={locationForm.name}
                onChange={(e) => setLocationForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-stone/30 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                placeholder="e.g., Epstein's Manhattan Mansion"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Address</label>
              <input
                value={locationForm.address}
                onChange={(e) => setLocationForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-stone/30 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none"
                placeholder="Street address"
              />
            </div>

            {/* City, State, Country */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">City</label>
                <input
                  value={locationForm.city || ''}
                  onChange={(e) => setLocationForm((f) => ({ ...f, city: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-stone/30 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none text-sm"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">State</label>
                <input
                  value={locationForm.state || ''}
                  onChange={(e) => setLocationForm((f) => ({ ...f, state: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-stone/30 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none text-sm"
                  placeholder="State"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Country</label>
                <input
                  value={locationForm.country || ''}
                  onChange={(e) => setLocationForm((f) => ({ ...f, country: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-stone/30 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none text-sm"
                  placeholder="Country"
                />
              </div>
            </div>

            {/* Image - Enhanced with upload + media library */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Photo</label>
              
              {/* Preview */}
              {locationForm.imageUrl && (
                <div className="mb-3 flex items-center gap-3">
                  <img src={locationForm.imageUrl} alt="Preview" className="w-24 h-16 rounded-lg object-cover border-2 border-emerald-200" />
                  <button
                    onClick={() => setLocationForm((f) => ({ ...f, imageUrl: '' }))}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Upload Options */}
              <div className="space-y-2">
                {/* Direct Upload */}
                <label className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-all ${
                  uploadingImage ? 'border-emerald-300 bg-emerald-50' : 'border-stone/30 hover:border-emerald-400 hover:bg-emerald-50'
                }`}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'location')}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                  {uploadingImage ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-emerald-500" />
                      <span className="text-sm text-emerald-600">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCloudUploadAlt} className="text-emerald-500" />
                      <span className="text-sm text-ink">Upload Photo</span>
                    </>
                  )}
                </label>

                {/* Media Library Button */}
                <button
                  onClick={() => { setMediaPickerTarget('location'); setShowMediaPicker(true); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-stone/30 hover:bg-stone/5 transition-colors"
                >
                  <FontAwesomeIcon icon={faImage} className="text-inkMuted" />
                  <span className="text-sm text-ink">Choose from Media Library</span>
                </button>

                {/* Manual URL Input */}
                <div className="relative">
                  <input
                    value={locationForm.imageUrl || ''}
                    onChange={(e) => setLocationForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-stone/30 focus:ring-2 focus:ring-emerald-500/40 focus:outline-none text-sm"
                    placeholder="Or paste image URL..."
                  />
                </div>
              </div>

              {uploadProgress && (
                <p className={`text-xs mt-2 ${uploadProgress.includes('failed') ? 'text-red-600' : 'text-emerald-600'}`}>
                  {uploadProgress}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={saveLocation}
                disabled={!locationForm.name.trim()}
                className="flex-1 px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                {editingLocationId ? 'Update' : 'Add Location'}
              </button>
              {editingLocationId && (
                <button
                  onClick={resetLocationForm}
                  className="px-4 py-2 rounded-lg border border-stone/30 hover:bg-stone/10"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Existing Locations List */}
          {locations.length > 0 && (
            <div className="border-t border-stone/20 p-4">
              <h3 className="text-xs font-semibold text-inkMuted uppercase tracking-wide mb-3">
                All Locations ({locations.length})
              </h3>
              <div className="space-y-2">
                {locations.map((location) => (
                  <div
                    key={location.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone/5 group"
                  >
                    {location.imageUrl ? (
                      <img src={location.imageUrl} alt={location.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-emerald-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-ink text-sm truncate">{location.name}</p>
                      <p className="text-xs text-inkMuted truncate">
                        {location.city}{location.state ? `, ${location.state}` : ''}
                      </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                      <button
                        onClick={() => editLocation(location.id)}
                        className="p-1 text-xs text-accent hover:bg-accent/10 rounded"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        onClick={() => deleteLocation(location.id)}
                        className="p-1 text-xs text-red-600 hover:bg-red-50 rounded"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================ */}
      {/* Slide-out Panel for Events */}
      {/* ============================================ */}
      {activePanel === 'events' && editMode && (
        <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl z-50 overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-violet-500 to-violet-600 text-white p-4 z-10">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendar} />
                {editingEventId ? 'Edit Timeline Event' : 'Add Timeline Event'}
              </h2>
              <button onClick={() => { setActivePanel('none'); resetEventForm(); }} className="p-2 hover:bg-white/20 rounded">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Event Type *</label>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(eventTypeConfig) as TimelineEventType[]).map((type) => {
                  const config = eventTypeConfig[type];
                  return (
                    <button
                      key={type}
                      onClick={() => setEventForm((f) => ({ ...f, eventType: type }))}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        eventForm.eventType === type
                          ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-500/30'
                          : 'border-stone/30 hover:bg-stone/5'
                      }`}
                    >
                      <FontAwesomeIcon icon={config.icon} className={`text-lg ${config.color}`} />
                      <span className="block text-[10px] mt-1 text-ink">{config.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Title *</label>
              <input
                value={eventForm.title}
                onChange={(e) => setEventForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-stone/30 focus:ring-2 focus:ring-violet-500/40 focus:outline-none"
                placeholder="e.g., Meeting at Manhattan Mansion"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Date *</label>
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) => setEventForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-stone/30 focus:ring-2 focus:ring-violet-500/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Time (optional)</label>
                <input
                  type="time"
                  value={eventForm.time || ''}
                  onChange={(e) => setEventForm((f) => ({ ...f, time: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-stone/30 focus:ring-2 focus:ring-violet-500/40 focus:outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Description</label>
              <textarea
                value={eventForm.description}
                onChange={(e) => setEventForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-stone/30 focus:ring-2 focus:ring-violet-500/40 focus:outline-none"
                placeholder="What happened? Details, context..."
              />
            </div>

            {/* Tag People */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Tag People
                {people.length === 0 && (
                  <button
                    onClick={() => setActivePanel('people')}
                    className="ml-2 text-xs text-violet-600 font-normal hover:underline"
                  >
                    + Add people first
                  </button>
                )}
              </label>
              {people.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {people.map((person) => {
                    const isSelected = eventForm.peopleIds.includes(person.id);
                    return (
                      <label
                        key={person.id}
                        className={`flex items-center gap-2 text-sm p-2 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50'
                            : 'border-stone/20 hover:bg-stone/5'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            setEventForm((f) => ({
                              ...f,
                              peopleIds: e.target.checked
                                ? [...f.peopleIds, person.id]
                                : f.peopleIds.filter((id) => id !== person.id),
                            }));
                          }}
                          className="sr-only"
                        />
                        {person.imageUrl ? (
                          <img src={person.imageUrl} alt={person.name} className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center">
                            <FontAwesomeIcon icon={faUser} className="text-sky-500 text-[10px]" />
                          </div>
                        )}
                        <span className={`truncate ${isSelected ? 'font-medium' : ''}`}>{person.name}</span>
                        {isSelected && <FontAwesomeIcon icon={faCheck} className="ml-auto text-sky-500 text-xs" />}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-inkMuted p-3 border border-dashed border-stone/30 rounded-lg text-center">
                  No people added yet
                </p>
              )}
            </div>

            {/* Tag Locations */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Tag Locations
                {locations.length === 0 && (
                  <button
                    onClick={() => setActivePanel('locations')}
                    className="ml-2 text-xs text-violet-600 font-normal hover:underline"
                  >
                    + Add locations first
                  </button>
                )}
              </label>
              {locations.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {locations.map((location) => {
                    const isSelected = eventForm.locationIds.includes(location.id);
                    return (
                      <label
                        key={location.id}
                        className={`flex items-center gap-2 text-sm p-2 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-stone/20 hover:bg-stone/5'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            setEventForm((f) => ({
                              ...f,
                              locationIds: e.target.checked
                                ? [...f.locationIds, location.id]
                                : f.locationIds.filter((id) => id !== location.id),
                            }));
                          }}
                          className="sr-only"
                        />
                        <div className="w-6 h-6 rounded bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-emerald-500 text-[10px]" />
                        </div>
                        <span className={`truncate ${isSelected ? 'font-medium' : ''}`}>{location.name}</span>
                        {isSelected && <FontAwesomeIcon icon={faCheck} className="ml-auto text-emerald-500 text-xs" />}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-inkMuted p-3 border border-dashed border-stone/30 rounded-lg text-center">
                  No locations added yet
                </p>
              )}
            </div>

            {/* Evidence/Documents */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Evidence & Documents</label>
              
              {/* Existing evidence - with clickable links */}
              {eventForm.documents.length > 0 && (
                <div className="space-y-2 mb-3">
                  {eventForm.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-stone/5 rounded-lg group">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FontAwesomeIcon
                          icon={doc.type === 'pdf' ? faFilePdf : doc.type === 'image' ? faImage : faLink}
                          className={`text-sm flex-shrink-0 ${doc.type === 'pdf' ? 'text-red-500' : doc.type === 'image' ? 'text-blue-500' : 'text-inkMuted'}`}
                        />
                        <a 
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-violet-600 hover:underline truncate"
                        >
                          {doc.label}
                        </a>
                        <span className="text-[10px] text-inkMuted uppercase bg-stone/10 px-1 rounded flex-shrink-0">{doc.type}</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-accent hover:underline"
                        >
                          <FontAwesomeIcon icon={faExternalLinkAlt} />
                        </a>
                        <button
                          onClick={() => removeEvidenceFromEvent(i)}
                          className="text-red-600 text-xs hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <button
                onClick={() => setShowDocumentUploadModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-violet-300 hover:border-violet-400 hover:bg-violet-50 transition-all mb-3"
              >
                <FontAwesomeIcon icon={faCloudUploadAlt} className="text-violet-500" />
                <span className="text-sm text-ink">Upload PDF or Image File</span>
              </button>

              {/* Manual link entry */}
              <p className="text-xs text-inkMuted mb-2">Or add a link manually:</p>
              <div className="grid grid-cols-4 gap-2">
                <select
                  value={evidenceForm.type}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, type: e.target.value as EvidenceItemType }))}
                  className="px-2 py-2 rounded border border-stone/30 text-sm"
                >
                  <option value="link">Link</option>
                  <option value="pdf">PDF</option>
                  <option value="image">Image</option>
                  <option value="article">Article</option>
                </select>
                <input
                  value={evidenceForm.label}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Label"
                  className="px-3 py-2 rounded border border-stone/30 text-sm"
                />
                <input
                  value={evidenceForm.url}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="URL"
                  className="px-3 py-2 rounded border border-stone/30 text-sm"
                />
                <button
                  onClick={addEvidenceToEvent}
                  disabled={!evidenceForm.label || !evidenceForm.url}
                  className="px-3 py-2 rounded bg-violet-100 text-violet-700 text-sm font-medium disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <button
                onClick={saveEvent}
                disabled={!eventForm.title.trim() || !eventForm.date}
                className="flex-1 px-4 py-2 rounded-lg bg-violet-500 text-white font-medium disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                {editingEventId ? 'Update Event' : 'Add Event'}
              </button>
              {editingEventId && (
                <button
                  onClick={resetEventForm}
                  className="px-4 py-2 rounded-lg border border-stone/30 hover:bg-stone/10"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Existing Events List */}
          {events.length > 0 && (
            <div className="border-t border-stone/20 p-4">
              <h3 className="text-xs font-semibold text-inkMuted uppercase tracking-wide mb-3">
                All Events ({events.length})
              </h3>
              <div className="space-y-2">
                {events
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((event) => {
                    const config = eventTypeConfig[event.eventType];
                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone/5 group"
                      >
                        <div className={`w-8 h-8 rounded flex items-center justify-center bg-violet-100 ${config.color}`}>
                          <FontAwesomeIcon icon={config.icon} className="text-sm" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-ink text-sm truncate">{event.title}</p>
                          <p className="text-xs text-inkMuted">{event.date}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                          <button
                            onClick={() => editEvent(event.id)}
                            className="p-1 text-xs text-accent hover:bg-accent/10 rounded"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => deleteEvent(event.id)}
                            className="p-1 text-xs text-red-600 hover:bg-red-50 rounded"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPicker
          isOpen={showMediaPicker}
          onSelect={handleMediaSelect}
          onClose={() => setShowMediaPicker(false)}
          filterType="image"
        />
      )}

      {/* ============================================ */}
      {/* Document Upload Modal */}
      {/* ============================================ */}
      {showDocumentUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-500 to-violet-600 text-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg flex items-center gap-2">
                  <FontAwesomeIcon icon={faCloudUploadAlt} />
                  Upload Evidence Document
                </h2>
                <button 
                  onClick={() => setShowDocumentUploadModal(false)} 
                  className="p-2 hover:bg-white/20 rounded"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-sm text-inkMuted mb-4">
                Upload PDFs, images, or other evidence files. They will be stored securely and can be viewed by readers.
              </p>

              {/* Upload Area */}
              <label className={`block cursor-pointer ${uploadingDocument ? 'pointer-events-none' : ''}`}>
                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                  uploadingDocument 
                    ? 'border-violet-300 bg-violet-50' 
                    : 'border-stone/30 hover:border-violet-400 hover:bg-violet-50'
                }`}>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={handleDocumentUpload}
                    disabled={uploadingDocument}
                    className="hidden"
                  />
                  
                  {uploadingDocument ? (
                    <div className="flex flex-col items-center gap-3">
                      <FontAwesomeIcon icon={faSpinner} className="text-4xl text-violet-500 animate-spin" />
                      <p className="text-sm text-violet-600 font-medium">Uploading document...</p>
                      {uploadProgress && (
                        <p className="text-xs text-inkMuted">{uploadProgress}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-xl bg-red-50 flex items-center justify-center">
                          <FontAwesomeIcon icon={faFilePdf} className="text-2xl text-red-500" />
                        </div>
                        <div className="w-16 h-16 rounded-xl bg-blue-50 flex items-center justify-center">
                          <FontAwesomeIcon icon={faImage} className="text-2xl text-blue-500" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-ink">Click to upload or drag and drop</p>
                        <p className="text-sm text-inkMuted mt-1">PDF, PNG, JPG, GIF up to 10MB</p>
                      </div>
                    </div>
                  )}
                </div>
              </label>

              {/* Supported formats */}
              <div className="mt-4 p-3 bg-stone/5 rounded-lg">
                <p className="text-xs font-medium text-ink mb-2">Supported file types:</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">PDF Documents</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Images (JPG, PNG, GIF)</span>
                </div>
              </div>

              {/* Info */}
              <div className="mt-4 flex items-start gap-2 text-xs text-inkMuted">
                <FontAwesomeIcon icon={faFileAlt} className="mt-0.5" />
                <p>
                  Uploaded files will be publicly accessible to readers of the investigation board. 
                  Make sure you have the rights to share these documents.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-stone/20 px-6 py-4 bg-stone/5">
              <button
                onClick={() => setShowDocumentUploadModal(false)}
                className="w-full px-4 py-2 rounded-lg border border-stone/30 hover:bg-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
