import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/MockAuthContext";
import { useBtcRate, btcToKes } from "@/hooks/useBtcRate";
import { walletApi } from "@/services/api";
import { Bitcoin, Copy, Wallet as WalletIcon, ArrowDownLeft, ArrowUpRight, RefreshCw, Zap, QrCode, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { QRCodeSVG } from "qrcode.react";

const Wallet = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { wallet, session } = useAuth();
  const { btcToKes: btcToKesRate, loading: rateLoading } = useBtcRate();
  const [showQR, setShowQR] = useState(false);

  // Fetch real wallet balance from backend
  const { data: balanceData, isLoading: balanceLoading, refetch: refetchBalance } = useQuery({
    queryKey: ["walletBalance"],
    queryFn: async () => {
      if (!session?.access_token) throw new Error("Not authenticated");
      return walletApi.getBalance(session.access_token);
    },
    enabled: !!session?.access_token,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 1,
  });

  // Fetch real payment history from backend
  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["walletPayments"],
    queryFn: async () => {
      if (!session?.access_token) throw new Error("Not authenticated");
      return walletApi.getPayments(session.access_token, 10);
    },
    enabled: !!session?.access_token,
    staleTime: 30000,
    retry: 1,
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
        <h2 className="text-xl font-semibold mb-2">No wallet found</h2>
        <p className="text-muted-foreground mb-6 text-center max-w-sm">
          Your wallet will be created automatically after signup or when you first receive funds.
        </p>
        <Button variant="outline" onClick={() => navigate("/settings")}>Go to Wallet Settings</Button>
      </div>
    );
  }

  const lightningAddress = wallet?.lightningAddress || "";
  const onchainAddress = wallet?.onchainAddress || "";
  const walletType = wallet?.walletType || "";

  // Use real balance from LNbits if available, fallback to wallet context
  const btcBalance = balanceData?.balance_btc ?? wallet?.btcBalance ?? 0;
  const satsBalance = balanceData?.balance_sats ?? 0;

  const payments = (paymentsData?.payments || []) as Array<{
    payment_hash: string;
    amount: number;
    memo: string;
    time: number;
    pending: boolean;
    fee: number;
  }>;

  return (
    <>
      <Helmet>
        <title>Wallet - CrowdPay</title>
        <meta name="description" content="Manage your Bitcoin wallet" />
      </Helmet>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Wallet</h1>
            <p className="text-muted-foreground">Manage your Bitcoin balance and addresses</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchBalance()}
            disabled={balanceLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${balanceLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Balance Card */}
        <Card className="mb-6 border border-border/50 bg-gradient-to-br from-primary/10 via-card to-card backdrop-blur-sm overflow-hidden">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Balance</p>
                {balanceLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="text-muted-foreground">Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-bold">
                        {satsBalance > 0 ? satsBalance.toLocaleString() : btcBalance.toFixed(4)}
                      </p>
                      <span className="text-xl text-muted-foreground">
                        {satsBalance > 0 ? "sats" : "BTC"}
                      </span>
                    </div>
                    <p className="text-lg text-muted-foreground mt-1">
                      {rateLoading ? (
                        "Loading rate..."
                      ) : (
                        `≈ KES ${btcToKes(btcBalance, btcToKesRate).toLocaleString()}`
                      )}
                    </p>
                  </>
                )}
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
                      No Lightning address yet —{" "}
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
              </div>
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
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  {onchainAddress ? (
                    <>
                      <span className="text-sm font-mono flex-1 truncate">{onchainAddress}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(onchainAddress, "On-chain address")}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      No on-chain address yet —{" "}
                      <button onClick={() => navigate("/settings")} className="underline hover:text-foreground">
                        add one in settings
                      </button>
                    </span>
                  )}
                </div>
              </div>
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
                  {walletType === "blink" ? "Blink - Built-in CrowdPay wallet" :
                   walletType === "external" ? "External wallet configured" :
                   "No wallet configured yet"}
                </p>
              </div>
              <Button variant="outline" onClick={() => navigate("/settings")}>
                Configure
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="mt-6 border border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Recent Transactions
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => {
                  const isIncoming = payment.amount > 0;
                  const amountSats = Math.abs(payment.amount) / 1000; // msats to sats
                  const date = new Date(payment.time * 1000);
                  return (
                    <div
                      key={payment.payment_hash}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isIncoming ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"
                        }`}>
                          {isIncoming
                            ? <ArrowDownLeft className="h-4 w-4 text-green-600" />
                            : <ArrowUpRight className="h-4 w-4 text-red-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">
                            {payment.memo || (isIncoming ? "Received" : "Sent")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${isIncoming ? "text-green-600" : "text-red-600"}`}>
                          {isIncoming ? "+" : "-"}{Math.round(amountSats).toLocaleString()} sats
                        </p>
                        {payment.pending && (
                          <Badge variant="outline" className="text-xs">Pending</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <WalletIcon className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm">No transactions yet</p>
                <p className="text-xs">Your transaction history will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );

}

export default Wallet;
