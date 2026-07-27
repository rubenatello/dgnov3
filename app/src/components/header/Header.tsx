import { lazy, Suspense, useEffect, useState } from 'react';
import DashboardOverlayButton from '../DashboardOverlayButton';
import MobileHeader from './MobileHeader';
import NavMenu from './NavMenu';
import TopBar from './TopBar';
import DonationModal from '../modals/DonationModal';

const SearchModal = lazy(() => import('../modals/SearchModal'));

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [donationOpen, setDonationOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleSearchShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleSearchShortcut);
    return () => window.removeEventListener('keydown', handleSearchShortcut);
  }, []);

  const openSearch = () => setSearchOpen(true);
  const openDonation = () => setDonationOpen(true);

  return (
    <>
      <div className="xl:hidden">
        <MobileHeader
          onSearch={openSearch}
          onDonate={openDonation}
        />
      </div>

      <div className="hidden xl:block">
        <TopBar
          onSearch={openSearch}
          onDonate={openDonation}
        />
        <header
          className={`sticky top-0 z-40 border-b bg-surface/95 backdrop-blur-xl transition-shadow ${
            isScrolled ? 'border-stone/60 shadow-soft' : 'border-stone'
          }`}
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex h-[4.5rem] min-w-0 items-center justify-between gap-4">
              <a href="/" className="flex min-w-0 flex-shrink-0 items-center rounded-md" aria-label="DGNO home">
                <img src="/logo.png" alt="" className="theme-logo h-12 w-12 object-contain" />
                <span className="ml-3 max-w-[14rem] text-sm font-medium leading-tight text-ink">
                  Independent, Pro-Democracy News
                </span>
              </a>
              <NavMenu />
            </div>
          </div>
        </header>
      </div>

      <DashboardOverlayButton />

      <Suspense fallback={null}>
        {searchOpen && (
          <SearchModal open onClose={() => setSearchOpen(false)} />
        )}
        {donationOpen && (
          <DonationModal isOpen onClose={() => setDonationOpen(false)} />
        )}
      </Suspense>
    </>
  );
}
