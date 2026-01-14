import { Button } from "@/components/ui/button";
import { ArrowRight, Fish, Droplets, Zap, BarChart3, TrendingUp, Users, ShieldCheck, Award, Waves, Thermometer, Play, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";
import heroVideo from "@/assets/hero-video.mp4";

// Animated Counter Component
const AnimatedCounter = ({ end, suffix = "", prefix = "", duration = 2000 }: { 
  end: number; 
  suffix?: string; 
  prefix?: string;
  duration?: number;
}) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          setIsVisible(true);
          hasAnimated.current = true;
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();

    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(end * easeOutQuart);
      
      setCount(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  // Parallax scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        if (rect.bottom > 0) {
          setScrollY(window.scrollY);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const stats = [
    { value: 10000, label: "Active Farmers", icon: Users, suffix: "+" },
    { value: 98, label: "Success Rate", icon: TrendingUp, suffix: "%" },
    { value: 24, label: "Support", icon: ShieldCheck, suffix: "/7" },
    { value: 50, label: "AI Features", icon: Award, suffix: "+" },
  ];

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background with Parallax */}
      <div 
        className="absolute inset-0 z-0"
        style={{ transform: `translateY(${scrollY * 0.4}px)` }}
      >
        <video
          ref={videoRef}
          autoPlay
          loop
          muted={isMuted}
          playsInline
          className="w-full h-[120%] object-cover"
          poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E"
        >
          <source src={heroVideo} type="video/mp4" />
        </video>
        {/* Dark Overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/70 to-primary/90"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/60 via-transparent to-primary/60"></div>
      </div>

      {/* Mute/Unmute Button */}
      <button
        onClick={toggleMute}
        className="absolute top-24 right-4 z-30 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
        aria-label={isMuted ? "Unmute video" : "Mute video"}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5 text-white" />
        ) : (
          <Volume2 className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Animated background elements with parallax */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div 
          className="absolute top-20 left-20 w-20 h-20 rounded-full bg-primary-glow/20 float-animation"
          style={{ transform: `translateY(${scrollY * 0.2}px)` }}
        ></div>
        <div 
          className="absolute top-40 right-32 w-16 h-16 rounded-full bg-accent/20 float-animation" 
          style={{ animationDelay: '1s', transform: `translateY(${scrollY * 0.15}px)` }}
        ></div>
        <div 
          className="absolute bottom-32 left-40 w-24 h-24 rounded-full bg-secondary/20 float-animation" 
          style={{ animationDelay: '2s', transform: `translateY(${scrollY * 0.1}px)` }}
        ></div>
        <div 
          className="absolute top-60 left-1/3 w-12 h-12 rounded-full bg-white/10 float-animation" 
          style={{ animationDelay: '0.5s', transform: `translateY(${scrollY * 0.25}px)` }}
        ></div>
        <div 
          className="absolute bottom-48 right-1/4 w-14 h-14 rounded-full bg-accent/15 float-animation" 
          style={{ animationDelay: '1.5s', transform: `translateY(${scrollY * 0.3}px)` }}
        ></div>
      </div>

      <div className="container mx-auto px-4 py-20 relative z-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content with Parallax */}
          <div 
            className="text-center lg:text-left"
            style={{ transform: `translateY(${scrollY * -0.1}px)` }}
          >
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-5 py-2.5 rounded-full mb-6 animate-fade-in border border-white/20">
              <Fish className="w-5 h-5 text-accent" />
              <span className="text-white font-semibold text-sm tracking-wide">India's #1 Smart Aqua Farming Platform</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-fade-in">
              <span className="text-gradient block mb-2">GANGAPUTRA</span>
              <span className="text-3xl lg:text-5xl font-medium opacity-95">The Future of</span>
              <br />
              <span className="text-3xl lg:text-5xl font-medium opacity-95">Aqua Farming</span>
            </h1>
            
            <p className="text-lg lg:text-xl text-white/90 mb-8 max-w-xl animate-fade-in leading-relaxed">
              Transform your aquaculture business with <span className="font-semibold text-accent">real-time IoT monitoring</span>, 
              <span className="font-semibold text-accent"> AI-powered disease detection</span>, live market prices, 
              and a complete farm-to-market ecosystem.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-in mb-10">
              <Button variant="hero" size="lg" className="group text-base px-8 py-6" onClick={handleGetStarted}>
                {user ? "Go to Dashboard" : "Start Your Farm Journey"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="sustainable" size="lg" className="text-base px-8 py-6" onClick={() => navigate("/aquapedia")}>
                Explore Aquapedia
              </Button>
            </div>

            {/* Animated Trust Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
              {stats.map((stat, index) => (
                <div key={index} className="text-center lg:text-left">
                  <div className="flex items-center gap-2 justify-center lg:justify-start mb-1">
                    <stat.icon className="w-4 h-4 text-accent" />
                    <span className="text-2xl font-bold text-white">
                      <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={2000 + index * 200} />
                    </span>
                  </div>
                  <span className="text-sm text-white/70">{stat.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Dashboard Preview with Parallax */}
          <div 
            className="relative animate-fade-in"
            style={{ transform: `translateY(${scrollY * 0.05}px)` }}
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-white/10 backdrop-blur-sm p-6">
              {/* Live Video Indicator */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-white font-medium">LIVE FARM VIEW</span>
                </div>
                <Play className="w-4 h-4 text-white/60" />
              </div>

              {/* Mock Dashboard */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/95 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="w-5 h-5 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Water Quality</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">Excellent</div>
                  <div className="text-xs text-gray-500 mt-1">pH 7.2 • DO 6.8 mg/L</div>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>

                <div className="bg-white/95 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <span className="text-sm font-medium text-gray-700">Growth Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">+2.3%</div>
                  <div className="text-xs text-gray-500 mt-1">Above average</div>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: '78%' }}></div>
                  </div>
                </div>

                <div className="bg-white/95 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Thermometer className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-medium text-gray-700">Temperature</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">28°C</div>
                  <div className="text-xs text-gray-500 mt-1">Optimal range</div>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: '70%' }}></div>
                  </div>
                </div>

                <div className="bg-white/95 rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Waves className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium text-gray-700">Salinity</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">15 ppt</div>
                  <div className="text-xs text-gray-500 mt-1">Perfect level</div>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                </div>
              </div>

              {/* Alert Banner */}
              <div className="mt-4 bg-green-500/20 border border-green-500/30 rounded-xl p-3 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-sm font-medium text-white">All Systems Healthy</div>
                  <div className="text-xs text-white/70">No disease alerts detected</div>
                </div>
              </div>
            </div>
            
            {/* Floating elements with enhanced parallax */}
            <div 
              className="absolute -top-3 -right-3 bg-white rounded-xl p-4 shadow-xl float-animation border border-gray-100"
              style={{ transform: `translateY(${scrollY * -0.15}px)` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Award className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-600">AI Score</span>
              </div>
              <div className="text-xl font-bold text-primary">98/100</div>
              <div className="text-xs text-gray-500 mt-1">Farm health</div>
            </div>
            
            <div 
              className="absolute -bottom-3 -left-3 bg-white rounded-xl p-4 shadow-xl float-animation border border-gray-100" 
              style={{ animationDelay: '1s', transform: `translateY(${scrollY * -0.2}px)` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-gray-600">Market Price</span>
              </div>
              <div className="text-xl font-bold text-green-600">₹485/kg</div>
              <div className="text-xs text-gray-500 mt-1">30 count • Live</div>
            </div>
          </div>
        </div>

        {/* Feature highlights - Enhanced with parallax */}
        <div 
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16 animate-fade-in"
          style={{ transform: `translateY(${scrollY * -0.05}px)` }}
        >
          {[
            { icon: Droplets, label: "Water Monitoring", value: "Real-time Sensors", description: "pH, DO, Temp & more" },
            { icon: Fish, label: "Disease Detection", value: "AI-Powered", description: "95% accuracy rate" },
            { icon: Zap, label: "Smart Automation", value: "IoT Control", description: "Aerators & feeders" },
            { icon: BarChart3, label: "Market Prices", value: "Live Updates", description: "All major markets" }
          ].map((feature, index) => (
            <div key={index} className="glass-card text-center p-5 hover:bg-white/15 transition-all duration-300 group cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <div className="text-sm text-white/70 mb-1">{feature.label}</div>
              <div className="font-bold text-white text-lg">{feature.value}</div>
              <div className="text-xs text-white/60 mt-1">{feature.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Wave animation at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-20 wave-animation opacity-30 z-10"></div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-3 bg-white/50 rounded-full animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
