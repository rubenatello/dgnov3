# Tags & Sections Implementation

**Date:** October 17, 2025  
**Status:** ✅ Complete and Deployed

## What We Built

A complete tagging and categorization system for articles with:
- **Fixed sections** (categories) for site navigation
- **Dynamic tags** with autocomplete and auto-save to Firestore
- **Usage tracking** for tag analytics

---

## 1. Sections (Fixed Categories)

### Predefined List
Created `SECTIONS` constant in `src/types/models.ts`:

```typescript
export const SECTIONS = [
  'Politics',
  'Immigration',
  'Legislation',
  'Foreign Affairs',
  'Economy',
  'White House',
  'Courts',
  'Congress',
  'Human Rights',
  'Environment',
  'Business',
  'Tech',
  'Finance',
] as const;
```

### UI Update
- **Before:** Free text input
- **After:** Dropdown `<select>` with predefined options
- **Label:** "Section/Category" (clearer purpose)
- **User can only choose from the list** - ensures consistency

### Purpose
- Primary navigation for site header
- Consistent categorization across all articles
- No duplicate categories (e.g., "Tech" vs "Technology")
- Clean routing structure: `/articles/politics`, `/articles/tech`, etc.

---

## 2. Tags (Dynamic with Auto-Save)

### New Firestore Collection: `tags`

**Document Structure:**
```typescript
interface Tag {
  id?: string;                // Auto-generated slug (e.g., "climate-change")
  name: string;               // Display name (e.g., "Climate Change")
  slug: string;               // URL-safe version
  usageCount: number;         // How many articles use this tag
  createdAt: Timestamp;       // When tag was first created
  createdBy: string;          // User ID who created it
  lastUsed?: Timestamp;       // Last time used in an article
}
```

### Firestore Rules (Deployed)
```javascript
match /tags/{tagId} {
  // Anyone can read tags (for autocomplete)
  allow read: if true;
  
  // Writers can create new tags
  allow create: if isWriter();
  
  // Writers can update tag usage counts
  allow update: if isWriter();
  
  // Only editors can delete tags
  allow delete: if isEditor();
}
```

---

## 3. Tag Service (`src/services/tagService.ts`)

### Functions Created:

#### `getAllTags()`
- Fetches all tags ordered by usage count (most popular first)
- Used for displaying tag cloud or analytics

#### `searchTags(searchTerm)`
- Client-side filtering for autocomplete
- Searches tag names by substring match
- Filters out already-selected tags

#### `getTagBySlug(slug)`
- Finds a tag by its URL-safe slug
- Used to check if tag already exists

#### `createOrGetTag(name, userId)`
- Creates new tag if doesn't exist
- Returns existing tag ID if already exists
- Auto-generates slug from tag name
- Returns tag ID for reference

#### `incrementTagUsage(tagName)`
- Increases `usageCount` when tag is added to article
- Updates `lastUsed` timestamp
- Called when creating new articles

#### `decrementTagUsage(tagName)`
- Decreases `usageCount` when tag removed from article
- Never goes below 0
- Called when editing/deleting articles

#### `updateTagUsageCounts(oldTags, newTags)`
- Compares old vs new tag arrays
- Increments counts for added tags
- Decrements counts for removed tags
- Called when updating existing articles

#### `getPopularTags(limitCount)`
- Returns most-used tags for suggestions
- Default limit: 20 tags
- Ordered by usage count descending

---

## 4. TagInput Component (`src/components/TagInput.tsx`)

### Features:

**Auto-Complete**
- Searches Firestore tags as you type (300ms debounce)
- Shows matching tags with usage counts
- Keyboard navigation (Arrow Up/Down, Enter, Escape)
- Click to select from suggestions

**Add New Tags**
- Type any tag name and press Enter
- Automatically creates in Firestore if new
- Prevents duplicate tags in same article

**Selected Tags Display**
- Chips with tag name and × remove button
- Visual feedback with accent color
- Easy removal on click

**Props:**
```typescript
interface TagInputProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}
```

---

## 5. Integration in CreateEditArticlePage

### Section Dropdown
```tsx
<select
  value={section}
  onChange={e => setSection(e.target.value)}
  className="w-full border border-stone rounded px-4 py-2 focus:ring-2 focus:ring-accent bg-white"
>
  <option value="">Select a section...</option>
  {SECTIONS.map(s => (
    <option key={s} value={s}>{s}</option>
  ))}
</select>
```

### Tags Input
```tsx
<TagInput tags={tags} onTagsChange={setTags} />
```

### Tag Usage Tracking
**When creating new article:**
```typescript
await Promise.all(tags.map(tag => incrementTagUsage(tag)));
```

**When editing existing article:**
```typescript
await updateTagUsageCounts(originalTags, tags);
```
- Compares old tags with new tags
- Increments added tags, decrements removed tags
- Keeps usage counts accurate

---

## How It Works

### Creating an Article with Tags

1. **User types "Climate Change" in tag input**
2. TagInput searches Firestore for matching tags
3. If tag exists → Shows in autocomplete with usage count
4. If tag is new → User can still add it
5. On selecting tag:
   - `createOrGetTag()` creates new tag in Firestore (if needed)
   - Tag added to local `tags` array
6. On saving article:
   - `incrementTagUsage()` increases count for each tag
   - Article saves with tags array
   - Tags collection updated with new usage stats

### Editing an Article

1. **Load article** → Sets `originalTags` to existing tags
2. **User adds/removes tags** → Local `tags` state updates
3. **On save:**
   - `updateTagUsageCounts(originalTags, tags)` compares:
     - Removed tags → Decrement usage
     - Added tags → Increment usage
   - Article updates with new tags
   - Usage counts stay accurate

### Tag Autocomplete

1. **User types "cli"**
2. After 300ms debounce → `searchTags("cli")`
3. Firestore returns:
   - "Climate Change" (45 uses)
   - "Climate Policy" (23 uses)
4. Shows dropdown with tags and usage counts
5. User can arrow key navigate or click to select
6. Selected tag added to article

---

## Benefits

### For Editors/Writers
✅ **Consistent categories** - Fixed section dropdown prevents typos  
✅ **Smart tag suggestions** - Autocomplete shows existing tags  
✅ **Easy tag creation** - Can add new tags on the fly  
✅ **Visual feedback** - See how popular each tag is  

### For Readers (Future)
✅ **Browse by category** - Clean navigation menu  
✅ **Filter by tags** - Find related articles  
✅ **Popular tags** - Discover trending topics  

### For Site Performance
✅ **Usage tracking** - Know which tags are most popular  
✅ **Tag analytics** - See tag trends over time  
✅ **Clean data** - No duplicate tags (same slug check)  
✅ **Efficient queries** - Tags ordered by usage for faster autocomplete  

---

## File Structure

```
app/
├── src/
│   ├── types/
│   │   └── models.ts                    # Added SECTIONS & Tag interface
│   ├── services/
│   │   └── tagService.ts                # NEW - Tag Firestore operations
│   ├── components/
│   │   └── TagInput.tsx                 # NEW - Auto-complete tag input
│   └── pages/
│       └── dashboard/
│           └── CreateEditArticlePage.tsx # Updated with dropdown & TagInput
│
firestore.rules                           # Added tags collection rules
```

---

## Testing Checklist

### Section Dropdown
- [ ] Go to Create Article page
- [ ] See "Section/Category" dropdown
- [ ] Click dropdown → see all 13 predefined sections
- [ ] Select "Politics" → saves correctly
- [ ] Cannot type free text (only select from list)

### Tag Autocomplete
- [ ] Type "test" in tag input
- [ ] See autocomplete dropdown appear (if tags exist)
- [ ] Use arrow keys to navigate suggestions
- [ ] Press Enter to select highlighted tag
- [ ] Tag appears as chip below input

### Tag Creation
- [ ] Type new tag name "Climate Policy"
- [ ] Press Enter or click Add button
- [ ] Tag saves to Firestore (check Firebase Console)
- [ ] Tag appears in article tags array
- [ ] Tag `usageCount` = 1 in Firestore

### Tag Editing
- [ ] Load existing article with tags
- [ ] Add new tag → saves, increments usage
- [ ] Remove old tag → saves, decrements usage
- [ ] Original tags tracked correctly

### Tag Usage Counts
- [ ] Create article with tag "Test Tag"
- [ ] Check Firestore → `usageCount` = 1
- [ ] Create another article with same tag
- [ ] Check Firestore → `usageCount` = 2
- [ ] Delete first article
- [ ] Check Firestore → `usageCount` = 1

---

## Future Enhancements

### Tag Management Page (for Editors)
- View all tags with usage counts
- Merge duplicate tags
- Delete unused tags
- Rename tags globally

### Tag Analytics
- Most popular tags this month
- Trending tags (rising usage)
- Tag co-occurrence (often used together)

### Reader-Facing Features
- Tag cloud on homepage
- Browse by tag pages
- Related articles by tag
- Subscribe to tag for updates

### SEO Integration
- Auto-generate meta keywords from tags
- Schema.org article tags
- Tag-based sitemap

---

## Deployed ✅

**Firestore Rules:** Deployed with `firebase deploy --only firestore:rules`  
**Dev Server:** Running at http://localhost:5174  
**Ready to test:** Go to Dashboard → Articles → Create New Article

---

**All tags auto-save to Firestore and usage counts update automatically!** 🎉
