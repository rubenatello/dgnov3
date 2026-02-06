import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import SubscribeModal from '../components/modals/SubscribeModal';  
import ForgotPasswordModal from '../components/modals/ForgotPasswordModal';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [isSubscribeOpen, setSubscribeOpen] = useState(false);
  const [isForgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      navigate('/dashboard'); // Redirect to dashboard after successful login
    } catch (err) {
      setError('Failed to sign in. Please check your credentials.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg via-white to-stone/20 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo/Header/Link to Home page */}
        <div className="text-center">
          <a href="/" className="inline-block group">
            <img src="/logo.png" alt="DGNO" className="h-16 mx-auto mb-4 transition-all duration-300 group-hover:scale-105" />
          </a>
          <h2 className="text-3xl font-heading font-bold text-ink">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-inkMuted">
            Sign in to access your account and dashboard
          </p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6 bg-white p-8 rounded-xl shadow-lg border border-gray-100" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-4 py-3 rounded-r flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-ink mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-ink mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-accent focus:ring-accent border-stone rounded cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-inkMuted cursor-pointer">
                Remember me
              </label>
            </div>
            {/* Forgot Password - ForgotPassword Modal */}
            <div className="text-sm">
              <button
                type="button"
                onClick={() => setForgotPasswordOpen(true)}
                className="text-accent hover:text-opacity-80 cursor-pointer font-medium"
              >
                Forgot password?
              </button>
              <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white py-3.5 px-4 rounded-lg font-semibold hover:bg-accent/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md hover:shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Signing in...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Link - Use Subscribe Modal */}
        <div className="text-center text-sm text-inkMuted bg-white p-4 rounded-lg border border-gray-100">
          Don't have an account?{' '}
          <>
            <button
              type="button"
              onClick={() => setSubscribeOpen(true)}
              className="text-accent hover:text-accent/80 font-semibold cursor-pointer underline-offset-2 hover:underline transition-all"
            >
              Create an account
            </button>

            <SubscribeModal open={isSubscribeOpen} onClose={() => setSubscribeOpen(false)} />
          </>
        </div>
      </div>
    </div>
  );
}
