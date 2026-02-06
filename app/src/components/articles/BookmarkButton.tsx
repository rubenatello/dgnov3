import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { isArticleBookmarked, toggleBookmark } from '../../services/bookmarkService';

interface BookmarkButtonProps {
  articleId: string;
  className?: string;
  showLabel?: boolean;
}

export default function BookmarkButton({ 
  articleId, 
  className = '',
  showLabel = true 
}: BookmarkButtonProps) {
  const { userData: user, currentUser } = useAuth();
  const isAuthenticated = !!currentUser;
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Check if article is bookmarked on mount
  useEffect(() => {
    if (user?.id) {
      setIsLoading(true);
      isArticleBookmarked(user.id, articleId)
        .then(setIsBookmarked)
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user?.id, articleId]);
  
  const handleToggle = async () => {
    if (!user?.id || isLoading) return;
    
    // Start animation
    setIsAnimating(true);
    
    // Optimistic update
    const wasBookmarked = isBookmarked;
    setIsBookmarked(!wasBookmarked);
    
    try {
      await toggleBookmark(user.id, articleId);
    } catch (error) {
      // Revert on error
      setIsBookmarked(wasBookmarked);
      console.error('Failed to toggle bookmark:', error);
    } finally {
      // End animation after a delay
      setTimeout(() => setIsAnimating(false), 300);
    }
  };
  
  // Not authenticated - show disabled state with tooltip
  if (!isAuthenticated) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-3 py-2 text-gray-400 cursor-not-allowed rounded-lg ${className}`}
        title="Sign in to bookmark articles"
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
          />
        </svg>
        {showLabel && <span className="text-sm">Save</span>}
      </button>
    );
  }
  
  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200
        ${isBookmarked 
          ? 'bg-accent/10 text-accent' 
          : 'text-gray-500 hover:bg-gray-100 hover:text-accent'
        }
        ${isLoading ? 'opacity-50 cursor-wait' : ''}
        ${className}
      `}
      title={isBookmarked ? 'Remove from saved' : 'Save article'}
    >
      <svg 
        className={`w-5 h-5 transition-transform duration-200 ${
          isAnimating ? 'scale-125' : 'scale-100'
        } ${isBookmarked ? 'fill-current' : ''}`}
        fill={isBookmarked ? 'currentColor' : 'none'} 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1.5} 
          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
        />
      </svg>
      {showLabel && (
        <span className="text-sm font-medium">
          {isBookmarked ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  );
}
