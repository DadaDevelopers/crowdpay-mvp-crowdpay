import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Bitcoin, Smartphone, Loader2, Share2 } from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  description: string | null;
  goal_amount: number;
  cover_image_url: string | null;
  theme_color: string | null;
  slug: string | null;
  category: string;
  user_id: string;
}

const categoryLabels: Record<string, { label: string; emoji: string }> = {
  education: { label: "Education", emoji: "🎓" },
  medical: { label: "Medical", emoji: "🏥" },
  business: { label: "Business", emoji: "💼" },
  community: { label: "Community", emoji: "🤝" },
  emergency: { label: "Emergency", emoji: "🚨" },
  creative: { label: "Creative", emoji: "🎨" },
  sports: { label: "Sports", emoji: "⚽" },
  charity: { label: "Charity", emoji: "❤️" },
  other: { label: "Other", emoji: "📦" },
};

const Campaign = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalRaised, setTotalRaised] = useState(0);
  const [contributorName, setContributorName] = useState("");

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!slug) {
        navigate("/");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("campaigns")
          .select("*")
          .eq("slug", slug)
          .single();

        if (error) throw error;

        if (!data) {
          toast({
            title: "Campaign not found",
            description: "This campaign doesn't exist or has been removed",
            variant: "destructive",
          });
          navigate("/");
          return;
        }

        setCampaign(data as Campaign);

        // Fetch total raised
        const { data: contributions } = await supabase
          .from("contributions")
          .select("amount")
          .eq("campaign_id", data.id);

        const total = contributions?.reduce((sum, c) => sum + Number(c.amount), 0) || 0;
        setTotalRaised(total);
      } catch (error: any) {
        console.error("Error fetching campaign:", error);
        toast({
          title: "Error",
          description: "Failed to load campaign",
          variant: "destructive",
        });
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [slug, navigate, toast]);

  const handlePayment = (method: "bitcoin" | "mpesa") => {
    if (!contributorName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name before contributing",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Payment Coming Soon",
      description: `${method === "bitcoin" ? "Bitcoin" : "M-Pesa"} payment integration will be available soon!`,
    });
  };

  const shareLink = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: campaign?.title,
        text: campaign?.description || "Support this campaign",
        url: url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: "Link copied!",
        description: "Share it with your friends",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  const progress = campaign.goal_amount > 0
    ? Math.round((totalRaised / campaign.goal_amount) * 100)
    : 0;

  const themeColor = campaign.theme_color || "#F7931A";

  return (
    <>
      <Helmet>
        <title>{campaign.title} - CrowdPay</title>
        <meta name="description" content={campaign.description || `Support ${campaign.title}`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={`${campaign.title} - CrowdPay`} />
        <meta property="og:description" content={campaign.description || `Support ${campaign.title}`} />
        {campaign.cover_image_url && <meta property="og:image" content={campaign.cover_image_url} />}
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={window.location.href} />
        <meta property="twitter:title" content={`${campaign.title} - CrowdPay`} />
        <meta property="twitter:description" content={campaign.description || `Support ${campaign.title}`} />
        {campaign.cover_image_url && <meta property="twitter:image" content={campaign.cover_image_url} />}
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b bg-background">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">CrowdPay</span>
            </div>
            <Button variant="ghost" size="sm" onClick={shareLink}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="overflow-hidden">
            {/* Cover Image */}
            {campaign.cover_image_url && (
              <div className="w-full h-64 overflow-hidden">
                <img
                  src={campaign.cover_image_url}
                  alt={campaign.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-6 space-y-6">
              {/* Title & Description */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h1 className="text-3xl font-bold flex-1">{campaign.title}</h1>
                  <Badge variant="secondary" className="shrink-0">
                    {categoryLabels[campaign.category]?.emoji} {categoryLabels[campaign.category]?.label}
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
                    <p className="text-3xl font-bold" style={{ color: themeColor }}>
                      KES {totalRaised.toLocaleString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      raised of KES {campaign.goal_amount.toLocaleString()} goal
                    </p>
                  </div>
                  <p className="text-2xl font-semibold text-muted-foreground">
                    {progress}%
                  </p>
                </div>
                <Progress value={progress} className="h-3" />
              </div>

              {/* Contributor Name Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Name</label>
                <Input
                  placeholder="Enter your name"
                  value={contributorName}
                  onChange={(e) => setContributorName(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your name will be shown publicly with your contribution
                </p>
              </div>

              {/* Payment Buttons */}
              <div className="grid md:grid-cols-2 gap-4 pt-4">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => handlePayment("bitcoin")}
                >
                  <Bitcoin className="w-5 h-5 mr-2" />
                  Pay via Bitcoin
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="w-full"
                  onClick={() => handlePayment("mpesa")}
                >
                  <Smartphone className="w-5 h-5 mr-2" />
                  Pay via M-Pesa
                </Button>
              </div>

              {/* Info Text */}
              <p className="text-xs text-center text-muted-foreground pt-4">
                Powered by CrowdPay • Bitcoin & M-Pesa fundraising
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Campaign;
