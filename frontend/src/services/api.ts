/**
 * API Service for CrowdPay Frontend
 *
 * Handles all communication with the Flask backend.
 * Uses LNURL-pay for non-custodial Lightning payments.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Campaign Types
export interface Campaign {
  id: string;
  creator_id: string;
  creator_email?: string;
  title: string;
  description: string;
  story?: string;
  photos?: string[];
  target_amount: number;
  current_amount: number;
  currency: string;
  status: "active" | "completed" | "cancelled" | "expired";
  is_public: boolean;
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
  story?: string;
  photos?: string[];
  is_public?: boolean;
  target_amount: number;
  currency?: string;
  end_date?: string;
}

export interface ContributionItem {
  id: string;
  campaign_id: string;
  contributor_name: string | null;
  amount: number;
  currency: string;
  message?: string | null;
  is_anonymous: boolean;
  payment_status: string;
  created_at: string;
  paid_at?: string | null;
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

export interface ContributionCreateResponse {
  message: string;
  contribution_id: string;
  invoice: string;
  payment_hash: string | null;
  amount_sats: number;
  expires_at: string;
  callback_url: string | null;
}

export interface ContributionStatus {
  contribution_id: string;
  payment_status: "pending" | "paid" | "completed" | "failed" | "expired" | "cancelled";
  is_paid: boolean;
  paid_at: string | null;
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
      data
    );
  }

  return data;
}

// Campaign API
export const campaignApi = {
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

  get: async (campaignId: string): Promise<CampaignResponse> => {
    return apiCall<CampaignResponse>(`/api/campaigns/${campaignId}`);
  },

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

  delete: async (
    campaignId: string,
    authToken: string,
    confirm?: boolean
  ): Promise<{ message: string }> => {
    const query = confirm ? "?confirm=true" : "";
    return apiCall<{ message: string }>(`/api/campaigns/${campaignId}${query}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    });
  },

  getContributions: async (
    campaignId: string
  ): Promise<{ contributions: ContributionItem[]; count: number }> => {
    return apiCall<{ contributions: ContributionItem[]; count: number }>(
      `/api/campaigns/${campaignId}/contributions`
    );
  },
};

// Contribution API
export const contributionApi = {
  /**
   * Create a new contribution - generates invoice from creator's wallet via LNURL-pay
   */
  create: async (
    request: CreateContributionRequest
  ): Promise<ContributionCreateResponse> => {
    return apiCall<ContributionCreateResponse>("/api/contributions", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  /**
   * Get contribution details
   */
  get: async (contributionId: string) => {
    return apiCall<{ contribution: Record<string, unknown> }>(
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
   * Confirm a contribution payment (campaign creator only)
   */
  confirm: async (
    contributionId: string,
    authToken: string
  ): Promise<{ message: string; contribution_id: string; amount_sats: number }> => {
    return apiCall<{ message: string; contribution_id: string; amount_sats: number }>(
      `/api/contributions/${contributionId}/confirm`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      }
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
      contributions: Record<string, unknown>[];
      count: number;
      offset: number;
      limit: number;
    }>(`/api/contributions?${searchParams.toString()}`);
  },
};

// Profile API (requires auth)
export const profileApi = {
  get: async (authToken: string) => {
    return apiCall<{
      user: {
        id: string;
        email: string;
        username?: string;
        full_name?: string;
        lightning_address?: string;
        lightning_address_valid?: boolean;
        min_receivable_sats?: number;
        max_receivable_sats?: number;
        onchain_address?: string;
        wallet_type?: string;
        email_notifications?: boolean;
      };
    }>("/api/auth/profile", {
      headers: { Authorization: `Bearer ${authToken}` },
    });
  },

  update: async (
    authToken: string,
    data: {
      username?: string;
      full_name?: string;
      lightning_address?: string | null;
      onchain_address?: string | null;
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
  check: async () => {
    return apiCall<{
      status: string;
      service: string;
      version: string;
      payment_provider: string;
    }>("/health");
  },
};

export default {
  campaign: campaignApi,
  contribution: contributionApi,
  profile: profileApi,
  health: healthApi,
};
