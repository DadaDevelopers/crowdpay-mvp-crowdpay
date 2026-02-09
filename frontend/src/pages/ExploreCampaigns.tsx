import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useCampaigns, Campaign } from "@/contexts/CampaignsContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { ExternalLink, Users, Target, Search, Loader2 } from "lucide-react";

const ITEMS_PER_PAGE = 9;

export default function ExploreCampaigns() {
  const [filteredCampaigns, setFilteredCampaigns] = useState<Campaign[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  const { getPublicCampaigns, isLoading, error } = useCampaigns();

  // Get public campaigns from context (which fetches from backend)
  const campaigns = useMemo(() => getPublicCampaigns(), [getPublicCampaigns]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredCampaigns.length / ITEMS_PER_PAGE);
  const paginatedCampaigns = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCampaigns.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredCampaigns, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Filter campaigns based on search query
  useEffect(() => {
    let filtered = campaigns;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(query) ||
          (c.description && c.description.toLowerCase().includes(query))
      );
    }

    setFilteredCampaigns(filtered);
  }, [searchQuery, campaigns]);

  const progressPercentage = (current: number, target: number) => {
    if (target <= 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === "SATS") {
      return `${amount.toLocaleString()} sats`;
    }
    return `${amount.toLocaleString()} ${currency}`;
  };

  return (
    <>
      <Helmet>
        <title>Explore Campaigns - CrowdPay</title>
        <meta name="description" content="Browse and support public fundraising campaigns on CrowdPay" />
      </Helmet>

      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6 flex justify-end">
          <Button variant="outline" onClick={() => navigate("/")}>Back to Home</Button>
        </div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Explore Campaigns</h1>
          <p className="text-muted-foreground">
            Discover and support fundraising campaigns from the community
          </p>
        </div>

        {/* Search */}
        <div className="mb-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading campaigns...</p>
            </div>
          </div>
        ) : error ? (
          <Card className="p-12 text-center">
            <Target className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h3 className="text-xl font-semibold mb-2">Failed to load campaigns</h3>
            <p className="text-muted-foreground mb-6">
              Please try again later.
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </Card>
        ) : filteredCampaigns.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "No campaigns found" : "No Public Campaigns Yet"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery
                ? "Try a different search term."
                : "Be the first to create a public campaign and inspire others!"}
            </p>
            <Button onClick={() => navigate("/create")}>Create Campaign</Button>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedCampaigns.map((campaign) => (
                <Card
                  key={campaign.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/c/${campaign.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="line-clamp-2 flex-1">{campaign.title}</CardTitle>
                      <Badge variant="secondary" className="shrink-0">
                        {campaign.status === "active" ? "Active" : campaign.status}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {campaign.description || "No description provided"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold text-bitcoin-orange">
                          {formatAmount(campaign.current_amount, campaign.currency)}
                        </span>
                        <span className="text-muted-foreground">
                          of {formatAmount(campaign.target_amount, campaign.currency)}
                        </span>
                      </div>
                      <Progress
                        value={progressPercentage(campaign.current_amount, campaign.target_amount)}
                        className="h-2"
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>
                          {Math.round(progressPercentage(campaign.current_amount, campaign.target_amount))}% funded
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-bitcoin-orange hover:text-bitcoin-orange/80"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/c/${campaign.id}`);
                        }}
                      >
                        View <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </div>
    </>
  );
}
