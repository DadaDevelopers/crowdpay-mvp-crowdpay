import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/MockAuthContext";
import { useToast } from "@/hooks/use-toast";
import SubNav from "@/components/SubNav";
import Footer from "@/components/Footer";

const EmailConfirm = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const navigate = useNavigate();
  const { toast } = useToast();
  const { confirmEmail, user } = useAuth();

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (!tokenHash || type !== "email") {
      setStatus("error");
      toast({
        title: "Invalid Link",
        description: "The confirmation link is invalid.",
        variant: "destructive",
      });
      return;
    }

    const confirm = async () => {
      try {
        await confirmEmail(tokenHash);
        setStatus("success");
        toast({
          title: "Email Confirmed! ✓",
          description: "Your account has been verified successfully.",
        });
      } catch (error) {
        setStatus("error");
        const message = error instanceof Error ? error.message : "Confirmation failed";
        toast({
          title: "Confirmation Failed",
          description: message,
          variant: "destructive",
        });
      }
    };

    confirm();
  }, [searchParams, confirmEmail, toast]);

  return (
    <>
      <div className="min-h-screen bg-background">
        <SubNav />
        
        <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[calc(100vh-200px)]">
          <Card className="max-w-md w-full p-8 text-center">
            {status === "loading" && (
              <>
                <Loader2 className="w-16 h-16 mx-auto mb-4 animate-spin text-primary" />
                <h2 className="text-2xl font-bold mb-2">Confirming your email...</h2>
                <p className="text-muted-foreground">Please wait a moment.</p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                <h2 className="text-2xl font-bold mb-2">Email Confirmed!</h2>
                <p className="text-muted-foreground mb-6">
                  Your account has been verified successfully.
                </p>
                <Button 
                  onClick={() => navigate(user ? "/app" : "/signin")} 
                  className="w-full"
                >
                  {user ? "Go to Dashboard" : "Sign In"}
                </Button>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                <h2 className="text-2xl font-bold mb-2">Confirmation Failed</h2>
                <p className="text-muted-foreground mb-6">
                  The confirmation link is invalid or has expired.
                </p>
                <div className="space-y-3">
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
              </>
            )}
          </Card>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default EmailConfirm;