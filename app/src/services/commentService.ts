import { 
  collection, 
  doc, 
  getDoc,
  getDocs, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  serverTimestamp,
  increment,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Comment, CommentLike, User } from '../types/models';

export type CommentSortOption = 'recent' | 'top';

/**
 * Get comments for an article (top-level only, approved)
 */
export async function getArticleComments(
  articleId: string, 
  sortBy: CommentSortOption = 'recent',
  limit: number = 50
): Promise<Comment[]> {
  // For 'top' sorting, we need to fetch and sort client-side since Firestore
  // doesn't support ordering by likeCount with the other filters efficiently
  const q = query(
    collection(db, 'comments'),
    where('articleId', '==', articleId),
    where('status', '==', 'approved'),
    where('parentId', '==', null), // Top-level comments only
    orderBy('createdAt', 'desc'),
    firestoreLimit(limit)
  );
  
  const snapshot = await getDocs(q);
  let comments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
  
  // Sort by likes if 'top' is selected
  if (sortBy === 'top') {
    comments = comments.sort((a, b) => (b.likeCount || 0) - (a.likeCount || 0));
  }
  
  return comments;
}

/**
 * Get replies to a comment
 */
export async function getCommentReplies(
  parentId: string,
  limit: number = 20
): Promise<Comment[]> {
  const q = query(
    collection(db, 'comments'),
    where('parentId', '==', parentId),
    where('status', '==', 'approved'),
    orderBy('createdAt', 'asc'),
    firestoreLimit(limit)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
}

/**
 * Get all comments for moderation (editors only)
 */
export async function getAllCommentsForModeration(
  status?: 'pending' | 'approved' | 'hidden',
  limit: number = 100
): Promise<Comment[]> {
  let q;
  if (status) {
    q = query(
      collection(db, 'comments'),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );
  } else {
    q = query(
      collection(db, 'comments'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limit)
    );
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
}

/**
 * Add a new comment
 */
export async function addComment(
  articleId: string,
  articleAuthorId: string | undefined,
  user: User,
  body: string,
  parentId: string | null = null
): Promise<Comment> {
  const commentData: Omit<Comment, 'id'> = {
    articleId,
    articleAuthorId: articleAuthorId || undefined,
    userId: user.id!,
    userName: user.displayName,
    userAvatarUrl: user.avatarUrl || user.profileImageUrl,
    userRoles: user.roles || [],
    body: body.trim(),
    parentId: parentId || undefined,
    replyCount: 0,
    likeCount: 0,
    status: 'approved', // Auto-approve for now, can change to 'pending' for moderation
    createdAt: Timestamp.now(),
  };

  const docRef = await addDoc(collection(db, 'comments'), commentData);
  
  // If this is a reply, increment parent's replyCount
  if (parentId) {
    await updateDoc(doc(db, 'comments', parentId), {
      replyCount: increment(1)
    });
  }
  
  // Increment article's commentCount
  await updateDoc(doc(db, 'articles', articleId), {
    commentCount: increment(1)
  });
  
  return { id: docRef.id, ...commentData };
}

/**
 * Update a comment (user editing their own)
 */
export async function updateComment(
  commentId: string,
  body: string
): Promise<void> {
  await updateDoc(doc(db, 'comments', commentId), {
    body: body.trim(),
    editedAt: serverTimestamp()
  });
}

/**
 * Soft delete a comment (marks as deleted, preserves for thread continuity)
 */
export async function deleteComment(
  commentId: string,
  articleId: string,
  parentId?: string
): Promise<void> {
  const batch = writeBatch(db);
  
  // Soft delete - mark as deleted
  batch.update(doc(db, 'comments', commentId), {
    status: 'deleted',
    body: '[Comment deleted]'
  });
  
  // Decrement article's commentCount
  batch.update(doc(db, 'articles', articleId), {
    commentCount: increment(-1)
  });
  
  // If this was a reply, decrement parent's replyCount
  if (parentId) {
    batch.update(doc(db, 'comments', parentId), {
      replyCount: increment(-1)
    });
  }
  
  await batch.commit();
}

/**
 * Moderate a comment (editors only)
 */
export async function moderateComment(
  commentId: string,
  status: 'approved' | 'hidden'
): Promise<void> {
  await updateDoc(doc(db, 'comments', commentId), { status });
}

/**
 * Like a comment
 */
export async function likeComment(
  commentId: string,
  userId: string
): Promise<void> {
  const likeId = `${commentId}_${userId}`;
  const likeRef = doc(db, 'commentLikes', likeId);
  const likeDoc = await getDoc(likeRef);
  
  if (likeDoc.exists()) {
    // Already liked, unlike
    const batch = writeBatch(db);
    batch.delete(likeRef);
    batch.update(doc(db, 'comments', commentId), {
      likeCount: increment(-1)
    });
    await batch.commit();
  } else {
    // Add like
    const batch = writeBatch(db);
    const likeData: CommentLike = {
      commentId,
      userId,
      createdAt: Timestamp.now()
    };
    batch.set(likeRef, likeData);
    batch.update(doc(db, 'comments', commentId), {
      likeCount: increment(1)
    });
    await batch.commit();
  }
}

/**
 * Check if user has liked a comment
 */
export async function hasLikedComment(
  commentId: string,
  userId: string
): Promise<boolean> {
  const likeId = `${commentId}_${userId}`;
  const likeDoc = await getDoc(doc(db, 'commentLikes', likeId));
  return likeDoc.exists();
}

/**
 * Get comment count for an article
 */
export async function getCommentCount(articleId: string): Promise<number> {
  const q = query(
    collection(db, 'comments'),
    where('articleId', '==', articleId),
    where('status', '==', 'approved')
  );
  const snapshot = await getDocs(q);
  return snapshot.size;
}
