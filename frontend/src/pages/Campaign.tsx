/**
 * Campaign Page – Geyser Fund-inspired layout
 *
 * Features:
 * - Campaign details display (fetched from backend)
 * - Progress tracking with real data
 * - Lightning payment integration via LNURL-pay (non-custodial)
 * - Social sharing
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { campaignApi, ContributionItem } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Bitcoin,
  Share2,
  Sun,
  Moon,
  Zap,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Clock,
  Heart,
  Smartphone,
  DollarSign,
  Pencil,
} from "lucide-react";
import { PaymentModal } from "@/components/PaymentModal";
import crowdpayLogo from "@/assets/logo.png";
import { useAuth } from "@/contexts/MockAuthContext";

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
}

// ─── Photo Carousel ──────────────────────────────────────────────────────────
// Matches Geyser Fund: contained box, not full-width, with arrow buttons on sides

function PhotoCarousel({ photos }: { photos: string[] }) {
  const [current, setCurrent] = useState(0);

  const prev = useCallback(
    () => setCurrent(c => (c - 1 + photos.length) % photos.length),
    [photos.length]
  );
  const next = useCallback(
    () => setCurrent(c => (c + 1) % photos.length),
    [photos.length]
  );

  if (photos.length === 0) return null;

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ aspectRatio: "4/3", maxHeight: "400px" }}>
      {/* Blurred backdrop for portrait images */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${photos[current]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(18px) brightness(0.35)",
          transform: "scale(1.1)",
        }}
      />

      {/* Main image — always fully visible */}
      <img
        src={photos[current]}
        alt={`Photo ${current + 1}`}
        className="relative w-full h-full object-contain transition-opacity duration-300"
        draggable={false}
      />

      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors z-10"
            aria-label="Previous photo"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1.5 transition-colors z-10"
            aria-label="Next photo"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Dot navigation */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`rounded-full transition-all ${i === current
                  ? "bg-white w-4 h-2"
                  : "bg-white/50 w-2 h-2"
                  }`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Contribution Feed Item ──────────────────────────────────────────────────

function ContributionFeedItem({ contrib }: { contrib: ContributionItem }) {
  const name =
    contrib.is_anonymous || !contrib.contributor_name
      ? "Anonymous"
      : contrib.contributor_name;

  const colors = [
    "bg-orange-500", "bg-green-600", "bg-blue-500",
    "bg-purple-600", "bg-pink-500", "bg-teal-500",
  ];
  const avatarColor = colors[name.charCodeAt(0) % colors.length];

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-b-0">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs font-bold ${avatarColor}`}
      >
        {name[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <p className="text-sm">
            <span className="font-semibold">{name}</span>
            <span className="text-muted-foreground"> contributed </span>
            <span className="font-bold" style={{ color: "#F7931A" }}>
              {contrib.amount.toLocaleString()} SATS
            </span>
          </p>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {timeAgo(contrib.created_at)}
          </span>
        </div>
        {contrib.message && (
          <p className="text-xs text-muted-foreground mt-0.5 italic">
            "{contrib.message}"
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Static Contribute Widget ────────────────────────────────────────────────

interface ContributeWidgetProps {
  campaign: {
    id: string;
    title: string;
    current_amount: number;
    target_amount: number;
    currency: string;
    status: string;
    end_date?: string;
  };
  statistics?: {
    progress_percentage: number;
    paid_contributions: number;
    is_goal_reached: boolean;
  };
  contributions: ContributionItem[];
  onContribute: () => void;
  onShare: () => void;
}

function ContributeWidget({
  campaign,
  statistics,
  contributions,
  onContribute,
  onShare,
}: ContributeWidgetProps) {
  const [showAll, setShowAll] = useState(false);
  const progress = statistics?.progress_percentage || 0;
  const themeColor = "#F7931A";

  const displayed = showAll ? contributions : contributions.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* ── Raised amount + progress ── */}
      <Card className="p-5 space-y-5">
        <div className="space-y-3">
          <div>
            <p className="text-3xl font-bold" style={{ color: themeColor }}>
              {campaign.current_amount.toLocaleString()}
              <span className="text-base font-normal ml-1">{campaign.currency}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              raised of {campaign.target_amount.toLocaleString()} {campaign.currency} goal
            </p>
          </div>

          {/* Circular-style progress */}
          <Progress value={progress} className="h-2" />

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>
              <strong className="text-foreground">
                {statistics?.paid_contributions ?? 0}
              </strong>{" "}
              contributions
            </span>
            {statistics?.is_goal_reached && (
              <Badge variant="default" className="bg-green-500">
                Goal Reached! 🎉
              </Badge>
            )}
          </div>
        </div>

        {/* ── CTA ── */}
        <Button
          size="lg"
          className="w-full text-white font-bold py-6 text-base gap-2"
          style={{ backgroundColor: themeColor }}
          onClick={onContribute}
          disabled={campaign.status !== "active"}
        >
          <Zap className="w-5 h-5" />
          {campaign.status === "active"
            ? "Contribute"
            : `Campaign ${campaign.status}`}
        </Button>

        {/* Payment methods */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-xs text-muted-foreground">
          <Bitcoin className="w-3.5 h-3.5 text-[#F7931A]" />
          <span>Bitcoin Lightning</span>
          <span>·</span>
          <Smartphone className="w-3.5 h-3.5 text-green-600" />
          <span className="opacity-60">M-Pesa (soon)</span>
          <span>·</span>
          <DollarSign className="w-3.5 h-3.5 text-blue-500" />
          <span className="opacity-60">USDT (soon)</span>
        </div>

        {/* Share */}
        <Button variant="outline" className="w-full" size="sm" onClick={onShare}>
          <Share2 className="w-4 h-4 mr-2" />
          Share this campaign
        </Button>

        {campaign.end_date && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>
              Ends{" "}
              {new Date(campaign.end_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </Card>

      {/* ── Contributions feed ── */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Contributions</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
            <span>Verified</span>
          </div>
        </div>

        {/* Transparency note */}
        <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-100 dark:border-green-900">
          <Heart className="w-3 h-3 text-green-600 mt-0.5 shrink-0" />
          <p className="text-xs text-green-700 dark:text-green-400 leading-snug">
            All contributions are transparently recorded. Contributors may remain anonymous.
          </p>
        </div>

        {contributions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Zap className="w-6 h-6 mx-auto mb-1 opacity-40" />
            <p className="text-sm">Be the first to contribute!</p>
          </div>
        ) : (
          <>
            {displayed.map(c => (
              <ContributionFeedItem key={c.id} contrib={c} />
            ))}
            {contributions.length > 5 && (
              <button
                onClick={() => setShowAll(s => !s)}
                className="text-xs text-muted-foreground hover:text-foreground w-full text-center pt-1 pb-0.5 transition-colors"
              >
                {showAll
                  ? "Show less"
                  : `See all ${contributions.length} contributions`}
              </button>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const Campaign = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Theme
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

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

  // ── Fetch campaign ──
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["campaign", id],
    queryFn: async () => {
      if (!id) throw new Error("Campaign ID is required");
      return campaignApi.get(id);
    },
    enabled: !!id,
    staleTime: 10000,
    refetchOnWindowFocus: true,
  });

  // ── Fetch contributions ──
  const { data: contribData, refetch: refetchContribs } = useQuery({
    queryKey: ["campaign-contributions", id],
    queryFn: async () => {
      if (!id) return { contributions: [], count: 0 };
      return campaignApi.getContributions(id);
    },
    enabled: !!id,
    staleTime: 15000,
    refetchOnWindowFocus: true,
  });

  const campaign = data?.campaign;
  const statistics = data?.statistics;
  const paidContributions: ContributionItem[] = (
    contribData?.contributions || []
  ).filter((c: ContributionItem) => c.payment_status === "paid");

  useEffect(() => {
    if (error) {
      toast({
        title: "Campaign not found",
        description: "This campaign doesn't exist or has been removed",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  const handlePaymentSuccess = () => {
    toast({ title: "Thank you! 🎉", description: "Your contribution has been received." });
    refetch();
    refetchContribs();
  };

  const { user } = useAuth();
  const isOwner = !!(user && campaign && campaign.creator_id === user.id);
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
      toast({ title: "Link copied!", description: "Share it with your friends" });
    }
  };

  // ── Loading ──
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

  // ── Error ──
  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 max-w-md text-center space-y-4">
          <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
          <h2 className="text-xl font-bold">Campaign Not Found</h2>
          <p className="text-muted-foreground">
            This campaign doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/explore")}>Browse Campaigns</Button>
        </Card>
      </div>
    );
  }

  const photos: string[] = Array.isArray(campaign.photos) ? campaign.photos : [];

  return (
    <>
      <Helmet>
        <title>{campaign.title} - CrowdPay</title>
        <meta
          name="description"
          content={campaign.description || `Support ${campaign.title}`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={`${campaign.title} - CrowdPay`} />
        <meta
          property="og:description"
          content={campaign.description || `Support ${campaign.title}`}
        />
        {photos[0] && <meta property="og:image" content={photos[0]} />}
        <meta property="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* ── Nav ── */}
        <nav className="border-b bg-background sticky top-0 z-40">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-5xl">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <img src={crowdpayLogo} alt="CrowdPay" className="w-8 h-8 object-contain" />
              <span className="font-bold text-xl">CrowdPay</span>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/edit/${id}`)}
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={shareLink}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                onClick={() => setIsDark(!isDark)}
                variant="secondary"
                size="icon"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-6 max-w-5xl">
          {/*
           * Geyser-style 2-column grid:
           *   desktop: [story col] [sidebar]
           *   mobile:  sidebar first (order-first), then story (order-last)
           */}
          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">

            {/* ── RIGHT COLUMN (sidebar) — appears first on mobile ── */}
            <div className="order-first lg:order-last lg:sticky lg:top-20">
              <ContributeWidget
                campaign={campaign}
                statistics={statistics}
                contributions={paidContributions}
                onContribute={() => setPaymentModalOpen(true)}
                onShare={shareLink}
              />
            </div>

            {/* ── LEFT COLUMN (story) ── */}
            <div className="order-last lg:order-first space-y-6">

              {/* Photo carousel — contained, Geyser-style */}
              {photos.length > 0 && (
                <PhotoCarousel photos={photos} />
              )}

              {/* Campaign title + status */}
              <div>
                <div className="flex items-start gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold flex-1">{campaign.title}</h1>
                  <Badge variant="secondary" className="shrink-0 mt-1">
                    {campaign.status === "active" ? "Active" : campaign.status}
                  </Badge>
                </div>
                {campaign.description && (
                  <p className="text-muted-foreground mt-1 text-base">
                    {campaign.description}
                  </p>
                )}
              </div>

              {/* Story */}
              {campaign.story && (
                <div className="space-y-3">
                  <h2 className="text-xl font-bold border-b pb-2">Story</h2>
                  <div className="space-y-4">
                    {campaign.story.split("\n").map((para, i) =>
                      para.trim() ? (
                        <p key={i} className="text-base leading-relaxed text-foreground">
                          {para}
                        </p>
                      ) : (
                        <div key={i} className="h-2" />
                      )
                    )}
                  </div>
                </div>
              )}

              {/* No photo placeholder */}
              {photos.length === 0 && (
                <div className="w-full h-48 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-dashed">
                  <p className="text-muted-foreground text-sm">No photos added</p>
                </div>
              )}

              {/* Info Text */}
              <p className="text-xs text-center text-muted-foreground pt-4">
                Powered by CrowdPay • Non-custodial Lightning Network fundraising
              </p>
            </div>

          </div>
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
