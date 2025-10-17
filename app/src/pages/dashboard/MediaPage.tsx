import { useEffect, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { uploadMediaFile, addMedia, getAllMedia, updateMedia, deleteMedia } from '../../services/mediaService';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../components/DashboardLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faImage, faVideo, faSearch, faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import type { Media } from '../../types/models';

export default function MediaPage() {
  const { userData } = useAuth();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [search, setSearch] = useState('');

  // Upload form state
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState(''); // New: direct URL option
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [alt, setAlt] = useState('');
  const [sourceCredit, setSourceCredit] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Fetch media from Firestore
  useEffect(() => {
    async function fetchMedia() {
      setLoading(true);
      let all = await getAllMedia(filterType === 'all' ? undefined : filterType);
      if (search) {
        all = all.filter(m => m.title.toLowerCase().includes(search.toLowerCase()));
      }
      setMedia(all);
      setLoading(false);
    }
    fetchMedia();
  }, [filterType, search]);

  // Handle upload
  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file && !imageUrl) return setError('Please select a file or enter an image URL.');
    setUploading(true);
    setError('');
    try {
      let url = imageUrl;
      let mediaType: 'image' | 'video' = 'image';
      
      // If file is uploaded, upload to Storage
      if (file) {
        url = await uploadMediaFile(file, file.type.startsWith('video') ? 'videos' : 'images');
        mediaType = file.type.startsWith('video') ? 'video' : 'image';
      }
      
      if (editingMedia) {
        // Update existing media
        if (!editingMedia.id) throw new Error('Media ID is missing');
        await updateMedia(editingMedia.id, {
          title,
          description,
          alt: alt || description,
          sourceCredit,
          lastUpdated: Timestamp.fromDate(new Date()),
        });
      } else {
        // Create new media
        const meta: Omit<Media, 'id'> = {
          url,
          title,
          description,
          alt: alt || description,
          sourceCredit,
          uploadedAt: Timestamp.fromDate(new Date()),
          uploadedBy: userData?.id || '',
          type: mediaType,
          usageCount: 0,
          lastUpdated: Timestamp.fromDate(new Date()),
        };
        await addMedia(meta);
      }
      
      setShowUpload(false);
      setEditingMedia(null);
      setFile(null);
      setImageUrl('');
      setTitle('');
      setDescription('');
      setAlt('');
      setSourceCredit('');
      // Refresh gallery
      const all = await getAllMedia(filterType === 'all' ? undefined : filterType);
      setMedia(all);
    } catch (error) {
      console.error(error);
      setError('Upload failed. Check console for details.');
    } finally {
      setUploading(false);
    }
  }

  // Handle edit
  function handleEdit(item: Media) {
    setEditingMedia(item);
    setTitle(item.title);
    setDescription(item.description);
    setAlt(item.alt);
    setSourceCredit(item.sourceCredit);
    setImageUrl(item.url);
    setShowUpload(true);
  }

  // Handle delete
  async function handleDelete(item: Media) {
    if (!item.id) return alert('Media ID is missing');
    if (!confirm(`Delete "${item.title}"? This cannot be undone.`)) return;
    try {
      await deleteMedia(item.id, item.url);
      // Refresh gallery
      const all = await getAllMedia(filterType === 'all' ? undefined : filterType);
      setMedia(all);
    } catch (error) {
      console.error(error);
      alert('Delete failed. Check console for details.');
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-heading font-bold text-ink">Media Library</h1>
        <button
          className="bg-accent text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90"
          onClick={() => setShowUpload(true)}
        >
          <FontAwesomeIcon icon={faPlus} /> Add Media
        </button>
      </div>

      {/* Filter/Search */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-3 py-1 rounded ${filterType === 'all' ? 'bg-accent text-white' : 'bg-stone text-ink'}`}
          onClick={() => setFilterType('all')}
        >
          All
        </button>
        <button
          className={`px-3 py-1 rounded ${filterType === 'image' ? 'bg-accent text-white' : 'bg-stone text-ink'}`}
          onClick={() => setFilterType('image')}
        >
          <FontAwesomeIcon icon={faImage} className="mr-1" /> Images
        </button>
        <button
          className={`px-3 py-1 rounded ${filterType === 'video' ? 'bg-accent text-white' : 'bg-stone text-ink'}`}
          onClick={() => setFilterType('video')}
        >
          <FontAwesomeIcon icon={faVideo} className="mr-1" /> Videos
        </button>
        <div className="flex-1"></div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="px-3 py-1.5 border border-stone rounded-lg focus:ring-2 focus:ring-accent"
          />
          <FontAwesomeIcon icon={faSearch} className="absolute right-3 top-2.5 text-inkMuted" />
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <form
            className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg relative"
            onSubmit={handleUpload}
          >
            <button
              type="button"
              className="absolute top-2 right-2 text-ink hover:text-accent"
              onClick={() => setShowUpload(false)}
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faUpload} /> {editingMedia ? 'Edit Media' : 'Upload Media'}
            </h2>
            {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}
            
            {/* File Upload */}
            {!editingMedia && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-ink mb-2">Upload File</label>
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-stone rounded-lg cursor-pointer hover:border-accent hover:bg-accent hover:bg-opacity-5 transition-all">
                    <FontAwesomeIcon icon={faUpload} className="text-accent" />
                    <span className="text-sm text-ink">
                      {file ? file.name : 'Choose image or video'}
                    </span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={e => setFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* OR Divider */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 border-t border-stone"></div>
                  <span className="text-sm text-inkMuted">OR</span>
                  <div className="flex-1 border-t border-stone"></div>
                </div>

                {/* Image URL */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-ink mb-2">Image URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    className="w-full border border-stone rounded px-3 py-2 focus:ring-2 focus:ring-accent"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                  />
                  <p className="text-xs text-inkMuted mt-1">Paste a direct link to an image instead of uploading</p>
                </div>
              </>
            )}
            
            <div className="mb-3">
              <input
                type="text"
                placeholder="Title *"
                className="w-full border border-stone rounded px-3 py-2 focus:ring-2 focus:ring-accent"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="mb-3">
              <textarea
                placeholder="Description *"
                className="w-full border border-stone rounded px-3 py-2 focus:ring-2 focus:ring-accent"
                rows={3}
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  // Auto-populate alt text (only if user hasn't manually edited it)
                  setAlt(e.target.value);
                }}
                required
              />
            </div>
            <div className="mb-3">
              <input
                type="text"
                placeholder="Alt text (auto-filled from description)"
                className="w-full border border-stone rounded px-3 py-2 focus:ring-2 focus:ring-accent"
                value={alt}
                onChange={e => setAlt(e.target.value)}
              />
              <p className="text-xs text-inkMuted mt-1">
                Auto-synced with description. Edit this for custom alt text for accessibility.
              </p>
            </div>
            <div className="mb-3">
              <input
                type="text"
                placeholder="Source credit (e.g. Getty Images)"
                className="w-full border border-stone rounded px-3 py-2"
                value={sourceCredit}
                onChange={e => setSourceCredit(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-accent text-white py-2 rounded-lg font-medium hover:bg-opacity-90 transition-all"
              disabled={uploading}
            >
              {uploading ? (editingMedia ? 'Updating...' : 'Uploading...') : (editingMedia ? 'Update' : 'Upload')}
            </button>
          </form>
        </div>
      )}

      {/* Gallery */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-inkMuted">Loading...</div>
        ) : media.length === 0 ? (
          <div className="col-span-full text-center text-inkMuted">No media found.</div>
        ) : (
          media.map(m => (
            <div key={m.id} className="bg-white border border-stone rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {m.type === 'image' ? (
                <img src={m.url} alt={m.alt} className="w-full h-40 object-cover" />
              ) : (
                <video src={m.url} controls className="w-full h-40 object-cover" />
              )}
              <div className="p-3">
                <div className="font-bold text-ink mb-1 truncate">{m.title}</div>
                <div className="text-xs text-inkMuted mb-1 truncate">{m.description}</div>
                <div className="text-xs text-inkMuted mb-1">Credit: {m.sourceCredit}</div>
                <div className="text-xs text-inkMuted mb-2">Type: {m.type}</div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(m)}
                    className="flex-1 bg-stone text-ink px-2 py-1.5 rounded text-xs hover:bg-accent hover:text-white transition-colors flex items-center justify-center gap-1"
                    title="Edit"
                  >
                    <FontAwesomeIcon icon={faEdit} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(m)}
                    className="flex-1 bg-stone text-ink px-2 py-1.5 rounded text-xs hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center gap-1"
                    title="Delete"
                  >
                    <FontAwesomeIcon icon={faTrash} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
