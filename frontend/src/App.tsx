import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "@/components/AppLayout";
import { MockAuthProvider } from "@/contexts/MockAuthContext";
import { LinksProvider } from "@/contexts/LinksContext";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import CreateCampaign from "./pages/CreateCampaign";
import Campaign from "./pages/Campaign";
import ExploreCampaigns from "./pages/ExploreCampaigns";
import Auth from "./pages/Auth";
import ProfileSettings from "./pages/ProfileSettings";
import MyLinks from "./pages/MyLinks";
import Contributions from "./pages/Contributions";
import Wallet from "./pages/Wallet";
import Notifications from "./pages/Notifications";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MockAuthProvider>
              <LinksProvider>
                <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/app" element={<AppLayout><Dashboard /></AppLayout>} />
                <Route path="/explore" element={<AppLayout><ExploreCampaigns /></AppLayout>} />
                <Route path="/create" element={<AppLayout><CreateCampaign /></AppLayout>} />
                <Route path="/my-links" element={<AppLayout><MyLinks /></AppLayout>} />
                <Route path="/contributions" element={<AppLayout><Contributions /></AppLayout>} />
                <Route path="/wallet" element={<AppLayout><Wallet /></AppLayout>} />
                <Route path="/notifications" element={<AppLayout><Notifications /></AppLayout>} />
                <Route path="/settings" element={<AppLayout><ProfileSettings /></AppLayout>} />
                <Route path="/support" element={<AppLayout><Support /></AppLayout>} />
                <Route path="/c/:slug" element={<Campaign />} />
                <Route path="/:slug" element={<Campaign />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </LinksProvider>
            </MockAuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
