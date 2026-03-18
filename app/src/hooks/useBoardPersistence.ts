import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type {
  InvestigationPerson,
  InvestigationLocation,
  TimelineEvent,
  InvestigationsBoardPayload,
} from '../types/investigations';

const BOARD_DOC_ID = 'epstein-files';
const AUTO_SAVE_DELAY_MS = 30_000; // 30 seconds

export interface BoardData {
  title: string;
  description: string;
  people: InvestigationPerson[];
  locations: InvestigationLocation[];
  events: TimelineEvent[];
  isActive: boolean;
}

interface UseBoardPersistenceOptions {
  canEdit: boolean;
  userEmail?: string;
}

interface UseBoardPersistenceReturn {
  loading: boolean;
  saving: boolean;
  isDirty: boolean;
  saveMessage: string | null;
  boardData: BoardData;
  setBoardData: React.Dispatch<React.SetStateAction<BoardData>>;
  markDirty: () => void;
  saveBoard: () => Promise<void>;
}

const defaultBoardData: BoardData = {
  title: 'Epstein Files – Investigations Board',
  description:
    'Interactive investigations board for organizing people, locations, and timeline events with verifiable sources.',
  people: [],
  locations: [],
  events: [],
  isActive: false,
};

/**
 * Handles loading, saving, dirty tracking, and auto-save for the investigation board.
 */
export function useBoardPersistence({
  canEdit,
  userEmail,
}: UseBoardPersistenceOptions): UseBoardPersistenceReturn {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [boardData, setBoardData] = useState<BoardData>(defaultBoardData);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Load ----
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'investigations', BOARD_DOC_ID));
        if (snapshot.exists()) {
          const data = snapshot.data() as InvestigationsBoardPayload;
          setBoardData({
            title: data.title || defaultBoardData.title,
            description: data.description || defaultBoardData.description,
            people: data.people || [],
            locations: data.locations || [],
            events: data.events || [],
            isActive: data.isActive ?? true,
          });
        }
      } catch (error) {
        console.error('Failed to load board:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBoard();
  }, []);

  // ---- Save ----
  const saveBoard = useCallback(async () => {
    if (!canEdit) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const payload: InvestigationsBoardPayload = {
        title: boardData.title,
        description: boardData.description,
        people: boardData.people,
        locations: boardData.locations,
        events: boardData.events,
        documents: [],
        isActive: boardData.isActive,
        updatedAt: serverTimestamp(),
        updatedBy: userEmail || 'unknown',
      };
      await setDoc(doc(db, 'investigations', BOARD_DOC_ID), payload);
      setIsDirty(false);
      setSaveMessage('Saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveMessage('Save failed!');
    } finally {
      setSaving(false);
    }
  }, [canEdit, boardData, userEmail]);

  // ---- Dirty tracking ----
  const markDirty = useCallback(() => {
    setIsDirty(true);
  }, []);

  // ---- Auto-save when dirty ----
  useEffect(() => {
    if (!isDirty || !canEdit) return;

    // Clear previous timer
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(() => {
      saveBoard();
    }, AUTO_SAVE_DELAY_MS);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [isDirty, canEdit, saveBoard]);

  // ---- Warn on unsaved changes before leaving ----
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  return {
    loading,
    saving,
    isDirty,
    saveMessage,
    boardData,
    setBoardData,
    markDirty,
    saveBoard,
  };
}
