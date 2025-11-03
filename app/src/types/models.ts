import { Timestamp } from 'firebase/firestore';

// User roles
export type UserRole = 'reader' | 'writer' | 'editor' | 'admin' | 'dev' | 'superuser';

// Article status options
export type ArticleStatus = 'draft' | 'review' | 'scheduled' | 'published';

// News sections/categories - fixed list for site navigation
export const SECTIONS = [
  'Politics',
  'Immigration',
  'Legislation',
  'Foreign Affairs',
  'Economy',
  'White House',
  'Courts',
  'Congress',
  'Human Rights',
  'Environment',
  'Business',
  'Tech',
  'Finance',
  'Opinion',
  'Sports',
  'Fact-Check',
  'Health',
  'Science'
  
] as const;

export type Section = typeof SECTIONS[number];

// User interface (replaces Author)
export interface User {
  id?: string; // Firebase Auth UID
  email: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  profileImageUrl?: string; // Alternative field name for profile images
  website?: string;
  twitter?: string;
  blueSky?: string;
  instagram?: string;
  linkedin?: string;
  roles: UserRole[]; // Can have multiple roles
  isStaff: boolean; // true if user has writer/editor/admin/dev/superuser
  isActive: boolean; // Account active status
  createdAt?: Timestamp;
  lastLoginAt?: Timestamp;
}

// Article interface
export interface Article {
  id?: string;
  title: string;
  slug: string;
  subtitle?: string;
  summary?: string; // Max 300 characters
  content?: string; // Tiptap HTML content
  featuredImageId?: string;
  featuredImageUrl?: string;
  featuredImageDescription?: string;
  featuredImageSourceCredit?: string;
  section?: string;
  tags?: string[];
  authorId?: string;
  coAuthorId?: string;
  authorName?: string;
  coAuthorName?: string;
  status?: ArticleStatus;
  publishedAt?: Timestamp;
  breakingUntil?: Timestamp | null;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  wordCount?: number; 
  breakingRequested?: boolean;
  lastUpdatedAt?: Timestamp;
  lastUpdatedBy?: string;
  createdAt?: Timestamp;
}

export interface LiveArticle {
  id?: string;
  title: string;
  slug: string; // URL-safe slug for the live article
  subtitle?: string;
  summary?: string; // Brief intro (max 300 chars)
  initialContent?: string; // Initial body text (optional, if not using threads for everything)
  featuredImageUrl?: string;
  featuredImageId?: string;
  featuredImageDescription?: string;
  featuredImageSourceCredit?: string;
  section?: Section; // From your SECTIONS list
  tags?: string[]; // Array of tag slugs
  authorId?: string; // Main author who started the live article
  authorName?: string;
  coAuthorId?: string; // Optional co-author
  coAuthorName?: string;
  status: 'open' | 'closed'; // 'open' for active updates, 'closed' when done
  createdAt: Timestamp;
  updatedAt: Timestamp; // Last update (either initial or latest thread)
  closedAt?: Timestamp; // Timestamp when closed (if status is 'closed')
  viewCount?: number;
  likeCount?: number;
  commentCount?: number; // For overall comments on the live article
  threads: LiveThread[]; // Array of threaded updates (see below)
}

// New interface for individual threads/updates
export interface LiveThread {
  id?: string; // Unique ID for the thread (e.g., auto-generated)
  body: string; // Text content of the update (max 500 chars?)
  images?: Media[]; // Array of images attached to this thread
  authorId: string; // Who added this thread
  authorName: string;
  createdAt: Timestamp;
  editedAt?: Timestamp; // If editable
  status?: 'active' | 'hidden'; // Optional: allow hiding threads
}

// Media/Image interface
export interface Media {
  id?: string;
  url: string;
  title: string;
  description: string;
  alt: string; // Can default to description
  sourceCredit: string; // e.g., "AP / Getty Images"
  uploadedAt?: Timestamp | Date;
  uploadedBy?: string;
  type?: 'image' | 'video';
  usageCount?: number; // Track how many times used in articles
  lastUpdated?: Timestamp | Date; // Last time metadata was updated
}

// Comment interface
export interface Comment {
  id?: string;
  articleId?: string;
  userId?: string;
  body?: string;
  status?: 'pending' | 'approved' | 'hidden';
  createdAt?: Timestamp;
  editedAt?: Timestamp;
}

// Reaction interface
export interface Reaction {
  id?: string; // Format: {articleId}_{userId}
  articleId: string;
  userId: string;
  kind: 'like';
  createdAt: Timestamp;
}

// Bookmark interface
export interface Bookmark {
  id?: string;
  userId: string;
  articleId: string;
  createdAt: Timestamp;
}

// DGNO (AI analysis) interface
export interface DGNOPayload {
  id?: string; // articleId
  articleId: string;
  payloadJSON: object;
  generatedAt: Timestamp;
  version: string;
}

// Donor interface
export interface Donor {
  id?: string; // userId
  userId: string;
  lastDonationAt?: Timestamp;
  stripeCustomerId?: string;
}

// Donation interface
export interface Donation {
  id?: string;
  userId: string;
  amount: number;
  currency: string;
  createdAt: Timestamp;
  recurring: boolean;
  stripePaymentIntent?: string;
}

// Tag interface - for SEO, metadata, and article categorization
export interface Tag {
  id?: string; // Auto-generated slug (e.g., "climate-change")
  name: string; // Display name (e.g., "Climate Change")
  slug: string; // URL-safe version
  usageCount: number; // How many articles use this tag
  createdAt?: Timestamp;
  createdBy?: string; // User ID who created the tag
  lastUsed?: Timestamp; // Last time used in an article
}

// Tracker interface - for tracking specific types of incidents/events
export interface Tracker {
  id?: string;
  name: string; // e.g., "ICE/CBP Involved Shootings 2025"
  slug: string; // URL-safe version
  description?: string; // What this tracker monitors
  createdAt: Timestamp;
  createdBy: string; // User ID who created the tracker
  updatedAt: Timestamp;
  isActive: boolean; // Can be disabled without deleting
  incidentCount?: number; // Total incidents tracked
}

// TrackerIncident interface - individual incidents within a tracker
export interface TrackerIncident {
  id?: string;
  trackerId: string; // References the parent tracker
  dateOfOccurrence: Timestamp; // When the incident happened
  location: string; // "Street, City, State" - long form text (legacy field)
  city?: string; // City name (structured field)
  state?: string; // State abbreviation (structured field)
  description: string; // Long form description of the event
  bodyCamAvailable: boolean; // Y/N if body cam footage exists
  bodyCamVideoId?: string; // Optional reference to Media object for video file
  bodyCamVideoUrl?: string; // Direct URL if uploaded elsewhere
  createdAt: Timestamp;
  createdBy: string; // User ID who added this incident
  updatedAt?: Timestamp;
  updatedBy?: string; // User ID who last updated
  status: 'active' | 'hidden'; // For moderation
}
