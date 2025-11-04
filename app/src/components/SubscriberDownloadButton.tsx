import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faLock, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from "../hooks/useAuth";
import { canDownloadCSV } from "../services/subscriberService";

interface SubscriberDownloadButtonProps {
  onDownload: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export default function SubscriberDownloadButton({ 
  onDownload, 
  label = "Download CSV", 
  className = "",
  disabled = false 
}: SubscriberDownloadButtonProps) {
  const { userData } = useAuth();
  const [canDownload, setCanDownload] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkDownloadAccess() {
      if (!userData?.id) {
        setCanDownload(false);
        setLoading(false);
        return;
      }

      try {
        const hasAccess = await canDownloadCSV(userData.id);
        setCanDownload(hasAccess);
      } catch (error) {
        console.error('Error checking download access:', error);
        setCanDownload(false);
      } finally {
        setLoading(false);
      }
    }

    checkDownloadAccess();
  }, [userData?.id]);

  const handleClick = () => {
    if (canDownload && !disabled) {
      onDownload();
    }
  };

  if (loading) {
    return (
      <button 
        disabled 
        className={`flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed ${className}`}
      >
        <FontAwesomeIcon icon={faSpinner} spin />
        Checking access...
      </button>
    );
  }

  if (!userData) {
    return (
      <div className="text-center">
        <button 
          disabled 
          className={`flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-600 rounded cursor-not-allowed ${className}`}
          title="Login required for downloads"
        >
          <FontAwesomeIcon icon={faLock} />
          {label}
        </button>
        <p className="text-xs text-gray-500 mt-1">
          <a href="/login" className="text-blue-600 hover:underline">Login</a> required for downloads
        </p>
      </div>
    );
  }

  if (!canDownload) {
    return (
      <div className="text-center">
        <button 
          disabled 
          className={`flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded cursor-not-allowed ${className}`}
          title="Subscription required for downloads"
        >
          <FontAwesomeIcon icon={faLock} />
          {label}
        </button>
        <p className="text-xs text-orange-600 mt-1">
          <a href="/subscribe" className="text-blue-600 hover:underline">Subscribe</a> to download data
        </p>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title="Download CSV data"
    >
      <FontAwesomeIcon icon={faDownload} />
      {label}
    </button>
  );
}