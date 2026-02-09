import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/MockAuthContext";
import { useCampaigns } from "@/contexts/CampaignsContext";
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

const MyLinks = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  useAuth(); // Ensure user is authenticated
  const { getUserCampaigns, isLoading } = useCampaigns();

  // Get user's campaigns from context (which fetches from backend)
  const campaigns = getUserCampaigns();

  const copyLink = (campaignId: string, title: string) => {
    const link = `${window.location.origin}/c/${campaignId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link copied!",
      description: `Share link for "${title}" with your supporters`,
    });
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
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Cancel Campaign
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
    </>
  );
};

export default MyLinks;
