import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/MockAuthContext";
import { useCampaigns } from "@/contexts/CampaignsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Store, Calendar, Shield, Loader2, Image as ImageIcon, Copy, Bitcoin, Smartphone, QrCode, MapPin, Clock, Users } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const categoryLabels: Record<string, { label: string; emoji: string }> = {
  education: { label: "Education", emoji: "🎓" },
  medical: { label: "Medical", emoji: "🏥" },
  business: { label: "Business", emoji: "💼" },
  community: { label: "Community", emoji: "🤝" },
  emergency: { label: "Emergency", emoji: "🚨" },
  creative: { label: "Creative", emoji: "🎨" },
  sports: { label: "Sports", emoji: "⚽" },
  charity: { label: "Charity", emoji: "❤️" },
  other: { label: "Other", emoji: "📦" },
};

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addCampaign } = useCampaigns();
  const [loading, setLoading] = useState(false);
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goal_amount: "",
    mode: "merchant" as "merchant" | "event" | "activism",
    category: "other",
    slug: "",
    theme_color: "#F7931A",
    end_date: "",
    is_public: true,
    event_location: "",
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const slugified = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormData(prev => ({ ...prev, slug: slugified }));
    }
  }, [formData.title, formData.slug]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image under 5MB",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmCreate = async () => {
    if (!user) return;
    setShowConfirmDialog(false);
    setLoading(true);

    // Create new campaign and add to context
    const newCampaign = {
      id: `campaign-${Date.now()}`,
      user_id: user.id,
      title: formData.title,
      slug: formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: formData.description,
      goal_amount: formData.goal_amount ? parseFloat(formData.goal_amount) * 100000 : 0, // Convert to satoshis
      mode: formData.mode,
      category: formData.category,
      cover_image_url: coverImagePreview || null,
      theme_color: formData.theme_color,
      is_public: formData.is_public,
      created_at: new Date().toISOString(),
      end_date: formData.end_date || undefined,
      event_location: formData.event_location || undefined,
    };

    addCampaign(newCampaign);

    await new Promise(resolve => setTimeout(resolve, 500));

    toast({
      title: "Event created!",
      description: "Your event is now live.",
    });

    navigate("/my-links");
    setLoading(false);
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const campaignUrl = `${baseUrl}/c/${formData.slug || "your-campaign"}`;

  const copyLink = () => {
    navigator.clipboard.writeText(campaignUrl);
    toast({
      title: "Link copied!",
      description: "Share it with your supporters",
    });
  };

  const formatEndDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <Helmet>
        <title>Create Event - CrowdPay</title>
        <meta name="description" content="Create a new fundraising event with Bitcoin and M-Pesa support" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 max-w-6xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">Create New Event</h1>
            <p className="text-muted-foreground">Set up your fundraising event with full customization</p>
          </div>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Form Section */}
          <Card>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Cover Image */}
                <div className="space-y-2">
                  <Label>Cover Image</Label>
                  <div className="flex flex-col gap-4">
                    {coverImagePreview ? (
                      <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                        <img
                          src={coverImagePreview}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setCoverImagePreview("")}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ImageIcon className="w-10 h-10 mb-3 text-muted-foreground" />
                          <p className="mb-2 text-sm text-muted-foreground">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-muted-foreground">PNG, JPG or WEBP (MAX. 5MB)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleImageSelect}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title *</Label>
                  <Input
                    id="title"
                    placeholder="My Awesome Event"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <Label htmlFor="slug">Event URL</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{baseUrl}/c/</span>
                    <Input
                      id="slug"
                      placeholder="my-campaign"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">This will be your event's unique URL</p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell people about your event..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Event Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="education">🎓 Education</SelectItem>
                      <SelectItem value="medical">🏥 Medical</SelectItem>
                      <SelectItem value="business">💼 Business</SelectItem>
                      <SelectItem value="community">🤝 Community</SelectItem>
                      <SelectItem value="emergency">🚨 Emergency</SelectItem>
                      <SelectItem value="creative">🎨 Creative</SelectItem>
                      <SelectItem value="sports">⚽ Sports</SelectItem>
                      <SelectItem value="charity">❤️ Charity</SelectItem>
                      <SelectItem value="other">📦 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Goal Amount */}
                <div className="space-y-2">
                  <Label htmlFor="goal_amount">Goal Amount (KES)</Label>
                  <Input
                    id="goal_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="10000"
                    value={formData.goal_amount}
                    onChange={(e) => setFormData({ ...formData, goal_amount: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty for no goal</p>
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>

                {/* Event Location - Only show for event mode */}
                {formData.mode === "event" && (
                  <div className="space-y-2">
                    <Label htmlFor="event_location">Event Location</Label>
                    <Input
                      id="event_location"
                      placeholder="e.g., Uhuru Park, Nairobi"
                      value={formData.event_location}
                      onChange={(e) => setFormData({ ...formData, event_location: e.target.value })}
                    />
                  </div>
                )}

                {/* Theme Color */}
                <div className="space-y-2">
                  <Label htmlFor="theme_color">Theme Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="theme_color"
                      type="color"
                      value={formData.theme_color}
                      onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={formData.theme_color}
                      onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                      placeholder="#F7931A"
                    />
                  </div>
                </div>

                {/* Mode Selection */}
                <div className="space-y-3">
                  <Label>Event Type *</Label>
                  <RadioGroup
                    value={formData.mode}
                    onValueChange={(value: "merchant" | "event" | "activism") =>
                      setFormData({ ...formData, mode: value })
                    }
                    className="space-y-3"
                  >
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:border-primary transition-colors">
                      <RadioGroupItem value="merchant" id="merchant" className="mt-1" />
                      <Label htmlFor="merchant" className="flex-1 cursor-pointer space-y-1">
                        <div className="flex items-center gap-2 font-medium">
                          <Store className="w-4 h-4" />
                          Merchant / POS
                        </div>
                        <p className="text-sm text-muted-foreground font-normal">
                          Perfect for shared bills and offline payments
                        </p>
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:border-primary transition-colors">
                      <RadioGroupItem value="event" id="event" className="mt-1" />
                      <Label htmlFor="event" className="flex-1 cursor-pointer space-y-1">
                        <div className="flex items-center gap-2 font-medium">
                          <Calendar className="w-4 h-4" />
                          Event / Social
                        </div>
                        <p className="text-sm text-muted-foreground font-normal">
                          Great for picnics, parties, and social gatherings
                        </p>
                      </Label>
                    </div>

                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:border-primary transition-colors">
                      <RadioGroupItem value="activism" id="activism" className="mt-1" />
                      <Label htmlFor="activism" className="flex-1 cursor-pointer space-y-1">
                        <div className="flex items-center gap-2 font-medium">
                          <Shield className="w-4 h-4" />
                          Activism / Cause
                        </div>
                        <p className="text-sm text-muted-foreground font-normal">
                          Ideal for protests, causes, and anonymous donations
                        </p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Visibility */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_public">Public Event</Label>
                    <p className="text-sm text-muted-foreground">
                      Make this event visible in the public gallery
                    </p>
                  </div>
                  <Switch
                    id="is_public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/app")}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {loading ? "Creating..." : "Create Event"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Live Preview Section */}
          <div className="space-y-6">
            <div className="sticky top-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Live Preview - How contributors will see it
              </h3>

              {/* Campaign Card Preview */}
              <Card className="overflow-hidden">
                {coverImagePreview ? (
                  <div className="w-full h-40 overflow-hidden">
                    <img
                      src={coverImagePreview}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                  </div>
                )}

                <div className="p-5 space-y-4">
                  {/* Title & Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-bold" style={{ color: formData.theme_color }}>
                      {formData.title || "Your Event Title"}
                    </h2>
                    <Badge variant="secondary" className="shrink-0">
                      {categoryLabels[formData.category]?.emoji} {categoryLabels[formData.category]?.label}
                    </Badge>
                  </div>

                  {/* Description */}
                  {formData.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {formData.description}
                    </p>
                  )}

                  {/* Event Details */}
                  {formData.mode === "event" && (
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {formData.end_date && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span>{formatEndDate(formData.end_date)}</span>
                        </div>
                      )}
                      {formData.event_location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4" />
                          <span>{formData.event_location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>0 attending</span>
                      </div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {formData.goal_amount && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold" style={{ color: formData.theme_color }}>
                          KES 0
                        </span>
                        <span className="text-muted-foreground">
                          of KES {Number(formData.goal_amount).toLocaleString()}
                        </span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                  )}

                  {/* QR Code Section */}
                  <div className="pt-4 border-t space-y-4">
                    <div className="flex justify-center">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <QRCodeSVG
                          value={campaignUrl}
                          size={140}
                          level="M"
                          fgColor={formData.theme_color}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">
                      Scan to contribute
                    </p>
                  </div>

                  {/* Campaign Link */}
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">Event Link</p>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/c/${formData.slug || "your-campaign"}`}
                        target="_blank"
                        className="flex-1 text-sm font-mono bg-background px-3 py-2 rounded border truncate hover:text-primary hover:underline transition-colors"
                      >
                        {campaignUrl}
                      </Link>
                      <Button size="sm" variant="outline" onClick={copyLink}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Payment Buttons Preview */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      size="sm"
                      style={{ backgroundColor: formData.theme_color }}
                      className="text-white"
                    >
                      <Bitcoin className="w-4 h-4 mr-1.5" />
                      Bitcoin
                    </Button>
                    <Button size="sm" variant="secondary">
                      <Smartphone className="w-4 h-4 mr-1.5" />
                      M-Pesa
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    Powered by CrowdPay
                  </p>
                </div>
              </Card>

              {/* Share Info */}
              <Card className="mt-4 p-4">
                <h4 className="font-medium mb-2">Share your event</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Once created, share this link or QR code with your supporters to start receiving contributions.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={copyLink}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <QrCode className="w-4 h-4 mr-2" />
                    Download QR
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create this event?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Please cross-check all entered information before proceeding:</p>
              <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                <li><strong>Title:</strong> {formData.title || "Not set"}</li>
                <li><strong>Category:</strong> {formData.category}</li>
                <li><strong>Goal:</strong> {formData.goal_amount ? `KES ${formData.goal_amount}` : "No goal set"}</li>
                <li><strong>Type:</strong> {formData.mode}</li>
                <li><strong>Visibility:</strong> {formData.is_public ? "Public" : "Private"}</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Review Details</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCreate}>Create Event</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CreateCampaign;
