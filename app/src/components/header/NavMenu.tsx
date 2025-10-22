import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SECTIONS } from '../../types/models';

export default function NavMenu() {
	const [mobileOpen, setMobileOpen] = useState(false);

	return (
		<>
			{/* Desktop Navigation: render sections (centered) */}
			<nav className="hidden md:flex flex-1 justify-center items-center">
				<div className="flex flex-wrap gap-x-3 gap-y-1 justify-center max-w-4xl">
					{SECTIONS.map((s) => (
						<Link
							key={s}
							to={`/articles/${s.toLowerCase().replace(/\s+/g, '-')}`}
							className="text-ink hover:text-accent transition-colors text-xs uppercase tracking-tight px-4 py-1 rounded-full border border-stone/20 shadow-sm bg-white hover:bg-stone/50"
							style={{ transform: 'scaleX(.98)' }}
						>
							{s}
						</Link>
					))}
				</div>
			</nav>

			{/* Mobile menu button */}
			<div className="md:hidden">
				<button
					className="text-ink hover:text-accent p-2"
					onClick={() => setMobileOpen((v) => !v)}
					aria-label="Toggle menu"
				>
					<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
					</svg>
				</button>
			</div>

			{/* Mobile Dropdown Panel */}
			{mobileOpen && (
				<div className="md:hidden bg-white border-b border-stone absolute left-0 right-0 top-full">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
						<nav className="flex flex-col space-y-2">
							{SECTIONS.map((s) => (
								<Link
									key={s}
									to={`/articles/${s.toLowerCase().replace(/\s+/g, '-')}`}
									className="text-ink hover:text-accent transition-colors py-2 px-1"
									onClick={() => setMobileOpen(false)}
								>
									<span className="inline-block px-3 py-1 rounded-full border border-stone/10 shadow-sm bg-white hover:bg-stone/50 text-xs uppercase tracking-tight" style={{ transform: 'scaleX(.98)' }}>{s}</span>
								</Link>
							))}
						</nav>
					</div>
				</div>
			)}
		</>
	);
}
