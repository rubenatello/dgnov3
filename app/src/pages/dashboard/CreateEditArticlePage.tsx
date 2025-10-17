import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Timestamp, doc, getDoc, addDoc, updateDoc, collection } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import TiptapEditor from '../../components/TiptapEditor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import type { Article, ArticleStatus } from '../../types/models';

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
  const [content, setContent] = useState<object>({});
  const [section, setSection] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

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
        const data = docSnap.data() as Article;
        setTitle(data.title);
        setSubtitle(data.subtitle || '');
        setSummary(data.summary);
        setContent(data.content);
        setSection(data.section || '');
        setTags(data.tags || []);
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

  function handleAddTag() {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  }

  function handleRemoveTag(tag: string) {
    setTags(tags.filter(t => t !== tag));
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
      };

      if (isEditing && id) {
        await updateDoc(doc(db, 'articles', id), articleData as Partial<Article>);
      } else {
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
            <h1 className="text-2xl font-heading font-bold text-ink">
              {isEditing ? 'Edit Article' : 'Create New Article'}
            </h1>
          </div>
        </div>

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
            <label className="block text-sm font-medium text-ink mb-2">Section</label>
            <input
              type="text"
              value={section}
              onChange={e => setSection(e.target.value)}
              className="w-full border border-stone rounded px-4 py-2 focus:ring-2 focus:ring-accent"
              placeholder="e.g., Politics, Technology, World"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                className="flex-1 border border-stone rounded px-4 py-2 focus:ring-2 focus:ring-accent"
                placeholder="Type a tag and press Enter"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-stone text-ink rounded hover:bg-accent hover:text-white transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-2 px-3 py-1 bg-accent bg-opacity-10 text-accent rounded-full text-sm">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Content</label>
            <div className="border border-stone rounded overflow-hidden">
              <TiptapEditor 
                content={JSON.stringify(content)} 
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
