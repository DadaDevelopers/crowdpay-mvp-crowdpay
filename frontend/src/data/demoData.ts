export const demoCampaigns = [
  {
    id: "demo-1",
    title: "Nairobi Street Food Festival",
    description: "Join us for the biggest street food festival in Nairobi! We're bringing together local vendors, live music, and amazing food. Your contribution helps cover venue costs, entertainment, and vendor support.",
    goal_amount: 50000,
    mode: "event" as const,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    user_id: null,
    total_raised: 34500,
    contributions_count: 23,
  },
  {
    id: "demo-2",
    title: "Mama Njeri's Restaurant Bill Split",
    description: "Group dinner at Mama Njeri's Restaurant. Let's split the bill fairly using mobile money and Bitcoin!",
    goal_amount: 12000,
    mode: "merchant" as const,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    user_id: null,
    total_raised: 9800,
    contributions_count: 8,
  },
export const demoCampaigns = [];
];

export const demoContributions = [
  {
    id: "contrib-1",
    campaign_id: "demo-1",
    contributor_name: "John K.",
    amount: 2000,
    payment_method: "mpesa" as const,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "contrib-2",
    campaign_id: "demo-1",
    contributor_name: "Sarah M.",
    amount: 1500,
    payment_method: "bitcoin" as const,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "contrib-3",
    campaign_id: "demo-1",
    contributor_name: "Anonymous",
    amount: 5000,
    payment_method: "bitcoin" as const,
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "contrib-4",
    campaign_id: "demo-1",
    contributor_name: "David O.",
    amount: 1000,
    payment_method: "mpesa" as const,
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
];