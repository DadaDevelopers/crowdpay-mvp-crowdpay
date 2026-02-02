import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/MockAuthContext";
import { Helmet } from "react-helmet-async";
import logo from "@/assets/logo.png";
import { Eye, EyeOff } from "lucide-react";
import SubNav from "@/components/SubNav";
import Footer from "@/components/Footer";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, user, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate("/app");
    }
  }, [user, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    await signIn(email, password);

    toast({
      title: "Welcome back!",
      description: "You’re among the first to see this as we continue development.",
    });

    navigate("/app");
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
        <title>Sign In - CrowdPay</title>
        <meta name="description" content="Sign in to your CrowdPay account" />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        {/* Navigation */}
        <SubNav />

        {/* Sign In Form */}
        <div className="container mx-auto px-4 py-16 flex-1">
          <Card className="max-w-md mx-auto p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
              <p className="text-muted-foreground">
                Sign in to manage your payment links
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
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

              <div className="relative">
                <Label className="text-sm font-medium mb-2 block">Password</Label>
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

              <Button type="submit" className="w-full">
                Sign In
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-primary hover:underline font-medium">
                    Create Account
                  </Link>
                </p>
                <p className="mt-4 p-3 bg-muted/50 rounded-md">
                  {/* Demo Mode message removed */}
                </p>
              </div>
            </form>
          </Card>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};

export default SignIn;
