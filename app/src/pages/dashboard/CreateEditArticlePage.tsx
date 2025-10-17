import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Timestamp, doc, getDoc, addDoc, updateDoc, collection } from 'firebase/firestore';
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
  const [originalTags, setOriginalTags] = useState<string[]>([]); // Track original tags for usage count
  const [featuredImageId, setFeaturedImageId] = useState<string | undefined>(undefined);
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | undefined>(undefined);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Load article if editing
  useEffect(() => {
    if (isEditing && id) {
      loadArticle(id);
    }
  }, [id, isEditing]);

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
        setOriginalTags(data.tags || []); // Track original for usage count updates
        setFeaturedImageId(data.featuredImageId || undefined);
        setFeaturedImageUrl(data.featuredImageUrl || undefined);
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
        authorId: userData?.id || '',
        status: saveStatus,
        lastUpdatedAt: now,
        lastUpdatedBy: userData?.id || '',
        createdAt: isEditing ? (await getDoc(doc(db, 'articles', id!))).data()?.createdAt || now : now,
        ...(saveStatus === 'published' && { publishedAt: now }),
        featuredImageId,
      };

      if (isEditing && id) {
        // Update tag usage counts (increment new, decrement removed)
        await updateTagUsageCounts(originalTags, tags);
        await updateDoc(doc(db, 'articles', id), articleData as Partial<Article>);
      } else {
        // For new articles, increment usage for all tags
        await Promise.all(tags.map(tag => incrementTagUsage(tag)));
        await addDoc(collection(db, 'articles'), articleData);
      }

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
            <button className="px-3 py-2 bg-stone rounded mr-2" onClick={() => setShowMediaPicker(true)}>Select Featured Image</button>
            <button className="px-3 py-2 bg-accent text-white rounded" onClick={() => { setFeaturedImageId(undefined); setFeaturedImageUrl(undefined); }}>Remove</button>
          </div>
        </div>
        <MediaPicker
          isOpen={showMediaPicker}
          onClose={() => setShowMediaPicker(false)}
          onSelect={(m) => { setFeaturedImageId(m.id); setFeaturedImageUrl(m.url); setShowMediaPicker(false); }}
        />

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

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
          <div className="flex gap-3 pt-4 border-t border-stone">
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
              Publish Now
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
