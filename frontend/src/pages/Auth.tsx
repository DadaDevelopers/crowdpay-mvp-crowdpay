import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/MockAuthContext";
import { Helmet } from "react-helmet-async";
import { Bitcoin, Zap, Wallet, RefreshCw, Copy, Check, ArrowRight, ArrowLeft } from "lucide-react";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [step, setStep] = useState(1); // 1 = credentials, 2 = wallet setup (signup only)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [lightningAddress, setLightningAddress] = useState("");
  const [onchainAddress, setOnchainAddress] = useState("");
  const [generatingLightning, setGeneratingLightning] = useState(false);
  const [generatingOnchain, setGeneratingOnchain] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, setWallet, wallet, user, loading } = useAuth();

  // Redirect if already logged in (but wait for loading to complete)
  useEffect(() => {
    if (!loading && user) {
      navigate("/app");
    }
  }, [user, loading, navigate]);

  const generateLightningAddress = async () => {
    setGeneratingLightning(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    const generatedUsername = username || email.split("@")[0] || "user";
    setLightningAddress(`${generatedUsername}@crowdpay.me`);
    setGeneratingLightning(false);
    toast({
      title: "Lightning Address Generated",
      description: "Your Lightning address is ready for instant payments!",
    });
  };

  const generateOnchainAddress = async () => {
    setGeneratingOnchain(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Generate a mock BTC address (this is just for UI demo)
    const chars = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
    let address = "bc1q";
    for (let i = 0; i < 38; i++) {
      address += chars[Math.floor(Math.random() * chars.length)];
    }
    setOnchainAddress(address);
    setGeneratingOnchain(false);
    toast({
      title: "On-Chain Address Generated",
      description: "Your Bitcoin wallet address is ready!",
    });
  };

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (isSignUp && step === 1) {
      // Move to wallet setup step
      setStep(2);
      return;
    }

    // Save wallet data to context if addresses were generated
    if (lightningAddress || onchainAddress) {
      setWallet({
        ...wallet,
        lightningAddress: lightningAddress || wallet.lightningAddress,
        onchainAddress: onchainAddress || wallet.onchainAddress,
        walletType: "blink",
      });
    }

    // Perform authentication
    if (isSignUp) {
      await signUp(email, password, username || email.split("@")[0]);
    } else {
      await signIn(email, password);
    }

    toast({
      title: "Welcome!",
      description: "This is a UI demo. All data is mock data.",
    });
    
    navigate("/app");
  };

  const handleBack = () => {
    setStep(1);
  };

  // Show loading state while checking session
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
        <title>{isSignUp ? "Sign Up" : "Sign In"} - CrowdPay</title>
        <meta name="description" content="Join CrowdPay and start accepting Bitcoin and M-Pesa contributions" />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b bg-background">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">CrowdPay</span>
            </div>
            <Button variant="ghost" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </nav>

        {/* Auth Form */}
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                {isSignUp 
                  ? step === 1 ? "Create Account" : "Set Up Your Wallet"
                  : "Welcome Back"
                }
              </h1>
              <p className="text-muted-foreground">
                {isSignUp 
                  ? step === 1 
                    ? "Start accepting Bitcoin and M-Pesa today"
                    : "Generate your Bitcoin wallet addresses"
                  : "Sign in to manage your payment links"
                }
              </p>
              {isSignUp && (
                <div className="flex justify-center gap-2 mt-4">
                  <div className={`w-3 h-3 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
                  <div className={`w-3 h-3 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
                </div>
              )}
            </div>

            {/* Toggle Buttons - Only show on step 1 */}
            {step === 1 && (
              <div className="flex gap-2 mb-6">
                <Button
                  variant={isSignUp ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIsSignUp(true)}
                >
                  Sign Up
                </Button>
                <Button
                  variant={!isSignUp ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIsSignUp(false)}
                >
                  Sign In
                </Button>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleAuth} className="space-y-4">
                {isSignUp && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Username</Label>
                    <Input
                      type="text"
                      placeholder="your_username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                )}

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

                <div>
                  <Label className="text-sm font-medium mb-2 block">Password</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full gap-2">
                  {isSignUp ? (
                    <>
                      Continue to Wallet Setup
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <p className="mt-4 p-3 bg-muted/50 rounded-md">
                    💡 <strong>Demo Mode:</strong> Enter any email/password to explore the UI
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
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full gap-2"
                    onClick={generateLightningAddress}
                    disabled={generatingLightning}
                  >
                    {generatingLightning ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {generatingLightning ? "Generating..." : "Generate CrowdPay Lightning Address"}
                  </Button>
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
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full gap-2"
                    onClick={generateOnchainAddress}
                    disabled={generatingOnchain}
                  >
                    {generatingOnchain ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Bitcoin className="w-4 h-4" />
                    )}
                    {generatingOnchain ? "Generating..." : "Generate On-Chain Wallet"}
                  </Button>
                </div>

                <div className="pt-4 space-y-3">
                  <Button onClick={handleAuth} className="w-full">
                    Complete Sign Up
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full gap-2"
                    onClick={handleBack}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </Button>
                </div>

                <p className="text-xs text-center text-muted-foreground p-3 bg-muted/50 rounded-md">
                  ⚡ You can skip this step and set up wallets later in Settings
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Footer */}
        <footer className="py-12 px-4 bg-accent mt-16">
          <div className="container mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 CrowdPay. Bitcoin-powered crowdfunding platform.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Auth;
