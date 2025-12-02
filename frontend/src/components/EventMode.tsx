import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, MapPin, Users, Gift, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface EventModeProps {
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

const items = [
  { name: "Drinks", status: "taken", taker: "Alex K." },
  { name: "Plates & Cutlery", status: "available" },
  { name: "Snacks", status: "taken", taker: "Sarah M." },
  { name: "Grill Equipment", status: "available" },
  { name: "Music Speaker", status: "taken", taker: "John D." },
];

export const EventMode = ({ onPaymentClick, goalAmount, totalRaised, contributions }: EventModeProps) => {
  const [contributionType, setContributionType] = useState<"cash" | "item">("cash");
  const progress = goalAmount > 0 ? (totalRaised / goalAmount) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-4"
    >
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        {/* Event Card */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
          whileHover={{ scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {/* Hero Image */}
          <div className="h-48 bg-gradient-to-br from-mpesa to-mpesa/70 flex items-center justify-center">
            <div className="text-center text-white">
              <h2 className="text-4xl font-bold mb-2">🌳 Park Picnic</h2>
              <p className="text-white/90">Join us for a relaxing day outdoors</p>
            </div>
          </div>

          {/* Event Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-mpesa" />
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">Dec 15, 2025</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-mpesa" />
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="font-medium">Karura Forest</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-mpesa" />
                <div>
                  <p className="text-xs text-muted-foreground">Attending</p>
                  <p className="font-medium">24 people</p>
                </div>
              </div>
            </div>

            {/* Contribution Toggle */}
            <div className="bg-muted/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <DollarSign className={`w-5 h-5 ${contributionType === "cash" ? "text-bitcoin" : "text-muted-foreground"}`} />
                  <span className={`font-medium ${contributionType === "cash" ? "text-foreground" : "text-muted-foreground"}`}>
                    Contribute Cash
                  </span>
                </div>
                <Switch
                  checked={contributionType === "item"}
                  onCheckedChange={(checked) => setContributionType(checked ? "item" : "cash")}
                />
                <div className="flex items-center gap-3">
                  <span className={`font-medium ${contributionType === "item" ? "text-foreground" : "text-muted-foreground"}`}>
                    Bring an Item
                  </span>
                  <Gift className={`w-5 h-5 ${contributionType === "item" ? "text-mpesa" : "text-muted-foreground"}`} />
                </div>
              </div>

              {contributionType === "cash" ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <p className="text-sm text-muted-foreground">Suggested contribution: 500 KES per person</p>
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Goal</span>
                      <span className="font-bold">{goalAmount.toLocaleString()} KES</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Raised</span>
                      <span className="font-bold text-mpesa">{totalRaised.toLocaleString()} KES</span>
                    </div>
                    <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-mpesa to-mpesa/70"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      {contributions.length} {contributions.length === 1 ? "contribution" : "contributions"}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-2 px-3 bg-white rounded-lg"
                    >
                      <span className="font-medium text-sm">{item.name}</span>
                      {item.status === "taken" ? (
                        <Badge variant="secondary" className="bg-muted">
                          Taken by {item.taker}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-mpesa text-mpesa">
                          Available
                        </Badge>
                      )}
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            <Button 
              onClick={onPaymentClick}
              className="w-full bg-mpesa hover:bg-mpesa/90 text-mpesa-foreground"
              size="lg"
            >
              {contributionType === "cash" ? "Get Your Ticket" : "Claim an Item"}
            </Button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
