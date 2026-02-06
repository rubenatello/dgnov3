import { useEffect, useState, useMemo } from 'react';
import { Timestamp } from 'firebase/firestore';
import { uploadMediaFile, addMedia, getAllMedia, updateMedia, deleteMedia } from '../../services/mediaService';
import { useAuth } from '../../hooks/useAuth';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faImage, faVideo, faSearch, faPlus, faEdit, faTrash, faChevronLeft, faChevronRight, faTh, faList, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';
import type { Media } from '../../types/models';

export default function MediaPage() {
  const { userData } = useAuth();
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

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

  // Copy URL to clipboard
  const handleCopyUrl = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Pagination logic
  const totalPages = Math.ceil(media.length / itemsPerPage);
  const paginatedMedia = useMemo(() => {
    return media.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [media, currentPage, itemsPerPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterType, search]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-ink">Media Library</h1>
            <p className="text-sm text-inkMuted mt-1">
              {media.length} item{media.length !== 1 ? 's' : ''} • {media.filter(m => m.type === 'image').length} images, {media.filter(m => m.type === 'video').length} videos
            </p>
          </div>
          <button
            className="bg-accent text-white px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-opacity-90 shadow-sm font-medium transition-all"
            onClick={() => setShowUpload(true)}
          >
            <FontAwesomeIcon icon={faPlus} /> Add Media
          </button>
        </div>

        {/* Filters Card */}
        <div className="bg-white rounded-xl border border-stone p-4 shadow-sm">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Type filters */}
            <div className="flex gap-2">
              <button
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                  filterType === 'all' ? 'bg-accent text-white shadow-sm' : 'bg-stone/50 text-ink hover:bg-stone'
                }`}
                onClick={() => setFilterType('all')}
              >
                All
              </button>
              <button
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                  filterType === 'image' ? 'bg-accent text-white shadow-sm' : 'bg-stone/50 text-ink hover:bg-stone'
                }`}
                onClick={() => setFilterType('image')}
              >
                <FontAwesomeIcon icon={faImage} /> Images
              </button>
              <button
                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-all ${
                  filterType === 'video' ? 'bg-accent text-white shadow-sm' : 'bg-stone/50 text-ink hover:bg-stone'
                }`}
                onClick={() => setFilterType('video')}
              >
                <FontAwesomeIcon icon={faVideo} /> Videos
              </button>
            </div>

            <div className="flex-1" />

            {/* View mode toggle */}
            <div className="flex border border-stone rounded-lg overflow-hidden">
              <button
                className={`p-2 px-3 ${viewMode === 'grid' ? 'bg-accent text-white' : 'bg-white text-inkMuted hover:bg-stone/50'}`}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                <FontAwesomeIcon icon={faTh} />
              </button>
              <button
                className={`p-2 px-3 ${viewMode === 'list' ? 'bg-accent text-white' : 'bg-white text-inkMuted hover:bg-stone/50'}`}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                <FontAwesomeIcon icon={faList} />
              </button>
            </div>

            {/* Items per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-inkMuted">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-stone rounded-lg px-2 py-1.5 text-sm bg-white focus:ring-2 focus:ring-accent"
              >
                <option value={12}>12</option>
                <option value={24}>24</option>
                <option value={48}>48</option>
              </select>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by title..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="px-4 py-2 pl-10 border border-stone rounded-lg focus:ring-2 focus:ring-accent w-64 text-sm"
              />
              <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-2.5 text-inkMuted" />
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {showUpload && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <form
              className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl relative"
              onSubmit={handleUpload}
            >
              <button
                type="button"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-inkMuted hover:text-ink hover:bg-stone rounded-lg transition-colors"
                onClick={() => { setShowUpload(false); setEditingMedia(null); }}
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FontAwesomeIcon icon={faUpload} className="text-accent" />
                </div>
                {editingMedia ? 'Edit Media' : 'Upload Media'}
              </h2>
              {error && (
                <div className="text-red-600 mb-4 text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              
              {/* File Upload */}
              {!editingMedia && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-ink mb-2">Upload File</label>
                    <label className="flex flex-col items-center justify-center gap-2 px-4 py-6 border-2 border-dashed border-stone rounded-xl cursor-pointer hover:border-accent hover:bg-accent/5 transition-all">
                      <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                        <FontAwesomeIcon icon={faUpload} className="text-accent text-xl" />
                      </div>
                      <span className="text-sm text-ink font-medium">
                        {file ? file.name : 'Choose image or video'}
                      </span>
                      <span className="text-xs text-inkMuted">PNG, JPG, GIF, MP4 up to 50MB</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={e => setFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* OR Divider */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 border-t border-stone"></div>
                    <span className="text-sm text-inkMuted font-medium">OR</span>
                    <div className="flex-1 border-t border-stone"></div>
                  </div>

                  {/* Image URL */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-ink mb-2">Image URL</label>
                    <input
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      className="w-full border border-stone rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-accent text-sm"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Title *"
                  className="w-full border border-stone rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-accent text-sm"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                />
                <textarea
                  placeholder="Description *"
                  className="w-full border border-stone rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-accent text-sm"
                  rows={3}
                  value={description}
                  onChange={e => {
                    setDescription(e.target.value);
                    setAlt(e.target.value);
                  }}
                  required
                />
                <input
                  type="text"
                  placeholder="Alt text (auto-filled from description)"
                  className="w-full border border-stone rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-accent text-sm"
                  value={alt}
                  onChange={e => setAlt(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Source credit (e.g. Getty Images) *"
                  className="w-full border border-stone rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-accent text-sm"
                  value={sourceCredit}
                  onChange={e => setSourceCredit(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-accent text-white py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all mt-6 shadow-sm"
                disabled={uploading}
              >
                {uploading ? (editingMedia ? 'Updating...' : 'Uploading...') : (editingMedia ? 'Update Media' : 'Upload Media')}
              </button>
            </form>
          </div>
        )}

        {/* Gallery */}
        {loading ? (
          <div className="bg-white rounded-xl border border-stone p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-accent border-r-transparent mb-4" />
            <p className="text-inkMuted">Loading media...</p>
          </div>
        ) : paginatedMedia.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone p-12 text-center">
            <div className="text-4xl mb-4">🖼️</div>
            <p className="text-inkMuted">No media found. Upload your first file!</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {paginatedMedia.map(m => (
              <div key={m.id} className="group bg-white border border-stone rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-accent/30 transition-all">
                <div className="relative aspect-video">
                  {m.type === 'image' ? (
                    <img src={m.url} alt={m.alt} className="w-full h-full object-cover" />
                  ) : (
                    <video src={m.url} className="w-full h-full object-cover" />
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleCopyUrl(m.url, m.id!)}
                      className="p-2 bg-white rounded-lg hover:bg-accent hover:text-white transition-colors"
                      title="Copy URL"
                    >
                      <FontAwesomeIcon icon={copiedId === m.id ? faCheck : faCopy} />
                    </button>
                    <button
                      onClick={() => handleEdit(m)}
                      className="p-2 bg-white rounded-lg hover:bg-accent hover:text-white transition-colors"
                      title="Edit"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      onClick={() => handleDelete(m)}
                      className="p-2 bg-white rounded-lg hover:bg-red-500 hover:text-white transition-colors"
                      title="Delete"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                  {/* Type badge */}
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                      m.type === 'image' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
                    }`}>
                      {m.type}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="font-medium text-ink text-sm truncate">{m.title}</div>
                  <div className="text-xs text-inkMuted truncate mt-0.5">{m.sourceCredit}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-xl border border-stone overflow-hidden">
            <table className="w-full">
              <thead className="bg-stone/20 border-b border-stone">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink uppercase">Preview</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-ink uppercase">Credit</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-ink uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone/50">
                {paginatedMedia.map(m => (
                  <tr key={m.id} className="hover:bg-accent/5 transition-colors">
                    <td className="px-4 py-3">
                      {m.type === 'image' ? (
                        <img src={m.url} alt={m.alt} className="w-16 h-12 object-cover rounded-lg" />
                      ) : (
                        <video src={m.url} className="w-16 h-12 object-cover rounded-lg" />
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink text-sm">{m.title}</div>
                      <div className="text-xs text-inkMuted truncate max-w-xs">{m.description}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        m.type === 'image' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-inkMuted">{m.sourceCredit}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button
                          onClick={() => handleCopyUrl(m.url, m.id!)}
                          className="p-2 hover:bg-stone rounded-lg transition-colors"
                          title="Copy URL"
                        >
                          <FontAwesomeIcon icon={copiedId === m.id ? faCheck : faCopy} className={copiedId === m.id ? 'text-green-500' : 'text-inkMuted'} />
                        </button>
                        <button
                          onClick={() => handleEdit(m)}
                          className="p-2 hover:bg-stone rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faEdit} className="text-inkMuted hover:text-accent" />
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-inkMuted hover:text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white rounded-xl border border-stone p-4 flex items-center justify-between">
            <div className="text-sm text-inkMuted">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, media.length)} of {media.length} items
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-stone hover:bg-stone/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-inkMuted" />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-accent text-white'
                          : 'hover:bg-stone/50 border border-stone text-inkMuted'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-stone hover:bg-stone/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FontAwesomeIcon icon={faChevronRight} className="text-inkMuted" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
