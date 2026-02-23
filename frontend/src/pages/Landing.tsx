import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Store, Users, Shield, Globe, Lock, ArrowRight, ChevronRight, Share2, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Footer from "@/components/Footer";

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

// ── Stacked Card Carousel for Benefits (“Why CrowdPay”) ──
const BENEFIT_COLORS: Record<string, { bg: string; accent: string; dot: string }> = {
  "yellow-500": { bg: "bg-[#2e2a10]", accent: "text-yellow-400", dot: "bg-yellow-400" },
  "blue-500": { bg: "bg-[#0f1e3a]", accent: "text-blue-400", dot: "bg-blue-400" },
  "green-500": { bg: "bg-[#0e2a1a]", accent: "text-green-400", dot: "bg-green-400" },
  primary: { bg: "bg-[#2a1f3a]", accent: "text-primary", dot: "bg-primary" },
};

const BenefitsCarousel = () => {
  const [active, setActive] = useState(0);
  const advance = () => setActive((prev) => (prev + 1) % BENEFITS.length);

  const getCardProps = (index: number) => {
    const total = BENEFITS.length;
    const offset = ((index - active + total) % total);
    if (offset === 0) return { x: "0%", scale: 1, zIndex: 30, opacity: 1 };
    if (offset === 1) return { x: "42%", scale: 0.88, zIndex: 20, opacity: 0.85 };
    if (offset === 2) return { x: "-42%", scale: 0.88, zIndex: 20, opacity: 0.85 };
    return { x: "0%", scale: 0.76, zIndex: 10, opacity: 0 };
  };

  return (
    <section className="py-20 sm:py-28 px-4 bg-[#080b10]">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial="hidden" whileInView="visible" variants={fadeInUp} viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 text-white">
            Why <span className="text-primary">CrowdPay</span>?
          </h2>
          <p className="text-white/50 text-lg">Built for speed, privacy, and global reach</p>
        </motion.div>

        <div
          className="relative h-[340px] flex items-center justify-center cursor-pointer select-none"
          onClick={advance}
        >
          {BENEFITS.map((item, i) => {
            const { x, scale, zIndex, opacity } = getCardProps(i);
            const colors = BENEFIT_COLORS[item.color] ?? BENEFIT_COLORS["primary"];
            const isActive = ((i - active + BENEFITS.length) % BENEFITS.length) === 0;
            return (
              <motion.div
                key={i}
                animate={{ x, scale, opacity, zIndex }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                className={`absolute w-full max-w-sm rounded-3xl p-8 ${colors.bg} border border-white/10 shadow-2xl`}
                style={{ zIndex }}
              >
                <div className={`w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-5`}>
                  <item.icon className={`w-6 h-6 ${colors.accent}`} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                {isActive ? (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-white/60 text-sm leading-relaxed">{item.fullDesc}</p>
                      <span className={`inline-block mt-4 text-xs font-semibold px-3 py-1 rounded-full border ${colors.accent} border-white/20 bg-white/5`}>
                        {item.shortDesc}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <p className="text-white/40 text-sm">{item.shortDesc}</p>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="flex justify-center gap-2 mt-10">
          {BENEFITS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`rounded-full transition-all ${i === active ? "bg-white w-6 h-2" : "bg-white/30 w-2 h-2"}`}
            />
          ))}
        </div>
        <p className="text-center text-white/30 text-xs mt-4">Click to explore</p>
      </div>
    </section>
  );
};

// ── Stacked Card Carousel for Modes ──
const CARD_COLORS: Record<string, { bg: string; accent: string; dot: string }> = {
  primary: { bg: "bg-[#2a2f4a]", accent: "text-primary", dot: "bg-primary" },
  mpesa: { bg: "bg-[#1a3a2a]", accent: "text-mpesa", dot: "bg-mpesa" },
  "purple-500": { bg: "bg-[#2e1a3a]", accent: "text-purple-400", dot: "bg-purple-400" },
};

const ModeCarousel = () => {
  const [active, setActive] = useState(1); // start at center

  const advance = () => setActive((prev) => (prev + 1) % MODES.length);

  // position offsets for the 3 cards relative to active
  const getCardProps = (index: number) => {
    const total = MODES.length;
    const offset = ((index - active + total) % total);
    // offset 0 = center/front, 1 = right-back, 2 = left-back
    if (offset === 0) return { x: "0%", scale: 1, zIndex: 20, opacity: 1, brightness: "brightness-100" };
    if (offset === 1) return { x: "38%", scale: 0.88, zIndex: 10, opacity: 0.85, brightness: "brightness-75" };
    return { x: "-38%", scale: 0.88, zIndex: 10, opacity: 0.85, brightness: "brightness-75" };
  };

  return (
    <section id="features" className="py-20 sm:py-28 px-4 bg-[#0f1117]">
      <div className="container mx-auto max-w-5xl">
        <motion.div
          initial="hidden" whileInView="visible" variants={fadeInUp} viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 text-white">
            Three Modes, <span className="text-primary">Endless Possibilities</span>
          </h2>
          <p className="text-white/50 text-lg">Choose the perfect mode for your needs</p>
        </motion.div>

        {/* Card stack */}
        <div
          className="relative h-[380px] flex items-center justify-center cursor-pointer select-none"
          onClick={advance}
        >
          {MODES.map((mode, i) => {
            const { x, scale, zIndex, opacity } = getCardProps(i);
            const colors = CARD_COLORS[mode.color] ?? CARD_COLORS["primary"];
            const isActive = ((i - active + MODES.length) % MODES.length) === 0;
            return (
              <motion.div
                key={i}
                animate={{ x, scale, opacity, zIndex }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                className={`absolute w-full max-w-sm rounded-3xl p-8 ${colors.bg} border border-white/10 shadow-2xl`}
                style={{ zIndex }}
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl ${colors.bg} border border-white/20 flex items-center justify-center mb-6`}>
                  <mode.icon className={`w-6 h-6 ${colors.accent}`} />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">{mode.title}</h3>

                {isActive ? (
                  <AnimatePresence>
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <p className="text-white/60 text-sm leading-relaxed mb-5">{mode.fullDesc}</p>
                      <ul className="space-y-2">
                        {mode.items.map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm text-white/70">
                            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <p className="text-white/40 text-sm">{mode.shortDesc}</p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-10">
          {MODES.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`rounded-full transition-all ${i === active ? "bg-white w-6 h-2" : "bg-white/30 w-2 h-2"}`}
            />
          ))}
        </div>
        <p className="text-center text-white/30 text-xs mt-4">Click to explore next</p>
      </div>
    </section>
  );
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
        <title>CrowdPay - Hybrid Bitcoin & M-Pesa Events Fundraising Platform</title>
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

        {/* Top left description removed for main hero use */}

        {/* Navbar – MissFit style */}
        <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
          <div className="container mx-auto flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <img src={logo} alt="CrowdPay" className="h-7 w-7" />
              <span className="font-bold text-lg text-white">CrowdPay</span>
            </div>

            {/* Centered pill nav */}
            <div className="hidden md:flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-2 py-1.5">
              {[
                { label: "Features", href: "#features" },
                { label: "How it Works", href: "#how-it-works" },
                { label: "Explore", href: "/explore" },
                { label: "Contact", href: "#footer" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={item.href === "#footer" ? (e) => {
                    e.preventDefault();
                    document.getElementById('footer')?.scrollIntoView({ behavior: 'smooth' });
                  } : undefined}
                  className="text-sm text-white/80 hover:text-white hover:bg-white/10 transition-all px-4 py-1.5 rounded-full"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              <Button
                onClick={toggleTheme}
                variant="ghost"
                size="icon"
                className="text-white/70 hover:text-white hover:bg-white/10 rounded-full"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                onClick={() => navigate("/signin")}
                className="rounded-full bg-white text-black hover:bg-white/90 font-semibold text-sm px-5 py-2 h-auto"
              >
                Sign In
              </Button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 pt-20">
          <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center">
            <motion.h1
              className="text-6xl md:text-8xl font-bold text-white mb-6 md:mb-8 tracking-tight"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              {slide.title}
            </motion.h1>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="font-bold text-white text-2xl sm:text-2xl md:text-4xl mb-10 drop-shadow-lg space-y-4"
            >
              An <span className="text-primary">events creation</span> platform leveraging <span className="text-green-500 font-extrabold">M-Pesa</span> and <span className="text-orange-400 font-extrabold">Bitcoin/Lightning Network</span>
              <span className="block text-lg sm:text-xl font-semibold text-white/80 mt-4">enabling fundraising with global payment options.</span>
            </motion.p>
            <div className="flex justify-center gap-4">
              <Button size="lg" onClick={() => navigate("/signup")} className="rounded-full bg-primary/90 hover:bg-primary text-lg px-8 py-6">
                <Zap className="mr-2 h-5 w-5" /> Get Started
                <ChevronRight className="ml-2 h-5 w-5" />
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

      {/* Three Modes – Stacked Card Carousel */}
      <ModeCarousel />

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

      {/* Why CrowdPay & Payment Methods */}
      <BenefitsCarousel />

      {/* CTA */}
      <motion.section className="py-24 px-4 bg-gradient-to-br from-primary to-orange-600 text-white text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 md:mb-8">Ready to Start Accepting Bitcoin?</h2>
          <motion.div className="flex justify-center gap-4">
            <Button size="lg" variant="secondary" onClick={() => navigate("/signup")} className="rounded-full text-md md:text-xl px-6 md:px-10 py-4 md:py-6">
              Create Your Link
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="rounded-full text-md md:text-xl px-8 py-4 md:py-6 bg-transparent border-white text-white hover:bg-white/10">Learn More</Button>
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <Footer />
    </>
  );
};

export default Landing;