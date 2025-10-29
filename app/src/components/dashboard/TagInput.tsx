import { useState, useEffect, useRef } from 'react';
import { searchTags, createOrGetTag } from '../../services/tagService';
import { useAuth } from '../../hooks/useAuth';
import type { Tag } from '../../types/models';

interface TagInputProps {
  tags: string[]; // array of tag slugs
  onTagsChange: (tags: string[]) => void;
}

export default function TagInput({ tags, onTagsChange }: TagInputProps) {
  const { userData, isWriter } = useAuth();
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Tag[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch tag suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (input.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      try {
        const results = await searchTags(input);
        // Filter out already selected tags by slug
        const filtered = results.filter(tag => !tags.includes(tag.slug));
        setSuggestions(filtered);
      } catch (error) {
        console.error('Error fetching tag suggestions:', error);
        setSuggestions([]);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [input, tags]);

  // Helper to get display name from slug
  function getTagDisplayName(slug: string): string {
    const found = suggestions.find(tag => tag.slug === slug);
    if (found) return found.name;
    // Fallback: prettify slug
    return slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  const handleAddTag = async (tagName?: string) => {
    const nameToAdd = tagName || input.trim();
    if (!nameToAdd) return;

    // Try to find tag in suggestions
    let tagObj = suggestions.find(tag => tag.name.toLowerCase() === nameToAdd.toLowerCase());

    // If not found, create or get tag from backend
    if (!tagObj) {
      if (userData && isWriter && isWriter()) {
        const tagId = await createOrGetTag(nameToAdd, userData.id!);
        // Ideally, fetch the tag object by ID here, but fallback to slugify
        tagObj = { id: tagId, name: nameToAdd, slug: slugifyTag(nameToAdd), usageCount: 1 };
      } else {
        tagObj = { id: '', name: nameToAdd, slug: slugifyTag(nameToAdd), usageCount: 1 };
      }
    }

    // Check if slug already exists
    if (tags.includes(tagObj.slug)) {
      setInput('');
      setShowSuggestions(false);
      return;
    }

    // Add slug to tags array
    onTagsChange([...tags, tagObj.slug]);
    setInput('');
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedIndex(-1);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleAddTag(suggestions[selectedIndex].name);
      } else if (input.trim()) {
        handleAddTag();
      }
    } else if (e.key === 'Backspace') {
      if (input.trim() === '' && tags.length > 0) {
        e.preventDefault();
        handleRemoveTag(tags[tags.length - 1]);
        return;
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  // Helper to slugify a tag name
  function slugifyTag(tag: string): string {
    return tag
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  return (
    <div className="relative">
      <div className="flex gap-2 mb-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => {
              setInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            className="w-full border border-stone rounded px-4 py-2 focus:ring-2 focus:ring-accent"
            placeholder="Type a tag and press Enter"
          />

          {/* Autocomplete suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-stone rounded shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((tag, index) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleAddTag(tag.name)}
                  className={`w-full text-left px-4 py-2 hover:bg-accent hover:bg-opacity-10 transition-colors ${
                    index === selectedIndex ? 'bg-accent bg-opacity-10' : ''
                  }`}
                >
                  <span className="font-medium">{tag.name}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({tag.usageCount} {tag.usageCount === 1 ? 'use' : 'uses'})
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleAddTag()}
          className="px-4 py-2 bg-stone text-ink rounded hover:bg-accent hover:text-white transition-colors"
        >
          Add
        </button>
      </div>

      {/* Active tags popup (appears under input) */}
      {tags.length > 0 && (
        <div className="mt-2 w-full bg-white border border-stone rounded p-3 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {tags.map(tagSlug => (
              <span
                key={tagSlug}
                className="inline-flex items-center gap-2 px-3 py-1 bg-accent bg-opacity-90 text-white rounded-full text-sm"
              >
                <span className="select-none">{getTagDisplayName(tagSlug)}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tagSlug)}
                  className="ml-1 text-xs text-white hover:text-red-300 transition-colors"
                  aria-label={`Remove ${getTagDisplayName(tagSlug)} tag`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}