import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import type { Command } from '@tiptap/core';
import { EmbedPostView } from './embed-post-view';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    embedPost: {
      /**
       * Set an embed post with the given URL
       */
      setEmbedPost: (attributes: { url: string }) => ReturnType;
    };
  }
}

export interface EmbedPostOptions {
    HTMLAttributes: Record<string, unknown>;
}

export default Node.create<EmbedPostOptions>({
    name: 'embedPost',

    group: 'block',
    atom: true,
    draggable: true,

    addOptions() {
        return {
            HTMLAttributes: {},
        };
    },

    addAttributes() {
        return {
            postId: { default: null },
            username: { default: null },
            displayName: { default: null },
            provider: { default: 'x' },
            url: { default: null },
        };
    },

    parseHTML() {
        return [
            { tag: 'figure[data-embed-post]' },
        ];
    },

    renderHTML({ node, HTMLAttributes }) {
        const attrs = { ...this.options.HTMLAttributes, ...HTMLAttributes };
        const { postId, username, displayName, provider, url } = node.attrs;

        // Build canonical URL if one not provided
        const sourceUrl =
            url ||
            (username && postId ? `https://x.com/${username}/status/${postId}` : '');

        // Build credit line like: "Display Name of User / @SecWar / X"
        const parts: string[] = [];
        if (displayName) parts.push(displayName);
        if (username) parts.push(`@${username}`);
        if (provider) parts.push(provider.toUpperCase());
        const creditText = parts.join(' / ');

        // Minimal embed: a link to the source (apps can replace with oEmbed/iframe/nodeView)
        return [
            'figure',
            mergeAttributes({ 'data-embed-post': 'true', class: 'embed-post' }, attrs),
            [
                'div',
                { class: 'embed-post__body' },
                // show a simple link / placeholder — consumers can mount a richer view via nodeView
                ['a', { href: sourceUrl || '#', target: '_blank', rel: 'noopener noreferrer' }, sourceUrl || `${provider.toUpperCase()} post`],
            ],
            ['figcaption', { class: 'embed-post__credit' }, creditText],
        ];
    },

    addCommands() {
        return {
            setEmbedPost: (attributes: { url: string }): Command => ({ commands }) => {
                // Parse URL to extract post information
                const { url } = attributes;
                let postId: string | null = null;
                let username: string | null = null;
                
                if (url) {
                    // Extract from X/Twitter URL patterns
                    const xMatch = url.match(/(?:twitter\.com|x\.com)\/([^/]+)\/status\/(\d+)/);
                    if (xMatch) {
                        username = xMatch[1];
                        postId = xMatch[2];
                    }
                }
                
                return commands.insertContent({
                    type: this.name,
                    attrs: {
                        postId,
                        username,
                        displayName: username, // We'll use username as display name for now
                        provider: 'x',
                        url,
                    },
                });
            },
        };
    },

    addNodeView() {
        return ReactNodeViewRenderer(EmbedPostView);
    },
});
