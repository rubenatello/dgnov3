import { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { STRIPE_MONTHLY_DONATION_URL, STRIPE_ONE_TIME_DONATION_URL } from '../../config/donationLinks';
import Dialog from '../ui/Dialog';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DonationModal({ isOpen, onClose }: DonationModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <Dialog open={isOpen} onClose={onClose} title="Support DGNO" initialFocusRef={closeButtonRef} className="w-full max-w-md rounded-xl border border-stone p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="" className="theme-logo h-12 w-12 object-contain" />
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-accent-dark">Independent journalism</p>
            <h2 className="text-2xl font-bold text-ink">Support DGNO</h2>
          </div>
        </div>
        <button ref={closeButtonRef} type="button" onClick={onClose} className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-lg text-ink-muted hover:bg-stone-light hover:text-ink" aria-label="Close support dialog">
          <span aria-hidden="true" className="text-2xl leading-none">×</span>
        </button>
      </div>

      <div className="mt-5 flex justify-center" aria-hidden="true">
        <FontAwesomeIcon icon={faHeart} className="text-4xl text-ruby" />
      </div>
      <p className="mt-4 leading-relaxed text-ink-muted">Donations help DGNO maintain independent reporting and public-interest data tools.</p>

      <div className="mt-5 rounded-lg bg-stone-light p-3 text-sm text-ink-muted">
        <strong className="text-ink">No DGNO account required.</strong> Choose an option to continue to Stripe's secure checkout.
      </div>

      <div className="mt-5 space-y-3">
        <a href={STRIPE_ONE_TIME_DONATION_URL} target="_blank" rel="noopener noreferrer" className="flex min-h-11 w-full items-center justify-center rounded-md bg-accent-strong px-4 py-3 font-bold text-white hover:bg-accent-dark">
          Make a one-time donation
        </a>
        <a href={STRIPE_MONTHLY_DONATION_URL} target="_blank" rel="noopener noreferrer" className="flex min-h-11 w-full items-center justify-center rounded-md border border-accent-strong px-4 py-3 font-bold text-accent-dark hover:bg-accent-soft">
          Donate monthly
        </a>
      </div>

      <p className="mt-4 text-center text-xs text-ink-muted">Payments are completed securely on Stripe in a new tab.</p>
    </Dialog>
  );
}
