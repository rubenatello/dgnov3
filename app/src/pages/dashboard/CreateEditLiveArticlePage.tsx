import { useCallback, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import TagInput from '../../components/dashboard/TagInput';
import type { LiveArticle } from '../../types/models';
import { createLiveArticle, getLiveArticle, updateLiveArticle } from '../../services/liveArticleService';

export default function CreateEditLiveArticlePage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { userData, isEditor, isAdmin } = useAuth();

  const [formData, setFormData] = useState<Partial<LiveArticle>>({
    title: '',
    subtitle: '',
    summary: '',
    initialContent: '',
    featuredImageUrl: '',
    featuredImageId: '',
    featuredImageDescription: '',
    featuredImageSourceCredit: '',
    section: undefined,
    tags: [],
    status: 'open',
    authorId: userData?.id,
    authorName: userData?.displayName,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadLiveArticle = useCallback(async (articleId: string) => {
    setLoading(true);
    try {
      const article = await getLiveArticle(articleId);
      if (article) {
        // Check permissions: writers can edit their own, editors/admins can edit any
        if (!isEditor() && !isAdmin() && article.authorId !== userData?.id) {
          alert('You do not have permission to edit this live article.');
          navigate('/dashboard/live-articles');
          return;
        }
        setFormData(article);
      } else {
        alert('Live article not found.');
        navigate('/dashboard/live-articles');
      }
    } catch (error) {
      console.error('Error loading live article:', error);
      alert('Failed to load live article.');
    } finally {
      setLoading(false);
    }
  }, [isAdmin, isEditor, navigate, userData?.id]);

  useEffect(() => {
    if (isEditing && id) {
      void loadLiveArticle(id);
    }
  }, [id, isEditing, loadLiveArticle]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title?.trim()) {
      alert('Title is required.');
      return;
    }
    setSaving(true);
    try {
      if (isEditing && id) {
        await updateLiveArticle(id, formData);
        alert('Live article updated successfully!');
      } else {
        const newId = await createLiveArticle(formData as Omit<LiveArticle, 'id' | 'createdAt' | 'updatedAt'>);
        alert('Live article created successfully!');
        navigate(`/dashboard/live-articles/${newId}`);
      }
    } catch (error) {
      console.error('Error saving live article:', error);
      alert('Failed to save live article.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6 text-center">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            className="text-gray-600 hover:text-gray-800"
            onClick={() => navigate('/dashboard/live-articles')}
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Live Articles
          </button>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Edit Live Article' : 'Create Live Article'}
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium mb-1">Subtitle</label>
            <input
              type="text"
              value={formData.subtitle || ''}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-sm font-medium mb-1">Summary (max 300 chars)</label>
            <textarea
              value={formData.summary || ''}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full border rounded px-3 py-2"
              rows={3}
              maxLength={300}
            />
          </div>

          {/* Initial Content */}
          <div>
            <label className="block text-sm font-medium mb-1">Initial Content</label>
            <textarea
              value={formData.initialContent || ''}
              onChange={(e) => setFormData({ ...formData, initialContent: e.target.value })}
              className="w-full border rounded px-3 py-2"
              rows={5}
            />
          </div>

          {/* Featured Image URL */}
          <div>
            <label className="block text-sm font-medium mb-1">Featured Image URL</label>
            <input
              type="url"
              value={formData.featuredImageUrl || ''}
              onChange={(e) => setFormData({ ...formData, featuredImageUrl: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Featured Image Description */}
          <div>
            <label className="block text-sm font-medium mb-1">Featured Image Description</label>
            <input
              type="text"
              value={formData.featuredImageDescription || ''}
              onChange={(e) => setFormData({ ...formData, featuredImageDescription: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Featured Image Source Credit */}
          <div>
            <label className="block text-sm font-medium mb-1">Featured Image Source Credit</label>
            <input
              type="text"
              value={formData.featuredImageSourceCredit || ''}
              onChange={(e) => setFormData({ ...formData, featuredImageSourceCredit: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">Tags</label>
            <TagInput
              tags={formData.tags || []}
              onTagsChange={(tags) => setFormData({ ...formData, tags })}
            />
          </div>

          {/* Status (only for editing) */}
          {isEditing && (isEditor() || isAdmin()) && (
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={formData.status || 'open'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'open' | 'closed' })}
                className="border rounded px-3 py-2"
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="bg-accent text-white px-6 py-2 rounded hover:bg-opacity-90 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faSave} className="mr-2" />
              {saving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
