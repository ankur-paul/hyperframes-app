'use client';

import { useCompositionStore } from '@/store/compositionStore';
import type { AspectRatio } from '@/types';
import { ASPECT_RATIOS } from '@/types';

export default function AspectRatioSelector() {
  const { aspectRatio, setAspectRatio } = useCompositionStore();

  const ratios: AspectRatio[] = ['16:9', '9:16', '1:1'];

  return (
    <div className="flex items-center gap-1 bg-[var(--color-bg-tertiary)] rounded-lg p-0.5">
      {ratios.map((ratio) => {
        const config = ASPECT_RATIOS[ratio];
        const isActive = aspectRatio === ratio;
        return (
          <button
            key={ratio}
            onClick={() => setAspectRatio(ratio)}
            className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded-md transition-all duration-200 ${
              isActive
                ? 'bg-[var(--color-accent)] text-white'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
            }`}
            title={config.label}
            id={`aspect-ratio-${ratio.replace(':', '-')}`}
          >
            <span>{config.icon}</span>
            <span className="font-medium">{ratio}</span>
          </button>
        );
      })}
    </div>
  );
}
