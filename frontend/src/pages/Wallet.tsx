import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/MockAuthContext";
import { useCampaigns } from "@/contexts/CampaignsContext";
import { contributionApi } from "@/services/api";
import { Copy, Wallet as WalletIcon, Zap, QrCode, Loader2, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { QRCodeSVG } from "qrcode.react";

const Wallet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { wallet, session, user } = useAuth();
  const { getUserCampaigns } = useCampaigns();
  const [showQR, setShowQR] = useState(false);

  const campaigns = getUserCampaigns();

  // Fetch contributions to user's campaigns
  const campaignIds = campaigns.map(c => c.id);
  const { data: contributionsData, isLoading: contributionsLoading } = useQuery({
    queryKey: ["walletContributions", campaignIds],
    queryFn: async () => {
      if (!campaignIds.length) return { confirmed: [], pending: [] };
      // Fetch contributions for all user's campaigns
      const allContributions: Record<string, unknown>[] = [];
      for (const id of campaignIds) {
        const res = await contributionApi.list({ campaign_id: id });
        allContributions.push(...res.contributions);
      }
      const confirmed = allContributions.filter(
        (c) => c.payment_status === "completed" || c.payment_status === "paid"
      );
      const pending = allContributions.filter(
        (c) => c.payment_status === "pending"
      );
      return { confirmed, pending };
    },
    enabled: campaignIds.length > 0,
    staleTime: 30000,
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  if (!wallet && !session) {
    return (
      <div className="p-6 max-w-5xl mx-auto flex flex-col items-center justify-center min-h-[60vh]">
        <WalletIcon className="h-16 w-16 mb-4 text-muted-foreground opacity-40" />
        <h2 className="text-xl font-semibold mb-2">No wallet configured</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-sm">
          Add your Lightning address in Settings to start receiving payments directly to your wallet.
        </p>
        <Button variant="outline" onClick={() => navigate("/settings")}>Go to Settings</Button>
      </div>
    );
  }

  const lightningAddress = wallet?.lightningAddress || "";
  const onchainAddress = wallet?.onchainAddress || "";

  // Calculate totals from campaigns
  const totalRaised = campaigns.reduce((sum, c) => sum + (c.current_amount || 0), 0);
  const confirmedContributions = contributionsData?.confirmed || [];
  const pendingContributions = contributionsData?.pending || [];

  return (
    <>
      <Helmet>
        <title>Earnings - CrowdPay</title>
        <meta name="description" content="View your campaign earnings" />
      </Helmet>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Campaign Earnings</h1>
          <p className="text-muted-foreground">
            Track contributions to your campaigns. Payments go directly to your Lightning wallet.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border border-border/50 bg-gradient-to-br from-green-500/10 via-card to-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Raised</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {totalRaised.toLocaleString()} sats
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Across {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 bg-gradient-to-br from-blue-500/10 via-card to-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Confirmed</p>
                  <p className="text-2xl font-bold">
                    {confirmedContributions.length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">contributions</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/50 bg-gradient-to-br from-amber-500/10 via-card to-card">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Pending</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {pendingContributions.length}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">awaiting confirmation</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lightning Address */}
        <Card className="mb-6 border border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Your Lightning Address
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 ml-auto">
                Non-Custodial
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                {lightningAddress ? (
                  <>
                    <span className="text-sm font-mono flex-1 truncate">{lightningAddress}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(lightningAddress, "Lightning address")}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No Lightning address set —{" "}
                    <button onClick={() => navigate("/settings")} className="underline hover:text-foreground">
                      add one in settings
                    </button>
                  </span>
                )}
              </div>
              {lightningAddress && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowQR(!showQR)}
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    {showQR ? "Hide" : "Show"} QR Code
                  </Button>
                  {showQR && (
                    <div className="flex justify-center p-4 bg-background rounded-lg">
                      <QRCodeSVG value={lightningAddress} size={150} />
                    </div>
                  )}
                </>
              )}
              <p className="text-xs text-muted-foreground">
                All contributions are paid directly to this address. CrowdPay never holds your funds.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Confirmed Contributions */}
        <Card className="border border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Recent Contributions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contributionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : confirmedContributions.length > 0 || pendingContributions.length > 0 ? (
              <div className="space-y-3">
                {/* Pending first */}
                {pendingContributions.slice(0, 5).map((contrib) => {
                  const amount = contrib.amount as number;
                  const name = (contrib.is_anonymous ? "Anonymous" : contrib.contributor_name || "Anonymous") as string;
                  const date = new Date(contrib.created_at as string);
                  return (
                    <div
                      key={contrib.id as string}
                      className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-200/50 dark:border-amber-800/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{name}</p>
                          <p className="text-xs text-muted-foreground">
                            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-amber-600">
                          +{amount.toLocaleString()} sats
                        </p>
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      </div>
                    </div>
                  );
                })}
                {/* Then confirmed */}
                {confirmedContributions.slice(0, 10).map((contrib) => {
                  const amount = contrib.amount as number;
                  const name = (contrib.is_anonymous ? "Anonymous" : contrib.contributor_name || "Anonymous") as string;
                  const date = new Date((contrib.paid_at || contrib.created_at) as string);
                  return (
                    <div
                      key={contrib.id as string}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{name}</p>
                          <p className="text-xs text-muted-foreground">
                            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">
                          +{amount.toLocaleString()} sats
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <WalletIcon className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">No contributions yet</p>
                <p className="text-xs">Contributions to your campaigns will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );

}

export default Wallet;
