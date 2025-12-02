import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Store, Users, Shield, Bitcoin, Smartphone, Globe, Lock, ArrowRight, Share2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>CrowdPay - Hybrid Bitcoin & M-Pesa Fundraising Platform</title>
        <meta name="description" content="Accept contributions in Bitcoin and M-Pesa. Create payment links, accept Bitcoin or M-Pesa, receive BTC instantly." />
      </Helmet>

      {/* Navigation */}
      <nav className="border-b bg-background">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Bitcoin className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">CrowdPay</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#campaigns" className="text-sm text-muted-foreground hover:text-foreground">Browse Campaigns</a>
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">How it Works</a>
          </div>
          <Button onClick={() => navigate("/auth")}>Get Started</Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            CrowdPay
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Hybrid Bitcoin & M-Pesa fundraising platform bridging crypto and mobile money in Kenya
          </p>
          <div className="flex items-center justify-center gap-4 mb-8">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Learn More
            </Button>
          </div>
          <div className="flex items-center justify-center gap-4">
            <span className="px-4 py-2 rounded-full bg-bitcoin/10 text-bitcoin font-semibold text-sm">
              Bitcoin Lightning
            </span>
            <span className="px-4 py-2 rounded-full bg-mpesa/10 text-mpesa font-semibold text-sm">
              M-Pesa
            </span>
          </div>
        </div>
      </section>

      {/* Three Modes Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">
            Three Modes, Endless Possibilities
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Choose the perfect mode for your fundraising needs
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6">
              <Store className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">Merchant Mode</h3>
              <p className="text-muted-foreground mb-4">
                Split bills and share costs instantly. Perfect for restaurants, events, and group expenses.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Live bill progress</li>
                <li>• Split with clarity</li>
                <li>• Live QR-code payments</li>
                <li>• Progress tracking</li>
                <li>• Activity feed</li>
              </ul>
            </Card>
            <Card className="p-6">
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">Event Mode</h3>
              <p className="text-muted-foreground mb-4">
                Organize events, picnics, and social gatherings. Manage contributions and track items with ease.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Invitation cards</li>
                <li>• Item checklists</li>
                <li>• Ticket generation</li>
                <li>• Rich invitations</li>
              </ul>
            </Card>
            <Card className="p-6">
              <Shield className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">Activism Mode</h3>
              <p className="text-muted-foreground mb-4">
                Private fundraising for causes and movements. Anonymous donations with transparent wallet verification.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Anonymous donations</li>
                <li>• Wallet verification</li>
                <li>• Privacy-focused</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 bg-navy text-white">
        <div className="container mx-auto max-w-6xl text-center">
          <h2 className="text-4xl font-bold mb-4">
            How <span className="text-primary">CrowdPay</span> Works
          </h2>
          <p className="text-gray-300 mb-16">
            Create payment links, accept Bitcoin and M-Pesa, receive BTC instantly. It's fundraising reimagined for the Bitcoin era.
          </p>
          
          <div className="text-left mb-16">
            <h3 className="text-3xl font-bold mb-8 text-center">Three Simple Steps</h3>
            <p className="text-center text-gray-300 mb-12">Start accepting Bitcoin in minutes, not hours</p>
            
            <div className="space-y-12">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <ArrowRight className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-primary font-bold mb-2">01</div>
                  <h4 className="text-2xl font-bold mb-3">Create Your Link</h4>
                  <p className="text-gray-300">
                    Set up a custom payment page in 60 seconds, add your story and a goal, and choose how you want to receive Bitcoin.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Share2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-primary font-bold mb-2">02</div>
                  <h4 className="text-2xl font-bold mb-3">Share Everywhere</h4>
                  <p className="text-gray-300">
                    Get a short link like crowdpay.me/yourname. Share it on WhatsApp, Instagram, Twitter, or anywhere your supporters are.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                  <Bitcoin className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="text-primary font-bold mb-2">03</div>
                  <h4 className="text-2xl font-bold mb-3">Receive Bitcoin Instantly</h4>
                  <p className="text-gray-300">
                    Accept Bitcoin via QR code and M-Pesa from your supporters; converted to BTC and sent straight to your wallet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose CrowdPay */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Why Choose CrowdPay?</h2>
          <p className="text-center text-muted-foreground mb-12">
            Built for the modern creator, designed for Bitcoin
          </p>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="p-6 text-center">
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-bold mb-2">Lightning Fast</h3>
              <p className="text-sm text-muted-foreground">
                Receive Bitcoin in seconds via Lightning Network
              </p>
            </Card>
            <Card className="p-6 text-center">
              <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-bold mb-2">Global Reach</h3>
              <p className="text-sm text-muted-foreground">
                Accept payments from anywhere in the world
              </p>
            </Card>
            <Card className="p-6 text-center">
              <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-bold mb-2">Secure & Private</h3>
              <p className="text-sm text-muted-foreground">
                Your wallet. Your keys. Your Bitcoin.
              </p>
            </Card>
            <Card className="p-6 text-center">
              <ArrowRight className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="font-bold mb-2">Real-time Conversion</h3>
              <p className="text-sm text-muted-foreground">
                KES-to-BTC conversion happens instantly
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-4">Accept Multiple Payment Methods</h2>
          <p className="text-center text-muted-foreground mb-12">
            Your supporters pay however they want. You receive Bitcoin.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-8 border-2 border-bitcoin/20">
              <Bitcoin className="w-12 h-12 text-bitcoin mb-4" />
              <h3 className="text-2xl font-bold mb-4">Pay with Bitcoin</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>• Lightning Network for instant settlements</li>
                <li>• Lightning invoices for regular settlements</li>
                <li>• Lightning Network for instant settlements</li>
              </ul>
            </Card>
            <Card className="p-8">
              <Smartphone className="w-12 h-12 text-mpesa mb-4" />
              <h3 className="text-2xl font-bold mb-4">Pay with M-Pesa</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li>• Instant KES to BTC conversion via Minmo</li>
                <li>• Familiar M-Pesa experience</li>
                <li>• Perfect for local supporters</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Accepting Bitcoin?</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of creators already using CrowdPay to receive Bitcoin from their community.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={() => navigate("/auth")}>
              Create Your Link
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-accent">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <Bitcoin className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">CrowdPay</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#campaigns" className="text-sm text-muted-foreground hover:text-foreground">Browse Campaigns</a>
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">How it Works</a>
              <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground">Contact Us</a>
            </div>
            <div className="flex items-center gap-4">
              <Button size="icon" variant="ghost">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </Button>
              <Button size="icon" variant="ghost">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </Button>
              <Button size="icon" variant="ghost">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Landing;
