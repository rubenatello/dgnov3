import React, { useEffect, useState } from 'react';
import type { Media } from '../types/models';
import { getAllMedia, uploadMediaFile, addMedia } from '../services/mediaService';

export interface MediaPickerProps {
	isOpen?: boolean;
	onClose?: () => void;
	onSelect?: (media: Media) => void;
}

export default function MediaPicker({ isOpen = false, onClose, onSelect }: MediaPickerProps) {
	const [tab, setTab] = useState<'gallery' | 'upload'>('gallery');
	const [media, setMedia] = useState<Media[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState('');

	// Upload form state
	const [file, setFile] = useState<File | null>(null);
	const [imageUrl, setImageUrl] = useState('');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [alt, setAlt] = useState('');
	const [sourceCredit, setSourceCredit] = useState('');
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState('');

	useEffect(() => {
		if (!isOpen) return;
		loadMedia();
		// reset upload form when opening
		setFile(null);
		setImageUrl('');
		setTitle('');
		setDescription('');
		setAlt('');
		setSourceCredit('');
		setError('');
	}, [isOpen, tab]);

	async function loadMedia() {
		setLoading(true);
		try {
			const all = await getAllMedia('image');
			setMedia(all.reverse());
		} catch (err) {
			console.error('Error loading media:', err);
			setMedia([]);
		} finally {
			setLoading(false);
		}
	}

	const filtered = media.filter(m =>
		m.title?.toLowerCase().includes(search.toLowerCase()) ||
		m.description?.toLowerCase().includes(search.toLowerCase())
	);

	async function handleUpload(e: React.FormEvent) {
		e.preventDefault();
		setError('');
		if (!file && !imageUrl) return setError('Please select a file or enter an image URL.');
		setUploading(true);
		try {
			let url = imageUrl;
			if (file) {
				url = await uploadMediaFile(file, file.type.startsWith('video') ? 'videos' : 'images');
			}

					const meta: Omit<Media, 'id'> = {
						url,
						title: title || (description || '').slice(0, 50),
						description,
						alt: alt || description,
						sourceCredit,
						// Use JS Date for client-side timestamp; backend may normalize to Firestore Timestamp
					uploadedAt: new Date(),
						uploadedBy: 'system',
						type: 'image',
						usageCount: 0,
					lastUpdated: new Date(),
					};
			const id = await addMedia(meta);
			const newMedia: Media = { id, ...meta } as Media;
			if (onSelect) onSelect(newMedia);
			if (onClose) onClose();
		} catch (err) {
			console.error(err);
			setError('Upload failed.');
		} finally {
			setUploading(false);
		}
	}

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-start justify-center p-6">
			<div className="bg-white rounded-lg shadow-lg w-full max-w-4xl overflow-auto max-h-[90vh]">
				<div className="flex items-center justify-between p-4 border-b">
					<h3 className="text-lg font-semibold">Media Library</h3>
					<div className="flex items-center gap-2">
						<button className={`px-3 py-1 rounded ${tab === 'gallery' ? 'bg-accent text-white' : 'bg-stone'}`} onClick={() => setTab('gallery')}>Select</button>
						<button className={`px-3 py-1 rounded ${tab === 'upload' ? 'bg-accent text-white' : 'bg-stone'}`} onClick={() => setTab('upload')}>Upload</button>
						<button className="px-3 py-1 rounded bg-stone" onClick={() => onClose && onClose()}>Close</button>
					</div>
				</div>

				<div className="p-4">
					{tab === 'gallery' ? (
						<div>
							<div className="flex items-center gap-3 mb-4">
								<input placeholder="Search media..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 border rounded px-3 py-2" />
								<button className="px-3 py-2 bg-accent text-white rounded" onClick={loadMedia}>Refresh</button>
							</div>

							{loading ? (
								<div className="text-center text-inkMuted">Loading...</div>
							) : filtered.length === 0 ? (
								<div className="text-center text-inkMuted">No media found.</div>
							) : (
								<div className="grid grid-cols-4 gap-3">
									{filtered.map(m => (
										<button key={m.id} onClick={() => { if (onSelect) onSelect(m); if (onClose) onClose(); }} className="border rounded overflow-hidden text-left hover:shadow">
											<img src={m.url} alt={m.alt || m.title} className="w-full h-32 object-cover" />
											<div className="p-2 text-sm">
												<div className="font-medium truncate">{m.title}</div>
												<div className="text-xs text-inkMuted truncate">{m.sourceCredit}</div>
											</div>
										</button>
									))}
								</div>
							)}
						</div>
					) : (
						<form onSubmit={handleUpload} className="space-y-3">
							{error && <div className="text-red-600">{error}</div>}
							<div>
								<label className="block text-sm font-medium mb-2">Upload File</label>
								<label className="flex items-center justify-center gap-2 px-4 py-6 border-2 border-dashed rounded cursor-pointer">
									<span className="text-sm text-ink">{file ? file.name : 'Choose image or video'}</span>
									<input type="file" accept="image/*,video/*" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
								</label>
							</div>

							<div className="text-center">OR</div>

							<div>
								<label className="block text-sm font-medium mb-2">Image URL</label>
								<input type="url" placeholder="https://example.com/image.jpg" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full border rounded px-3 py-2" />
							</div>

							<div>
								<input type="text" placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded px-3 py-2" required />
							</div>

							<div>
								<textarea placeholder="Description *" value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded px-3 py-2" rows={3} required />
							</div>

							<div>
								<input type="text" placeholder="Alt text (auto-filled from description)" value={alt} onChange={e => setAlt(e.target.value)} className="w-full border rounded px-3 py-2" />
							</div>

							<div>
								<input type="text" placeholder="Source credit (e.g. Getty Images)" value={sourceCredit} onChange={e => setSourceCredit(e.target.value)} className="w-full border rounded px-3 py-2" />
							</div>

							<div className="flex justify-end">
								<button type="submit" disabled={uploading} className="px-4 py-2 bg-accent text-white rounded">{uploading ? 'Uploading...' : 'Upload'}</button>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}

