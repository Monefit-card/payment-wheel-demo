'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { COLORS } from '@/lib/constants';
import { formatDueDateShort } from '@/lib/payment-math';
import { BrandIcon, SavedMethod } from './ManagePaymentMethods';
import { AddMethodSheet } from './AddMethodSheet';

/* ── Initial saved methods ── */
const INITIAL_METHODS: SavedMethod[] = [
  { id: 'visa-4242',  type: 'visa',       label: 'Visa Debit',  sublabel: '•••• 4242  ·  Expires 12/26' },
  { id: 'mc-5678',    type: 'mastercard', label: 'Mastercard',  sublabel: '•••• 5678  ·  Expires 08/25' },
  { id: 'apple-pay',  type: 'apple_pay',  label: 'Apple Pay' },
];

/* ── Trash icon ── */
function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path
        d="M1.5 3.5h12M5 3.5V2.25A.75.75 0 015.75 1.5h3.5A.75.75 0 0110 2.25V3.5M6 6.5v4.5M9 6.5v4.5M2.5 3.5l.8 9.25A.75.75 0 004.05 13.5h6.9a.75.75 0 00.75-.75L12.5 3.5"
        stroke="#ef4444" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Lock icon — last method, can't delete ── */
function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <rect x="2.5" y="6.5" width="10" height="7" rx="1.5" stroke={COLORS.textMuted} strokeWidth="1.25" />
      <path d="M5 6.5V4.5a2.5 2.5 0 015 0v2" stroke={COLORS.textMuted} strokeWidth="1.25" strokeLinecap="round" />
    </svg>
  );
}

/* ── Main component ── */
interface PaymentConfirmationProps {
  amount: number;
  onBack: () => void;
}

export function PaymentConfirmation({ amount, onBack }: PaymentConfirmationProps) {
  const [methods, setMethods]             = useState<SavedMethod[]>(INITIAL_METHODS);
  const [selectedMethod, setSelectedMethod] = useState<string>('visa-4242');
  const [isEditing, setIsEditing]         = useState(false);
  const [showAddSheet, setShowAddSheet]   = useState(false);

  const dueDate      = formatDueDateShort();
  const isLastMethod = methods.length <= 1;

  const linkedWalletIds = useMemo(
    () => new Set(methods.map((m) => m.id)),
    [methods],
  );

  const handleRemove = (id: string) => {
    if (isLastMethod) return;
    const remaining = methods.filter((m) => m.id !== id);
    setMethods(remaining);
    if (selectedMethod === id) setSelectedMethod(remaining[0].id);
  };

  const handleAdded = (method: SavedMethod) => {
    setMethods((prev) => prev.find((m) => m.id === method.id) ? prev : [...prev, method]);
    setSelectedMethod(method.id);
    // Exit edit mode after adding so the user can immediately pay
    setIsEditing(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">

      {/* ── Header ── */}
      <div className="px-5 flex items-center justify-between mb-5">
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: COLORS.background }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12.5L5.5 8 10 3.5" stroke={COLORS.textPrimary}
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        <h1 className="text-sm font-bold" style={{ color: COLORS.textPrimary }}>
          Confirm payment
        </h1>

        {/* Spacer to balance the back button */}
        <div className="w-8" />
      </div>

      {/* ── Amount ── */}
      <div className="text-center px-5 mb-7">
        <p className="text-4xl font-bold tabular-nums" style={{ color: COLORS.textPrimary }}>
          €{amount.toFixed(2)}
        </p>
        <p className="text-xs mt-1.5" style={{ color: COLORS.textSecondary }}>
          Due {dueDate}
        </p>
      </div>

      {/* ── Pay with section ── */}
      <div className="px-5">

        {/* Section header */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.textSecondary }}>
            Pay with
          </p>
          <button
            className="text-xs font-semibold"
            style={{ color: COLORS.arcBlue }}
            onClick={() => setIsEditing((v) => !v)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isEditing ? 'done' : 'edit'}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.12 }}
                style={{ display: 'inline-block' }}
              >
                {isEditing ? 'Done' : 'Edit'}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>

        {/* Methods list */}
        <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${COLORS.surfaceBorder}` }}>
          <AnimatePresence initial={false}>
            {methods.map((method, i) => {
              const isSelected = selectedMethod === method.id;
              const canDelete  = !isLastMethod;

              return (
                <motion.div
                  key={method.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-3 px-4 py-3.5"
                  style={{
                    background: !isEditing && isSelected ? '#F0F9FF' : '#ffffff',
                    borderBottom: i < methods.length - 1 ? `1px solid ${COLORS.surfaceBorder}` : 'none',
                    cursor: isEditing ? 'default' : 'pointer',
                  }}
                  onClick={() => { if (!isEditing) setSelectedMethod(method.id); }}
                >
                  <BrandIcon type={method.type} />

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium" style={{ color: COLORS.textPrimary }}>
                      {method.label}
                    </div>
                    {method.sublabel && (
                      <div className="text-xs mt-0.5" style={{ color: COLORS.textSecondary }}>
                        {method.sublabel}
                      </div>
                    )}
                  </div>

                  {/* Right control: radio ↔ delete, animated */}
                  <AnimatePresence mode="wait" initial={false}>
                    {isEditing ? (
                      <motion.button
                        key="delete"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => { e.stopPropagation(); handleRemove(method.id); }}
                        disabled={!canDelete}
                        title={!canDelete ? 'At least one payment method required' : 'Remove'}
                        className="w-8 h-8 flex items-center justify-center rounded-full flex-shrink-0"
                        style={{
                          background: canDelete ? '#FEF2F2' : 'transparent',
                          cursor: canDelete ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {canDelete ? <TrashIcon /> : <LockIcon />}
                      </motion.button>
                    ) : (
                      <motion.div
                        key="radio"
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.15 }}
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{
                          borderColor: isSelected ? COLORS.arcBlue : COLORS.surfaceBorder,
                          background:  isSelected ? COLORS.arcBlue : '#ffffff',
                        }}
                      >
                        {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* "At least one" notice — only when last method in edit mode */}
        <AnimatePresence>
          {isEditing && isLastMethod && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="text-xs text-center mt-2"
              style={{ color: COLORS.textMuted }}
            >
              At least one payment method must remain active.
            </motion.p>
          )}
        </AnimatePresence>

        {/* "Add new" row — slides in during edit mode */}
        <AnimatePresence>
          {isEditing && (
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mt-3 overflow-hidden"
              style={{
                background: COLORS.background,
                color: COLORS.textPrimary,
                border: `1.5px dashed ${COLORS.surfaceBorder}`,
              }}
              onClick={() => setShowAddSheet(true)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5v11M1.5 7h11" stroke={COLORS.textPrimary} strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Add new
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── Pay CTA — slides away in edit mode ── */}
      <AnimatePresence>
        {!isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="mt-6 px-5"
          >
            <motion.button
              className="w-full py-3.5 rounded-xl text-base font-semibold"
              style={{ background: '#1a1a2e', color: '#ffffff' }}
              whileTap={{ scale: 0.97 }}
            >
              Pay €{amount.toFixed(2)}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add method sheet ── */}
      <AnimatePresence>
        {showAddSheet && (
          <AddMethodSheet
            linkedWalletIds={linkedWalletIds}
            onClose={() => setShowAddSheet(false)}
            onAdded={handleAdded}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
