import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/MockAuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Zap, Settings } from "lucide-react";
import { Helmet } from "react-helmet-async";

const Notifications = () => {
  const navigate = useNavigate();
  useAuth(); // Ensure user is authenticated

  // Note: Real-time notifications would require:
  // 1. A backend WebSocket or polling endpoint
  // 2. Or integration with the LNbits webhook system
  // For now, we show helpful information about how notifications work.

  return (
    <>
      <Helmet>
        <title>Notifications - CrowdPay</title>
        <meta name="description" content="View your notifications" />
      </Helmet>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Stay updated on your campaigns</p>
          </div>
        </div>

        {/* Info Card */}
        <Card className="mb-8 border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Real-Time Payment Alerts</h3>
                <p className="text-sm text-muted-foreground">
                  CrowdPay uses Lightning webhooks to notify you when payments arrive.
                  Check your dashboard to see the latest contributions to your campaigns.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        <Card className="border-2 border-dashed border-border bg-card/50 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No notifications</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              When someone contributes to your campaigns, you'll see updates here.
              Create a campaign and share it to start receiving contributions!
            </p>
            <div className="flex gap-4">
              <Button onClick={() => navigate("/create")} className="bg-primary hover:bg-primary/90">
                Create Campaign
              </Button>
              <Button onClick={() => navigate("/app")} variant="outline">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card className="mt-8 border border-border/50 bg-card/80">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Settings className="h-4 w-4" />
              How to Stay Notified
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">Dashboard:</span>
                <span>Your dashboard shows real-time campaign progress and contribution totals.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">Campaign Pages:</span>
                <span>Each campaign page displays live statistics and contribution counts.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-medium">Email (Coming Soon):</span>
                <span>We're working on email notifications for significant milestones.</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Notifications;
