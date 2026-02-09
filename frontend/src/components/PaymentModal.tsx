/**
 * Payment Modal for CrowdPay
 *
 * Lightning-only payment flow using LNbits backend.
 * Supports SATs/KES currency toggle with live conversion.
 * M-Pesa tab is kept for UI consistency but marked as "Coming Soon".
 */

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Loader2, Zap, ArrowLeftRight } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useBtcRate, kesToSats, satsToKes } from "@/hooks/useBtcRate";
import mpesaLogo from "@/assets/mpesa-logo.png";
import bitcoinLogo from "@/assets/bitcoin-logo.png";

// API configuration
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  campaignId?: string;
  campaignTitle?: string;
  onPaymentSuccess?: (contributionId: string) => void;
}

type PaymentState = "input" | "invoice" | "processing" | "success" | "error";
type CurrencyMode = "KES" | "SATS";

export const PaymentModal = ({
  open,
  onClose,
  campaignId,
  campaignTitle = "CrowdPay Campaign",
  onPaymentSuccess,
}: PaymentModalProps) => {
  const [paymentState, setPaymentState] = useState<PaymentState>("input");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("1000");
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>("KES");
  const [contributorName, setContributorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [copied, setCopied] = useState(false);
  const [invoice, setInvoice] = useState("");
  const [contributionId, setContributionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [finalSatAmount, setFinalSatAmount] = useState(0);

  const { toast } = useToast();
  const { kesToSats: kesToSatsRate, btcToKes, loading: rateLoading } = useBtcRate();

  // Calculate amounts based on currency mode
  const rawAmount = parseInt(amount) || 0;
  const satAmount = currencyMode === "KES"
    ? (rawAmount > 0 ? kesToSats(rawAmount, kesToSatsRate) : 0)
    : rawAmount;
  const kesEquivalent = currencyMode === "SATS"
    ? (rawAmount > 0 ? satsToKes(rawAmount, kesToSatsRate) : 0)
    : rawAmount;

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setPaymentState("input");
      setAmount("1000");
      setCurrencyMode("KES");
      setContributorName("");
      setIsAnonymous(false);
      setInvoice("");
      setContributionId("");
      setError("");
      setFinalSatAmount(0);
    }
  }, [open]);

  // Toggle currency mode
  const toggleCurrency = () => {
    if (currencyMode === "KES") {
      // Switch to SATS: convert current KES to SATS
      const sats = rawAmount > 0 ? kesToSats(rawAmount, kesToSatsRate) : 0;
      setAmount(sats > 0 ? sats.toString() : "");
      setCurrencyMode("SATS");
    } else {
      // Switch to KES: convert current SATS to KES
      const kes = rawAmount > 0 ? Math.round(satsToKes(rawAmount, kesToSatsRate)) : 0;
      setAmount(kes > 0 ? kes.toString() : "");
      setCurrencyMode("KES");
    }
  };

  // Poll for payment status
  const pollPaymentStatus = useCallback(async () => {
    if (!contributionId) return false;

    try {
      const response = await fetch(
        `${API_URL}/api/contributions/${contributionId}/status`
      );
      const data = await response.json();

      if (data.is_paid) {
        setPaymentState("success");
        toast({
          title: "Payment Successful!",
          description: `Thank you for your ${finalSatAmount.toLocaleString()} sats contribution!`,
        });
        onPaymentSuccess?.(contributionId);
        return true;
      }

      if (data.payment_status === "expired" || data.payment_status === "failed") {
        setPaymentState("error");
        setError("Payment expired or failed. Please try again.");
        return true;
      }

      return false;
    } catch (err) {
      console.error("Error polling payment status:", err);
      return false;
    }
  }, [contributionId, finalSatAmount, toast, onPaymentSuccess]);

  // Start polling when invoice is displayed
  useEffect(() => {
    if (paymentState !== "invoice" || !contributionId) return;

    const pollInterval = setInterval(async () => {
      const isDone = await pollPaymentStatus();
      if (isDone) clearInterval(pollInterval);
    }, 3000);

    const timeout = setTimeout(() => {
      clearInterval(pollInterval);
      if (paymentState === "invoice") {
        setPaymentState("error");
        setError("Invoice expired. Please create a new payment.");
      }
    }, 600000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [paymentState, contributionId, pollPaymentStatus]);

  const handleCopy = () => {
    navigator.clipboard.writeText(invoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Lightning invoice copied to clipboard",
    });
  };

  const createLightningInvoice = async () => {
    if (!campaignId) {
      toast({
        title: "Error",
        description: "Campaign ID is required",
        variant: "destructive",
      });
      return;
    }

    if (satAmount < 1) {
      toast({
        title: "Invalid amount",
        description: "Minimum contribution is 1 satoshi",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError("");
    setFinalSatAmount(satAmount);

    try {
      const response = await fetch(`${API_URL}/api/contributions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          amount: satAmount,
          currency: "SATS",
          contributor_name: isAnonymous ? null : contributorName || null,
          is_anonymous: isAnonymous,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create invoice");
      }

      const data = await response.json();
      setInvoice(data.payment_request);
      setContributionId(data.contribution.id);
      setPaymentState("invoice");

      toast({
        title: "Invoice Created",
        description: "Scan the QR code with your Lightning wallet",
      });
    } catch (err) {
      console.error("Error creating invoice:", err);
      setError(err instanceof Error ? err.message : "Failed to create invoice");
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to create invoice",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMpesaPay = () => {
    toast({
      title: "Coming Soon",
      description: "M-Pesa integration will be available soon. Please use Bitcoin for now.",
    });
  };

  const handleClose = () => {
    if (paymentState === "invoice") {
      if (!confirm("Your payment is still pending. Are you sure you want to close?")) {
        return;
      }
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-bitcoin" />
            Choose Payment Method
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="bitcoin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mpesa" className="gap-2 group">
              <motion.img
                src={mpesaLogo}
                alt="M-Pesa"
                className="w-5 h-5 rounded-sm object-cover opacity-50"
                whileHover={{ scale: 1.2, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              M-Pesa
            </TabsTrigger>
            <TabsTrigger value="bitcoin" className="gap-2 group">
              <motion.img
                src={bitcoinLogo}
                alt="Bitcoin"
                className="w-5 h-5"
                whileHover={{ scale: 1.2, rotate: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              Bitcoin
            </TabsTrigger>
          </TabsList>

          {/* M-Pesa Tab - Coming Soon */}
          <TabsContent value="mpesa" className="space-y-4 mt-4">
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-lg font-medium mb-2">Coming Soon</p>
              <p className="text-sm">
                M-Pesa integration is in development.
                <br />
                Please use Bitcoin Lightning for now.
              </p>
            </div>

            <div className="space-y-2 opacity-50">
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
                disabled
              />
            </div>

            <div className="space-y-2 opacity-50">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0712345678"
                disabled
              />
            </div>

            <Button
              onClick={handleMpesaPay}
              className="w-full bg-mpesa/50 text-mpesa-foreground gap-2"
              size="lg"
              disabled
            >
              <motion.img
                src={mpesaLogo}
                alt="M-Pesa"
                className="w-5 h-5 rounded-sm object-cover opacity-50"
              />
              Coming Soon
            </Button>
          </TabsContent>

          {/* Bitcoin Tab - Active */}
          <TabsContent value="bitcoin" className="space-y-4 mt-4">
            <AnimatePresence mode="wait">
              {/* Input State */}
              {paymentState === "input" && (
                <motion.div
                  key="input"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="contributor-name">Your Name (optional)</Label>
                    <Input
                      id="contributor-name"
                      type="text"
                      value={contributorName}
                      onChange={(e) => setContributorName(e.target.value)}
                      placeholder="Enter your name"
                      disabled={isAnonymous}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                      Contribute anonymously
                    </Label>
                  </div>

                  {/* Amount input with currency toggle */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="btc-amount">
                        Amount ({currencyMode})
                      </Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={toggleCurrency}
                        className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        Switch to {currencyMode === "KES" ? "SATS" : "KES"}
                      </Button>
                    </div>
                    <Input
                      id="btc-amount"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={currencyMode === "KES" ? "1000" : "8590"}
                      min={currencyMode === "SATS" ? 1 : 1}
                    />
                  </div>

                  {/* Conversion display */}
                  <div className="bg-muted rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {currencyMode === "KES" ? "Amount in Bitcoin" : "Amount in KES"}
                      </span>
                      <motion.span
                        className="font-bold text-bitcoin"
                        key={satAmount}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                      >
                        {currencyMode === "KES"
                          ? `${satAmount.toLocaleString()} sats`
                          : `KES ${Math.round(kesEquivalent).toLocaleString()}`}
                      </motion.span>
                    </div>
                    {currencyMode === "KES" && satAmount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        = {satAmount.toLocaleString()} sats
                      </p>
                    )}
                    {currencyMode === "SATS" && rawAmount > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        = KES {Math.round(kesEquivalent).toLocaleString()}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {rateLoading ? "Loading live rate..." : `1 BTC = ${btcToKes.toLocaleString()} KES`}
                    </p>
                  </div>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <Button
                    onClick={createLightningInvoice}
                    disabled={isLoading || satAmount < 1 || !campaignId}
                    className="w-full bg-bitcoin hover:bg-bitcoin/90 text-bitcoin-foreground gap-2 group"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Invoice...
                      </>
                    ) : (
                      <>
                        <motion.img
                          src={bitcoinLogo}
                          alt="Bitcoin"
                          className="w-5 h-5"
                          whileHover={{ scale: 1.15, rotate: 360 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        />
                        Pay {satAmount.toLocaleString()} sats with Lightning
                      </>
                    )}
                  </Button>
                </motion.div>
              )}

              {/* Invoice State */}
              {paymentState === "invoice" && (
                <motion.div
                  key="invoice"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="flex flex-col items-center space-y-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-center text-muted-foreground">
                      Scan QR code with your Lightning wallet
                    </p>
                    <p className="text-lg font-bold text-bitcoin">
                      {finalSatAmount.toLocaleString()} sats
                    </p>
                    <div className="bg-white p-4 rounded-xl">
                      <QRCodeSVG value={invoice} size={220} level="H" includeMargin={false} />
                    </div>

                    <div className="w-full space-y-2">
                      <Label className="text-xs">Lightning Invoice</Label>
                      <div className="flex items-center gap-2">
                        <Input value={invoice} readOnly className="font-mono text-xs" />
                        <Button size="icon" variant="outline" onClick={handleCopy}>
                          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Waiting for payment...
                    </div>
                  </div>

                  <Button variant="outline" onClick={() => setPaymentState("input")} className="w-full">
                    Cancel & Start Over
                  </Button>
                </motion.div>
              )}

              {/* Success State */}
              {paymentState === "success" && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center space-y-4 py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-green-600">Payment Successful!</h3>
                  <p className="text-center text-muted-foreground">
                    Thank you for your {finalSatAmount.toLocaleString()} sats contribution!
                  </p>
                  <Button onClick={onClose} className="w-full bg-green-500 hover:bg-green-600">
                    Done
                  </Button>
                </motion.div>
              )}

              {/* Error State */}
              {paymentState === "error" && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center space-y-4 py-8"
                >
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-2xl">!</span>
                  </div>
                  <h3 className="text-xl font-bold text-red-600">Payment Failed</h3>
                  <p className="text-center text-muted-foreground">{error}</p>
                  <Button onClick={() => setPaymentState("input")} className="w-full">
                    Try Again
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
