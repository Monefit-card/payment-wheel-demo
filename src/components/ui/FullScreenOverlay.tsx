'use client';

import { COLORS } from '@/lib/constants';

/**
 * Full-screen page chrome — ported from the prototype's `FlexScreen`.
 * Nav row with a back button, an optional title, a scrollable body and a
 * sticky footer.
 *
 * The prototype used `position: fixed`, which worked because the phone frame
 * carried a `translateZ` transform. Here the frame is a positioned,
 * overflow-hidden container, so the overlay is `absolute inset-0` INSIDE it
 * and covers the status bar the same way.
 */

interface FullScreenOverlayProps {
  onBack: () => void;
  /** Large, left-aligned, below the nav row. */
  title?: React.ReactNode;
  /** Centred inside the nav row — the standard placement for screen titles. */
  centerTitle?: React.ReactNode;
  /** Right-hand nav slot: a pill button, an amount, an info control. */
  right?: React.ReactNode;
  /** Pinned below the scroll area — usually a `PrimaryButton`. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  backLabel?: string;
  /** Stacking order inside the phone frame. */
  zIndex?: number;
}

/** White rounded nav button — the shared shape for every control in the nav row. */
export const NAV_BUTTON_STYLE: React.CSSProperties = {
  background: COLORS.surface,
  border: 'none',
  flexShrink: 0,
  boxShadow: '0 1px 3px rgba(19,20,23,0.05)',
};

export function FullScreenOverlay({
  onBack,
  title,
  centerTitle,
  right,
  footer,
  children,
  backLabel = 'Back',
  zIndex = 50,
}: FullScreenOverlayProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{ zIndex, background: COLORS.screen }}
    >
      {/* Nav row. The top padding clears the status bar the overlay covers. */}
      <div className="pt-14 px-4 pb-1.5">
        <div className="relative flex items-center justify-between">
          {centerTitle && (
            <div
              className="absolute left-0 right-0 text-center text-lg font-bold tracking-[-0.3px] pointer-events-none"
              style={{ color: COLORS.textPrimary }}
            >
              {centerTitle}
            </div>
          )}

          <button
            onClick={onBack}
            aria-label={backLabel}
            className="w-[46px] h-[46px] rounded-[18px] flex items-center justify-center"
            style={NAV_BUTTON_STYLE}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
              <path
                d="M19 12H5M11 6l-6 6 6 6"
                stroke={COLORS.textPrimary}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {right ?? <div className="w-[46px]" />}
        </div>
      </div>

      {title && (
        <div
          className="px-5 pt-1.5 pb-3.5 text-[28px] font-bold tracking-[-0.6px] leading-[1.1]"
          style={{ color: COLORS.textPrimary }}
        >
          {title}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 pb-4">{children}</div>

      {footer && <div className="px-4 pt-3 pb-[30px]">{footer}</div>}
    </div>
  );
}
