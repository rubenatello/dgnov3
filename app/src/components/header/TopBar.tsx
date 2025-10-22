
import { useState } from 'react';
import useArticles from '../../hooks/useArticles';
import DonationModal from '../DonationModal';
import SubscribeModal from '../SubscribeModal';
import SearchModal from '../modals/SearchModal';

export default function TopBar() {
	const [donationModalOpen, setDonationModalOpen] = useState(false);
	const [subscribeModalOpen, setSubscribeModalOpen] = useState(false);
	const [searchOpen, setSearchOpen] = useState(false);
	const { articles } = useArticles();

	return (
		<div className="bg-[#232425ff] text-white">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex items-center justify-end h-10 gap-2 md:gap-3">
					<button
						onClick={() => setSubscribeModalOpen(true)}
						className="text-sm px-4 md:px-5 py-1.5 bg-transparent border border-white text-white rounded-full hover:bg-accent hover:border-accent transition-all duration-300"
					>
						Subscribe
					</button>
					<button 
						onClick={() => setDonationModalOpen(true)}
						className="text-sm px-4 md:px-5 py-1.5 bg-accent text-white rounded-full hover:bg-accent/90 transition-all duration-300"
					>
						Donate
					</button>
					<a 
						href="/login"
						className="text-sm px-4 md:px-5 py-1.5 bg-white text-ink rounded-full hover:bg-accent hover:text-white transition-all duration-300"
					>
						Login
					</a>
					<button
						onClick={() => setSearchOpen(true)}
						className="p-2 rounded-full hover:bg-accent/30 focus:outline-none flex items-center justify-center"
						aria-label="Search"
					>
						<svg className="h-5 w-5 md:h-6 md:w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
							<line x1="21" y1="21" x2="16.65" y2="16.65" stroke="currentColor" strokeWidth="2" />
						</svg>
					</button>
				</div>
			</div>
			<SubscribeModal 
				open={subscribeModalOpen} 
				onClose={() => setSubscribeModalOpen(false)} 
			/>
			<DonationModal 
				isOpen={donationModalOpen} 
				onClose={() => setDonationModalOpen(false)} 
			/>
			<SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} articles={articles} />
		</div>
	);
}
