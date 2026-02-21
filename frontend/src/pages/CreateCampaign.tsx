import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/MockAuthContext";
import { useCampaigns } from "@/contexts/CampaignsContext";
import { useBtcRate, kesToSats } from "@/hooks/useBtcRate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Store, Calendar, Shield, Loader2, Image as ImageIcon, Copy, Bitcoin, Smartphone, QrCode, MapPin, Clock, Users, X, Plus } from "lucide-react";
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

const MAX_PHOTOS = 5;

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, session } = useAuth();
  const { createCampaign, refetchCampaigns } = useCampaigns();
  const { kesToSats: kesToSatsRate } = useBtcRate();
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [storyCharCount, setStoryCharCount] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    story: "",
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

  const handlePhotosSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      toast({ title: "Max photos reached", description: `You can upload up to ${MAX_PHOTOS} photos`, variant: "destructive" });
      return;
    }

    const toProcess = files.slice(0, remaining);
    const oversized = toProcess.filter(f => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) {
      toast({ title: "File too large", description: "Each photo must be under 5MB", variant: "destructive" });
      return;
    }

    toProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset the input so the same file can be re-selected
    e.target.value = "";
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setShowConfirmDialog(true);
  };

  const handleConfirmCreate = async () => {
    if (!user || !session?.access_token) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a campaign",
        variant: "destructive",
      });
      navigate("/signin");
      return;
    }

    setShowConfirmDialog(false);
    setLoading(true);

    try {
      const targetInSats = formData.goal_amount
        ? kesToSats(parseFloat(formData.goal_amount), kesToSatsRate)
        : 1000;

      const newCampaign = await createCampaign({
        title: formData.title,
        description: formData.description || "No description provided.",
        story: formData.story || undefined,
        photos: photos.length > 0 ? photos : undefined,
        is_public: formData.is_public,
        target_amount: targetInSats,
        currency: "SATS",
        end_date: formData.end_date || undefined,
      });

      refetchCampaigns();

      toast({ title: "Campaign created!", description: "Your campaign is now live." });
      navigate(`/c/${newCampaign.id}`);
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Failed to create campaign",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const campaignUrl = `${baseUrl}/c/${formData.slug || "your-campaign"}`;

  const copyLink = () => {
    navigator.clipboard.writeText(campaignUrl);
    toast({ title: "Link copied!", description: "Share it with your supporters" });
  };

  const formatEndDate = (dateString: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
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
          {/* ── Form Section ── */}
          <Card>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-6">

                {/* ── Photos Upload ── */}
                <div className="space-y-2">
                  <Label>Photos <span className="text-muted-foreground text-xs">({photos.length}/{MAX_PHOTOS})</span></Label>
                  <p className="text-xs text-muted-foreground">Upload up to {MAX_PHOTOS} photos to showcase your campaign. First photo is the cover.</p>

                  {/* Photo grid */}
                  <div className="grid grid-cols-5 gap-2">
                    {photos.map((src, i) => (
                      <div key={i} className="relative group w-full aspect-square rounded-lg overflow-hidden border bg-muted">
                        <img src={src} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">Cover</span>
                        )}
                      </div>
                    ))}

                    {/* Add photo button */}
                    {photos.length < MAX_PHOTOS && (
                      <label className="w-full aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors">
                        <Plus className="w-5 h-5 text-muted-foreground mb-1" />
                        <span className="text-[10px] text-muted-foreground">Add</span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          multiple
                          onChange={handlePhotosSelect}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* ── Title ── */}
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

                {/* ── Slug ── */}
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

                {/* ── Short Description ── */}
                <div className="space-y-2">
                  <Label htmlFor="description">Short Description</Label>
                  <Textarea
                    id="description"
                    placeholder="One or two sentences summarising your campaign..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={2}
                  />
                </div>

                {/* ── Story ── */}
                <div className="space-y-2">
                  <Label htmlFor="story">
                    Your Story
                    <span className="ml-2 text-xs font-normal text-muted-foreground">(recommended)</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Tell contributors the full story. Why does this matter? What will the money do? The more you share, the more people will connect with your cause.
                  </p>
                  <Textarea
                    id="story"
                    placeholder="Share your story here…

Write about what inspired this campaign, how contributions will be used, and why this matters to you. Be as detailed as you'd like — people contribute more when they truly understand the cause."
                    value={formData.story}
                    onChange={(e) => {
                      setFormData({ ...formData, story: e.target.value });
                      setStoryCharCount(e.target.value.length);
                    }}
                    rows={8}
                    maxLength={10000}
                    className="resize-y"
                  />
                  <p className="text-xs text-right text-muted-foreground">{storyCharCount.toLocaleString()} / 10,000</p>
                </div>

                {/* ── Category ── */}
                <div className="space-y-2">
                  <Label htmlFor="category">Event Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category"><SelectValue /></SelectTrigger>
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

                {/* ── Goal Amount ── */}
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

                {/* ── End Date ── */}
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>

                {/* ── Event Location ── */}
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

                {/* ── Theme Color ── */}
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

                {/* ── Mode Selection ── */}
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
                        <p className="text-sm text-muted-foreground font-normal">Perfect for shared bills and offline payments</p>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:border-primary transition-colors">
                      <RadioGroupItem value="event" id="event" className="mt-1" />
                      <Label htmlFor="event" className="flex-1 cursor-pointer space-y-1">
                        <div className="flex items-center gap-2 font-medium">
                          <Calendar className="w-4 h-4" />
                          Event / Social
                        </div>
                        <p className="text-sm text-muted-foreground font-normal">Great for picnics, parties, and social gatherings</p>
                      </Label>
                    </div>
                    <div className="flex items-start space-x-3 p-4 border rounded-lg hover:border-primary transition-colors">
                      <RadioGroupItem value="activism" id="activism" className="mt-1" />
                      <Label htmlFor="activism" className="flex-1 cursor-pointer space-y-1">
                        <div className="flex items-center gap-2 font-medium">
                          <Shield className="w-4 h-4" />
                          Activism / Cause
                        </div>
                        <p className="text-sm text-muted-foreground font-normal">Ideal for protests, causes, and anonymous donations</p>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* ── Visibility ── */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_public">Public Event</Label>
                    <p className="text-sm text-muted-foreground">Make this event visible in the public gallery</p>
                  </div>
                  <Switch
                    id="is_public"
                    checked={formData.is_public}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                  />
                </div>

                {/* ── Submit ── */}
                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate("/app")} disabled={loading} className="flex-1">
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

          {/* ── Live Preview Section ── */}
          <div className="space-y-6">
            <div className="sticky top-4">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                Live Preview – How contributors will see it
              </h3>

              <Card className="overflow-hidden">
                {/* Photo strip preview */}
                {photos.length > 0 ? (
                  <div className="w-full h-48 overflow-hidden">
                    <img src={photos[0]} alt="Cover" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex flex-col items-center justify-center gap-2">
                    <ImageIcon className="w-12 h-12 text-muted-foreground/50" />
                    <p className="text-xs text-muted-foreground">Add photos above to see the cover here</p>
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
                    <p className="text-sm text-muted-foreground">{formData.description}</p>
                  )}

                  {/* Story preview */}
                  {formData.story && (
                    <div className="border-l-2 pl-3" style={{ borderColor: formData.theme_color }}>
                      <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-wrap">{formData.story}</p>
                    </div>
                  )}

                  {/* Event Details */}
                  {formData.mode === "event" && (
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      {formData.end_date && (
                        <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /><span>{formatEndDate(formData.end_date)}</span></div>
                      )}
                      {formData.event_location && (
                        <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /><span>{formData.event_location}</span></div>
                      )}
                      <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /><span>0 attending</span></div>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {formData.goal_amount && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold" style={{ color: formData.theme_color }}>KES 0</span>
                        <span className="text-muted-foreground">of KES {Number(formData.goal_amount).toLocaleString()}</span>
                      </div>
                      <Progress value={0} className="h-2" />
                    </div>
                  )}

                  {/* QR Code Section */}
                  <div className="pt-4 border-t space-y-4">
                    <div className="flex justify-center">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <QRCodeSVG value={campaignUrl} size={140} level="M" fgColor={formData.theme_color} />
                      </div>
                    </div>
                    <p className="text-xs text-center text-muted-foreground">Scan to contribute</p>
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
                    <Button size="sm" style={{ backgroundColor: formData.theme_color }} className="text-white">
                      <Bitcoin className="w-4 h-4 mr-1.5" />Bitcoin
                    </Button>
                    <Button size="sm" variant="secondary">
                      <Smartphone className="w-4 h-4 mr-1.5" />M-Pesa
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">Powered by CrowdPay</p>
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
                    <Copy className="w-4 h-4 mr-2" />Copy Link
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <QrCode className="w-4 h-4 mr-2" />Download QR
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
                <li><strong>Photos:</strong> {photos.length > 0 ? `${photos.length} photo(s)` : "No photos"}</li>
                <li><strong>Story:</strong> {formData.story ? `${storyCharCount} characters` : "No story"}</li>
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
