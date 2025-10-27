// embed-code-extension.ts
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { EmbedCodeView } from "./embed-code-view";

export interface EmbedCodeAttrs {
  code: string;                                // raw embed html (script tags allowed)
  type: "twitter" | "instagram" | "general";
  displayName?: string;
  username?: string;
}

export interface EmbedCodeOptions {
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    embedCode: {
      /** Insert an embed block with detected type + caption fields */
      setEmbedCode: (attributes: { code: string; type?: EmbedCodeAttrs["type"] }) => ReturnType;
      /** Replace currently selected embed’s code (and re-detect fields) */
      updateEmbedCode: (attributes: { code: string; type?: EmbedCodeAttrs["type"] }) => ReturnType;
    };
  }
}

export const EmbedCode = Node.create<EmbedCodeOptions>({
  name: "embedCode",
  group: "block",
  atom: true,
  draggable: true,

  addOptions() {
    return { HTMLAttributes: {} };
  },

  addAttributes() {
    return {
      code: {
        default: "",
        // Don’t render the raw HTML into SSR; React view will hydrate it.
        renderHTML: () => ({}),
        // Optional: allow round-trip from serialized HTML if you ever paste it back in.
        parseHTML: (el: HTMLElement) => el.getAttribute("data-embed-code-html") ?? "",
      },
      type: {
        default: "general",
        renderHTML: (attrs: EmbedCodeAttrs) => ({ "data-embed-type": attrs.type }),
        parseHTML: (el: HTMLElement) =>
          (el.getAttribute("data-embed-type") as EmbedCodeAttrs["type"]) ?? "general",
      },
      displayName: {
        default: "",
        renderHTML: (attrs: EmbedCodeAttrs) =>
          attrs.displayName ? { "data-embed-display": attrs.displayName } : {},
        parseHTML: (el: HTMLElement) => el.getAttribute("data-embed-display") ?? "",
      },
      username: {
        default: "",
        renderHTML: (attrs: EmbedCodeAttrs) =>
          attrs.username ? { "data-embed-username": attrs.username } : {},
        parseHTML: (el: HTMLElement) => el.getAttribute("data-embed-username") ?? "",
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-embed-code="true"]' }];
  },

  renderHTML({ node, HTMLAttributes }) {
    // Minimal SSR wrapper; store code in a data- attribute for optional round-tripping.
    // If you never need HTML round-trip, you can remove data-embed-code-html to keep output smaller.
    const attrs = mergeAttributes(
      { "data-embed-code": "true", class: "embed-code" },
      this.options.HTMLAttributes,
      HTMLAttributes,
      node.attrs.code ? { "data-embed-code-html": node.attrs.code } : {}
    );

    return [
      "div",
      attrs,
      ["div", { class: "embed-code__content" }],
      ["div", { class: "embed-code__label" }],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmbedCodeView, {
      stopEvent: () => true, // allow clicks inside embeds
    });
  },

  addCommands() {
    const detectType = (code: string): EmbedCodeAttrs["type"] => {
      const html = (code || "").toLowerCase();
      if (html.includes("twitter-tweet") || html.includes("platform.twitter.com")) return "twitter";
      if (html.includes("instagram.com") || html.includes("instagram-embed")) return "instagram";
      return "general";
    };

    const extractTwitter = (code: string) => {
      // Try multiple patterns for robustness
      const strongName = code.match(/<strong[^>]*>([^<]+)<\/strong>/i)?.[1]?.trim();
      const mdashName = code.match(/&mdash;\s*([^<(@]+)\s*\(/i)?.[1]?.trim();
      const hrefUser = code.match(/https?:\/\/(?:www\.)?twitter\.com\/([A-Za-z0-9_]{1,15})/i)?.[1];
      const atUser = code.match(/@([A-Za-z0-9_]{1,15})/i)?.[1];
      return {
        displayName: strongName || mdashName || "",
        username: hrefUser || atUser || "",
      };
    };

    const extractInstagram = (code: string) => {
      const hrefUser = code.match(/https?:\/\/(?:www\.)?instagram\.com\/([A-Za-z0-9_.]+)/i)?.[1];
      // Instagram embeds rarely include a separate display name; use username as fallback.
      return { displayName: "", username: hrefUser || "" };
    };

    const enrich = (code: string, forcedType?: EmbedCodeAttrs["type"]) => {
      const type = forcedType ?? detectType(code);
      if (type === "twitter") return { type, ...extractTwitter(code) };
      if (type === "instagram") return { type, ...extractInstagram(code) };
      return { type, displayName: "", username: "" };
    };

    return {
      setEmbedCode:
        ({ code, type }) =>
        ({ commands }) => {
          const meta = enrich(code, type);
          return commands.insertContent({
            type: this.name,
            attrs: { code, ...meta },
          });
        },

      updateEmbedCode:
        ({ code, type }) =>
        ({ chain, state }) => {
          const { selection } = state;
          const node = state.doc.nodeAt(selection.from);
          const meta = enrich(code, type);

          if (!node || node.type.name !== this.name) {
            // Not on an embed: insert a new one
            return chain()
              .focus()
              .insertContent({ type: this.name, attrs: { code, ...meta } })
              .run();
          }

          return chain()
            .updateAttributes(this.name, { code, ...meta })
            .run();
        },
    };
  },
});

export default EmbedCode;
