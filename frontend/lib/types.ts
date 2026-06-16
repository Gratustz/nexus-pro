// --- User Types ---
export interface User {
  id: string;
  email: string;
  full_name: string;
  plan: PlanType;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export type PlanType = 'free' | 'pro' | 'elite';

// --- Auth Types ---
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user_email: string;
  user_name: string;
  plan: PlanType;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
}

// --- Signal Types ---
export type SignalDirection =
  | 'STRONG BUY'
  | 'BUY'
  | 'HOLD'
  | 'SELL'
  | 'STRONG SELL';

export type MarketType = 'crypto' | 'forex' | 'sports';

export interface CryptoIndicators {
  price: number;
  rsi: number;
  stoch_rsi: number;
  ema50: number;
  ema200: number;
  bb_upper: number;
  bb_mid: number;
  bb_lower: number;
  atr: number;
  macd: number;
  macd_signal: number;
  vwap: number;
  above_ema200: boolean;
  above_vwap: boolean;
}

export interface ForexIndicators {
  price: number;
  rsi: number;
  ema50: number;
  ema200: number;
  bb_upper: number;
  bb_mid: number;
  bb_lower: number;
  macd: number;
  macd_signal: number;
  trend: string;
  ob_os: string;
  above_ema200: boolean;
}

export interface TimeframeSignal {
  signal: SignalDirection;
  indicators: CryptoIndicators | ForexIndicators;
  ai_summary?: string;
  analyzed_at: string;
}

export interface CryptoResult {
  [timeframe: string]: TimeframeSignal;
}

export interface CryptoSignals {
  market: string;
  plan: PlanType;
  data: {
    [symbol: string]: CryptoResult;
  };
}

export interface ForexSignals {
  market: string;
  plan: PlanType;
  data: {
    [pair: string]: {
      [timeframe: string]: TimeframeSignal;
    };
  };
}

export interface SportsSignal {
  home_team: string;
  away_team: string;
  home_xg: number;
  away_xg: number;
  home_win_pct: number;
  draw_pct: number;
  away_win_pct: number;
  home_odds: number;
  draw_odds: number;
  away_odds: number;
  correct_scores: string[];
  signal: string;
  ai_summary?: string;
  analyzed_at: string;
}

export interface SportsSignals {
  market: string;
  plan: PlanType;
  data: {
    [match: string]: SportsSignal;
  };
}

// --- Subscription Types ---
export type BillingCycle = 'monthly' | 'yearly';

export type PaymentStatus =
  | 'pending'
  | 'active'
  | 'cancelled'
  | 'expired'
  | 'failed';

export interface Plan {
  name: string;
  monthly_price: number;
  yearly_price: number;
  features: string[];
}

export interface Plans {
  plans: {
    free: Plan;
    pro: Plan;
    elite: Plan;
  };
}

export interface Subscription {
  plan: string;
  billing_cycle: BillingCycle;
  amount: number;
  currency: string;
  status: PaymentStatus;
  start_date: string;
  end_date: string;
  auto_renew: boolean;
}

// --- API Response Types ---
export interface APIError {
  detail: string;
}

export interface APISuccess {
  message: string;
}
