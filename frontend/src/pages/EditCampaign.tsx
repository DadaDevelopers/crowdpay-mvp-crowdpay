/**
 * EditCampaign – lets a campaign creator fix typos and update details.
 * Pre-fills the form with existing campaign data fetched by ID.
 * Route: /edit/:id  (auth + owner only)
 */

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/contexts/MockAuthContext";
import { campaignApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X, Plus, AlertCircle, Pencil } from "lucide-react";

const MAX_PHOTOS = 5;

const EditCampaign = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user, session, refreshSession } = useAuth();

    const [loadingData, setLoadingData] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notFound, setNotFound] = useState(false);
    const [unauthorized, setUnauthorized] = useState(false);

    const [photos, setPhotos] = useState<string[]>([]);
    const [storyCharCount, setStoryCharCount] = useState(0);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        story: "",
        end_date: "",
        is_public: true,
        status: "active" as "active" | "completed" | "cancelled" | "expired",
    });

    // ── Load existing campaign data ──
    useEffect(() => {
        if (!id) return;
        setLoadingData(true);
        campaignApi.get(id)
            .then(({ campaign }) => {
                // Only the creator can edit
                if (user && campaign.creator_id !== user.id) {
                    setUnauthorized(true);
                    return;
                }

                setFormData({
                    title: campaign.title || "",
                    description: campaign.description || "",
                    story: campaign.story || "",
                    end_date: campaign.end_date
                        ? new Date(campaign.end_date).toISOString().slice(0, 16)
                        : "",
                    is_public: campaign.is_public ?? true,
                    status: (campaign.status as typeof formData.status) || "active",
                });
                setStoryCharCount((campaign.story || "").length);
                setPhotos(Array.isArray(campaign.photos) ? campaign.photos : []);
            })
            .catch(() => setNotFound(true))
            .finally(() => setLoadingData(false));
    }, [id, user]);

    // ── Photo handling ──
    const handlePhotosSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const remaining = MAX_PHOTOS - photos.length;
        if (remaining <= 0) {
            toast({ title: "Max photos reached", description: `You can upload up to ${MAX_PHOTOS} photos`, variant: "destructive" });
            return;
        }

        const oversized = files.filter(f => f.size > 5 * 1024 * 1024);
        if (oversized.length) {
            toast({ title: "File too large", description: "Each photo must be under 5MB", variant: "destructive" });
            return;
        }

        files.slice(0, remaining).forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setPhotos(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
        e.target.value = "";
    };

    const removePhoto = (index: number) => setPhotos(prev => prev.filter((_, i) => i !== index));

    // ── Save ──
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        setSaving(true);
        try {
            // Always try to get a fresh token before saving
            let token = session?.access_token;
            if (!token) {
                const refreshed = await refreshSession();
                token = refreshed?.access_token;
            } else {
                // Proactively refresh in case the current token is near-expired
                const expiresAt = localStorage.getItem("crowdpay_session_expires_at");
                const nowSeconds = Math.floor(Date.now() / 1000);
                const isNearExpiry = expiresAt && Number(expiresAt) - nowSeconds < 300;
                if (isNearExpiry) {
                    const refreshed = await refreshSession();
                    if (refreshed?.access_token) token = refreshed.access_token;
                }
            }

            if (!token) {
                toast({ title: "Session expired", description: "Please sign in again.", variant: "destructive" });
                setSaving(false);
                return;
            }

            await campaignApi.update(
                id,
                {
                    title: formData.title,
                    description: formData.description,
                    story: formData.story || undefined,
                    photos,
                    is_public: formData.is_public,
                    end_date: formData.end_date || undefined,
                },
                token
            );

            toast({ title: "Campaign updated!", description: "Your changes have been saved." });
            navigate(`/c/${id}`);
        } catch (err) {
            toast({
                title: "Failed to save",
                description: err instanceof Error ? err.message : "Please try again",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    // ── States ──
    if (loadingData) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center space-y-3">
                    <AlertCircle className="w-10 h-10 mx-auto text-destructive" />
                    <p className="font-medium">Campaign not found</p>
                    <Button onClick={() => navigate("/app")}>Back to dashboard</Button>
                </div>
            </div>
        );
    }

    if (unauthorized) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center space-y-3">
                    <AlertCircle className="w-10 h-10 mx-auto text-destructive" />
                    <p className="font-medium">You don't have permission to edit this campaign</p>
                    <Button onClick={() => navigate(`/c/${id}`)}>View campaign</Button>
                </div>
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Edit Campaign – CrowdPay</title>
            </Helmet>

            <div className="container mx-auto px-4 py-8 max-w-2xl">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Pencil className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Edit Campaign</h1>
                        <p className="text-muted-foreground text-sm">Fix typos or update your campaign details</p>
                    </div>
                </div>

                <Card>
                    <CardContent>
                        <form onSubmit={handleSave} className="space-y-6">

                            {/* ── Photos ── */}
                            <div className="space-y-2">
                                <Label>
                                    Photos
                                    <span className="text-muted-foreground text-xs ml-2">({photos.length}/{MAX_PHOTOS})</span>
                                </Label>
                                <p className="text-xs text-muted-foreground">First photo is the cover. Add or remove photos.</p>
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
                                                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                                                    Cover
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    {photos.length < MAX_PHOTOS && (
                                        <label className="w-full aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-accent/50 transition-colors">
                                            <Plus className="w-5 h-5 text-muted-foreground mb-1" />
                                            <span className="text-[10px] text-muted-foreground">Add</span>
                                            <input type="file" className="hidden" accept="image/*" multiple onChange={handlePhotosSelect} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* ── Title ── */}
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            {/* ── Short description ── */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Short Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            {/* ── Story ── */}
                            <div className="space-y-2">
                                <Label htmlFor="story">Story</Label>
                                <Textarea
                                    id="story"
                                    value={formData.story}
                                    onChange={e => {
                                        setFormData({ ...formData, story: e.target.value });
                                        setStoryCharCount(e.target.value.length);
                                    }}
                                    rows={8}
                                    maxLength={10000}
                                    className="resize-y"
                                    placeholder="Tell contributors the full story…"
                                />
                                <p className="text-xs text-right text-muted-foreground">
                                    {storyCharCount.toLocaleString()} / 10,000
                                </p>
                            </div>

                            {/* ── Status ── */}
                            <div className="space-y-2">
                                <Label htmlFor="status">Campaign Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={v => setFormData({ ...formData, status: v as typeof formData.status })}
                                >
                                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">✅ Active</SelectItem>
                                        <SelectItem value="completed">🏁 Completed</SelectItem>
                                        <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* ── End date ── */}
                            <div className="space-y-2">
                                <Label htmlFor="end_date">End Date (optional)</Label>
                                <Input
                                    id="end_date"
                                    type="datetime-local"
                                    value={formData.end_date}
                                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                />
                            </div>

                            {/* ── Visibility ── */}
                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_public">Public Campaign</Label>
                                    <p className="text-sm text-muted-foreground">Show in the public Explore page</p>
                                </div>
                                <Switch
                                    id="is_public"
                                    checked={formData.is_public}
                                    onCheckedChange={checked => setFormData({ ...formData, is_public: checked })}
                                />
                            </div>

                            {/* ── Actions ── */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => navigate(`/c/${id}`)}
                                    disabled={saving}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1" disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {saving ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
};

export default EditCampaign;
