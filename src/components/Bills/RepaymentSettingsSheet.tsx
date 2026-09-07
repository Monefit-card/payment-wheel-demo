'use client';

import { useState } from 'react';
import { COLORS } from '@/lib/constants';
import { Sheet } from '@/components/ui/Sheet';
import { IconBolt, IconCard, IconChevron } from '@/components/ui/icons';
import {
  BrandMark,
  ChooseMethodSheet,
  DEFAULT_METHOD_ID,
  getMethodBrand,
  getMethodLabel,
} from '@/components/PaymentMethods/ChooseMethodSheet';

/* ── Settings scaffolding ────────────────────────────────────────────────── */

function SettingsSectionLabel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`text-[11px] font-semibold uppercase tracking-[0.5px] mb-2 ${className}`}
      style={{ color: COLORS.labelMuted }}
    >
      {children}
    </div>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.hairline}` }}
    >
      {children}
    </div>
  );
}

/** Inset so the divider starts past the icon column. */
function SettingsDivider() {
  return <div className="h-px ml-14" style={{ background: COLORS.hairline }} />;
}

function LockIcon({ size = 11, color = COLORS.labelMuted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none">
      <rect x="2.25" y="5.5" width="7.5" height="5.5" rx="1.2" stroke={color} strokeWidth="1.2" />
      <path
        d="M3.75 5.5V4a2.25 2.25 0 0 1 4.5 0v1.5"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

interface SwitchProps {
  on: boolean;
  /** A locked switch shows its state but can't be changed. */
  locked?: boolean;
  onToggle?: () => void;
}

function Switch({ on, locked = false, onToggle }: SwitchProps) {
  return (
    <button
      onClick={locked ? undefined : onToggle}
      aria-pressed={on}
      disabled={locked}
      className="relative w-12 h-7 rounded-full shrink-0"
      style={{
        background: on ? COLORS.flex : 'rgba(19,20,23,0.18)',
        opacity: locked ? 0.85 : 1,
        cursor: locked ? 'not-allowed' : 'pointer',
        transition: 'background 180ms ease',
      }}
    >
      <span
        className="absolute top-0.5 w-6 h-6 rounded-full"
        style={{
          left: on ? 22 : 2,
          background: COLORS.surface,
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          transition: 'left 180ms ease',
        }}
      />
    </button>
  );
}

interface SettingsRowProps {
  icon: React.ReactNode;
  label: React.ReactNode;
  description?: React.ReactNode;
  /** Trailing content on a navigation row — a brand mark, a badge. */
  trailing?: React.ReactNode;
  on?: boolean;
  locked?: boolean;
  onToggle?: () => void;
  /** Set on navigation rows; toggle rows leave it off and pass `on`/`onToggle`. */
  chevron?: boolean;
  onClick?: () => void;
}

function SettingsRow({
  icon,
  label,
  description,
  trailing,
  on = false,
  locked = false,
  onToggle,
  chevron = false,
  onClick,
}: SettingsRowProps) {
  const content = (
    <>
      <span className="w-[22px] inline-flex justify-center shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold" style={{ color: COLORS.textPrimary }}>
            {label}
          </span>
          {locked && <LockIcon />}
        </div>
        {description && (
          <div className="text-[11px] mt-0.5 leading-[1.4]" style={{ color: COLORS.labelMuted }}>
            {description}
          </div>
        )}
      </div>
      {trailing}
      {chevron ? (
        <IconChevron color="rgba(19,20,23,0.35)" />
      ) : (
        <Switch on={on} locked={locked} onToggle={onToggle} />
      )}
    </>
  );

  const className = 'flex items-center gap-3.5 px-4 py-3.5';

  return onClick ? (
    <button onClick={onClick} className={`${className} w-full text-left`}>
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

/* ── Sheet ───────────────────────────────────────────────────────────────── */

interface RepaymentSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * "Manage your payments" — the settings entry point in the Bills header.
 *
 * Two grouped sections sharing the same visuals: which account bills are taken
 * from, then what is taken automatically. AutoPay is held in component state,
 * not persisted: this app is scenario-driven and server-rendered, so reading a
 * stored preference on mount would desync the first client render.
 */
export function RepaymentSettingsSheet({ isOpen, onClose }: RepaymentSettingsSheetProps) {
  const [creditAutoPay, setCreditAutoPay] = useState(false);
  const [methodId, setMethodId] = useState(DEFAULT_METHOD_ID);
  const [methodsOpen, setMethodsOpen] = useState(false);

  return (
    <>
      {/* Sits below the method picker's z-50 so it stays visible behind it. */}
      <Sheet isOpen={isOpen} onClose={onClose} title="Manage your payments" zIndex={40}>
        <SettingsSectionLabel>Payment method</SettingsSectionLabel>
        <SettingsCard>
          <SettingsRow
            icon={<BrandMark brand={getMethodBrand(methodId)} width={26} />}
            label={getMethodLabel(methodId)}
            description="Default account"
            onClick={() => setMethodsOpen(true)}
            chevron
          />
        </SettingsCard>

        <SettingsSectionLabel className="mt-[18px]">AutoPay</SettingsSectionLabel>
        <SettingsCard>
          <SettingsRow
            icon={<IconCard size={20} />}
            label="Credit AutoPay"
            description={
              creditAutoPay
                ? 'Your credit bill is paid in full on the due date.'
                : 'Pay your credit bill manually each month.'
            }
            on={creditAutoPay}
            onToggle={() => setCreditAutoPay((v) => !v)}
          />
          <SettingsDivider />
          {/* Flex plans are only offered on the condition that instalments are
              collected automatically, so this switch is on and not editable. */}
          <SettingsRow
            icon={<IconBolt size={20} />}
            label="Flex AutoPay"
            description="Required for Flex plans — instalments are paid automatically."
            on
            locked
          />
        </SettingsCard>
      </Sheet>

      <ChooseMethodSheet
        isOpen={methodsOpen}
        selectedId={methodId}
        onSelect={(id) => {
          setMethodId(id);
          setMethodsOpen(false);
        }}
        onClose={() => setMethodsOpen(false)}
      />
    </>
  );
}
