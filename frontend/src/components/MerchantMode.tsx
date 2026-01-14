import { motion } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { Smartphone, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MerchantModeProps {
  onPaymentClick: () => void;
  goalAmount: number;
  totalRaised: number;
  contributions: Array<{
    id: string;
    contributor_name: string;
    amount: number;
    payment_method: "mpesa" | "bitcoin";
    created_at: string;
  }>;
}

export const MerchantMode = ({ onPaymentClick, goalAmount, totalRaised, contributions }: MerchantModeProps) => {
  const remaining = Math.max(0, goalAmount - totalRaised);
  const progress = goalAmount > 0 ? (totalRaised / goalAmount) * 100 : 0;

  // Format contributions for display (show last 4)
  const recentContributions = contributions.slice(0, 4).map(contribution => {
    const timeAgo = getTimeAgo(new Date(contribution.created_at));
    return {
      amount: contribution.payment_method === "mpesa" 
        ? `${contribution.amount.toLocaleString()} KES`
        : `${(contribution.amount * 150).toLocaleString()} Sats`, // Mock conversion
      method: contribution.payment_method === "mpesa" ? "M-Pesa" : "Lightning",
      contributor: contribution.contributor_name,
      time: timeAgo,
    };
  });

  function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 p-4"
    >
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-slate-900">Digital Campfire</h2>
          <p className="text-muted-foreground">Split the bill with your crew</p>
        </div>

        {/* Main QR Card */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-8"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex flex-col items-center space-y-6">
            {/* Progress Ring with QR */}
            <div className="relative">
              <svg className="w-64 h-64 -rotate-90">
                <circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <motion.circle
                  cx="128"
                  cy="128"
                  r="120"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 120}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 120 * (1 - progress / 100) }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--bitcoin-orange))" />
                    <stop offset="100%" stopColor="hsl(var(--mpesa-green))" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white p-4 rounded-xl shadow-md">
                  <QRCodeSVG
                    value="lightning:lnbc1000n1pdj8u7vpp5..."
                    size={160}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="w-full space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Goal Amount</span>
                <span className="font-bold text-lg">{goalAmount.toLocaleString()} KES</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Raised</span>
                <span className="font-bold text-lg text-mpesa">{totalRaised.toLocaleString()} KES</span>
              </div>
              <div className="flex justify-between items-center text-sm pt-3 border-t">
                <span className="text-muted-foreground">Remaining</span>
                <span className="font-bold text-2xl text-bitcoin">{remaining.toLocaleString()} KES</span>
              </div>
            </div>

            <Button 
              onClick={onPaymentClick}
              className="w-full bg-bitcoin hover:bg-bitcoin/90 text-bitcoin-foreground"
              size="lg"
            >
              Contribute Now
            </Button>
          </div>
        </motion.div>

        {/* Activity Feed */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-mpesa rounded-full animate-pulse" />
            Live Activity {contributions.length > 0 && `(${contributions.length})`}
          </h3>
          <div className="space-y-3">
            {recentContributions.length > 0 ? (
              recentContributions.map((contribution, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {contribution.method === "M-Pesa" ? (
                      <Smartphone className="w-4 h-4 text-mpesa" />
                    ) : (
                      <Zap className="w-4 h-4 text-bitcoin" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{contribution.amount}</p>
                      <p className="text-xs text-muted-foreground">
                        {contribution.contributor} • {contribution.method}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{contribution.time}</span>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No contributions yet. Be the first!
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
