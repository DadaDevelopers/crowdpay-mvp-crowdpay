/**
 * API Service for CrowdPay Frontend
 *
 * Handles all communication with the Flask backend.
 * All Lightning payment operations go through this service.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Campaign Types
export interface Campaign {
  id: string;
  creator_id: string;
  creator_email?: string;
  title: string;
  description: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  status: "active" | "completed" | "cancelled" | "expired";
  end_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface CampaignStatistics {
  progress_percentage: number;
  remaining_amount: number;
  total_contributions: number;
  paid_contributions: number;
  is_goal_reached: boolean;
}

export interface CreateCampaignRequest {
  title: string;
  description: string;
  target_amount: number;
  currency?: string;
  end_date?: string;
}

export interface CampaignResponse {
  campaign: Campaign;
  statistics?: CampaignStatistics;
}

export interface CampaignsListResponse {
  campaigns: Campaign[];
  count: number;
  offset: number;
  limit: number;
}

// Contribution Types
export interface CreateContributionRequest {
  campaign_id: string;
  amount: number;
  currency: "SATS" | "BTC";
  contributor_name?: string | null;
  contributor_email?: string | null;
  message?: string;
  is_anonymous: boolean;
}

export interface ContributionResponse {
  message: string;
  contribution: {
    id: string;
    campaign_id: string;
    amount: number;
    currency: string;
    payment_status: string;
    created_at: string;
  };
  payment_request: string;
  payment_hash: string;
}

export interface ContributionStatus {
  contribution_id: string;
  payment_status: "pending" | "paid" | "failed" | "expired" | "cancelled";
  is_paid: boolean;
  paid_at: string | null;
}

export interface InvoiceResponse {
  payment_hash: string;
  payment_request: string;
  amount: number;
  memo: string;
  expiry: number;
}

export interface WalletBalance {
  balance_sats: number;
  balance_btc: number;
  wallet_id: string;
}

// API Error class
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = "APIError";
  }
}

// Helper function for API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new APIError(
      data.error || "API request failed",
      response.status,
      data.details
    );
  }

  return data;
}

// Campaign API
export const campaignApi = {
  /**
   * Create a new campaign (requires auth)
   */
  create: async (
    request: CreateCampaignRequest,
    authToken: string
  ): Promise<{ message: string; campaign: Campaign }> => {
    return apiCall<{ message: string; campaign: Campaign }>("/api/campaigns", {
      method: "POST",
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify(request),
    });
  },

  /**
   * Get all campaigns with optional filtering
   */
  list: async (params?: {
    status?: string;
    creator_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<CampaignsListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set("status", params.status);
    if (params?.creator_id) searchParams.set("creator_id", params.creator_id);
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());

    const query = searchParams.toString();
    return apiCall<CampaignsListResponse>(
      `/api/campaigns${query ? `?${query}` : ""}`
    );
  },

  /**
   * Get a single campaign by ID with statistics
   */
  get: async (campaignId: string): Promise<CampaignResponse> => {
    return apiCall<CampaignResponse>(`/api/campaigns/${campaignId}`);
  },

  /**
   * Update a campaign (requires auth, owner only)
   */
  update: async (
    campaignId: string,
    data: Partial<CreateCampaignRequest>,
    authToken: string
  ): Promise<{ message: string; campaign: Campaign }> => {
    return apiCall<{ message: string; campaign: Campaign }>(
      `/api/campaigns/${campaignId}`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(data),
      }
    );
  },

  /**
   * Delete (cancel) a campaign (requires auth, owner only)
   */
  delete: async (
    campaignId: string,
    authToken: string
  ): Promise<{ message: string }> => {
    return apiCall<{ message: string }>(`/api/campaigns/${campaignId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    });
  },

  /**
   * Get contributions for a campaign
   */
  getContributions: async (
    campaignId: string
  ): Promise<{ contributions: unknown[]; count: number }> => {
    return apiCall<{ contributions: unknown[]; count: number }>(
      `/api/campaigns/${campaignId}/contributions`
    );
  },
};

// Contribution API
export const contributionApi = {
  /**
   * Create a new contribution and generate Lightning invoice
   */
  create: async (
    request: CreateContributionRequest
  ): Promise<ContributionResponse> => {
    return apiCall<ContributionResponse>("/api/contributions", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  /**
   * Get contribution details
   */
  get: async (contributionId: string) => {
    return apiCall<{ contribution: ContributionResponse["contribution"] }>(
      `/api/contributions/${contributionId}`
    );
  },

  /**
   * Check contribution payment status
   */
  getStatus: async (contributionId: string): Promise<ContributionStatus> => {
    return apiCall<ContributionStatus>(
      `/api/contributions/${contributionId}/status`
    );
  },

  /**
   * Cancel a pending contribution
   */
  cancel: async (
    contributionId: string,
    authToken?: string
  ): Promise<{ message: string }> => {
    return apiCall<{ message: string }>(
      `/api/contributions/${contributionId}/cancel`,
      {
        method: "POST",
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      }
    );
  },

  /**
   * List contributions for a campaign
   */
  list: async (params: {
    campaign_id?: string;
    payment_status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.campaign_id) searchParams.set("campaign_id", params.campaign_id);
    if (params.payment_status)
      searchParams.set("payment_status", params.payment_status);
    if (params.limit) searchParams.set("limit", params.limit.toString());
    if (params.offset) searchParams.set("offset", params.offset.toString());

    return apiCall<{
      contributions: ContributionResponse["contribution"][];
      count: number;
      offset: number;
      limit: number;
    }>(`/api/contributions?${searchParams.toString()}`);
  },
};

// Invoice API (standalone invoices) - routes under /api/payments/
export const invoiceApi = {
  /**
   * Create a standalone Lightning invoice
   */
  create: async (params: {
    amount: number;
    memo?: string;
    expiry?: number;
  }): Promise<InvoiceResponse> => {
    return apiCall<InvoiceResponse>("/api/payments/invoice/create", {
      method: "POST",
      body: JSON.stringify(params),
    });
  },

  /**
   * Check invoice payment status
   */
  getStatus: async (paymentHash: string) => {
    return apiCall<{
      payment_hash: string;
      paid: boolean;
      status: string;
      amount: number;
      preimage?: string;
    }>(`/api/payments/invoice/status/${paymentHash}`);
  },

  /**
   * Decode a BOLT11 invoice
   */
  decode: async (bolt11: string) => {
    return apiCall<{
      payment_hash: string;
      amount_sat: number;
      description: string;
      expiry: number;
    }>("/api/payments/invoice/decode", {
      method: "POST",
      body: JSON.stringify({ bolt11 }),
    });
  },
};

// Wallet API (requires auth) - routes under /api/payments/
export const walletApi = {
  /**
   * Get wallet balance
   */
  getBalance: async (authToken: string): Promise<WalletBalance> => {
    return apiCall<WalletBalance>("/api/payments/wallet/balance", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
  },

  /**
   * Get recent payments
   */
  getPayments: async (authToken: string, limit: number = 20) => {
    return apiCall<{ payments: unknown[]; count: number }>(
      `/api/payments/wallet/payments?limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
  },
};

// Profile API (requires auth)
export const profileApi = {
  /**
   * Get user profile
   */
  get: async (authToken: string) => {
    return apiCall<{
      user: {
        id: string;
        email: string;
        username?: string;
        full_name?: string;
        lightning_address?: string;
        onchain_address?: string;
        wallet_type?: string;
        email_notifications?: boolean;
      };
    }>("/api/auth/profile", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
  },

  /**
   * Update user profile
   */
  update: async (
    authToken: string,
    data: {
      username?: string;
      full_name?: string;
      lightning_address?: string;
      onchain_address?: string;
      wallet_type?: string;
      email_notifications?: boolean;
    }
  ) => {
    return apiCall<{ message: string; user: Record<string, unknown> }>(
      "/api/auth/profile",
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify(data),
      }
    );
  },
};

// Health check
export const healthApi = {
  /**
   * Check API health
   */
  check: async () => {
    return apiCall<{
      status: string;
      service: string;
      version: string;
      payment_provider: string;
    }>("/health");
  },

  /**
   * Check payments service health
   */
  checkPayments: async () => {
    return apiCall<{
      status: string;
      lnbits_connected: boolean;
      wallet_id?: string;
      balance_sats?: number;
    }>("/api/payments/health");
  },
};

export default {
  campaign: campaignApi,
  contribution: contributionApi,
  invoice: invoiceApi,
  wallet: walletApi,
  profile: profileApi,
  health: healthApi,
};
