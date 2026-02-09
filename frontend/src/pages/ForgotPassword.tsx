import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { Loader2, ArrowLeft } from "lucide-react";
import SubNav from "@/components/SubNav";
import Footer from "@/components/Footer";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      setSent(true);
      toast({
        title: "Email Sent",
        description: "Check your inbox for a password reset link.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Forgot Password - CrowdPay</title>
        <meta name="description" content="Reset your CrowdPay password" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <SubNav />

        <div className="container mx-auto px-4 py-16 flex-1">
          <Card className="max-w-md mx-auto p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
              <p className="text-muted-foreground">
                {sent
                  ? "Check your email for a reset link"
                  : "Enter your email to receive a password reset link"
                }
              </p>
            </div>

            {sent ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-muted-foreground">
                  If an account with <strong>{email}</strong> exists, we've sent a password reset link. Please check your inbox and spam folder.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSent(false)}
                >
                  Send again
                </Button>
                <Link to="/signin" className="block">
                  <Button variant="ghost" className="w-full gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Email</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <Link to="/signin" className="text-primary hover:underline font-medium gap-2 inline-flex items-center">
                    <ArrowLeft className="w-3 h-3" />
                    Back to Sign In
                  </Link>
                </div>
              </form>
            )}
          </Card>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default ForgotPassword;
