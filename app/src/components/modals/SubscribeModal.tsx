import { useRef, useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import Dialog from '../ui/Dialog';

interface SubscribeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SubscribeModal({ open, onClose }: SubscribeModalProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const beginCooldown = () => {
    setResendCooldown(30);
    const timer = window.setInterval(() => {
      setResendCooldown((seconds) => {
        if (seconds <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!ageConfirmed) {
      setError('You must confirm you are 18 or older.');
      return;
    }
    if (!displayName || !email || !password) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });
      try {
        await sendEmailVerification(userCredential.user);
      } catch (emailError) {
        console.warn('sendEmailVerification failed', emailError);
      }

      try {
        await setDoc(doc(db, 'subscribers', userCredential.user.uid), {
          uid: userCredential.user.uid,
          displayName: displayName || null,
          email: userCredential.user.email || null,
          subscribed: true,
          newsletterOptIn: true,
          createdAt: serverTimestamp(),
        });
      } catch (firestoreError) {
        console.error('Failed to write subscriber record', firestoreError);
        setError('Account created, but saving the subscriber profile failed. Please contact us for help.');
        return;
      }

      setVerificationSent(true);
      beginCooldown();
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('No signed-in user is available for verification.');
        return;
      }
      await sendEmailVerification(user);
      beginCooldown();
    } catch (resendError) {
      console.error('resend verification failed', resendError);
      setError('We could not resend the verification email. Please try again later.');
    }
  };

  const handleCheckVerified = async () => {
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('No signed-in user is available to verify.');
        return;
      }
      await user.reload();
      if (!user.emailVerified) {
        setError('Email is not verified yet. Please check your inbox.');
        return;
      }
      try {
        await setDoc(doc(db, 'subscribers', user.uid), { verified: true }, { merge: true });
      } catch (verificationError) {
        console.warn('failed to mark verified in firestore', verificationError);
      }
      onClose();
    } catch {
      setError('We could not check verification status. Please try again.');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={verificationSent ? 'Email verification' : 'Subscribe to DGNO'}
      initialFocusRef={nameInputRef}
      className="relative w-full max-w-md rounded-xl border border-stone p-6 sm:p-8"
    >
      <button type="button" onClick={onClose} className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-muted hover:bg-stone-light hover:text-ink" aria-label="Close subscription dialog">
        <span aria-hidden="true" className="text-2xl leading-none">×</span>
      </button>

      {!verificationSent ? (
        <>
          <h2 className="pr-10 text-2xl font-bold text-ink">Subscribe and create an account</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">Join DGNO to follow reporting, save articles, and receive newsroom updates as they become available.</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="subscribe-display-name" className="mb-1.5 block text-sm font-bold text-ink">Display name</label>
              <input ref={nameInputRef} id="subscribe-display-name" type="text" autoComplete="name" className="w-full rounded-md border border-stone bg-white px-3 py-2.5 text-ink" value={displayName} onChange={(event) => setDisplayName(event.target.value)} required />
            </div>
            <div>
              <label htmlFor="subscribe-email" className="mb-1.5 block text-sm font-bold text-ink">Email</label>
              <input id="subscribe-email" type="email" autoComplete="email" className="w-full rounded-md border border-stone bg-white px-3 py-2.5 text-ink" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div>
              <label htmlFor="subscribe-password" className="mb-1.5 block text-sm font-bold text-ink">Password</label>
              <input id="subscribe-password" type="password" autoComplete="new-password" className="w-full rounded-md border border-stone bg-white px-3 py-2.5 text-ink" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>
            <label className="flex items-start gap-3 text-sm text-ink-muted">
              <input type="checkbox" checked={ageConfirmed} onChange={(event) => setAgeConfirmed(event.target.checked)} required className="mt-1 h-4 w-4 accent-accent-strong" />
              <span>I confirm that I am 18 or older.</span>
            </label>
            {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
            <button type="submit" className="min-h-11 w-full rounded-md bg-accent-strong px-4 py-2.5 font-bold text-white hover:bg-accent-dark disabled:cursor-wait disabled:opacity-60" disabled={loading}>
              {loading ? 'Signing up…' : 'Sign up'}
            </button>
          </form>
        </>
      ) : (
        <div>
          <h2 className="pr-10 text-2xl font-bold text-ink">Check your email</h2>
          <p className="mt-3 text-ink-muted">We sent a verification link to <strong className="text-ink">{email}</strong>.</p>
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">Your account can already participate on DGNO. Newsletters will begin when the newsroom’s delivery system is ready.</p>
          {error && <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={handleResend} disabled={resendCooldown > 0} className="min-h-11 flex-1 rounded-md border border-accent-strong px-4 py-2.5 font-bold text-accent-dark hover:bg-accent-soft disabled:opacity-50">
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend email'}
            </button>
            <button type="button" onClick={handleCheckVerified} className="min-h-11 flex-1 rounded-md bg-accent-strong px-4 py-2.5 font-bold text-white hover:bg-accent-dark">I verified</button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
