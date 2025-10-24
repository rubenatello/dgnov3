import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../config/firebase";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess("Password reset email sent! Check your inbox.");
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="text-center text-lg font-bold mb-4">
          <FontAwesomeIcon icon={faQuestionCircle} className="mr-2 text-accent" />
          Forgot Your Password?
        </h2>
        <p className="text-center text-sm mb-4 text-inkMuted"> Please use the email associated with your account to reset your password. </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-stone rounded px-4 py-2 focus:ring-2 focus:ring-accent"
            placeholder="Enter your email"
            required
            disabled={loading}
          />
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          <div className="flex gap-2 justify-center">
            <button type="button" className="px-4 py-1 rounded bg-gray-200 cursor-pointer" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="px-4 py-1 rounded bg-accent text-white font-semibold cursor-pointer" disabled={loading}>Send Reset Email</button>
          </div>
        </form>
      </div>
    </div>
  );
}
