// src/types/window.d.ts
export {};

declare global {
  interface Window {
    twttr?: {
      widgets?: {
        load: (el?: Element | null) => void;
      };
    };
    instgrm?: {
      Embeds?: {
        process?: () => void;
      };
    };
  }
}
