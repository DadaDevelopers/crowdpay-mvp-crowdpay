import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Store, Calendar, Shield, Loader2, Image as ImageIcon } from "lucide-react";
import { Helmet } from "react-helmet-async";

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
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
  });

  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a campaign",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [user, authLoading, navigate, toast]);

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
      setCoverImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadCoverImage = async (): Promise<string | null> => {
    if (!coverImageFile || !user) return null;

    setUploading(true);
    try {
      const fileExt = coverImageFile.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("campaign-covers")
        .upload(fileName, coverImageFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("campaign-covers")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Upload cover image if selected
      let coverImageUrl = null;
      if (coverImageFile) {
        coverImageUrl = await uploadCoverImage();
      }

      const { error } = await supabase.from("campaigns").insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        goal_amount: parseFloat(formData.goal_amount) || 0,
        mode: formData.mode,
        category: formData.category,
        slug: formData.slug,
        theme_color: formData.theme_color,
        cover_image_url: coverImageUrl,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        is_public: formData.is_public,
      });

      if (error) throw error;

      toast({
        title: "Campaign created!",
        description: "Your campaign has been successfully created.",
      });

      navigate("/app");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create Campaign - CrowdPay</title>
        <meta name="description" content="Create a new fundraising campaign with Bitcoin and M-Pesa support" />
      </Helmet>
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create New Campaign</CardTitle>
              <CardDescription>
                Set up your fundraising campaign with full customization
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
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
                          onClick={() => {
                            setCoverImageFile(null);
                            setCoverImagePreview("");
                          }}
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
                  <Label htmlFor="title">Campaign Title *</Label>
                  <Input
                    id="title"
                    placeholder="My Awesome Campaign"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <Label htmlFor="slug">Campaign URL</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">crowdpay.me/</span>
                    <Input
                      id="slug"
                      placeholder="my-campaign"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">This will be your campaign's unique URL</p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell people about your campaign..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                  />
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Campaign Category *</Label>
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
                  <Label>Campaign Type *</Label>
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
                    <Label htmlFor="is_public">Public Campaign</Label>
                    <p className="text-sm text-muted-foreground">
                      Make this campaign visible in the public gallery
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
                    disabled={loading || uploading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || uploading} className="flex-1">
                    {(loading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {uploading ? "Uploading..." : loading ? "Creating..." : "Create Campaign"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </>
  );
};

export default CreateCampaign;
