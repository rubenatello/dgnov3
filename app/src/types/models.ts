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
] as const;

export type Section = typeof SECTIONS[number];

// User interface (replaces Author)
export interface User {
  id?: string; // Firebase Auth UID
  email: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  roles: UserRole[]; // Can have multiple roles
  isStaff: boolean; // true if user has writer/editor/admin/dev/superuser
  isActive: boolean; // Account active status
  createdAt: Timestamp;
  lastLoginAt?: Timestamp;
}

// Article interface
export interface Article {
  id?: string;
  title: string;
  slug: string;
  subtitle?: string;
  summary: string; // Max 300 characters
  content: string; // Tiptap HTML content
  featuredImageId?: string;
  section?: string;
  tags: string[];
  authorId: string;
  coAuthorId?: string;
  status: ArticleStatus;
  publishedAt?: Timestamp;
  lastUpdatedAt: Timestamp;
  lastUpdatedBy: string;
  createdAt: Timestamp;
}

// Media/Image interface
export interface Media {
  id?: string;
  url: string;
  title: string;
  description: string;
  alt: string; // Can default to description
  sourceCredit: string; // e.g., "AP / Getty Images"
  uploadedAt: Timestamp;
  uploadedBy: string;
  type: 'image' | 'video';
  usageCount?: number; // Track how many times used in articles
  lastUpdated?: Timestamp; // Last time metadata was updated
}

// Author interface (deprecated - use User instead)
// Kept for backward compatibility
export interface Author {
  id?: string;
  displayName: string;
  role: 'reader' | 'writer' | 'editor' | 'admin';
  avatarUrl?: string;
  bio?: string;
  email: string;
  createdAt: Timestamp;
}

// Comment interface
export interface Comment {
  id?: string;
  articleId: string;
  userId: string;
  body: string;
  status: 'pending' | 'approved' | 'hidden';
  createdAt: Timestamp;
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
  lastDonationAt: Timestamp;
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
  createdAt: Timestamp;
  createdBy: string; // User ID who created the tag
  lastUsed?: Timestamp; // Last time used in an article
}
