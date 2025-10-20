import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Donation modal simplified: using Stripe Payment Links for one-time and monthly donations

export default function DonationModal({ isOpen, onClose }: DonationModalProps) {
  const { currentUser } = useAuth();
  // no local amount selection — Stripe Payment Links handle amounts
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const STRIPE_PAYMENT_LINK = 'https://donate.stripe.com/6oU28rgKpd6leZxb53bQY00';
  const STRIPE_MONTHLY_LINK = 'https://buy.stripe.com/28E3cvgKp4zPdVt0qpbQY01';

  // Donation actions are handled inline by the buttons which open Stripe Payment Links.

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-ink">Support DGNO</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <p className="text-gray-600 mb-6">
          Your donation helps us maintain independent journalism and continue serving our community with quality news coverage.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 rounded text-green-700 text-sm">
            {message}
          </div>
        )}

        {!message && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded p-3">
              <p className="text-sm text-gray-600">
                <strong>Donating as:</strong> {currentUser?.email || 'Anonymous'}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => {
                  // Open payment link for a custom/one-time donation
                  if (!currentUser) {
                    setError('Please log in to make a donation.');
                    return;
                  }
                  window.open(STRIPE_PAYMENT_LINK, '_blank', 'noopener,noreferrer');
                  setMessage('Opening Stripe to complete your donation. Thank you!');
                  setTimeout(() => onClose(), 1200);
                }}
                className="w-full bg-accent text-white py-3 px-4 rounded font-medium hover:bg-accent/90 transition-colors"
              >
                Donate Custom Amount
              </button>

              <button
                onClick={() => {
                  if (!currentUser) {
                    setError('Please log in to make a donation.');
                    return;
                  }
                  window.open(STRIPE_MONTHLY_LINK, '_blank', 'noopener,noreferrer');
                  setMessage('Opening Stripe to set up your monthly donation. Thank you!');
                  setTimeout(() => onClose(), 1200);
                }}
                className="w-full bg-white text-accent border border-accent py-3 px-4 rounded font-medium hover:bg-accent/5 transition-colors"
              >
                Donate Monthly
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Secure payment powered by Stripe. Your donation is processed securely on Stripe's site.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}