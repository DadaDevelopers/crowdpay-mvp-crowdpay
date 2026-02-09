/**
 * Campaign Page - Public view of a single campaign
 *
 * Features:
 * - Campaign details display (fetched from backend)
 * - Progress tracking with real data
 * - Lightning payment integration via LNbits
 * - Social sharing
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { campaignApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Bitcoin, Share2, Sun, Moon, Zap, Loader2, AlertCircle } from "lucide-react";
import { PaymentModal } from "@/components/PaymentModal";

const Campaign = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Fetch campaign data from backend
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      if (!id) throw new Error("Campaign ID is required");
      return campaignApi.get(id);
    },
    enabled: !!id,
    staleTime: 10000, // 10 seconds
    refetchOnWindowFocus: true,
  });

  const campaign = data?.campaign;
  const statistics = data?.statistics;

  // Handle missing campaign
  useEffect(() => {
    if (error) {
      toast({
        title: "Campaign not found",
        description: "This campaign doesn't exist or has been removed",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handlePayment = () => {
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Thank you!",
      description: "Your contribution has been received.",
    });
    // Refetch campaign data to update progress
    refetch();
  };

  const campaignUrl = `${window.location.origin}/c/${id}`;

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: campaign?.title,
        text: campaign?.description || "Support this campaign",
        url: campaignUrl,
      });
    } else {
      navigator.clipboard.writeText(campaignUrl);
      toast({
        title: "Link copied!",
        description: "Share it with your friends",
      });
    }
  };

  // Dark and light mode toggle
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Theme toggle logic
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading campaign...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
          <h2 className="text-xl font-bold">Campaign Not Found</h2>
          <p className="text-muted-foreground">
            This campaign doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/explore")}>
            Browse Campaigns
          </Button>
        </Card>
      </div>
    );
  }

  const progress = statistics?.progress_percentage || 0;
  const themeColor = "#F7931A"; // Bitcoin orange

  return (
    <>
      <Helmet>
        <title>{campaign.title} - CrowdPay</title>
        <meta
          name="description"
          content={campaign.description || `Support ${campaign.title}`}
        />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={`${campaign.title} - CrowdPay`} />
        <meta
          property="og:description"
          content={campaign.description || `Support ${campaign.title}`}
        />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={window.location.href} />
        <meta property="twitter:title" content={`${campaign.title} - CrowdPay`} />
        <meta
          property="twitter:description"
          content={campaign.description || `Support ${campaign.title}`}
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b bg-background">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">CrowdPay</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={shareLink}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                onClick={toggleTheme}
                variant="secondary"
                size="icon"
                className="backdrop-blur-sm dark:text-white light: hover:bg-white/20"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="overflow-hidden">
            <div className="p-6 space-y-6">
              {/* Title & Description */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h1 className="text-3xl font-bold flex-1">{campaign.title}</h1>
                  <Badge variant="secondary" className="shrink-0">
                    {campaign.status === "active" ? "Active" : campaign.status}
                  </Badge>
                </div>
                {campaign.description && (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {campaign.description}
                  </p>
                )}
              </div>

              {/* Progress */}
              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <div>
                    <p
                      className="text-3xl font-bold"
                      style={{ color: themeColor }}
                    >
                      {campaign.current_amount.toLocaleString()} {campaign.currency}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      raised of {campaign.target_amount.toLocaleString()} {campaign.currency} goal
                    </p>
                  </div>
                  <p className="text-2xl font-semibold text-muted-foreground">
                    {Math.round(progress)}%
                  </p>
                </div>
                <Progress value={progress} className="h-3" />

                {/* Statistics */}
                {statistics && (
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{statistics.paid_contributions} contributions</span>
                    {statistics.is_goal_reached && (
                      <Badge variant="default" className="bg-green-500">
                        Goal Reached!
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Lightning Payment Info */}
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-bitcoin" />
                  <span className="font-medium">Lightning Payments Only</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  This campaign accepts Bitcoin via the Lightning Network for
                  instant, low-fee payments. Use any Lightning-compatible wallet
                  to contribute.
                </p>
              </div>

              {/* Payment Button */}
              <div className="pt-4">
                <Button
                  size="lg"
                  className="w-full bg-bitcoin hover:bg-bitcoin/90 text-white gap-2"
                  onClick={handlePayment}
                  disabled={campaign.status !== "active"}
                >
                  <Zap className="w-5 h-5" />
                  {campaign.status === "active"
                    ? "Contribute with Lightning"
                    : `Campaign ${campaign.status}`}
                </Button>
              </div>

              {/* Info Text */}
              <p className="text-xs text-center text-muted-foreground pt-4">
                Powered by CrowdPay • Lightning Network fundraising via LNbits
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        campaignId={campaign.id}
        campaignTitle={campaign.title}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </>
  );
};

export default Campaign;
