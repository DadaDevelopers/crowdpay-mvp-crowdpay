
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/MockAuthContext";
import { Helmet } from "react-helmet-async";
import { Zap, Wallet, Copy, Check, ArrowRight, ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import SubNav from "@/components/SubNav";
import Footer from "@/components/Footer";

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), label: "One lowercase letter" },
  { test: (p: string) => /\d/.test(p), label: "One number" },
  { test: (p: string) => /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/~`]/.test(p), label: "One special character" },
];

const SignUp = () => {
  const [step, setStep] = useState(1); // 1 = credentials, 2 = wallet setup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [lightningAddress, setLightningAddress] = useState("");
  const [onchainAddress, setOnchainAddress] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, setWallet, wallet, user, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/app");
    }
  }, [user, loading, navigate]);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const isPasswordValid = PASSWORD_RULES.every((rule) => rule.test(password));

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (username && (username.length < 3 || !/^[a-zA-Z0-9_-]+$/.test(username))) {
      toast({
        title: "Error",
        description: "Username must be at least 3 characters and contain only letters, numbers, hyphens, and underscores",
        variant: "destructive",
      });
      return;
    }

    if (!isPasswordValid) {
      toast({
        title: "Error",
        description: "Password does not meet the requirements",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setStep(2);
  };

  const handleSignUp = async (skipWallet: boolean) => {
    setSubmitting(true);
    try {
      // Save wallet data to context if addresses were provided (not skipped)
      if (!skipWallet && (lightningAddress || onchainAddress)) {
        setWallet({
          lightningAddress: lightningAddress || wallet?.lightningAddress || "",
          onchainAddress: onchainAddress || wallet?.onchainAddress || "",
          walletType: "external",
          btcBalance: wallet?.btcBalance || 0,
        });
      }

      await signUp(email, password, username || email.split("@")[0]);

      toast({
        title: "Account Created!",
        description: "Welcome to CrowdPay.",
      });

      navigate("/app");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Sign up failed. Please try again.";
      toast({
        title: "Sign Up Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create Account - CrowdPay</title>
        <meta name="description" content="Create your CrowdPay account and start accepting Bitcoin and M-Pesa contributions" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <SubNav />

        {/* Sign Up Form */}
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                {step === 1 ? "Create Account" : "Set Up Your Wallet"}
              </h1>
              <p className="text-muted-foreground">
                {step === 1
                  ? "Start accepting Bitcoin and M-Pesa today"
                  : "Add your Bitcoin wallet addresses (optional)"
                }
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <div className={`w-3 h-3 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
                <div className={`w-3 h-3 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
              </div>
            </div>

            {step === 1 ? (
              <form onSubmit={handleContinue} className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Username</Label>
                  <Input
                    type="text"
                    placeholder="your_username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-2 block">Email *</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="relative">
                  <Label className="text-sm font-medium mb-2 block">Password *</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-muted-foreground"
                    tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {password && (
                    <ul className="mt-2 space-y-1 text-xs">
                      {PASSWORD_RULES.map((rule) => (
                        <li
                          key={rule.label}
                          className={rule.test(password) ? "text-green-600" : "text-muted-foreground"}
                        >
                          {rule.test(password) ? "+" : "-"} {rule.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="relative">
                  <Label className="text-sm font-medium mb-2 block">Confirm Password *</Label>
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-9 text-muted-foreground"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <Button type="submit" className="w-full gap-2">
                  Continue to Wallet Setup
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    Already have an account?{" "}
                    <Link to="/signin" className="text-primary hover:underline font-medium">
                      Sign In
                    </Link>
                  </p>
                </div>
              </form>
            ) : (
              /* Step 2: Wallet Setup */
              <div className="space-y-6">
                {/* Lightning Address */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <Label className="font-medium">Lightning Address</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    For instant, low-fee Bitcoin payments
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="user@getalby.com"
                      value={lightningAddress}
                      onChange={(e) => setLightningAddress(e.target.value)}
                      className="flex-1"
                    />
                    {lightningAddress && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(lightningAddress, "lightning")}
                      >
                        {copiedField === "lightning" ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* On-Chain Address */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5 text-orange-500" />
                    <Label className="font-medium">On-Chain Address</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    For larger Bitcoin transactions
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="bc1q..."
                      value={onchainAddress}
                      onChange={(e) => setOnchainAddress(e.target.value)}
                      className="flex-1 font-mono text-xs"
                    />
                    {onchainAddress && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(onchainAddress, "onchain")}
                      >
                        {copiedField === "onchain" ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Button
                    onClick={() => handleSignUp(false)}
                    className="w-full"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      "Complete Sign Up"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => handleSignUp(true)}
                    disabled={submitting}
                  >
                    Skip wallet setup
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full gap-2"
                    onClick={handleBack}
                    disabled={submitting}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground p-3 bg-muted/50 rounded-md">
                  You can set up wallets later in Settings
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </>
  );
};

export default SignUp;
