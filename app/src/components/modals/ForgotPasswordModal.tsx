import { useRef, useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
import { auth } from '../../config/firebase';
import Dialog from '../ui/Dialog';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess('Password reset email sent. Check your inbox.');
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : 'Failed to send a reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} title="Reset your password" initialFocusRef={emailRef} className="w-full max-w-sm rounded-xl border border-stone p-6">
      <div className="text-center">
        <FontAwesomeIcon icon={faQuestionCircle} className="text-3xl text-accent-dark" aria-hidden="true" />
        <h2 className="mt-2 text-xl font-bold text-ink">Forgot your password?</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">Enter the email associated with your DGNO account.</p>
      </div>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label htmlFor="reset-password-email" className="mb-1.5 block text-sm font-bold text-ink">Email</label>
          <input ref={emailRef} id="reset-password-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-md border border-stone px-4 py-2.5 text-ink" autoComplete="email" required disabled={loading} />
        </div>
        {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
        {success && <p role="status" className="rounded-md bg-green-50 p-3 text-sm font-semibold text-green-800">{success}</p>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" className="min-h-11 rounded-md border border-stone px-4 py-2.5 font-bold text-ink-muted hover:bg-stone-light" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" className="min-h-11 rounded-md bg-accent-strong px-4 py-2.5 font-bold text-white hover:bg-accent-dark disabled:opacity-60" disabled={loading}>{loading ? 'Sending…' : 'Send reset email'}</button>
        </div>
      </form>
    </Dialog>
  );
}
