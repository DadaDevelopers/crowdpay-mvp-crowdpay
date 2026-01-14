import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/MockAuthContext";
import { Helmet } from "react-helmet-async";
import { Zap, Wallet, RefreshCw, Copy, Check, ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import logo from "@/assets/logo.png";
import bitcoinLogo from "@/assets/bitcoin-logo.png";

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
  const [generatingLightning, setGeneratingLightning] = useState(false);
  const [generatingOnchain, setGeneratingOnchain] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, setWallet, wallet, user, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/app");
    }
  }, [user, loading, navigate]);

  const generateLightningAddress = async () => {
    setGeneratingLightning(true);
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
    await new Promise(resolve => setTimeout(resolve, 1000));
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

    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setStep(2);
  };

  const handleSignUp = async () => {
    // Save wallet data to context if addresses were generated
    if (lightningAddress || onchainAddress) {
      setWallet({
        ...wallet,
        lightningAddress: lightningAddress || wallet.lightningAddress,
        onchainAddress: onchainAddress || wallet.onchainAddress,
        walletType: "blink",
      });
    }

    await signUp(email, password, username || email.split("@")[0]);

    toast({
      title: "Account Created!",
      description: "Welcome to CrowdPay. This is a UI demo.",
    });
    
    navigate("/app");
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
        <nav className="border-b bg-background">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={logo} alt="CrowdPay" className="h-8 w-8 sm:h-10 sm:w-10" />
              <span className="font-bold text-xl">CrowdPay</span>
            </Link>
            <Button variant="ghost" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </nav>

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
                  : "Generate your Bitcoin wallet addresses"
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
                      <img src={bitcoinLogo} alt="Bitcoin" className="w-4 h-4" />
                    )}
                    {generatingOnchain ? "Generating..." : "Generate On-Chain Wallet"}
                  </Button>
                </div>


                <div className="pt-4 space-y-3">
                  <Button onClick={handleSignUp} className="w-full">
                    Complete Sign Up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => navigate("/app")}
                  >
                    Skip this step
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

       
      </div>

      {/* Footer (copied from Landing) */}
      <footer className="py-12 px-4 bg-secondary dark:bg-slate-900 text-foreground dark:text-white">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <img src={logo} alt="CrowdPay" className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl">CrowdPay</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            {["Browse Events", "Features", "How it Works"].map(item => (
              <a key={item} href="#" className="hover:text-foreground transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex gap-4">
            <a href="https://x.com/crowdpay_ke" target="_blank" rel="noopener noreferrer">
              <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M22.46 6c-.77.35-1.6.59-2.47.7a4.3 4.3 0 0 0 1.88-2.37c-.83.5-1.75.87-2.72 1.07A4.28 4.28 0 0 0 16.11 4c-2.37 0-4.29 1.92-4.29 4.29 0 .34.04.67.11.99C7.69 9.13 4.07 7.2 1.64 4.16c-.37.64-.58 1.38-.58 2.17 0 1.5.76 2.83 1.92 3.61-.71-.02-1.38-.22-1.97-.54v.05c0 2.1 1.49 3.85 3.47 4.25-.36.1-.74.16-1.13.16-.28 0-.54-.03-.8-.08.54 1.68 2.11 2.9 3.97 2.93A8.6 8.6 0 0 1 2 19.54c-.29 0-.57-.02-.85-.05A12.13 12.13 0 0 0 8.29 21c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.36-.02-.54A8.18 8.18 0 0 0 24 4.59a8.36 8.36 0 0 1-2.54.7z"></path></svg>
              </Button>
            </a>
            <a href="https://www.instagram.com/crowd.pay" target="_blank" rel="noopener noreferrer">
              <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5A4.25 4.25 0 0 0 20.5 16.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zm4.25 2.75a5.75 5.75 0 1 1 0 11.5 5.75 5.75 0 0 1 0-11.5zm0 1.5a4.25 4.25 0 1 0 0 8.5 4.25 4.25 0 0 0 0-8.5zm6.5 1.25a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0z"></path></svg>
              </Button>
            </a>
          </div>
        </div>
        <div className="text-center mt-8 text-muted-foreground text-sm">
          © {new Date().getFullYear()} CrowdPay. Bitcoin-powered crowdfunding.
        </div>
      </footer>
    </>
  );
};

export default SignUp;
