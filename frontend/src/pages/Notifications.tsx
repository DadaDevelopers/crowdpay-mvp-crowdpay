import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bell, Heart, CheckCircle, PartyPopper, Zap, Bitcoin, ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";

interface Notification {
  id: string;
  type: "contribution" | "goal_reached" | "new_contributor";
  title: string;
  message: string;
  campaign_slug?: string;
  amount?: number;
  contributor_name?: string;
  payment_method?: string;
  created_at: string;
  read: boolean;
}

const Notifications = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!user) return;

    const fetchNotifications = async () => {
      try {
        // Fetch recent contributions to user's campaigns as notifications
        const { data: campaigns } = await supabase
          .from("campaigns")
          .select("id, title, slug, goal_amount")
          .eq("user_id", user.id);

        if (!campaigns || campaigns.length === 0) {
          setNotifications([]);
          setLoading(false);
          return;
        }

        const campaignIds = campaigns.map(c => c.id);
        
        const { data: contributions, error } = await supabase
          .from("contributions")
          .select("*")
          .in("campaign_id", campaignIds)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;

        // Transform contributions to notifications
        const notifs: Notification[] = (contributions || []).map((c) => {
          const campaign = campaigns.find(camp => camp.id === c.campaign_id);
          return {
            id: c.id,
            type: "contribution",
            title: "New Contribution",
            message: `${c.contributor_name || "Anonymous"} contributed ${(c.amount / 100000000).toFixed(6)} BTC to "${campaign?.title}"`,
            campaign_slug: campaign?.slug,
            amount: c.amount,
            contributor_name: c.contributor_name,
            payment_method: c.payment_method,
            created_at: c.created_at,
            read: false,
          };
        });

        // Check for campaigns that reached their goal
        for (const campaign of campaigns) {
          const campaignContributions = (contributions || [])
            .filter(c => c.campaign_id === campaign.id);
          const totalRaised = campaignContributions.reduce((sum, c) => sum + Number(c.amount), 0);
          
          if (totalRaised >= campaign.goal_amount && campaignContributions.length > 0) {
            notifs.push({
              id: `goal-${campaign.id}`,
              type: "goal_reached",
              title: "🎉 Goal Reached!",
              message: `"${campaign.title}" has reached its funding goal!`,
              campaign_slug: campaign.slug,
              created_at: new Date().toISOString(),
              read: false,
            });
          }
        }

        setNotifications(notifs);
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

    fetchNotifications();
  }, [user, authLoading, navigate, toast]);

  const getNotificationIcon = (type: string, paymentMethod?: string) => {
    if (type === "goal_reached") {
      return <PartyPopper className="h-5 w-5 text-green-500" />;
    }
    if (paymentMethod === "lightning") {
      return <Zap className="h-5 w-5 text-amber-500" />;
    }
    if (paymentMethod === "onchain") {
      return <Bitcoin className="h-5 w-5 text-orange-500" />;
    }
    return <Heart className="h-5 w-5 text-primary" />;
  };

  const getPaymentBadge = (method?: string) => {
    if (!method) return null;
    switch (method) {
      case "lightning":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">⚡ Lightning</Badge>;
      case "onchain":
        return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 text-xs">₿ On-chain</Badge>;
      case "mpesa":
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 text-xs">📱 M-Pesa</Badge>;
      default:
        return null;
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
        <title>Notifications - CrowdPay</title>
        <meta name="description" content="View your notifications" />
      </Helmet>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Stay updated on your campaigns</p>
          </div>
          {notifications.length > 0 && (
            <Button variant="outline" size="sm">
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card className="border-2 border-dashed border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-sm">
                When someone contributes to your campaigns, you'll see it here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`group border border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer ${
                  !notification.read ? "border-l-4 border-l-primary" : ""
                }`}
                onClick={() => notification.campaign_slug && navigate(`/c/${notification.campaign_slug}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                      {getNotificationIcon(notification.type, notification.payment_method)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm">{notification.title}</p>
                        {getPaymentBadge(notification.payment_method)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(notification.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    {notification.amount && (
                      <div className="text-right shrink-0">
                        <p className="font-bold text-primary">
                          +{(notification.amount / 100000000).toFixed(6)} BTC
                        </p>
                      </div>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Notifications;
