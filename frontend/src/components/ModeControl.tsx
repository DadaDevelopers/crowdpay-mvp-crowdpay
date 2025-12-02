import { motion } from "framer-motion";
import { Store, Users, Shield } from "lucide-react";

export type Mode = "merchant" | "event" | "activism";

interface ModeControlProps {
  currentMode: Mode;
  onModeChange: (mode: Mode) => void;
}

const modes = [
  { id: "merchant" as Mode, label: "POS / Merchant", icon: Store, color: "bitcoin" },
  { id: "event" as Mode, label: "Event / Picnic", icon: Users, color: "mpesa" },
  { id: "activism" as Mode, label: "Activism", icon: Shield, color: "slate" },
];

export const ModeControl = ({ currentMode, onModeChange }: ModeControlProps) => {
  return (
    <div className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-foreground">CrowdPay</h1>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">Prototype Mode</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {modes.map((mode) => {
            const Icon = mode.icon;
            const isActive = currentMode === mode.id;
            
            return (
              <motion.button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? mode.id === "merchant"
                      ? "bg-bitcoin text-bitcoin-foreground"
                      : mode.id === "event"
                      ? "bg-mpesa text-mpesa-foreground"
                      : "bg-slate-900 text-white"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4" />
                {mode.label}
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-current"
                    layoutId="activeMode"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
