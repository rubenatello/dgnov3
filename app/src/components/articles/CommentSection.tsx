import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Timestamp } from 'firebase/firestore';
import type { Comment, User, UserRole } from '../../types/models';
import { useAuth } from '../../hooks/useAuth';
import {
  getArticleComments,
  getCommentReplies,
  addComment,
  updateComment,
  deleteComment,
  likeComment,
  hasLikedComment,
  moderateComment,
  type CommentSortOption
} from '../../services/commentService';

interface CommentSectionProps {
  articleId: string;
  articleAuthorId?: string;
}

// Badge component for user roles
function UserBadge({ roles, userId, articleAuthorId }: { 
  roles?: UserRole[]; 
  userId: string; 
  articleAuthorId?: string;
}) {
  const isAuthor = userId === articleAuthorId;
  
  // Determine badge based on role hierarchy
  const getBadge = () => {
    if (isAuthor) {
      return { label: 'Author', color: 'bg-accent text-white' };
    }
    if (roles?.includes('superuser') || roles?.includes('admin')) {
      return { label: 'Staff', color: 'bg-ink text-white' };
    }
    if (roles?.includes('editor')) {
      return { label: 'Editor', color: 'bg-blue-600 text-white' };
    }
    if (roles?.includes('writer')) {
      return { label: 'Writer', color: 'bg-emerald-600 text-white' };
    }
    return null;
  };
  
  const badge = getBadge();
  if (!badge) return null;
  
  return (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${badge.color}`}>
      {badge.label}
    </span>
  );
}

// Individual comment component
function CommentItem({ 
  comment, 
  articleAuthorId,
  currentUser,
  isEditor,
  onReply,
  onEdit,
  onDelete,
  onLike,
  onModerate,
  depth = 0 
}: {
  comment: Comment;
  articleAuthorId?: string;
  currentUser: User | null;
  isEditor: boolean;
  onReply: (parentId: string) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (comment: Comment) => void;
  onLike: (commentId: string) => void;
  onModerate: (commentId: string, status: 'approved' | 'hidden') => void;
  depth?: number;
}) {
  const [replies, setReplies] = useState<Comment[]>([]);
  const [showReplies, setShowReplies] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);
  
  const isOwner = currentUser?.id === comment.userId;
  const maxDepth = 2; // Limit nesting depth
  
  // Check if user has liked this comment
  useEffect(() => {
    if (currentUser?.id) {
      hasLikedComment(comment.id!, currentUser.id).then(setIsLiked);
    }
  }, [comment.id, currentUser?.id]);
  
  const loadReplies = async () => {
    if (comment.replyCount && comment.replyCount > 0) {
      const fetchedReplies = await getCommentReplies(comment.id!);
      setReplies(fetchedReplies);
      setShowReplies(true);
    }
  };
  
  const handleLike = async () => {
    if (!currentUser) return;
    
    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    
    try {
      await onLike(comment.id!);
    } catch {
      // Revert on error
      setIsLiked(isLiked);
      setLikeCount(comment.likeCount || 0);
    }
  };
  
  const formatDate = (timestamp: Timestamp | Date | undefined) => {
    if (!timestamp) return '';
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp as unknown as string);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  if (comment.status === 'deleted') {
    return (
      <div className={`py-3 ${depth > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
        <p className="text-gray-400 italic text-sm">[Comment deleted]</p>
      </div>
    );
  }
  
  return (
    <div className={`py-4 ${depth > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''}`}>
      {/* Comment header */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.userAvatarUrl ? (
            <img 
              src={comment.userAvatarUrl} 
              alt={comment.userName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-gray-500 font-medium text-sm">
                {comment.userName?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-ink text-sm">{comment.userName}</span>
            <UserBadge 
              roles={comment.userRoles} 
              userId={comment.userId} 
              articleAuthorId={articleAuthorId}
            />
            <span className="text-gray-400 text-xs">•</span>
            <span className="text-gray-400 text-xs">{formatDate(comment.createdAt)}</span>
            {comment.editedAt && (
              <span className="text-gray-400 text-xs">(edited)</span>
            )}
          </div>
          
          {/* Comment body */}
          <p className="mt-1 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
            {comment.body}
          </p>
          
          {/* Actions */}
          <div className="mt-2 flex items-center gap-4 text-xs">
            {/* Like button */}
            <button
              onClick={handleLike}
              disabled={!currentUser}
              className={`flex items-center gap-1 transition-colors ${
                currentUser 
                  ? isLiked 
                    ? 'text-accent font-medium' 
                    : 'text-gray-500 hover:text-accent'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <span>{isLiked ? '❤️' : '🤍'}</span>
              <span>{likeCount > 0 ? likeCount : 'Like'}</span>
            </button>
            
            {/* Reply button */}
            {currentUser && depth < maxDepth && (
              <button
                onClick={() => onReply(comment.id!)}
                className="text-gray-500 hover:text-accent transition-colors"
              >
                Reply
              </button>
            )}
            
            {/* Edit button (owner only) */}
            {isOwner && (
              <button
                onClick={() => onEdit(comment)}
                className="text-gray-500 hover:text-blue-600 transition-colors"
              >
                Edit
              </button>
            )}
            
            {/* Delete button (owner or editor) */}
            {(isOwner || isEditor) && (
              <button
                onClick={() => onDelete(comment)}
                className="text-gray-500 hover:text-red-600 transition-colors"
              >
                Delete
              </button>
            )}
            
            {/* Moderation (editors only) */}
            {isEditor && comment.status === 'approved' && (
              <button
                onClick={() => onModerate(comment.id!, 'hidden')}
                className="text-gray-500 hover:text-orange-600 transition-colors"
              >
                Hide
              </button>
            )}
            {isEditor && comment.status === 'hidden' && (
              <button
                onClick={() => onModerate(comment.id!, 'approved')}
                className="text-gray-500 hover:text-green-600 transition-colors"
              >
                Unhide
              </button>
            )}
          </div>
          
          {/* Show replies button */}
          {comment.replyCount && comment.replyCount > 0 && !showReplies && (
            <button
              onClick={loadReplies}
              className="mt-2 text-xs text-accent hover:text-accent/80 font-medium"
            >
              Show {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
          
          {/* Replies */}
          {showReplies && replies.length > 0 && (
            <div className="mt-3">
              {replies.map(reply => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  articleAuthorId={articleAuthorId}
                  currentUser={currentUser}
                  isEditor={isEditor}
                  onReply={onReply}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onLike={onLike}
                  onModerate={onModerate}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Comment form component
function CommentForm({ 
  onSubmit, 
  onCancel,
  initialValue = '',
  placeholder = 'Share your thoughts...',
  submitLabel = 'Post Comment',
  isReply = false
}: {
  onSubmit: (body: string) => Promise<void>;
  onCancel?: () => void;
  initialValue?: string;
  placeholder?: string;
  submitLabel?: string;
  isReply?: boolean;
}) {
  const [body, setBody] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(body.trim());
      setBody('');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className={isReply ? 'mt-3 ml-12' : ''}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={isReply ? 2 : 3}
        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none text-sm"
        maxLength={2000}
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {body.length}/2000
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!body.trim() || isSubmitting}
            className="px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? 'Posting...' : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

// Main CommentSection component
export default function CommentSection({ articleId, articleAuthorId }: CommentSectionProps) {
  const { userData, currentUser, isEditor: checkIsEditor } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [sortBy, setSortBy] = useState<CommentSortOption>('recent');
  
  const isAuthenticated = !!currentUser;
  const user = userData;
  
  // Check if user is editor
  const isEditor = checkIsEditor();
  
  // Load comments
  const loadComments = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedComments = await getArticleComments(articleId, sortBy);
      setComments(fetchedComments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  }, [articleId, sortBy]);
  
  useEffect(() => {
    loadComments();
  }, [loadComments]);
  
  // Handle new comment
  const handleNewComment = async (body: string) => {
    if (!user) return;
    
    const newComment = await addComment(
      articleId,
      articleAuthorId,
      user,
      body,
      null
    );
    
    setComments(prev => [newComment, ...prev]);
  };
  
  // Handle reply
  const handleReply = async (body: string) => {
    if (!user || !replyingTo) return;
    
    await addComment(
      articleId,
      articleAuthorId,
      user,
      body,
      replyingTo
    );
    
    // Reload comments to show the reply
    await loadComments();
    setReplyingTo(null);
  };
  
  // Handle edit
  const handleEdit = async (body: string) => {
    if (!editingComment) return;
    
    await updateComment(editingComment.id!, body);
    
    setComments(prev => prev.map(c => 
      c.id === editingComment.id 
        ? { ...c, body, editedAt: Timestamp.now() }
        : c
    ));
    setEditingComment(null);
  };
  
  // Handle delete
  const handleDelete = async (comment: Comment) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    await deleteComment(comment.id!, articleId, comment.parentId);
    
    setComments(prev => prev.map(c => 
      c.id === comment.id 
        ? { ...c, status: 'deleted', body: '[Comment deleted]' }
        : c
    ));
  };
  
  // Handle like
  const handleLike = async (commentId: string) => {
    if (!user) return;
    await likeComment(commentId, user.id!);
  };
  
  // Handle moderation
  const handleModerate = async (commentId: string, status: 'approved' | 'hidden') => {
    await moderateComment(commentId, status);
    
    if (status === 'hidden') {
      setComments(prev => prev.filter(c => c.id !== commentId));
    } else {
      await loadComments();
    }
  };
  
  return (
    <div className="mt-10 pt-6 border-t border-gray-200">
      {/* Section header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-ink flex items-center gap-2">
          <span>💬</span>
          Comments
          {comments.length > 0 && (
            <span className="text-sm font-normal text-gray-500">
              ({comments.length})
            </span>
          )}
        </h2>
        
        {/* Sort options */}
        {comments.length > 1 && (
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setSortBy('recent')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                sortBy === 'recent'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSortBy('top')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                sortBy === 'top'
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Top
            </button>
          </div>
        )}
      </div>
      
      {/* New comment form */}
      {isAuthenticated ? (
        <div className="mb-8">
          <div className="flex items-start gap-3">
            {/* Current user avatar */}
            <div className="flex-shrink-0">
              {user?.avatarUrl || user?.profileImageUrl ? (
                <img 
                  src={user.avatarUrl || user.profileImageUrl} 
                  alt={user.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-accent font-medium">
                    {user?.displayName?.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <CommentForm onSubmit={handleNewComment} />
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600 mb-2">
            Sign in to join the conversation
          </p>
          <Link 
            to="/login" 
            className="inline-block px-4 py-2 bg-accent text-white text-sm font-medium rounded-lg hover:bg-accent/90 transition-colors"
          >
            Sign In
          </Link>
        </div>
      )}
      
      {/* Comments list */}
      {isLoading ? (
        <div className="py-8 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-accent border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm text-gray-500">Loading comments...</p>
        </div>
      ) : comments.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {comments.map(comment => (
            <div key={comment.id}>
              {editingComment?.id === comment.id ? (
                <div className="py-4">
                  <CommentForm
                    onSubmit={handleEdit}
                    onCancel={() => setEditingComment(null)}
                    initialValue={comment.body}
                    submitLabel="Save Changes"
                  />
                </div>
              ) : (
                <>
                  <CommentItem
                    comment={comment}
                    articleAuthorId={articleAuthorId}
                    currentUser={user}
                    isEditor={isEditor}
                    onReply={setReplyingTo}
                    onEdit={setEditingComment}
                    onDelete={handleDelete}
                    onLike={handleLike}
                    onModerate={handleModerate}
                  />
                  
                  {/* Reply form */}
                  {replyingTo === comment.id && (
                    <div className="pb-4">
                      <CommentForm
                        onSubmit={handleReply}
                        onCancel={() => setReplyingTo(null)}
                        placeholder={`Reply to ${comment.userName}...`}
                        submitLabel="Reply"
                        isReply
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
