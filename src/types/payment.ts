export type UserType = 'transactor' | 'revolver';

export type PaymentZone =
  | 'below_minimum'
  | 'at_minimum'
  | 'between_min_due'
  | 'at_due'
  | 'between_due_total'
  | 'at_total';

export interface AccountState {
  totalBalance: number;
  dueBalance: number;
  outstandingInterest: number;
  userType: UserType;
  isInPaymentPeriod: boolean;
  isCardBlocked: boolean;
}

export interface ZoneInfo {
  zone: PaymentZone;
  title: string;
  description: string;
}

export interface Preset {
  name: string;
  description: string;
  state: AccountState;
}
