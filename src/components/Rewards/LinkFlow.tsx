'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { FullScreenOverlay } from '@/components/ui/FullScreenOverlay';
import { Card } from '@/components/ui/Card';
import { IconCheck } from '@/components/ui/icons';
import { COLORS } from '@/lib/constants';
import {
  addMonths,
  CASHBACK_RULES,
  formatLongDate,
  SMARTSAVER_PROFILE,
  startOfDay,
} from '@/lib/smartsaver';
import { eurWhole } from './format';
import { SMART_SURFACE, SmartCardArt, SmartSurfaceLayers } from './SmartArt';
import { IconLock, IconVault, SmartSaverMark } from './icons';

/**
 * Linking the card to SmartSaver, from the Rewards tab.
 *
 *   login_match  → log in (email already known) → consent → confirmation
 *   login_other  → log in (any email)           → consent → confirmation
 *   open         → open an account from card KYC        → confirmation
 *
 * The login is native — a sheet in the card app, not a web view or an app
 * switch. The link itself (`onLink`) happens on consent, or on opening the
 * account; the confirmation that follows only explains what just started.
 */

export type LinkMode = 'login_match' | 'login_other' | 'open';

type Step = 'login' | 'consent' | 'open' | 'working' | 'done';

interface LinkFlowProps {
  mode: LinkMode;
  onLink: () => void;
  onOpenAndLink: () => void;
  onClose: () => void;
  /** Finish on the Rewards tab, showing the new vault. */
  onDone: () => void;
}

const FIELD: React.CSSProperties = {
  background: COLORS.screen,
  border: `1px solid ${COLORS.hairline}`,
  color: COLORS.textPrimary,
};

function Spinner({ color = COLORS.textPrimary }: { color?: string }) {
  return (
    <span
      className="inline-block w-5 h-5 rounded-full animate-spin"
      style={{ border: `2px solid ${color}33`, borderTopColor: color }}
    />
  );
}

/* ── Login ───────────────────────────────────────────────────────────────── */

type LoginMethod = 'apple' | 'google' | 'password';

function AppleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden>
      <path d="M16.37 12.6c.02 2.52 2.2 3.36 2.23 3.37-.02.06-.35 1.2-1.15 2.37-.69 1.01-1.41 2.02-2.55 2.04-1.11.02-1.47-.66-2.75-.66-1.27 0-1.67.64-2.73.68-1.1.04-1.94-1.09-2.64-2.1-1.43-2.07-2.53-5.86-1.06-8.42.73-1.27 2.04-2.08 3.46-2.1 1.08-.02 2.1.73 2.75.73.66 0 1.9-.9 3.2-.77.54.02 2.07.22 3.05 1.66-.08.05-1.82 1.06-1.8 3.2zM14.28 5.1c.58-.71.98-1.69.87-2.67-.84.03-1.86.56-2.46 1.27-.54.62-1.01 1.62-.88 2.58.94.07 1.89-.47 2.47-1.18z" />
    </svg>
  );
}

function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0012 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 010-4.2V7.06H2.18a11 11 0 000 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0012 1 11 11 0 002.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

/**
 * SmartSaver's own sign-in options: Apple, Google, or email + password. The
 * matched email is shown up front, but we can't know which method the
 * account was created with, so all three stay on offer.
 */
function LoginStep({ matched, onSuccess }: { matched: boolean; onSuccess: () => void }) {
  const [email, setEmail] = useState(matched ? SMARTSAVER_PROFILE.email : '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<LoginMethod | null>(null);

  useEffect(() => {
    if (!busy) return;
    const t = setTimeout(onSuccess, busy === 'password' ? 900 : 1400);
    return () => clearTimeout(t);
  }, [busy, onSuccess]);

  const canSubmit = email.includes('@') && password.length > 0 && !busy;

  const provider = (method: 'apple' | 'google', label: string, logo: React.ReactNode, dark: boolean) => (
    <button
      type="button"
      onClick={() => setBusy(method)}
      disabled={!!busy}
      className="w-full py-[15px] rounded-2xl text-[15.5px] font-semibold flex items-center justify-center gap-2.5"
      style={
        dark
          ? { background: '#000', color: '#fff' }
          : { background: COLORS.surface, color: COLORS.textPrimary, border: `1px solid ${COLORS.surfaceBorder}` }
      }
    >
      {busy === method ? (
        <>
          <Spinner color={dark ? '#fff' : COLORS.textPrimary} /> Connecting to {label}…
        </>
      ) : (
        <>
          {logo} Continue with {label}
        </>
      )}
    </button>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) setBusy('password');
      }}
    >
      <div className="flex flex-col items-center text-center -mt-1 mb-5">
        <SmartSaverMark size={52} />
        <h2 className="mt-3 mb-0 text-[20px] font-bold tracking-[-0.3px]" style={{ color: COLORS.textPrimary }}>
          Log in to SmartSaver
        </h2>
        <p className="mt-1 mb-0 text-[13.5px] leading-[1.45]" style={{ color: COLORS.labelMuted }}>
          {matched ? (
            <>
              Log in as <b style={{ color: COLORS.textPrimary }}>{SMARTSAVER_PROFILE.email}</b> — the email on your
              Monefit card.
            </>
          ) : (
            'Use the account you want cashback paid into.'
          )}
        </p>
      </div>

      <div className="space-y-2.5">
        {provider('apple', 'Apple', <AppleLogo />, true)}
        {provider('google', 'Google', <GoogleLogo />, false)}
      </div>

      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 h-px" style={{ background: COLORS.divider }} />
        <span className="text-[12.5px]" style={{ color: COLORS.textMuted }}>
          or with email
        </span>
        <div className="flex-1 h-px" style={{ background: COLORS.divider }} />
      </div>

      {matched ? (
        <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl text-[15px]" style={FIELD}>
          <span>{SMARTSAVER_PROFILE.email}</span>
          <span
            className="text-[12px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: COLORS.cashbackSoft, color: COLORS.cashbackText }}
          >
            Matched
          </span>
        </div>
      ) : (
        <input
          type="email"
          autoComplete="off"
          aria-label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full px-4 py-3.5 rounded-2xl text-[15px] outline-none"
          style={FIELD}
        />
      )}

      <input
        type="password"
        autoComplete="off"
        aria-label="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password (any works in this demo)"
        className="w-full mt-2.5 px-4 py-3.5 rounded-2xl text-[15px] outline-none"
        style={FIELD}
      />
      <div className="text-right mt-2 mr-1">
        <span className="text-[13px] font-medium" style={{ color: COLORS.textSecondary }}>
          Forgot password?
        </span>
      </div>

      <div className="mt-4">
        <PrimaryButton type="submit" disabled={!canSubmit}>
          {busy === 'password' ? 'Logging in…' : 'Log in'}
        </PrimaryButton>
      </div>
    </form>
  );
}

/* ── Consent ─────────────────────────────────────────────────────────────── */

function ConsentStep({ onAllow, onCancel }: { onAllow: () => void; onCancel: () => void }) {
  const unlocks = formatLongDate(addMonths(startOfDay(new Date()), CASHBACK_RULES.lockMonths));
  const rows = [
    'Open a Cashback Vault in your SmartSaver account',
    'Pay your card cashback into it every day',
    'Show your SmartSaver balances and activity here',
  ];
  return (
    <>
      <div className="flex items-center justify-center gap-3 mb-4 -mt-1">
        <div className="w-[52px] h-[52px] rounded-[16px] flex items-center justify-center" style={{ background: COLORS.smartInk }}>
          <span className="text-white font-semibold tracking-[-0.04em] text-[15px]">
            m<span style={{ color: COLORS.smartAccent }}>.</span>
          </span>
        </div>
        <span className="text-[18px]" style={{ color: COLORS.textMuted }}>
          ⇄
        </span>
        <SmartSaverMark size={52} />
      </div>
      <h2 className="text-center m-0 text-[20px] font-bold tracking-[-0.3px]" style={{ color: COLORS.textPrimary }}>
        Link your card to SmartSaver
      </h2>
      <p className="text-center mt-1 mb-4 text-[13.5px]" style={{ color: COLORS.labelMuted }}>
        Monefit Card will be able to:
      </p>

      <Card radius={18} className="px-4 py-1" style={{ background: COLORS.screen, boxShadow: 'none' }}>
        {rows.map((r) => (
          <div key={r} className="flex items-start gap-3 py-3">
            <span
              className="mt-0.5 shrink-0 w-[18px] h-[18px] rounded-full flex items-center justify-center"
              style={{ background: COLORS.cashback }}
            >
              <IconCheck size={9} />
            </span>
            <span className="text-[14px] leading-[1.4]" style={{ color: COLORS.textPrimary }}>
              {r}
            </span>
          </div>
        ))}
      </Card>

      <div
        className="mt-3 flex items-start gap-2.5 px-4 py-3 rounded-2xl text-[13px] leading-[1.45]"
        style={{ background: '#FFF6E5', color: '#7A4B00' }}
      >
        <span className="mt-[3px]">
          <IconLock size={13} color="#7A4B00" />
        </span>
        <span>
          The Cashback Vault stays locked until <b>{unlocks}</b>. Money in it can’t be withdrawn before then.
        </span>
      </div>

      <p className="mt-3 mb-4 text-[12.5px] leading-[1.5]" style={{ color: COLORS.textMuted }}>
        It can’t move or withdraw your other savings. Only purchases from now on earn cashback. Unlink any time in
        Rewards.
      </p>

      <PrimaryButton onClick={onAllow}>Allow and link</PrimaryButton>
      <button onClick={onCancel} className="w-full mt-1 py-3 text-[14px] font-medium" style={{ color: COLORS.textSecondary }}>
        Not now
      </button>
    </>
  );
}

/* ── Open an account ─────────────────────────────────────────────────────── */

function OpenAccountStep({ onBack, onOpen }: { onBack: () => void; onOpen: () => void }) {
  const [agreed, setAgreed] = useState(false);
  const unlocks = formatLongDate(addMonths(startOfDay(new Date()), CASHBACK_RULES.lockMonths));
  const details: [string, string][] = [
    ['Name', SMARTSAVER_PROFILE.name],
    ['Email', SMARTSAVER_PROFILE.email],
    ['Phone', SMARTSAVER_PROFILE.phone],
    ['Identity', 'Verified with your card'],
  ];

  return (
    <FullScreenOverlay
      onBack={onBack}
      title="Open SmartSaver"
      zIndex={70}
      footer={
        <PrimaryButton onClick={onOpen} disabled={!agreed}>
          Open account and start earning
        </PrimaryButton>
      }
    >
      <p className="mt-0 mb-4 mx-1 text-[14.5px] leading-[1.5]" style={{ color: COLORS.labelMuted }}>
        We’ll use the details you verified for your Monefit card. Nothing to upload, no new ID check.
      </p>

      <Card radius={20} className="px-4 py-1">
        {details.map(([k, v], i) => (
          <div
            key={k}
            className="flex justify-between py-3.5 text-[14.5px]"
            style={{ borderTop: i ? `0.5px solid ${COLORS.divider}` : 'none' }}
          >
            <span style={{ color: COLORS.labelMuted }}>{k}</span>
            <span className="font-medium" style={{ color: COLORS.textPrimary }}>
              {v}
            </span>
          </div>
        ))}
      </Card>

      <div className="text-base font-semibold mx-1 mt-6 mb-2.5" style={{ color: COLORS.textPrimary }}>
        What you get
      </div>
      <Card radius={20} className="px-4 py-1">
        <div className="flex items-center gap-3 py-3.5">
          <IconVault size={22} />
          <div>
            <div className="text-[14.5px] font-semibold" style={{ color: COLORS.textPrimary }}>
              Cashback Vault
            </div>
            <div className="text-[12.5px]" style={{ color: COLORS.labelMuted }}>
              Card cashback paid in daily · locked until {unlocks}
            </div>
          </div>
        </div>
      </Card>

      <button
        onClick={() => setAgreed((a) => !a)}
        className="mt-5 mx-1 flex items-start gap-3 text-left"
        role="checkbox"
        aria-checked={agreed}
      >
        <span
          className="mt-0.5 shrink-0 w-[22px] h-[22px] rounded-[7px] flex items-center justify-center"
          style={{
            background: agreed ? COLORS.ctaBackground : COLORS.surface,
            border: agreed ? 'none' : `1.5px solid ${COLORS.buttonDisabled}`,
          }}
        >
          {agreed && <IconCheck size={11} />}
        </span>
        <span className="text-[13.5px] leading-[1.45]" style={{ color: COLORS.labelStrong }}>
          I agree to the SmartSaver terms and privacy policy, and to Monefit Card paying cashback into my Cashback Vault.
        </span>
      </button>
    </FullScreenOverlay>
  );
}

/* ── Confirmation ────────────────────────────────────────────────────────── */

function Confirmation({ opened, onDone }: { opened: boolean; onDone: () => void }) {
  const unlocks = formatLongDate(addMonths(startOfDay(new Date()), CASHBACK_RULES.lockMonths));
  const pct = `${Math.round(CASHBACK_RULES.maxRate * 100)}%`;
  const facts = [
    ['Cashback', `Up to ${pct} on your first ${eurWhole(CASHBACK_RULES.cycleSpendCap)} each month`],
    ['Paid in', 'Every morning, for the day before'],
    ['Locked until', unlocks],
    ['Starts', 'With your next card purchase'],
  ];

  return (
    <div className="absolute inset-0 flex flex-col text-white" style={{ zIndex: 80, background: COLORS.smartInk }}>
      <style>
        {`@keyframes ssFlow { 0% { transform: translateY(-6px); opacity: 0 } 30% { opacity: 1 } 100% { transform: translateY(46px); opacity: 0 } }
          @keyframes ssRise { from { transform: translateY(14px); opacity: 0 } to { transform: none; opacity: 1 } }`}
      </style>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-[70px] pb-4">
        <div style={{ animation: 'ssRise 0.5s ease both' }}>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12.5px] font-medium"
            style={{ background: 'rgba(166,236,208,0.12)', color: COLORS.smartGain }}
          >
            <span className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: COLORS.smartGain }}>
              <IconCheck size={8} color={COLORS.smartInk} />
            </span>
            {opened ? 'SmartSaver account opened' : 'SmartSaver linked'}
          </div>
          <h1 className="mt-4 mb-0 text-[32px] font-semibold leading-[1.05] tracking-[-0.035em]">
            You’re earning cashback.
          </h1>
          <p className="mt-2.5 mb-0 text-[15px] leading-[1.5]" style={{ color: 'rgba(255,255,255,0.62)' }}>
            We’ve opened a Cashback Vault in your SmartSaver. Here’s how money will reach it.
          </p>
        </div>

        {/* Card → vault */}
        <div className="mt-7 flex flex-col items-center" style={{ animation: 'ssRise 0.5s 0.12s ease both' }}>
          <SmartCardArt width={200} />
          <div className="relative h-[58px] w-full flex justify-center">
            <div className="absolute top-0 bottom-0 w-px" style={{ background: 'rgba(255,255,255,0.15)' }} />
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute top-1 font-mono text-[11px]"
                style={{ color: COLORS.smartGain, animation: `ssFlow 2.4s ${i * 0.8}s linear infinite` }}
              >
                +€
              </span>
            ))}
            <span
              className="absolute left-1/2 top-1/2 -translate-y-1/2 ml-5 font-mono text-[11px] tracking-[0.1em]"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              DAILY
            </span>
          </div>
          <div className="relative overflow-hidden w-full rounded-[22px] px-5 py-4" style={SMART_SURFACE}>
            <SmartSurfaceLayers />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IconVault size={22} color="#fff" />
                <div>
                  <div className="text-[15px] font-semibold">Cashback Vault</div>
                  <div className="text-[12.5px] flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    <IconLock size={10} color="rgba(255,255,255,0.55)" /> Until {unlocks}
                  </div>
                </div>
              </div>
              <div className="text-[20px] font-semibold tabular-nums">€0.00</div>
            </div>
          </div>
        </div>

        <div className="mt-6" style={{ animation: 'ssRise 0.5s 0.24s ease both' }}>
          {facts.map(([k, v], i) => (
            <div
              key={k}
              className="flex justify-between gap-4 py-3 text-[14px]"
              style={{ borderTop: i ? '1px solid rgba(255,255,255,0.08)' : 'none' }}
            >
              <span style={{ color: 'rgba(255,255,255,0.55)' }}>{k}</span>
              <span className="text-right font-medium">{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pt-3 pb-[30px]">
        <button
          onClick={onDone}
          className="w-full py-4 rounded-2xl text-base font-semibold"
          style={{ background: COLORS.textWhite, color: COLORS.smartInk }}
        >
          See my vault
        </button>
      </div>
    </div>
  );
}

/* ── Flow ────────────────────────────────────────────────────────────────── */

export function LinkFlow({ mode, onLink, onOpenAndLink, onClose, onDone }: LinkFlowProps) {
  const [step, setStep] = useState<Step>(mode === 'open' ? 'open' : 'login');
  // The sheet animates in from its closed position, so mount closed and open
  // on the next frame.
  const [sheetShown, setSheetShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setSheetShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (step !== 'working') return;
    const t = setTimeout(() => {
      if (mode === 'open') onOpenAndLink();
      else onLink();
      setStep('done');
    }, 1100);
    return () => clearTimeout(t);
  }, [step, mode, onLink, onOpenAndLink]);

  const toConsent = useCallback(() => setStep('consent'), []);

  if (step === 'done') return <Confirmation opened={mode === 'open'} onDone={onDone} />;

  if (step === 'open') return <OpenAccountStep onBack={onClose} onOpen={() => setStep('working')} />;

  if (step === 'working') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" style={{ zIndex: 80, background: COLORS.smartInk }}>
        <Spinner color="#fff" />
        <div className="text-[15px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
          {mode === 'open' ? 'Opening your SmartSaver account…' : 'Opening your Cashback Vault…'}
        </div>
      </div>
    );
  }

  return (
    <Sheet isOpen={sheetShown} onClose={onClose} zIndex={70} hideHeader className="pt-2.5">
      <div className="w-9 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(19,20,23,0.18)' }} />
      {step === 'login' ? (
        <LoginStep matched={mode === 'login_match'} onSuccess={toConsent} />
      ) : (
        <ConsentStep onAllow={() => setStep('working')} onCancel={onClose} />
      )}
    </Sheet>
  );
}
