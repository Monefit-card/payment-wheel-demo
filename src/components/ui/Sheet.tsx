'use client';

import { COLORS } from '@/lib/constants';
import { IconChevron, IconClose } from './icons';

/**
 * Bottom sheet — scrim, rounded panel, optional header. Generalised from the
 * prototype's `SheetShell` / `SheetHeader`.
 *
 * The prototype used `position: fixed`, which worked because the phone frame
 * carried a `translateZ` transform. In this app the frame is a positioned,
 * overflow-hidden container, so overlays are `absolute inset-0` INSIDE it.
 *
 * Kept mounted and driven by CSS transitions rather than an animated mount: a
 * dropped frame callback (backgrounded tab) would otherwise leave the sheet
 * parked mid-slide — the same reason the screen transitions avoid it.
 */

interface SheetHeaderProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose?: () => void;
  onBack?: () => void;
}

/** Grab handle, centred title, and corner back/close buttons. */
export function SheetHeader({ title, subtitle, onClose, onBack }: SheetHeaderProps) {
  const cornerButton: React.CSSProperties = {
    background: COLORS.surface,
    border: `1px solid ${COLORS.hairline}`,
  };

  return (
    <div className="mb-[18px]">
      <div
        className="w-9 h-1 rounded-full mx-auto mb-3.5"
        style={{ background: 'rgba(19,20,23,0.18)' }}
      />
      <div className="relative text-center min-h-8">
        {onBack && (
          <button
            onClick={onBack}
            aria-label="Back"
            className="absolute -top-1 left-0 w-8 h-8 rounded-lg inline-flex items-center justify-center"
            style={cornerButton}
          >
            <IconChevron dir="left" size={12} color={COLORS.textPrimary} />
          </button>
        )}

        {title && (
          <h2
            className="text-base font-bold tracking-[-0.2px] m-0"
            style={{ color: COLORS.textPrimary }}
          >
            {title}
          </h2>
        )}

        {subtitle && (
          <div className="mt-1 text-xs leading-[1.4]" style={{ color: COLORS.labelMuted }}>
            {subtitle}
          </div>
        )}

        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute -top-1 right-0 w-8 h-8 rounded-lg inline-flex items-center justify-center"
            style={cornerButton}
          >
            <IconClose size={12} color={COLORS.textPrimary} />
          </button>
        )}
      </div>
    </div>
  );
}

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Renders a back button in the header's left corner. */
  onBack?: () => void;
  /** Drop the header entirely — for sheets that draw their own. */
  hideHeader?: boolean;
  /** Stacking order inside the phone frame. Raise it to sit over another sheet. */
  zIndex?: number;
  /** Extra classes on the sheet panel (padding overrides, etc.). */
  className?: string;
}

export function Sheet({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  onBack,
  hideHeader = false,
  zIndex = 50,
  className = '',
}: SheetProps) {
  return (
    <div
      className={`absolute inset-0 ${isOpen ? '' : 'pointer-events-none'}`}
      style={{ zIndex }}
      aria-hidden={!isOpen}
    >
      {/* Scrim — overshoots the top so the status-bar strip dims too; the
          phone frame's overflow-hidden clips the excess. */}
      <div
        onClick={onClose}
        className="absolute left-0 right-0 bottom-0"
        style={{
          top: -200,
          background: COLORS.scrim,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.24s ease',
        }}
      />

      <div
        className={`absolute bottom-0 inset-x-0 rounded-t-[24px] max-h-[85%] overflow-y-auto no-scrollbar px-5 pt-2.5 pb-7 ${className}`}
        style={{
          background: COLORS.surface,
          boxShadow: '0 -8px 24px rgba(0,0,0,0.08)',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.34s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {!hideHeader && (
          <SheetHeader title={title} subtitle={subtitle} onClose={onClose} onBack={onBack} />
        )}
        {children}
      </div>
    </div>
  );
}
