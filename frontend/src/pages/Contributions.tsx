import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/MockAuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Zap } from "lucide-react";
import { Helmet } from "react-helmet-async";

const Contributions = () => {
  const navigate = useNavigate();
  useAuth(); // Ensure user is authenticated

  // Note: In the current implementation, contributions are anonymous and not tracked by user account.
  // To track user contributions, the backend would need to associate contributions with user IDs.
  // For now, we show a helpful message.

  return (
    <>
      <Helmet>
        <title>My Contributions - CrowdPay</title>
        <meta name="description" content="View your contribution history" />
      </Helmet>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">My Contributions</h1>
          <p className="text-muted-foreground">Track all the causes you've supported</p>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Lightning-Fast & Private</h3>
                <p className="text-sm text-muted-foreground">
                  CrowdPay uses Bitcoin Lightning for instant, private contributions.
                  Your payment history is stored in your Lightning wallet, not on our servers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        <Card className="border-2 border-dashed border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Heart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Contribution Tracking</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Lightning Network contributions are private by design. To view your payment history,
              check your Lightning wallet app (like Phoenix, Breez, or Zeus).
            </p>
            <div className="flex gap-4">
              <Button onClick={() => navigate("/explore")} variant="outline">
                Browse Campaigns
              </Button>
              <Button onClick={() => navigate("/app")} className="bg-primary hover:bg-primary/90">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="mt-8 border border-border/50 bg-card/80">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Tips for Tracking Your Contributions</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                <span>Most Lightning wallets keep a complete payment history with timestamps and amounts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                <span>The payment memo usually includes the campaign name for easy identification.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                <span>Export your wallet's transaction history for tax or record-keeping purposes.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Contributions;
