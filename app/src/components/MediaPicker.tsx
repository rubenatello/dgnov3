import React from 'react';

// Minimal stub for a Media Picker modal. This satisfies default import usage.
// You can replace this later with the real media library picker.
export interface MediaPickerProps {
	isOpen?: boolean;
	onClose?: () => void;
	onSelect?: (media: { id: string; url: string; title?: string; description?: string; sourceCredit?: string }) => void;
}

const MediaPicker: React.FC<MediaPickerProps> = ({ isOpen = false }) => {
	if (!isOpen) return null;
	return (
		<div style={{
			position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
			display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
		}}>
			<div style={{ background: '#fff', padding: 16, borderRadius: 8, minWidth: 320 }}>
				<strong>Media Picker</strong>
				<div style={{ marginTop: 8, color: '#666' }}>Placeholder component — replace with real picker.</div>
			</div>
		</div>
	);
};

export default MediaPicker;

