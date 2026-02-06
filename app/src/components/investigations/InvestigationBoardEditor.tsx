import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faLink,
  faSave,
  faEye,
  faEdit,
  faTrash,
  faExpand,
  faUndo,
  faRedo,
  faSearch,
  faUser,
  faFile,
  faMapMarkerAlt,
  faCalendar,
  faTimes,
  faCheck,
  faImage,
  faExternalLinkAlt,
  faCopy,
  faCloudUploadAlt,
  faFilePdf,
} from '@fortawesome/free-solid-svg-icons';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import MediaPicker from '../MediaPicker';
import type { Media } from '../../types/models';
import type {
  BoardLink,
  BoardNode,
  EvidenceItem,
  EvidenceItemType,
  InvestigationPerson,
  InvestigationsBoardPayload,
} from '../../types/investigations';
import { epsteinBoardSeed } from '../../data/investigations/epsteinFilesSeed';
import { uploadMediaFile } from '../../services/mediaService';

const BOARD_DOC_ID = 'epstein-files';

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  People: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700' },
  Locations: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  Documents: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  Timeline: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
};

const defaultCategories = ['People', 'Locations', 'Documents', 'Timeline'];

interface HistoryState {
  nodes: BoardNode[];
  links: BoardLink[];
  people: InvestigationPerson[];
}

interface Props {
  readOnly?: boolean;
}

export default function InvestigationBoardEditor({ readOnly = false }: Props) {
  const { isEditor, isSuperUser, userData } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Board state
  const [loading, setLoading] = useState(true);
  const [boardTitle, setBoardTitle] = useState(epsteinBoardSeed.title);
  const [boardDescription, setBoardDescription] = useState(epsteinBoardSeed.description);
  const [nodes, setNodes] = useState<BoardNode[]>(epsteinBoardSeed.nodes || []);
  const [links, setLinks] = useState<BoardLink[]>(epsteinBoardSeed.links || []);
  const [people, setPeople] = useState<InvestigationPerson[]>([]);
  const [isActive, setIsActive] = useState(true);

  // UI state
  const [editMode, setEditMode] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // Edit state
  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Panels
  const [showAddWidgetPanel, setShowAddWidgetPanel] = useState(false);
  const [showPeoplePanel, setShowPeoplePanel] = useState(false);
  const [showConnectionPanel, setShowConnectionPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'widget' | 'person' | 'evidence'>('widget');

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // History for undo/redo
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Widget form
  const [widgetForm, setWidgetForm] = useState<BoardNode>({
    id: '',
    title: '',
    category: 'People',
    date: '',
    location: '',
    summary: '',
    x: 0,
    y: 0,
    imageUrl: '',
    people: [],
    evidence: [],
  });
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);

  // Person form
  const [personForm, setPersonForm] = useState<InvestigationPerson>({
    id: '',
    name: '',
    title: '',
    imageUrl: '',
  });
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);

  // Evidence form
  const [evidenceForm, setEvidenceForm] = useState<EvidenceItem>({
    label: '',
    url: '',
    type: 'link',
  });

  // Connection form
  const [connectionForm, setConnectionForm] = useState<BoardLink>({
    id: '',
    from: '',
    to: '',
    label: '',
    evidence: [],
  });
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);

  const canEdit = !readOnly && (isEditor() || isSuperUser());

  // Load board data
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'investigations', BOARD_DOC_ID));
        if (snapshot.exists()) {
          const data = snapshot.data() as InvestigationsBoardPayload;
          setBoardTitle(data.title || epsteinBoardSeed.title);
          setBoardDescription(data.description || epsteinBoardSeed.description);
          setNodes(data.nodes || []);
          setLinks(data.links || []);
          setPeople(data.people || []);
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

  // Save history for undo/redo
  const pushHistory = useCallback(() => {
    const newState: HistoryState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      links: JSON.parse(JSON.stringify(links)),
      people: JSON.parse(JSON.stringify(people)),
    };
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), newState]);
    setHistoryIndex((prev) => prev + 1);
  }, [nodes, links, people, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setNodes(prevState.nodes);
      setLinks(prevState.links);
      setPeople(prevState.people);
      setHistoryIndex((prev) => prev - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setNodes(nextState.nodes);
      setLinks(nextState.links);
      setPeople(nextState.people);
      setHistoryIndex((prev) => prev + 1);
    }
  }, [history, historyIndex]);

  // Categories
  const categories = useMemo(
    () => ['All', ...Array.from(new Set([...defaultCategories, ...nodes.map((n) => n.category)]))],
    [nodes]
  );

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return nodes.filter((node) => {
      const matchesCategory = categoryFilter === 'All' || node.category === categoryFilter;
      const matchesSearch =
        !term ||
        node.title.toLowerCase().includes(term) ||
        node.summary.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [nodes, categoryFilter, searchTerm]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredLinks = useMemo(
    () => links.filter((l) => filteredNodeIds.has(l.from) && filteredNodeIds.has(l.to)),
    [links, filteredNodeIds]
  );

  // Selected items
  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  const selectedLink = useMemo(
    () => links.find((l) => l.id === selectedLinkId) || null,
    [links, selectedLinkId]
  );

  const relatedLinks = useMemo(() => {
    if (!selectedNodeId) return [];
    return links.filter((l) => l.from === selectedNodeId || l.to === selectedNodeId);
  }, [links, selectedNodeId]);

  // Wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const wheelListener = (event: WheelEvent) => {
      event.preventDefault();
      const delta = -event.deltaY;
      const zoomFactor = delta > 0 ? 1.08 : 0.92;
      setScale((current) => Math.min(2, Math.max(0.4, current * zoomFactor)));
    };

    container.addEventListener('wheel', wheelListener, { passive: false });
    return () => container.removeEventListener('wheel', wheelListener);
  }, []);

  // Pan handlers
  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || draggingNodeId) return;
    setIsPanning(true);
    setPanStart({ x: event.clientX - offset.x, y: event.clientY - offset.y });
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    if (isPanning && !draggingNodeId) {
      setOffset({ x: event.clientX - panStart.x, y: event.clientY - panStart.y });
    }
    if (draggingNodeId && editMode) {
      const bounds = canvasRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const x = (event.clientX - bounds.left - dragOffset.x) / scale;
      const y = (event.clientY - bounds.top - dragOffset.y) / scale;
      setNodes((prev) => prev.map((n) => (n.id === draggingNodeId ? { ...n, x, y } : n)));
    }
  };

  const handleMouseUp = () => {
    if (draggingNodeId) {
      pushHistory();
    }
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  // Node handlers
  const handleNodeMouseDown = (event: MouseEvent<HTMLButtonElement>, nodeId: string) => {
    if (!editMode || connectMode) return;
    event.stopPropagation();
    const bounds = canvasRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setDraggingNodeId(nodeId);
    setDragOffset({
      x: event.clientX - bounds.left - node.x * scale,
      y: event.clientY - bounds.top - node.y * scale,
    });
  };

  const handleNodeClick = (nodeId: string) => {
    if (connectMode && editMode) {
      if (!connectFrom) {
        setConnectFrom(nodeId);
        return;
      }
      if (connectFrom === nodeId) {
        setConnectFrom(null);
        return;
      }
      // Open connection panel to create link
      setConnectionForm({
        id: '',
        from: connectFrom,
        to: nodeId,
        label: '',
        evidence: [],
      });
      setShowConnectionPanel(true);
      setConnectFrom(null);
      setConnectMode(false);
      return;
    }
    setSelectedNodeId(nodeId);
    setSelectedLinkId(null);
  };

  const handleLinkClick = (linkId: string) => {
    setSelectedLinkId(linkId);
    setSelectedNodeId(null);
  };

  // Zoom controls
  const zoomIn = () => setScale((s) => Math.min(2, s * 1.15));
  const zoomOut = () => setScale((s) => Math.max(0.4, s * 0.85));
  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const centerOnNode = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node || !containerRef.current) return;
    const bounds = containerRef.current.getBoundingClientRect();
    setOffset({
      x: bounds.width / 2 - (node.x + 140) * scale,
      y: bounds.height / 2 - (node.y + 60) * scale,
    });
  };

  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    return { x: node.x + 140, y: node.y + 60 };
  };

  // Slug helper
  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const ensureUniqueId = (base: string, existingIds: string[]) => {
    if (!existingIds.includes(base)) return base;
    let counter = 2;
    while (existingIds.includes(`${base}-${counter}`)) counter += 1;
    return `${base}-${counter}`;
  };

  // Widget CRUD
  const openAddWidget = (position?: { x: number; y: number }) => {
    const bounds = canvasRef.current?.getBoundingClientRect();
    const x = position?.x ?? (bounds ? (bounds.width / 2 - offset.x) / scale - 140 : 120);
    const y = position?.y ?? (bounds ? (bounds.height / 2 - offset.y) / scale - 60 : 140);
    setWidgetForm({
      id: '',
      title: '',
      category: 'People',
      date: '',
      location: '',
      summary: '',
      x,
      y,
      imageUrl: '',
      people: [],
      evidence: [],
    });
    setEditingWidgetId(null);
    setShowAddWidgetPanel(true);
  };

  const openEditWidget = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setWidgetForm({ ...node });
    setEditingWidgetId(nodeId);
    setShowAddWidgetPanel(true);
  };

  const saveWidget = () => {
    if (!widgetForm.title.trim()) return;
    pushHistory();

    const baseId = widgetForm.id || slugify(widgetForm.title);
    const id = editingWidgetId || ensureUniqueId(baseId || `widget-${Date.now()}`, nodes.map((n) => n.id));

    const newNode: BoardNode = {
      ...widgetForm,
      id,
      title: widgetForm.title.trim(),
      summary: widgetForm.summary.trim(),
    };

    setNodes((prev) => {
      if (editingWidgetId) {
        return prev.map((n) => (n.id === editingWidgetId ? newNode : n));
      }
      return [...prev, newNode];
    });

    setShowAddWidgetPanel(false);
    setEditingWidgetId(null);
    setSelectedNodeId(id);
  };

  const deleteWidget = (nodeId: string) => {
    if (!confirm('Delete this widget and its connections?')) return;
    pushHistory();
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setLinks((prev) => prev.filter((l) => l.from !== nodeId && l.to !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const duplicateWidget = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    pushHistory();
    const newId = ensureUniqueId(`${node.id}-copy`, nodes.map((n) => n.id));
    setNodes((prev) => [
      ...prev,
      { ...node, id: newId, title: `${node.title} (copy)`, x: node.x + 40, y: node.y + 40 },
    ]);
  };

  // Person CRUD
  const savePerson = () => {
    if (!personForm.name.trim()) return;
    pushHistory();

    const baseId = personForm.id || slugify(personForm.name);
    const id = editingPersonId || ensureUniqueId(baseId || `person-${Date.now()}`, people.map((p) => p.id));

    const newPerson: InvestigationPerson = {
      ...personForm,
      id,
      name: personForm.name.trim(),
    };

    setPeople((prev) => {
      if (editingPersonId) {
        return prev.map((p) => (p.id === editingPersonId ? newPerson : p));
      }
      return [...prev, newPerson];
    });

    setPersonForm({ id: '', name: '', title: '', imageUrl: '' });
    setEditingPersonId(null);
  };

  const deletePerson = (personId: string) => {
    if (!confirm('Delete this person?')) return;
    pushHistory();
    setPeople((prev) => prev.filter((p) => p.id !== personId));
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        people: n.people?.filter((id) => id !== personId),
      }))
    );
  };

  // Connection CRUD
  const saveConnection = () => {
    if (!connectionForm.from || !connectionForm.to || !connectionForm.label.trim()) return;
    pushHistory();

    const baseId = connectionForm.id || slugify(`${connectionForm.from}-${connectionForm.to}-${connectionForm.label}`);
    const id = editingConnectionId || ensureUniqueId(baseId || `link-${Date.now()}`, links.map((l) => l.id));

    const newLink: BoardLink = {
      ...connectionForm,
      id,
      label: connectionForm.label.trim(),
    };

    setLinks((prev) => {
      if (editingConnectionId) {
        return prev.map((l) => (l.id === editingConnectionId ? newLink : l));
      }
      return [...prev, newLink];
    });

    setShowConnectionPanel(false);
    setConnectionForm({ id: '', from: '', to: '', label: '', evidence: [] });
    setEditingConnectionId(null);
  };

  const deleteConnection = (linkId: string) => {
    if (!confirm('Delete this connection?')) return;
    pushHistory();
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
    if (selectedLinkId === linkId) setSelectedLinkId(null);
  };

  const openEditConnection = (linkId: string) => {
    const link = links.find((l) => l.id === linkId);
    if (!link) return;
    setConnectionForm({ ...link });
    setEditingConnectionId(linkId);
    setShowConnectionPanel(true);
  };

  // Evidence helpers
  const addEvidenceToWidget = () => {
    if (!evidenceForm.label.trim() || !evidenceForm.url.trim()) return;
    setWidgetForm((prev) => ({
      ...prev,
      evidence: [...(prev.evidence || []), { ...evidenceForm }],
    }));
    setEvidenceForm({ label: '', url: '', type: 'link' });
  };

  const addEvidenceToConnection = () => {
    if (!evidenceForm.label.trim() || !evidenceForm.url.trim()) return;
    setConnectionForm((prev) => ({
      ...prev,
      evidence: [...(prev.evidence || []), { ...evidenceForm }],
    }));
    setEvidenceForm({ label: '', url: '', type: 'link' });
  };

  const removeEvidenceFromWidget = (index: number) => {
    setWidgetForm((prev) => ({
      ...prev,
      evidence: prev.evidence?.filter((_, i) => i !== index),
    }));
  };

  const removeEvidenceFromConnection = (index: number) => {
    setConnectionForm((prev) => ({
      ...prev,
      evidence: prev.evidence?.filter((_, i) => i !== index),
    }));
  };

  // Media picker
  const handleMediaSelect = (media: Media) => {
    if (mediaPickerTarget === 'widget') {
      setWidgetForm((prev) => ({ ...prev, imageUrl: media.url }));
    } else if (mediaPickerTarget === 'person') {
      setPersonForm((prev) => ({ ...prev, imageUrl: media.url }));
    } else if (mediaPickerTarget === 'evidence') {
      setEvidenceForm((prev) => ({ ...prev, url: media.url, type: 'image' }));
    }
    setShowMediaPicker(false);
  };

  // File upload for evidence (PDFs, images)
  const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    
    if (!isPdf && !isImage) {
      alert('Please drop a PDF or image file');
      return;
    }

    setUploadingFile(true);
    try {
      const folder = isPdf ? 'evidence/pdfs' : 'evidence/images';
      const url = await uploadMediaFile(file, folder);
      const label = file.name.replace(/\.[^/.]+$/, ''); // Remove extension for label
      
      setWidgetForm((prev) => ({
        ...prev,
        evidence: [...(prev.evidence || []), {
          label,
          url,
          type: isPdf ? 'pdf' : 'image',
        }],
      }));
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const isPdf = file.type === 'application/pdf';
    const isImage = file.type.startsWith('image/');
    
    if (!isPdf && !isImage) {
      alert('Please select a PDF or image file');
      return;
    }

    setUploadingFile(true);
    try {
      const folder = isPdf ? 'evidence/pdfs' : 'evidence/images';
      const url = await uploadMediaFile(file, folder);
      const label = file.name.replace(/\.[^/.]+$/, '');
      
      setWidgetForm((prev) => ({
        ...prev,
        evidence: [...(prev.evidence || []), {
          label,
          url,
          type: isPdf ? 'pdf' : 'image',
        }],
      }));
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploadingFile(false);
      e.target.value = ''; // Reset input
    }
  };

  // Save board
  const saveBoard = useCallback(async () => {
    if (!canEdit) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const payload: Partial<InvestigationsBoardPayload> = {
        title: boardTitle,
        description: boardDescription,
        nodes,
        links,
        people,
        isActive,
        updatedAt: serverTimestamp(),
        updatedBy: userData?.displayName || userData?.email || 'unknown',
      };
      await setDoc(doc(db, 'investigations', BOARD_DOC_ID), payload, { merge: true });
      setSaveMessage('Saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save:', error);
      setSaveMessage('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [canEdit, boardTitle, boardDescription, nodes, links, people, isActive, userData]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!editMode) return undefined;
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        saveBoard();
      }
      if (event.key === 'Escape') {
        setConnectMode(false);
        setConnectFrom(null);
        setShowAddWidgetPanel(false);
        setShowPeoplePanel(false);
        setShowConnectionPanel(false);
        setShowSettingsPanel(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [editMode, undo, redo, saveBoard]);

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

  return (
    <div className="relative h-full w-full">
      {/* Header */}
      <div className="bg-white border-b border-stone/20 px-6 py-3">
        <div className="flex items-center justify-between gap-4">
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
      <div className="flex h-[calc(100vh-140px)]">
        {/* Canvas area */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="bg-stone/5 border-b border-stone/20 px-4 py-2 flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="relative">
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-inkMuted text-xs" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search widgets..."
                  className="pl-9 pr-4 py-2 text-sm rounded-lg border border-stone/30 focus:outline-none focus:ring-2 focus:ring-accent/40 w-48"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-stone/30 bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 border-l border-stone/30 pl-3">
              <button onClick={zoomOut} className="p-2 hover:bg-white rounded" title="Zoom out">−</button>
              <span className="text-xs text-inkMuted w-12 text-center">{Math.round(scale * 100)}%</span>
              <button onClick={zoomIn} className="p-2 hover:bg-white rounded" title="Zoom in">+</button>
              <button onClick={resetView} className="p-2 hover:bg-white rounded text-xs" title="Reset view">
                <FontAwesomeIcon icon={faExpand} />
              </button>
            </div>

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

            {editMode && (
              <div className="flex items-center gap-2 border-l border-stone/30 pl-3 ml-auto">
                <button
                  onClick={() => setConnectMode(!connectMode)}
                  className={`px-3 py-2 text-sm rounded-lg flex items-center gap-2 ${
                    connectMode ? 'bg-ink text-white' : 'border border-stone/30 hover:bg-white'
                  }`}
                >
                  <FontAwesomeIcon icon={faLink} className="text-xs" />
                  {connectMode ? 'Cancel' : 'Connect'}
                </button>
                <button
                  onClick={() => openAddWidget()}
                  className="px-3 py-2 text-sm rounded-lg bg-accent text-white flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-xs" />
                  Add Widget
                </button>
                <button
                  onClick={() => setShowPeoplePanel(true)}
                  className="px-3 py-2 text-sm rounded-lg border border-stone/30 hover:bg-white flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faUser} className="text-xs" />
                  People ({people.length})
                </button>
                <button
                  onClick={() => setShowSettingsPanel(true)}
                  className="px-3 py-2 text-sm rounded-lg border border-stone/30 hover:bg-white"
                >
                  Settings
                </button>
              </div>
            )}

            {connectMode && connectFrom && (
              <span className="text-xs text-accent animate-pulse">
                Click another widget to connect
              </span>
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
            style={{ cursor: isPanning ? 'grabbing' : draggingNodeId ? 'move' : 'grab' }}
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
              <svg className="absolute inset-0 w-[3000px] h-[2000px] pointer-events-none">
                {filteredLinks.map((link) => {
                  const from = getNodeCenter(link.from);
                  const to = getNodeCenter(link.to);
                  const isSelected = link.id === selectedLinkId;
                  return (
                    <g
                      key={link.id}
                      onClick={() => handleLinkClick(link.id)}
                      className="cursor-pointer pointer-events-auto"
                    >
                      <line
                        x1={from.x}
                        y1={from.y}
                        x2={to.x}
                        y2={to.y}
                        stroke={isSelected ? '#0ea5e9' : '#9ca3af'}
                        strokeWidth={isSelected ? 3 : 2}
                        strokeDasharray={isSelected ? undefined : '6 4'}
                      />
                      <text
                        x={(from.x + to.x) / 2}
                        y={(from.y + to.y) / 2 - 8}
                        fill={isSelected ? '#0ea5e9' : '#6b7280'}
                        fontSize="12"
                        textAnchor="middle"
                        className="pointer-events-none"
                      >
                        {link.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Widget nodes */}
              <div className="relative w-[3000px] h-[2000px]">
                {filteredNodes.map((node) => {
                  const colors = categoryColors[node.category] || { bg: 'bg-stone/5', border: 'border-stone/30', text: 'text-ink' };
                  const isSelected = node.id === selectedNodeId;
                  const isConnecting = connectFrom === node.id;

                  return (
                    <button
                      key={node.id}
                      onClick={() => handleNodeClick(node.id)}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      onDoubleClick={() => editMode && openEditWidget(node.id)}
                      className={`absolute w-72 rounded-2xl border bg-white p-4 text-left shadow-sm transition-all hover:shadow-lg group ${
                        isSelected ? 'ring-2 ring-accent shadow-lg' : isConnecting ? 'ring-2 ring-emerald-400' : 'border-stone/30'
                      } ${editMode ? 'cursor-move' : 'cursor-pointer'}`}
                      style={{ left: node.x, top: node.y }}
                    >
                      {/* Quick actions */}
                      {editMode && (
                        <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); openEditWidget(node.id); }}
                            className="p-2 bg-white rounded-full shadow-md border border-stone/20 hover:bg-stone/10"
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faEdit} className="text-xs text-ink" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); duplicateWidget(node.id); }}
                            className="p-2 bg-white rounded-full shadow-md border border-stone/20 hover:bg-stone/10"
                            title="Duplicate"
                          >
                            <FontAwesomeIcon icon={faCopy} className="text-xs text-ink" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteWidget(node.id); }}
                            className="p-2 bg-white rounded-full shadow-md border border-stone/20 hover:bg-red-50"
                            title="Delete"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-xs text-red-600" />
                          </button>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        {node.imageUrl ? (
                          <img
                            src={node.imageUrl}
                            alt={node.title}
                            className="h-12 w-12 rounded-xl object-cover border border-stone/20"
                          />
                        ) : (
                          <div className={`h-12 w-12 rounded-xl ${colors.bg} flex items-center justify-center ${colors.text}`}>
                            {node.title.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-semibold text-ink truncate">{node.title}</h3>
                            <span className={`text-[10px] px-2 py-1 rounded-full border whitespace-nowrap ${colors.bg} ${colors.border} ${colors.text}`}>
                              {node.category}
                            </span>
                          </div>
                          {(node.date || node.location) && (
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-inkMuted">
                              {node.date && (
                                <span className="flex items-center gap-1">
                                  <FontAwesomeIcon icon={faCalendar} className="text-[9px]" />
                                  {node.date}
                                </span>
                              )}
                              {node.location && (
                                <span className="flex items-center gap-1">
                                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[9px]" />
                                  {node.location}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      {node.summary && (
                        <p className="text-xs text-inkMuted mt-2 line-clamp-2">{node.summary}</p>
                      )}
                      {((node.evidence?.length || 0) > 0 || (node.people?.length || 0) > 0) && (
                        <div className="flex items-center gap-3 mt-2 pt-2 border-t border-stone/10 text-[10px] text-inkMuted">
                          {(node.people?.length || 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faUser} />
                              {node.people?.length}
                            </span>
                          )}
                          {(node.evidence?.length || 0) > 0 && (
                            <span className="flex items-center gap-1">
                              <FontAwesomeIcon icon={faFile} />
                              {node.evidence?.length}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Details sidebar */}
        <aside className="w-80 bg-white border-l border-stone/20 overflow-y-auto">
          <div className="p-4 space-y-4">
            {/* Summary */}
            <div className="border border-stone/20 rounded-xl p-4">
              <h3 className="font-semibold text-ink text-sm">Summary</h3>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-inkMuted">Widgets</span>
                  <span className="block font-semibold text-ink">{nodes.length}</span>
                </div>
                <div>
                  <span className="text-inkMuted">Connections</span>
                  <span className="block font-semibold text-ink">{links.length}</span>
                </div>
                <div>
                  <span className="text-inkMuted">People</span>
                  <span className="block font-semibold text-ink">{people.length}</span>
                </div>
                <div>
                  <span className="text-inkMuted">Evidence</span>
                  <span className="block font-semibold text-ink">
                    {nodes.reduce((c, n) => c + (n.evidence?.length || 0), 0) +
                      links.reduce((c, l) => c + (l.evidence?.length || 0), 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Selected node details */}
            {selectedNode && (
              <div className="border border-stone/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink text-sm">Widget Details</h3>
                  {editMode && (
                    <button
                      onClick={() => openEditWidget(selectedNode.id)}
                      className="text-xs text-accent"
                    >
                      Edit
                    </button>
                  )}
                </div>
                <div className="mt-3 space-y-3">
                  <div>
                    <span className="text-[11px] text-inkMuted uppercase tracking-wide">Title</span>
                    <p className="font-medium text-ink">{selectedNode.title}</p>
                  </div>
                  {selectedNode.summary && (
                    <div>
                      <span className="text-[11px] text-inkMuted uppercase tracking-wide">Summary</span>
                      <p className="text-sm text-inkMuted">{selectedNode.summary}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[11px] text-inkMuted uppercase tracking-wide">Category</span>
                      <p className="text-sm text-ink">{selectedNode.category}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-inkMuted uppercase tracking-wide">Date</span>
                      <p className="text-sm text-ink">{selectedNode.date || '—'}</p>
                    </div>
                  </div>
                  {selectedNode.location && (
                    <div>
                      <span className="text-[11px] text-inkMuted uppercase tracking-wide">Location</span>
                      <p className="text-sm text-ink">{selectedNode.location}</p>
                    </div>
                  )}

                  {/* People */}
                  {selectedNode.people && selectedNode.people.length > 0 && (
                    <div>
                      <span className="text-[11px] text-inkMuted uppercase tracking-wide">People</span>
                      <div className="mt-2 space-y-2">
                        {selectedNode.people
                          .map((pid) => people.find((p) => p.id === pid))
                          .filter((p): p is InvestigationPerson => Boolean(p))
                          .map((person) => (
                            <div key={person.id} className="flex items-center gap-2">
                              {person.imageUrl ? (
                                <img src={person.imageUrl} alt={person.name} className="h-6 w-6 rounded-full object-cover" />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-stone/10 flex items-center justify-center text-[10px]">
                                  {person.name.charAt(0)}
                                </div>
                              )}
                              <span className="text-sm text-ink">{person.name}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Evidence */}
                  {selectedNode.evidence && selectedNode.evidence.length > 0 && (
                    <div>
                      <span className="text-[11px] text-inkMuted uppercase tracking-wide">Evidence</span>
                      <div className="mt-2 space-y-2">
                        {selectedNode.evidence.map((ev, i) => (
                          <a
                            key={i}
                            href={ev.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-sm text-accent hover:underline"
                          >
                            <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[10px]" />
                            {ev.label}
                            <span className="text-[10px] text-inkMuted uppercase">{ev.type}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Connections */}
                  {relatedLinks.length > 0 && (
                    <div>
                      <span className="text-[11px] text-inkMuted uppercase tracking-wide">Connections</span>
                      <div className="mt-2 space-y-2">
                        {relatedLinks.map((link) => {
                          const targetId = link.from === selectedNode.id ? link.to : link.from;
                          const target = nodes.find((n) => n.id === targetId);
                          return (
                            <div key={link.id} className="flex items-center justify-between text-sm">
                              <span className="text-ink">{link.label}</span>
                              {target && (
                                <button
                                  onClick={() => {
                                    setSelectedNodeId(target.id);
                                    centerOnNode(target.id);
                                  }}
                                  className="text-xs text-accent"
                                >
                                  → {target.title}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selected link details */}
            {selectedLink && (
              <div className="border border-stone/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink text-sm">Connection Details</h3>
                  {editMode && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditConnection(selectedLink.id)}
                        className="text-xs text-accent"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteConnection(selectedLink.id)}
                        className="text-xs text-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3 space-y-3">
                  <div>
                    <span className="text-[11px] text-inkMuted uppercase tracking-wide">Label</span>
                    <p className="font-medium text-ink">{selectedLink.label}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      onClick={() => {
                        setSelectedNodeId(selectedLink.from);
                        setSelectedLinkId(null);
                        centerOnNode(selectedLink.from);
                      }}
                      className="text-accent hover:underline"
                    >
                      {nodes.find((n) => n.id === selectedLink.from)?.title || selectedLink.from}
                    </button>
                    <span className="text-inkMuted">→</span>
                    <button
                      onClick={() => {
                        setSelectedNodeId(selectedLink.to);
                        setSelectedLinkId(null);
                        centerOnNode(selectedLink.to);
                      }}
                      className="text-accent hover:underline"
                    >
                      {nodes.find((n) => n.id === selectedLink.to)?.title || selectedLink.to}
                    </button>
                  </div>
                  {selectedLink.evidence && selectedLink.evidence.length > 0 && (
                    <div>
                      <span className="text-[11px] text-inkMuted uppercase tracking-wide">Evidence</span>
                      <div className="mt-2 space-y-2">
                        {selectedLink.evidence.map((ev, i) => (
                          <a
                            key={i}
                            href={ev.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-sm text-accent hover:underline"
                          >
                            <FontAwesomeIcon icon={faExternalLinkAlt} className="text-[10px]" />
                            {ev.label}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!selectedNode && !selectedLink && (
              <div className="border border-stone/20 rounded-xl p-4 text-center text-sm text-inkMuted">
                Click a widget or connection to view details
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Add/Edit Widget Panel */}
      {showAddWidgetPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowAddWidgetPanel(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-stone/20 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-ink">{editingWidgetId ? 'Edit Widget' : 'Add Widget'}</h2>
              <button onClick={() => setShowAddWidgetPanel(false)} className="p-2 hover:bg-stone/10 rounded">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Title *</label>
                <input
                  value={widgetForm.title}
                  onChange={(e) => setWidgetForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-stone/30 focus:outline-none focus:ring-2 focus:ring-accent/40"
                  placeholder="Widget title"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Category</label>
                  <select
                    value={widgetForm.category}
                    onChange={(e) => setWidgetForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-stone/30"
                  >
                    {defaultCategories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">Date</label>
                  <input
                    type="date"
                    value={widgetForm.date}
                    onChange={(e) => setWidgetForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-stone/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Location</label>
                <input
                  value={widgetForm.location || ''}
                  onChange={(e) => setWidgetForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-stone/30"
                  placeholder="City, State or Address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Summary</label>
                <textarea
                  value={widgetForm.summary}
                  onChange={(e) => setWidgetForm((f) => ({ ...f, summary: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-stone/30"
                  placeholder="Brief description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Image</label>
                <div className="flex gap-2">
                  <input
                    value={widgetForm.imageUrl || ''}
                    onChange={(e) => setWidgetForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    className="flex-1 px-4 py-2 rounded-lg border border-stone/30"
                    placeholder="Image URL"
                  />
                  <button
                    onClick={() => { setMediaPickerTarget('widget'); setShowMediaPicker(true); }}
                    className="px-4 py-2 rounded-lg border border-stone/30 hover:bg-stone/10"
                  >
                    <FontAwesomeIcon icon={faImage} />
                  </button>
                </div>
              </div>

              {/* People selection */}
              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Tag People
                  {people.length === 0 && (
                    <button
                      onClick={() => { setShowAddWidgetPanel(false); setShowPeoplePanel(true); }}
                      className="ml-2 text-xs text-accent font-normal hover:underline"
                    >
                      + Add people first
                    </button>
                  )}
                </label>
                {people.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {people.map((person) => {
                      const isSelected = widgetForm.people?.includes(person.id) || false;
                      return (
                        <label 
                          key={person.id} 
                          className={`flex items-center gap-2 text-sm p-2 rounded-lg border cursor-pointer transition-all ${
                            isSelected 
                              ? 'border-accent bg-accent/5' 
                              : 'border-stone/20 hover:bg-stone/5'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              setWidgetForm((f) => ({
                                ...f,
                                people: e.target.checked
                                  ? [...(f.people || []), person.id]
                                  : f.people?.filter((id) => id !== person.id),
                              }));
                            }}
                            className="sr-only"
                          />
                          {person.imageUrl ? (
                            <img src={person.imageUrl} alt={person.name} className="h-6 w-6 rounded-full object-cover" />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-stone/10 flex items-center justify-center text-[10px]">
                              {person.name.charAt(0)}
                            </div>
                          )}
                          <span className={isSelected ? 'font-medium' : ''}>{person.name}</span>
                          {isSelected && (
                            <FontAwesomeIcon icon={faCheck} className="ml-auto text-accent text-xs" />
                          )}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-inkMuted p-3 border border-dashed border-stone/30 rounded-lg text-center">
                    No people in library yet. Add people first to tag them here.
                  </p>
                )}
              </div>

              {/* Evidence */}
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Evidence</label>
                {(widgetForm.evidence?.length || 0) > 0 && (
                  <div className="space-y-2 mb-3">
                    {widgetForm.evidence?.map((ev, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-stone/5 rounded">
                        <div className="flex items-center gap-2">
                          <FontAwesomeIcon 
                            icon={ev.type === 'pdf' ? faFilePdf : ev.type === 'image' ? faImage : faLink} 
                            className={`text-xs ${ev.type === 'pdf' ? 'text-red-500' : 'text-inkMuted'}`}
                          />
                          <span className="text-sm">{ev.label}</span>
                          <span className="text-[10px] text-inkMuted uppercase">{ev.type}</span>
                        </div>
                        <button onClick={() => removeEvidenceFromWidget(i)} className="text-red-600 text-xs hover:underline">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Drag and drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={handleFileDrop}
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition-all mb-3 ${
                    isDraggingFile 
                      ? 'border-accent bg-accent/5' 
                      : 'border-stone/30 hover:border-stone/50'
                  }`}
                >
                  {uploadingFile ? (
                    <div className="flex items-center justify-center gap-2 text-inkMuted">
                      <div className="animate-spin h-4 w-4 border-2 border-accent border-t-transparent rounded-full" />
                      <span className="text-sm">Uploading...</span>
                    </div>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCloudUploadAlt} className="text-2xl text-inkMuted mb-2" />
                      <p className="text-sm text-inkMuted">
                        Drag & drop PDF or image files here
                      </p>
                      <p className="text-xs text-inkMuted mt-1">or</p>
                      <label className="inline-block mt-2 px-4 py-2 text-sm rounded bg-stone/10 hover:bg-stone/20 cursor-pointer transition-colors">
                        <input
                          type="file"
                          accept=".pdf,image/*"
                          onChange={handleFileInput}
                          className="hidden"
                        />
                        Browse files
                      </label>
                    </>
                  )}
                </div>

                <p className="text-xs text-inkMuted mb-2">Or add a link manually:</p>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={evidenceForm.type}
                    onChange={(e) => setEvidenceForm((f) => ({ ...f, type: e.target.value as EvidenceItemType }))}
                    className="px-3 py-2 rounded border border-stone/30 text-sm"
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
                </div>
                <button
                  onClick={addEvidenceToWidget}
                  className="mt-2 px-4 py-2 text-sm rounded bg-ink text-white"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Add Evidence
                </button>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-stone/20 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowAddWidgetPanel(false)} className="px-4 py-2 rounded-lg border border-stone/30">
                Cancel
              </button>
              <button onClick={saveWidget} className="px-4 py-2 rounded-lg bg-accent text-white">
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                {editingWidgetId ? 'Update' : 'Add'} Widget
              </button>
            </div>
          </div>
        </div>
      )}

      {/* People Panel */}
      {showPeoplePanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowPeoplePanel(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-stone/20 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-ink">People Library</h2>
              <button onClick={() => setShowPeoplePanel(false)} className="p-2 hover:bg-stone/10 rounded">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="border border-stone/20 rounded-xl p-4 space-y-3">
                <h3 className="font-medium text-ink text-sm">{editingPersonId ? 'Edit Person' : 'Add New Person'}</h3>
                
                {/* Image preview */}
                <div className="flex items-center gap-4">
                  {personForm.imageUrl ? (
                    <img 
                      src={personForm.imageUrl} 
                      alt="Preview" 
                      className="h-16 w-16 rounded-full object-cover border-2 border-stone/20"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-stone/10 flex items-center justify-center text-inkMuted text-lg">
                      {personForm.name ? personForm.name.charAt(0).toUpperCase() : '?'}
                    </div>
                  )}
                  <div className="flex-1">
                    <button
                      onClick={() => { setMediaPickerTarget('person'); setShowMediaPicker(true); }}
                      className="px-4 py-2 rounded-lg border border-stone/30 hover:bg-stone/10 text-sm flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faImage} />
                      {personForm.imageUrl ? 'Change Photo' : 'Add Photo'}
                    </button>
                    {personForm.imageUrl && (
                      <button
                        onClick={() => setPersonForm((f) => ({ ...f, imageUrl: '' }))}
                        className="ml-2 text-xs text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-inkMuted mb-1">Name *</label>
                    <input
                      value={personForm.name}
                      onChange={(e) => setPersonForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Full name"
                      className="w-full px-3 py-2 rounded border border-stone/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-inkMuted mb-1">Title / Role</label>
                    <input
                      value={personForm.title || ''}
                      onChange={(e) => setPersonForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder="e.g., Financier, Attorney"
                      className="w-full px-3 py-2 rounded border border-stone/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-inkMuted mb-1">Image URL (optional)</label>
                  <input
                    value={personForm.imageUrl || ''}
                    onChange={(e) => setPersonForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://example.com/photo.jpg"
                    className="w-full px-3 py-2 rounded border border-stone/30 text-sm"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={savePerson} className="px-4 py-2 rounded bg-accent text-white text-sm flex items-center gap-2">
                    <FontAwesomeIcon icon={editingPersonId ? faCheck : faPlus} />
                    {editingPersonId ? 'Update Person' : 'Add Person'}
                  </button>
                  {editingPersonId && (
                    <button
                      onClick={() => { setPersonForm({ id: '', name: '', title: '', imageUrl: '' }); setEditingPersonId(null); }}
                      className="px-4 py-2 rounded border border-stone/30 text-sm"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-ink text-sm mb-3">People Library ({people.length})</h3>
                <p className="text-xs text-inkMuted mb-3">
                  People you add here can be tagged on any widget (timeline events, documents, etc.)
                </p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {people.map((person) => (
                    <div key={person.id} className="flex items-center justify-between p-3 border border-stone/20 rounded-xl hover:bg-stone/5">
                      <div className="flex items-center gap-3">
                        {person.imageUrl ? (
                          <img src={person.imageUrl} alt={person.name} className="h-10 w-10 rounded-full object-cover border border-stone/20" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-stone/10 flex items-center justify-center text-inkMuted">
                            {person.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-ink">{person.name}</p>
                          {person.title && <p className="text-xs text-inkMuted">{person.title}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setPersonForm({ ...person }); setEditingPersonId(person.id); }}
                          className="text-xs text-accent hover:underline"
                        >
                          Edit
                        </button>
                        <button onClick={() => deletePerson(person.id)} className="text-xs text-red-600 hover:underline">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  {people.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-stone/30 rounded-xl">
                      <FontAwesomeIcon icon={faUser} className="text-2xl text-inkMuted mb-2" />
                      <p className="text-sm text-inkMuted">No people added yet</p>
                      <p className="text-xs text-inkMuted mt-1">Add people to tag them on widgets</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Connection Panel */}
      {showConnectionPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowConnectionPanel(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-stone/20 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-ink">{editingConnectionId ? 'Edit Connection' : 'Add Connection'}</h2>
              <button onClick={() => setShowConnectionPanel(false)} className="p-2 hover:bg-stone/10 rounded">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">From Widget</label>
                  <select
                    value={connectionForm.from}
                    onChange={(e) => setConnectionForm((f) => ({ ...f, from: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-stone/30"
                  >
                    <option value="">Select widget</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-1">To Widget</label>
                  <select
                    value={connectionForm.to}
                    onChange={(e) => setConnectionForm((f) => ({ ...f, to: e.target.value }))}
                    className="w-full px-4 py-2 rounded-lg border border-stone/30"
                  >
                    <option value="">Select widget</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>{n.title}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Connection Label *</label>
                <input
                  value={connectionForm.label}
                  onChange={(e) => setConnectionForm((f) => ({ ...f, label: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-stone/30"
                  placeholder="e.g., Known associate, Traveled to..."
                />
              </div>

              {/* Evidence */}
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Evidence</label>
                {(connectionForm.evidence?.length || 0) > 0 && (
                  <div className="space-y-2 mb-3">
                    {connectionForm.evidence?.map((ev, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-stone/5 rounded">
                        <span className="text-sm">{ev.label}</span>
                        <button onClick={() => removeEvidenceFromConnection(i)} className="text-red-600 text-xs">
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={evidenceForm.type}
                    onChange={(e) => setEvidenceForm((f) => ({ ...f, type: e.target.value as EvidenceItemType }))}
                    className="px-3 py-2 rounded border border-stone/30 text-sm"
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
                </div>
                <button
                  onClick={addEvidenceToConnection}
                  className="mt-2 px-4 py-2 text-sm rounded bg-ink text-white"
                >
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Add Evidence
                </button>
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-stone/20 px-6 py-4 flex justify-end gap-3">
              <button onClick={() => setShowConnectionPanel(false)} className="px-4 py-2 rounded-lg border border-stone/30">
                Cancel
              </button>
              <button onClick={saveConnection} className="px-4 py-2 rounded-lg bg-accent text-white">
                <FontAwesomeIcon icon={faCheck} className="mr-2" />
                {editingConnectionId ? 'Update' : 'Add'} Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettingsPanel && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowSettingsPanel(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-stone/20 px-6 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-ink">Board Settings</h2>
              <button onClick={() => setShowSettingsPanel(false)} className="p-2 hover:bg-stone/10 rounded">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Board Title</label>
                <input
                  value={boardTitle}
                  onChange={(e) => setBoardTitle(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-stone/30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Description</label>
                <textarea
                  value={boardDescription}
                  onChange={(e) => setBoardDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-stone/30"
                />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg border border-stone/20">
                <div>
                  <p className="font-medium text-ink">Public Visibility</p>
                  <p className="text-xs text-inkMuted">Toggle to hide/show the board publicly</p>
                </div>
                <button
                  onClick={() => setIsActive(!isActive)}
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-stone/10 text-inkMuted border border-stone/30'
                  }`}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
            <div className="border-t border-stone/20 px-6 py-4 flex justify-end">
              <button onClick={() => setShowSettingsPanel(false)} className="px-4 py-2 rounded-lg bg-accent text-white">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker */}
      <MediaPicker
        isOpen={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={handleMediaSelect}
        filterType="image"
      />
    </div>
  );
}
