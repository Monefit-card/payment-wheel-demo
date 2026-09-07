/**
 * Flex — the instalment flows.
 *
 * `FlexFlow` is the whole create/manage overlay; the transaction-level pieces
 * (`FlexChip`, `FlexedTag`, `FlexTxnRow`, `FlexTransactionsPage`) and the
 * first-time explainer (`FlexIntroStory`) are mounted by Home.
 */

export { FlexFlow, DEFAULT_INSTALMENTS } from './FlexFlow';
export type { FlexFlowProps, FlexMode } from './FlexFlow';

export { FlexPicker, FlexPickRow } from './FlexPicker';
export { InstalmentChooser, MIN_INSTALMENTS, MAX_INSTALMENTS } from './InstalmentChooser';
export { PlanReview } from './PlanReview';
export { PlanCreated } from './PlanCreated';
export { PlanOverview, PlanRow, ScheduleItem } from './PlanOverview';
export { AmortisationTable, AmortisationLink } from './AmortisationTable';
export { FlexPlanList } from './FlexPlanList';
export { FlexPlanDetail } from './FlexPlanDetail';
export { FlexChip, FlexedTag, FlexTxnRow } from './FlexTxnRow';
export { FlexTransactionsPage } from './FlexTransactionsPage';
export { FlexIntroStory } from './FlexIntroStory';
export { TxnCard } from './TxnCard';
export { txnAmount, groupTxnsByDay } from './format';
export type { TxnDayGroup } from './format';
