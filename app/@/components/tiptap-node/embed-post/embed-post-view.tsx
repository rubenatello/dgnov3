import React from "react";
import type { NodeViewProps } from '@tiptap/react';
import './embed-post.scss';

export const EmbedPostView: React.FC<NodeViewProps> = ({ node }) => {
	const { url, postId, username, displayName, provider } = node.attrs;
	const sourceUrl = url || (username && postId ? `https://x.com/${username}/status/${postId}` : "");
	const creditText = [displayName, username ? `@${username}` : null, provider ? provider.toUpperCase() : null].filter(Boolean).join(" / ");

	// For X posts, render blockquote with link (future: oEmbed/iframe)
	let embedContent: React.ReactNode = null;
	if (provider === "x" && sourceUrl) {
		embedContent = (
			<blockquote className="embed-post__blockquote">
				<a href={sourceUrl} target="_blank" rel="noopener noreferrer">
					View X post
				</a>
			</blockquote>
		);
	} else {
		embedContent = (
			<a href={sourceUrl || "#"} target="_blank" rel="noopener noreferrer">
				{sourceUrl || "Embedded post"}
			</a>
		);
	}

	return (
		<figure className="embed-post" data-embed-post>
			<div className="embed-post__body">
				{embedContent}
			</div>
			{creditText && (
				<figcaption className="embed-post__credit">{creditText}</figcaption>
			)}
		</figure>
	);
};
