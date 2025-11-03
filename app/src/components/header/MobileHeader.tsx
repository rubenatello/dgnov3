import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SECTIONS } from '../../types/models';
import DashboardOverlayButton from '../DashboardOverlayButton';
import SearchModal from '../modals/SearchModal';
import SubscribeModal from '../modals/SubscribeModal';
import DonationModal from '../modals/DonationModal';
import useArticles from '../../hooks/useArticles';

export default function MobileHeader() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
	const [donationModalOpen, setDonationModalOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const { articles } = useArticles();

	// Handle scroll effects
	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 10);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	// Close mobile menu on resize to desktop
	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth >= 1024) {
				setMobileMenuOpen(false);
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Split sections for better mobile organization
	const primarySections = SECTIONS.slice(0, 6);
	const secondarySections = SECTIONS.slice(6);

	return (
		<>
			{/* Mobile Header */}
			<header className={`bg-white sticky top-0 z-40 transition-all duration-200 ${
				isScrolled ? 'shadow-lg border-b border-stone/30' : 'border-b border-stone/20'
			}`}>
				<div className="px-4 py-3">
					<div className="flex items-center justify-between">
						{/* Logo */}
						<div className="flex items-center">
							<a href="/" className="flex items-center group">
								<img 
									src="/logo.png" 
									alt="DGNO" 
									className="h-12 transition-transform duration-200 hover:invert-30" 
								/>
                                <h1 className="ml-3 text-xs font-heading font-regular text-ink">Independent, Pro-Democracy News</h1>
							</a>
						</div>

						{/* Right side actions */}
						<div className="flex items-center gap-2">
							{/* Search button */}
							<button
								onClick={() => setSearchOpen(true)}
								className="p-2 rounded-full text-inkMuted hover:text-accent hover:bg-stone/20 active:bg-stone/30 transition-all duration-200"
								aria-label="Search articles"
							>
								<svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
									<line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" />
								</svg>
							</button>

							{/* Menu button */}
							<button
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
								className="p-2 rounded-full text-inkMuted hover:text-accent hover:bg-stone/20 active:bg-stone/30 transition-all duration-200"
								aria-expanded={mobileMenuOpen}
								aria-label="Toggle navigation menu"
							>
								<svg 
									className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} 
									fill="none" 
									viewBox="0 0 24 24" 
									stroke="currentColor"
								>
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
								</svg>
								<svg 
									className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} 
									fill="none" 
									viewBox="0 0 24 24" 
									stroke="currentColor"
								>
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					</div>
				</div>

				{/* Mobile Quick Actions Bar */}
				<div className="bg-ink/5 px-4 py-2 border-t border-stone/20">
					<div className="flex items-center justify-between">
						<div className="text-xs text-sand font-medium">
							{new Date().toLocaleDateString('en-US', { 
								weekday: 'short', 
								month: 'short', 
								day: 'numeric' 
			})}
						</div>
						<div className="flex gap-2">
							<button
								onClick={() => setSubscribeModalOpen(true)}
								className="text-xs px-3 py-1.5 border border-accent/30 text-accent rounded-full font-medium active:bg-accent active:text-white transition-all duration-200"
							>
								Subscribe
							</button>
							<button
								onClick={() => setDonationModalOpen(true)}
								className="text-xs px-3 py-1.5 bg-accent text-white rounded-full font-medium active:bg-accent/80 transition-all duration-200"
							>
								Donate
							</button>
						</div>
					</div>
				</div>
			</header>

			{/* Mobile menu overlay */}
			{mobileMenuOpen && (
				<>
					{/* Backdrop */}
					<div 
						className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-40 transition-opacity duration-300"
						onClick={() => setMobileMenuOpen(false)}
					/>
					
					{/* Mobile menu panel */}
					<div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 transform transition-all duration-300 ease-out overflow-hidden">
						<div className="flex flex-col h-full">
							{/* Header */}
							<div className="flex items-center justify-between px-6 py-4 border-b border-stone/30 bg-white">
								<div className="flex items-center">
									<img src="/logo.png" alt="DGNO" className="h-11" />
                                    <h1 className="ml-3 text-xs font-heading font-regular text-ink">Independent, Pro-Democracy News</h1>
								</div>
								<button
									onClick={() => setMobileMenuOpen(false)}
									className="p-2 rounded-lg text-inkMuted hover:text-ink hover:bg-stone/20 transition-all duration-200"
									aria-label="Close menu"
								>
									<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>

							{/* Navigation Sections */}
							<div className="flex-1 overflow-y-auto">
								{/* Primary sections */}
								<div className="px-6 py-4">
									<h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-3">
										Top Stories
									</h3>
									<nav className="space-y-1">
										{primarySections.map((section) => (
											<Link
												key={section}
												to={`/articles/${section.toLowerCase().replace(/\s+/g, '-')}`}
												className="flex items-center px-3 py-3 text-base font-medium text-ink hover:text-accent hover:bg-white/80 rounded-lg transition-all duration-200 active:bg-white"
												onClick={() => setMobileMenuOpen(false)}
											>
												<span>{section}</span>
											</Link>
										))}
										
										{/* Trackers link */}
										<Link
											to="/trackers"
											className="flex items-center px-3 py-3 text-base font-medium text-ink hover:text-accent hover:bg-white/80 rounded-lg transition-all duration-200 active:bg-white"
											onClick={() => setMobileMenuOpen(false)}
										>
											<span>Trackers</span>
										</Link>
									</nav>
								</div>

								{/* Secondary sections */}
								<div className="px-6 py-4 border-t-1 border-stone/50">
									<h3 className="text-sm font-bold text-accent uppercase tracking-wider mb-3">
										More Coverage
									</h3>
									<nav className="space-y-1">
										{secondarySections.map((section) => (
											<Link
												key={section}
												to={`/articles/${section.toLowerCase().replace(/\s+/g, '-')}`}
												className="flex items-center px-3 py-3 text-base font-medium text-ink hover:text-accent hover:bg-white/80 rounded-lg transition-all duration-200 active:bg-white"
												onClick={() => setMobileMenuOpen(false)}
											>
												<span>{section}</span>
											</Link>
										))}
									</nav>
								</div>
							</div>

							{/* Footer actions */}
							<div className="border-t border-stone/20 bg-white px-6 py-5 space-y-3">
								<a 
									href="/login"
									className="block w-full bg-accent text-white text-center py-3 px-4 rounded-lg font-semibold hover:bg-accent/90 active:bg-accent/80 transition-all duration-200"
								>
									Login
								</a>
								<div className="grid grid-cols-2 gap-3">
									<button 
										onClick={() => {
											setSubscribeModalOpen(true);
											setMobileMenuOpen(false);
										}}
										className="border border-accent/30 text-accent text-center py-2.5 px-3 rounded-lg text-sm font-semibold hover:bg-accent hover:text-white active:bg-accent/80 transition-all duration-200"
									>
										Subscribe
									</button>
									<button 
										onClick={() => {
											setDonationModalOpen(true);
											setMobileMenuOpen(false);
										}}
										className="bg-ink text-white text-center py-2.5 px-3 rounded-lg text-sm font-semibold hover:bg-inkMuted active:bg-inkMuted/80 transition-all duration-200"
									>
										Donate
									</button>
								</div>
							</div>
						</div>
					</div>
				</>
			)}

			<DashboardOverlayButton />

			{/* Modals */}
			<SearchModal 
				open={searchOpen} 
				onClose={() => setSearchOpen(false)} 
				articles={articles} 
			/>
			<SubscribeModal 
				open={subscribeModalOpen} 
				onClose={() => setSubscribeModalOpen(false)} 
			/>
			<DonationModal 
				isOpen={donationModalOpen} 
				onClose={() => setDonationModalOpen(false)} 
			/>
		</>
	);
}