import { createContext, useContext, ReactNode, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  campaignApi,
  Campaign,
  CampaignStatistics,
  CreateCampaignRequest,
} from "@/services/api";
import { useAuth } from "@/contexts/MockAuthContext";

// Re-export Campaign type for convenience
export type { Campaign, CampaignStatistics };

interface CampaignsContextType {
  // Data
  campaigns: Campaign[];
  isLoading: boolean;
  error: Error | null;

  // Actions
  createCampaign: (data: CreateCampaignRequest) => Promise<Campaign>;
  deleteCampaign: (campaignId: string, confirm?: boolean) => Promise<{ message: string }>;
  getCampaignById: (id: string) => Promise<{ campaign: Campaign; statistics?: CampaignStatistics }>;
  getUserCampaigns: () => Campaign[];
  getPublicCampaigns: () => Campaign[];
  refetchCampaigns: () => void;

  // Mutation states
  isCreating: boolean;
  isDeleting: boolean;
}

const CampaignsContext = createContext<CampaignsContextType | undefined>(undefined);

export const CampaignsProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();

  // Fetch all campaigns
  const {
    data: campaignsData,
    isLoading,
    error,
    refetch: refetchCampaigns,
  } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const response = await campaignApi.list({ status: "active", limit: 100 });
      return response.campaigns;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
  });

  const campaigns = campaignsData || [];

  // Create campaign mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateCampaignRequest) => {
      if (!session?.access_token) {
        throw new Error("Authentication required");
      }
      const response = await campaignApi.create(data, session.access_token);
      return response.campaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  // Delete campaign mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ campaignId, confirm }: { campaignId: string; confirm?: boolean }) => {
      if (!session?.access_token) {
        throw new Error("Authentication required");
      }
      return campaignApi.delete(campaignId, session.access_token, confirm);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });

  // Get campaign by ID (with statistics)
  const getCampaignById = useCallback(
    async (id: string) => {
      // Try to get from cache first
      const cached = queryClient.getQueryData<{ campaign: Campaign; statistics?: CampaignStatistics }>(
        ["campaign", id]
      );
      if (cached) return cached;

      // Fetch from API
      const response = await campaignApi.get(id);

      // Cache the result
      queryClient.setQueryData(["campaign", id], response);

      return response;
    },
    [queryClient]
  );

  // Get campaigns for current user
  const getUserCampaigns = useCallback(() => {
    if (!user?.id) return [];
    return campaigns.filter((c) => c.creator_id === user.id);
  }, [campaigns, user?.id]);

  // Get public campaigns (all active campaigns)
  const getPublicCampaigns = useCallback(() => {
    return campaigns.filter((c) => c.status === "active");
  }, [campaigns]);

  // Create campaign wrapper
  const createCampaign = useCallback(
    async (data: CreateCampaignRequest) => {
      return createMutation.mutateAsync(data);
    },
    [createMutation]
  );

  // Delete campaign wrapper
  const deleteCampaign = useCallback(
    async (campaignId: string, confirm?: boolean) => {
      return deleteMutation.mutateAsync({ campaignId, confirm });
    },
    [deleteMutation]
  );

  return (
    <CampaignsContext.Provider
      value={{
        campaigns,
        isLoading,
        error: error as Error | null,
        createCampaign,
        deleteCampaign,
        getCampaignById,
        getUserCampaigns,
        getPublicCampaigns,
        refetchCampaigns,
        isCreating: createMutation.isPending,
        isDeleting: deleteMutation.isPending,
      }}
    >
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
