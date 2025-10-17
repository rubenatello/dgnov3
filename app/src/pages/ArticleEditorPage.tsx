import { useState } from 'react';
import TiptapEditor from '../components/TiptapEditor';
import { createArticle } from '../services/articleService';
import { generateSlug, validateSummary } from '../utils/helpers';
import type { ArticleStatus } from '../types/models';

export default function ArticleEditorPage() {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState<object>({});
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<ArticleStatus>('draft');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!validateSummary(summary)) {
      setError('Summary must be 300 characters or less');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      // TODO: Get actual user ID from auth context
      const userId = 'temp-user-id'; 

      const articleData = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        summary: summary.trim(),
        content,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        authorId: userId,
        status,
        lastUpdatedBy: userId,
      };

      const articleId = await createArticle(articleData);
      setSuccess(true);
      console.log('Article created with ID:', articleId);
      
      // TODO: Redirect to article view or list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
      console.error('Error saving article:', err);
    } finally {
      setSaving(false);
    }
  };

  const previewSlug = title ? generateSlug(title) : '';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink mb-2">
          {status === 'draft' ? 'Create New Article' : 'Edit Article'}
        </h1>
        <p className="text-inkMuted">
          Write and format your article using the editor below.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          Article saved successfully!
        </div>
      )}

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border border-stone rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-paper text-ink text-xl font-semibold"
            placeholder="Enter article title..."
          />
          {previewSlug && (
            <p className="mt-1 text-sm text-sand">
              URL: /{previewSlug}
            </p>
          )}
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Subtitle
          </label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full px-4 py-2 border border-stone rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-paper text-ink"
            placeholder="Optional subtitle..."
          />
        </div>

        {/* Summary */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Summary <span className="text-red-500">*</span>
            <span className="ml-2 text-xs text-sand">
              ({summary.length}/300 characters)
            </span>
          </label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={300}
            rows={3}
            className="w-full px-4 py-2 border border-stone rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-paper text-ink resize-none"
            placeholder="Brief summary of the article (max 300 characters)..."
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Tags
          </label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-2 border border-stone rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-paper text-ink"
            placeholder="politics, technology, climate (comma-separated)"
          />
        </div>

        {/* Content Editor */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Content <span className="text-red-500">*</span>
          </label>
          <TiptapEditor
            content=""
            onChange={setContent}
            editable={true}
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ArticleStatus)}
            className="px-4 py-2 border border-stone rounded-lg focus:outline-none focus:ring-2 focus:ring-accent bg-paper text-ink"
          >
            <option value="draft">Draft</option>
            <option value="review">Ready for Review</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-stone">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-accent text-paper rounded-lg hover:bg-opacity-90 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Article'}
          </button>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-3 bg-stone text-ink rounded-lg hover:bg-opacity-80 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
