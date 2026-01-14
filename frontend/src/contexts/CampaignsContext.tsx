import { createContext, useContext, useState, ReactNode } from "react";
import { mockCampaigns as initialCampaigns, mockContributions } from "@/data/mockCampaigns";

export interface Campaign {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string;
  goal_amount: number;
  mode: string;
  category: string;
  cover_image_url: string | null;
  theme_color: string;
  is_public: boolean;
  created_at: string;
  end_date?: string;
  event_location?: string;
}

interface CampaignsContextType {
  campaigns: Campaign[];
  addCampaign: (campaign: Campaign) => void;
  getCampaignBySlug: (slug: string) => Campaign | undefined;
  getUserCampaigns: (userId: string) => Campaign[];
  getPublicCampaigns: () => Campaign[];
}

const CampaignsContext = createContext<CampaignsContextType | undefined>(undefined);

export const CampaignsProvider = ({ children }: { children: ReactNode }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns as Campaign[]);

  const addCampaign = (campaign: Campaign) => {
    setCampaigns(prev => [campaign, ...prev]);
  };

  const getCampaignBySlug = (slug: string) => {
    return campaigns.find(c => c.slug === slug);
  };

  const getUserCampaigns = (userId: string) => {
    return campaigns.filter(c => c.user_id === userId);
  };

  const getPublicCampaigns = () => {
    return campaigns.filter(c => c.is_public);
  };

  return (
    <CampaignsContext.Provider value={{ campaigns, addCampaign, getCampaignBySlug, getUserCampaigns, getPublicCampaigns }}>
      {children}
    </CampaignsContext.Provider>
  );
};

export const useCampaigns = () => {
  const context = useContext(CampaignsContext);
  if (context === undefined) {
    throw new Error("useCampaigns must be used within a CampaignsProvider");
  }
  return context;
};

export { mockContributions };
