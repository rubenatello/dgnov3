import React, { useEffect, useState, useMemo } from 'react';
import type { Media } from '../types/models';
import { getAllMedia, uploadMediaFile, addMedia } from '../services/mediaService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
	faTimes, faSearch, faImage, faVideo, faUpload, faSync, 
	faChevronLeft, faChevronRight, faTh, faList, faCheck,
	faCloudUploadAlt, faLink, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

export interface MediaPickerProps {
	isOpen?: boolean;
	onClose?: () => void;
	onSelect?: (media: Media) => void;
	filterType?: 'image' | 'video' | 'all'; // Add filter option
}

export default function MediaPicker({ isOpen = false, onClose, onSelect, filterType = 'all' }: MediaPickerProps) {
	const [tab, setTab] = useState<'gallery' | 'upload'>('gallery');
	const [media, setMedia] = useState<Media[]>([]);
	const [loading, setLoading] = useState(false);
	const [search, setSearch] = useState('');
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [selectedId, setSelectedId] = useState<string | null>(null);

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const itemsPerPage = 12;

	// Upload form state
	const [file, setFile] = useState<File | null>(null);
	const [imageUrl, setImageUrl] = useState('');
	const [title, setTitle] = useState('');
	const [description, setDescription] = useState('');
	const [alt, setAlt] = useState('');
	const [sourceCredit, setSourceCredit] = useState('');
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState('');
	const [dragActive, setDragActive] = useState(false);

	const loadMedia = React.useCallback(async () => {
		setLoading(true);
		try {
			const all = await getAllMedia(filterType === 'all' ? undefined : filterType);
			setMedia(all.reverse());
		} catch (err) {
			console.error('Error loading media:', err);
			setMedia([]);
		} finally {
			setLoading(false);
		}
	}, [filterType]);

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
		setSelectedId(null);
		setCurrentPage(1);
	}, [isOpen, tab, loadMedia]);

	// Filter and paginate
	const filtered = useMemo(() => 
		media.filter(m =>
			m.title?.toLowerCase().includes(search.toLowerCase()) ||
			m.description?.toLowerCase().includes(search.toLowerCase())
		), [media, search]);

	const totalPages = Math.ceil(filtered.length / itemsPerPage);
	const paginatedMedia = useMemo(() => 
		filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
		[filtered, currentPage, itemsPerPage]);

	// Reset page when search changes
	useEffect(() => {
		setCurrentPage(1);
	}, [search]);

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
				uploadedAt: new Date(),
				uploadedBy: 'system',
				type: file?.type.startsWith('video') ? 'video' : 'image',
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

	const handleDrag = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);
		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			setFile(e.dataTransfer.files[0]);
		}
	};

	const handleSelectMedia = (m: Media) => {
		setSelectedId(m.id ?? null);
	};

	const handleConfirmSelection = () => {
		const selected = media.find(m => m.id === selectedId);
		if (selected && onSelect) {
			onSelect(selected);
			if (onClose) onClose();
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
			<div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b border-stone bg-gradient-to-r from-accent to-purple-600">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
							<FontAwesomeIcon icon={faImage} className="text-white text-lg" />
						</div>
						<div>
							<h3 className="text-lg font-bold text-white">Media Library</h3>
							<p className="text-xs text-white/70">{filtered.length} items available</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						{/* Tab Buttons */}
						<div className="flex bg-white/20 rounded-lg p-1">
							<button 
								className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'gallery' ? 'bg-white text-accent shadow-sm' : 'text-white hover:bg-white/10'}`} 
								onClick={() => setTab('gallery')}
							>
								<FontAwesomeIcon icon={faImage} className="mr-2" />
								Gallery
							</button>
							<button 
								className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === 'upload' ? 'bg-white text-accent shadow-sm' : 'text-white hover:bg-white/10'}`} 
								onClick={() => setTab('upload')}
							>
								<FontAwesomeIcon icon={faUpload} className="mr-2" />
								Upload
							</button>
						</div>
						<button 
							onClick={() => onClose && onClose()}
							className="w-9 h-9 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors flex items-center justify-center ml-2"
						>
							<FontAwesomeIcon icon={faTimes} />
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-hidden flex flex-col">
					{tab === 'gallery' ? (
						<>
							{/* Search & Controls Bar */}
							<div className="px-6 py-4 border-b border-stone bg-stone/20">
								<div className="flex items-center gap-4">
									{/* Search Input */}
									<div className="flex-1 relative">
										<FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-inkMuted" />
										<input 
											placeholder="Search by title or description..." 
											value={search} 
											onChange={e => setSearch(e.target.value)} 
											className="w-full border border-stone rounded-lg pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-accent transition-colors" 
										/>
									</div>
									
									{/* View Toggle */}
									<div className="flex bg-stone rounded-lg p-1">
										<button
											onClick={() => setViewMode('grid')}
											className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-accent' : 'text-inkMuted hover:text-ink'}`}
										>
											<FontAwesomeIcon icon={faTh} />
										</button>
										<button
											onClick={() => setViewMode('list')}
											className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-accent' : 'text-inkMuted hover:text-ink'}`}
										>
											<FontAwesomeIcon icon={faList} />
										</button>
									</div>

									{/* Refresh Button */}
									<button 
										onClick={loadMedia}
										disabled={loading}
										className="px-4 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors flex items-center gap-2 disabled:opacity-50"
									>
										<FontAwesomeIcon icon={faSync} className={loading ? 'animate-spin' : ''} />
										Refresh
									</button>
								</div>
							</div>

							{/* Gallery Grid/List */}
							<div className="flex-1 overflow-y-auto p-6">
								{loading ? (
									<div className="flex flex-col items-center justify-center h-64 text-inkMuted">
										<FontAwesomeIcon icon={faSync} className="text-4xl mb-3 animate-spin text-accent" />
										<p>Loading media...</p>
									</div>
								) : filtered.length === 0 ? (
									<div className="flex flex-col items-center justify-center h-64 text-inkMuted">
										<FontAwesomeIcon icon={faImage} className="text-4xl mb-3" />
										<p className="font-medium">No media found</p>
										<p className="text-sm">Try a different search or upload new media</p>
									</div>
								) : viewMode === 'grid' ? (
									<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
										{paginatedMedia.map(m => (
											<button 
												key={m.id} 
												onClick={() => handleSelectMedia(m)} 
												className={`group relative rounded-xl overflow-hidden bg-stone/30 border-2 transition-all hover:shadow-lg ${
													selectedId === m.id ? 'border-accent ring-2 ring-accent/30' : 'border-transparent hover:border-stone'
												}`}
											>
												{m.type === 'video' ? (
													<div className="w-full aspect-square bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center">
														<FontAwesomeIcon icon={faVideo} className="text-3xl text-purple-500" />
													</div>
												) : (
													<img src={m.url} alt={m.alt || m.title} className="w-full aspect-square object-cover" />
												)}
												
												{/* Selected Checkmark */}
												{selectedId === m.id && (
													<div className="absolute top-2 right-2 w-6 h-6 bg-accent rounded-full flex items-center justify-center">
														<FontAwesomeIcon icon={faCheck} className="text-white text-xs" />
													</div>
												)}

												{/* Hover Overlay */}
												<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
													<div className="text-white text-sm font-medium truncate">{m.title}</div>
													{m.sourceCredit && (
														<div className="text-white/70 text-xs truncate">{m.sourceCredit}</div>
													)}
												</div>
											</button>
										))}
									</div>
								) : (
									<div className="space-y-2">
										{paginatedMedia.map(m => (
											<button 
												key={m.id} 
												onClick={() => handleSelectMedia(m)}
												className={`w-full flex items-center gap-4 p-3 rounded-xl border-2 transition-all hover:bg-stone/30 text-left ${
													selectedId === m.id ? 'border-accent bg-accent/5' : 'border-stone'
												}`}
											>
												{m.type === 'video' ? (
													<div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
														<FontAwesomeIcon icon={faVideo} className="text-xl text-purple-500" />
													</div>
												) : (
													<img src={m.url} alt={m.alt || m.title} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
												)}
												<div className="flex-1 min-w-0">
													<div className="font-medium text-ink truncate">{m.title}</div>
													<div className="text-sm text-inkMuted truncate">{m.description}</div>
													{m.sourceCredit && (
														<div className="text-xs text-inkMuted mt-1">Credit: {m.sourceCredit}</div>
													)}
												</div>
												{selectedId === m.id && (
													<div className="w-6 h-6 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
														<FontAwesomeIcon icon={faCheck} className="text-white text-xs" />
													</div>
												)}
											</button>
										))}
									</div>
								)}
							</div>

							{/* Pagination & Select Button */}
							{filtered.length > 0 && (
								<div className="px-6 py-4 border-t border-stone bg-stone/20 flex items-center justify-between">
									{/* Pagination */}
									<div className="flex items-center gap-2">
										<button
											onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
											disabled={currentPage === 1}
											className="w-9 h-9 rounded-lg border border-stone bg-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone/50 transition-colors"
										>
											<FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
										</button>
										
										<div className="flex items-center gap-1">
											{Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
												let pageNum;
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
														className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
															currentPage === pageNum 
																? 'bg-accent text-white' 
																: 'bg-white border border-stone hover:bg-stone/50'
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
											className="w-9 h-9 rounded-lg border border-stone bg-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone/50 transition-colors"
										>
											<FontAwesomeIcon icon={faChevronRight} className="text-sm" />
										</button>

										<span className="text-sm text-inkMuted ml-2">
											Page {currentPage} of {totalPages}
										</span>
									</div>

									{/* Select Button */}
									<button
										onClick={handleConfirmSelection}
										disabled={!selectedId}
										className="px-6 py-2.5 bg-gradient-to-r from-accent to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
									>
										<FontAwesomeIcon icon={faCheck} />
										Select Image
									</button>
								</div>
							)}
						</>
					) : (
						/* Upload Tab */
						<div className="flex-1 overflow-y-auto p-6">
							<form onSubmit={handleUpload} className="max-w-2xl mx-auto space-y-6">
								{error && (
									<div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
										<FontAwesomeIcon icon={faInfoCircle} />
										<span className="text-sm font-medium">{error}</span>
									</div>
								)}

								{/* Drag & Drop Upload Area */}
								<div
									onDragEnter={handleDrag}
									onDragLeave={handleDrag}
									onDragOver={handleDrag}
									onDrop={handleDrop}
									className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
										dragActive 
											? 'border-accent bg-accent/5' 
											: file 
												? 'border-green-400 bg-green-50' 
												: 'border-stone hover:border-accent/50 hover:bg-stone/20'
									}`}
								>
									<input 
										type="file" 
										accept="image/*,video/*" 
										onChange={e => setFile(e.target.files?.[0] || null)} 
										className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
									/>
									<div className="flex flex-col items-center">
										<div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
											file ? 'bg-green-100' : 'bg-accent/10'
										}`}>
											<FontAwesomeIcon 
												icon={file ? faCheck : faCloudUploadAlt} 
												className={`text-2xl ${file ? 'text-green-600' : 'text-accent'}`} 
											/>
										</div>
										{file ? (
											<>
												<p className="font-medium text-green-700">{file.name}</p>
												<p className="text-sm text-green-600 mt-1">
													{(file.size / 1024 / 1024).toFixed(2)} MB • Click or drag to replace
												</p>
											</>
										) : (
											<>
												<p className="font-medium text-ink">Drag & drop your file here</p>
												<p className="text-sm text-inkMuted mt-1">or click to browse • Images & Videos</p>
											</>
										)}
									</div>
								</div>

								<div className="flex items-center gap-4">
									<div className="flex-1 h-px bg-stone"></div>
									<span className="text-sm text-inkMuted font-medium">OR</span>
									<div className="flex-1 h-px bg-stone"></div>
								</div>

								{/* URL Input */}
								<div>
									<label className="flex items-center gap-2 text-sm font-medium text-ink mb-2">
										<FontAwesomeIcon icon={faLink} className="text-inkMuted" />
										Image URL
									</label>
									<input 
										type="url" 
										placeholder="https://example.com/image.jpg" 
										value={imageUrl} 
										onChange={e => setImageUrl(e.target.value)} 
										className="w-full border border-stone rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-accent" 
									/>
								</div>

								{/* Metadata Fields */}
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<label className="block text-sm font-medium text-ink mb-2">Title *</label>
										<input 
											type="text" 
											placeholder="Enter title" 
											value={title} 
											onChange={e => setTitle(e.target.value)} 
											className="w-full border border-stone rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-accent" 
											required 
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-ink mb-2">Source Credit</label>
										<input 
											type="text" 
											placeholder="e.g. Getty Images" 
											value={sourceCredit} 
											onChange={e => setSourceCredit(e.target.value)} 
											className="w-full border border-stone rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-accent" 
										/>
									</div>
								</div>

								<div>
									<label className="block text-sm font-medium text-ink mb-2">Description *</label>
									<textarea 
										placeholder="Describe this media..." 
										value={description} 
										onChange={e => setDescription(e.target.value)} 
										className="w-full border border-stone rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-accent resize-none" 
										rows={3} 
										required 
									/>
								</div>

								<div>
									<label className="block text-sm font-medium text-ink mb-2">Alt Text</label>
									<input 
										type="text" 
										placeholder="Auto-filled from description if empty" 
										value={alt} 
										onChange={e => setAlt(e.target.value)} 
										className="w-full border border-stone rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent focus:border-accent" 
									/>
									<p className="text-xs text-inkMuted mt-1">Describes the image for accessibility and SEO</p>
								</div>

								<div className="flex justify-end pt-4">
									<button 
										type="submit" 
										disabled={uploading} 
										className="px-6 py-3 bg-gradient-to-r from-accent to-purple-600 text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-md"
									>
										<FontAwesomeIcon icon={uploading ? faSync : faUpload} className={uploading ? 'animate-spin' : ''} />
										{uploading ? 'Uploading...' : 'Upload Media'}
									</button>
								</div>
							</form>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

