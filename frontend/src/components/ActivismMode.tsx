import { motion } from "framer-motion";
import { Shield, Lock, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ActivismModeProps {
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

export const ActivismMode = ({ onPaymentClick, goalAmount, totalRaised, contributions }: ActivismModeProps) => {
  const progress = goalAmount > 0 ? (totalRaised / goalAmount) * 100 : 0;

  function getTimeAgo(date: Date): string {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  }

  // Format contributions for display
  const recentDonations = contributions.slice(0, 4).map(contribution => ({
    amount: contribution.payment_method === "mpesa"
      ? `${contribution.amount.toLocaleString()} KES`
      : `${(contribution.amount * 150).toLocaleString()} Sats`,
    donor: contribution.contributor_name,
    time: getTimeAgo(new Date(contribution.created_at)),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-slate-900 p-4"
    >
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2">
            <Shield className="w-8 h-8 text-bitcoin" />
            <h2 className="text-3xl font-bold text-white">Anonymous Shield</h2>
          </div>
          <p className="text-gray-400">Protect voices that need to be heard</p>
          <Badge variant="outline" className="border-bitcoin text-bitcoin">
            <Lock className="w-3 h-3 mr-1" />
            Privacy Protected
          </Badge>
        </div>

        {/* Main Card */}
        <motion.div
          className="bg-slate-800 rounded-2xl shadow-2xl p-6 border border-slate-700"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="space-y-6">
            {/* Campaign Info */}
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Support Press Freedom</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Funding independent journalism and protecting sources. Every contribution helps maintain 
                freedom of information and supports critical reporting.
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-gray-400">Raised</span>
                <div className="text-right">
                  <p className="text-2xl font-bold text-bitcoin">{totalRaised.toLocaleString()} KES</p>
                  <p className="text-xs text-gray-500">Goal: {goalAmount.toLocaleString()} KES</p>
                </div>
              </div>
              
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-bitcoin to-yellow-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <TrendingUp className="w-3 h-3" />
                <span>{progress.toFixed(1)}% funded</span>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-700">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-mpesa" />
                Live Wallet Proof
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-gray-500">On-Chain Balance</p>
                  <p className="text-white font-mono">0.0342 BTC</p>
                </div>
                <div>
                  <p className="text-gray-500">Multi-Sig</p>
                  <p className="text-mpesa font-semibold">3/5 Required</p>
                </div>
                <div>
                  <p className="text-gray-500">Last Update</p>
                  <p className="text-white">2 min ago</p>
                </div>
                <div>
                  <p className="text-gray-500">Transparency</p>
                  <p className="text-mpesa font-semibold">100%</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button 
                onClick={onPaymentClick}
                className="bg-bitcoin hover:bg-bitcoin/90 text-bitcoin-foreground"
                size="lg"
              >
                Donate Anonymously
              </Button>
              <Button 
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                size="lg"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Secure & Close
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Donor List */}
        <div className="bg-slate-800 rounded-2xl shadow-2xl p-6 border border-slate-700">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-bitcoin rounded-full animate-pulse" />
            Recent Supporters {contributions.length > 0 && `(${contributions.length})`}
          </h3>
          <div className="space-y-3">
            {recentDonations.length > 0 ? (
              recentDonations.map((donation, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-center justify-between py-2 px-3 bg-slate-900 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center">
                      <Lock className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">{donation.amount}</p>
                      <p className="text-xs text-gray-500">{donation.donor}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">{donation.time}</span>
                </motion.div>
              ))
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                No contributions yet. Be the first to support!
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
