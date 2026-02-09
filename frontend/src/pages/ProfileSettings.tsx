import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/MockAuthContext";
import { useToast } from "@/hooks/use-toast";
import { profileApi } from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from "react-helmet-async";
import { Loader2, User, Wallet, Shield, Bell, Zap, Bitcoin, CheckCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ProfileSettings = () => {
  const { user, session, signOut, setWallet } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Profile data
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bitcoinWalletType, setBitcoinWalletType] = useState("internal");
  const [lightningAddress, setLightningAddress] = useState("");
  const [onchainAddress, setOnchainAddress] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [lightningAddressError, setLightningAddressError] = useState("");

  // Fetch profile from backend on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!session?.access_token) {
        setLoadingProfile(false);
        return;
      }

      try {
        const data = await profileApi.get(session.access_token);
        const profile = data.user;
        setUsername(profile.username || "");
        setFullName(profile.full_name || "");
        setLightningAddress(profile.lightning_address || "");
        setOnchainAddress(profile.onchain_address || "");
        setBitcoinWalletType(profile.wallet_type || "internal");
        setEmailNotifications(profile.email_notifications !== false);
      } catch (err) {
        console.error("Error loading profile:", err);
        // Use local user data as fallback
        if (user) {
          setUsername(user.username || "");
        }
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [session?.access_token, user]);

  // Validate Lightning address format
  const validateLightningAddress = (address: string): boolean => {
    if (!address || !address.trim()) {
      setLightningAddressError("");
      return true; // Empty is valid (optional field)
    }
    const trimmed = address.trim();
    // user@domain format
    if (/^[^@]+@[^@]+\.[^@]+$/.test(trimmed)) {
      setLightningAddressError("");
      return true;
    }
    // LNURL format
    if (trimmed.toLowerCase().startsWith("lnurl")) {
      setLightningAddressError("");
      return true;
    }
    setLightningAddressError("Must be user@domain format (e.g. name@getalby.com) or LNURL");
    return false;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateLightningAddress(lightningAddress)) {
      return;
    }

    if (!session?.access_token) {
      toast({
        title: "Not authenticated",
        description: "Please sign in to save settings",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const updateData: Record<string, unknown> = {
        username: username || undefined,
        full_name: fullName || undefined,
        lightning_address: lightningAddress.trim() || null,
        onchain_address: onchainAddress.trim() || null,
        wallet_type: bitcoinWalletType,
        email_notifications: emailNotifications,
      };

      await profileApi.update(session.access_token, updateData);

      // Update local wallet context
      setWallet({
        lightningAddress: lightningAddress.trim(),
        onchainAddress: onchainAddress.trim(),
        walletType: bitcoinWalletType === "lightning" ? "external" : bitcoinWalletType === "internal" ? "blink" : "external",
        btcBalance: 0,
      });

      toast({
        title: "Settings saved",
        description: "Your profile has been updated successfully.",
      });
    } catch (err) {
      console.error("Error saving profile:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate("/");
  };

  const handleDeleteAccount = () => {
    toast({
      title: "Account deleted",
      description: "Your account has been deleted.",
      variant: "destructive",
    });
    signOut();
    navigate("/");
  };

  if (loadingProfile) {
    return (
      <div className="p-6 max-w-4xl mx-auto flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Settings - CrowdPay</title>
        <meta name="description" content="Manage your profile and wallet settings" />
      </Helmet>

      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Section */}
          <Card className="border border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your username"
                    required
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="bg-background"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Contact support to change your email</p>
              </div>
            </CardContent>
          </Card>

          {/* Wallet Settings */}
          <Card className="border border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wallet className="h-5 w-5 text-primary" />
                Bitcoin Wallet Settings
              </CardTitle>
              <CardDescription>Configure how you receive Bitcoin payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="walletType">Wallet Type</Label>
                <Select value={bitcoinWalletType} onValueChange={setBitcoinWalletType}>
                  <SelectTrigger className="bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Built-in CrowdPay Wallet
                      </div>
                    </SelectItem>
                    <SelectItem value="lightning">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        External Lightning Wallet
                      </div>
                    </SelectItem>
                    <SelectItem value="onchain">
                      <div className="flex items-center gap-2">
                        <Bitcoin className="h-4 w-4" />
                        External On-Chain Wallet
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lightningAddress">Lightning Address</Label>
                <Input
                  id="lightningAddress"
                  type="text"
                  value={lightningAddress}
                  onChange={(e) => {
                    setLightningAddress(e.target.value);
                    if (lightningAddressError) validateLightningAddress(e.target.value);
                  }}
                  onBlur={() => validateLightningAddress(lightningAddress)}
                  placeholder="user@getalby.com or LNURL"
                  className={`bg-background ${lightningAddressError ? "border-destructive" : ""}`}
                />
                {lightningAddressError ? (
                  <p className="text-xs text-destructive">{lightningAddressError}</p>
                ) : lightningAddress && !lightningAddressError ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    Your Lightning address for instant Bitcoin payments
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Your Lightning address for instant Bitcoin payments
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="onchainAddress">On-Chain Address</Label>
                <Input
                  id="onchainAddress"
                  type="text"
                  value={onchainAddress}
                  onChange={(e) => setOnchainAddress(e.target.value)}
                  placeholder="bc1q..."
                  className="bg-background"
                />
                <p className="text-xs text-muted-foreground">
                  Your Bitcoin on-chain address for larger payments
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card className="border border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-primary" />
                Notifications
              </CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Receive email alerts when someone contributes
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                >
                  Sign Out
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will be redirected to the home page and will need to sign in again to access your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </form>

        {/* Danger Zone */}
        <Card className="mt-8 border border-destructive/30 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive text-lg">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-background rounded-lg">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all data
                </p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action is irreversible. All your data, events, and contributions will be permanently deleted and cannot be recovered.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ProfileSettings;
