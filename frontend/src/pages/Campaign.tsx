import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useLinks, mockContributions } from "@/contexts/LinksContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { PaymentModal } from "@/components/PaymentModal";
import { Bitcoin, Smartphone, Share2, Calendar, MapPin, Users, Clock, ArrowLeft, QrCode } from "lucide-react";
import { format } from "date-fns";

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

const modeLabels: Record<string, { label: string; icon: any }> = {
  merchant: { label: "Merchant / POS", icon: Users },
  event: { label: "Event / Social", icon: Calendar },
  activism: { label: "Activism / Cause", icon: Share2 },
};

const Campaign = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getLinkBySlug } = useLinks();
  const [contributorName, setContributorName] = useState("");
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"bitcoin" | "mpesa" | null>(null);

  // Find link from context
  const link = getLinkBySlug(slug || "");

  // Calculate total raised from mock contributions
  const totalRaised = link
    ? mockContributions
        .filter((c) => c.link_id === link.id)
        .reduce((sum, c) => sum + c.amount, 0)
    : 0;

  const contributionCount = link
    ? mockContributions.filter((c) => c.link_id === link.id).length
    : 0;

  useEffect(() => {
    if (!slug || !link) {
      toast({
        title: "Link not found",
        description: "This payment link doesn't exist or has been removed",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [slug, link, navigate, toast]);

  const handlePaymentClick = (method: "bitcoin" | "mpesa") => {
    if (!contributorName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name before contributing",
        variant: "destructive",
      });
      return;
    }
    setSelectedPaymentMethod(method);
    setPaymentModalOpen(true);
  };

  const shareLink = () => {
    const url = `https://crowdpay.me/${slug}`;
    if (navigator.share) {
      navigator.share({
        title: link?.title,
        text: link?.description || "Join this event",
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

  if (!link) {
    return null;
  }

  const progress = link.goal_amount > 0
    ? Math.round((totalRaised / link.goal_amount) * 100)
    : 0;

  const themeColor = link.theme_color || "#F7931A";
  const ModeIcon = modeLabels[link.mode]?.icon || Users;

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return format(new Date(dateString), "EEEE, MMMM d, yyyy 'at' h:mm a");
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Helmet>
        <title>{link.title} - CrowdPay</title>
        <meta name="description" content={link.description || `Join ${link.title}`} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.href} />
        <meta property="og:title" content={`${link.title} - CrowdPay`} />
        <meta property="og:description" content={link.description || `Join ${link.title}`} />
        {link.cover_image_url && <meta property="og:image" content={link.cover_image_url} />}
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={window.location.href} />
        <meta property="twitter:title" content={`${link.title} - CrowdPay`} />
        <meta property="twitter:description" content={link.description || `Join ${link.title}`} />
        {link.cover_image_url && <meta property="twitter:image" content={link.cover_image_url} />}
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="h-px w-px rounded-full bg-muted-foreground/20" />
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <Bitcoin className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold text-sm">CrowdPay</span>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={shareLink} className="gap-2">
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Hero Image */}
              {link.cover_image_url ? (
                <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden">
                  <img
                    src={link.cover_image_url}
                    alt={link.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
              ) : (
                <div 
                  className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: themeColor + "20" }}
                >
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: themeColor + "30" }}>
                      <ModeIcon className="w-12 h-12" style={{ color: themeColor }} />
                    </div>
                    <h1 className="text-4xl font-bold" style={{ color: themeColor }}>{link.title}</h1>
                  </div>
                </div>
              )}

              {/* Event Details */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="secondary" className="text-base px-3 py-1">
                      {categoryLabels[link.category || "other"]?.emoji} {categoryLabels[link.category || "other"]?.label}
                    </Badge>
                    <Badge variant="outline" className="gap-2">
                      <ModeIcon className="w-3 h-3" />
                      {modeLabels[link.mode]?.label || link.mode}
                    </Badge>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold mb-4">{link.title}</h1>
                  {link.description && (
                    <p className="text-lg text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {link.description}
                    </p>
                  )}
                </div>

                {/* Event Info Cards */}
                <div className="grid md:grid-cols-2 gap-4">
                  {link.end_date && (
                    <Card className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
                          <p className="font-semibold">{formatDate(link.end_date)}</p>
                        </div>
                      </div>
                    </Card>
                  )}
                  
                  {link.event_location && (
                    <Card className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Location</p>
                          <p className="font-semibold">{link.event_location}</p>
                        </div>
                      </div>
                    </Card>
                  )}

                  <Card className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Contributors</p>
                        <p className="font-semibold">{contributionCount} {contributionCount === 1 ? 'person' : 'people'} contributed</p>
                      </div>
                    </div>
                  </Card>

                  {link.goal_amount > 0 && (
                    <Card className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-1">Progress</p>
                          <p className="font-semibold mb-2">{progress}% funded</p>
                          <Progress value={progress} className="h-2" />
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Funding Progress */}
                {link.goal_amount > 0 && (
                  <Card className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Total Raised</p>
                          <p className="text-3xl font-bold" style={{ color: themeColor }}>
                            KES {totalRaised.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground mb-1">Goal</p>
                          <p className="text-2xl font-semibold">
                            KES {link.goal_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Progress value={progress} className="h-3" />
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* Payment Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="p-6 space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">Join this event</h2>
                    <p className="text-sm text-muted-foreground">
                      Contribute to support this event via Bitcoin or M-Pesa
                    </p>
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
                  <div className="space-y-3">
                    <Button
                      size="lg"
                      className="w-full"
                      style={{ backgroundColor: themeColor }}
                      onClick={() => handlePaymentClick("bitcoin")}
                    >
                      <Bitcoin className="w-5 h-5 mr-2" />
                      Pay via Bitcoin
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      className="w-full"
                      onClick={() => handlePaymentClick("mpesa")}
                    >
                      <Smartphone className="w-5 h-5 mr-2" />
                      Pay via M-Pesa
                    </Button>
                  </div>

                  {/* QR Code Section */}
                  <div className="pt-4 border-t">
                    <p className="text-sm font-medium mb-3">Quick Access</p>
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <QrCode className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Scan QR code to open this page
                      </p>
                    </div>
                  </div>

                  {/* Info Text */}
                  <p className="text-xs text-center text-muted-foreground pt-4 border-t">
                    Powered by CrowdPay • Bitcoin & M-Pesa payments
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal 
        open={paymentModalOpen} 
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedPaymentMethod(null);
        }}
      />
    </>
  );
};

export default Campaign;
