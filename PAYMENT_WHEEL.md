# Payment Wheel

A circular drag interface for selecting a credit card payment amount. The user drags a marker around a 360° arc from €0 to their full balance. Three snap points mark meaningful payment thresholds, and the label, arc colour, and interest estimate all update in real time to reflect what the selected amount actually means for the account.

---

## Layout

Four layers, top to bottom:

1. **Zone header** — title + one-line description, updates with every zone change
2. **Wheel** — the arc, draggable marker, milestone dots, centre amount display
3. **Interest projection** — a single persistent line below the wheel
4. **Actions** — "Pay €X.XX" primary CTA + "Other amount" secondary link

---

## The Wheel

### Geometry

Full 360° circle. 12 o'clock = €0 and also the maximum (total balance) position — the arc fills clockwise. The SVG contains:

- **Track** — full-circle light grey stroke (28px)
- **Filled arc** — coloured stroke clipped to the selected amount using `strokeDashoffset`
- **Milestone dots** — small grey dots at the minimum, due, and total positions
- **Draggable marker** — white circle with coloured border and drop shadow, sitting at the selected position
- **Centre display** — selected amount (large, tabular) + "of €X.XX total" (small, muted)

### Interaction

Pointer down anywhere on the SVG begins the drag. The pointer position is converted to an angle (0° = 12 o'clock, clockwise), then to a ratio (0–1), then to an amount (€0–totalBalance). Pointer capture ensures the drag continues even if the pointer leaves the SVG bounds.

A wrap detector checks for angle deltas > 180° or < −180° to prevent the amount jumping from near-zero to near-total when the pointer crosses the 12 o'clock seam.

### Snapping

Snap threshold = **3% of totalBalance** during drag; **2% of totalBalance** for zone classification.

Snap candidates, evaluated in closest-wins order:

| Candidate | Active when |
|---|---|
| €0 | Always |
| Minimum payment | `minimumPayment > 0` |
| Due balance | `dueBalance > 0` |
| Total balance | Always |

The amount is forced to totalBalance when within the snap range of the top. For all other candidates, the closest one within range wins. **Ties go to the minimum over the due balance** — this ensures that when minimum = due (small balance cases), the label reads "Minimum payment", which carries the more important message.

### Arc colour

Continuously interpolated based on position relative to the minimum and due thresholds:

| Range | Colour |
|---|---|
| At or below minimum | Orange `#f97316` |
| Minimum → due | Orange → Green (linear interpolation) |
| At due (±2%) | Green `#22c55e` |
| Due → total | Green → Blue (linear interpolation) |
| Card blocked | Red `#ef4444` — overrides everything |

### Milestone dots

Grey dots (7px) with a white halo, at fixed arc positions.

- **Minimum dot** — shown when `minimumPayment > 0` AND the minimum is far enough from the due balance (gap > 4% of totalBalance). Suppressed when min ≈ due to avoid a dot cluster.
- **Due dot** — shown when `dueBalance > 0` AND due is far enough below total (gap > 1% of totalBalance). Suppressed when due = total.
- **Total dot** — always shown when balance > 0.

### Haptics

- **Snap** — medium impact, fires once when the marker enters a snap point
- **Tick** — light impact, fires on each movement outside a snap point

---

## Payment concepts

### User types

- **Transactor** — pays their statement balance each month. No interest if they clear at least the due balance by the due date.
- **Revolver** — carries a balance forward. Interest accrues continuously on the outstanding balance.

### Balances

- `totalBalance` — everything currently owed
- `dueBalance` — the portion due this billing period. May be less than total (new purchases since last statement aren't due yet), equal to total (revolvers; or transactors who made no new purchases), or zero (outside the payment period)
- `outstandingInterest` — interest already accrued; added to the minimum payment for revolvers

### Payment period

- **In period** — the billing cycle has closed. A due balance exists and a minimum payment is required.
- **Outside period** — the billing cycle is still open. Nothing is formally due. The minimum payment is zero and no minimum milestone is shown. The wheel acts as a simple "pay something early" control.

---

## Minimum payment

```
if dueBalance ≤ 0:      minimumPayment = 0
if dueBalance ≤ €20:    minimumPayment = dueBalance       ← full bill; no floor applied
otherwise:              minimumPayment = max(€20, dueBalance × 5%) + outstandingInterest
```

The €20 floor applies to most accounts: any due balance below €400 produces a minimum of exactly €20 (since 5% × €400 = €20). Above €400 the 5% rate takes over. The floor does **not** apply when the due balance is itself below €20 — in that case the minimum is the full bill, not an artificial floor above it.

The minimum is always **zero outside the payment period.**

---

## Zone system

Six zones. Recalculated on every amount change.

### Classification logic (in order)

1. `totalBalance ≤ 0` → `at_due` (zero balance state, wheel disabled)
2. `|amount − totalBalance| < snapRange` or `amount ≥ totalBalance` → `at_total`
3. Closest-wins between minimum and due (ties to minimum): `at_minimum` or `at_due`
4. `amount < minimumPayment` → `below_minimum`
5. `amount < dueBalance` → `between_min_due`
6. Otherwise → `between_due_total`

### Zone labels and descriptions

| Zone | Title | Description |
|---|---|---|
| `below_minimum` | Reducing your bill | Aim to pay at least the minimum before the due date. |
| `at_minimum` | Minimum payment | This is the minimum you can pay to keep your account active. |
| `between_min_due` | Reducing your bill | Pay off your due balance to avoid interest charges. |
| `at_due` | Due balance | Paying your due balance means you avoid interest charges. |
| `between_due_total` | Paying early | This will free up available credit and reduce next month's bill. |
| `at_total` | Total balance | Paying in full clears your balance and helps you stay ahead on your finances. |
| `at_total` *(due = total, revolver)* | Due balance | Paying in full clears your balance and stops interest from accruing. |
| `at_total` *(due = total, transactor)* | Due balance | Paying your due balance means you avoid interest charges. |
| `at_total` *(min = due = total)* | Minimum payment | This is your minimum — and it clears your full balance. |

The last three rows are variants of `at_total` driven by two flags:
- `dueEqualsTotal` — true when due and total differ by less than €0.01
- `minEqualsDue` — true when minimum and due differ by less than €0.01 (and minimum > 0)

### Zone header (above the wheel)

| Condition | Title | Subtitle |
|---|---|---|
| Amount = €0, or zero balance | Choose amount | Pay by 11:59PM on [due date] |
| Card blocked (amount > 0) | Card blocked *(red)* | Pay the minimum amount to unblock your card and restore access. |
| Otherwise | Zone title | Zone description |

---

## Interest projection

A single persistent line below the wheel. Shows whenever the wheel is active.

```
projection = (dueBalance − selectedAmount) × (0.1999 / 365) × 30
```

Annual rate: 19.99%. Projected over 30 days (one billing cycle).

**Visible when** `selectedAmount < dueBalance`:

- Transactor: `Interest projection: €X.XX on 16 [month]`
- Revolver: `Interest projection: €X.XX over next 30 days`

The copy differs because the consequence differs. For a transactor, interest is a one-time charge triggered by not paying the statement balance by the due date. For a revolver, it's an ongoing daily cost — framing it as "over 30 days" reflects that reality.

**When** `selectedAmount ≥ dueBalance`: `No interest charges`

The line is always there; it just switches state. It never disappears mid-interaction.

---

## States

### Transactor — In period, total > due

Standard case. Three milestones visible: minimum (€20 floor on typical balances), due, total. All six zones accessible. Default amount: due balance.

> Example: `totalBalance: €295 / dueBalance: €205 / outstandingInterest: €0`

---

### Transactor — In period, due = total

No new purchases since last statement. Due coincides with total, so the due dot is suppressed and `at_total` resolves to **"Due balance"** (not "Total balance") — from the user's perspective, clearing their balance is the same as paying what's due. Zones available: below_minimum, at_minimum, between_min_due, at_due/at_total.

> Example: `totalBalance: €1200 / dueBalance: €1200`

---

### Transactor — Outside payment period

Billing cycle still open. `minimumPayment = 0`. No minimum or due milestones. Only the total dot is shown. Every non-zero amount resolves to `between_due_total` or `at_total`. No interest projection (nothing is due). Default amount: total balance.

> Example: `totalBalance: €800 / dueBalance: €0 / isInPaymentPeriod: false`

---

### Revolver — In period

The full outstanding balance is typically the due balance. Minimum payment includes outstanding interest: `max(€20, balance × 5%) + interest`. Due = total, so `at_total` resolves to **"Due balance (revolver)"** — paying in full is paying what's due, and it stops interest from accruing. Interest projection uses the "over next 30 days" copy. Default amount: due balance.

> Example: `totalBalance: €3000 / dueBalance: €3000 / outstandingInterest: €45`

---

### Revolver — Outside payment period

Same balance, but `minimumPayment = 0`. No milestones except total. Interest projection is still active — being outside the payment period doesn't stop interest accruing daily. The projection line remains visible throughout. Default amount: total balance.

> Example: `totalBalance: €3000 / dueBalance: €3000 / isInPaymentPeriod: false`

---

### Small balance — Transactor, due = total

`dueBalance ≤ €20`, so `minimumPayment = dueBalance`. The €20 floor does not apply — the minimum is the full bill. All three values (minimum, due, total) coincide at the top of the wheel. `at_total` resolves to **"Minimum payment"** (`minEqualsDue && dueEqualsTotal`). Single snap point; no dot stack.

> Example: `totalBalance: €15 / dueBalance: €15`

---

### Small balance — Transactor, total > due

`minimumPayment = dueBalance = €15` (small balance rule), but `totalBalance = €60`. The minimum and due snap to the same arc position (closest-wins → "Minimum payment"). Above that, the wheel continues to €60 with "Paying early" and "Total balance" zones available.

> Example: `totalBalance: €60 / dueBalance: €15`

---

### Small balance — Transactor, outside period

`minimumPayment = 0`. Only the total dot. Functionally identical to the standard outside-period transactor, just with a small balance.

> Example: `totalBalance: €15 / dueBalance: €0 / isInPaymentPeriod: false`

---

### Small balance — Revolver

Identical to the small balance transactor due = total case in structure, but `at_total` copy references interest accrual.

> Example: `totalBalance: €15 / dueBalance: €15 / userType: revolver`

---

### Zero balance

Wheel disabled. No arc, no marker, no milestone dots. Centre display shows **"All clear"** in green. No interest row. No Pay button. Cannot interact.

> Example: `totalBalance: €0 / dueBalance: €0`

---

### Card blocked

Arc rendered in solid red throughout. Zone header overrides to **"Card blocked"** (red title) with instruction to pay the minimum to restore access. Default amount: minimum payment. The zone system continues running normally underneath — only the colour and header are affected.

> Example: `totalBalance: €5000 / dueBalance: €5000 / outstandingInterest: €120 / isCardBlocked: true`

---

## Edge cases

**min = due (any small balance variant)**
Both milestones map to the same arc position. The snap resolves to `at_minimum`. This is a deliberate tie-break: the user must know they're seeing a minimum payment obligation, not just a convenient amount.

**due = total (revolvers, or transactors with no new purchases)**
The due dot is suppressed. `at_total` shows "Due balance" rather than "Total balance" because from the user's perspective, these are the same thing. Showing "Total balance" when there is no meaningful distinction between the two values would create confusion.

**Outside period — dueBalance = 0**
No due milestone, no minimum milestone, no interest projection. The zone classification never reaches `at_due`, `between_min_due`, or `below_minimum`. The wheel is a simple early-payment tool, not a decision-support interface.

**Minimum exactly at the €20 floor, due just above (e.g. min = €20, due = €21)**
These are close but distinct — the gap is €1, and the 2% snap threshold on a €21 due balance is ~€0.42, narrower than the gap. Both milestones render. Dragging to €20 snaps to "Minimum payment"; €21 snaps to "Due balance". No ambiguity.

**Drag wrap at 12 o'clock**
The drag handler compares successive angles. If the delta exceeds ±180°, it's treated as a boundary crossing (near-zero → near-total or vice versa) rather than a full-circle sweep. This prevents a single fast swipe from jumping the amount across the full balance range.

**Rounding**
Minimum payment and interest projection both round to two decimal places. The selected amount is clamped to `[0, totalBalance]` at all times. All currency display uses `.toFixed(2)`.

---

## Confirmation screen

Reached by tapping "Pay €X.XX". The selected amount carries forward.

### Payment method selection

A radio list of saved methods: debit/credit cards, Apple Pay, Google Pay. Tapping a row selects it; the selected row highlights in light blue with a filled radio indicator. This is a pure selection interface in its default state — no management controls visible.

### Inline edit mode

A small **"Edit"** / **"Done"** toggle sits next to the "PAY WITH" label. Tapping it:

- **Edit on:** Radio indicators swap to delete (trash) buttons. A dashed "Add new" row slides in below the list. The "Pay €X.XX" CTA slides away — accidental payment while managing methods is not possible.
- **Edit off:** Back to selection mode. CTA returns.

### Last method protection

When only one method remains, the trash button becomes a lock icon and a notice appears: *"At least one payment method must remain active."* Deletion is blocked in both the UI and the handler. If the selected method is deleted, the first remaining method is auto-selected.

### Adding a new method

"Add new" opens a lightweight bottom sheet with two tabs:

- **Debit / Credit card** — Checkout.com Frames v2 (card number, expiry, CVV as sandboxed iframes). "Add card" is disabled until Frames reports the card is valid.
- **Digital wallets** — Apple Pay and Google Pay. If a wallet type is already saved, the button shows a "linked" state and cannot be added again.

After adding, the sheet closes, edit mode exits, and the new method becomes the selected one.
