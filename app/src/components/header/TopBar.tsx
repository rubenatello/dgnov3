
import { useState } from 'react';
import useArticles from '../../hooks/useArticles';
import DonationModal from '../modals/DonationModal';
import SubscribeModal from '../modals/SubscribeModal';
import SearchModal from '../modals/SearchModal';

export default function TopBar() {
	const [donationModalOpen, setDonationModalOpen] = useState(false);
	const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const { articles } = useArticles();

	return (
		<>
			<div className="bg-ink text-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between h-11">
						{/* Left side - Date/Time or Breaking News */}
						<div className="flex items-center text-xs lg:text-sm text-sand">
							<time className="font-medium">
								{new Date().toLocaleDateString('en-US', { 
									weekday: 'long', 
									year: 'numeric', 
									month: 'long', 
									day: 'numeric' 
								})}
							</time>
						</div>

						{/* Right side - Actions */}
						<div className="flex items-center gap-2 lg:gap-4">
							{/* Search Button */}
							<button
								onClick={() => setSearchOpen(true)}
								className="p-2 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all duration-200 group"
								aria-label="Search articles"
							>
								<svg className="h-4 w-4 lg:h-5 lg:w-5 text-sand group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
									<line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" />
								</svg>
							</button>

							{/* Subscribe Button */}
							<button
								onClick={() => setSubscribeModalOpen(true)}
								className="text-xs lg:text-sm px-3 lg:px-4 py-1.5 bg-transparent border border-sand/40 text-sand rounded-full hover:bg-accent hover:text-white hover:border-accent transition-all duration-200 font-medium"
							>
								Subscribe
							</button>

							{/* Donate Button */}
							<button 
								onClick={() => setDonationModalOpen(true)}
								className="text-xs lg:text-sm px-3 lg:px-4 py-1.5 bg-tracker text-white rounded-full hover:bg-tracker/90 hover:shadow-lg transition-all duration-200 font-medium"
							>
								Donate
							</button>

							{/* Login Button */}
							<a 
								href="/login"
								className="text-xs lg:text-sm px-3 lg:px-4 py-1.5 bg-white text-ink rounded-full hover:bg-paper hover:shadow-md transition-all duration-200 font-medium"
							>
								Login
							</a>
						</div>
					</div>
				</div>
			</div>

			{/* Modals */}
			<SubscribeModal 
				open={subscribeModalOpen} 
				onClose={() => setSubscribeModalOpen(false)} 
			/>
			<DonationModal 
				isOpen={donationModalOpen} 
				onClose={() => setDonationModalOpen(false)} 
			/>
			<SearchModal 
				open={searchOpen} 
				onClose={() => setSearchOpen(false)} 
				articles={articles} 
			/>
		</>
	);
}
