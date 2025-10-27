// article-embed.tsx
import { useEffect, type DependencyList } from "react";

export function HydrateEmbeds({
  htmlContainerSelector = ".article-content",
  deps = [],
}: {
  htmlContainerSelector?: string;
  deps?: DependencyList;
}) {
  useEffect(() => {
    const container = document.querySelector(htmlContainerSelector);
    if (!container) return;

    const nodes = Array.from(
      container.querySelectorAll<HTMLElement>("[data-embed-code-html]")
    );

    nodes.forEach((node) => {
      const html = node.getAttribute("data-embed-code-html") || "";
      const type = (node.getAttribute("data-embed-type") || "").toLowerCase();

      // match what the extension renders
      const displayName = node.getAttribute("data-embed-display") || "";
      const username = node.getAttribute("data-embed-username") || "";

      const contentEl =
        node.querySelector<HTMLElement>(".embed-code__content") || node;
      contentEl.innerHTML = html;

      // --- Social embed hydration ---
      if (type === "twitter" || html.toLowerCase().includes("twitter")) {
        if (!window.twttr) {
          const s = document.createElement("script");
          s.src = "https://platform.twitter.com/widgets.js";
          s.async = true;
          s.charset = "utf-8";
          document.head.appendChild(s);
          s.onload = () => window.twttr?.widgets?.load(contentEl);
        } else {
          window.twttr.widgets?.load(contentEl);
        }
      }

      if (type === "instagram" || html.toLowerCase().includes("instagram")) {
        if (!window.instgrm) {
          const s = document.createElement("script");
          s.src = "https://www.instagram.com/embed.js";
          s.async = true;
          document.head.appendChild(s);
          s.onload = () => window.instgrm?.Embeds?.process?.();
        } else {
          window.instgrm.Embeds?.process?.();
        }
      }

      // --- Caption (DisplayName / @user / Platform) ---
      if (!node.querySelector(".embed-code__caption")) {
        const hasNameOrUser = !!displayName || !!username;
        if (hasNameOrUser) {
          const caption = document.createElement("div");
          caption.className = "embed-code__caption";

          if (displayName) {
            const span = document.createElement("span");
            span.textContent = displayName;
            caption.appendChild(span);
          }

          if (username) {
            if (caption.childNodes.length) {
              caption.appendChild(document.createTextNode(" / "));
            }
            const a = document.createElement("a");
            a.href = `https://x.com/${username}`;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.textContent = `@${username}`;
            caption.appendChild(a);
          }

          if (caption.childNodes.length) {
            caption.appendChild(document.createTextNode(" / "));
          }
          caption.appendChild(
            document.createTextNode(
              type === "twitter" ? "X" : type === "instagram" ? "Instagram" : "Embed"
            )
          );

          node.appendChild(caption);
        }

        const label = document.createElement("div");
        label.className = "embed-code__label";
        label.textContent =
          type === "twitter"
            ? "X Post"
            : type === "instagram"
            ? "Instagram Post"
            : "Embedded Content";
        node.appendChild(label);
      }

      node.removeAttribute("data-embed-code-html");
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, ([htmlContainerSelector, ...deps] as DependencyList));

  return null;
}
