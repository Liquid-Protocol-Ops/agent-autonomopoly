// AskSurplus REST/WS Client
// Interface for AskSurplus spot market inference trading

export interface OrderBook {
  model: string;
  bids: OrderLevel[];
  asks: OrderLevel[];
  timestamp: number;
  sequence: number;
}

export interface OrderLevel {
  price: number;        // price per 1M tokens (USDC)
  size: number;         // tokens available
  provider: string;     // provider ID
  latency_ms: number;   // provider latency
}

export interface SpotPrice {
  model: string;
  mid: number;          // mid price
  spread_bps: number;   // spread in basis points
  bid: number;
  ask: number;
  timestamp: number;
}

export interface LimitOrder {
  model: string;
  side: 'buy' | 'sell';
  price: number;        // limit price per 1M tokens
  size: number;         // tokens
  tif: 'GTC' | 'IOC' | 'FOK';  // time in force
  client_order_id: string;
}

export interface OrderResult {
  order_id: string;
  client_order_id: string;
  status: 'open' | 'filled' | 'partial' | 'cancelled' | 'rejected';
  filled_size: number;
  avg_price: number;
  timestamp: number;
}

export interface ProviderCapacity {
  model: string;
  daily_tokens: number;     // max tokens/day
  pricing: ProviderPricing;
  provider_id: string;
  health: ProviderHealth;
}

export interface ProviderPricing {
  base_price: number;       // per 1M tokens
  discount_bps: number;     // discount from reference
  min_order_size: number;
}

export interface ProviderHealth {
  provider_id: string;
  latency_p50_ms: number;
  latency_p99_ms: number;
  error_rate_24h: number;   // 0-1
  uptime_24h: number;       // 0-1
  capacity_utilization: number; // 0-1
}

export interface Fill {
  fill_id: string;
  order_id: string;
  model: string;
  side: 'buy' | 'sell';
  price: number;
  size: number;
  fee_usdc: number;
  timestamp: number;
}

export interface AccountFills {
  account: string;
  fills: Fill[];
  total_fees_usdc: number;
  total_volume_usdc: number;
}

export interface ListingResult {
  listing_id: string;
  model: string;
  status: 'active' | 'paused' | 'filled' | 'expired';
  tokens_sold: number;
  revenue_usdc: number;
  fees_paid_usdc: number;
}

export class AskSurplusClient {
  private baseUrl: string;
  private wsUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, wsUrl: string, apiKey: string) {
    this.baseUrl = baseUrl;
    this.wsUrl = wsUrl;
    this.apiKey = apiKey;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AskSurplus API error: ${response.status} ${error}`);
    }

    return response.json() as unknown as T;
  }

  // Market Data
  async getOrderBook(model: string): Promise<OrderBook> {
    return this.request<OrderBook>(`/v1/orderbook/${model}`);
  }

  async getSpotPrice(model: string): Promise<SpotPrice> {
    return this.request<SpotPrice>(`/v1/price/${model}`);
  }

  async getAllSpotPrices(): Promise<SpotPrice[]> {
    return this.request<SpotPrice[]>('/v1/prices');
  }

  async getProviderHealth(): Promise<ProviderHealth[]> {
    return this.request<ProviderHealth[]>('/v1/providers/health');
  }

  // Trading - Buy Side (Consume Inference)
  async placeLimitOrder(order: LimitOrder): Promise<OrderResult> {
    return this.request<OrderResult>('/v1/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.request(`/v1/orders/${orderId}`, { method: 'DELETE' });
  }

  async getOpenOrders(): Promise<OrderResult[]> {
    return this.request<OrderResult[]>('/v1/orders/open');
  }

  async getFills(account: string): Promise<AccountFills> {
    return this.request<AccountFills>(`/v1/fills/${account}`);
  }

  // Trading - Sell Side (Provide Inference)
  async listCapacity(capacity: ProviderCapacity): Promise<ListingResult> {
    return this.request<ListingResult>('/v1/provider/list', {
      method: 'POST',
      body: JSON.stringify(capacity),
    });
  }

  async updatePricing(listingId: string, pricing: ProviderPricing): Promise<ListingResult> {
    return this.request<ListingResult>(`/v1/provider/${listingId}/pricing`, {
      method: 'PATCH',
      body: JSON.stringify(pricing),
    });
  }

  async pauseListing(listingId: string): Promise<ListingResult> {
    return this.request<ListingResult>(`/v1/provider/${listingId}/pause`, {
      method: 'POST',
    });
  }

  async settleEarnings(listingId: string): Promise<{ tx_hash: string; amount_usdc: number }> {
    return this.request(`/v1/provider/${listingId}/settle`, { method: 'POST' });
  }

  async getMyListings(): Promise<ListingResult[]> {
    return this.request<ListingResult[]>('/v1/provider/listings');
  }

  // WebSocket for real-time updates
  connectWebSocket(onMessage: (msg: any) => void): WebSocket {
    const ws = new WebSocket(this.wsUrl);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        onMessage(msg);
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };
    ws.onerror = (err) => console.error('WS error:', err);
    return ws;
  }

  // Health check
  async healthCheck(): Promise<{ healthy: boolean; latency_ms: number }> {
    const start = Date.now();
    try {
      await this.request('/v1/health');
      return { healthy: true, latency_ms: Date.now() - start };
    } catch {
      return { healthy: false, latency_ms: Date.now() - start };
    }
  }
}

// Factory
export function createAskSurplusClient(): AskSurplusClient {
  const baseUrl = process.env.ASKSURPLUS_API_URL || 'https://api.asksurplus.xyz';
  const wsUrl = process.env.ASKSURPLUS_WS_URL || 'wss://api.asksurplus.xyz/ws';
  const apiKey = process.env.ASKSURPLUS_API_KEY || '';
  return new AskSurplusClient(baseUrl, wsUrl, apiKey);
}