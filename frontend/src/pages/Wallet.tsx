import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Bitcoin, Copy, Wallet as WalletIcon, ArrowUpRight, ArrowDownLeft, RefreshCw, Zap, QrCode } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { QRCodeSVG } from "qrcode.react";

const Wallet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lightningAddress, setLightningAddress] = useState<string | null>(null);
  const [onchainAddress, setOnchainAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);
  const [btcBalance] = useState(0.0234); // Placeholder
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!user) return;

    const fetchWalletData = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("lightning_address, onchain_address, bitcoin_wallet_type")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        setLightningAddress(data?.lightning_address || null);
        setOnchainAddress(data?.onchain_address || null);
        setWalletType(data?.bitcoin_wallet_type || null);
      } catch (error: any) {
        console.error("Error fetching wallet:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalletData();
  }, [user, authLoading, navigate]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const btcToKes = (btc: number) => {
    const rate = 6410256;
    return Math.round(btc * rate);
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
        <title>Wallet - CrowdPay</title>
        <meta name="description" content="Manage your Bitcoin wallet" />
      </Helmet>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Wallet</h1>
          <p className="text-muted-foreground">Manage your Bitcoin balance and addresses</p>
        </div>

        {/* Balance Card */}
        <Card className="mb-6 border border-border/50 bg-gradient-to-br from-primary/10 via-card to-card backdrop-blur-sm overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-bold">{btcBalance.toFixed(4)}</p>
                  <span className="text-xl text-muted-foreground">BTC</span>
                </div>
                <p className="text-lg text-muted-foreground mt-1">
                  ≈ KES {btcToKes(btcBalance).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-3">
                <Button className="bg-primary hover:bg-primary/90">
                  <ArrowDownLeft className="mr-2 h-4 w-4" />
                  Receive
                </Button>
                <Button variant="outline">
                  <ArrowUpRight className="mr-2 h-4 w-4" />
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Lightning Address */}
          <Card className="border border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Lightning Address
                <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 ml-auto">
                  Instant
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lightningAddress ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-mono flex-1 truncate">{lightningAddress}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(lightningAddress, "Lightning address")}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
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
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No Lightning address configured</p>
              )}
            </CardContent>
          </Card>

          {/* On-chain Address */}
          <Card className="border border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Bitcoin className="h-5 w-5 text-orange-500" />
                On-chain Address
                <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 ml-auto">
                  ~10 min
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {onchainAddress ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm font-mono flex-1 truncate">{onchainAddress}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(onchainAddress, "On-chain address")}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No on-chain address configured</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Wallet Type Card */}
        <Card className="border border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <WalletIcon className="h-5 w-5" />
              Wallet Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium">Wallet Type</p>
                <p className="text-sm text-muted-foreground">
                  {walletType === "blink" && "Blink - Built-in CrowdPay wallet"}
                  {walletType === "external" && "External wallet configured"}
                  {!walletType && "No wallet configured yet"}
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/settings")}>
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions Placeholder */}
        <Card className="mt-6 border border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Recent Transactions
              </span>
              <Button variant="ghost" size="sm">View All</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <WalletIcon className="h-10 w-10 mb-3 opacity-50" />
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs">Your transaction history will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Wallet;
