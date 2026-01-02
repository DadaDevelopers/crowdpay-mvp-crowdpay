import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/MockAuthContext";
import { useLinks, mockContributions } from "@/contexts/LinksContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useBtcRate, btcToKes } from "@/hooks/useBtcRate";
import { Plus, Bitcoin, Copy, TrendingUp, Link2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { getUserLinks } = useLinks();
  const { btcToKes: btcToKesRate, loading: rateLoading } = useBtcRate();
  const [btcBalance] = useState(0.0234);
  
  // Use links from context filtered for current user
  const links = getUserLinks(user?.id || "").map(l => {
    const contributions = mockContributions.filter(cont => cont.link_id === l.id);
    const total_raised = contributions.reduce((sum, cont) => sum + cont.amount, 0);
    return {
      id: l.id,
      title: l.title,
      slug: l.slug,
      description: l.description,
      goal_amount: l.goal_amount,
      total_raised,
      contributions_count: contributions.length,
    };
  });

  const totalRaised = links.reduce((sum, l) => sum + (l.total_raised || 0), 0);

  const copyLink = (slug: string) => {
    const link = `crowdpay.me/${slug}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: "Share it with your supporters",
    });
  };



  return (
    <>
      <Helmet>
        <title>Dashboard - CrowdPay</title>
        <meta name="description" content="Manage your payment links" />
      </Helmet>

      <div className="p-6 max-w-5xl mx-auto">
        {/* Stats Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* BTC Balance Card */}
          <Card className="border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">BTC Balance</p>
                  <p className="text-2xl font-bold">{btcBalance.toFixed(4)} BTC</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {rateLoading ? (
                      "Loading rate..."
                    ) : (
                      `≈ KES ${btcToKes(btcBalance, btcToKesRate).toLocaleString()}`
                    )}
                  </p>
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
                  <p className="text-sm text-muted-foreground mb-1">Active Links</p>
                  <p className="text-2xl font-bold">{links.length}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">Currently Active</p>
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
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(totalRaised / 100000000).toFixed(7)} BTC
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">This month</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Links List */}
        {links.length === 0 ? (
          <Card className="border-2 border-dashed border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Link2 className="h-8 w-8 text-primary" />
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
          <div className="space-y-4">
            {links.map((link) => {
              const progress = link.goal_amount > 0
                ? ((link.total_raised || 0) / link.goal_amount) * 100
                : 0;
              const btcRaised = (link.total_raised || 0) / 100000000;
              const btcGoal = link.goal_amount / 100000000;

              return (
                <Card key={link.id} className="group border border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{link.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Track contributions in real-time. BTC + M-Pesa supported.
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyLink(link.slug)}
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
                            {btcRaised.toFixed(4)}/{btcGoal.toFixed(2)} BTC
                          </span>
                        </div>
                        <Progress value={Math.min(progress, 100)} className="h-2 mb-2" />
                        <p className="text-sm text-muted-foreground">
                          {progress.toFixed(1)}% of target reached
                        </p>
                      </div>

                      {/* Payment Link */}
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Payment Link</p>
                        <div className="bg-muted/30 rounded-lg px-4 py-3 flex items-center justify-between">
                          <p className="text-sm font-medium text-primary">
                            crowdpay.me/{link.slug}
                          </p>
                        </div>
                      </div>

                      {/* Footer Note */}
                      <p className="text-xs text-muted-foreground">
                        Contributors can pay via Lightning, On-chain, or M-Pesa (auto-converts to BTC)
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Create New Payment Link Button */}
            <Button 
              onClick={() => navigate("/create")} 
              className="w-full bg-primary hover:bg-primary/90 py-6 text-base"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create New Payment Link
            </Button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 CrowdPay. Bitcoin-powered crowdfunding for events, activism & personal milestones.
          </p>
        </div>
      </div>
    </>
  );
};

export default Dashboard;