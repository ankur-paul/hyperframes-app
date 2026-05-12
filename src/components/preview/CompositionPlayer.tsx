"use client";

import { createElement, useEffect, useMemo } from "react";
import { useCompositionStore } from "@/store/compositionStore";

type HyperframesPlayerProps = React.HTMLAttributes<HTMLElement> & {
  src: string;
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
};

export default function CompositionPlayer() {
  const { currentHtml, previewKey } = useCompositionStore();

  useEffect(() => {
    // Import player custom element on client side
    import("@hyperframes/player").catch(console.error);
  }, []);

  const blobUrl = useMemo(() => {
    if (
      !currentHtml ||
      typeof Blob === "undefined" ||
      typeof URL === "undefined"
    ) {
      return null;
    }

    // Wrap in full HTML doc
    const fullHtml = `<!DOCTYPE html>
<!-- preview-key:${previewKey} -->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
  </style>
</head>
<body>
${currentHtml}
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html" });
    return URL.createObjectURL(blob);
  }, [currentHtml, previewKey]);

  useEffect(
    () => () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    },
    [blobUrl]
  );

  if (!currentHtml) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[var(--color-bg-tertiary)] flex items-center justify-center">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-text-muted)"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <line x1="7" y1="2" x2="7" y2="22" />
              <line x1="17" y1="2" x2="17" y2="22" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <line x1="2" y1="7" x2="7" y2="7" />
              <line x1="2" y1="17" x2="7" y2="17" />
              <line x1="17" y1="7" x2="22" y2="7" />
              <line x1="17" y1="17" x2="22" y2="17" />
            </svg>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            No composition yet
          </p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1 opacity-60">
            Describe a video in the chat to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black">
      {blobUrl &&
        createElement("hyperframes-player", {
          key: previewKey,
          src: blobUrl,
          controls: true,
          autoplay: true,
          style: { width: "100%", height: "100%", display: "block" },
        } as HyperframesPlayerProps & React.Attributes)}
    </div>
  );
}
