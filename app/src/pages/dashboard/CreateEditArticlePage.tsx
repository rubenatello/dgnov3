import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Timestamp, doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../components/DashboardLayout';
import { ArticleEditor } from '../../components/ArticleEditor';
import TagInput from '../../components/TagInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import type { Article, ArticleStatus } from '../../types/models';
import { SECTIONS } from '../../types/models';
import { updateTagUsageCounts, incrementTagUsage } from '../../services/tagService';
import { createOrGetTag } from '../../services/tagService';
import { getWritersAndEditors } from '../../services/userService';
import type { StaffUser } from '../../services/userService';
import { createArticle, updateArticle, publishArticle } from '../../services/articleService';
import MediaPicker from '../../components/MediaPicker';


export default function CreateEditArticlePage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { userData } = useAuth();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState<string>('');
  const [section, setSection] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [originalTags, setOriginalTags] = useState<string[]>([]);
  const [featuredImageId, setFeaturedImageId] = useState<string | undefined>(undefined);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | undefined>(undefined);
  const [isBreaking, setIsBreaking] = useState<boolean>(false);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [authorId, setAuthorId] = useState<string | undefined>(undefined);
  const [coAuthorId, setCoAuthorId] = useState<string | undefined>(undefined);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [articleStatus, setArticleStatus] = useState<ArticleStatus | undefined>(undefined);

  // Autosave state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autosaveTimerRef = useRef<number | null>(null);

  // Load article if editing
  useEffect(() => {
    if (isEditing && id) {
      loadArticle(id);
    }
    // Load writers/editors for author selects
    (async () => {
      const s = await getWritersAndEditors();
      setStaffUsers(s);
    })();
  }, [id, isEditing]);

  // No localStorage - always start fresh for new articles

  // Auto-create main article when user starts typing (only once)
  const createArticleRef = useRef(false);
  
  useEffect(() => {
    if (!draftId && userData && !isEditing && title.trim() && !createArticleRef.current) {
      createArticleRef.current = true; // Prevent multiple calls
      
      (async () => {
        try {
          // Create main article document ONCE when title is entered
          const initial = {
            authorId: userData.id,
            title: title,
            subtitle: subtitle || '',
            summary: summary || '',
            content: content || '',
            section: section || '',
            tags: tags || [],
            featuredImageId: featuredImageId || null,
            status: 'draft', // This is the main article in draft status
            createdAt: serverTimestamp(),
            lastUpdatedAt: serverTimestamp(),
            slug: generateSlug(title),
          };

          const docRef = await addDoc(collection(db, 'articles'), initial);
          const newArticleId = docRef.id;
          
          setDraftId(newArticleId);
          setLastSaved(new Date());
        } catch (err) {
          console.error('Failed to create article:', err);
          createArticleRef.current = false; // Reset on error
        }
      })();
    }
  }, [title, userData, draftId, isEditing]); // Simplified dependencies

  // Simple Autosave: updates the same article document every 3 seconds
  useEffect(() => {
    if (!draftId || isAutoSaving || !userData) return;

    // Clear existing timer
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }

    // Set new timer for 3 seconds
    autosaveTimerRef.current = window.setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        // Update the main article document with current content
        await updateArticle(draftId, {
          title,
          subtitle,
          summary,
          content,
          section,
          tags,
          featuredImageId,
          featuredImageUrl,
          slug: title ? generateSlug(title) : `untitled-${Date.now()}`,
        }, userData.id || '');
        setLastSaved(new Date());
      } catch (err) {
        console.error('Autosave failed:', err);
      } finally {
        setIsAutoSaving(false);
      }
    }, 3000);

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [draftId, title, subtitle, summary, content, section, tags, featuredImageId, userData, isAutoSaving]);

  async function loadArticle(articleId: string) {
    try {
      const docRef = doc(db, 'articles', articleId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<Article & { featuredImageUrl?: string }>;
        setTitle(data.title || '');
        setSubtitle(data.subtitle || '');
        setSummary(data.summary || '');
        setContent(data.content || '');
        setSection(data.section || '');
        setTags(data.tags || []);
        setOriginalTags(data.tags || []);
        setFeaturedImageId(data.featuredImageId || undefined);
        setFeaturedImageUrl(data.featuredImageUrl || undefined);
        setDraftId(articleId);
        setArticleStatus(data.status as ArticleStatus | undefined);
        setAuthorId(data.authorId || undefined);
        setCoAuthorId((data as unknown as Partial<Record<string, unknown>>).coAuthorId as string | undefined || undefined);
  setIsBreaking(!!data.breakingUntil && ((data.breakingUntil as unknown as Timestamp).toDate ? (data.breakingUntil as unknown as Timestamp).toDate() > new Date() : new Date(String(data.breakingUntil)) > new Date()));
      } else {
        setError('Article not found');
      }
    } catch (err) {
      console.error('Error loading article:', err);
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  }

  function generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  async function handleSave(saveStatus: ArticleStatus) {
    if (!title.trim() || !summary.trim()) {
      return setError('Title and summary are required');
    }

    setSaving(true);
    setError('');

    try {
      const slug = generateSlug(title);
      const now = Timestamp.fromDate(new Date());

      const articleData: Omit<Article, 'id'> = {
        title,
        slug,
        subtitle,
        summary,
        content,
        section,
        tags,
        authorId: authorId || userData?.id || '',
        coAuthorId: coAuthorId || undefined,
        status: saveStatus,
        lastUpdatedAt: now,
        lastUpdatedBy: userData?.id || '',
        createdAt: isEditing ? (await getDoc(doc(db, 'articles', id!))).data()?.createdAt || now : now,
        featuredImageId,
        featuredImageUrl,
      };
      // If publishing and breaking toggle is enabled set breakingRequested flag; Cloud Function will set breakingUntil server-side
      if (saveStatus === 'published' && isBreaking) {
        (articleData as Partial<Record<string, unknown>>).breakingRequested = true;
      } else if (saveStatus === 'published' && !isBreaking) {
        (articleData as Partial<Record<string, unknown>>).breakingRequested = false;
      }

      // Include author/coauthor display names
      const authorObj = staffUsers.find(u => u.id === (authorId || userData?.id));
      if (authorObj) {
        (articleData as Partial<Record<string, unknown>>).authorName = authorObj.displayName;
      }
      if (coAuthorId) {
        const coObj = staffUsers.find(u => u.id === coAuthorId);
        if (coObj) (articleData as Partial<Record<string, unknown>>).coAuthorName = coObj.displayName;
      }

      if (draftId) {
        // We have the main article - update or publish it
        if (saveStatus === 'published' && userData) {
          // Ensure tag documents exist before publishing
          try {
            await Promise.all(tags.map(t => createOrGetTag(t, userData.id!)));
          } catch (e) {
            console.warn('Could not ensure tag docs:', e);
          }
          
          // Publish via transaction (updates the main article document)
          await publishArticle(draftId, articleData as Partial<Article>, userData.id || '');
          await updateTagUsageCounts(originalTags, tags);
          
          // Article is now published - no localStorage cleanup needed
        } else {
          // Regular update to the main article document
          await updateArticle(draftId, articleData as Partial<Article>, userData?.id || '');
        }
      } else if (isEditing && id) {
        // Editing existing article
        if (saveStatus === 'published') {
          await publishArticle(id, articleData as Partial<Article>, userData?.id || '');
        } else {
          await updateArticle(id, articleData as Partial<Article>, userData?.id || '');
        }
        await updateTagUsageCounts(originalTags, tags);
      } else {
        // This case should rarely happen now since we auto-create the main article
        // But handle direct publish for safety
        if (saveStatus === 'published') {
          const newId = await createArticle(articleData as Omit<Article, 'id' | 'createdAt' | 'lastUpdatedAt' | 'slug'>);
          await publishArticle(newId, { publishedAt: now }, userData?.id || '');
          await Promise.all(tags.map(tag => incrementTagUsage(tag)));
        } else {
          // Create main article document
          const newId = await createArticle(articleData as Omit<Article, 'id' | 'createdAt' | 'lastUpdatedAt' | 'slug'>);
          setDraftId(newId);
          await Promise.all(tags.map(tag => incrementTagUsage(tag)));
        }
      }

      // Update local status
      if (saveStatus === 'published') setArticleStatus('published');
      navigate('/dashboard/articles');
    } catch (err) {
      console.error('Error saving article:', err);
      setError('Failed to save article');
    } finally {
      setSaving(false);
    }
  }



  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center text-inkMuted py-12">Loading article...</div>
      </DashboardLayout>
    );
  }

  const getAutosaveStatus = () => {
    if (isAutoSaving) return 'Saving...';
    if (lastSaved) {
      const minutes = Math.floor((Date.now() - lastSaved.getTime()) / 60000);
      if (minutes === 0) return 'Saved just now';
      return `Saved ${minutes} min ago`;
    }
    return draftId ? 'Ready to save' : 'Start typing to create draft';
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/articles')}
              className="text-inkMuted hover:text-ink transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <div>
              <h1 className="text-2xl font-heading font-bold text-ink">
                {isEditing ? 'Edit Article' : 'Create New Article'}
              </h1>
              {featuredImageUrl && (
                <div className="mt-2">
                  <img src={featuredImageUrl} alt="Featured" className="w-48 h-28 object-cover rounded border" />
                </div>
              )}
            </div>
          </div>
          <div>
            <button className="px-3 py-2 bg-stone rounded mr-2" onClick={() => setShowMediaPicker(true)}>
              Select Featured Image
            </button>
            <button 
              className="px-3 py-2 bg-accent text-white rounded" 
              onClick={() => { setFeaturedImageId(undefined); setFeaturedImageUrl(undefined); }}
            >
              Remove
            </button>
          </div>
        </div>

        <MediaPicker
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={(m) => { 
            setFeaturedImageId(m.id); 
            setFeaturedImageUrl(m.url); 
            setShowMediaPicker(false); 
          }}
        />

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Simple Autosave Status */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              <FontAwesomeIcon icon={faSave} className="mr-2" />
              {getAutosaveStatus()}
            </span>
            {draftId && (
              <span className="text-xs text-blue-500">
                Article ID: {draftId.substring(0, 8)}...
              </span>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Title *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full border border-stone rounded px-4 py-2 focus:ring-2 focus:ring-accent text-lg"
              placeholder="Enter article title"
              required
            />
            {title && (
              <p className="mt-2 text-sm text-gray-500">
                Article slug: /articles/{new Date().getFullYear()}/{String(new Date().getMonth() + 1).padStart(2, '0')}/{String(new Date().getDate()).padStart(2, '0')}/{generateSlug(title)}
              </p>
            )}
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
              className="w-full border border-stone rounded px-4 py-2 focus:ring-2 focus:ring-accent"
              placeholder="Optional subtitle"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Summary * (max 300 chars)</label>
            <textarea
              value={summary}
              onChange={e => setSummary(e.target.value)}
              maxLength={300}
              rows={3}
              className="w-full border border-stone rounded px-4 py-2 focus:ring-2 focus:ring-accent"
              placeholder="Brief summary for article cards and SEO"
              required
            />
            <div className="text-xs text-inkMuted mt-1">{summary.length}/300</div>
          </div>

          {/* Section */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Section/Category</label>
            <select
              value={section}
              onChange={e => setSection(e.target.value)}
              className="w-full border border-stone rounded px-4 py-2 focus:ring-2 focus:ring-accent bg-white"
            >
              <option value="">Select a section...</option>
              {SECTIONS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Author / Co-author */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Author</label>
            <select
              value={authorId}
              onChange={e => setAuthorId(e.target.value || undefined)}
              className="w-full border border-stone rounded px-4 py-2 focus:ring-2 focus:ring-accent bg-white"
            >
              <option value="">(Default: current user)</option>
              {staffUsers.map(u => (
                <option key={u.id} value={u.id}>{u.displayName}</option>
              ))}
            </select>
            <div className="mt-3">
              <label className="block text-sm font-medium text-ink mb-2">Co-author (optional)</label>
              <select
                value={coAuthorId}
                onChange={e => setCoAuthorId(e.target.value || undefined)}
                className="w-full border border-stone rounded px-4 py-2 focus:ring-2 focus:ring-accent bg-white"
              >
                <option value="">None</option>
                {staffUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.displayName}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Tags
              <span className="text-xs text-gray-500 ml-2">(for SEO and metadata)</span>
            </label>
            <TagInput tags={tags} onTagsChange={setTags} />
          </div>

          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Content</label>
            <div className="border border-stone rounded overflow-hidden">
              <ArticleEditor 
                content={content} 
                onChange={setContent} 
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t border-stone">
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={isBreaking} onChange={e => setIsBreaking(e.target.checked)} />
              <span className="font-medium">BREAKING NEWS?</span>
              <span className="text-xs text-accent font-style: italic">(If checked, article shows in Breaking section for 3 hours after publish)</span>
            </label>

            <div className="flex gap-3">
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="flex-1 bg-stone text-ink px-6 py-3 rounded-lg font-medium hover:bg-opacity-80 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faSave} />
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              onClick={() => handleSave('review')}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faSave} />
              Submit for Review
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={saving}
              className="flex-1 bg-accent text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faSave} />
              {articleStatus === 'published' ? 'Update Now' : 'Publish Now'}
            </button>
          </div>
        </div>
      </div>
      </div>
    </DashboardLayout>
  );
}
