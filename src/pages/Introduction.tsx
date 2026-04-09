import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Fish, Droplets, BarChart3, Stethoscope, ShoppingCart, Briefcase, Bot,
  Landmark, BookOpen, Calculator, Cloud, Bell, Users, TrendingUp,
  ArrowRight, ChevronDown, Waves, Leaf, Shield, Globe, Smartphone,
  MessageCircle, FileText, MapPin, Thermometer
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
};

const AnimatedSection = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const features = [
  {
    icon: BarChart3, title: "Live Shrimp Prices",
    desc: "Real-time market rates from Bhimavaram and across India. Track price trends, set alerts, and export data.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Stethoscope, title: "AI Disease Predictor",
    desc: "Upload symptoms or images. AI diagnoses diseases with treatment plans in Telugu, Hindi, Tamil & more.",
    color: "from-red-500 to-pink-500"
  },
  {
    icon: Cloud, title: "Weather Forecasts",
    desc: "Location-based weather forecasts for pond management. Get alerts for dangerous conditions.",
    color: "from-sky-500 to-indigo-500"
  },
  {
    icon: Fish, title: "Sell Your Crop",
    desc: "Submit sell requests directly to buyers. Track your trade status and get the best prices.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Landmark, title: "Bank Loans",
    desc: "Apply for aquaculture loans from partner banks. EMI calculator, KYC upload, and status tracking.",
    color: "from-amber-500 to-yellow-500"
  },
  {
    icon: Briefcase, title: "Jobs Portal",
    desc: "Find aquaculture jobs or post openings. Create profiles, apply, chat, and download resumes as PDF.",
    color: "from-purple-500 to-violet-500"
  },
  {
    icon: Bot, title: "AI Agents",
    desc: "7 autonomous agents for water quality, feed optimization, disease monitoring, and market analysis.",
    color: "from-teal-500 to-cyan-500"
  },
  {
    icon: ShoppingCart, title: "Aqua Store",
    desc: "Buy medicines, equipment, and feed products. Track orders, request refunds, and get delivery updates.",
    color: "from-orange-500 to-red-500"
  },
  {
    icon: BookOpen, title: "Aquapedia",
    desc: "Disease library, crop manuals, and aquaculture magazines. Bookmark content for offline reading.",
    color: "from-lime-500 to-green-500"
  },
  {
    icon: Calculator, title: "Smart Calculators",
    desc: "Feed, aeration, molarity, and power factor calculators built specifically for aqua farmers.",
    color: "from-fuchsia-500 to-pink-500"
  },
  {
    icon: MapPin, title: "Hatchery Map",
    desc: "Find shrimp and fish hatcheries near you with interactive maps, contact details, and directions.",
    color: "from-rose-500 to-red-500"
  },
  {
    icon: Users, title: "Community Q&A",
    desc: "Ask questions, share knowledge, and connect with fellow farmers. Handshake and save features.",
    color: "from-indigo-500 to-blue-500"
  },
  {
    icon: FileText, title: "Profit/Loss Ledger",
    desc: "Track expenses and revenue per crop cycle. Visual charts help you understand your farm's profitability.",
    color: "from-slate-500 to-gray-500"
  },
  {
    icon: Bell, title: "Smart Notifications",
    desc: "Price alerts, trade updates, weather warnings, and loan status — via email, SMS, and push notifications.",
    color: "from-yellow-500 to-orange-500"
  },
  {
    icon: Globe, title: "Multi-Language Support",
    desc: "Disease results and voice readout in Telugu, Hindi, Tamil, Kannada, Bengali, and more.",
    color: "from-cyan-500 to-blue-500"
  },
  {
    icon: Shield, title: "Admin Dashboard",
    desc: "Admins manage prices, products, doctors, hatcheries, jobs, loans, and daily updates from one place.",
    color: "from-gray-600 to-slate-600"
  },
];

const Introduction = () => {
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-teal-900">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/5"
              style={{
                width: Math.random() * 100 + 20,
                height: Math.random() * 100 + 20,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.1, 0.3, 0.1],
              }}
              transition={{
                duration: Math.random() * 4 + 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
          {/* Animated wave at bottom */}
          <svg className="absolute bottom-0 left-0 w-full" viewBox="0 0 1440 200" fill="none">
            <motion.path
              d="M0,120 C360,200 720,40 1080,120 C1260,160 1380,100 1440,120 L1440,200 L0,200 Z"
              fill="hsl(var(--background))"
              animate={{ d: [
                "M0,120 C360,200 720,40 1080,120 C1260,160 1380,100 1440,120 L1440,200 L0,200 Z",
                "M0,140 C360,60 720,180 1080,100 C1260,60 1380,140 1440,100 L1440,200 L0,200 Z",
                "M0,120 C360,200 720,40 1080,120 C1260,160 1380,100 1440,120 L1440,200 L0,200 Z",
              ]}}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </div>

        {/* Floating fish animations */}
        <motion.div
          className="absolute left-[5%] top-[30%]"
          animate={{ x: [0, 60, 0], y: [0, -20, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          <Fish className="h-16 w-16 text-cyan-300/30" />
        </motion.div>
        <motion.div
          className="absolute right-[10%] top-[20%]"
          animate={{ x: [0, -40, 0], y: [0, 15, 0] }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
        >
          <Fish className="h-12 w-12 text-teal-300/20 -scale-x-100" />
        </motion.div>
        <motion.div
          className="absolute left-[15%] bottom-[25%]"
          animate={{ x: [0, 50, 0], y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: 2 }}
        >
          <Droplets className="h-10 w-10 text-blue-300/20" />
        </motion.div>

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 mb-6">
              <Waves className="h-6 w-6 text-cyan-400" />
              <span className="text-cyan-200 font-medium">Welcome to the Future of Aquaculture</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight"
          >
            GANGAPUTRA
            <span className="block text-3xl md:text-4xl font-normal text-cyan-300 mt-2">
              గంగాపుత్ర
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg md:text-xl text-blue-100/80 max-w-2xl mx-auto mb-8"
          >
            India's most comprehensive aquaculture management platform. 
            AI-powered disease prediction, live market prices, bank loans, 
            job portal, and smart farming tools — all in one app.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-lg px-8 py-6 rounded-xl shadow-lg shadow-cyan-500/25"
            >
              Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-6 rounded-xl"
            >
              Login
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-12"
          >
            <ChevronDown className="h-8 w-8 text-white/40 mx-auto animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <AnimatedSection className="py-12 bg-muted/50">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Active Farmers", value: "5,000+", icon: Users },
            { label: "AI Diagnoses", value: "25,000+", icon: Stethoscope },
            { label: "Market Locations", value: "50+", icon: TrendingUp },
            { label: "Partner Banks", value: "4+", icon: Landmark },
          ].map((stat, i) => (
            <motion.div key={i} variants={fadeUp} className="text-center">
              <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* How It Works */}
      <AnimatedSection className="py-16 px-4 max-w-6xl mx-auto">
        <motion.div variants={fadeUp} className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">How GANGAPUTRA Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">From pond to profit — here's how our platform empowers aqua farmers</p>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Sign Up & Set Up Your Farm", desc: "Create your account, add your farm details, and configure your preferences. It takes less than 2 minutes.", icon: Smartphone },
            { step: "2", title: "Monitor & Manage", desc: "Track water quality, get AI disease predictions, check live prices, manage crop cycles, and monitor expenses.", icon: Thermometer },
            { step: "3", title: "Grow & Profit", desc: "Sell your crop at the best prices, apply for loans, hire workers, and let AI agents automate your daily tasks.", icon: Leaf },
          ].map((item, i) => (
            <motion.div key={i} variants={fadeUp}>
              <Card className="h-full border-2 hover:border-primary/50 transition-colors group">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <span className="text-2xl font-bold text-primary">{item.step}</span>
                  </div>
                  <item.icon className="h-10 w-10 mx-auto mb-3 text-primary/60" />
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* All Features Grid */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection>
            <motion.div variants={fadeUp} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Everything You Need</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">16 powerful modules built specifically for Indian aqua farmers</p>
            </motion.div>
          </AnimatedSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feat, i) => (
              <AnimatedSection key={i}>
                <motion.div variants={scaleIn}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 group cursor-default overflow-hidden">
                    <CardContent className="p-5">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                        <feat.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-bold text-sm mb-1">{feat.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* For Farmers Section */}
      <AnimatedSection className="py-16 px-4 max-w-6xl mx-auto">
        <motion.div variants={fadeUp} className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Built for Indian Farmers</h2>
          <p className="text-muted-foreground">Available in multiple languages with voice support</p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-8">
          <motion.div variants={fadeUp}>
            <Card className="h-full bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6 space-y-4">
                <Globe className="h-10 w-10 text-primary" />
                <h3 className="text-xl font-bold">🌐 Multi-Language</h3>
                <p className="text-muted-foreground">Disease predictions, diagnosis results, and voice readouts available in:</p>
                <div className="flex flex-wrap gap-2">
                  {["Telugu తెలుగు", "Hindi हिन्दी", "Tamil தமிழ்", "Kannada ಕನ್ನಡ", "Bengali বাংলা", "English"].map(l => (
                    <span key={l} className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full font-medium">{l}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div variants={fadeUp}>
            <Card className="h-full bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
              <CardContent className="p-6 space-y-4">
                <MessageCircle className="h-10 w-10 text-green-600" />
                <h3 className="text-xl font-bold">📞 24/7 Support</h3>
                <p className="text-muted-foreground">Get help anytime through multiple channels:</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">📱 WhatsApp support chat</li>
                  <li className="flex items-center gap-2">📞 Direct call: 7569373499</li>
                  <li className="flex items-center gap-2">📧 Email support</li>
                  <li className="flex items-center gap-2">🤖 AI Assistant built into every page</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-950 via-blue-900 to-teal-900 relative overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
          style={{ backgroundImage: "radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%)", backgroundSize: "200% 200%" }}
        />
        <AnimatedSection className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <motion.div variants={fadeUp}>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Transform Your Farm?</h2>
            <p className="text-blue-200/80 text-lg mb-8">
              Join thousands of Indian aqua farmers already using GANGAPUTRA to increase their profits and reduce risks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate("/auth")}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-lg px-10 py-6 rounded-xl shadow-lg shadow-cyan-500/25"
              >
                Create Free Account <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </AnimatedSection>
      </section>

      {/* Footer */}
      <div className="py-6 text-center bg-background border-t">
        <p className="text-sm text-muted-foreground">© 2026 GANGAPUTRA — Built with ❤️ for Indian Aqua Farmers</p>
      </div>
    </div>
  );
};

export default Introduction;
