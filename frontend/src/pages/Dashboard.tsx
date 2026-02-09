
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/MockAuthContext";
import { useCampaigns } from "@/contexts/CampaignsContext";
import { useQuery } from "@tanstack/react-query";
import { walletApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Plus, Bitcoin, Copy, TrendingUp, Link2, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { getUserCampaigns, isLoading: campaignsLoading } = useCampaigns();

  // Get user's campaigns from context (which fetches from backend)
  const campaigns = getUserCampaigns();

  // Fetch wallet balance from backend
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: async () => {
      if (!session?.access_token) return null;
      return walletApi.getBalance(session.access_token);
    },
    enabled: !!session?.access_token,
    staleTime: 30000,
    retry: false,
  });

  // Calculate totals from campaigns
  const totalRaised = campaigns.reduce((sum, c) => sum + (c.current_amount || 0), 0);
  const btcBalance = walletData?.balance_btc || 0;

  const copyLink = (campaignId: string, title: string) => {
    const link = `${window.location.origin}/c/${campaignId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: `Share link for "${title}" with your supporters`,
    });
  };

  // Convert sats to BTC
  const satsToBtc = (sats: number) => sats / 100000000;

  // Convert BTC to KES (approximate rate)
  const btcToKes = (btc: number) => {
    const rate = 11634460; // Approximate BTC to KES rate
    return Math.round(btc * rate);
  };

  const isLoading = campaignsLoading || walletLoading;

  return (
    <>
      <Helmet>
        <title>Dashboard - CrowdPay</title>
        <meta name="description" content="Manage your fundraising campaigns" />
      </Helmet>

      <div className="p-6 max-w-5xl mx-auto">
        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold">
            Welcome{user?.username ? `, ${user.username}` : ""}!
          </h2>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* BTC Balance Card */}
          <Card className="border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Wallet Balance</p>
                  {walletLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold">{btcBalance.toFixed(8)} BTC</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        = KES {btcToKes(btcBalance).toLocaleString()}
                      </p>
                    </>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <Bitcoin className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Links Card */}
          <Card className="border border-border/50 bg-gradient-to-br from-blue-500/5 via-card to-card backdrop-blur-sm hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Campaigns</p>
                  {campaignsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold">{campaigns.length}</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Currently Active</p>
                    </>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/5 flex items-center justify-center">
                  <Link2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Raised Card */}
          <Card className="border border-border/50 bg-gradient-to-br from-green-500/5 via-card to-card backdrop-blur-sm hover:shadow-lg hover:shadow-green-500/5 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Raised</p>
                  {campaignsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {totalRaised.toLocaleString()} SATS
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        = {satsToBtc(totalRaised).toFixed(8)} BTC
                      </p>
                    </>
                  )}
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaigns List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : campaigns.length === 0 ? (
          <Card className="border-2 border-dashed border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Link2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-sm">
                Create your first campaign to start accepting Bitcoin Lightning contributions
              </p>
              <Button onClick={() => navigate("/create")} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => {
              const progress = campaign.target_amount > 0
                ? ((campaign.current_amount || 0) / campaign.target_amount) * 100
                : 0;

              return (
                <Card key={campaign.id} className="group border border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{campaign.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {campaign.description}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyLink(campaign.id, campaign.title)}
                          className="flex items-center gap-2 hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        >
                          <Copy className="h-4 w-4" />
                          Copy Link
                        </Button>
                      </div>

                      {/* Progress Section */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {(campaign.current_amount || 0).toLocaleString()} / {campaign.target_amount.toLocaleString()} {campaign.currency}
                          </span>
                        </div>
                        <Progress value={Math.min(progress, 100)} className="h-2 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {progress.toFixed(1)}% of target reached
                        </p>
                      </div>

                      {/* Campaign Link */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Campaign Link</p>
                        <div className="bg-muted/30 rounded-lg px-4 py-3 flex items-center justify-between">
                          <Link
                            to={`/c/${campaign.id}`}
                            className="text-sm font-medium text-primary truncate hover:underline transition-colors"
                          >
                            {window.location.origin}/c/{campaign.id}
                          </Link>
                        </div>
                      </div>

                      {/* Footer Note */}
                      <p className="text-xs text-muted-foreground">
                        Contributors can pay via Lightning Network (instant, low fees)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Create New Campaign Button */}
            <Button
              onClick={() => navigate("/create")}
              className="w-full bg-primary hover:bg-primary/90 py-6 text-base"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create New Campaign
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            CrowdPay - Bitcoin-powered crowdfunding for events, activism & personal milestones.
          </p>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
