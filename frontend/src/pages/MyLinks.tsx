import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/MockAuthContext";
import { useCampaigns, Campaign } from "@/contexts/CampaignsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Copy, ExternalLink, MoreVertical, Eye, Trash2, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { APIError } from "@/services/api";

const MyLinks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  useAuth(); // Ensure user is authenticated
  const { getUserCampaigns, deleteCampaign, isLoading, isDeleting } = useCampaigns();

  const campaigns = getUserCampaigns();

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Campaign | null>(null);
  const [contributionWarning, setContributionWarning] = useState<{
    count: number;
    totalAmount: number;
  } | null>(null);

  const copyLink = (campaignId: string, title: string) => {
    const link = `${window.location.origin}/c/${campaignId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: `Share link for "${title}" with your supporters`,
    });
  };

  const handleDeleteClick = (campaign: Campaign) => {
    setContributionWarning(null);
    setDeleteTarget(campaign);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    try {
      const confirm = contributionWarning !== null;
      await deleteCampaign(deleteTarget.id, confirm);
      toast({
        title: "Campaign deleted successfully",
        description: `"${deleteTarget.title}" has been permanently deleted.`,
      });
      setDeleteTarget(null);
      setContributionWarning(null);
    } catch (err) {
      if (err instanceof APIError && err.status === 409) {
        const details = err.details as Record<string, unknown> | undefined;

        if (details?.has_pending) {
          toast({
            title: "Cannot delete campaign",
            description: `This campaign has ${details.pending_count} pending contribution(s). Wait for them to complete or expire before deleting.`,
            variant: "destructive",
          });
          setDeleteTarget(null);
          return;
        }

        if (details?.requires_confirmation) {
          setContributionWarning({
            count: details.contribution_count as number,
            totalAmount: details.total_amount as number,
          });
          return;
        }
      }

      toast({
        title: "Failed to delete campaign",
        description: err instanceof Error ? err.message : "An unexpected error occurred",
        variant: "destructive",
      });
      setDeleteTarget(null);
      setContributionWarning(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTarget(null);
    setContributionWarning(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">Active</Badge>;
      case "completed":
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>My Campaigns - CrowdPay</title>
        <meta name="description" content="Manage your campaigns" />
      </Helmet>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">My Campaigns</h1>
            <p className="text-muted-foreground">Manage all your fundraising campaigns</p>
          </div>
          <Button onClick={() => navigate("/create")} className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" />
            Create New Campaign
          </Button>
        </div>

        {campaigns.length === 0 ? (
          <Card className="border-2 border-dashed border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-sm">
                Create your first campaign to start accepting Bitcoin Lightning contributions
              </p>
              <Button onClick={() => navigate("/create")} className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Create Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {campaigns.map((campaign) => {
              const progress = campaign.target_amount > 0
                ? ((campaign.current_amount || 0) / campaign.target_amount) * 100
                : 0;

              return (
                <Card key={campaign.id} className="group border border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Link to={`/c/${campaign.id}`} className="font-semibold text-lg hover:text-primary hover:underline transition-colors">
                            {campaign.title}
                          </Link>
                          {getStatusBadge(campaign.status)}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {campaign.description}
                        </p>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">
                              {(campaign.current_amount || 0).toLocaleString()} / {campaign.target_amount.toLocaleString()} {campaign.currency}
                            </span>
                          </div>
                          <Progress value={Math.min(progress, 100)} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{progress.toFixed(1)}% funded</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                          <span className="text-sm text-muted-foreground">Link:</span>
                          <span className="text-sm font-medium text-primary flex-1 truncate">
                            {window.location.origin}/c/{campaign.id}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyLink(campaign.id, campaign.title)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/c/${campaign.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Page
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyLink(campaign.id, campaign.title)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/c/${campaign.id}`, '_blank')}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Open in New Tab
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteClick(campaign)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Campaign
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) handleDeleteCancel(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {contributionWarning ? "Campaign has contributions" : "Delete campaign?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {contributionWarning ? (
                <>
                  <p>
                    <strong>"{deleteTarget?.title}"</strong> has{" "}
                    <strong>{contributionWarning.count} contribution{contributionWarning.count !== 1 ? "s" : ""}</strong>{" "}
                    totaling <strong>{contributionWarning.totalAmount.toLocaleString()} sats</strong>.
                  </p>
                  <p>Are you sure you want to delete this campaign and all its contributions? This cannot be undone.</p>
                </>
              ) : (
                <>
                  <p>
                    Are you sure you want to delete <strong>"{deleteTarget?.title}"</strong>?
                  </p>
                  <p>This action cannot be undone.</p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              variant="destructive"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : contributionWarning ? (
                "Delete Anyway"
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default MyLinks;
