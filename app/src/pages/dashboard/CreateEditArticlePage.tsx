import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Timestamp, doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { ArticleEditor } from '../../components/dashboard/ArticleEditor';
import TagInput from '../../components/dashboard/TagInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft, faImage, faTimes, faUser, faTag, faNewspaper, faBolt, faEye, faClock, faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import type { Article, ArticleStatus } from '../../types/models';
import { SECTIONS } from '../../types/models';
import { updateTagUsageCounts, incrementTagUsage } from '../../services/tagService';
import { createOrGetTag } from '../../services/tagService';
import { getWritersAndEditors } from '../../services/userService';
import type { StaffUser } from '../../services/userService';
import { createArticle, updateArticle, publishArticle } from '../../services/articleService';
import MediaPicker from '../../components/MediaPicker';
import { estimateReadingTime } from '../../utils/helpers';


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
  const [featuredImageDescription, setFeaturedImageDescription] = useState<string | undefined>(undefined);
  const [featuredImageSourceCredit, setFeaturedImageSourceCredit] = useState<string | undefined>(undefined);
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
  }, [content, draftId, featuredImageId, isEditing, section, subtitle, summary, tags, title, userData]);

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
  }, [draftId, title, subtitle, summary, content, section, tags, featuredImageId, featuredImageUrl, userData, isAutoSaving]);

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
        setFeaturedImageDescription(data.featuredImageDescription || undefined);
        setFeaturedImageSourceCredit(data.featuredImageSourceCredit || undefined);
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
        featuredImageDescription,
        featuredImageSourceCredit
      };
      // If publishing, always set breakingRequested explicitly
      if (saveStatus === 'published') {
        (articleData as Partial<Record<string, unknown>>).breakingRequested = !!isBreaking;
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
      <div className="w-full">
        {/* Header */}
        <div className="mb-4 bg-white rounded-xl border border-stone p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard/articles')}
                className="w-9 h-9 rounded-lg bg-stone/50 flex items-center justify-center text-inkMuted hover:text-ink hover:bg-stone transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
              </button>
              <div>
                <h1 className="text-xl font-heading font-bold text-ink">
                  {isEditing ? 'Edit Article' : 'Create New Article'}
                </h1>
                <p className="text-xs text-inkMuted">
                  {isEditing ? 'Update your existing article' : 'Write and publish a new story'}
                </p>
              </div>
            </div>
            
            {/* Autosave Status Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium ${
              isAutoSaving ? 'bg-blue-100 text-blue-700' : lastSaved ? 'bg-green-100 text-green-700' : 'bg-stone/50 text-inkMuted'
            }`}>
              <FontAwesomeIcon icon={isAutoSaving ? faClock : lastSaved ? faCheckCircle : faSave} className="text-xs" />
              {getAutosaveStatus()}
            </div>
          </div>
        </div>

        <MediaPicker
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={(m) => { 
            setFeaturedImageId(m.id); 
            setFeaturedImageUrl(m.url); 
            setFeaturedImageDescription(m.description);
            setFeaturedImageSourceCredit(m.sourceCredit);
            setShowMediaPicker(false); 
          }}
        />

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-sm" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Main Content - Takes 3 columns on xl */}
          <div className="xl:col-span-3 space-y-4">
            {/* Title & Subtitle Card */}
            <div className="bg-white rounded-xl border border-stone p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-accent/10 flex items-center justify-center">
                  <FontAwesomeIcon icon={faNewspaper} className="text-accent text-xs" />
                </div>
                <h2 className="text-sm font-semibold text-ink">Article Details</h2>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Title *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full border border-stone rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-accent focus:border-accent text-base font-medium transition-colors"
                    placeholder="Enter article title"
                    required
                  />
                  {title && (
                    <p className="mt-1.5 text-xs text-inkMuted bg-stone/30 rounded px-2 py-1 inline-block">
                      <span className="font-medium">URL:</span> /article/{new Date().getFullYear()}/{String(new Date().getMonth() + 1).padStart(2, '0')}/{String(new Date().getDate()).padStart(2, '0')}/{generateSlug(title)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={e => setSubtitle(e.target.value)}
                    className="w-full border border-stone rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent focus:border-accent transition-colors text-sm"
                    placeholder="Optional subtitle for more context"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">
                    Summary * 
                    <span className="text-inkMuted font-normal ml-1">({summary.length}/300)</span>
                  </label>
                  <textarea
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    maxLength={300}
                    rows={2}
                    className="w-full border border-stone rounded-lg px-3 py-2 focus:ring-2 focus:ring-accent focus:border-accent transition-colors resize-none text-sm"
                    placeholder="Brief summary for article cards and SEO"
                    required
                  />
                  <div className="h-1 bg-stone rounded-full mt-1 overflow-hidden">
                    <div 
                      className={`h-full transition-all ${summary.length > 250 ? 'bg-orange-500' : summary.length > 150 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${(summary.length / 300) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Content Editor Card */}
            <div className="bg-white rounded-xl border border-stone p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-purple-100 flex items-center justify-center">
                    <FontAwesomeIcon icon={faNewspaper} className="text-purple-600 text-xs" />
                  </div>
                  <h2 className="text-sm font-semibold text-ink">Content</h2>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-accent font-medium">
                  <FontAwesomeIcon icon={faClock} className="text-xs" />
                  {estimateReadingTime(content)}
                </div>
              </div>
              
              <div className="border border-stone rounded-lg overflow-hidden">
                <ArticleEditor 
                  content={content} 
                  onChange={setContent} 
                />
              </div>
            </div>
          </div>

          {/* Sidebar - Takes 1 column on xl */}
          <div className="space-y-4">
            {/* Featured Image Card */}
            <div className="bg-white rounded-xl border border-stone p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-pink-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faImage} className="text-pink-600 text-xs" />
                </div>
                <h2 className="text-sm font-semibold text-ink">Featured Image</h2>
              </div>
              
              <div className="relative aspect-video rounded-lg overflow-hidden bg-stone/30 border-2 border-dashed border-stone">
                {featuredImageUrl ? (
                  <>
                    <img
                      src={featuredImageUrl}
                      alt="Featured"
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => { setFeaturedImageId(undefined); setFeaturedImageUrl(undefined); }}
                      className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center justify-center"
                    >
                      <FontAwesomeIcon icon={faTimes} className="text-xs" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-inkMuted">
                    <FontAwesomeIcon icon={faImage} className="text-2xl mb-1" />
                    <span className="text-xs">No image</span>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setShowMediaPicker(true)}
                className="w-full mt-3 px-3 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faImage} className="text-xs" />
                {featuredImageUrl ? 'Change' : 'Select Image'}
              </button>
            </div>

            {/* Section & Authors Card */}
            <div className="bg-white rounded-xl border border-stone p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-blue-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faUser} className="text-blue-600 text-xs" />
                </div>
                <h2 className="text-sm font-semibold text-ink">Publishing</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Section</label>
                  <select
                    value={section}
                    onChange={e => setSection(e.target.value)}
                    className="w-full border border-stone rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent bg-white"
                  >
                    <option value="">Select...</option>
                    {SECTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Author</label>
                  <select
                    value={authorId}
                    onChange={e => setAuthorId(e.target.value || undefined)}
                    className="w-full border border-stone rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent bg-white"
                  >
                    <option value="">(Current user)</option>
                    {staffUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.displayName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink mb-1">Co-author</label>
                  <select
                    value={coAuthorId}
                    onChange={e => setCoAuthorId(e.target.value || undefined)}
                    className="w-full border border-stone rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-accent bg-white"
                  >
                    <option value="">None</option>
                    {staffUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.displayName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Tags Card */}
            <div className="bg-white rounded-xl border border-stone p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded bg-green-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faTag} className="text-green-600 text-xs" />
                </div>
                <h2 className="text-sm font-semibold text-ink">Tags</h2>
              </div>
              <TagInput tags={tags} onTagsChange={setTags} />
            </div>

            {/* Actions Card */}
            <div className="bg-white rounded-xl border border-stone p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-amber-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faBolt} className="text-amber-600 text-xs" />
                </div>
                <h2 className="text-sm font-semibold text-ink">Publish</h2>
              </div>

              {/* Breaking News Toggle */}
              <label className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg mb-3 cursor-pointer hover:bg-red-100 transition-colors">
                <input 
                  type="checkbox" 
                  checked={isBreaking} 
                  onChange={e => setIsBreaking(e.target.checked)} 
                  className="w-4 h-4 text-red-600 rounded border-red-300 focus:ring-red-500"
                />
                <div>
                  <span className="font-semibold text-red-700 text-xs flex items-center gap-1">
                    <FontAwesomeIcon icon={faBolt} className="text-xs" />
                    BREAKING
                  </span>
                  <span className="text-xs text-red-600 block">3hr featured</span>
                </div>
              </label>

              <div className="space-y-2">
                <button
                  onClick={() => handleSave('draft')}
                  disabled={saving}
                  className="w-full bg-stone text-ink px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-stone/80 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faSave} className="text-xs" />
                  {saving ? 'Saving...' : 'Save Draft'}
                </button>
                
                <button
                  onClick={() => handleSave('review')}
                  disabled={saving}
                  className="w-full bg-blue-600 text-white px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faEye} className="text-xs" />
                  Submit Review
                </button>
                
                <button
                  onClick={() => handleSave('published')}
                  disabled={saving}
                  className="w-full bg-gradient-to-r from-accent to-purple-600 text-white px-3 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                >
                  <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                  {articleStatus === 'published' ? 'Update' : 'Publish'}
                </button>
              </div>

              {draftId && (
                <p className="text-xs text-inkMuted text-center mt-2">
                  ID: {draftId.substring(0, 8)}...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
