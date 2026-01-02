import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useLinks, mockContributions } from "@/contexts/LinksContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ExternalLink, Users, Target, Search } from "lucide-react";

const ITEMS_PER_PAGE = 9;

interface Link {
  id: string;
  title: string;
  description: string | null;
  goal_amount: number;
  slug: string | null;
  cover_image_url: string | null;
  theme_color: string | null;
  mode: string;
  category: string;
  totalRaised: number;
  contributionCount: number;
}

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

export default function ExploreCampaigns() {
  const [filteredLinks, setFilteredLinks] = useState<Link[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const { getPublicLinks } = useLinks();

  // Get public links from context with contribution stats
  const links = useMemo(() => {
    return getPublicLinks().map(link => {
      const contributions = mockContributions.filter(c => c.link_id === link.id);
      return {
        ...link,
        totalRaised: contributions.reduce((sum, c) => sum + c.amount, 0),
        contributionCount: contributions.length,
      };
    });
  }, [getPublicLinks]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredLinks.length / ITEMS_PER_PAGE);
  const paginatedLinks = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLinks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredLinks, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery]);

  // Initialize and set loading to false
  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = links;
    
    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((l) => l.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (l) =>
          l.title.toLowerCase().includes(query) ||
          (l.description && l.description.toLowerCase().includes(query))
      );
    }
    
    setFilteredLinks(filtered);
  }, [selectedCategory, searchQuery, links]);

  const progressPercentage = (raised: number, goal: number) => {
    return Math.min((raised / goal) * 100, 100);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <Helmet>
        <title>Explore Events - CrowdPay</title>
        <meta name="description" content="Browse and support public fundraising events on CrowdPay" />
      </Helmet>

      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Explore Events</h1>
          <p className="text-muted-foreground">
            Discover and support fundraising events from the community
          </p>
        </div>

        {/* Search and Category Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events by title or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="all">All</TabsTrigger>
              {Object.entries(categoryLabels).map(([key, { label, emoji }]) => (
                <TabsTrigger key={key} value={key}>
                  {emoji} {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted rounded-t-lg" />
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-4 bg-muted rounded w-full" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : filteredLinks.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              {selectedCategory === "all" ? "No Public Events Yet" : `No ${categoryLabels[selectedCategory]?.label} Events`}
            </h3>
            <p className="text-muted-foreground mb-6">
              {selectedCategory === "all" 
                ? "Be the first to create a public event and inspire others!"
                : "No events found in this category. Try another category or create one!"}
            </p>
            <Button onClick={() => navigate("/create")}>Create Event</Button>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {paginatedLinks.map((link) => (
              <Card
                key={link.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/c/${link.slug || link.id}`)}
              >
                {link.cover_image_url && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={link.cover_image_url}
                      alt={link.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <CardTitle className="line-clamp-2 flex-1">{link.title}</CardTitle>
                    <Badge variant="secondary" className="shrink-0">
                      {categoryLabels[link.category]?.emoji} {categoryLabels[link.category]?.label}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {link.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-semibold text-bitcoin-orange">
                        {formatAmount(link.totalRaised)}
                      </span>
                      <span className="text-muted-foreground">
                        of {formatAmount(link.goal_amount)}
                      </span>
                    </div>
                    <Progress
                      value={progressPercentage(link.totalRaised, link.goal_amount)}
                      className="h-2"
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{link.contributionCount} contributors</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-bitcoin-orange hover:text-bitcoin-orange/80"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/c/${link.slug || link.id}`);
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
