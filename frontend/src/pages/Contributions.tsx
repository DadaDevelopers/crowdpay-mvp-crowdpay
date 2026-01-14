import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/MockAuthContext";
import { mockLinks, mockContributions } from "@/data/mockLinks";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, ArrowUpRight, Calendar } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";

const Contributions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get contributions made by the user with link info
  const contributions = mockContributions
    .filter(c => c.user_id === user?.id)
    .map(contribution => {
      const link = mockLinks.find(l => l.id === contribution.link_id);
      return {
        ...contribution,
        link: link ? { title: link.title, slug: link.slug } : null,
      };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0);

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case "lightning":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">⚡ Lightning</Badge>;
      case "onchain":
        return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20">₿ On-chain</Badge>;
      case "mpesa":
        return <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20">📱 M-Pesa</Badge>;
      default:
        return <Badge variant="secondary">{method}</Badge>;
    }
  };

  return (
    <>
      <Helmet>
        <title>My Contributions - CrowdPay</title>
        <meta name="description" content="View your contribution history" />
      </Helmet>

      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">My Contributions</h1>
          <p className="text-muted-foreground">Track all the causes you've supported</p>
        </div>

        {/* Summary Card */}
        <Card className="mb-8 border border-border/50 bg-gradient-to-br from-primary/5 via-card to-card backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Contributed</p>
                <p className="text-3xl font-bold text-primary">
                  {(totalContributed / 100000000).toFixed(6)} BTC
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Across {contributions.length} contribution{contributions.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {contributions.length === 0 ? (
          <Card className="border-2 border-dashed border-border bg-card/50 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No contributions yet</h3>
              <p className="text-muted-foreground mb-6 text-center max-w-sm">
                Support a cause and your contributions will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {contributions.map((contribution) => (
              <Card
                key={contribution.id}
                className="group border border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                onClick={() => contribution.link?.slug && navigate(`/c/${contribution.link.slug}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Heart className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {contribution.link?.title || "Unknown Event"}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(contribution.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {(contribution.amount / 100000000).toFixed(6)} BTC
                        </p>
                        {getPaymentMethodBadge(contribution.payment_method)}
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Contributions;