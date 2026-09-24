'use client';

import { useCallback, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { PaymentWheel } from '@/components/PaymentWheel/PaymentWheel';
import { AdminPanel } from '@/components/AdminPanel/AdminPanel';
import { PaymentConfirmation } from '@/components/Confirmation/PaymentConfirmation';
import { HomeScreen } from '@/components/Home/HomeScreen';
import { BillsScreen } from '@/components/Bills/BillsScreen';
import { FlexFlow } from '@/components/Flex/FlexFlow';
import { FlexTransactionsPage } from '@/components/Flex/FlexTransactionsPage';
import { FlexIntroStory } from '@/components/Flex/FlexIntroStory';
import { RewardsScreen } from '@/components/Rewards/RewardsScreen';
import { LinkFlow, LinkMode } from '@/components/Rewards/LinkFlow';
import { Tab } from '@/components/ui/TabBar';
import { useAppState } from '@/hooks/useAppState';
import { useSmartSaver } from '@/hooks/useSmartSaver';
import { usePaymentState } from '@/hooks/usePaymentState';
import { flexedTxnIds } from '@/lib/flex-math';

/**
 * `home`, `bills` and `rewards` are TABS — peers at the same depth. `wheel` and `confirm`
 * sit deeper, pushed on top of whichever tab launched them.
 */
type Screen = Tab | 'wheel' | 'confirm';

/** Navigation depth. Tabs share depth 0, so a tab switch is never a push. */
const SCREEN_DEPTH: Record<Screen, number> = {
  home: 0,
  bills: 0,
  rewards: 0,
  wheel: 1,
  confirm: 2,
};

/** Which Flex surface, if any, is stacked over the current screen. */
type FlexFlowState = { mode: 'create' | 'manage'; initialTxnId?: string } | null;

const HOME_BACKGROUND =
  'linear-gradient(180deg, #e4e4e9 0%, #f3f3f6 24%, #eef0f3 62%, #e8ebef 100%)';

function StatusBar() {
  return (
    // z-[60] keeps the clock and indicators legible above a sheet's dimming
    // backdrop, which deliberately overshoots up into this strip.
    <div className="relative z-[60] h-11 flex items-center justify-between px-7 select-none">
      <span
        className="text-[15px] font-semibold tabular-nums"
        style={{ color: '#1a1a2e' }}
      >
        9:41
      </span>

      {/* Dynamic island */}
      <div
        className="absolute left-1/2 top-2 -translate-x-1/2 w-[110px] h-[30px] rounded-full"
        style={{ background: '#000' }}
      />

      <div className="flex items-center gap-1.5" style={{ color: '#1a1a2e' }}>
        {/* Signal */}
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="0.5" />
          <rect x="4.5" y="5" width="3" height="6" rx="0.5" />
          <rect x="9" y="3" width="3" height="8" rx="0.5" />
          <rect x="13.5" y="0" width="3" height="11" rx="0.5" />
        </svg>
        {/* Wifi */}
        <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
          <path
            d="M7.5 9.5a1 1 0 100-2 1 1 0 000 2z"
            fill="currentColor"
          />
          <path
            d="M2.5 5.5a7 7 0 0110 0M4.5 7.3a4.4 4.4 0 016 0"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        {/* Battery */}
        <svg width="25" height="11" viewBox="0 0 25 11" fill="none">
          <rect
            x="0.5"
            y="0.5"
            width="21"
            height="10"
            rx="2.5"
            stroke="currentColor"
            strokeOpacity="0.4"
          />
          <rect x="2" y="2" width="18" height="7" rx="1.2" fill="currentColor" />
          <rect
            x="22.5"
            y="3.5"
            width="1.5"
            height="4"
            rx="0.5"
            fill="currentColor"
            fillOpacity="0.4"
          />
        </svg>
      </div>
    </div>
  );
}

export default function Home() {
  const app = useAppState();

  /**
   * The wheel spans the whole Flex model: due instalments sit inside the
   * minimum (split off by their own anchor), and future instalments extend the
   * ring above the card balance, where a payment is spread across them. Every
   * figure it needs comes from the one scenario store.
   */
  const paymentState = usePaymentState({
    accountState: app.account,
    flexDueAmount: app.summary.flexDue,
    flexFutureAmount: app.summary.flexFuture,
    flexSettlementAmount: app.summary.flexSettlement,
    flexInterestSaved: app.summary.flexInterestSaved,
    flexPlans: app.scenario.flexPlans,
    onAccountStateChange: app.overrideAccount,
  });

  const ss = useSmartSaver(app.scenario.transactions);
  const [linkMode, setLinkMode] = useState<LinkMode | null>(null);

  /** Last month's card spend — the most recent paid bill — sizes the offer's estimate. */
  const lastMonthSpend = useMemo(() => {
    const paid = app.scenario.months.filter((m) => m.state !== 'upcoming' && m.key !== app.scenario.currentMonthKey);
    return paid.length ? paid[paid.length - 1].spent : app.summary.currentBill.spent;
  }, [app.scenario, app.summary.currentBill.spent]);

  const [screen, setScreen] = useState<Screen>('home');
  // Which way the next transition slides: forward pushes in from the right.
  const [direction, setDirection] = useState(1);
  // A lateral tab move (home <-> bills) cross-fades instead of sliding: a push
  // animation would imply depth that a tab switch doesn't have.
  const [isTabMove, setIsTabMove] = useState(false);

  const [flexFlow, setFlexFlow] = useState<FlexFlowState>(null);
  const [txnsOpen, setTxnsOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  /**
   * Set when the intro is shown in place of the Flex flow the user actually
   * asked for, so finishing the story lands them where they were headed.
   */
  const [pendingFlexTxnId, setPendingFlexTxnId] = useState<string | null>(null);

  const go = useCallback(
    (next: Screen) => {
      const tabMove = SCREEN_DEPTH[next] === 0 && SCREEN_DEPTH[screen] === 0;
      setIsTabMove(tabMove);
      if (!tabMove) setDirection(SCREEN_DEPTH[next] > SCREEN_DEPTH[screen] ? 1 : -1);
      setScreen(next);
    },
    [screen],
  );

  /* ── Flex ──────────────────────────────────────────────────────────────── */

  const flexedIds = useMemo(
    () => flexedTxnIds(app.scenario.flexPlans),
    [app.scenario.flexPlans],
  );

  /** Flex-eligible transactions that aren't already on an active plan. */
  const eligibleTxns = useMemo(
    () => app.scenario.transactions.filter((t) => t.flexEligible && !flexedIds.has(t.id)),
    [app.scenario.transactions, flexedIds],
  );

  const hasPlans = app.scenario.flexPlans.length > 0;

  /**
   * Every route into Flex. A first-time user gets the story first — including
   * when they tapped a specific transaction's chip, which is remembered and
   * reopened once the story is done.
   */
  const openFlex = useCallback(
    (txnId?: string) => {
      if (!app.flexIntroSeen) {
        setPendingFlexTxnId(txnId ?? null);
        setIntroOpen(true);
        return;
      }
      if (txnId) {
        setFlexFlow({ mode: 'create', initialTxnId: txnId });
        return;
      }
      setFlexFlow({ mode: hasPlans ? 'manage' : 'create' });
    },
    [app.flexIntroSeen, hasPlans],
  );

  const finishIntro = useCallback(() => {
    setIntroOpen(false);
    app.markFlexIntroSeen();
    setFlexFlow(
      pendingFlexTxnId
        ? { mode: 'create', initialTxnId: pendingFlexTxnId }
        : { mode: hasPlans ? 'manage' : 'create' },
    );
    setPendingFlexTxnId(null);
  }, [app, hasPlans, pendingFlexTxnId]);

  /** From the transactions page: close it, then open the picker on that txn. */
  const flexFromTxnsPage = useCallback(
    (txnId: string) => {
      setTxnsOpen(false);
      openFlex(txnId);
    },
    [openFlex],
  );

  const confirmPayment = useCallback(() => {
    app.applyPayment(paymentState.selectedAmount);
    go('home');
  }, [app, paymentState.selectedAmount, go]);

  const isHome = screen === 'home' || screen === 'bills' || screen === 'rewards';

  return (
    <main
      className="min-h-dvh flex flex-col items-center justify-start py-6 px-4"
      style={{ background: '#e8e8ed' }}
    >
      <div
        className="relative w-full max-w-[390px] rounded-[44px] overflow-hidden flex flex-col"
        style={{
          // Wheel and confirm screens sit on the design's light grey; home
          // paints its own tinted backdrop over this.
          background: '#f2f2f4',
          // A fixed device viewport (iPhone 390x844) rather than a min-height,
          // so long screens scroll inside the frame instead of stretching it.
          height: '844px',
          boxShadow:
            '0 1px 3px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)',
        }}
      >
        {/* Home's tinted backdrop cross-fades with the screen transition so the
            outgoing screen never flashes against the wrong background. Plain CSS
            rather than motion: the inline opacity is always the correct resting
            value, so the backdrop can't be left mid-fade. Bills is a tab peer of
            home and shares it. */}
        <div
          className="absolute inset-0 transition-opacity duration-200"
          style={{ background: HOME_BACKGROUND, opacity: isHome ? 1 : 0 }}
        />

        <div className="relative z-10 flex flex-col flex-1 min-h-0">
          <StatusBar />

          <div className="flex-1 flex flex-col min-h-0">
            {/* The keyed screen remounts on navigation and slides in (or fades,
                between tabs). There is deliberately no exit animation: a screen
                transition must never wait on the outgoing screen to finish
                animating, or a dropped frame callback (backgrounded tab) leaves
                navigation stuck. */}
            <motion.div
              key={screen}
              className={`flex-1 flex flex-col min-h-0 ${
                screen === 'confirm' ? 'pt-2' : ''
              }`}
              initial={{ x: isTabMove ? 0 : direction * 24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{
                duration: isTabMove ? 0.16 : 0.22,
                ease: [0.33, 1, 0.68, 1],
              }}
            >
              {screen === 'home' && (
                <HomeScreen
                  scenario={app.scenario}
                  summary={app.summary}
                  onPay={() => go('wheel')}
                  onNavigate={go}
                  cashback={ss.ledger}
                  onOpenFlex={() => openFlex()}
                  onOpenTransactions={() => setTxnsOpen(true)}
                  onFlexTxn={openFlex}
                />
              )}

              {screen === 'bills' && (
                <BillsScreen
                  scenario={app.scenario}
                  summary={app.summary}
                  onPay={() => go('wheel')}
                  onNavigate={go}
                  rewardsBadge={!ss.ledger}
                />
              )}

              {screen === 'rewards' && (
                <RewardsScreen
                  ss={ss}
                  lastMonthSpend={lastMonthSpend}
                  onNavigate={go}
                  onLinkMatched={() => setLinkMode('login_match')}
                  onLoginOther={() => setLinkMode('login_other')}
                  onOpenAccount={() => setLinkMode('open')}
                />
              )}

              {screen === 'wheel' && (
                <PaymentWheel
                  state={paymentState}
                  onBack={() => go('home')}
                  onPay={() => go('confirm')}
                  onOpenFlex={() => openFlex()}
                />
              )}

              {screen === 'confirm' && (
                <PaymentConfirmation
                  amount={paymentState.selectedAmount}
                  onBack={() => go('wheel')}
                  onConfirm={confirmPayment}
                />
              )}
            </motion.div>
          </div>
        </div>

        {/* Overlays. Each is `absolute inset-0` inside the phone frame (never
            fixed), so they cover the status bar and paint their own top
            padding, exactly like FullScreenOverlay. */}
        {txnsOpen && (
          <FlexTransactionsPage
            txns={app.scenario.transactions}
            eligibleIds={new Set(eligibleTxns.map((t) => t.id))}
            flexedIds={flexedIds}
            cashbackByTxn={ss.ledger?.byFeedTxn}
            onFlex={flexFromTxnsPage}
            onBack={() => setTxnsOpen(false)}
          />
        )}

        {flexFlow && (
          <FlexFlow
            mode={flexFlow.mode}
            initialTxnId={flexFlow.initialTxnId}
            plans={app.scenario.flexPlans}
            history={app.scenario.flexHistory}
            eligibleTxns={eligibleTxns}
            onCreate={({ txnIds, n }) => app.createFlexPlan({ txnIds, n })}
            onCancelPlan={app.cancelFlexPlan}
            onPayoffInstalments={app.payoffInstalments}
            accountBlocked={app.scenario.accountBlocked}
            minimumPaid={app.summary.currentBill.minPaid === true}
            onClose={() => setFlexFlow(null)}
          />
        )}

        {introOpen && <FlexIntroStory onDone={finishIntro} />}

        {linkMode && (
          <LinkFlow
            mode={linkMode}
            onLink={ss.link}
            onOpenAndLink={ss.openAndLink}
            onClose={() => setLinkMode(null)}
            onDone={() => {
              setLinkMode(null);
              go('rewards');
            }}
          />
        )}
      </div>

      <AdminPanel
        app={app}
        smartSaver={ss}
        wheelMinimum={paymentState.minimumPayment}
        onApplyPreset={paymentState.applyPreset}
      />
    </main>
  );
}
