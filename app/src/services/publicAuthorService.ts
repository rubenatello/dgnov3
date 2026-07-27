export interface PublicAuthorProfile {
  id: string;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  profileImageUrl?: string;
  website?: string;
}

export async function getPublicAuthor(authorId: string): Promise<PublicAuthorProfile | null> {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(authorId)) return null;
  const response = await fetch(`/api/authors/${encodeURIComponent(authorId)}`, {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Public author API returned ${response.status}.`);
  const payload = await response.json() as Record<string, unknown>;
  const candidate = payload.author && typeof payload.author === 'object'
    ? payload.author as Record<string, unknown>
    : payload;
  if (typeof candidate.displayName !== 'string' || !candidate.displayName.trim()) return null;
  return {
    id: typeof candidate.id === 'string' ? candidate.id : authorId,
    displayName: candidate.displayName.trim(),
    bio: typeof candidate.bio === 'string' ? candidate.bio : undefined,
    avatarUrl: typeof candidate.avatarUrl === 'string' ? candidate.avatarUrl : undefined,
    profileImageUrl: typeof candidate.profileImageUrl === 'string' ? candidate.profileImageUrl : undefined,
    website: typeof candidate.website === 'string' ? candidate.website : undefined,
  };
}
