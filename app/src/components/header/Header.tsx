import TopBar from './TopBar';
import NavMenu from './NavMenu';
import DashboardOverlayButton from '../DashboardOverlayButton';

export default function Header() {
	return (
		<>
			<TopBar />
			<header className="bg-white border-b border-stone sticky top-0 z-50">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-16">
						{/* Logo */}
						<div className="flex-shrink-0">
							<a href="/" className="flex items-center gap-3">
								 <img src="/logo.png" alt="DGNO" className="h-14" />
							</a>
						</div>
						{/* NavMenu (desktop and mobile) */}
						<NavMenu />
					</div>
				</div>
			</header>
			<DashboardOverlayButton />
		</>
	);
}
