'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Tab, TabBar } from '@/components/ui/TabBar';
import { NAV_BUTTON_STYLE } from '@/components/ui/FullScreenOverlay';
import { IconGear } from '@/components/ui/icons';
import { COLORS } from '@/lib/constants';
import { formatLongDate } from '@/lib/smartsaver';
import { SmartSaverState } from '@/hooks/useSmartSaver';
import { eur } from './format';
import { HowItWorksList, RewardsOffer } from './RewardsOffer';
import { VaultDashboard } from './VaultDashboard';

interface RewardsScreenProps {
  ss: SmartSaverState;
  lastMonthSpend: number;
  onNavigate: (tab: Tab) => void;
  /** Start linking: the matched account, another account, or a new one. */
  onLinkMatched: () => void;
  onLoginOther: () => void;
  onOpenAccount: () => void;
}

/** The Rewards tab — the Smart Card offer before linking, the Cashback Vault after. */
export function RewardsScreen({
  ss,
  lastMonthSpend,
  onNavigate,
  onLinkMatched,
  onLoginOther,
  onOpenAccount,
}: RewardsScreenProps) {
  const [manageOpen, setManageOpen] = useState(false);
  const [confirmUnlink, setConfirmUnlink] = useState(false);
  const linked = ss.status === 'linked' && ss.ledger && ss.linkedAt;

  const closeManage = () => {
    setManageOpen(false);
    setConfirmUnlink(false);
  };

  return (
    <div className="relative flex flex-col flex-1 min-h-0">
      {/* Keyed on status so linking lands at the top of the vault, not
          wherever the offer was scrolled to. */}
      <div key={ss.status} className="no-scrollbar flex-1 overflow-y-auto px-4 pb-[120px]">
        <div className="flex items-center justify-between pt-3 pb-4 px-1">
          <h1 className="text-[30px] font-bold tracking-[-0.6px] m-0" style={{ color: COLORS.textPrimary }}>
            Rewards
          </h1>
          {linked && (
            <button
              onClick={() => setManageOpen(true)}
              aria-label="Cashback settings"
              className="w-[42px] h-[42px] rounded-[16px] flex items-center justify-center"
              style={NAV_BUTTON_STYLE}
            >
              <IconGear size={19} />
            </button>
          )}
        </div>

        {linked ? (
          <VaultDashboard
            ledger={ss.ledger!}
            linkedAt={ss.linkedAt!}
            vaults={ss.otherVaults}
            txns={ss.otherTxns}
            now={ss.now}
          />
        ) : (
          <RewardsOffer
            status={ss.status as 'no_account' | 'email_match'}
            lastMonthSpend={lastMonthSpend}
            onLinkMatched={onLinkMatched}
            onLoginOther={onLoginOther}
            onOpenAccount={onOpenAccount}
          />
        )}
      </div>

      <TabBar active="rewards" onNavigate={onNavigate} />

      {ss.ledger && (
        <Sheet
          isOpen={manageOpen}
          onClose={closeManage}
          title={confirmUnlink ? 'Stop cashback?' : 'Smart Card cashback'}
          onBack={confirmUnlink ? () => setConfirmUnlink(false) : undefined}
          zIndex={40}
        >
          {confirmUnlink ? (
            <>
              <p className="text-[14px] leading-[1.5] mt-0 mb-5" style={{ color: COLORS.labelMuted }}>
                Card purchases stop earning from now. The {eur(ss.ledger.vaultBalance + ss.ledger.pending)} in your
                Cashback Vault stays there and unlocks on {formatLongDate(ss.ledger.unlocksOn)} as planned. You can
                link again any time.
              </p>
              <button
                onClick={() => {
                  ss.unlink();
                  closeManage();
                }}
                className="w-full py-4 rounded-2xl text-base font-semibold"
                style={{ background: COLORS.dangerSoft, color: COLORS.dangerText }}
              >
                Unlink SmartSaver
              </button>
              <div className="mt-2.5">
                <PrimaryButton variant="light" onClick={() => setConfirmUnlink(false)}>
                  Keep earning
                </PrimaryButton>
              </div>
            </>
          ) : (
            <>
              <HowItWorksList />
              <div className="mt-2 text-[12.5px] leading-[1.5]" style={{ color: COLORS.textMuted }}>
                Refunds take back the cashback they earned. Rates and rules may change; see the Smart Card terms.
              </div>
              <button
                onClick={() => setConfirmUnlink(true)}
                className="w-full mt-5 py-3.5 rounded-2xl text-[15px] font-semibold"
                style={{ background: COLORS.screenSunken, color: COLORS.dangerText }}
              >
                Unlink SmartSaver
              </button>
            </>
          )}
        </Sheet>
      )}
    </div>
  );
}
