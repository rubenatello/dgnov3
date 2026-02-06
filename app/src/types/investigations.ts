// ============================================
// Evidence & Documents
// ============================================
export type EvidenceItemType = 'pdf' | 'link' | 'image' | 'article';

export interface EvidenceItem {
  label: string;
  url: string;
  type: EvidenceItemType;
}

export interface InvestigationDocument {
  id: string;
  title: string;
  fileUrl: string;
  fileType: 'pdf' | 'image';
  sourceUrl?: string;
  dateObtained?: string;
  description?: string;
  // Backend managed
  createdBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// ============================================
// People
// ============================================
export interface InvestigationPerson {
  id: string;
  name: string;
  title?: string;
  bio?: string;
  imageUrl?: string;
  // Board position (optional - for when shown on board)
  x?: number;
  y?: number;
  // Backend managed
  createdBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  usageCount?: number;
}

// ============================================
// Locations
// ============================================
export interface InvestigationLocation {
  id: string;
  name: string;
  address: string;
  city?: string;
  state?: string;
  country?: string;
  imageUrl?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  // Board position (optional - for when shown on board)
  x?: number;
  y?: number;
  // Backend managed
  createdBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  usageCount?: number;
}

// ============================================
// Timeline Events (the connective tissue)
// ============================================
export type TimelineEventType = 
  | 'communication'  // Phone call, email, text
  | 'meeting'        // In-person meeting
  | 'travel'         // Flight, trip
  | 'transaction'    // Financial, gift
  | 'legal'          // Court, arrest, filing
  | 'media'          // News, interview
  | 'other';

export interface TimelineEvent {
  id: string;
  title: string;
  eventType: TimelineEventType;
  date: string;
  endDate?: string;  // For events spanning multiple days
  time?: string;
  description: string;
  // Tagged entities (creates connections)
  peopleIds: string[];
  locationIds: string[];
  // Attached evidence
  documents: EvidenceItem[];
  // Board position
  x: number;
  y: number;
  // Backend managed
  createdBy?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// ============================================
// Auto-generated Connections
// ============================================
export interface BoardConnection {
  id: string;
  fromType: 'person' | 'location' | 'event';
  fromId: string;
  toType: 'person' | 'location' | 'event';
  toId: string;
  label: string;
  eventId?: string; // The event that created this connection
}

// ============================================
// Legacy types (for backward compatibility)
// ============================================
export interface BoardNode {
  id: string;
  title: string;
  category: string;
  date: string;
  location?: string;
  summary: string;
  x: number;
  y: number;
  imageUrl?: string;
  people?: string[];
  evidence?: EvidenceItem[];
}

export interface BoardLink {
  id: string;
  from: string;
  to: string;
  label: string;
  evidence?: EvidenceItem[];
}

// ============================================
// Board Payload (what gets saved to Firestore)
// ============================================
export interface InvestigationsBoardPayload {
  title: string;
  description: string;
  // New structure
  people: InvestigationPerson[];
  locations: InvestigationLocation[];
  events: TimelineEvent[];
  documents: InvestigationDocument[];
  // Legacy (for backward compatibility)
  nodes?: BoardNode[];
  links?: BoardLink[];
  // Meta
  isActive?: boolean;
  updatedAt?: unknown;
  updatedBy?: string;
}
