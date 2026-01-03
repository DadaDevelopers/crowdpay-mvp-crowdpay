import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Zap, Store, Users, Shield, Smartphone, Globe, Lock, ArrowRight, Share2, ChevronRight, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import heroBg1 from "@/assets/hero-bg.jpg";
import heroBg2 from "@/assets/hero-bg-2.jpg";
import heroBg3 from "@/assets/hero-bg-3.jpg";
import heroBg4 from "@/assets/hero-bg-4.jpg";
import logo from "@/assets/logo.png";
import mpesaLogo from "@/assets/mpesa-logo.png";
import bitcoinLogo from "@/assets/bitcoin-logo.png";

const heroSlides = [
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

const Landing = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % heroSlides.length);
  }, [currentSlide, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + heroSlides.length) % heroSlides.length);
  }, [currentSlide, goToSlide]);

  useEffect(() => {
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [nextSlide]);

  const slide = heroSlides[currentSlide];

  return (
    <>
      <Helmet>
        <title>CrowdPay - Hybrid Bitcoin & M-Pesa Fundraising Platform</title>
        <meta name="description" content="Accept contributions in Bitcoin and M-Pesa. Create payment links, accept Bitcoin or M-Pesa, receive BTC instantly." />
      </Helmet>

      {/* Hero Section - Mobile Optimized */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {heroSlides.map((s, index) => (
          <motion.div
            key={index}
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ 
              opacity: index === currentSlide ? 1 : 0,
              scale: index === currentSlide ? 1 : 1.1
            }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{
              backgroundImage: `url(${s.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />
        
        {/* Navigation - Mobile Responsive */}
        <motion.nav 
          className="relative z-10 px-4 sm:px-6 py-4 sm:py-6"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="container mx-auto flex items-center justify-between">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img src={logo} alt="CrowdPay" className="h-8 w-8 sm:h-10 sm:w-10" />
              <span className="font-bold text-xl sm:text-2xl text-white">CrowdPay</span>
            </motion.div>
            <div className="hidden md:flex items-center gap-8">
              {["Features", "How it Works", "Browse Events"].map((item, i) => (
                <motion.a
                  key={item}
                  href={item === "Browse Events" ? "/explore" : `#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="text-sm text-white/80 hover:text-white transition-colors relative"
                  whileHover={{ scale: 1.1 }}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  {item}
                  <motion.div 
                    className="absolute -bottom-1 left-0 h-0.5 bg-primary"
                    initial={{ width: 0 }}
                    whileHover={{ width: "100%" }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.a>
              ))}
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => navigate("/auth")} 
                variant="secondary" 
                size="sm"
                className="bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm px-3 sm:px-4"
              >
                Sign In
              </Button>
            </motion.div>
          </div>
        </motion.nav>

        {/* Carousel Arrows - Hidden on mobile */}
        <motion.button
          onClick={prevSlide}
          className="hidden sm:flex absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 items-center justify-center text-white"
          whileHover={{ scale: 1.2, backgroundColor: "rgba(0,0,0,0.6)" }}
          whileTap={{ scale: 0.9 }}
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </motion.button>
        <motion.button
          onClick={nextSlide}
          className="hidden sm:flex absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 items-center justify-center text-white"
          whileHover={{ scale: 1.2, backgroundColor: "rgba(0,0,0,0.6)" }}
          whileTap={{ scale: 0.9 }}
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </motion.button>

        {/* Hero Content - Mobile Optimized */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-0">
          <div className="text-center max-w-4xl mx-auto w-full">
            <motion.h1 
              key={`title-${currentSlide}`}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white mb-4 sm:mb-6 tracking-tight leading-tight"
              initial={{ y: 50, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {slide.title}
            </motion.h1>
            
            <motion.h2 
              key={`subtitle-${currentSlide}`}
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-4 sm:mb-6 overflow-hidden px-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <motion.span
                className="inline-block"
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {slide.subtitle.split(' ').slice(0, Math.ceil(slide.subtitle.split(' ').length / 2)).join(' ')}
              </motion.span>{' '}
              <motion.span
                className="inline-block"
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {slide.subtitle.split(' ').slice(Math.ceil(slide.subtitle.split(' ').length / 2)).join(' ')}
              </motion.span>
            </motion.h2>
            
            <motion.p 
              key={`highlights-${currentSlide}`}
              className="text-base sm:text-lg md:text-xl text-white/90 mb-3 sm:mb-4 max-w-2xl mx-auto px-2"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              The first platform to unify{" "}
              <motion.span 
                className={`${slide.highlight1.color} font-semibold`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
              >
                {slide.highlight1.text}
              </motion.span>{" "}
              with{" "}
              <motion.span 
                className={`${slide.highlight2.color} font-semibold`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.6 }}
              >
                {slide.highlight2.text}
              </motion.span>
            </motion.p>
            
            <motion.p 
              key={`desc-${currentSlide}`}
              className="text-sm sm:text-base text-white/70 mb-6 sm:mb-10 px-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              {slide.description}
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth")}
                  className="w-full sm:w-auto bg-primary/90 hover:bg-primary text-primary-foreground backdrop-blur-sm px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg group"
                >
                  <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:text-yellow-400 transition-colors" />
                  Get Started
                  <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Indicators - Mobile Optimized */}
        <div className="relative z-10 pb-6 sm:pb-8 flex justify-center gap-2 sm:gap-3">
          {heroSlides.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 sm:h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? "bg-white" : "bg-white/40"
              }`}
              animate={{ width: index === currentSlide ? 24 : 8 }}
              whileHover={{ scale: 1.3 }}
              whileTap={{ scale: 0.9 }}
            />
          ))}
        </div>
      </section>

      {/* Three Modes Section - Compact Cards with Hover Details */}
      <section id="features" className="py-16 sm:py-24 px-4 bg-background overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.h2 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            >
              Three Modes,{" "}
              <span className="text-primary">Endless Possibilities</span>
            </motion.h2>
            <motion.p 
              className="text-muted-foreground text-base sm:text-lg"
              variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            >
              Choose the perfect mode for your needs
            </motion.p>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { 
                icon: Store, 
                title: "Merchant Mode", 
                color: "primary", 
                shortDesc: "Split bills and share costs instantly.",
                fullDesc: "Perfect for restaurants, events, and group expenses. Track shared costs in real-time with QR-code payments.",
                items: ["Live bill progress", "Split with clarity", "QR-code payments"],
                direction: "left" 
              },
              { 
                icon: Users, 
                title: "Event Mode", 
                color: "mpesa", 
                shortDesc: "Organize gatherings and manage contributions.",
                fullDesc: "Manage events, picnics, and social gatherings. Create invitation cards, track contributions, and generate tickets.",
                items: ["Invitation cards", "Item checklists", "Ticket generation"],
                direction: "up" 
              },
              { 
                icon: Shield, 
                title: "Activism Mode", 
                color: "purple-500", 
                shortDesc: "Private fundraising for causes and movements.",
                fullDesc: "Secure fundraising for causes and movements. Anonymous donations with wallet verification for privacy.",
                items: ["Anonymous donations", "Wallet verification", "Privacy-focused"],
                direction: "right" 
              },
            ].map((mode, i) => (
              <motion.div
                key={mode.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`h-full ${i === 1 ? "lg:-translate-y-4" : ""}`}
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -8 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="p-6 sm:p-8 h-full border-border/50 bg-card/80 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                    {/* Animated background on hover */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    
                    <div className="relative z-10">
                      <motion.div 
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-${mode.color}/10 flex items-center justify-center mb-4 sm:mb-6`}
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <mode.icon className={`w-6 h-6 sm:w-7 sm:h-7 text-${mode.color}`} />
                      </motion.div>
                      
                      <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 group-hover:text-primary transition-colors">
                        {mode.title}
                      </h3>
                      
                      {/* Short description - always visible */}
                      <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
                        {mode.shortDesc}
                      </p>
                      
                      {/* Full description - shown on hover */}
                      <AnimatePresence>
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          whileHover={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <p className="text-sm text-muted-foreground mb-4">
                            {mode.fullDesc}
                          </p>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            {mode.items.map((item, j) => (
                              <motion.li 
                                key={item}
                                className="flex items-center gap-2"
                                initial={{ x: -10, opacity: 0 }}
                                whileHover={{ x: 0, opacity: 1 }}
                                transition={{ delay: j * 0.05 }}
                              >
                                <motion.div 
                                  className={`w-1.5 h-1.5 rounded-full bg-${mode.color}`}
                                  whileHover={{ scale: 1.5 }}
                                />
                                {item}
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section - Compact */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 bg-slate-900 text-white overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <motion.h2 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4"
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              How <span className="text-primary">CrowdPay</span> Works
            </motion.h2>
            <motion.p 
              className="text-gray-400 text-base sm:text-lg"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Start accepting Bitcoin in minutes
            </motion.p>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              { step: "01", title: "Create Link", shortDesc: "Set up in 60 seconds", fullDesc: "Set up a custom payment page in 60 seconds. Add your story, set a goal, and choose how you receive Bitcoin.", color: "primary", icon: ArrowRight },
              { step: "02", title: "Share Everywhere", shortDesc: "Get a short link", fullDesc: "Get a short link like crowdpay.me/yourname. Share it on WhatsApp, Instagram, Twitter, or anywhere.", color: "mpesa", icon: Share2 },
              { step: "03", title: "Receive Bitcoin", shortDesc: "Get paid instantly", fullDesc: "Accept Bitcoin via QR code and M-Pesa from supporters - converted to BTC and sent to your wallet instantly.", color: "bitcoin", useBitcoinLogo: true },
            ].map((item, i) => (
              <motion.div 
                key={item.step}
                className="text-center group"
                initial={{ y: 100, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6, type: "spring" }}
              >
                <motion.div 
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-${item.color}/20 flex items-center justify-center mx-auto mb-4 sm:mb-6`}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {item.useBitcoinLogo ? (
                    <img src={bitcoinLogo} alt="Bitcoin" className="w-8 h-8 sm:w-10 sm:h-10" />
                  ) : (
                    item.icon && <item.icon className={`w-8 h-8 sm:w-10 sm:h-10 text-${item.color}`} />
                  )}
                </motion.div>
                <div 
                  className={`text-${item.color} font-bold text-xs sm:text-sm mb-2`}
                >
                  STEP {item.step}
                </div>
                <h4 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">{item.title}</h4>
                <p className="text-sm sm:text-base text-gray-400 mb-2">{item.shortDesc}</p>
                <motion.p 
                  className="text-xs sm:text-sm text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  {item.fullDesc}
                </motion.p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose CrowdPay - Compact Cards with Hover */}
      <section className="py-16 sm:py-24 px-4 bg-background overflow-hidden">
        <div className="container mx-auto max-w-6xl">
          <motion.div className="text-center mb-12 sm:mb-16">
            <motion.h2 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              Why Choose <span className="text-primary">CrowdPay</span>?
            </motion.h2>
            <motion.p 
              className="text-muted-foreground text-base sm:text-lg"
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Built for the modern creator
            </motion.p>
          </motion.div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Zap, title: "Lightning Fast", shortDesc: "Instant payments", fullDesc: "Receive Bitcoin in seconds via Lightning Network", color: "yellow-500" },
              { icon: Globe, title: "Global Reach", shortDesc: "Accept worldwide", fullDesc: "Accept payments from anywhere in the world", color: "blue-500" },
              { icon: Lock, title: "Secure & Private", shortDesc: "Your keys", fullDesc: "Your wallet. Your keys. Your Bitcoin.", color: "green-500" },
              { icon: ArrowRight, title: "Real-time Rates", shortDesc: "Live conversion", fullDesc: "KES-to-BTC conversion happens instantly at market rates", color: "primary" },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ y: 50, opacity: 0, scale: 0.9 }}
                whileInView={{ y: 0, opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <motion.div
                  whileHover={{ y: -8, scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Card className="p-4 sm:p-6 text-center border-border/50 bg-card/80 hover:border-primary/50 hover:shadow-xl transition-all duration-300 group cursor-pointer h-full relative overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    <div className="relative z-10">
                      <motion.div 
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-${item.color}/10 flex items-center justify-center mx-auto mb-3 sm:mb-4`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <item.icon className={`w-6 h-6 sm:w-7 sm:h-7 text-${item.color}`} />
                      </motion.div>
                      <h3 className="font-bold mb-1 sm:mb-2 text-sm sm:text-lg group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                        {item.shortDesc}
                      </p>
                      <motion.p 
                        className="text-xs text-muted-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      >
                        {item.fullDesc}
                      </motion.p>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods - Compact */}
      <section className="py-16 sm:py-24 px-4 bg-muted/30 overflow-hidden">
        <div className="container mx-auto max-w-5xl">
          <motion.div className="text-center mb-12 sm:mb-16">
            <motion.h2 
              className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              Accept <span className="text-primary">Multiple</span> Payment Methods
            </motion.h2>
            <motion.p 
              className="text-muted-foreground text-base sm:text-lg"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              Your supporters pay however they want
            </motion.p>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
            <motion.div
              initial={{ x: -100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <motion.div whileHover={{ scale: 1.02, x: 10 }} transition={{ type: "spring" }}>
                <Card className="p-6 sm:p-10 h-full border-2 border-bitcoin/30 bg-gradient-to-br from-bitcoin/5 to-transparent hover:border-bitcoin/50 transition-colors group">
                  <motion.div 
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-bitcoin/10 flex items-center justify-center mb-4 sm:mb-6"
                    whileHover={{ rotate: 15, scale: 1.1 }}
                  >
                    <img src={bitcoinLogo} alt="Bitcoin" className="w-7 h-7 sm:w-9 sm:h-9" />
                  </motion.div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 group-hover:text-bitcoin transition-colors">
                    Pay with Bitcoin
                  </h3>
                  <ul className="space-y-2 sm:space-y-4 text-sm sm:text-base text-muted-foreground">
                    {[
                      { icon: Zap, text: "Lightning Network", hoverText: "Lightning Network for instant settlements" },
                      { icon: Lock, text: "On-chain", hoverText: "On-chain for larger amounts" },
                      { icon: Globe, text: "Global payments", hoverText: "Global, borderless payments" },
                    ].map((item, i) => (
                      <motion.li 
                        key={item.text}
                        className="flex items-center gap-2 sm:gap-3 group/item"
                        initial={{ x: -30, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                      >
                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-bitcoin shrink-0" />
                        <span className="group-hover/item:text-bitcoin transition-colors">
                          {item.text}
                        </span>
                        <motion.span
                          className="text-xs text-muted-foreground/60 opacity-0 group-hover/item:opacity-100 transition-opacity ml-2"
                        >
                          {item.hoverText}
                        </motion.span>
                      </motion.li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            </motion.div>
            
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <motion.div whileHover={{ scale: 1.02, x: -10 }} transition={{ type: "spring" }}>
                <Card className="p-6 sm:p-10 h-full border-2 border-mpesa/30 bg-gradient-to-br from-mpesa/5 to-transparent hover:border-mpesa/50 transition-colors group">
                  <motion.div 
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-mpesa/10 flex items-center justify-center mb-4 sm:mb-6"
                    whileHover={{ rotate: -15, scale: 1.1 }}
                  >
                    <img src={mpesaLogo} alt="M-Pesa" className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg object-cover p-0.5" />
                  </motion.div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 group-hover:text-mpesa transition-colors">
                    Pay with M-Pesa
                  </h3>
                  <ul className="space-y-2 sm:space-y-4 text-sm sm:text-base text-muted-foreground">
                    {[
                      { icon: ArrowRight, text: "Instant conversion", hoverText: "Instant KES to BTC conversion via Minmo" },
                      { icon: Users, text: "Familiar experience", hoverText: "Familiar M-Pesa experience for local supporters" },
                      { icon: Shield, text: "Local support", hoverText: "Perfect for local supporters in Kenya" },
                    ].map((item, i) => (
                      <motion.li 
                        key={item.text}
                        className="flex items-center gap-2 sm:gap-3 group/item"
                        initial={{ x: 30, opacity: 0 }}
                        whileInView={{ x: 0, opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + i * 0.1 }}
                      >
                        <item.icon className="w-4 h-4 sm:w-5 sm:h-5 text-mpesa shrink-0" />
                        <span className="group-hover/item:text-mpesa transition-colors">
                          {item.text}
                        </span>
                        <motion.span
                          className="text-xs text-muted-foreground/60 opacity-0 group-hover/item:opacity-100 transition-opacity ml-2"
                        >
                          {item.hoverText}
                        </motion.span>
                      </motion.li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section 
        className="py-16 sm:py-24 px-4 bg-gradient-to-br from-primary via-primary to-orange-600 text-primary-foreground overflow-hidden"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h2 
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6"
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 100 }}
          >
            Ready to Start Accepting Bitcoin?
          </motion.h2>
          <motion.p 
            className="text-lg sm:text-xl mb-8 sm:mb-10 opacity-90"
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Join thousands of creators already using CrowdPay
          </motion.p>
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <motion.div whileHover={{ scale: 1.1, x: -10 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" variant="secondary" onClick={() => navigate("/auth")} className="px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg w-full sm:w-auto">
                Create Your Link
                <ChevronRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.1, x: 10 }} whileTap={{ scale: 0.95 }}>
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg w-full sm:w-auto">
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="py-12 sm:py-16 px-4 bg-slate-900 text-white">
        <div className="container mx-auto max-w-6xl">
          <motion.div 
            className="flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8"
            initial={{ y: 50, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
          >
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <img src={logo} alt="CrowdPay" className="w-6 h-6" />
              </div>
              <span className="font-bold text-xl sm:text-2xl">CrowdPay</span>
            </motion.div>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
              {["Browse Events", "Features", "How it Works"].map((item, i) => (
                <motion.a
                  key={item}
                  href={item === "Browse Events" ? "/explore" : `#${item.toLowerCase().replace(/ /g, '-')}`}
                  className="text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
                  whileHover={{ scale: 1.1, y: -2 }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  {item}
                </motion.a>
              ))}
            </div>
            <div className="flex items-center gap-3 sm:gap-4">
              {[0, 1].map((i) => (
                <motion.div key={i} whileHover={{ scale: 1.2, rotate: 10 }} whileTap={{ scale: 0.9 }}>
                  <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white h-9 w-9 sm:h-10 sm:w-10">
                    {i === 0 ? (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                    ) : (
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                    )}
                  </Button>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div 
            className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-gray-800 text-center text-gray-500 text-xs sm:text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            © 2026 CrowdPay. Bitcoin-powered crowdfunding platform.
          </motion.div>
        </div>
      </footer>
    </>
  );
};

export default Landing;