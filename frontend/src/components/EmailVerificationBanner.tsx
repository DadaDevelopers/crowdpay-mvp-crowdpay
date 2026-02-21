import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, X } from "lucide-react";
import { useAuth } from "@/contexts/MockAuthContext";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const EmailVerificationBanner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  // Don't show if user is verified or banner is dismissed
  if (!user || user.email_verified || dismissed) {
    return null;
  }

  const handleResendEmail = async () => {
    setSending(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      if (response.ok) {
        toast({
          title: "Email Sent! ✓",
          description: "Check your inbox for the verification link.",
        });
      } else {
        throw new Error("Failed to send email");
      }
    } catch (error) {
      toast({
        title: "Failed to Send",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Alert className="relative border-orange-200 bg-orange-50 mb-4">
      <Mail className="h-4 w-4 text-orange-600" />
      <AlertDescription className="ml-2 pr-8">
        <span className="text-orange-900">
          Please verify your email address to unlock all features.
        </span>
        <div className="mt-2 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleResendEmail}
            disabled={sending}
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            {sending ? "Sending..." : "Resend Email"}
          </Button>
        </div>
      </AlertDescription>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 h-6 w-6"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
};