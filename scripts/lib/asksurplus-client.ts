// AskSurplus REST/WS Client
// Interfaces for AskSurplus spot market API

export interface AskSurplusClient {
  getOrderBook(model: string): Promise<OrderBook>;
  getSpotPrice(model: string): Promise<SpotPrice>;
  getProviderHealth(): Promise<ProviderHealth[]>;
  placeLimitOrder(order: LimitOrder): Promise<OrderId>;
  cancelOrder(orderId: OrderId): Promise<void>;
  getFills(account: string): Promise<Fill[]>;
  listCapacity(capacity: ProviderCapacity): Promise<ListingId>;
  updatePricing(listingId: ListingId, pricing: Pricing): Promise<void>;
  settleEarnings(listingId: ListingId): Promise<string>;
}

export interface OrderBook {
  model: string;
  bids: OrderLevel[];
  asks: OrderLevel[];
  timestamp: number;
}

export interface OrderLevel {
  price: number;
  size: number;
  provider: string;
}

export interface SpotPrice {
  model: string;
  mid: number;
  spread_bps: number;
  reference_price: number;
  timestamp: number;
}

export interface ProviderHealth {
  provider: string;
  healthy: boolean;
  latency_ms: number;
  error_rate: number;
  models: string[];
  last_update: number;
}

export interface LimitOrder {
  model: string;
  side: 'buy' | 'sell';
  price: number;
  size_diem: number;
  ttl_seconds?: number;
}

export interface ProviderCapacity {
  model: string;
  daily_credits: number;
  pricing: Pricing;
}

export interface Pricing {
  base_price: number;
  discount_bps: number;
}

export interface Fill {
  order_id: string;
  model: string;
  side: 'buy' | 'sell';
  price: number;
  size_diem: number;
  fee_diem: number;
  timestamp: number;
  tx_hash: string;
}

export type OrderId = string;
export type ListingId = string;

export const MODELS = [
  'DeepSeek-V3',
  'Qwen-2.5-Coder',
  'Claude-Opus-4',
  'Venice-Qwen-Image-2-Pro',
  'Llama-3.3-70B',
] as const;

export type Model = typeof MODELS[number];