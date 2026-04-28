# Payment Wheel — Design Ticket

> The Payment Wheel is the primary payment control on the card screen — users drag a marker around the arc to set any amount from €0 to their full balance. The arc snaps to the key milestones (minimum, due, total) and the surrounding copy updates live to explain what each amount does.

This ticket complements the working demo — it covers what the demo can't show on its own:

- **§1 Glossary** — the terms used in the wheel and surrounding UI.
- **§2 Account states** — every state the demo can render. Names match the demo's preset switcher.
- **§3 Zone copy** — the exact title and subtitle that swap as the user drags.
- **§4 Manage payment methods** — the flow for adding and removing cards/wallets.

---

## 1. Glossary

A few terms used throughout — read this first if you haven't worked on the wheel before.

| Term | Means |
|---|---|
| **Transactor** | A user who pays their bill in full every month. Doesn't carry a balance. |
| **Revolver** | A user who only pays part of the bill each month, carrying the rest forward. Pays interest on the unpaid portion. |
| **In period** | The window the user is allowed to pay the current bill. Always 16th of last month → 15th of this month. |
| **Outside period** | After the user has paid this period's bill but before the next period opens. The wheel still works for paying ahead. |
| **Minimum** | Smallest amount the user must pay to keep their card active. |
| **Due / Due balance** | This billing period's bill — what the user has spent since their last statement. |
| **Total / Total balance** | Everything the user owes — this period's bill plus anything carried forward. |

---

## 2. Account states

Every account configuration the wheel renders in. Names match the demo's preset switcher, so each row maps directly to a preset you can load. The "Active zones" column lists which zones the user can land on — see §3 for the copy each zone shows.

| # | Scenario | Active zones |
|---|---|---|
| 1 | Transactor — Standard | `below_minimum` · `at_minimum` · `between_min_due` · `at_due` · `between_due_total` · `at_total` |
| 2 | Transactor — Standard (Small balance) | `below_minimum` · `at_due` · `between_due_total` · `at_total` |
| 3 | Transactor — Due = Total | `below_minimum` · `at_minimum` · `between_min_due` · `at_due` |
| 4 | Transactor — Due = Total (Small balance) | `below_minimum` · `at_due` |
| 5 | Transactor — Outside period | `between_due_total` · `at_total` |
| 6 | Transactor — Outside period (Small balance) | `between_due_total` · `at_total` |
| 7 | Revolver — Standard | `below_minimum` · `at_minimum` · `between_min_due` · `at_due` |
| 8 | Revolver — Standard (Small balance) | `below_minimum` · `at_due` |
| 9 | Revolver — Outside period | `between_min_due` · `at_due` |
| 10 | Revolver — Outside period (Small balance) | `between_min_due` · `at_due` |
| 11 | Zero balance | `at_zero` |
| 12 | Card blocked | (special design — title and subtitle lock to "Card blocked" / unblock copy across all zones, arc turns red) |

**Notes**
- "Small balance" means owes ≤ €20 — at this size the minimum payment is the full bill, so the minimum and due anchors collapse into one.
- "Due = Total" means there's no balance carried forward beyond this period's bill — the due and total anchors collapse into one.
- When both happen (small balance + due = total), all three anchors collapse into a single point at the top of the wheel.

---

## 3. Zone copy (changes as user drags)

When the user drags the wheel, the title and subtitle above the wheel swap to:

| Zone | Trigger | Title | Subtitle |
|---|---|---|---|
| `at_zero` | `totalBalance = 0` | All clear | Nothing owed. |
| `below_minimum` | `0 < amount < minimumPayment` | Below minimum | Pay a little more by 15 May to keep your account active. |
| `at_minimum` | `amount` snaps to minimum | Minimum payment | Pay this by 15 May to keep your account active. Pay more to reduce your interest charges. |
| `between_min_due` | `minimumPayment < amount < dueBalance` | Partial payment | Pay this by 15 May to cover more of your April balance and reduce your interest charges. |
| `at_due` (default) | `amount` snaps to due | [Month] balance | Pay this by 15 May to cover your April balance and avoid any interest. |
| `at_due` (revolver, due = total) | revolver, `due = total`, `min ≠ due` | Total balance | Pay this to clear your balance and stop interest from accruing. |
| `between_due_total` | `dueBalance < amount < totalBalance` | Early payment | Pay this to free up available credit and reduce next month's bill. |
| `at_total` | `amount` snaps to total, `total > due` | Total balance | Pay this to clear your full balance and stay ahead on your finances. |

**Variables**
- `[Month]` — the bill's month name, derived from the 16th→15th billing cycle (e.g. "April" while in the Apr 16–May 15 period).
- `15 May` — due date, always the 15th of the period's closing month.

---

## 4. Manage payment methods

Surface: confirmation screen (after the user taps Pay on the wheel).

### 4.1 Default view

| Field | Value |
|---|---|
| **Section header** | "PAY WITH" + "Edit" link on the right |
| **List** | All saved methods, each with brand icon, label, sublabel, radio selector |
| **Selection** | Tapping a row selects it for payment |
| **Pay CTA** | Visible at bottom — "Pay €X.XX" |

### 4.2 Edit mode

Toggled by tapping "Edit" in the section header.

| Field | Value |
|---|---|
| **Section header** | "PAY WITH" + "Done" link (replaces "Edit") |
| **List** | Same rows, but the radio selector swaps for a delete control |
| **Delete control — normal** | Red trash icon. Tap removes the method. |
| **Delete control — last method** | Lock icon (greyed). Disabled. Tooltip: "At least one payment method required". |
| **Notice** | Below list, only when last method: "At least one payment method must remain active." |
| **Add new row** | Dashed-border button below the list — "Add new" |
| **Pay CTA** | Hidden (slides away) |
| **Selection** | Disabled — tapping rows does nothing |

### 4.3 Add flow

Triggered by tapping "Add new" in edit mode. Opens a bottom sheet.

| Field | Value |
|---|---|
| **Sheet header** | "Add payment method" |
| **Tabs** | Card / Wallets |
| **Card tab** | Checkout.com Frames v2 — card number, expiry, CVV |
| **Wallets tab** | Apple Pay, Google Pay, etc. Already-linked wallets show greyed with a checkmark and are not tappable. |
| **On success** | Sheet closes, new method appears in the list, becomes selected, edit mode exits automatically (so user can pay immediately). |
| **On cancel** | Sheet closes, list is unchanged, edit mode stays on. |

### 4.4 Remove flow

| Field | Value |
|---|---|
| **Trigger** | Tap trash icon on any row except when it's the last method |
| **Effect** | Method is removed from the list |
| **If removed method was selected** | Selection moves to the first remaining method |
| **If only one method remains after removal** | The last method's trash icon swaps to the lock icon, and the "at least one" notice appears |
| **Confirmation** | None — removal is immediate |

### 4.5 Rules

- Account must always have at least one active payment method.
- Wallets cannot be linked twice — the add sheet greys out wallets already in the list.
- Cards have no duplicate check (different cards, even from the same provider, are independent entries).
