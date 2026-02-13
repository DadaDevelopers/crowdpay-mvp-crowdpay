import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/MockAuthContext";

const AuthCallback = () => {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const handleVerification = async () => {
      try {
        // Extract tokens from URL (Supabase puts them in the hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        const error = hashParams.get('error');

        // Check for errors
        if (error) {
          setStatus("error");
          return;
        }

        // Success - email verified
        if (accessToken || type === 'signup') {
          // Update localStorage if user exists
          const storedUser = localStorage.getItem("crowdpay_user");
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            userData.email_verified = true;
            localStorage.setItem("crowdpay_user", JSON.stringify(userData));
          }

          setStatus("success");
          
          // Auto-redirect after 3 seconds
          setTimeout(() => {
            navigate(user ? "/app" : "/signin");
          }, 3000);
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error('Verification error:', err);
        setStatus("error");
      }
    };

    handleVerification();
  }, [navigate, user]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="w-16 h-16 mx-auto animate-spin text-primary" />
            <h2 className="text-2xl font-bold">Verifying your email...</h2>
            <p className="text-muted-foreground">Please wait a moment.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
            <h2 className="text-2xl font-bold text-green-600">Account Verified! ✓</h2>
            <p className="text-muted-foreground">
              Your email has been successfully verified.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirecting to dashboard in 3 seconds...
            </p>
            <Button 
              onClick={() => navigate(user ? "/app" : "/signin")} 
              className="w-full mt-4"
            >
              Continue to Dashboard
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <XCircle className="w-16 h-16 mx-auto text-destructive" />
            <h2 className="text-2xl font-bold">Verification Failed</h2>
            <p className="text-muted-foreground">
              The verification link is invalid or has expired.
            </p>
            <div className="space-y-2 mt-4">
              <Button onClick={() => navigate("/signin")} className="w-full">
                Go to Sign In
              </Button>
              <Button 
                onClick={() => navigate("/")} 
                variant="outline" 
                className="w-full"
              >
                Back to Home
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuthCallback;