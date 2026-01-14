import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { demoContributions } from "@/data/demoData";

interface Contribution {
  id: string;
  campaign_id: string;
  contributor_name: string;
  amount: number;
  payment_method: "mpesa" | "bitcoin";
  created_at: string;
}

export const useCampaignContributions = (campaignId: string) => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRaised, setTotalRaised] = useState(0);

  useEffect(() => {
    const fetchContributions = async () => {
      try {
        const { data, error } = await supabase
          .from("contributions")
          .select("*")
          .eq("campaign_id", campaignId)
          .order("created_at", { ascending: false });

        if (error) throw error;

        // Check if this is a demo campaign
        const isDemoCampaign = campaignId.startsWith("demo-");
        const demoContribs = isDemoCampaign 
          ? demoContributions.filter(c => c.campaign_id === campaignId)
          : [];

        const allContributions = [...(data as Contribution[]) || [], ...demoContribs];
        setContributions(allContributions);
        
        // Calculate total raised
        const total = allContributions.reduce((sum, contribution) => sum + Number(contribution.amount), 0);
        setTotalRaised(total);
      } catch (error) {
        console.error("Error fetching contributions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContributions();

    // Only set up realtime for non-demo campaigns
    if (!campaignId.startsWith("demo-")) {
      const channel = supabase
        .channel(`contributions-${campaignId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "contributions",
            filter: `campaign_id=eq.${campaignId}`,
          },
          (payload) => {
            const newContribution = payload.new as Contribution;
            setContributions((prev) => [newContribution, ...prev]);
            setTotalRaised((prev) => prev + Number(newContribution.amount));
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [campaignId]);

  return { contributions, loading, totalRaised };
};