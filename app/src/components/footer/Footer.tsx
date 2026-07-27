import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInstagram, faTiktok } from '@fortawesome/free-brands-svg-icons';
import { Link } from 'react-router-dom';
import DonationModal from '../modals/DonationModal';

const NEWSROOM_LINKS = [
  { to: '/about', label: 'About DGNO' },
  { to: '/editorial-standards', label: 'Editorial Standards' },
  { to: '/corrections', label: 'Corrections' },
  { to: '/funding', label: 'Funding & Independence' },
];

const PUBLIC_LINKS = [
  { to: '/trackers', label: 'Incident Trackers' },
  { to: '/reports', label: 'Reports' },
  { to: '/investigations', label: 'Investigations' },
  { to: '/contact', label: 'Contact' },
  { to: '/privacy', label: 'Privacy' },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [donationOpen, setDonationOpen] = useState(false);

  return (
    <footer className="bg-masthead border-t border-stone/30 mt-auto text-on-masthead">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 flex flex-col gap-6 rounded-2xl border border-white/15 bg-white/5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-accent-light">Independent means reader-supported</p>
            <h2 className="mt-2 max-w-2xl font-heading text-2xl font-bold text-white sm:text-3xl">Help keep the reporting public and the data accessible.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-on-masthead-muted">No paywall and no inbox required. Read, share, follow by RSS—or contribute securely through Stripe when you can.</p>
          </div>
          <button type="button" onClick={() => setDonationOpen(true)} className="inline-flex min-h-11 flex-none items-center justify-center rounded-full bg-tracker px-6 py-3 font-bold text-white transition hover:bg-[#8f4208]">
            Donate to DGNO
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="inline-block mb-4" aria-label="DGNO home">
              <img src="/logo.png" alt="DGNO" width="180" height="48" className="h-12 w-auto invert" />
            </Link>
            <p className="text-on-masthead-muted text-sm leading-relaxed max-w-md">
              Independent reporting and public-interest data that scrutinize political, corporate, and institutional power without partisan exemptions.
            </p>
            <a href="/rss.xml" className="inline-flex mt-5 text-sm font-semibold text-white underline underline-offset-4 hover:text-accent">
              Follow DGNO by RSS
            </a>
          </div>

          <nav aria-label="Newsroom information">
            <h2 className="text-sm font-bold mb-4 uppercase tracking-wider">Newsroom</h2>
            <ul className="space-y-3">
              {NEWSROOM_LINKS.map((item) => (
                <li key={item.to}><Link to={item.to} className="text-on-masthead-muted hover:text-accent-light text-sm">{item.label}</Link></li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Public resources">
            <h2 className="text-sm font-bold mb-4 uppercase tracking-wider">Resources</h2>
            <ul className="space-y-3">
              {PUBLIC_LINKS.map((item) => (
                <li key={item.to}><Link to={item.to} className="text-on-masthead-muted hover:text-accent-light text-sm">{item.label}</Link></li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-sm font-bold mb-4 uppercase tracking-wider">Follow DGNO</h2>
            <div className="flex gap-3">
              <a
                href="https://www.tiktok.com/@dgnonews"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="DGNO on TikTok"
                className="w-11 h-11 bg-white/10 hover:bg-accent rounded-lg flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faTiktok} />
              </a>
              <a
                href="https://www.instagram.com/dgnonews"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="DGNO on Instagram"
                className="w-11 h-11 bg-white/10 hover:bg-accent rounded-lg flex items-center justify-center"
              >
                <FontAwesomeIcon icon={faInstagram} />
              </a>
            </div>
            <p className="text-on-masthead-muted text-xs mt-4">@dgnonews</p>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-3 text-sm text-on-masthead-muted">
          <p>&copy; {currentYear} DGNO. All rights reserved.</p>
          <p>Independent, pro-democracy journalism</p>
        </div>
      </div>
      <DonationModal isOpen={donationOpen} onClose={() => setDonationOpen(false)} />
    </footer>
  );
}
