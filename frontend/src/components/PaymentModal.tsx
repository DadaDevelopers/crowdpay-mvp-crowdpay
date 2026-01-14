import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check } from "lucide-react";
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
import { useBtcRate, kesToSats } from "@/hooks/useBtcRate";
import mpesaLogo from "@/assets/mpesa-logo.png";
import bitcoinLogo from "@/assets/bitcoin-logo.png";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
}

export const PaymentModal = ({ open, onClose }: PaymentModalProps) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [amount, setAmount] = useState("1000");
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { kesToSats: kesToSatsRate, btcToKes, loading: rateLoading } = useBtcRate();

  const kesAmount = parseInt(amount) || 0;
  const satAmount = kesAmount > 0 ? kesToSats(kesAmount, kesToSatsRate) : 0;
  const lightningInvoice = "lnbc10u1pjdkv7qpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdqqcqzpgxqyz5vqsp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3s9q";

  const handleCopy = () => {
    navigator.clipboard.writeText(lightningInvoice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Lightning invoice copied to clipboard",
    });
  };

  const handleMpesaPay = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid M-Pesa phone number",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Payment initiated",
      description: `STK push sent to ${phoneNumber}`,
    });
    
    setTimeout(() => {
      onClose();
      toast({
        title: "Payment successful!",
        description: `${kesAmount} KES contributed via M-Pesa`,
      });
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="mpesa" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mpesa" className="gap-2 group">
              <motion.img 
                src={mpesaLogo} 
                alt="M-Pesa" 
                className="w-5 h-5 rounded-sm object-cover"
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

          <TabsContent value="mpesa" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (KES)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">M-Pesa Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0712345678"
              />
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Equivalent in Bitcoin</span>
                <motion.span 
                  className="font-bold text-bitcoin animate-pulse"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  ≈ {satAmount.toLocaleString()} Sats
                </motion.span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {rateLoading ? (
                  "Loading live rate..."
                ) : (
                  `Live rate: 1 KES ≈ ${kesToSatsRate.toFixed(2)} Sats (1 BTC = ${btcToKes.toLocaleString()} KES)`
                )}
              </p>
            </div>

            <Button 
              onClick={handleMpesaPay}
              className="w-full bg-mpesa hover:bg-mpesa/90 text-mpesa-foreground gap-2 group"
              size="lg"
            >
              <motion.img 
                src={mpesaLogo} 
                alt="M-Pesa" 
                className="w-5 h-5 rounded-sm object-cover"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                animate={{ rotate: [0, 0] }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              Pay with M-Pesa
            </Button>
          </TabsContent>

          <TabsContent value="bitcoin" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="btc-amount">Amount (KES)</Label>
              <Input
                id="btc-amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1000"
              />
            </div>

            <div className="bg-muted rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount in Bitcoin</span>
                <motion.span 
                  className="font-bold text-bitcoin animate-pulse"
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {satAmount.toLocaleString()} Sats
                </motion.span>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-center text-muted-foreground">
                Scan QR code with your Lightning wallet
              </p>
              <div className="bg-white p-4 rounded-xl">
                <QRCodeSVG
                  value={lightningInvoice}
                  size={200}
                  level="H"
                  includeMargin={false}
                />
              </div>
              
              <div className="w-full space-y-2">
                <Label className="text-xs">Lightning Invoice</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={lightningInvoice}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-mpesa" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => {
                onClose();
                toast({
                  title: "Waiting for payment",
                  description: "Listening for Lightning payment...",
                });
              }}
              className="w-full bg-bitcoin hover:bg-bitcoin/90 text-bitcoin-foreground gap-2 group"
              size="lg"
            >
              <motion.img 
                src={bitcoinLogo} 
                alt="Bitcoin" 
                className="w-5 h-5"
                whileHover={{ scale: 1.15, rotate: 360 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300 }}
              />
              I've Paid
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
