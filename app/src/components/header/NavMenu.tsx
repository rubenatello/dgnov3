import { Link } from 'react-router-dom';
import { SECTIONS } from '../../types/models';

export default function NavMenu() {
	// Split sections into primary and secondary for better organization
	const primarySections = SECTIONS.slice(0, 6); // Politics, Immigration, Legislation, Foreign Affairs, Economy, White House
	const secondarySections = SECTIONS.slice(6); // Courts, Congress, Human Rights, Environment, Business, Tech, Finance

	return (
		<>
			{/* Desktop Navigation Only - Mobile handled by MobileHeader */}
			<nav className="flex items-center">
				{/* Primary sections */}
				<div className="flex items-center space-x-0.5">
					{primarySections.map((section) => (
						<Link
							key={section}
							to={`/articles/${section.toLowerCase().replace(/\s+/g, '-')}`}
							className="text-sm font-regular text-inkMuted hover:text-accent hover:underline decoration-blue-100 decoration-2 underline-offset-8 px-2 py-1.5 rounded-md transition-all duration-200"
						>
							{section}
						</Link>
					))}
					
					{/* Trackers link */}
					<Link
						to="/trackers"
						className="text-sm font-bold text-accent hover:text-accent hover:underline decoration-blue-100 decoration-2 underline-offset-8 px-2 py-1.5 rounded-md transition-all duration-200"
					>
						Trackers
					</Link>
					
					{/* Reports link */}
					<Link
						to="/reports"
						className="text-sm font-bold text-accent hover:text-accent hover:underline decoration-blue-100 decoration-2 underline-offset-8 px-2 py-1.5 rounded-md transition-all duration-200"
					>
						Reports
					</Link>
					
					{/* Investigations board link */}
					<Link
						to="/investigations/epstein-files"
						className="text-sm font-bold text-accent hover:text-accent hover:underline decoration-blue-100 decoration-2 underline-offset-8 px-2 py-1.5 rounded-md transition-all duration-200"
					>
						Investigations
					</Link>
					
					{/* More dropdown for secondary sections */}
					<div className="relative group">
						<button className="text-sm font-medium text-inkMuted hover:text-accent px-3 py-1.5 rounded-md transition-all duration-200 flex items-center">
							More
							<svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
							</svg>
						</button>
						
						{/* Dropdown menu */}
						<div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-stone opacity-0 invisible group-hover:opacity-100 group-hover:visible hover:opacity-100 hover:visible transition-all duration-150 z-50 pointer-events-none group-hover:pointer-events-auto">
							<div className="py-1">
								{secondarySections.map((section) => (
									<Link
										key={section}
										to={`/articles/${section.toLowerCase().replace(/\s+/g, '-')}`}
										className="block px-3 py-1.5 text-sm font-regular text-inkMuted hover:text-accent hover:underline decoration-blue-100 decoration-2 underline-offset-8 transition-colors duration-200"
									>
										{section}
									</Link>
								))}
							</div>
						</div>
					</div>
				</div>
			</nav>
		</>
	);
}
