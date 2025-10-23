import { useState, useEffect } from 'react';
import TopBar from './TopBar';
import NavMenu from './NavMenu';
import MobileHeader from './MobileHeader';
import DashboardOverlayButton from '../DashboardOverlayButton';

export default function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMobile, setIsMobile] = useState(false);

	// Handle scroll effects
	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 0);
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	// Handle mobile detection and resize
	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth < 1024);
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	// Close mobile menu on resize
	useEffect(() => {
		if (!isMobile) {
			setMobileMenuOpen(false);
		}
	}, [isMobile]);

	// Render mobile header for screens < 1024px
	if (isMobile) {
		return <MobileHeader />;
	}

	// Render desktop header for screens >= 1024px
	return (
		<>
			<TopBar />
			<header className={`bg-white sticky top-0 z-40 transition-all duration-200 ${
				isScrolled ? 'shadow-md border-b border-stone/50' : 'border-b border-stone'
			}`}>
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16 lg:h-18">
						{/* Logo */}
						<div className="flex-shrink-0">
							<a href="/" className="flex items-center group">
								<img 
									src="/logo.png" 
									alt="DGNO" 
									className="h-10 lg:h-12 transition-all duration-200 hover:invert-30" 
								/>
								<h1 className="ml-3 text-sm font-heading font-regular text-ink">Independent, Pro-Democracy News</h1>
							</a>
						</div>
						
						{/* Desktop Navigation */}
						<NavMenu 
							mobileMenuOpen={mobileMenuOpen} 
							setMobileMenuOpen={setMobileMenuOpen}
						/>
					</div>
				</div>
			</header>
			<DashboardOverlayButton />
		</>
	);
}
