import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Heart, ArrowUpRight, Calendar } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { format } from "date-fns";

interface Contribution {
  id: string;
  amount: number;
  payment_method: string;
  created_at: string;
  campaign: {
    title: string;
    slug: string;
  };
}

const Contributions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalContributed, setTotalContributed] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (!user) return;

    const fetchContributions = async () => {
      try {
        const { data, error } = await supabase
          .from("contributions")
          .select(`
            id,
            amount,
            payment_method,
            created_at,
            campaigns:campaign_id (
              title,
              slug
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        const formattedContributions = (data || []).map((c: any) => ({
          id: c.id,
          amount: c.amount,
          payment_method: c.payment_method,
          created_at: c.created_at,
          campaign: c.campaigns,
        }));

        setContributions(formattedContributions);
        setTotalContributed(formattedContributions.reduce((sum, c) => sum + Number(c.amount), 0));
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContributions();
  }, [user, authLoading, navigate, toast]);

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

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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
                onClick={() => navigate(`/c/${contribution.campaign?.slug}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Heart className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold group-hover:text-primary transition-colors">
                          {contribution.campaign?.title || "Unknown Campaign"}
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
