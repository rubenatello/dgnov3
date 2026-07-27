// embed-code-view.tsx
import React, { useEffect, useRef } from "react";
import type { NodeViewProps } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";
import "./embed-code.scss";

interface TwitterWidgetApi {
  widgets?: {
    load: (container?: HTMLElement | null) => void;
  };
}

declare global {
  interface Window {
    twttr?: TwitterWidgetApi;
  }
}

export const EmbedCodeView: React.FC<NodeViewProps> = ({ node }) => {
  const { code, type, displayName, username } = node.attrs as {
    code: string;
    type: "twitter" | "instagram" | "general";
    displayName?: string;
    username?: string;
  };

  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!embedRef.current) return;

    // Inject the embed HTML
    embedRef.current.innerHTML = code || "";

    // Special handling for X/Twitter
    if (type === "twitter") {
      if (typeof window !== "undefined" && !window.twttr) {
        const script = document.createElement("script");
        script.src = "https://platform.twitter.com/widgets.js";
        script.async = true;
        script.charset = "utf-8";
        document.head.appendChild(script);
        script.onload = () => window.twttr?.widgets?.load(embedRef.current);
      } else {
        window.twttr?.widgets?.load(embedRef.current);
      }
    }
  }, [code, type]);

  return (
    <NodeViewWrapper
      className="embed-code"
      data-embed-code="true"
      data-embed-type={type}
      contentEditable={false}
    >
      <div className="embed-code__content" ref={embedRef} />
      {(displayName || username) && (
        <div className="embed-code__caption">
          {displayName && <span>{displayName}</span>}
          {username && (
            <>
              {" / "}
              <a
                href={`https://x.com/${username}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                @{username}
              </a>
            </>
          )}
          {" / "}
          {type === "twitter" ? "X" : type === "instagram" ? "Instagram" : "Embed"}
        </div>
      )}
      <div className="embed-code__label">
        {type === "twitter" ? "X Post" : type === "instagram" ? "Instagram Post" : "Embedded Content"}
      </div>
    </NodeViewWrapper>
  );
};
