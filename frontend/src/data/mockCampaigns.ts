export const mockCampaigns = [];

export const mockContributions = [
  {
    id: "c1",
    campaign_id: "1",
    user_id: "mock-user-id",
    contributor_name: "Alice Wanjiku",
    amount: 500000, // satoshis
    payment_method: "lightning",
    created_at: "2025-01-21T09:30:00Z",
  },
  {
    id: "c2",
    campaign_id: "1",
    user_id: "mock-user-id",
    contributor_name: "John Mwangi",
    amount: 1000000,
    payment_method: "mpesa",
    created_at: "2025-01-20T15:20:00Z",
  },
  {
    id: "c3",
    campaign_id: "2",
    user_id: "mock-user-id",
    contributor_name: "Sarah Njeri",
    payment_method: "onchain"
  }
];
