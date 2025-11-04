import { useState, useEffect } from 'react';
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { trackArticleLike, hasUserLikedArticle } from '../../services/analyticsService';
import { useAuth } from '../../hooks/useAuth';

interface LikeButtonProps {
  articleId: string;
  initialLikeCount?: number;
  className?: string;
}

export default function LikeButton({ articleId, initialLikeCount = 0, className = '' }: LikeButtonProps) {
  const { userData } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has already liked this article
  useEffect(() => {
    if (userData?.id) {
      hasUserLikedArticle(articleId, userData.id).then(setIsLiked);
    }
  }, [articleId, userData?.id]);

  const handleLike = async () => {
    if (!userData?.id) {
      // Could show login modal here
      alert('Please log in to like articles');
      return;
    }

    setIsLoading(true);
    try {
      const wasLiked = await trackArticleLike(articleId, userData.id);
      setIsLiked(wasLiked);
      setLikeCount(prev => wasLiked ? prev + 1 : prev - 1);
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading || !userData}
      className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 ${
        isLiked
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
      } disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      title={userData ? (isLiked ? 'Unlike article' : 'Like article') : 'Login to like articles'}
    >
      <Icon 
        icon={faHeart} 
        className={`text-sm ${isLiked ? 'text-red-500' : 'text-gray-400'}`}
      />
      <span className="text-sm font-medium">{likeCount}</span>
      {isLoading && <span className="text-xs">(loading...)</span>}
    </button>
  );
}