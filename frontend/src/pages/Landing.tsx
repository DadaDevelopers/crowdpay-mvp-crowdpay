import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Store, Users, Shield, Globe, Lock, ArrowRight, Share2, Twitter, Instagram, Sun, Moon, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

// Import assets
import heroBg1 from "@/assets/hero-bg.jpg";
import heroBg2 from "@/assets/hero-bg-2.jpg";
import heroBg3 from "@/assets/hero-bg-3.jpg";
import heroBg4 from "@/assets/hero-bg-4.jpg";
import logo from "@/assets/logo.png";
import mpesaLogo from "@/assets/mpesa-logo.png";
import bitcoinLogo from "@/assets/bitcoin-logo.png";

// --- Data Constants ---
const HERO_SLIDES = [
  {
    image: heroBg1,
    title: "CrowdPay",
    subtitle: "From M-Pesa to Bitcoin",
    highlight1: { text: "Mobile Money", color: "text-mpesa" },
    highlight2: { text: "Lightning Network", color: "text-bitcoin" },
    description: "Bridging crypto and mobile money for seamless fundraising.",
  },
  {
    image: heroBg2,
    title: "CrowdPay",
    subtitle: "Community Powered",
    highlight1: { text: "Bitcoin", color: "text-bitcoin" },
    highlight2: { text: "M-Pesa", color: "text-mpesa" },
    description: "Accept contributions from anyone. Receive Bitcoin instantly.",
  },
  {
    image: heroBg3,
    title: "CrowdPay",
    subtitle: "Mobile First. Bitcoin Native.",
    highlight1: { text: "Lightning Fast", color: "text-yellow-400" },
    highlight2: { text: "Global Reach", color: "text-blue-400" },
    description: "Create payment links in seconds. Share everywhere.",
  },
  {
    image: heroBg4,
    title: "CrowdPay",
    subtitle: "Fundraise Together",
    highlight1: { text: "Events", color: "text-mpesa" },
    highlight2: { text: "Causes", color: "text-purple-400" },
    description: "From picnics to protests, power your community.",
  },
];

const MODES = [
  { 
    icon: Store, 
    title: "Merchant Mode", 
    color: "primary", 
    shortDesc: "Split bills and share costs instantly.",
    fullDesc: "Perfect for restaurants, events, and group expenses. Track shared costs in real-time with QR-code payments.",
    items: ["Live bill progress", "Split with clarity", "QR-code payments"]
  },
  { 
    icon: Users, 
    title: "Event Mode", 
    color: "mpesa", 
    shortDesc: "Organize gatherings and manage contributions.",
    fullDesc: "Manage events, picnics, and social gatherings. Create invitation cards, track contributions, and generate tickets.",
    items: ["Invitation cards", "Item checklists", "Ticket generation"]
  },
  { 
    icon: Shield, 
    title: "Activism Mode", 
    color: "purple-500", 
    shortDesc: "Private fundraising for causes and movements.",
    fullDesc: "Secure fundraising for causes and movements. Anonymous donations with wallet verification for privacy.",
    items: ["Anonymous donations", "Wallet verification", "Privacy-focused"]
  },
];

const STEPS = [
  { step: "01", title: "Create Link", shortDesc: "Set up in 60 seconds", fullDesc: "Set up a custom payment page. Add your story, set a goal, and choose how you receive Bitcoin.", color: "primary", icon: ArrowRight },
  { step: "02", title: "Share Everywhere", shortDesc: "Get a short link", fullDesc: "Get a link like crowdpay.me/name. Share on WhatsApp, Instagram, or Twitter.", color: "mpesa", icon: Share2 },
  { step: "03", title: "Receive Bitcoin", shortDesc: "Get paid instantly", fullDesc: "Accept Bitcoin via QR and M-Pesa. Funds convert to BTC and hit your wallet instantly.", color: "bitcoin", isBitcoin: true },
];

const BENEFITS = [
  { icon: Zap, title: "Lightning Fast", shortDesc: "Instant payments", fullDesc: "Receive Bitcoin in seconds via Lightning Network", color: "yellow-500" },
  { icon: Globe, title: "Global Reach", shortDesc: "Accept worldwide", fullDesc: "Accept payments from anywhere in the world", color: "blue-500" },
  { icon: Lock, title: "Secure & Private", shortDesc: "Your keys", fullDesc: "Your wallet. Your keys. Your Bitcoin.", color: "green-500" },
  { icon: ArrowRight, title: "Real-time Rates", shortDesc: "Live conversion", fullDesc: "KES-to-BTC conversion happens instantly at market rates", color: "primary" },
];

// --- Animations ---
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const Landing = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Theme toggle logic
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  // Auto-scroll logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = HERO_SLIDES[currentSlide];

  return (
    <>
      <Helmet>
        <title>CrowdPay - Hybrid Bitcoin & M-Pesa Fundraising Platform</title>
        <meta name="description" content="Accept contributions in Bitcoin and M-Pesa. Receive BTC instantly." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex flex-col overflow-hidden">
        {HERO_SLIDES.map((s, index) => (
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: index === currentSlide ? 1 : 0, scale: index === currentSlide ? 1 : 1.1 }}
            transition={{ duration: 1.2 }}
            style={{ backgroundImage: `url(${s.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        ))}
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 py-4 bg-black/30 backdrop-blur-md border-b border-white/10">
          <div className="container mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2">
              <img src={logo} alt="CrowdPay" className="h-8 w-8 sm:h-10 sm:w-10" />
              <span className="font-bold text-xl sm:text-2xl text-white">CrowdPay</span>
            </div>
            <div className="hidden md:flex gap-8">
              {["Features", "How it Works", "Browse Events"].map((item) => (
                <a key={item} href={item === "Browse Events" ? "/explore" : `#${item.toLowerCase().replace(/ /g, '-')}`} className="text-sm text-white/80 hover:text-white transition-colors">
                  {item}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={toggleTheme}
                variant="secondary"
                size="icon"
                className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button onClick={() => navigate("/signin")} variant="secondary" size="sm" className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20">
                Sign In
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 text-center pt-20">
          <div className="max-w-4xl mx-auto">
            <motion.h1 
              key={`t-${currentSlide}`}
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-4"
            >
              {slide.title}
            </motion.h1>
            
            <motion.h2 key={`s-${currentSlide}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg sm:text-2xl lg:text-3xl font-bold text-white mb-4">
              {slide.subtitle}
            </motion.h2>
            
            <p className="text-base sm:text-xl text-white/90 mb-4">
              Unifying <span className={`${slide.highlight1.color} font-bold`}>{slide.highlight1.text}</span> with <span className={`${slide.highlight2.color} font-bold`}>{slide.highlight2.text}</span>
            </p>

            <div className="flex justify-center gap-4 mt-8">
              <Button size="lg" onClick={() => navigate("/signup")} className="bg-primary/90 hover:bg-primary text-lg px-8 py-6">
                <Zap className="mr-2 h-5 w-5" /> Get Started
              </Button>
            </div>
          </div>
        </div>

        {/* Indicators */}
        <div className="relative z-10 pb-8 flex justify-center gap-2">
          {HERO_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)} className={`h-2 rounded-full transition-all ${i === currentSlide ? "bg-white w-6" : "bg-white/40 w-2"}`} />
          ))}
        </div>
      </section>

      {/* Three Modes Section (HOVER REVEAL ADDED) */}
      <section id="features" className="py-16 sm:py-24 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" variants={fadeInUp} viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">Three Modes, <span className="text-primary">Endless Possibilities</span></h2>
            <p className="text-muted-foreground text-lg">Choose the perfect mode for your needs</p>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {MODES.map((mode, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                <Card className="p-8 h-full bg-card/80 hover:shadow-xl transition-all group relative overflow-hidden cursor-pointer border-border/50">
                   <div className="relative z-10">
                      <div className={`w-14 h-14 rounded-xl bg-${mode.color}/10 flex items-center justify-center mb-6`}>
                        <mode.icon className={`w-7 h-7 text-${mode.color}`} />
                      </div>
                      <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{mode.title}</h3>
                      <p className="text-muted-foreground mb-4">{mode.shortDesc}</p>
                      
                      {/* --- HOVER REVEAL LOGIC START --- */}
                      <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-in-out opacity-0 group-hover:opacity-100">
                         <div className="overflow-hidden">
                           <p className="text-sm text-muted-foreground mb-3 pt-2 border-t border-border/50">{mode.fullDesc}</p>
                           <ul className="space-y-2 text-sm text-muted-foreground">
                              {mode.items.map((item) => (
                                <li key={item} className="flex items-center gap-2">
                                  <span className={`w-1.5 h-1.5 rounded-full bg-${mode.color}`} /> {item}
                                </li>
                              ))}
                           </ul>
                         </div>
                      </div>
                      {/* --- HOVER REVEAL LOGIC END --- */}
                   </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 bg-secondary dark:bg-slate-900 text-foreground dark:text-white">
        <div className="container mx-auto max-w-6xl text-center">
          <motion.h2 initial="hidden" whileInView="visible" variants={fadeInUp} viewport={{ once: true }} className="text-3xl sm:text-5xl font-bold mb-16">
            How <span className="text-primary">CrowdPay</span> Works
          </motion.h2>
          
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }} viewport={{ once: true }} className="group">
                <div className={`w-20 h-20 rounded-2xl bg-${item.color}/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                  {item.isBitcoin ? <img src={bitcoinLogo} className="w-10 h-10" /> : <item.icon className={`w-10 h-10 text-${item.color}`} />}
                </div>
                <div className={`text-${item.color} font-bold text-sm mb-2`}>STEP {item.step}</div>
                <h4 className="text-2xl font-bold mb-2">{item.title}</h4>
                <p className="text-muted-foreground mb-2">{item.shortDesc}</p>
                <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-300 opacity-0 group-hover:opacity-100">
                  <p className="text-sm text-muted-foreground overflow-hidden">{item.fullDesc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose & Payment Methods Combined Grid */}
      <section className="py-16 sm:py-24 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          {/* Benefits */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4">Why <span className="text-primary">CrowdPay</span>?</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {BENEFITS.map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
                <Card className="p-6 text-center h-full hover:border-primary/50 transition-colors group">
                  <item.icon className={`w-8 h-8 text-${item.color} mx-auto mb-3`} />
                  <h3 className="font-bold mb-1 group-hover:text-primary">{item.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{item.shortDesc}</p>
                  <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-300 opacity-0 group-hover:opacity-100">
                     <p className="text-xs text-muted-foreground/80 overflow-hidden">{item.fullDesc}</p>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Payment Methods (HOVER REVEAL ADDED) */}
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold">Accept <span className="text-primary">Multiple</span> Payments</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="p-8 border-bitcoin/30 bg-bitcoin/5 hover:border-bitcoin/50 transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <img src={bitcoinLogo} alt="Bitcoin" className="w-12 h-12" />
                <h3 className="text-2xl font-bold">Pay with Bitcoin</h3>
              </div>
              
              {/* --- HOVER REVEAL LOGIC START --- */}
              <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-in-out opacity-0 group-hover:opacity-100">
                <ul className="space-y-2 text-muted-foreground overflow-hidden pt-2">
                  <li className="flex gap-2 items-center"><Zap className="w-4 h-4 text-bitcoin" /> Lightning Network</li>
                  <li className="flex gap-2 items-center"><Lock className="w-4 h-4 text-bitcoin" /> On-chain & Global</li>
                  <li className="flex gap-2 items-center"><Globe className="w-4 h-4 text-bitcoin" /> Borderless Payments</li>
                </ul>
              </div>
               {/* --- HOVER REVEAL LOGIC END --- */}
            </Card>

            <Card className="p-8 border-mpesa/30 bg-mpesa/5 hover:border-mpesa/50 transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <img src={mpesaLogo} alt="M-Pesa" className="w-12 h-12 rounded object-contain" />
                <h3 className="text-2xl font-bold">Pay with M-Pesa</h3>
              </div>

               {/* --- HOVER REVEAL LOGIC START --- */}
              <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-500 ease-in-out opacity-0 group-hover:opacity-100">
                <ul className="space-y-2 text-muted-foreground overflow-hidden pt-2">
                  <li className="flex gap-2 items-center"><ArrowRight className="w-4 h-4 text-mpesa" /> Instant KES to BTC conversion</li>
                  <li className="flex gap-2 items-center"><Shield className="w-4 h-4 text-mpesa" /> Familiar local experience</li>
                  <li className="flex gap-2 items-center"><Users className="w-4 h-4 text-mpesa" /> No wallet needed for donors</li>
                </ul>
              </div>
              {/* --- HOVER REVEAL LOGIC END --- */}
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary to-orange-600 text-white text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Start Accepting Bitcoin?</h2>
          <div className="flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={() => navigate("/signup")} className="text-lg px-8">Create Your Link</Button>
            <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-white text-white hover:bg-white/10">Learn More</Button>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-secondary dark:bg-slate-900 text-foreground dark:text-white">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center">
              <img src={logo} alt="CrowdPay" className="w-6 h-6" />
            </div>
            <span className="font-bold text-2xl">CrowdPay</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            {["Browse Events", "Features", "How it Works"].map(item => (
              <a key={item} href="#" className="hover:text-foreground transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex gap-4">
            <a href="https://x.com/crowdpay_ke" target="_blank" rel="noopener noreferrer">
              <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground"><Twitter className="w-5 h-5" /></Button>
            </a>
            <a href="https://www.instagram.com/crowd.pay" target="_blank" rel="noopener noreferrer">
              <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground"><Instagram className="w-5 h-5" /></Button>
            </a>
            <a href="mailto:crowdpay2026@gmail.com" target="_blank" rel="noopener noreferrer">
              <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground"><Mail className="w-5 h-5" /></Button>
            </a>
          </div>
        </div>
        <div className="text-center mt-8 text-muted-foreground text-sm">
          © {new Date().getFullYear()} CrowdPay. Bitcoin-powered crowdfunding.
        </div>
      </footer>
    </>
  );
};

export default Landing;