import { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../../config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

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
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      // set display name on auth profile
      await updateProfile(userCred.user, { displayName });

      // Optional: send email verification
      try {
        await sendEmailVerification(userCred.user);
      } catch (emailErr) {
        console.warn('sendEmailVerification failed', emailErr);
      }

      // Persist a subscriber record to Firestore (safe, idempotent - uses uid)
      try {
        await setDoc(doc(db, 'subscribers', userCred.user.uid), {
          uid: userCred.user.uid,
          displayName: displayName || null,
          email: userCred.user.email || null,
          // opt-in to in-app notifications by default; newsletter/email sends are behind paid plan
          subscribed: true,
          newsletterOptIn: true,
          createdAt: serverTimestamp(),
        });
      } catch (fireErr) {
        // If writing to Firestore fails, surface error to the user and stop the flow
        console.error('Failed to write subscriber record', fireErr);
        setError('Account created but saving profile failed. Please try again or contact support.');
        return;
      }

      // Show verification UI (don't auto-close) so the user can resend/check
      setVerificationSent(true);
      // start short cooldown for resend button (e.g., 30s)
      setResendCooldown(30);
      const timer = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) {
            clearInterval(timer);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err) || 'Signup failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('No signed-in user to resend verification for.');
        return;
      }
      setResendCooldown(30);
      await sendEmailVerification(user);
      const timer = setInterval(() => {
        setResendCooldown((s) => {
          if (s <= 1) {
            clearInterval(timer);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('resend verification failed', err);
      setError('Failed to resend verification email. Try again later.');
    }
  };

  const handleCheckVerified = async () => {
    setError('');
    try {
      const user = auth.currentUser;
      if (!user) {
        setError('No signed-in user to verify.');
        return;
      }
      await user.reload();
      if (user.emailVerified) {
        // Optionally update Firestore profile to mark emailVerified
        try {
          await setDoc(doc(db, 'subscribers', user.uid), { verified: true }, { merge: true });
        } catch (e) {
          console.warn('failed to mark verified in firestore', e);
        }
        onClose();
      } else {
        setError('Email not verified yet. Please check your inbox.');
      }
    } catch (err) {
      setError('Could not check verification status.');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur">
      <div className="bg-bg rounded-lg shadow-lg p-8 w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-inkMuted text-xl"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {!verificationSent ? (
          <>
            <h2 className="text-center font-heading text-2xl font-semibold text-ink mb-4">Subscribe & Sign Up!</h2>
            <p className="text-center text-inkMuted mb-6">Join our community for exclusive content and updates. You will receive updates on articles!</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="text"
                className="border border-stone rounded px-3 py-2 font-sans text-ink bg-paper"
                placeholder="Display Name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
              />
              <input
                type="email"
                className="border border-stone rounded px-3 py-2 font-sans text-ink bg-paper"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                className="border border-stone rounded px-3 py-2 font-sans text-ink bg-paper"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <label className="flex items-center gap-2 text-inkMuted">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={e => setAgeConfirmed(e.target.checked)}
                  required
                />
                I confirm I am 18 or older
              </label>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <button
                type="submit"
                className="bg-accent text-white font-heading rounded px-4 py-2 mt-2 hover:bg-ink transition"
                disabled={loading}
              >
                {loading ? 'Signing up...' : 'Sign Up'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-xl font-heading font-semibold text-ink mb-3">Verification Sent</h2>
            <p className="text-inkMuted mb-4">We sent a verification email to <strong>{email}</strong>. Please open the email and click the verification link.</p>
              <div className="mb-4 text-left text-sm text-inkMuted">
                <p className="mb-2">Thank you for subscribing — we appreciate your support. Right now we're crowdfunding a full newsletter feature (which requires paid delivery). If you'd like to help us bring a free newsletter to all subscribers, please consider donating.</p>
                <p>You're already able to like, comment, and bookmark articles. When we launch the newsletter, you'll receive new-article emails. For now please check our site and consider supporting independent news.</p>
              </div>
            {error && <div className="text-red-500 text-sm mb-3">{error}</div>}
            <div className="flex items-center justify-center gap-3 mb-3">
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="px-4 py-2 rounded bg-transparent border border-accent text-accent disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend verification'}
              </button>
              <button
                onClick={handleCheckVerified}
                className="px-4 py-2 rounded bg-accent text-white"
              >
                I verified, continue
              </button>
            </div>
            <div>
              <button onClick={onClose} className="text-sm text-inkMuted underline">Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
