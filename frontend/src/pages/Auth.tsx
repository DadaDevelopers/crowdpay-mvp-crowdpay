import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet-async";
import { Bitcoin } from "lucide-react";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

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

    // Mock authentication - just navigate to dashboard
    toast({
      title: "Welcome!",
      description: "This is a UI demo. All data is mock data.",
    });
    
    navigate("/app");
  };

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
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h1>
              <p className="text-muted-foreground">
                {isSignUp 
                  ? "Start accepting Bitcoin and M-Pesa today"
                  : "Sign in to manage your campaigns"
                }
              </p>
            </div>

            {/* Toggle Buttons */}
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

            <form onSubmit={handleAuth} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full">
                {isSignUp ? "Create Account" : "Sign In"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <p className="mt-4 p-3 bg-muted/50 rounded-md">
                  💡 <strong>Demo Mode:</strong> Enter any email/password to explore the UI
                </p>
              </div>
            </form>
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
