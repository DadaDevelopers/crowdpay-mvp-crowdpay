import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Copy, ExternalLink, MoreVertical, Eye, Trash2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Campaign {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  goal_amount: number;
  mode: string;
  category: string | null;
  is_public: boolean | null;
  created_at: string;
  total_raised?: number;
  contributions_count?: number;
}

const MyLinks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!user) return;

    const fetchCampaigns = async () => {
      try {
        const { data: campaignsData, error } = await supabase
          .from("campaigns")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const campaignsWithStats = await Promise.all(
          (campaignsData || []).map(async (campaign) => {
            const { data: contributions } = await supabase
              .from("contributions")
              .select("amount")
              .eq("campaign_id", campaign.id);

            const total_raised = contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
            const contributions_count = contributions?.length || 0;

            return {
              ...campaign,
              total_raised,
              contributions_count,
            };
          })
        );

        setCampaigns(campaignsWithStats);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user, authLoading, navigate, toast]);

  const copyLink = (slug: string) => {
    const link = `${window.location.origin}/c/${slug}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Share it with your supporters",
    });
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "merchant": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "event": return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
      case "activism": return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Links - CrowdPay</title>
        <meta name="description" content="Manage your payment links" />
      </Helmet>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Links</h1>
            <p className="text-muted-foreground">Manage all your payment links</p>
          </div>
          <Button onClick={() => navigate("/create")} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Create New Link
          </Button>
        </div>

        {campaigns.length === 0 ? (
          <Card className="border-2 border-dashed border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No payment links yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-sm">
                Create your first payment link to start accepting Bitcoin and M-Pesa contributions
              </p>
              <Button onClick={() => navigate("/create")} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Create Payment Link
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((campaign) => {
              const progress = campaign.goal_amount > 0
                ? ((campaign.total_raised || 0) / campaign.goal_amount) * 100
                : 0;
              const btcRaised = (campaign.total_raised || 0) / 100000000;
              const btcGoal = campaign.goal_amount / 100000000;

              return (
                <Card key={campaign.id} className="group border border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{campaign.title}</h3>
                          <Badge variant="outline" className={getModeColor(campaign.mode)}>
                            {campaign.mode}
                          </Badge>
                          {campaign.category && (
                            <Badge variant="secondary" className="bg-secondary/50">
                              {campaign.category}
                            </Badge>
                          )}
                          <Badge variant={campaign.is_public ? "default" : "secondary"} className="text-xs">
                            {campaign.is_public ? "Public" : "Private"}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{btcRaised.toFixed(4)} / {btcGoal.toFixed(2)} BTC</span>
                          </div>
                          <Progress value={Math.min(progress, 100)} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{progress.toFixed(1)}% funded</span>
                            <span>{campaign.contributions_count} contributors</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm text-muted-foreground">Link:</span>
                          <span className="text-sm font-medium text-primary flex-1 truncate">
                            {window.location.origin}/c/{campaign.slug}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyLink(campaign.slug)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/c/${campaign.slug}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Page
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyLink(campaign.slug)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/c/${campaign.slug}`, '_blank')}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open in New Tab
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default MyLinks;
